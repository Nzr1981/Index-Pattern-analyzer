/**
 * Database module — wraps sql.js (pure WebAssembly SQLite, no native build needed).
 * Exposes a minimal API: get(), all(), run(), exec(), transaction(fn).
 * Data is persisted to disk after every write operation or transaction.
 */

import initSqlJs from "sql.js";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const dataDir = join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, "market_data.db");

let _db = null;

// ── Persistence ───────────────────────────────────────────────────────────────

export function persist() {
  const data = _db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// ── Reads (never persist) ─────────────────────────────────────────────────────

function normalise(obj) {
  if (!obj) return undefined;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === "bigint" ? Number(v) : v;
  }
  return out;
}

export function get(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  let row;
  if (stmt.step()) row = normalise(stmt.getAsObject());
  stmt.free();
  return row;
}

export function all(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(normalise(stmt.getAsObject()));
  stmt.free();
  return rows;
}

// ── Writes ────────────────────────────────────────────────────────────────────

/** Internal write — no persist (safe for use inside transaction callbacks). */
function _raw(sql, params = []) {
  _db.run(sql, params);
}

/** Single statement write + persist. */
export function run(sql, params = []) {
  _db.run(sql, params);
  persist();
}

/** DDL (multiple statements) + persist. */
export function exec(sql) {
  _db.run(sql);
  persist();
}

/**
 * Run a set of writes inside a BEGIN/COMMIT transaction.
 * The callback receives a `write(sql, params)` function that does NOT persist
 * individually — the whole batch persists once after COMMIT.
 *
 * @param {(write: (sql: string, params?: any[]) => void) => void} fn
 */
export function transaction(fn) {
  _db.run("BEGIN");
  try {
    fn(_raw);
    _db.run("COMMIT");
    persist();
  } catch (e) {
    _db.run("ROLLBACK");
    throw e;
  }
}

// ── Schema ────────────────────────────────────────────────────────────────────

export const MARKET_INFO = [
  { index_name: "Taiwan",    symbol: "^TWII",  timezone: "Asia/Taipei",      open_time: "09:00", close_time: "13:30" },
  { index_name: "Kospi",     symbol: "^KS11",  timezone: "Asia/Seoul",       open_time: "09:00", close_time: "15:30" },
  { index_name: "Hang Seng", symbol: "^HSI",   timezone: "Asia/Hong_Kong",   open_time: "09:30", close_time: "16:00" },
  { index_name: "Sensex",    symbol: "^BSESN", timezone: "Asia/Kolkata",     open_time: "09:15", close_time: "15:30" },
  { index_name: "DAX",       symbol: "^GDAXI", timezone: "Europe/Berlin",    open_time: "09:00", close_time: "17:30" },
  { index_name: "Dow Jones", symbol: "^DJI",   timezone: "America/New_York", open_time: "09:30", close_time: "16:00" },
];

export async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }

  // Schema
  _db.run(`
    CREATE TABLE IF NOT EXISTS daily_data (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT NOT NULL,
      day         TEXT NOT NULL,
      index_name  TEXT NOT NULL,
      open        REAL,
      close       REAL,
      open_last2  INTEGER,
      close_last2 INTEGER,
      b4_decimal  INTEGER,
      market_status TEXT DEFAULT 'closed',
      data_source   TEXT DEFAULT 'yahoo_finance',
      timestamp     TEXT DEFAULT (datetime('now')),
      UNIQUE(date, index_name)
    );
    CREATE TABLE IF NOT EXISTS market_info (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      index_name  TEXT UNIQUE NOT NULL,
      symbol      TEXT NOT NULL,
      timezone    TEXT NOT NULL,
      open_time   TEXT,
      close_time  TEXT,
      last_update TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_daily_date  ON daily_data(date);
    CREATE INDEX IF NOT EXISTS idx_daily_index ON daily_data(index_name);
  `);

  // Seed market_info
  for (const m of MARKET_INFO) {
    _db.run(
      `INSERT INTO market_info (index_name, symbol, timezone, open_time, close_time)
       VALUES (?,?,?,?,?)
       ON CONFLICT(index_name) DO UPDATE SET
         symbol=excluded.symbol, timezone=excluded.timezone,
         open_time=excluded.open_time, close_time=excluded.close_time`,
      [m.index_name, m.symbol, m.timezone, m.open_time, m.close_time]
    );
  }

  // Seed default settings
  for (const [key, value] of [
    ["auto_update", "true"],
    ["last_sync", null],
    ["preferred_timezone", "UTC"],
    ["refresh_interval", "3600"],
  ]) {
    _db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?,?)", [key, value]);
  }

  persist();
  console.log(`[db] Initialised — ${dbPath}`);
}

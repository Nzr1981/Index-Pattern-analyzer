/**
 * Data synchronisation service.
 * Downloads historical market data from Yahoo Finance into SQLite.
 * - Smart: only fetches dates newer than what's already stored.
 * - Safe: validates every record, retries on failure, never creates duplicates.
 */

import YahooFinance from "yahoo-finance2";
import { get, run, transaction } from "./db.js";

const yf = new YahooFinance();

export const INDEXES = {
  Taiwan:      "^TWII",
  Kospi:       "^KS11",
  "Hang Seng": "^HSI",
  Sensex:      "^BSESN",
  DAX:         "^GDAXI",
  "Dow Jones": "^DJI",
};

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function dayName(dateStr) {
  return DAY_NAMES[new Date(dateStr + "T12:00:00Z").getUTCDay()];
}

function derived(open, close) {
  return [
    Math.floor(open  % 100),   // open_last2
    Math.floor(close % 100),   // close_last2
    Math.floor(open  * 10) % 10, // b4_decimal
  ];
}

function toDateStr(v) {
  if (v instanceof Date) return v.toISOString().split("T")[0];
  return String(v).split("T")[0];
}

function isValid(row) {
  return row &&
    typeof row.open  === "number" && row.open  > 0 &&
    typeof row.close === "number" && row.close > 0;
}

function getLatestDate(indexName) {
  const row = get("SELECT MAX(date) as d FROM daily_data WHERE index_name = ?", [indexName]);
  return row?.d ?? null;
}

// ── Fetch with retry ──────────────────────────────────────────────────────────

async function fetchHistory(symbol, period1, period2) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const history = await yf.historical(symbol, { period1, period2 });
      return history ?? [];
    } catch (err) {
      console.error(`[dataSync] Yahoo Finance error (attempt ${attempt}/3): ${err.message}`);
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  return [];
}

// ── Sync one index ─────────────────────────────────────────────────────────────

const INSERT_SQL = `
  INSERT OR IGNORE INTO daily_data
    (date, day, index_name, open, close, open_last2, close_last2, b4_decimal, data_source)
  VALUES (?,?,?,?,?,?,?,?,?)
`;

async function syncIndex(indexName, period1, period2) {
  const symbol  = INDEXES[indexName];
  const history = await fetchHistory(symbol, period1, period2);

  if (!history.length) return 0;

  // Build validated records
  const records = [];
  for (const row of history) {
    if (!isValid(row)) {
      console.warn(`[dataSync] ${indexName}: skipping invalid row`);
      continue;
    }
    const dateStr = toDateStr(row.date);
    const [ol2, cl2, b4] = derived(row.open, row.close);
    records.push([dateStr, dayName(dateStr), indexName, row.open, row.close, ol2, cl2, b4, "yahoo_finance"]);
  }

  if (!records.length) return 0;

  // Bulk insert inside a single transaction (one persist at the end)
  transaction((write) => {
    for (const params of records) {
      write(INSERT_SQL, params);
    }
  });

  // Update last_update for this index's market_info row
  run("UPDATE market_info SET last_update=? WHERE index_name=?", [
    new Date().toISOString(), indexName,
  ]);

  return records.length;
}

// ── Public API ─────────────────────────────────────────────────────────────────

let syncRunning = false;

export async function syncAll(daysBack = 365) {
  if (syncRunning) {
    console.log("[dataSync] Already running — skipping");
    return 0;
  }

  syncRunning = true;
  const now    = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  console.log(`[dataSync] Starting sync — ${Object.keys(INDEXES).length} indexes, ${daysBack} days`);

  let total = 0;

  for (const indexName of Object.keys(INDEXES)) {
    const latest = getLatestDate(indexName);
    let from = new Date(cutoff);

    if (latest) {
      const next = new Date(latest);
      next.setDate(next.getDate() + 1);
      if (next > from) from = next;
    }

    if (from >= now) {
      console.log(`[dataSync] ${indexName}: up to date (${latest})`);
      continue;
    }

    console.log(`[dataSync] ${indexName}: ${from.toISOString().split("T")[0]} → today`);

    try {
      const n = await syncIndex(indexName, from, now);
      console.log(`[dataSync] ${indexName}: stored ${n} records`);
      total += n;
    } catch (err) {
      console.error(`[dataSync] ${indexName}: sync failed — ${err.message}`);
    }

    // Polite delay between indexes
    await new Promise(r => setTimeout(r, 700));
  }

  run("UPDATE settings SET value=? WHERE key='last_sync'", [now.toISOString()]);
  syncRunning = false;
  console.log(`[dataSync] ✅ Sync complete — ${total} total new records`);
  return total;
}

export function isSyncRunning() {
  return syncRunning;
}

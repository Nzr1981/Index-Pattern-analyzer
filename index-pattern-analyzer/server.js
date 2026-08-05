import express from "express";
import cors from "cors";
import YahooFinance from "yahoo-finance2";
import { initDb, get, all, run } from "./db.js";
import { syncAll, isSyncRunning } from "./dataSync.js";

// ── Initialise DB (must complete before serving) ──────────────────────────────
await initDb();

const yahooFinance = new YahooFinance();
const app = express();
app.use(cors());
app.use(express.json());

// ── Existing endpoint (kept exactly as before) ────────────────────────────────

const indexSymbols = {
  Taiwan:      "^TWII",
  Kospi:       "^KS11",
  "Hang Seng": "^HSI",
  Sensex:      "^BSESN",
  DAX:         "^GDAXI",
  "Dow Jones": "^DJI",
};

app.get("/api/index", async (req, res) => {
  try {
    const { indexName, date } = req.query;
    console.log("Request:", req.query);

    const symbol = indexSymbols[indexName];
    if (!symbol) return res.status(400).json({ error: "Invalid index name" });

    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 1);

    const history = await yahooFinance.historical(symbol, { period1: start, period2: end });
    console.log("History:", history);

    if (!history || history.length === 0) {
      return res.json({ open: "--", b4: "--", close: "--", date });
    }

    const row = history[0];
    res.json({
      open:  Math.floor(row.open  % 100),
      b4:    Math.floor(row.open  * 10) % 10,
      close: Math.floor(row.close % 100),
      date,
    });
  } catch (err) {
    console.log("============== ERROR ==============");
    console.log(err);
    console.log("Message:", err.message);
    console.log("Stack:", err.stack);
    console.log("===================================");
    res.status(500).json({ error: err.message, open: "--", b4: "--", close: "--", date: "--" });
  }
});

// ── Dashboard stats ───────────────────────────────────────────────────────────

app.get("/api/stats", (req, res) => {
  try {
    const totalRecords  = get("SELECT COUNT(*) as n FROM daily_data")?.n ?? 0;
    const totalIndexes  = get("SELECT COUNT(DISTINCT index_name) as n FROM daily_data")?.n ?? 0;
    const lastSync      = get("SELECT value FROM settings WHERE key='last_sync'")?.value ?? null;
    const autoUpdate    = get("SELECT value FROM settings WHERE key='auto_update'")?.value === "true";
    const marketInfo    = all("SELECT * FROM market_info ORDER BY index_name");

    res.json({
      totalRecords,
      totalIndexes,
      lastSync,
      autoUpdate,
      syncRunning: isSyncRunning(),
      marketInfo,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Daily data (paginated, filterable, sortable) ──────────────────────────────

app.get("/api/daily-data", (req, res) => {
  try {
    const {
      page    = "1",
      limit   = "20",
      search  = "",
      index   = "",
      sortBy  = "date",
      sortDir = "desc",
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * pageSize;

    const SAFE_COLS = new Set(["date","day","index_name","open_last2","close_last2","b4_decimal","open","close"]);
    const col = SAFE_COLS.has(sortBy) ? sortBy : "date";
    const dir = sortDir === "asc" ? "ASC" : "DESC";

    const conditions = [];
    const params     = [];

    if (search) {
      conditions.push("(date LIKE ? OR day LIKE ? OR index_name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (index) {
      conditions.push("index_name = ?");
      params.push(index);
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const total = get(`SELECT COUNT(*) as n FROM daily_data ${where}`, params)?.n ?? 0;
    const rows  = all(
      `SELECT date, day, index_name, open, close, open_last2, close_last2, b4_decimal, timestamp
       FROM daily_data ${where}
       ORDER BY ${col} ${dir}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({ rows, total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Weekly data ───────────────────────────────────────────────────────────────

app.get("/api/weekly-data", (req, res) => {
  try {
    const { index = "", year = "", search = "" } = req.query;

    const conditions = [];
    const params     = [];

    if (index)  { conditions.push("index_name = ?");                    params.push(index); }
    if (year)   { conditions.push("strftime('%Y', date) = ?");          params.push(year);  }
    if (search) { conditions.push("(index_name LIKE ? OR date LIKE ?)");params.push(`%${search}%`, `%${search}%`); }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const rows = all(`
      SELECT
        strftime('%Y', date)    AS year,
        strftime('%W', date)    AS week,
        index_name,
        COUNT(*)                AS trading_days,
        MIN(date)               AS week_start,
        MAX(date)               AS week_end,
        ROUND(AVG(open_last2),  1) AS avg_open,
        ROUND(AVG(close_last2), 1) AS avg_close,
        ROUND(AVG(b4_decimal),  1) AS avg_b4
      FROM daily_data ${where}
      GROUP BY year, week, index_name
      ORDER BY year DESC, week DESC, index_name
    `, params);

    // Also return available years and indexes for filter dropdowns
    const years   = all("SELECT DISTINCT strftime('%Y', date) as y FROM daily_data ORDER BY y DESC").map(r => r.y);
    const indexes = all("SELECT DISTINCT index_name FROM daily_data ORDER BY index_name").map(r => r.index_name);

    res.json({ rows, years, indexes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Market status (per-index open/closed) ─────────────────────────────────────

app.get("/api/market-status", (req, res) => {
  try {
    const marketInfo = all("SELECT * FROM market_info ORDER BY index_name");
    const now = new Date();

    const statuses = marketInfo.map(m => {
      let status = "Closed";
      try {
        // Determine local time in the market's timezone
        const localTime = new Intl.DateTimeFormat("en-US", {
          timeZone: m.timezone,
          hour: "2-digit", minute: "2-digit",
          hour12: false,
          weekday: "short",
        }).formatToParts(now);

        const parts = Object.fromEntries(localTime.map(p => [p.type, p.value]));
        const hhmm  = `${parts.hour}:${parts.minute}`;
        const isWeekday = !["Sat","Sun"].includes(parts.weekday);

        if (isWeekday && hhmm >= m.open_time && hhmm <= m.close_time) {
          status = "Open";
        }
      } catch (_) {
        // timezone not supported — leave as Closed
      }

      return { ...m, status };
    });

    res.json({ statuses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Manual refresh ────────────────────────────────────────────────────────────

app.post("/api/refresh", async (req, res) => {
  if (isSyncRunning()) {
    return res.json({ success: true, message: "Sync already in progress", newRecords: 0 });
  }
  try {
    // Fire and don't await — return immediately so the UI can poll
    syncAll(365).catch(err => console.error("[refresh] sync error:", err.message));
    res.json({ success: true, message: "Sync started", newRecords: null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Filter options ────────────────────────────────────────────────────────────

app.get("/api/filter-options", (req, res) => {
  try {
    const indexes = all("SELECT DISTINCT index_name FROM daily_data ORDER BY index_name").map(r => r.index_name);
    const years   = all("SELECT DISTINCT strftime('%Y', date) as y FROM daily_data ORDER BY y DESC").map(r => r.y);
    res.json({ indexes, years });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────

app.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");

  // Background data sync on startup
  console.log("[startup] Triggering background historical data sync…");
  syncAll(365).catch(err => console.error("[startup sync] Error:", err.message));
});

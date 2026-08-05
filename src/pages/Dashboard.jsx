import { useState, useEffect } from "react";
import { predictNumbers } from "../services/predictionEngine";
import { getIndexData } from "../services/yahooFinance";

// ── Stats bar ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        padding: "14px 18px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
        flex: 1,
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#1e3a8a" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function StatsRow() {
  const [stats, setStats]   = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg]       = useState("");

  const loadStats = () => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  };

  useEffect(() => {
    loadStats();
    const id = setInterval(loadStats, 15000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = async () => {
    setSyncing(true);
    setMsg("Sync started…");
    try {
      await fetch("/api/refresh", { method: "POST" });
      setMsg("Syncing in background — data will update shortly.");
      setTimeout(() => { loadStats(); setMsg(""); setSyncing(false); }, 8000);
    } catch {
      setMsg("Refresh failed.");
      setSyncing(false);
    }
  };

  const lastSync = stats?.lastSync
    ? new Date(stats.lastSync).toLocaleString()
    : "Never";

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Stats cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <StatCard label="Total Records"     value={stats ? stats.totalRecords.toLocaleString() : "—"} />
        <StatCard label="Indexes Tracked"   value={stats ? stats.totalIndexes : "—"} />
        <StatCard label="Last Sync"         value={lastSync} />
        <StatCard
          label="Sync Status"
          value={stats?.syncRunning ? "🔄 Running" : "✅ Idle"}
        />
        <StatCard
          label="Auto-Update"
          value={stats?.autoUpdate ? "Enabled" : "Disabled"}
        />
      </div>

      {/* Refresh button + feedback */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={handleRefresh}
          disabled={syncing || stats?.syncRunning}
          style={{
            padding: "8px 18px",
            background: syncing ? "#9ca3af" : "#1e3a8a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: syncing ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {syncing ? "Syncing…" : "🔄 Refresh Data"}
        </button>
        {msg && <span style={{ fontSize: 13, color: "#6b7280" }}>{msg}</span>}
      </div>
    </div>
  );
}

// ── Market Status ─────────────────────────────────────────────────────────────

function MarketStatus() {
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    fetch("/api/market-status")
      .then(r => r.json())
      .then(d => setStatuses(d.statuses ?? []))
      .catch(() => {});
  }, []);

  if (!statuses.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 14, color: "#374151", marginBottom: 10 }}>Market Status</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {statuses.map(m => (
          <div
            key={m.index_name}
            style={{
              background: m.status === "Open" ? "#dcfce7" : "#f3f4f6",
              border: `1px solid ${m.status === "Open" ? "#86efac" : "#e5e7eb"}`,
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
            }}
          >
            <span style={{ fontWeight: 600, color: m.status === "Open" ? "#15803d" : "#6b7280" }}>
              {m.index_name}
            </span>
            <span style={{ marginLeft: 6, color: m.status === "Open" ? "#16a34a" : "#9ca3af" }}>
              {m.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Original lookup tool (kept intact) ────────────────────────────────────────

export default function Dashboard() {
  const today = new Date().toISOString().split("T")[0];

  const [indexName, setIndexName] = useState("Taiwan");
  const [open, setOpen]           = useState("");
  const [b4, setB4]               = useState("");
  const [prediction, setPrediction] = useState("--");
  const [close, setClose]         = useState("");
  const [date, setDate]           = useState(today);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getIndexData(indexName, date);
        setOpen(data.open);
        setB4(data.b4);
        setClose(data.close);
      } catch (err) {
        console.error(err);
        setOpen("--");
        setB4("--");
        setClose("--");
      }
    }
    loadData();
  }, [indexName, date]);

  useEffect(() => {
    if (open !== "" && open !== "--" && b4 !== "" && b4 !== "--") {
      const result = predictNumbers(open, b4);
      setPrediction(result.length === 0 ? "--" : result.join(" | "));
    } else {
      setPrediction("--");
    }
  }, [open, b4]);

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "15px",
    textAlign: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  };

  return (
    <div style={{ padding: "30px", background: "#f5f7fb", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", color: "#1e3a8a", marginBottom: "24px" }}>
        INDEX GAME ANALYZER
      </h1>

      {/* ── New: stats & market status ── */}
      <StatsRow />
      <MarketStatus />

      {/* ── Divider ── */}
      <div style={{ borderTop: "1px solid #e5e7eb", marginBottom: 24 }} />

      {/* ── Original: live lookup ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <div style={cardStyle}>
          <h3>Open</h3>
          <h2>{open}</h2>
        </div>

        <div style={cardStyle}>
          <h3>B4 Decimal</h3>
          <h2>{b4}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Prediction</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
            {prediction === "--"
              ? "--"
              : prediction.split(" | ").map((num, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      padding: "10px",
                      borderRadius: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    {num}
                  </div>
                ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h3>Close</h3>
          <h2>{close}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Date</h3>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: "10px" }}
          />
        </div>
      </div>

      <div style={{ maxWidth: "450px", margin: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        <label>Select Index</label>
        <select
          value={indexName}
          onChange={(e) => setIndexName(e.target.value)}
          style={{ padding: "10px" }}
        >
          <option>Taiwan</option>
          <option>Kospi</option>
          <option>Hang Seng</option>
          <option>Sensex</option>
          <option>DAX</option>
          <option>Dow Jones</option>
        </select>

        <label>Open Number</label>
        <input type="number" value={open}  onChange={(e) => setOpen(e.target.value)} />

        <label>B4 Decimal</label>
        <input type="number" value={b4}    onChange={(e) => setB4(e.target.value)} />

        <label>Close Number</label>
        <input type="number" value={close} onChange={(e) => setClose(e.target.value)} />
      </div>
    </div>
  );
}

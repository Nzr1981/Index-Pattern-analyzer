import { useState, useEffect, useCallback } from "react";

const th = {
  padding: "10px 14px",
  background: "#1e3a8a",
  color: "#fff",
  textAlign: "left",
  fontWeight: 600,
  fontSize: 13,
  whiteSpace: "nowrap",
};

const td = {
  padding: "9px 14px",
  fontSize: 13,
  borderBottom: "1px solid #f0f0f0",
  whiteSpace: "nowrap",
};

export default function WeeklyData() {
  const [rows, setRows]       = useState([]);
  const [years, setYears]     = useState([]);
  const [indexes, setIndexes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [selectedIndex, setSelectedIndex] = useState("");
  const [selectedYear, setSelectedYear]   = useState("");
  const [search, setSearch]               = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ index: selectedIndex, year: selectedYear, search });
      const res  = await fetch(`/api/weekly-data?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRows(data.rows ?? []);
      setYears(data.years ?? []);
      setIndexes(data.indexes ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedIndex, selectedYear, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group rows by year + week for display
  const grouped = groupByWeek(rows);

  return (
    <div style={{ padding: 24, background: "#f5f7fb", minHeight: "100vh" }}>
      <h1 style={{ color: "#1e3a8a", marginBottom: 4 }}>Weekly Data</h1>
      <p style={{ color: "#6b7280", marginBottom: 20, fontSize: 14 }}>
        Weekly summaries automatically aggregated from daily records.
      </p>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Search index or date…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, width: 200 }}
        />

        <select
          value={selectedIndex}
          onChange={e => setSelectedIndex(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
        >
          <option value="">All Indexes</option>
          {indexes.map(i => <option key={i}>{i}</option>)}
        </select>

        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
        >
          <option value="">All Years</option>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>

        <button
          onClick={() => { setSearch(""); setSelectedIndex(""); setSelectedYear(""); }}
          style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 13 }}
        >
          Clear
        </button>

        <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: 13 }}>
          {rows.length} week-index combinations
        </span>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#6b7280", background: "#fff", borderRadius: 10 }}>
          No weekly data yet — historical records must be downloaded first.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {grouped.map(({ weekKey, label, entries }) => (
            <WeekBlock key={weekKey} label={label} entries={entries} />
          ))}
        </div>
      )}
    </div>
  );
}

function WeekBlock({ label, entries }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.08)", overflow: "hidden" }}>
      <div style={{ background: "#f0f4ff", padding: "10px 16px", borderBottom: "1px solid #e0e7ff" }}>
        <span style={{ fontWeight: 700, color: "#1e3a8a", fontSize: 14 }}>{label}</span>
        <span style={{ color: "#6b7280", fontSize: 12, marginLeft: 10 }}>
          {entries[0]?.week_start} → {entries[entries.length - 1]?.week_end}
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Index</th>
              <th style={th}>Trading Days</th>
              <th style={th}>Week Start</th>
              <th style={th}>Week End</th>
              <th style={{ ...th, textAlign: "center" }}>Avg Open (L2)</th>
              <th style={{ ...th, textAlign: "center" }}>Avg B4</th>
              <th style={{ ...th, textAlign: "center" }}>Avg Close (L2)</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{ ...td, fontWeight: 600 }}>{row.index_name}</td>
                <td style={td}>{row.trading_days}</td>
                <td style={td}>{row.week_start}</td>
                <td style={td}>{row.week_end}</td>
                <td style={{ ...td, textAlign: "center", fontWeight: 700, color: "#1e3a8a" }}>{row.avg_open ?? "—"}</td>
                <td style={{ ...td, textAlign: "center", fontWeight: 700, color: "#7c3aed" }}>{row.avg_b4 ?? "—"}</td>
                <td style={{ ...td, textAlign: "center", fontWeight: 700, color: "#0369a1" }}>{row.avg_close ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function groupByWeek(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.year}-${row.week}`;
    if (!map.has(key)) {
      map.set(key, {
        weekKey: key,
        label: `${row.year} — Week ${row.week}`,
        entries: [],
      });
    }
    map.get(key).entries.push(row);
  }
  return Array.from(map.values());
}

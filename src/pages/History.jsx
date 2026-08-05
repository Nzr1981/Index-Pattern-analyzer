import { useState, useEffect, useCallback } from "react";

const INDEXES = ["Taiwan", "Kospi", "Hang Seng", "Sensex", "DAX", "Dow Jones"];

const th = {
  padding: "10px 14px",
  background: "#374151",
  color: "#fff",
  textAlign: "left",
  fontWeight: 600,
  fontSize: 13,
  whiteSpace: "nowrap",
  cursor: "pointer",
  userSelect: "none",
};

const td = {
  padding: "9px 14px",
  fontSize: 13,
  borderBottom: "1px solid #f0f0f0",
  whiteSpace: "nowrap",
};

export default function History() {
  const [rows, setRows]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const [search, setSearch]     = useState("");
  const [index, setIndex]       = useState("");
  const [sortBy, setSortBy]     = useState("date");
  const [sortDir, setSortDir]   = useState("desc");
  const [page, setPage]         = useState(1);
  const LIMIT = 25;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: LIMIT, search, index, sortBy, sortDir });
      const res  = await fetch(`/api/daily-data?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRows(data.rows ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, index, sortBy, sortDir]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, index, sortBy, sortDir]);

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  function SortIcon({ col }) {
    if (sortBy !== col) return <span style={{ opacity: 0.4 }}> ↕</span>;
    return <span>{sortDir === "asc" ? " ↑" : " ↓"}</span>;
  }

  const col = (label, field) => (
    <th style={th} onClick={() => toggleSort(field)}>
      {label}<SortIcon col={field} />
    </th>
  );

  return (
    <div style={{ padding: 24, background: "#f5f7fb", minHeight: "100vh" }}>
      <h1 style={{ color: "#1e3a8a", marginBottom: 4 }}>History</h1>
      <p style={{ color: "#6b7280", marginBottom: 20, fontSize: 14 }}>
        Complete historical record — {total.toLocaleString()} entries across all indexes.
      </p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Search date, day, index…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, width: 220 }}
        />

        <select
          value={index}
          onChange={e => setIndex(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
        >
          <option value="">All Indexes</option>
          {INDEXES.map(i => <option key={i}>{i}</option>)}
        </select>

        <button
          onClick={() => { setSearch(""); setIndex(""); setSortBy("date"); setSortDir("desc"); setPage(1); }}
          style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 13 }}
        >
          Clear
        </button>

        <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: 13 }}>
          Page {page} of {totalPages} ({total.toLocaleString()} records)
        </span>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ overflowX: "auto", background: "#fff", borderRadius: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {col("Date",         "date")}
              {col("Day",          "day")}
              {col("Index",        "index_name")}
              {col("Open (L2)",    "open_last2")}
              {col("B4",           "b4_decimal")}
              {col("Close (L2)",   "close_last2")}
              {col("Full Open",    "open")}
              {col("Full Close",   "close")}
              <th style={th}>Source</th>
              <th style={th}>Recorded</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ ...td, textAlign: "center", padding: 32, color: "#6b7280" }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ ...td, textAlign: "center", padding: 32, color: "#6b7280" }}>
                  {total === 0
                    ? "No historical data yet. Download it from the Dashboard."
                    : "No matching records found."}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={td}>{row.date}</td>
                  <td style={td}>{row.day}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{row.index_name}</td>
                  <td style={{ ...td, textAlign: "center", fontWeight: 700, color: "#1e3a8a" }}>{row.open_last2 ?? "—"}</td>
                  <td style={{ ...td, textAlign: "center", fontWeight: 700, color: "#7c3aed" }}>{row.b4_decimal ?? "—"}</td>
                  <td style={{ ...td, textAlign: "center", fontWeight: 700, color: "#0369a1" }}>{row.close_last2 ?? "—"}</td>
                  <td style={{ ...td, textAlign: "right", color: "#6b7280" }}>{row.open?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}</td>
                  <td style={{ ...td, textAlign: "right", color: "#6b7280" }}>{row.close?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}</td>
                  <td style={{ ...td, color: "#9ca3af", fontSize: 12 }}>{row.data_source ?? "—"}</td>
                  <td style={{ ...td, color: "#9ca3af", fontSize: 12 }}>
                    {row.timestamp ? new Date(row.timestamp).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
          <Pgbtn onClick={() => setPage(1)}          disabled={page === 1}>«</Pgbtn>
          <Pgbtn onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</Pgbtn>
          {pageRange(page, totalPages).map(p => (
            <Pgbtn key={p} onClick={() => setPage(p)} active={p === page}>{p}</Pgbtn>
          ))}
          <Pgbtn onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</Pgbtn>
          <Pgbtn onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</Pgbtn>
        </div>
      )}
    </div>
  );
}

function Pgbtn({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "6px 12px",
        border: "1px solid #d1d5db",
        borderRadius: 4,
        background: active ? "#1e3a8a" : disabled ? "#f3f4f6" : "#fff",
        color: active ? "#fff" : disabled ? "#9ca3af" : "#374151",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: active ? 700 : 400,
        fontSize: 13,
      }}
    >
      {children}
    </button>
  );
}

function pageRange(current, total) {
  const delta = 2;
  const range = [];
  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
    range.push(i);
  }
  return range;
}

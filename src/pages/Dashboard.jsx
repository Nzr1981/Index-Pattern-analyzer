import { useState, useEffect } from "react";
import { predictNumbers } from "../services/predictionEngine";
import { getIndexData } from "../services/yahooFinance";

export default function Dashboard() {
  const today = new Date().toISOString().split("T")[0];

  const [indexName, setIndexName] = useState("Taiwan");
  const [open, setOpen] = useState("");
  const [b4, setB4] = useState("");
  const [prediction, setPrediction] = useState("--");
  const [close, setClose] = useState("");
  const [date, setDate] = useState(today);

  // Load data from backend
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

  // Prediction
  useEffect(() => {
    if (open !== "" && open !== "--" && b4 !== "" && b4 !== "--") {
      const result = predictNumbers(open, b4);

      if (result.length === 0) {
        setPrediction("--");
      } else {
        setPrediction(result.join(" | "));
      }
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
    <div
      style={{
        padding: "30px",
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          color: "#1e3a8a",
          marginBottom: "30px",
        }}
      >
        INDEX GAME ANALYZER
      </h1>

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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "8px",
            }}
          >
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
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px",
            }}
          />
        </div>
      </div>

      <div
        style={{
          maxWidth: "450px",
          margin: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
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

        <input
          type="number"
          value={open}
          onChange={(e) => setOpen(e.target.value)}
        />

        <label>B4 Decimal</label>

        <input
          type="number"
          value={b4}
          onChange={(e) => setB4(e.target.value)}
        />

        <label>Close Number</label>

        <input
          type="number"
          value={close}
          onChange={(e) => setClose(e.target.value)}
        />
      </div>
    </div>
  );
}
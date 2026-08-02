import { useState } from "react";

export default function Prediction() {
  const predictions = [
    59, 65, 99, 69, 29,
    92, 95, 56, 49, 94,
    19, 24, 42, 53, 83,
    17, 70, 31, 88, 46
  ];

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ color: "#233f91" }}>
        INDEX GAME PREDICTION
      </h1>

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,.2)"
        }}
      >
        <h2>Today's Predictions</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: "15px",
            marginTop: "20px"
          }}
        >
          {predictions.map((num, index) => (
            <div
              key={index}
              style={{
                padding: "20px",
                background: "#233f91",
                color: "white",
                textAlign: "center",
                borderRadius: "8px",
                fontSize: "24px",
                fontWeight: "bold"
              }}
            >
              {num}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
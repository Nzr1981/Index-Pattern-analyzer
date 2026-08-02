import { useState } from "react";

export default function DailyData() {
  const [rows, setRows] = useState([
    {
      date: "",
      day: "",
      taiwanOpen: "",
      taiwanB4: "",
      taiwanClose: "",
      kospiOpen: "",
      kospiB4: "",
      kospiClose: "",
      hangOpen: "",
      hangB4: "",
      hangClose: "",
      sensexOpen: "",
      sensexB4: "",
      sensexClose: "",
      daxOpen: "",
      daxB4: "",
      daxClose: "",
      dowOpen: "",
      dowB4: "",
      dowClose: "",
    },
  ]);

  const handleChange = (index, field, value) => {
    const data = [...rows];
    data[index][field] = value;
    setRows(data);
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        date: "",
        day: "",
        taiwanOpen: "",
        taiwanB4: "",
        taiwanClose: "",
        kospiOpen: "",
        kospiB4: "",
        kospiClose: "",
        hangOpen: "",
        hangB4: "",
        hangClose: "",
        sensexOpen: "",
        sensexB4: "",
        sensexClose: "",
        daxOpen: "",
        daxB4: "",
        daxClose: "",
        dowOpen: "",
        dowB4: "",
        dowClose: "",
      },
    ]);
  };

  return (
    <div className="main" style={{ padding: 20 }}>
      <h1>Daily Data</h1>

      <div style={{ overflowX: "auto" }}>
        <table
          border="1"
          cellPadding="8"
          style={{
            borderCollapse: "collapse",
            width: "100%",
            textAlign: "center",
          }}
        >
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>

              <th>TW Open</th>
              <th>B4</th>
              <th>Close</th>

              <th>KS Open</th>
              <th>B4</th>
              <th>Close</th>

              <th>HS Open</th>
              <th>B4</th>
              <th>Close</th>

              <th>SX Open</th>
              <th>B4</th>
              <th>Close</th>

              <th>DAX Open</th>
              <th>B4</th>
              <th>Close</th>

              <th>DJ Open</th>
              <th>B4</th>
              <th>Close</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {Object.keys(row).map((field) => (
                  <td key={field}>
                    <input
                      value={row[field]}
                      onChange={(e) =>
                        handleChange(i, field, e.target.value)
                      }
                      style={{ width: "70px" }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <br />

      <button onClick={addRow}>+ Add New Day</button>
    </div>
  );
}
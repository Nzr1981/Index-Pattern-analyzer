import express from "express";
import cors from "cors";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

const app = express();

app.use(cors());

const indexes = {
  Taiwan: "^TWII",
  Kospi: "^KS11",
  "Hang Seng": "^HSI",
  Sensex: "^BSESN",
  DAX: "^GDAXI",
  "Dow Jones": "^DJI",
};

app.get("/api/index", async (req, res) => {
  try {
    const { indexName, date } = req.query;

    console.log("Request:", req.query);

    const symbol = indexes[indexName];

    if (!symbol) {
      return res.status(400).json({
        error: "Invalid index name",
      });
    }

    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    const history = await yahooFinance.historical(symbol, {
      period1: start,
      period2: end,
    });

    console.log("History:", history);

    if (!history || history.length === 0) {
      return res.json({
        open: "--",
        b4: "--",
        close: "--",
        date,
      });
    }

    const row = history[0];

    res.json({
      open: Math.floor(row.open % 100),
      b4: Math.floor(row.open * 10) % 10,
      close: Math.floor(row.close % 100),
      date,
    });

  } catch (err) {
    console.log("============== ERROR ==============");
    console.log(err);
    console.log("Message:", err.message);
    console.log("Stack:", err.stack);
    console.log("===================================");

    res.status(500).json({
      error: err.message,
      open: "--",
      b4: "--",
      close: "--",
      date: "--",
    });
  }
});

app.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");
});
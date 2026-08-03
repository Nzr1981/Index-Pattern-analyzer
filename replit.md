# Index Game Analyzer

A React + Vite frontend with an Express backend that fetches stock market index data from Yahoo Finance and displays open/close patterns and predictions.

## Stack

- **Frontend**: React 19, Vite 8, React Router 7 — served on port 5000
- **Backend**: Express 5, yahoo-finance2 — API server on port 3001

## How to run

Two workflows must both be running:

1. **Backend API** — `node index-pattern-analyzer/server.js`  
   Starts the Express server on port 3001. Fetches historical data from Yahoo Finance.

2. **Start application** — `npm run dev`  
   Starts the Vite dev server on port 5000. Proxies `/api/*` requests to the backend.

## Project structure

```
src/
  pages/        # Dashboard, DailyData, WeeklyData, History, Prediction
  components/   # Header, Sidebar
  services/     # yahooFinance.js — API client
index-pattern-analyzer/
  server.js     # Express API server
```

## Notes

- Vite is configured to proxy `/api` → `http://localhost:3001` so the frontend uses relative URLs.
- The backend uses yahoo-finance2 which requires Node ≥ 22; it works on Node 20 with a warning.

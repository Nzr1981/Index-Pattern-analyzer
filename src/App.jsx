import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import DailyData from "./pages/DailyData";
import WeeklyData from "./pages/WeeklyData";
import Prediction from "./pages/Prediction";
import History from "./pages/History";

export default function App() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Routes>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/daily"       element={<DailyData />} />
          <Route path="/weekly"      element={<WeeklyData />} />
          <Route path="/prediction"  element={<Prediction />} />
          <Route path="/history"     element={<History />} />
        </Routes>
      </div>
    </div>
  );
}

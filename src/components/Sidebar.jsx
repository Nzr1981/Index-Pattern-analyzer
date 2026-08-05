import { NavLink } from "react-router-dom";

const links = [
  { to: "/",           icon: "🏠", label: "Dashboard"   },
  { to: "/daily",      icon: "📅", label: "Daily Data"  },
  { to: "/weekly",     icon: "📊", label: "Weekly Data" },
  { to: "/prediction", icon: "🎯", label: "Prediction"  },
  { to: "/history",    icon: "📜", label: "History"     },
];

export default function Sidebar() {
  return (
    <div
      style={{
        width: 200,
        minHeight: "100vh",
        background: "#1e3a8a",
        color: "#fff",
        padding: "20px 0",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "0 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>INDEX GAME</h2>
      </div>

      <nav style={{ paddingTop: 12 }}>
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 20px",
              color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
              background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
              textDecoration: "none",
              fontWeight: isActive ? 600 : 400,
              borderLeft: isActive ? "3px solid #60a5fa" : "3px solid transparent",
              transition: "all 0.15s",
            })}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

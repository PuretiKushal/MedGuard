import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const links = [
  { to: "/facility/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/facility/inventory", label: "Inventory", icon: "≡" },
  { to: "/facility/invoice", label: "Invoice Upload", icon: "↑" },
  { to: "/facility/alerts", label: "Alerts & Reports", icon: "◉" },
  { to: "/facility/intelligence", label: "Intelligence", icon: "◈" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-56 min-h-screen bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-critical rounded flex items-center justify-center text-white text-xs font-bold font-mono">M</div>
          <div>
            <div className="text-sm font-semibold text-text-primary">MedGuard</div>
            <div className="text-xs text-text-muted font-mono">Facility Portal</div>
          </div>
        </div>
      </div>

      {/* Facility info */}
      <div className="px-4 py-3 border-b border-border">
        <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-1">Logged in as</div>
        <div className="text-xs text-text-secondary font-mono truncate">{user?.name || "Admin"}</div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <div className="section-label px-3 mb-3">Navigation</div>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="font-mono text-base leading-none">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <a
          href="/"
          className="sidebar-link"
          target="_blank"
          rel="noreferrer"
        >
          <span className="font-mono">↗</span>
          <span>Patient Portal</span>
        </a>
        <button onClick={handleLogout} className="sidebar-link w-full text-left">
          <span className="font-mono">→</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

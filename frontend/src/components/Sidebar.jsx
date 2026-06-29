import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const links = [
  { to: "/facility/dashboard", label: "Overview", icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { to: "/facility/inventory", label: "Inventory", icon: "M4 6h16M4 12h16M4 18h10" },
  { to: "/facility/invoice", label: "Upload invoice", icon: "M12 4v12m-5-5l5 5 5-5M5 20h14" },
  { to: "/facility/alerts", label: "Alerts & reports", icon: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" },
  { to: "/facility/intelligence", label: "Intelligence", icon: "M3 3v18h18M7 14l4-4 3 3 5-6" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-line flex flex-col">
      <div className="px-6 py-5 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-green rounded-md flex items-center justify-center">
            <svg viewBox="0 0 18 18" fill="none"><path d="M9 2v14M2 9h14" stroke="white" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </div>
          <span className="font-serif font-semibold text-base text-ink">MedGuard</span>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-line">
        <div className="label mb-3">Register</div>
      </div>

      <nav className="flex-1 py-2">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 opacity-80"><path d={l.icon} /></svg>
            <span>{l.label}</span>
          </NavLink>
        ))}
        <div className="label px-6 mt-5 mb-2">Facility</div>
        <NavLink to="/facility/profile" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 opacity-80"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
          <span>Profile & location</span>
        </NavLink>
      </nav>

      <div className="px-3 py-4 border-t border-line space-y-0.5">
        <a href="/search" className="sidebar-link" target="_blank" rel="noreferrer">
          <span className="text-sm">↗</span><span>Patient portal</span>
        </a>
        <button onClick={() => { logout(); navigate("/login"); }} className="sidebar-link w-full text-left">
          <span className="text-sm">→</span><span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

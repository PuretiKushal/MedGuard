import { Link, Outlet, useLocation } from "react-router-dom";

const TABS = [
  { to: "/search", label: "Search" },
  { to: "/search/browse", label: "Browse" },
  { to: "/search/facilities", label: "Facilities" },
  { to: "/search/notifications", label: "My alerts" },
];

export default function PatientLayout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="border-b border-line bg-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-red rounded-md flex items-center justify-center">
              <svg viewBox="0 0 18 18" fill="none"><path d="M9 2v14M2 9h14" stroke="white" strokeWidth="2.4" strokeLinecap="round" /></svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink font-serif">MedGuard</div>
              <div className="text-xs text-ink-faded font-mono">Medicine finder — Visakhapatnam</div>
            </div>
          </Link>
          <Link to="/login" className="text-xs text-ink-faded hover:text-ink font-mono transition-colors">Facility login →</Link>
        </div>
        <div className="max-w-5xl mx-auto px-6 flex gap-1 -mb-px">
          {TABS.map((t) => (
            <Link
              key={t.to} to={t.to}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                pathname === t.to ? "border-red text-ink" : "border-transparent text-ink-faded hover:text-ink"
              }`}
            >{t.label}</Link>
          ))}
        </div>
      </header>
      <Outlet />
    </div>
  );
}

import { useEffect, useState } from "react";
import { getFacilityStats, getAlerts } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import StatusBadge from "../../components/StatusBadge";
import { Link } from "react-router-dom";

function StatCard({ label, value, color, sub }) {
  return (
    <div className={`stat-card border-t-2 ${color}`}>
      <div className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">{label}</div>
      <div className="text-3xl font-mono font-bold text-text-primary">{value ?? "—"}</div>
      {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.facility_id) return;
    Promise.all([
      getFacilityStats(user.facility_id),
      getAlerts(user.facility_id),
    ]).then(([s, a]) => {
      setStats(s.data);
      setAlerts(a.data);
    }).finally(() => setLoading(false));
  }, [user]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  if (loading) return (
    <div className="p-8 text-text-muted font-mono text-sm animate-pulse">Loading dashboard...</div>
  );

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="section-label mb-1">Dashboard</div>
          <h1 className="text-xl font-semibold text-text-primary">Good morning, {user?.name?.split(" ")[0]}</h1>
          <div className="text-xs font-mono text-text-muted mt-1">{today}</div>
        </div>
        <Link to="/facility/alerts" className="btn-ghost text-xs">
          View full report →
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Medicines" value={stats?.total} color="border-border" sub="Active inventory" />
        <StatCard label="Critical" value={stats?.critical} color="border-critical" sub="Act within 30 days" />
        <StatCard label="Warning" value={stats?.warning} color="border-warning" sub="30–60 days remaining" />
        <StatCard label="Expired" value={stats?.expired} color="border-expired" sub="Quarantine required" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Critical alerts */}
        <div className="col-span-2 card">
          <div className="card-header">
            <div>
              <div className="section-label">Priority Alerts</div>
              <div className="text-sm font-medium text-text-primary mt-0.5">Medicines requiring immediate action</div>
            </div>
            {alerts?.total_at_risk > 0 && (
              <span className="badge-critical"><span className="pulse-dot" />{alerts.total_at_risk} at risk</span>
            )}
          </div>
          <div className="divide-y divide-border/50">
            {[...(alerts?.critical || []), ...(alerts?.expired || [])].length === 0 ? (
              <div className="px-5 py-8 text-center text-text-muted font-mono text-sm">
                ✓ No critical alerts today
              </div>
            ) : (
              [...(alerts?.critical || []), ...(alerts?.expired || [])].slice(0, 6).map((m) => (
                <div key={m.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-2 transition-colors">
                  <div>
                    <div className="text-sm font-mono text-text-primary">{m.name}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      Qty: {m.quantity} · Batch: {m.batch_number || "—"} · Exp: {m.expiry_date}
                    </div>
                  </div>
                  <StatusBadge status={m.expiry_status} days={m.days_remaining} />
                </div>
              ))
            )}
          </div>
          {(alerts?.critical?.length + alerts?.expired?.length) > 6 && (
            <div className="px-5 py-3 border-t border-border">
              <Link to="/facility/alerts" className="text-xs font-mono text-accent hover:underline">
                View all {alerts.critical.length + alerts.expired.length} alerts →
              </Link>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Inventory health */}
          <div className="card">
            <div className="card-header">
              <div className="section-label">Inventory Health</div>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: "Safe", value: stats?.safe, total: stats?.total, color: "bg-safe" },
                { label: "Warning", value: stats?.warning, total: stats?.total, color: "bg-warning" },
                { label: "Critical", value: stats?.critical, total: stats?.total, color: "bg-critical" },
                { label: "Expired", value: stats?.expired, total: stats?.total, color: "bg-expired" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-text-secondary">{row.label}</span>
                    <span className="text-text-muted">{row.value}</span>
                  </div>
                  <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.color} transition-all duration-500`}
                      style={{ width: `${row.total ? (row.value / row.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning medicines */}
          <div className="card">
            <div className="card-header">
              <div className="section-label">Upcoming Warnings</div>
            </div>
            <div className="divide-y divide-border/50">
              {(alerts?.warning || []).slice(0, 4).map((m) => (
                <div key={m.id} className="px-4 py-3">
                  <div className="text-xs font-mono text-text-primary truncate">{m.name}</div>
                  <div className="text-xs text-warning font-mono mt-0.5">{m.days_remaining}d remaining</div>
                </div>
              ))}
              {(alerts?.warning || []).length === 0 && (
                <div className="px-4 py-4 text-xs text-text-muted font-mono">No warnings</div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card p-4 space-y-2">
            <div className="section-label mb-3">Quick Actions</div>
            <Link to="/facility/invoice" className="btn-primary w-full text-center block text-xs">
              ↑ Upload Invoice
            </Link>
            <Link to="/facility/alerts" className="btn-ghost w-full text-center block text-xs">
              ↓ Download Report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

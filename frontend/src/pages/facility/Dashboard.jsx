import { useEffect, useState } from "react";
import { getFacilityStats, getAlerts, getFacility } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import StampBadge from "../../components/StampBadge";
import { Link } from "react-router-dom";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.facility_id) return;
    Promise.all([
      getFacilityStats(user.facility_id),
      getAlerts(user.facility_id),
      getFacility(user.facility_id),
    ]).then(([s, a, f]) => {
      setStats(s.data); setAlerts(a.data); setFacility(f.data);
    }).finally(() => setLoading(false));
  }, [user]);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (loading) return <div className="p-8 text-ink-faded font-mono text-sm">Loading dashboard...</div>;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="label mb-1">Dashboard</div>
          <h1 className="font-serif font-semibold text-2xl text-ink">{getGreeting()}, Doctor!</h1>
          <div className="text-sm text-ink-faded mt-1">{facility?.name} · {today}</div>
        </div>
        <Link to="/facility/alerts" className="btn-outline text-xs">View full report →</Link>
      </div>

      {facility?.verification_status === "pending_review" && (
        <div className="mb-6 px-5 py-4 bg-amber-light border border-amber/30 rounded-[10px] flex items-start justify-between">
          <div>
            <div className="font-semibold text-sm text-ink mb-1">Your facility is pending verification</div>
            <div className="text-xs text-ink-faded">{facility.verification_reason || "Upload a proof document to complete verification."}</div>
          </div>
          <Link to="/facility/profile" className="text-xs font-mono text-amber border-b border-amber pb-0.5 whitespace-nowrap ml-4">Upload proof →</Link>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3.5 mb-7">
        <div className="kpi-card kpi-total"><div className="label mb-2">Total stock</div><div className="font-serif font-semibold text-3xl text-ink">{stats?.total}</div></div>
        <div className="kpi-card kpi-critical"><div className="label mb-2">Critical</div><div className="font-serif font-semibold text-3xl text-red">{stats?.critical}</div></div>
        <div className="kpi-card kpi-warning"><div className="label mb-2">Warning</div><div className="font-serif font-semibold text-3xl text-amber">{stats?.warning}</div></div>
        <div className="kpi-card kpi-safe"><div className="label mb-2">Pending disposal</div><div className="font-serif font-semibold text-3xl text-ink">{stats?.pending_disposal}</div></div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <div>
              <div className="label">Today's register</div>
              <div className="text-sm font-semibold text-ink mt-0.5">Items needing attention</div>
            </div>
            {alerts?.total_at_risk > 0 && <span className="stamp-critical">{alerts.total_at_risk} at risk</span>}
          </div>
          <div>
            {[...(alerts?.critical || []), ...(alerts?.expired || [])].length === 0 ? (
              <div className="px-5 py-8 text-center text-ink-faded font-mono text-sm">✓ No critical alerts today</div>
            ) : (
              [...(alerts?.critical || []), ...(alerts?.expired || [])].slice(0, 6).map((m) => (
                <div key={m.id} className="register-row">
                  <div>
                    <div className="text-sm font-mono text-ink">{m.name}</div>
                    <div className="text-xs text-ink-faded mt-0.5">Qty: {m.quantity} · Batch: {m.batch_number || "—"} · Exp: {m.expiry_date}</div>
                  </div>
                  <StampBadge status={m.expiry_status} disposalStatus={m.disposal_status} days={m.days_remaining} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="label mb-3">Inventory health</div>
            <div className="space-y-3">
              {[
                { label: "Safe", value: stats?.safe, color: "bg-green" },
                { label: "Warning", value: stats?.warning, color: "bg-amber" },
                { label: "Critical", value: stats?.critical, color: "bg-red" },
                { label: "Disposed", value: stats?.disposed, color: "bg-ink-faded" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-ink-faded">{row.label}</span><span className="text-ink-faded">{row.value}</span>
                  </div>
                  <div className="h-1.5 bg-line rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${stats?.total ? (row.value / stats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 space-y-2.5">
            <div className="label mb-2">Quick actions</div>
            <Link to="/facility/invoice" className="btn-fill w-full justify-center text-xs">↑ Upload invoice</Link>
            <Link to="/facility/inventory" className="btn-outline w-full justify-center text-xs">+ Add or deduct stock</Link>
            <Link to="/facility/alerts" className="btn-outline w-full justify-center text-xs">↓ Download report</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

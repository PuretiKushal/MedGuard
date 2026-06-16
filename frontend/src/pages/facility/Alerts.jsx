import { useEffect, useState } from "react";
import { getAlerts, triggerAlerts, getComplianceReport } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import StatusBadge from "../../components/StatusBadge";

function AlertRow({ med }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 hover:bg-surface-2 transition-colors last:border-0">
      <div className="flex-1">
        <div className="text-sm font-mono text-text-primary">{med.name}</div>
        <div className="text-xs text-text-muted mt-0.5 font-mono">
          Qty: {med.quantity} · Batch: {med.batch_number || "—"} · Exp: {med.expiry_date}
          {med.supplier && ` · ${med.supplier}`}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <StatusBadge status={med.expiry_status} days={med.days_remaining} />
        {med.expiry_status === "critical" && (
          <div className="text-xs text-text-muted font-mono">Redistribute or prioritise use</div>
        )}
        {med.expiry_status === "expired" && (
          <div className="text-xs text-critical font-mono">Quarantine immediately</div>
        )}
      </div>
    </div>
  );
}

export default function Alerts() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const load = () => {
    if (!user?.facility_id) return;
    getAlerts(user.facility_id)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await triggerAlerts();
      setTriggered(true);
      setTimeout(() => setTriggered(false), 4000);
    } finally {
      setTriggering(false);
    }
  };

  const handleDownloadPDF = async () => {
    const res = await getComplianceReport(user.facility_id);
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance_report_facility_${user.facility_id}.pdf`;
    a.click();
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  if (loading) return <div className="p-8 text-text-muted font-mono text-sm animate-pulse">Loading alerts...</div>;

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="section-label mb-1">Alerts & Reports</div>
          <h1 className="text-xl font-semibold text-text-primary">Daily Alert Report</h1>
          <div className="text-xs font-mono text-text-muted mt-1">{today}</div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleTrigger} disabled={triggering} className="btn-ghost text-xs">
            {triggering ? "Sending..." : "◉ Send WhatsApp + Email Alert"}
          </button>
          <button onClick={handleDownloadPDF} className="btn-primary text-xs">
            ↓ Compliance PDF
          </button>
        </div>
      </div>

      {triggered && (
        <div className="mb-5 px-4 py-3 bg-safe-bg border border-safe/30 rounded-lg text-safe text-xs font-mono animate-slide-up">
          ✓ Alert sent via WhatsApp and email to registered facility contacts.
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-t-2 border-critical">
          <div className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">Critical</div>
          <div className="text-3xl font-mono font-bold text-critical">{data?.critical?.length ?? 0}</div>
          <div className="text-xs text-text-muted mt-1">Expiring ≤ 30 days</div>
        </div>
        <div className="stat-card border-t-2 border-warning">
          <div className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">Warning</div>
          <div className="text-3xl font-mono font-bold text-warning">{data?.warning?.length ?? 0}</div>
          <div className="text-xs text-text-muted mt-1">Expiring 31–60 days</div>
        </div>
        <div className="stat-card border-t-2 border-expired">
          <div className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">Expired</div>
          <div className="text-3xl font-mono font-bold text-expired">{data?.expired?.length ?? 0}</div>
          <div className="text-xs text-text-muted mt-1">Quarantine required</div>
        </div>
      </div>

      {/* Critical section */}
      {data?.critical?.length > 0 && (
        <div className="card mb-5">
          <div className="card-header border-l-2 border-critical pl-3">
            <div>
              <div className="section-label text-critical">Critical — Action Required</div>
              <div className="text-sm font-medium text-text-primary mt-0.5">Expiring within 30 days — prioritise use or redistribute</div>
            </div>
            <span className="badge-critical"><span className="pulse-dot" />{data.critical.length} medicines</span>
          </div>
          <div>{data.critical.map((m) => <AlertRow key={m.id} med={m} />)}</div>
        </div>
      )}

      {/* Warning section */}
      {data?.warning?.length > 0 && (
        <div className="card mb-5">
          <div className="card-header border-l-2 border-warning pl-3">
            <div>
              <div className="section-label text-warning">Warning — Plan Utilisation</div>
              <div className="text-sm font-medium text-text-primary mt-0.5">Expiring in 31–60 days — schedule use</div>
            </div>
            <span className="badge-warning">◆ {data.warning.length} medicines</span>
          </div>
          <div>{data.warning.map((m) => <AlertRow key={m.id} med={m} />)}</div>
        </div>
      )}

      {/* Expired section */}
      {data?.expired?.length > 0 && (
        <div className="card mb-5">
          <div className="card-header border-l-2 border-expired pl-3">
            <div>
              <div className="section-label">Expired — Quarantine Immediately</div>
              <div className="text-sm font-medium text-text-primary mt-0.5">Do not dispense — remove from shelf and log disposal</div>
            </div>
            <span className="badge-expired">✕ {data.expired.length} medicines</span>
          </div>
          <div>{data.expired.map((m) => <AlertRow key={m.id} med={m} />)}</div>
        </div>
      )}

      {data?.critical?.length === 0 && data?.warning?.length === 0 && data?.expired?.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-3xl mb-3">✓</div>
          <div className="text-safe font-mono text-sm">All medicines are within safe expiry range.</div>
          <div className="text-text-muted text-xs mt-1 font-mono">No alerts for today.</div>
        </div>
      )}

      <div className="mt-4 text-xs font-mono text-text-muted text-center">
        Report generated: {new Date().toLocaleTimeString("en-IN")} · MedGuard v1.0 · For official facility use only
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { getAlerts, triggerAlerts, getComplianceReport } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import StampBadge from "../../components/StampBadge";

function AlertRow({ med }) {
  return (
    <div className="register-row">
      <div className="flex-1">
        <div className="text-sm font-mono text-ink">{med.name}</div>
        <div className="text-xs text-ink-faded mt-0.5 font-mono">Qty: {med.quantity} · Batch: {med.batch_number || "—"} · Exp: {med.expiry_date}{med.supplier && ` · ${med.supplier}`}</div>
      </div>
      <StampBadge status={med.expiry_status} disposalStatus={med.disposal_status} days={med.days_remaining} />
    </div>
  );
}

export default function Alerts() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (user?.facility_id) getAlerts(user.facility_id).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [user]);

  const handleTrigger = async () => {
    setTriggering(true);
    try { await triggerAlerts(); setTriggered(true); setTimeout(() => setTriggered(false), 4000); }
    finally { setTriggering(false); }
  };

  const handleDownloadPDF = async () => {
    const res = await getComplianceReport(user.facility_id);
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url; a.download = `compliance_report_facility_${user.facility_id}.pdf`; a.click();
  };

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (loading) return <div className="p-8 text-ink-faded font-mono text-sm">Loading alerts...</div>;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="label mb-1">Alerts & reports</div>
          <h1 className="font-serif font-semibold text-2xl text-ink">Daily alert report</h1>
          <div className="text-xs font-mono text-ink-faded mt-1">{today}</div>
        </div>
        <div className="flex gap-2.5">
          <button onClick={handleTrigger} disabled={triggering} className="btn-outline text-xs">{triggering ? "Sending..." : "Send WhatsApp + email"}</button>
          <button onClick={handleDownloadPDF} className="btn-fill text-xs">↓ Compliance PDF</button>
        </div>
      </div>

      {triggered && <div className="mb-5 px-4 py-3 bg-green-light border border-green/20 rounded-lg text-green text-xs font-mono">✓ Alert sent via WhatsApp and email.</div>}

      <div className="grid grid-cols-3 gap-3.5 mb-6">
        <div className="kpi-card kpi-critical"><div className="label mb-2">Critical</div><div className="font-serif font-semibold text-3xl text-red">{data?.critical?.length ?? 0}</div></div>
        <div className="kpi-card kpi-warning"><div className="label mb-2">Warning</div><div className="font-serif font-semibold text-3xl text-amber">{data?.warning?.length ?? 0}</div></div>
        <div className="kpi-card kpi-total"><div className="label mb-2">Expired</div><div className="font-serif font-semibold text-3xl text-ink-faded">{data?.expired?.length ?? 0}</div></div>
      </div>

      {data?.critical?.length > 0 && (
        <div className="card mb-5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line border-l-2 border-l-red">
            <div><div className="label text-red">Critical — action required</div><div className="text-sm font-semibold text-ink mt-0.5">Expiring within 30 days</div></div>
            <span className="stamp-critical">{data.critical.length} medicines</span>
          </div>
          <div>{data.critical.map((m) => <AlertRow key={m.id} med={m} />)}</div>
        </div>
      )}

      {data?.warning?.length > 0 && (
        <div className="card mb-5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line border-l-2 border-l-amber">
            <div><div className="label text-amber">Warning — plan utilisation</div><div className="text-sm font-semibold text-ink mt-0.5">Expiring in 31–60 days</div></div>
            <span className="stamp-warning">{data.warning.length} medicines</span>
          </div>
          <div>{data.warning.map((m) => <AlertRow key={m.id} med={m} />)}</div>
        </div>
      )}

      {data?.expired?.length > 0 && (
        <div className="card mb-5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line border-l-2 border-l-ink-faded">
            <div><div className="label">Expired — quarantine or dispose</div><div className="text-sm font-semibold text-ink mt-0.5">Mark as disposed once removed</div></div>
            <span className="stamp-expired">{data.expired.length} medicines</span>
          </div>
          <div>{data.expired.map((m) => <AlertRow key={m.id} med={m} />)}</div>
        </div>
      )}

      {data?.critical?.length === 0 && data?.warning?.length === 0 && data?.expired?.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-3xl mb-3">✓</div>
          <div className="text-green font-mono text-sm">All medicines are within safe expiry range.</div>
        </div>
      )}
    </div>
  );
}

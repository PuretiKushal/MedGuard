import { useState } from "react";
import { getPendingFacilities, verifyFacility } from "../../utils/api";

export default function AdminVerify() {
  const [adminKey, setAdminKey] = useState("");
  const [facilities, setFacilities] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPending = async () => {
    setLoading(true); setError("");
    try {
      const res = await getPendingFacilities(adminKey);
      setFacilities(res.data);
    } catch {
      setError("Invalid admin key.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    await verifyFacility(id, adminKey);
    setFacilities((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-paper py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-serif font-semibold text-2xl text-ink mb-2">Admin — facility verification</h1>
        <p className="text-sm text-ink-faded mb-6">Review facilities flagged by the AI screening system.</p>

        <div className="flex gap-2 mb-8">
          <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="Admin key" className="input-field flex-1" />
          <button onClick={loadPending} disabled={loading} className="btn-fill">{loading ? "..." : "Load"}</button>
        </div>

        {error && <div className="text-red text-sm font-mono mb-4">{error}</div>}

        {facilities && (
          facilities.length === 0 ? (
            <div className="text-center py-10 text-ink-faded font-mono text-sm">No facilities pending review.</div>
          ) : (
            <div className="space-y-3">
              {facilities.map((f) => (
                <div key={f.id} className="card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-sm text-ink">{f.name}</div>
                      <div className="text-xs text-ink-faded font-mono">{f.address}</div>
                    </div>
                    <button onClick={() => handleVerify(f.id)} className="btn-fill text-xs">✓ Verify</button>
                  </div>
                  <div className="text-xs text-amber bg-amber-light rounded-lg px-3 py-2 font-mono">{f.verification_reason}</div>
                  {f.proof_document_path && <div className="text-xs text-green font-mono mt-2">✓ Proof document submitted</div>}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

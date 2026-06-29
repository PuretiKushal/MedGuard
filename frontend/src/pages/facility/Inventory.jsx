import { useEffect, useState } from "react";
import { getMedicines, deleteMedicine, markDisposed } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import StampBadge from "../../components/StampBadge";
import AddMedicineModal from "../../components/AddMedicineModal";
import DeductModal from "../../components/DeductModal";

const FILTERS = ["all", "critical", "warning", "safe", "expired"];

export default function Inventory() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deductTarget, setDeductTarget] = useState(null);

  const load = (f = filter) => {
    if (!user?.facility_id) return;
    setLoading(true);
    getMedicines(user.facility_id, f).then((r) => setMedicines(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user, filter]);

  const filtered = medicines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.generic_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => { await deleteMedicine(id); load(); };
  const handleDispose = async (med) => {
    await markDisposed(med.id, user.name);
    load();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="label mb-1">Inventory</div>
          <h1 className="font-serif font-semibold text-2xl text-ink">Medicine register</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-fill text-sm">+ Add medicine</button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-medium transition-colors capitalize ${
                filter === f ? "bg-green text-white" : "bg-white text-ink-faded border border-line hover:border-green/40"
              }`}
            >{f}</button>
          ))}
        </div>
        <input
          type="text" placeholder="Search medicines..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="input-field max-w-xs ml-auto"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Medicine</th><th>Generic</th><th>Qty</th><th>Batch</th>
                <th>Supplier</th><th>Expiry</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-ink-faded">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-ink-faded">No medicines found</td></tr>
              ) : filtered.map((m, i) => (
                <tr key={m.id}>
                  <td className="text-ink-faded">{i + 1}</td>
                  <td className="font-sans font-medium text-ink">{m.name}</td>
                  <td className="text-ink-faded">{m.generic_name || "—"}</td>
                  <td><span className={m.quantity < 20 ? "text-red font-semibold" : ""}>{m.quantity}</span></td>
                  <td className="text-ink-faded">{m.batch_number || "—"}</td>
                  <td className="text-ink-faded">{m.supplier || "—"}</td>
                  <td>{m.expiry_date}</td>
                  <td><StampBadge status={m.expiry_status} disposalStatus={m.disposal_status} days={m.days_remaining} /></td>
                  <td>
                    <div className="flex gap-2.5">
                      {m.expiry_status === "expired" ? (
                        m.disposal_status !== "disposed" && (
                          <button onClick={() => handleDispose(m)} className="text-xs text-green hover:underline font-mono">Mark disposed</button>
                        )
                      ) : (
                        <button onClick={() => setDeductTarget(m)} className="text-xs text-amber hover:underline font-mono">Deduct</button>
                      )}
                      <button onClick={() => handleDelete(m.id)} className="text-xs text-ink-faded hover:text-red font-mono">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-line text-xs font-mono text-ink-faded">
          Showing {filtered.length} of {medicines.length} medicines
        </div>
      </div>

      {showAdd && <AddMedicineModal facilityId={user.facility_id} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
      {deductTarget && <DeductModal medicine={deductTarget} onClose={() => setDeductTarget(null)} onDone={() => { setDeductTarget(null); load(); }} />}
    </div>
  );
}

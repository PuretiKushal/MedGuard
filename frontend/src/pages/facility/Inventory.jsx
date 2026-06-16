import { useEffect, useState } from "react";
import { getMedicines, deleteMedicine } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import StatusBadge from "../../components/StatusBadge";
import AddMedicineModal from "../../components/AddMedicineModal";

const FILTERS = ["all", "critical", "warning", "safe", "expired"];

export default function Inventory() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = (f = filter) => {
    if (!user?.facility_id) return;
    setLoading(true);
    getMedicines(user.facility_id, f)
      .then((r) => setMedicines(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user, filter]);

  const filtered = medicines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.generic_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    await deleteMedicine(id);
    load();
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="section-label mb-1">Inventory</div>
          <h1 className="text-xl font-semibold text-text-primary">Medicine Stock</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-xs">
          + Add Medicine
        </button>
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                filter === f
                  ? "bg-accent text-base"
                  : "bg-surface-2 text-text-secondary hover:text-text-primary border border-border"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search medicines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-xs ml-auto"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Generic</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Batch</th>
                <th>Supplier</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Flags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center py-8 text-text-muted">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-text-muted">No medicines found</td></tr>
              ) : (
                filtered.map((m, i) => (
                  <tr key={m.id}>
                    <td className="text-text-muted">{i + 1}</td>
                    <td>
                      <div className="font-medium text-text-primary">{m.name}</div>
                    </td>
                    <td className="text-text-secondary">{m.generic_name || "—"}</td>
                    <td className="text-text-muted">{m.category || "—"}</td>
                    <td>
                      <span className={m.quantity < 20 ? "text-critical" : "text-text-primary"}>
                        {m.quantity}
                      </span>
                    </td>
                    <td className="text-text-muted">{m.batch_number || "—"}</td>
                    <td className="text-text-muted">{m.supplier || "—"}</td>
                    <td>{m.expiry_date}</td>
                    <td><StatusBadge status={m.expiry_status} days={m.days_remaining} /></td>
                    <td>
                      {m.is_cold_chain && (
                        <span className="text-xs font-mono text-blue-400 bg-blue-900/20 border border-blue-400/20 px-1.5 py-0.5 rounded">❄ Cold</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-xs text-text-muted hover:text-critical transition-colors font-mono"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-xs font-mono text-text-muted">
          Showing {filtered.length} of {medicines.length} medicines
        </div>
      </div>

      {showAdd && (
        <AddMedicineModal
          facilityId={user.facility_id}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}

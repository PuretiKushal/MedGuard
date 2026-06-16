import { useState } from "react";
import { addMedicine } from "../utils/api";

const CATEGORIES = [
  "Analgesic", "Antibiotic", "Antifungal", "Antiviral", "Cardiovascular",
  "Antidiabetic", "Gastrointestinal", "Respiratory", "Antihistamine",
  "Corticosteroid", "Vitamin", "Supplement", "Electrolyte", "Anticoagulant", "Other"
];

export default function AddMedicineModal({ facilityId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "", generic_name: "", category: "Analgesic",
    batch_number: "", supplier: "", quantity: "", unit: "tablets",
    mrp: "", expiry_date: "", manufacturing_date: "", is_cold_chain: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.quantity || !form.expiry_date) {
      setError("Name, quantity, and expiry date are required.");
      return;
    }
    setSaving(true);
    try {
      await addMedicine({
        ...form,
        facility_id: facilityId,
        quantity: parseInt(form.quantity),
        mrp: form.mrp ? parseFloat(form.mrp) : null,
        manufacturing_date: form.manufacturing_date || null,
      });
      onSaved();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg animate-slide-up">
        <div className="card-header">
          <div className="text-sm font-semibold text-text-primary">Add Medicine</div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg leading-none">×</button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Medicine Name *</label>
            <input className="input-field" placeholder="e.g. Paracetamol 500mg" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Generic / Salt Name</label>
            <input className="input-field" placeholder="e.g. paracetamol" value={form.generic_name} onChange={(e) => set("generic_name", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Category</label>
            <select className="input-field" value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Quantity *</label>
            <input className="input-field" type="number" placeholder="e.g. 500" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Unit</label>
            <select className="input-field" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
              {["tablets", "capsules", "ml", "vials", "sachets", "strips", "units"].map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Expiry Date *</label>
            <input className="input-field" type="date" value={form.expiry_date} onChange={(e) => set("expiry_date", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Mfg Date</label>
            <input className="input-field" type="date" value={form.manufacturing_date} onChange={(e) => set("manufacturing_date", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Batch Number</label>
            <input className="input-field" placeholder="BN-2024-001" value={form.batch_number} onChange={(e) => set("batch_number", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">Supplier</label>
            <input className="input-field" placeholder="e.g. Cipla Ltd" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">MRP (₹)</label>
            <input className="input-field" type="number" step="0.01" placeholder="0.00" value={form.mrp} onChange={(e) => set("mrp", e.target.value)} />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="cold" checked={form.is_cold_chain} onChange={(e) => set("is_cold_chain", e.target.checked)} className="accent-accent" />
            <label htmlFor="cold" className="text-xs font-mono text-text-secondary">Cold chain required ❄</label>
          </div>
        </div>
        {error && <div className="mx-5 mb-3 text-xs text-critical font-mono bg-critical-bg border border-critical/20 rounded px-3 py-2">{error}</div>}
        <div className="px-5 py-4 border-t border-border flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost text-xs">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-xs">
            {saving ? "Saving..." : "Save Medicine"}
          </button>
        </div>
      </div>
    </div>
  );
}

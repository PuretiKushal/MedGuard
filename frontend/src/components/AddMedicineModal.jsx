import { useState } from "react";
import { addMedicine } from "../utils/api";

const CATEGORIES = ["Analgesic", "Antibiotic", "Antifungal", "Antiviral", "Cardiovascular", "Antidiabetic", "Gastrointestinal", "Respiratory", "Antihistamine", "Corticosteroid", "Vitamin", "Supplement", "Electrolyte", "Anticoagulant", "Other"];

export default function AddMedicineModal({ facilityId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "", generic_name: "", category: "Analgesic", batch_number: "", supplier: "",
    quantity: "", unit: "tablets", mrp: "", expiry_date: "", manufacturing_date: "", is_cold_chain: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.quantity || !form.expiry_date) { setError("Name, quantity, and expiry date are required."); return; }
    setSaving(true);
    try {
      await addMedicine({ ...form, facility_id: facilityId, quantity: parseInt(form.quantity), mrp: form.mrp ? parseFloat(form.mrp) : null, manufacturing_date: form.manufacturing_date || null });
      onSaved();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-line rounded-[12px] w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="font-serif font-semibold text-lg text-ink">Add medicine</div>
          <button onClick={onClose} className="text-ink-faded hover:text-ink text-lg leading-none">×</button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-3.5">
          <div className="col-span-2">
            <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Medicine name *</label>
            <input className="input-field" placeholder="e.g. Paracetamol 500mg" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Generic / salt name</label>
            <input className="input-field" placeholder="e.g. paracetamol" value={form.generic_name} onChange={(e) => set("generic_name", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Category</label>
            <select className="input-field" value={form.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Quantity *</label>
            <input className="input-field" type="number" placeholder="e.g. 500" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Unit</label>
            <select className="input-field" value={form.unit} onChange={(e) => set("unit", e.target.value)}>{["tablets", "capsules", "ml", "vials", "sachets", "strips", "units"].map((u) => <option key={u}>{u}</option>)}</select>
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Expiry date *</label>
            <input className="input-field" type="date" value={form.expiry_date} onChange={(e) => set("expiry_date", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Mfg date</label>
            <input className="input-field" type="date" value={form.manufacturing_date} onChange={(e) => set("manufacturing_date", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Batch number</label>
            <input className="input-field" placeholder="BN-2024-001" value={form.batch_number} onChange={(e) => set("batch_number", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Supplier</label>
            <input className="input-field" placeholder="e.g. Cipla Ltd" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">MRP (₹)</label>
            <input className="input-field" type="number" step="0.01" placeholder="0.00" value={form.mrp} onChange={(e) => set("mrp", e.target.value)} />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="cold" checked={form.is_cold_chain} onChange={(e) => set("is_cold_chain", e.target.checked)} className="accent-green" />
            <label htmlFor="cold" className="text-xs font-mono text-ink-faded">Cold chain required ❄</label>
          </div>
        </div>
        {error && <div className="mx-6 mb-3 text-xs text-red font-mono bg-red-light border border-red/20 rounded-lg px-3 py-2">{error}</div>}
        <div className="px-6 py-4 border-t border-line flex gap-3 justify-end">
          <button onClick={onClose} className="btn-outline text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-fill text-sm">{saving ? "Saving..." : "Save medicine"}</button>
        </div>
      </div>
    </div>
  );
}

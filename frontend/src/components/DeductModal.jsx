import { useState } from "react";
import { deductStock } from "../utils/api";

export default function DeductModal({ medicine, onClose, onDone }) {
  const [qty, setQty] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const n = parseInt(qty);
    if (!n || n <= 0) { setError("Enter a valid quantity."); return; }
    if (n > medicine.quantity) { setError(`Only ${medicine.quantity} units available.`); return; }
    setLoading(true);
    try {
      await deductStock(medicine.id, n);
      onDone();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to deduct stock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-line rounded-[10px] w-full max-w-sm p-6">
        <div className="font-serif font-semibold text-lg text-ink mb-1">Deduct stock</div>
        <div className="text-sm text-ink-faded mb-5 font-mono">{medicine.name} — current qty: {medicine.quantity}</div>
        <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Quantity to deduct</label>
        <input
          type="number" className="input-field mb-3" value={qty}
          onChange={(e) => setQty(e.target.value)} placeholder="e.g. 20" autoFocus
        />
        {error && <div className="text-red text-xs font-mono bg-red-light border border-red/20 rounded-lg px-3 py-2 mb-3">{error}</div>}
        <div className="flex gap-2.5">
          <button onClick={onClose} className="btn-outline flex-1 justify-center text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-fill flex-1 justify-center text-sm">
            {loading ? "Deducting..." : "Deduct"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { uploadInvoice, confirmInvoice } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import StatusBadge from "../../components/StatusBadge";

const STEPS = ["Upload", "Review", "Confirm"];

export default function InvoiceUpload() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [invoiceType, setInvoiceType] = useState("incoming");
  const [supplier, setSupplier] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [editedMeds, setEditedMeds] = useState([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleUpload = async () => {
    if (!file) { setError("Please select a file first."); return; }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("facility_id", user.facility_id);
      fd.append("invoice_type", invoiceType);
      fd.append("supplier_name", supplier);
      const res = await uploadInvoice(fd);
      setOcrResult(res.data);
      setEditedMeds(res.data.extracted_medicines || []);
      setStep(1);
    } catch {
      setError("OCR processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await confirmInvoice({
        facility_id: user.facility_id,
        invoice_type: invoiceType,
        supplier_name: supplier,
        medicines_data: editedMeds,
      });
      setStep(2);
      setDone(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateMed = (i, field, val) => {
    setEditedMeds((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const removeMed = (i) => setEditedMeds((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="p-8 animate-fade-in max-w-3xl">
      <div className="mb-8">
        <div className="section-label mb-1">Invoice Upload</div>
        <h1 className="text-xl font-semibold text-text-primary">OCR Invoice Processing</h1>
        <p className="text-text-secondary text-sm mt-1">Upload a distributor invoice — the system will read and extract all medicine details automatically.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono ${
              i === step ? "bg-accent text-base font-semibold" :
              i < step ? "text-safe" : "text-text-muted"
            }`}>
              <span>{i < step ? "✓" : i + 1}</span>
              <span>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 0: Upload */}
      {step === 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1.5">Invoice Type</label>
              <select className="input-field" value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)}>
                <option value="incoming">Incoming (Stock Addition)</option>
                <option value="outgoing">Outgoing (Stock Deduction)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1.5">Supplier Name</label>
              <input className="input-field" placeholder="e.g. Cipla Ltd" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1.5">Invoice File</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                file ? "border-accent bg-safe-bg" : "border-border hover:border-accent/50"
              }`}
            >
              {file ? (
                <div>
                  <div className="text-safe font-mono text-sm mb-1">✓ {file.name}</div>
                  <div className="text-text-muted text-xs">{(file.size / 1024).toFixed(1)} KB — click to change</div>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-3 text-text-muted">↑</div>
                  <div className="text-text-secondary text-sm font-medium">Click to upload or drag & drop</div>
                  <div className="text-text-muted text-xs mt-1">PDF or image file (JPG, PNG)</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={(e) => { if (e.target.files[0]) setFile(e.target.files[0]); }} />
            </div>
          </div>

          {error && <div className="text-critical text-xs font-mono bg-critical-bg border border-critical/20 rounded px-3 py-2">{error}</div>}

          <div className="card p-4">
            <div className="section-label mb-3">How OCR Works</div>
            <div className="space-y-2">
              {[
                "Your invoice file is sent to Tesseract OCR running on the server",
                "The text is extracted and parsed to identify the medicine table",
                "Medicine name, batch number, quantity, and expiry dates are extracted",
                "You review and correct before anything is saved to inventory",
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3 text-xs text-text-secondary font-mono">
                  <span className="text-accent mt-0.5">{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleUpload} disabled={loading || !file} className="btn-primary">
            {loading ? "Processing OCR..." : "Process Invoice →"}
          </button>
        </div>
      )}

      {/* Step 1: Review */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-text-primary">Review Extracted Medicines</div>
              <div className="text-xs text-text-muted font-mono mt-0.5">
                {editedMeds.length} medicines found — correct any errors before saving
              </div>
            </div>
            <button
              onClick={() => setEditedMeds((p) => [...p, { name: "", quantity: 0, expiry_date: "", batch_number: "", supplier: "" }])}
              className="btn-ghost text-xs"
            >+ Add row</button>
          </div>

          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Qty</th>
                  <th>Expiry Date</th>
                  <th>Batch</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {editedMeds.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6 text-text-muted">No medicines extracted — add manually using the button above</td></tr>
                ) : editedMeds.map((m, i) => (
                  <tr key={i}>
                    <td><input className="input-field py-1" value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} /></td>
                    <td><input className="input-field py-1 w-20" type="number" value={m.quantity} onChange={(e) => updateMed(i, "quantity", parseInt(e.target.value))} /></td>
                    <td><input className="input-field py-1" type="date" value={m.expiry_date} onChange={(e) => updateMed(i, "expiry_date", e.target.value)} /></td>
                    <td><input className="input-field py-1" value={m.batch_number || ""} onChange={(e) => updateMed(i, "batch_number", e.target.value)} /></td>
                    <td>
                      <button onClick={() => removeMed(i)} className="text-text-muted hover:text-critical text-xs font-mono transition-colors">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <div className="text-critical text-xs font-mono bg-critical-bg border border-critical/20 rounded px-3 py-2">{error}</div>}

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-ghost text-xs">← Back</button>
            <button onClick={handleConfirm} disabled={loading || editedMeds.length === 0} className="btn-primary text-xs">
              {loading ? "Saving..." : `Save ${editedMeds.length} Medicines to Inventory →`}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Done */}
      {step === 2 && done && (
        <div className="card p-10 text-center animate-slide-up">
          <div className="text-4xl mb-4">✓</div>
          <div className="text-lg font-semibold text-safe mb-2">Invoice Processed</div>
          <div className="text-text-secondary text-sm mb-6">
            {editedMeds.length} medicines have been {invoiceType === "incoming" ? "added to" : "deducted from"} inventory.
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStep(0); setFile(null); setOcrResult(null); setDone(false); setEditedMeds([]); }} className="btn-ghost text-xs">
              Upload Another
            </button>
            <a href="/facility/inventory" className="btn-primary text-xs">View Inventory →</a>
          </div>
        </div>
      )}
    </div>
  );
}

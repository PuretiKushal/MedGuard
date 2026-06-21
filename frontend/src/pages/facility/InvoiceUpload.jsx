import { useState, useRef } from "react";
import { uploadInvoice, confirmInvoice } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";

const STEPS = ["Upload", "Review", "Confirm"];

export default function InvoiceUpload() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [invoiceType, setInvoiceType] = useState("incoming");
  const [supplier, setSupplier] = useState("");
  const [loading, setLoading] = useState(false);
  const [editedMeds, setEditedMeds] = useState([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleUpload = async () => {
    if (!file) { setError("Please select a file first."); return; }
    setError(""); setLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const promptText = "Read this medicine invoice or prescription image and extract all visible text exactly as written, including medicine names, quantities, dates and batch numbers. Return only the raw extracted text, nothing else.";

      let aiResponse;
      try {
        aiResponse = await window.puter.ai.chat(
          [{ role: "user", content: [{ type: "text", text: promptText }, { type: "file", data: base64, mime_type: file.type }] }],
          { model: "gpt-4o-mini" }
        );
      } catch {
        aiResponse = await window.puter.ai.chat(
          [{ role: "user", content: [{ type: "text", text: promptText }, { type: "file", data: base64, mime_type: file.type }] }],
          { model: "claude-sonnet-4-6" }
        );
      }

      const rawText = aiResponse?.message?.content?.[0]?.text || String(aiResponse) || "";

      const fd = new FormData();
      fd.append("raw_text", rawText);
      fd.append("facility_id", user.facility_id);
      fd.append("invoice_type", invoiceType);
      fd.append("supplier_name", supplier);
      const res = await uploadInvoice(fd);
      setEditedMeds(res.data.extracted_medicines || []);
      setStep(1);
    } catch (err) {
      console.error(err);
      setError("AI reading failed. Please try again or add medicines manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await confirmInvoice({ facility_id: user.facility_id, invoice_type: invoiceType, supplier_name: supplier, medicines_data: editedMeds });
      setStep(2); setDone(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateMed = (i, field, val) => setEditedMeds((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  const removeMed = (i) => setEditedMeds((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-7">
        <div className="label mb-1">Invoice upload</div>
        <h1 className="font-serif font-semibold text-2xl text-ink">OCR invoice processing</h1>
        <p className="text-ink-faded text-sm mt-1">Upload a distributor invoice — the system reads and extracts medicine details automatically.</p>
      </div>

      <div className="flex items-center gap-0 mb-7">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono ${i === step ? "bg-green text-white font-semibold" : i < step ? "text-green" : "text-ink-faded"}`}>
              <span>{i < step ? "✓" : i + 1}</span><span>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-line" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-ink-faded uppercase tracking-wider mb-1.5">Invoice type</label>
              <select className="input-field" value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)}>
                <option value="incoming">Incoming (stock addition)</option>
                <option value="outgoing">Outgoing (stock deduction)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-ink-faded uppercase tracking-wider mb-1.5">Supplier name</label>
              <input className="input-field" placeholder="e.g. Cipla Ltd" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-ink-faded uppercase tracking-wider mb-1.5">Invoice file</label>
            <div onClick={() => fileRef.current?.click()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${file ? "border-green bg-green-light" : "border-line hover:border-green/40"}`}>
              {file ? (
                <div><div className="text-green font-mono text-sm mb-1">✓ {file.name}</div><div className="text-ink-faded text-xs">{(file.size / 1024).toFixed(1)} KB — click to change</div></div>
              ) : (
                <div><div className="text-4xl mb-3 text-ink-faded">↑</div><div className="text-ink text-sm font-medium">Click to upload or drag & drop</div><div className="text-ink-faded text-xs mt-1">PDF or image file (JPG, PNG)</div></div>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files[0]) setFile(e.target.files[0]); }} />
            </div>
          </div>

          {error && <div className="text-red text-xs font-mono bg-red-light border border-red/20 rounded-lg px-3 py-2">{error}</div>}

          <div className="card p-5">
            <div className="label mb-3">How OCR works</div>
            <div className="space-y-2">
              {["Your invoice image is read directly by AI in your browser", "Text is extracted and parsed to identify the medicine table", "Names are AI-cleaned and matched to generics where possible", "You review and correct before anything is saved to inventory"].map((s, i) => (
                <div key={i} className="flex items-start gap-3 text-xs text-ink-faded font-mono"><span className="text-green mt-0.5">{i + 1}.</span><span>{s}</span></div>
              ))}
            </div>
          </div>

          <button onClick={handleUpload} disabled={loading || !file} className="btn-fill">{loading ? "Processing OCR..." : "Process invoice →"}</button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-ink">Review extracted medicines</div>
              <div className="text-xs text-ink-faded font-mono mt-0.5">{editedMeds.length} medicines found — correct any errors</div>
            </div>
            <button onClick={() => setEditedMeds((p) => [...p, { name: "", quantity: 0, expiry_date: "", batch_number: "", supplier: "" }])} className="btn-outline text-xs">+ Add row</button>
          </div>

          <div className="card overflow-hidden">
            <table className="data-table">
              <thead><tr><th>Medicine name</th><th>Qty</th><th>Expiry date</th><th>Batch</th><th></th></tr></thead>
              <tbody>
                {editedMeds.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6 text-ink-faded">No medicines extracted — add manually above</td></tr>
                ) : editedMeds.map((m, i) => (
                  <tr key={i}>
                    <td><input className="input-field py-1.5" value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} /></td>
                    <td><input className="input-field py-1.5 w-20" type="number" value={m.quantity} onChange={(e) => updateMed(i, "quantity", parseInt(e.target.value))} /></td>
                    <td><input className="input-field py-1.5" type="date" value={m.expiry_date} onChange={(e) => updateMed(i, "expiry_date", e.target.value)} /></td>
                    <td><input className="input-field py-1.5" value={m.batch_number || ""} onChange={(e) => updateMed(i, "batch_number", e.target.value)} /></td>
                    <td><button onClick={() => removeMed(i)} className="text-ink-faded hover:text-red text-xs font-mono">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <div className="text-red text-xs font-mono bg-red-light border border-red/20 rounded-lg px-3 py-2">{error}</div>}

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-outline text-xs">← Back</button>
            <button onClick={handleConfirm} disabled={loading || editedMeds.length === 0} className="btn-fill text-xs">{loading ? "Saving..." : `Save ${editedMeds.length} medicines →`}</button>
          </div>
        </div>
      )}

      {step === 2 && done && (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-4">✓</div>
          <div className="font-serif font-semibold text-lg text-green mb-2">Invoice processed</div>
          <div className="text-ink-faded text-sm mb-6">{editedMeds.length} medicines have been {invoiceType === "incoming" ? "added to" : "deducted from"} inventory.</div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStep(0); setFile(null); setDone(false); setEditedMeds([]); }} className="btn-outline text-xs">Upload another</button>
            <a href="/facility/inventory" className="btn-fill text-xs">View inventory →</a>
          </div>
        </div>
      )}
    </div>
  );
}

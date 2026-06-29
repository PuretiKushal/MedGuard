import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import LocationPicker from "../components/LocationPicker";
import { registerFacility } from "../utils/api";

const FACILITY_TYPES = [
  { value: "government_hospital", label: "Government Hospital" },
  { value: "phc", label: "Primary Health Centre (PHC)" },
  { value: "private_pharmacy", label: "Private Pharmacy" },
  { value: "private_hospital", label: "Private Hospital" },
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    name: "", facility_type: "private_pharmacy", address: "", area: "",
    latitude: 17.7231, longitude: 83.3012, phone: "", email: "",
    admin_whatsapp: "", is_free_medicines: false,
    admin_name: "", admin_email: "", admin_password: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await registerFacility(form);
      setResult(res.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 2 && result) {
    const isFlagged = result.verification_status === "pending_review";
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="text-3xl mb-4">{isFlagged ? "⚠" : "✓"}</div>
          <h2 className="font-serif font-semibold text-xl mb-2 text-ink">
            {isFlagged ? "Registered — pending verification" : "Facility registered"}
          </h2>
          <p className="text-sm text-ink-faded mb-5">
            {isFlagged
              ? result.verification_reason || "Our system flagged some details for manual review. You can still use your dashboard fully — just upload a proof document when you can."
              : "Your facility is now live and visible to patients searching nearby."}
          </p>
          {isFlagged && <div className="stamp-unverified mb-5 inline-block">Unverified facility</div>}
          <Link to="/login" className="btn-fill w-full justify-center">Go to sign in →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="label mb-6 inline-block">← Back to MedGuard</Link>
        <h1 className="font-serif font-semibold text-3xl mb-2 text-ink">Register your facility</h1>
        <p className="text-sm text-ink-faded mb-8">
          Government hospitals, PHCs, and private pharmacies can all register. Your facility will appear immediately in patient searches once submitted.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Facility details */}
          <div className="card p-6">
            <div className="label mb-4">Facility details</div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Facility Name *</label>
                <input className="input-field" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Apollo Pharmacy, Siripuram" />
              </div>
              <div>
                <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Facility Type *</label>
                <select className="input-field" value={form.facility_type} onChange={(e) => set("facility_type", e.target.value)}>
                  {FACILITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Address *</label>
                  <input className="input-field" required value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, locality" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Area *</label>
                  <input className="input-field" required value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. MVP Colony" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="free" checked={form.is_free_medicines} onChange={(e) => set("is_free_medicines", e.target.checked)} className="accent-green" />
                <label htmlFor="free" className="text-xs font-mono text-ink-faded">This facility provides medicines free of cost</label>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card p-6">
            <div className="label mb-4">Exact location</div>
            <LocationPicker
              lat={form.latitude} lng={form.longitude}
              onChange={(lat, lng) => { set("latitude", lat); set("longitude", lng); }}
            />
          </div>

          {/* Contact */}
          <div className="card p-6">
            <div className="label mb-4">Contact details</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Phone *</label>
                <input className="input-field" required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0891-XXXXXXX" />
              </div>
              <div>
                <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Facility Email *</label>
                <input className="input-field" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contact@facility.in" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Admin WhatsApp Number *</label>
                <input className="input-field" required value={form.admin_whatsapp} onChange={(e) => set("admin_whatsapp", e.target.value)} placeholder="+919876543210" />
                <div className="text-xs text-ink-faded font-mono mt-1">Daily expiry alerts will be sent here via WhatsApp.</div>
              </div>
            </div>
          </div>

          {/* Admin login */}
          <div className="card p-6">
            <div className="label mb-4">Create your admin login</div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Your Name *</label>
                <input className="input-field" required value={form.admin_name} onChange={(e) => set("admin_name", e.target.value)} placeholder="e.g. Dr. Ramesh Babu" />
              </div>
              <div>
                <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Login Email *</label>
                <input className="input-field" type="email" required value={form.admin_email} onChange={(e) => set("admin_email", e.target.value)} placeholder="admin@facility.in" />
              </div>
              <div>
                <label className="block text-xs font-mono text-ink-faded mb-1.5 uppercase tracking-wider">Password *</label>
                <input className="input-field" type="password" required minLength={6} value={form.admin_password} onChange={(e) => set("admin_password", e.target.value)} placeholder="At least 6 characters" />
              </div>
            </div>
          </div>

          {error && <div className="text-red text-xs font-mono bg-red-light border border-red/20 rounded-lg px-4 py-3">{error}</div>}

          <button type="submit" disabled={loading} className="btn-fill w-full justify-center text-base py-3.5">
            {loading ? "Registering facility..." : "Register facility →"}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { registerNotification } from "../utils/api";

export default function NotifyModal({ medicine, onClose }) {
  const [number, setNumber] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!number.trim()) { setError("Please enter your WhatsApp number."); return; }
    if (!/^\+?\d{10,13}$/.test(number.replace(/\s/g, ""))) {
      setError("Enter a valid number with country code e.g. +919876543210");
      return;
    }
    setLoading(true);
    try {
      await registerNotification(medicine, number);
      setDone(true);
    } catch {
      setError("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-line rounded-2xl w-full max-w-sm p-6">
        {done ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-3">✓</div>
            <div className="font-serif font-semibold text-lg text-ink mb-1">Notification registered</div>
            <div className="text-sm text-ink-faded mb-4">
              We'll WhatsApp you on <span className="font-mono">{number}</span> when <strong>{medicine}</strong> becomes available nearby.
            </div>
            <div className="text-xs text-ink-faded font-mono mb-4 bg-paper rounded-lg p-3">
              Note: send "join medguard" to +14155238886 on WhatsApp to opt in to the sandbox first.
            </div>
            <button onClick={onClose} className="btn-fill w-full justify-center">Done</button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="font-serif font-semibold text-lg text-ink">Get notified</div>
              <button onClick={onClose} className="text-ink-faded hover:text-ink text-xl leading-none">×</button>
            </div>
            <div className="text-sm text-ink-faded mb-4">We'll WhatsApp you when <strong>{medicine}</strong> is back in stock nearby.</div>
            <label className="block text-xs font-mono text-ink-faded uppercase tracking-wider mb-1.5">WhatsApp number</label>
            <input type="tel" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+91 98765 43210" className="input-field mb-1" />
            {error && <div className="text-red text-xs font-mono mb-3 mt-1.5">{error}</div>}
            <button onClick={handleSubmit} disabled={loading} className="btn-fill w-full justify-center mt-4">{loading ? "Registering..." : "Notify me →"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

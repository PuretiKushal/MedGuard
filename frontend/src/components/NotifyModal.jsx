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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        {done ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-3">✓</div>
            <div className="font-semibold text-gray-900 mb-1">Notification registered</div>
            <div className="text-sm text-gray-500 mb-4">
              We'll send you a WhatsApp message on <span className="font-mono">{number}</span> when <strong>{medicine}</strong> becomes available nearby.
            </div>
            <div className="text-xs text-gray-400 font-mono mb-4">
              Note: You must be opted into the MedGuard WhatsApp sandbox to receive messages. Send "join medguard" to +14155238886 on WhatsApp to opt in.
            </div>
            <button onClick={onClose} className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">Done</button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-gray-900">Get notified when available</div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="text-sm text-gray-500 mb-4">
              We'll WhatsApp you when <strong>{medicine}</strong> is back in stock at a nearby facility.
            </div>
            <label className="block text-xs font-mono text-gray-500 uppercase tracking-wider mb-1.5">
              WhatsApp Number
            </label>
            <input
              type="tel"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-red-400 transition-colors mb-1"
            />
            {error && <div className="text-red-500 text-xs font-mono mb-3">{error}</div>}
            <div className="text-xs text-gray-400 font-mono mb-4">
              You must be opted into our WhatsApp sandbox to receive alerts.
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Registering..." : "Notify me →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

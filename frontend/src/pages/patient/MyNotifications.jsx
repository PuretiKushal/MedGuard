import { useState } from "react";
import { getMyNotifications } from "../../utils/api";

export default function MyNotifications() {
  const [number, setNumber] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!number.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await getMyNotifications(number);
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-7">
        <h1 className="font-serif font-semibold text-2xl text-ink mb-2">Track my notifications</h1>
        <p className="text-ink-faded text-sm">Check what medicines you've asked to be notified about.</p>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2 mb-8">
        <input
          type="tel" value={number} onChange={(e) => setNumber(e.target.value)}
          placeholder="+91 98765 43210" className="input-field flex-1"
        />
        <button type="submit" disabled={loading} className="btn-fill">{loading ? "..." : "Check"}</button>
      </form>

      {searched && (
        <div>
          {results === null || loading ? null : results.length === 0 ? (
            <div className="text-center py-10 border border-line rounded-xl">
              <div className="text-ink-faded text-sm font-mono">No notification requests found for this number.</div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {results.map((n, i) => (
                <div key={i} className="border border-line rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-mono font-medium text-ink">{n.medicine_name}</div>
                    <div className="text-xs text-ink-faded font-mono mt-0.5">Requested {new Date(n.created_at).toLocaleDateString("en-IN")}</div>
                  </div>
                  <span className={n.notified ? "stamp-safe" : "stamp-warning"}>{n.notified ? "✓ Notified" : "◆ Waiting"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

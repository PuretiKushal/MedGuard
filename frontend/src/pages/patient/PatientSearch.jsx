import { useState, useRef } from "react";
import { searchMedicine, registerNotification, scanPrescription } from "../../utils/api";
import MapView from "../../components/MapView";
import NotifyModal from "../../components/NotifyModal";

export default function PatientSearch() {
  const [query, setQuery] = useState("");
  const [govtOnly, setGovtOnly] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifyMed, setNotifyMed] = useState(null);
  const [prescFile, setPrescFile] = useState(null);
  const [prescResult, setPrescResult] = useState(null);
  const [prescLoading, setPrescLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const prescRef = useRef();

  // Default to Visakhapatnam centre
  const LAT = 17.7231;
  const LNG = 83.3012;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await searchMedicine(query, LAT, LNG, govtOnly);
      setResults(res.data);
    } catch {
      setResults({ found: false, results: [], substitutes: [] });
    } finally {
      setLoading(false);
    }
  };

  const handlePrescScan = async () => {
    if (!prescFile) return;
    setPrescLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", prescFile);
      const res = await scanPrescription(fd, LAT, LNG);
      setPrescResult(res.data);
    } catch {
      setPrescResult({ error: true });
    } finally {
      setPrescLoading(false);
    }
  };

  const statusColor = (status) => ({
    safe: "text-safe border-safe/30 bg-safe-bg",
    warning: "text-warning border-warning/30 bg-warning-bg",
    critical: "text-critical border-critical/30 bg-critical-bg",
    expired: "text-expired border-expired/30 bg-expired-bg",
  }[status] || "text-text-muted");

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold font-mono">M</div>
            <div>
              <div className="text-sm font-semibold text-gray-900">MedGuard</div>
              <div className="text-xs text-gray-400 font-mono">Medicine Finder — Visakhapatnam</div>
            </div>
          </div>
          <a href="/login" className="text-xs text-gray-400 hover:text-gray-700 font-mono transition-colors">
            Facility login →
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Find medicines near you
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Search live stock across government hospitals and pharmacies in Visakhapatnam. Free medicines at government facilities are clearly marked.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-1 mb-8 bg-gray-100 rounded-lg p-1 max-w-xs mx-auto">
          {["search", "prescription"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                activeTab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {t === "prescription" ? "Scan Prescription" : "Search Medicine"}
            </button>
          ))}
        </div>

        {/* Search tab */}
        {activeTab === "search" && (
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2 max-w-xl mx-auto">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Medicine name or salt — e.g. Paracetamol, Dolo, azithromycin"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-red-400 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? "..." : "Search"}
              </button>
            </div>
            <div className="flex justify-center mt-3">
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={govtOnly}
                  onChange={(e) => setGovtOnly(e.target.checked)}
                  className="accent-red-600"
                />
                Government hospitals only (free medicines)
              </label>
            </div>
          </form>
        )}

        {/* Prescription tab */}
        {activeTab === "prescription" && (
          <div className="max-w-xl mx-auto mb-8">
            <div
              onClick={() => prescRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                prescFile ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-red-300"
              }`}
            >
              {prescFile ? (
                <div>
                  <div className="text-green-600 font-medium text-sm mb-1">✓ {prescFile.name}</div>
                  <div className="text-gray-400 text-xs">Click to change file</div>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-2 text-gray-300">📄</div>
                  <div className="text-gray-600 text-sm font-medium">Upload typed/printed prescription</div>
                  <div className="text-gray-400 text-xs mt-1">JPG or PNG — system will detect all medicines</div>
                </div>
              )}
              <input ref={prescRef} type="file" accept=".jpg,.jpeg,.png" className="hidden"
                onChange={(e) => { if (e.target.files[0]) setPrescFile(e.target.files[0]); }} />
            </div>
            <button
              onClick={handlePrescScan}
              disabled={!prescFile || prescLoading}
              className="mt-4 w-full py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40"
            >
              {prescLoading ? "Scanning prescription..." : "Scan & Find Medicines"}
            </button>
            {prescResult && !prescResult.error && (
              <div className="mt-4 border border-gray-100 rounded-xl p-4">
                <div className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Detected medicines</div>
                {prescResult.detected_medicines?.length > 0 ? (
                  <div className="space-y-2">
                    {prescResult.detected_medicines.map((m, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm font-mono text-gray-800">{m}</span>
                        <button
                          onClick={() => { setActiveTab("search"); setQuery(m); }}
                          className="text-xs text-red-600 hover:underline font-mono"
                        >
                          Search →
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 font-mono">No medicines detected — ensure the prescription is clearly printed.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="animate-fade-in">
            {results.found ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-gray-700">
                    {results.results.length} facilities found with <span className="font-mono font-semibold">{query}</span>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">Ranked by stock quality + proximity</div>
                </div>

                {/* Map */}
                <div className="rounded-xl overflow-hidden border border-gray-100 mb-5" style={{ height: 320 }}>
                  <MapView results={results.results} centre={[LAT, LNG]} />
                </div>

                {/* Result cards */}
                <div className="space-y-3">
                  {results.results.map((r, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">{r.facility_name}</span>
                            {r.is_free && (
                              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-mono">FREE</span>
                            )}
                            {r.facility_type === "government_hospital" && (
                              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-mono">GOVT</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">{r.address}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono text-gray-500">{r.distance_km} km away</div>
                          <div className="text-xs text-gray-400 mt-0.5">Score: {r.stock_score}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className={`px-2 py-0.5 rounded border ${statusColor(r.expiry_status)}`}>
                          {r.expiry_status?.toUpperCase()} · {r.days_remaining}d
                        </span>
                        <span className="text-gray-500">Qty: {r.quantity} units</span>
                        {r.mrp && <span className="text-gray-500">MRP: ₹{r.mrp}</span>}
                        {r.phone && <span className="text-gray-500">📞 {r.phone}</span>}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <a
                          href={`https://www.openstreetmap.org/directions?to=${r.latitude},${r.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-red-300 hover:text-red-600 transition-colors font-mono"
                        >
                          Get directions →
                        </a>
                        <button
                          onClick={() => setNotifyMed(query)}
                          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-red-300 hover:text-red-600 transition-colors font-mono"
                        >
                          🔔 Notify me when stock changes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border border-gray-100 rounded-xl">
                <div className="text-3xl mb-3">🔍</div>
                <div className="text-gray-700 font-medium mb-1">{query} not found nearby</div>
                <div className="text-gray-400 text-sm mb-5">No facilities within 10km have this medicine in stock.</div>
                {results.substitutes?.length > 0 && (
                  <div className="max-w-sm mx-auto text-left">
                    <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">Generic substitutes available</div>
                    <div className="space-y-2">
                      {results.substitutes.map((s, i) => (
                        <div key={i} className="border border-gray-100 rounded-lg p-3">
                          <div className="text-sm font-mono font-medium text-gray-800">{s.medicine_name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{s.facility_name} · {s.distance_km}km
                            {s.is_free && <span className="text-green-600 ml-1">· FREE</span>}
                            {s.mrp && <span className="ml-1">· ₹{s.mrp}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setNotifyMed(query)}
                  className="mt-5 px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  🔔 Notify me when available
                </button>
              </div>
            )}
          </div>
        )}

        {/* SDG footer */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-center gap-6 text-xs text-gray-300 font-mono">
          <span>SDG 3 · Good Health</span>
          <span>·</span>
          <span>SDG 12 · Responsible Consumption</span>
          <span>·</span>
          <span>Visakhapatnam, Andhra Pradesh</span>
        </div>
      </div>

      {notifyMed && (
        <NotifyModal
          medicine={notifyMed}
          onClose={() => setNotifyMed(null)}
        />
      )}
    </div>
  );
}

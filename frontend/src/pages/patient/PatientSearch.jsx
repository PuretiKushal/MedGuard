import { useState, useRef, useEffect } from "react";
import { searchMedicine, scanPrescription } from "../../utils/api";
import { useGeolocation, getDirectionsUrl } from "../../hooks/useGeolocation";
import MapView from "../../components/MapView";
import NotifyModal from "../../components/NotifyModal";
import { Link, useSearchParams } from "react-router-dom";

const stampClass = (status) => ({
  safe: "stamp-safe", warning: "stamp-warning", critical: "stamp-critical", expired: "stamp-expired",
}[status] || "stamp-safe");

export default function PatientSearch() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [govtOnly, setGovtOnly] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifyMed, setNotifyMed] = useState(null);
  const [prescFile, setPrescFile] = useState(null);
  const [prescResult, setPrescResult] = useState(null);
  const [prescLoading, setPrescLoading] = useState(false);
  const [mode, setMode] = useState("search");
  const prescRef = useRef();
  const { location, isPrecise, status, requestLocation } = useGeolocation();

  useEffect(() => {
    if (params.get("q")) {
      doSearch(params.get("q"));
    }
  }, []);

  const doSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await searchMedicine(q, location.lat, location.lng, govtOnly);
      let data = res.data;
      if (data.found && data.results.length > 0) {
        const minDist = Math.min(...data.results.map((r) => r.distance_km));
        const minPrice = Math.min(...data.results.filter((r) => r.mrp).map((r) => r.mrp));
        data.results = data.results.map((r) => ({
          ...r,
          isNearest: r.distance_km === minDist,
          isCheapest: r.mrp === minPrice,
        }));
      }
      setResults(data);
    } catch {
      setResults({ found: false, results: [], substitutes: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => { e.preventDefault(); doSearch(query); };

  const handlePrescScan = async () => {
    if (!prescFile) return;
    setPrescLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", prescFile);
      const res = await scanPrescription(fd, location.lat, location.lng);
      setPrescResult(res.data);
    } catch {
      setPrescResult({ error: true });
    } finally {
      setPrescLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="font-serif font-semibold text-3xl text-ink mb-3">Find medicines near you</h1>
        <p className="text-ink-faded text-sm max-w-md mx-auto">
          Search live stock across government hospitals and pharmacies in Visakhapatnam.
        </p>
      </div>

      {status === "idle" && (
        <div className="max-w-md mx-auto mb-6 flex items-center justify-between bg-amber-light border border-amber/20 rounded-lg px-4 py-3">
          <span className="text-xs text-ink font-mono">Enable location for accurate nearby results & directions</span>
          <button onClick={requestLocation} className="text-xs font-mono text-amber border-b border-amber pb-0.5 whitespace-nowrap ml-3">Allow →</button>
        </div>
      )}
      {status === "granted" && (
        <div className="max-w-md mx-auto mb-6 text-center text-xs font-mono text-green">📍 Using your precise location</div>
      )}

      <div className="flex justify-center gap-1 mb-8 bg-paper rounded-lg p-1 max-w-xs mx-auto">
        {["search", "prescription"].map((t) => (
          <button key={t} onClick={() => setMode(t)} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${mode === t ? "bg-white text-ink shadow-sm" : "text-ink-faded"}`}>
            {t === "prescription" ? "Scan prescription" : "Search medicine"}
          </button>
        ))}
      </div>

      {mode === "search" && (
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2 max-w-xl mx-auto">
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Medicine name or salt — e.g. Paracetamol, Dolo" className="flex-1 border border-line rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-green transition-colors" />
            <button type="submit" disabled={loading} className="btn-fill px-6">{loading ? "..." : "Search"}</button>
          </div>
          <div className="flex justify-center mt-3">
            <label className="flex items-center gap-2 text-xs text-ink-faded cursor-pointer">
              <input type="checkbox" checked={govtOnly} onChange={(e) => setGovtOnly(e.target.checked)} className="accent-green" />
              Government hospitals only (free medicines)
            </label>
          </div>
        </form>
      )}

      {mode === "prescription" && (
        <div className="max-w-xl mx-auto mb-8">
          <div onClick={() => prescRef.current?.click()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${prescFile ? "border-green bg-green-light" : "border-line hover:border-red/40"}`}>
            {prescFile ? (
              <div><div className="text-green font-medium text-sm mb-1">✓ {prescFile.name}</div><div className="text-ink-faded text-xs">Click to change file</div></div>
            ) : (
              <div><div className="text-3xl mb-2 text-ink-faded">📄</div><div className="text-ink text-sm font-medium">Upload typed/printed prescription</div><div className="text-ink-faded text-xs mt-1">JPG or PNG</div></div>
            )}
            <input ref={prescRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files[0]) setPrescFile(e.target.files[0]); }} />
          </div>
          <button onClick={handlePrescScan} disabled={!prescFile || prescLoading} className="btn-fill w-full mt-4 justify-center">
            {prescLoading ? "Scanning..." : "Scan & find medicines"}
          </button>
          {prescResult && !prescResult.error && (
            <div className="mt-4 border border-line rounded-xl p-4">
              <div className="label mb-2">Detected medicines</div>
              {prescResult.detected_medicines?.length > 0 ? (
                <div className="space-y-2">
                  {prescResult.detected_medicines.map((m, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-mono text-ink">{m}</span>
                      <button onClick={() => { setMode("search"); setQuery(m); doSearch(m); }} className="text-xs text-red hover:underline font-mono">Search →</button>
                    </div>
                  ))}
                </div>
              ) : <div className="text-xs text-ink-faded font-mono">No medicines detected.</div>}
            </div>
          )}
        </div>
      )}

      {results && (
        <div>
          {results.found ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-ink">{results.results.length} facilities found with <span className="font-mono font-semibold">{query}</span></div>
              </div>
              <div className="rounded-xl overflow-hidden border border-line mb-5" style={{ height: 320 }}>
                <MapView results={results.results} centre={[location.lat, location.lng]} />
              </div>
              <div className="space-y-3">
                {results.results.map((r, i) => (
                  <div key={i} className="border border-line rounded-xl p-5 hover:border-ink-faded/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={`/search/facility/${r.facility_id}`} className="text-sm font-semibold text-ink hover:text-green">{r.facility_name}</Link>
                          {r.is_free && <span className="text-xs bg-green-light text-green px-2 py-0.5 rounded-full font-mono">FREE</span>}
                          {r.facility_type === "government_hospital" && <span className="text-xs bg-paper text-ink-faded border border-line px-2 py-0.5 rounded-full font-mono">GOVT</span>}
                          {r.isNearest && <span className="text-xs bg-amber-light text-amber px-2 py-0.5 rounded-full font-mono">NEAREST</span>}
                          {r.isCheapest && <span className="text-xs bg-red-light text-red px-2 py-0.5 rounded-full font-mono">CHEAPEST</span>}
                        </div>
                        <div className="text-xs text-ink-faded font-mono">{r.address}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono text-ink-faded">{r.distance_km} km away</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className={stampClass(r.expiry_status)}>{r.expiry_status?.toUpperCase()} · {r.days_remaining}d</span>
                      <span className="text-ink-faded">Qty: {r.quantity} units</span>
                      {r.mrp && <span className="text-ink-faded">MRP: ₹{r.mrp}</span>}
                      {r.phone && <span className="text-ink-faded">📞 {r.phone}</span>}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <a href={getDirectionsUrl(location.lat, location.lng, r.latitude, r.longitude, isPrecise)} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 border border-line rounded-lg text-ink-faded hover:border-red/40 hover:text-red transition-colors font-mono">
                        Get directions →
                      </a>
                      {!isPrecise && (
                        <button onClick={requestLocation} className="text-xs px-3 py-1.5 border border-line rounded-lg text-ink-faded hover:border-green/40 hover:text-green transition-colors font-mono">
                          Use my location
                        </button>
                      )}
                      <button onClick={() => setNotifyMed(query)} className="text-xs px-3 py-1.5 border border-line rounded-lg text-ink-faded hover:border-red/40 hover:text-red transition-colors font-mono">
                        🔔 Notify on change
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border border-line rounded-xl">
              <div className="text-3xl mb-3">🔍</div>
              <div className="text-ink font-medium mb-1">{query} not found nearby</div>
              <div className="text-ink-faded text-sm mb-5">No facilities within 10km have this medicine in stock.</div>
              {results.substitutes?.length > 0 && (
                <div className="max-w-sm mx-auto text-left">
                  <div className="label mb-3">Generic substitutes available</div>
                  <div className="space-y-2">
                    {results.substitutes.map((s, i) => (
                      <div key={i} className="border border-line rounded-lg p-3">
                        <div className="text-sm font-mono font-medium text-ink">{s.medicine_name}</div>
                        <div className="text-xs text-ink-faded mt-0.5">{s.facility_name} · {s.distance_km}km{s.is_free && <span className="text-green ml-1">· FREE</span>}{s.mrp && <span className="ml-1">· ₹{s.mrp}</span>}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setNotifyMed(query)} className="btn-fill mt-5">🔔 Notify me when available</button>
            </div>
          )}
        </div>
      )}

      {notifyMed && <NotifyModal medicine={notifyMed} onClose={() => setNotifyMed(null)} />}
    </div>
  );
}

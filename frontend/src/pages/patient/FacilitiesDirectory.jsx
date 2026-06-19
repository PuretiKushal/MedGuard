import { useEffect, useState } from "react";
import { getFacilities } from "../../utils/api";
import { Link } from "react-router-dom";

const TYPE_LABELS = {
  government_hospital: "Government Hospital",
  phc: "PHC",
  private_pharmacy: "Private Pharmacy",
  private_hospital: "Private Hospital",
};

export default function FacilitiesDirectory() {
  const [facilities, setFacilities] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFacilities().then((r) => setFacilities(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = facilities.filter((f) => {
    if (filter === "govt") return f.facility_type === "government_hospital" || f.facility_type === "phc";
    if (filter === "private") return f.facility_type === "private_pharmacy" || f.facility_type === "private_hospital";
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="font-serif font-semibold text-2xl text-ink mb-2">All registered facilities</h1>
        <p className="text-ink-faded text-sm">Hospitals and pharmacies across Visakhapatnam on MedGuard.</p>
      </div>

      <div className="flex gap-1.5 mb-6">
        {[["all", "All"], ["govt", "Government"], ["private", "Private"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${filter === v ? "bg-green text-white" : "bg-paper text-ink-faded border border-line"}`}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-ink-faded font-mono text-sm">Loading facilities...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <Link key={f.id} to={`/search/facility/${f.id}`} className="block border border-line rounded-xl p-5 hover:border-green/40 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-ink">{f.name}</span>
                    {f.is_free_medicines && <span className="text-xs bg-green-light text-green px-2 py-0.5 rounded-full font-mono">FREE</span>}
                    {f.verification_status === "pending_review" && <span className="stamp-unverified">Unverified facility</span>}
                  </div>
                  <div className="text-xs text-ink-faded font-mono">{f.address}, {f.area}</div>
                </div>
                <span className="text-xs font-mono text-ink-faded bg-paper border border-line px-2.5 py-1 rounded-full whitespace-nowrap">{TYPE_LABELS[f.facility_type]}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFacility, getFacilityMedicines } from "../../utils/api";

const stampClass = (status) => ({
  safe: "stamp-safe", warning: "stamp-warning", critical: "stamp-critical", expired: "stamp-expired",
}[status] || "stamp-safe");

export default function FacilityDetail() {
  const { id } = useParams();
  const [facility, setFacility] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFacility(id), getFacilityMedicines(id)])
      .then(([f, m]) => { setFacility(f.data); setMedicines(m.data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-10 text-ink-faded font-mono text-sm">Loading...</div>;
  if (!facility) return <div className="max-w-5xl mx-auto px-6 py-10 text-ink-faded font-mono text-sm">Facility not found.</div>;

  const inStock = medicines.filter((m) => m.quantity > 0 && m.expiry_status !== "expired");

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="font-serif font-semibold text-2xl text-ink">{facility.name}</h1>
          {facility.is_free_medicines && <span className="text-xs bg-green-light text-green px-2 py-0.5 rounded-full font-mono">FREE</span>}
          {facility.verification_status === "pending_review" && <span className="stamp-unverified">Unverified facility</span>}
        </div>
        <div className="text-sm text-ink-faded font-mono">{facility.address}, {facility.area}</div>
        <div className="flex gap-4 mt-2 text-sm text-ink-faded font-mono">
          {facility.phone && <span>📞 {facility.phone}</span>}
        </div>
      </div>

      <div className="label mb-3">{inStock.length} medicines currently in stock</div>
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Medicine</th><th>Generic</th><th>Qty</th><th>MRP</th><th>Expiry</th><th>Status</th></tr></thead>
          <tbody>
            {inStock.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-ink-faded">No stock data available.</td></tr>
            ) : inStock.map((m) => (
              <tr key={m.id}>
                <td className="font-sans font-medium text-ink">{m.name}</td>
                <td className="text-ink-faded">{m.generic_name || "—"}</td>
                <td>{m.quantity}</td>
                <td>{m.mrp ? `₹${m.mrp}` : "—"}</td>
                <td>{m.expiry_date}</td>
                <td><span className={stampClass(m.expiry_status)}>{m.expiry_status?.toUpperCase()}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

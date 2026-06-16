import { useEffect, useState } from "react";
import { getRedistributionSuggestions, getStockoutPredictions, getSupplierScores } from "../../utils/api";

function Section({ title, sub, children }) {
  return (
    <div className="card mb-5">
      <div className="card-header">
        <div>
          <div className="section-label">{title}</div>
          <div className="text-sm font-medium text-text-primary mt-0.5">{sub}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Intelligence() {
  const [redistribution, setRedistribution] = useState([]);
  const [stockout, setStockout] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getRedistributionSuggestions(),
      getStockoutPredictions(),
      getSupplierScores(),
    ]).then(([r, s, sup]) => {
      setRedistribution(r.data);
      setStockout(s.data);
      setSuppliers(sup.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-text-muted font-mono text-sm animate-pulse">Loading intelligence...</div>;

  return (
    <div className="p-8 animate-fade-in max-w-4xl">
      <div className="mb-8">
        <div className="section-label mb-1">Intelligence</div>
        <h1 className="text-xl font-semibold text-text-primary">System Insights</h1>
        <p className="text-text-secondary text-sm mt-1">Automated analysis running across all facilities.</p>
      </div>

      {/* Redistribution */}
      <Section title="Redistribution Opportunities" sub="Near-expiry surplus at one facility, shortage at another">
        {redistribution.length === 0 ? (
          <div className="px-5 py-8 text-center text-text-muted font-mono text-sm">No redistribution opportunities identified.</div>
        ) : redistribution.map((r, i) => (
          <div key={i} className="px-5 py-4 border-b border-border/50 last:border-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-mono text-text-primary mb-1">{r.medicine}</div>
                <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
                  <span className="text-warning">{r.from_facility}</span>
                  <span className="text-text-muted">→</span>
                  <span className="text-safe">{r.to_facility}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-critical">{r.days_remaining}d remaining</div>
                <div className="text-xs font-mono text-text-muted mt-0.5">{r.available_qty} units available</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-text-muted font-mono bg-surface-2 rounded px-3 py-2">
              Suggested action: Transfer up to {Math.floor(r.available_qty / 2)} units to {r.to_facility} before expiry
            </div>
          </div>
        ))}
      </Section>

      {/* Stockout predictions */}
      <Section title="Stockout Predictions" sub="Medicines projected to run out based on current consumption rate">
        {stockout.length === 0 ? (
          <div className="px-5 py-8 text-center text-text-muted font-mono text-sm">No stockout risks detected.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Current Stock</th>
                <th>Est. Days Until Stockout</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {stockout.map((s, i) => (
                <tr key={i}>
                  <td className="font-medium text-text-primary">{s.medicine}</td>
                  <td>{s.current_quantity} units</td>
                  <td className={s.estimated_days_until_stockout < 7 ? "text-critical" : "text-warning"}>
                    ~{s.estimated_days_until_stockout} days
                  </td>
                  <td>
                    <span className={s.estimated_days_until_stockout < 7 ? "badge-critical" : "badge-warning"}>
                      {s.estimated_days_until_stockout < 7 ? "HIGH" : "MEDIUM"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Supplier scores */}
      <Section title="Supplier Quality Scores" sub="Average remaining shelf life at delivery per supplier">
        {suppliers.length === 0 ? (
          <div className="px-5 py-8 text-center text-text-muted font-mono text-sm">No supplier data available.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Avg Shelf Life at Delivery</th>
                <th>Batches Tracked</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s, i) => (
                <tr key={i}>
                  <td className="font-medium text-text-primary">{s.supplier}</td>
                  <td className={s.avg_shelf_life_days < 120 ? "text-warning" : "text-safe"}>
                    {s.avg_shelf_life_days} days
                  </td>
                  <td className="text-text-muted">{s.total_batches}</td>
                  <td>
                    {s.flagged ? (
                      <span className="badge-warning">◆ FLAGGED</span>
                    ) : (
                      <span className="badge-safe">✓ GOOD</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

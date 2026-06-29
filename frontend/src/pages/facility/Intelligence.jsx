import { useEffect, useState } from "react";
import { getRedistributionSuggestions, getStockoutPredictions, getSupplierScores } from "../../utils/api";

function Section({ title, sub, children }) {
  return (
    <div className="card mb-5">
      <div className="px-5 py-4 border-b border-line"><div className="label">{title}</div><div className="text-sm font-semibold text-ink mt-0.5">{sub}</div></div>
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
    Promise.all([getRedistributionSuggestions(), getStockoutPredictions(), getSupplierScores()])
      .then(([r, s, sup]) => { setRedistribution(r.data); setStockout(s.data); setSuppliers(sup.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-ink-faded font-mono text-sm">Loading intelligence...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-7">
        <div className="label mb-1">Intelligence</div>
        <h1 className="font-serif font-semibold text-2xl text-ink">System insights</h1>
      </div>

      <Section title="Redistribution opportunities" sub="Near-expiry surplus at one facility, shortage at another">
        {redistribution.length === 0 ? <div className="px-5 py-8 text-center text-ink-faded font-mono text-sm">No redistribution opportunities identified.</div> : redistribution.map((r, i) => (
          <div key={i} className="register-row flex-col items-stretch">
            <div className="flex items-start justify-between w-full">
              <div>
                <div className="text-sm font-mono text-ink mb-1">{r.medicine}</div>
                <div className="flex items-center gap-2 text-xs font-mono text-ink-faded"><span className="text-amber">{r.from_facility}</span><span>→</span><span className="text-green">{r.to_facility}</span></div>
              </div>
              <div className="text-right"><div className="text-xs font-mono text-red">{r.days_remaining}d remaining</div><div className="text-xs font-mono text-ink-faded mt-0.5">{r.available_qty} units</div></div>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Stockout predictions" sub="Medicines projected to run out soon">
        {stockout.length === 0 ? <div className="px-5 py-8 text-center text-ink-faded font-mono text-sm">No stockout risks detected.</div> : (
          <table className="data-table">
            <thead><tr><th>Medicine</th><th>Current stock</th><th>Est. days left</th><th>Risk</th></tr></thead>
            <tbody>{stockout.map((s, i) => (
              <tr key={i}>
                <td className="font-sans font-medium text-ink">{s.medicine}</td><td>{s.current_quantity} units</td>
                <td className={s.estimated_days_until_stockout < 7 ? "text-red" : "text-amber"}>~{s.estimated_days_until_stockout} days</td>
                <td><span className={s.estimated_days_until_stockout < 7 ? "stamp-critical" : "stamp-warning"}>{s.estimated_days_until_stockout < 7 ? "HIGH" : "MEDIUM"}</span></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Section>

      <Section title="Supplier quality scores" sub="Average remaining shelf life at delivery">
        {suppliers.length === 0 ? <div className="px-5 py-8 text-center text-ink-faded font-mono text-sm">No supplier data available.</div> : (
          <table className="data-table">
            <thead><tr><th>Supplier</th><th>Avg shelf life</th><th>Batches</th><th>Status</th></tr></thead>
            <tbody>{suppliers.map((s, i) => (
              <tr key={i}>
                <td className="font-sans font-medium text-ink">{s.supplier}</td>
                <td className={s.avg_shelf_life_days < 120 ? "text-amber" : "text-green"}>{s.avg_shelf_life_days} days</td>
                <td className="text-ink-faded">{s.total_batches}</td>
                <td>{s.flagged ? <span className="stamp-warning">FLAGGED</span> : <span className="stamp-safe">GOOD</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

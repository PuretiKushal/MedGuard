import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  { name: "Fever & Pain", query: "paracetamol", icon: "🌡️" },
  { name: "Diabetes", query: "metformin", icon: "💉" },
  { name: "Blood Pressure", query: "amlodipine", icon: "❤️" },
  { name: "Antibiotics", query: "amoxicillin", icon: "💊" },
  { name: "Allergy", query: "cetirizine", icon: "🤧" },
  { name: "Stomach & Digestive", query: "pantoprazole", icon: "🩺" },
  { name: "Vitamins & Supplements", query: "vitamin d3", icon: "🍊" },
];

export default function BrowseCategories() {
  const navigate = useNavigate();
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-serif font-semibold text-2xl text-ink mb-2">Browse by category</h1>
        <p className="text-ink-faded text-sm">Not sure of the exact medicine name? Start with what it's for.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.name}
            onClick={() => navigate(`/search?q=${encodeURIComponent(c.query)}`)}
            className="text-left border border-line rounded-xl p-5 hover:border-green/40 transition-colors"
          >
            <div className="text-2xl mb-2.5">{c.icon}</div>
            <div className="font-semibold text-sm text-ink mb-1">{c.name}</div>
            <div className="text-xs text-ink-faded font-mono">e.g. {c.query}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

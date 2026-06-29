import { Link } from "react-router-dom";

const ICONS = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#8a611f" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  facility: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1F6F50" strokeWidth="1.8">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
    </svg>
  ),
};

export default function Landing() {
  return (
    <div className="bg-paper min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 md:px-16 py-5 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-green rounded-md flex items-center justify-center">
            <svg viewBox="0 0 18 18" fill="none"><path d="M9 2v14M2 9h14" stroke="white" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </div>
          <span className="font-serif font-semibold text-lg text-ink">MedGuard</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm text-ink-faded font-medium">
          <a href="#how" className="hover:text-ink transition-colors">How it works</a>
          <a href="#facility" className="hover:text-ink transition-colors">For facilities</a>
        </div>
        <div className="flex gap-2.5">
          <Link to="/search" className="btn-outline text-sm">Find a medicine</Link>
          <Link to="/login" className="btn-fill text-sm">Facility sign in</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto px-6 pt-20 pb-16">
        <span className="label block mb-5">Medicine expiry &amp; waste alert system</span>
        <h1 className="font-serif font-semibold text-[42px] md:text-[54px] leading-[1.12] tracking-tight mb-6 text-ink">
          Every expired medicine<br />
          is a <em className="italic text-green">failure of tracking,</em><br />
          not of medicine.
        </h1>
        <p className="text-[17px] text-ink-faded leading-relaxed max-w-lg mx-auto mb-9">
          MedGuard watches expiry dates across hospitals and pharmacies in Visakhapatnam, alerts staff before stock is wasted, and helps patients find what they need nearby.
        </p>
        <div className="flex flex-wrap gap-3.5 justify-center">
          <Link to="/search" className="btn-fill text-[15px] px-7 py-3.5">Find a medicine near me →</Link>
          <Link to="/register" className="btn-outline text-[15px] px-7 py-3.5">Register your facility</Link>
        </div>
      </div>

      {/* Two paths */}
      <div id="how" className="grid md:grid-cols-2 border-t border-line">
        <div className="p-12 md:p-16 border-b md:border-b-0 md:border-r border-line">
          <div className="w-[42px] h-[42px] rounded-lg bg-amber-light flex items-center justify-center mb-5">
            <div className="w-[22px] h-[22px]">{ICONS.search}</div>
          </div>
          <h3 className="font-serif font-semibold text-[22px] mb-2.5 text-ink">Looking for a medicine?</h3>
          <p className="text-sm text-ink-faded leading-relaxed mb-5 max-w-sm">
            Search by brand or generic name and see live stock at nearby government hospitals and pharmacies — including which ones offer it free, which is nearest, and which is cheapest.
          </p>
          <Link to="/search" className="font-mono text-xs text-ink border-b border-ink pb-0.5">
            SEARCH AS A PATIENT →
          </Link>
        </div>
        <div id="facility" className="p-12 md:p-16">
          <div className="w-[42px] h-[42px] rounded-lg bg-green-light flex items-center justify-center mb-5">
            <div className="w-[22px] h-[22px]">{ICONS.facility}</div>
          </div>
          <h3 className="font-serif font-semibold text-[22px] mb-2.5 text-ink">Run a hospital or pharmacy?</h3>
          <p className="text-sm text-ink-faded leading-relaxed mb-5 max-w-sm">
            Upload distributor invoices, get automatic expiry alerts via WhatsApp and email, track disposal of expired stock, and generate compliance reports in one click.
          </p>
          <Link to="/register" className="font-mono text-xs text-ink border-b border-ink pb-0.5">
            REGISTER YOUR FACILITY →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border-t border-line">
        {[
          { num: "SDG 3", lbl: "Good health & well-being" },
          { num: "SDG 12", lbl: "Responsible consumption" },
          { num: "VSKP", lbl: "Visakhapatnam, Andhra Pradesh" },
        ].map((s, i) => (
          <div key={s.num} className={`py-9 text-center ${i < 2 ? "border-r border-line" : ""}`}>
            <div className="font-serif font-semibold text-[34px] text-green">{s.num}</div>
            <div className="label mt-1.5">{s.lbl}</div>
          </div>
        ))}
      </div>

      <footer className="text-center py-6 label">
        MedGuard — built as a Community Service Project · VIIT Visakhapatnam
      </footer>
    </div>
  );
}

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../utils/api";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await login(email, password);
      loginUser(res.data.user, res.data.token);
      navigate("/facility/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex">
      <div className="hidden lg:flex w-1/2 bg-white border-r border-line flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green rounded-md flex items-center justify-center">
            <svg viewBox="0 0 18 18" fill="none"><path d="M9 2v14M2 9h14" stroke="white" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </div>
          <span className="font-serif font-semibold text-ink">MedGuard</span>
        </Link>
        <div>
          <div className="label mb-4">Medicine expiry & waste alert system</div>
          <h1 className="font-serif font-semibold text-4xl text-ink leading-tight mb-6">
            Every expired<br />medicine is a<br /><em className="italic text-green">failure of tracking.</em>
          </h1>
          <p className="text-ink-faded text-sm leading-relaxed max-w-sm">
            MedGuard monitors expiry dates across your facilities, alerts your team before it's too late, and helps patients find the medicines they need.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{ l: "SDG 3", s: "Good Health" }, { l: "SDG 12", s: "Responsible Use" }, { l: "Vizag", s: "Visakhapatnam" }].map((s) => (
            <div key={s.l} className="bg-paper rounded-lg p-3 border border-line">
              <div className="font-mono text-sm font-semibold text-green">{s.l}</div>
              <div className="text-xs text-ink-faded mt-0.5">{s.s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-serif font-semibold text-2xl text-ink mb-1">Facility sign in</h2>
            <p className="text-ink-faded text-sm">Access your pharmacy or hospital dashboard</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-ink-faded uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@kgh.in" className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-mono text-ink-faded uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-field" required />
            </div>
            {error && <div className="text-red text-xs font-mono bg-red-light border border-red/20 rounded-lg px-3 py-2">{error}</div>}
            <button type="submit" className="btn-fill w-full justify-center mt-2" disabled={loading}>{loading ? "Signing in..." : "Sign in →"}</button>
          </form>

          <div className="mt-8 pt-6 border-t border-line">
            <div className="text-xs text-ink-faded font-mono mb-3">Demo credentials</div>
            <div className="space-y-1.5">
              {[["KGH", "admin@kgh.in", "kgh@2024"], ["VIMSAR", "admin@vimsar.in", "vimsar@2024"], ["Apollo", "admin@apollo.in", "apollo@2024"]].map(([name, e, p]) => (
                <button key={name} onClick={() => { setEmail(e); setPassword(p); }} className="w-full text-left px-3 py-2 rounded-md bg-paper border border-line hover:border-green/40 transition-colors">
                  <span className="text-xs font-mono text-ink">{name}</span><span className="text-xs font-mono text-ink-faded ml-2">{e}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 flex justify-between text-xs font-mono">
            <Link to="/search" className="text-ink-faded hover:text-green transition-colors">→ Patient portal</Link>
            <Link to="/register" className="text-ink-faded hover:text-green transition-colors">Register facility →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    setError("");
    setLoading(true);
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
    <div className="min-h-screen bg-base flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-surface border-r border-border flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-critical rounded flex items-center justify-center text-white font-bold font-mono">M</div>
          <span className="text-text-primary font-semibold">MedGuard</span>
        </div>
        <div>
          <div className="section-label mb-4">Medicine Expiry & Waste Alert System</div>
          <h1 className="text-4xl font-bold text-text-primary leading-tight mb-6">
            Every expired<br />medicine is a<br />
            <span className="text-critical">failure of tracking.</span>
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed max-w-sm">
            MedGuard monitors expiry dates across all your facilities, alerts your team before it's too late, and helps patients find the medicines they need.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "SDG 3", sub: "Good Health" },
            { label: "SDG 12", sub: "Responsible Consumption" },
            { label: "Vizag", sub: "Visakhapatnam, AP" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-2 rounded-lg p-3 border border-border">
              <div className="font-mono text-sm font-semibold text-accent">{s.label}</div>
              <div className="text-xs text-text-muted mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-1">Facility sign in</h2>
            <p className="text-text-secondary text-sm">Access your pharmacy or hospital dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kgh.in"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
            </div>
            {error && (
              <div className="text-critical text-xs font-mono bg-critical-bg border border-critical/20 rounded px-3 py-2">
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-xs text-text-muted font-mono mb-3">Demo credentials</div>
            <div className="space-y-1.5">
              {[
                ["KGH", "admin@kgh.in", "kgh@2024"],
                ["VIMSAR", "admin@vimsar.in", "vimsar@2024"],
                ["Apollo", "admin@apollo.in", "apollo@2024"],
              ].map(([name, email, pass]) => (
                <button
                  key={name}
                  onClick={() => { setEmail(email); setPassword(pass); }}
                  className="w-full text-left px-3 py-2 rounded bg-surface-2 border border-border hover:border-accent/40 transition-colors"
                >
                  <span className="text-xs font-mono text-text-secondary">{name}</span>
                  <span className="text-xs font-mono text-text-muted ml-2">{email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <a href="/" className="text-xs text-text-muted hover:text-accent transition-colors font-mono">
              → Patient Portal (no login needed)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

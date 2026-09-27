import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCommerce } from "../context/index.js";

export default function WebLoginPrompt({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useCommerce();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email address and password to continue.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const user = await login(email.trim(), password);
      const destination = user?.role === "admin"
        ? "/admin/dashboard"
        : user?.role === "delivery_agent"
          ? "/delivery-agent"
          : `${location.pathname}${location.search}`;
      onClose();
      navigate(destination || "/", { replace: true });
    } catch (loginError) {
      setError(loginError.message || "Unable to sign in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#061426]/65 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="relative grid max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl md:min-h-[540px] md:grid-cols-[0.82fr_1.18fr]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-login-title"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign-in dialog"
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <X size={21} />
        </button>

        <div className="hidden flex-col justify-between bg-[#071426] p-9 text-white md:flex">
          <div>
            <p className="text-sm font-bold uppercase text-amber-400">Honey Vision</p>
            <h2 className="mt-10 text-3xl font-bold leading-tight">A smarter way to shop for technology.</h2>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">
              Sign in to keep your orders, saved products, and delivery updates together.
            </p>
          </div>
          <div className="flex items-center gap-3 border-t border-white/15 pt-5 text-sm text-slate-300">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-400 font-black text-[#071426]">H</span>
            Technology, made easier.
          </div>
        </div>

        <div className="flex items-center px-5 py-12 sm:px-10 md:px-12">
          <div className="mx-auto w-full max-w-md">
            <p className="text-xs font-bold uppercase text-amber-600 md:hidden">Honey Vision</p>
            <h1 id="entry-login-title" className="mt-2 text-2xl font-bold text-[#071426] sm:text-3xl">
              Sign in to continue
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Access your orders, wishlist, and personalized recommendations.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Email address
                <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-amber-500">
                  <Mail size={18} className="shrink-0 text-slate-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="min-w-0 flex-1 bg-transparent text-sm font-normal outline-none"
                  />
                </span>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Password
                <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-amber-500">
                  <Lock size={18} className="shrink-0 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="min-w-0 flex-1 bg-transparent text-sm font-normal outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="grid h-8 w-8 shrink-0 place-items-center text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>

              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end">
                <Link to="/forgot-password" onClick={onClose} className="text-sm font-semibold text-blue-700 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-lg bg-[#071426] px-4 font-bold text-white transition hover:bg-[#123563] disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              New to Honey Vision? <Link to="/register" onClick={onClose} className="font-bold text-blue-700 hover:underline">Create an account</Link>
            </p>
            <div className="mt-5 flex items-center justify-center gap-4 text-xs text-slate-500">
              <Link to="/login" onClick={onClose} className="hover:text-blue-700">More sign-in options</Link>
              <span aria-hidden="true">|</span>
              <button type="button" onClick={onClose} className="hover:text-blue-700">Continue browsing</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
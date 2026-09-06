import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCommerce } from "../context/index.js";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ResetPasswordImage = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786189628/login_odyhdp.png";

export default function ResetPassword() {
  const { token: routeToken = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useCommerce();
  const token = routeToken || searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [linkValid, setLinkValid] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let active = true;

    if (!token) {
      setLinkValid(false);
      setValidating(false);
      return undefined;
    }

    fetch(`${API_BASE}/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Invalid or expired token");
        return true;
      })
      .then((valid) => {
        if (active) setLinkValid(valid);
      })
      .catch(() => {
        if (active) setLinkValid(false);
      })
      .finally(() => {
        if (active) setValidating(false);
      });
    return () => { active = false; };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      setError("This password reset link is invalid or has expired.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("This password reset link is invalid or has expired.");
      setLinkValid(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await resetPassword({ token, password, confirmPassword });
      setMessage(data?.message || "Password updated successfully. Please login with your new password.");
      setCompleted(true);
      setPassword("");
      setConfirmPassword("");
      window.setTimeout(() => navigate("/login", { state: { message: data?.message } }), 1500);
    } catch (requestError) {
      setError(requestError.message || "This password reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#071426] via-[#0B315A] to-[#102D4E] flex items-center justify-center p-8">
      <div className="w-full max-w-7xl bg-white rounded-[35px] overflow-hidden shadow-2xl">
        <div className="grid lg:grid-cols-2 min-h-[720px]">
          <div className="relative bg-[#071426] overflow-hidden">
            <div className="relative z-10 flex flex-col justify-center items-center h-full px-12 text-center">
              <img src={ResetPasswordImage} alt="Honey Vision" className="w-[520px] object-contain drop-shadow-2xl" />
              <h1 className="text-white text-5xl font-bold mt-10 leading-tight">Reset Your <span className="block text-yellow-400">Password</span></h1>
            </div>
          </div>

          <div className="flex items-center justify-center px-10 lg:px-16 py-12 bg-white">
            <div className="w-full max-w-md">
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-[#071426] flex items-center justify-center shadow-lg">
                  <span className="text-yellow-400 text-4xl font-bold">H</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-4xl font-bold text-[#071426]">Reset Password</h2>
                <Link to="/login" className="text-yellow-500 hover:underline flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16} /> Back to login</Link>
              </div>

              {message && <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
              {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

              {validating ? (
                <p className="text-gray-600">Checking your password reset link...</p>
              ) : !completed && linkValid ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <label className="block font-semibold text-gray-700">
                    New Password
                    <div className="mt-3 flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-yellow-500">
                      <div className="px-4 text-gray-400"><KeyRound size={20} /></div>
                      <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a new password" className="w-full px-2 py-4 outline-none" autoComplete="new-password" />
                    </div>
                  </label>
                  <label className="block font-semibold text-gray-700">
                    Confirm Password
                    <div className="mt-3 flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-yellow-500">
                      <div className="px-4 text-gray-400"><ShieldCheck size={20} /></div>
                      <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm your new password" className="w-full px-2 py-4 outline-none" autoComplete="new-password" />
                    </div>
                  </label>
                  <button type="submit" disabled={loading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#071426] font-bold text-lg py-4 rounded-xl transition disabled:opacity-70 disabled:cursor-not-allowed">{loading ? "Updating password..." : "Update Password"}</button>
                </form>
              ) : !completed ? (
                <div className="space-y-5">
                  <p className="text-gray-600">This password reset link is invalid or has expired. Please request a new reset link.</p>
                  <Link to="/forgot-password" className="block w-full text-center border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition">Request a new reset link</Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

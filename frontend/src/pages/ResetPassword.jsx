import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCommerce } from "../context/index.js";

const ResetPasswordImage = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786189628/login_odyhdp.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token: routeToken } = useParams();
  const { resetPassword } = useCommerce();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(routeToken || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (routeToken) setToken(routeToken);
  }, [routeToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !token.trim()) {
      setError("Please enter your email and reset code.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");
      const data = await resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword,
      });
      setMessage(data?.message || "Password reset successfully.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (resetError) {
      setError(resetError.message || "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#071426] via-[#0B315A] to-[#102D4E] p-4 sm:p-8">
      <div className="w-full max-w-7xl overflow-hidden rounded-[28px] bg-white shadow-2xl sm:rounded-[35px]">
        <div className="grid min-h-[640px] lg:grid-cols-2">
          <div className="relative hidden overflow-hidden bg-[#071426] lg:block">
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 text-center">
              <img src={ResetPasswordImage} alt="Honey Vision" className="w-[520px] object-contain drop-shadow-2xl" />
              <h1 className="mt-10 text-5xl font-bold leading-tight text-white">
                Create a
                <span className="block text-yellow-400">New Password</span>
              </h1>
              <p className="mt-6 max-w-md text-lg leading-8 text-gray-300">
                Use your reset code to secure your HoneyVision account again.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center bg-white px-5 py-10 sm:px-10 lg:px-16">
            <div className="w-full max-w-md">
              <div className="mb-8 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#071426] shadow-lg">
                  <span className="text-4xl font-bold text-yellow-400">H</span>
                </div>
              </div>

              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-3xl font-bold text-[#071426] sm:text-4xl">Reset Password</h2>
                <Link to="/login" className="flex shrink-0 items-center gap-2 text-sm font-semibold text-yellow-500 hover:underline">
                  <ArrowLeft size={16} /> Back
                </Link>
              </div>

              {message && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 className="mt-0.5" size={16} />
                  <span>{message}</span>
                </div>
              )}

              {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block font-semibold text-gray-700">
                  Email Address
                  <div className="mt-2 flex items-center overflow-hidden rounded-xl border border-gray-300 focus-within:border-yellow-500">
                    <div className="px-4 text-gray-400"><Mail size={20} /></div>
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your registered email" className="w-full px-2 py-4 outline-none" />
                  </div>
                </label>

                <label className="block font-semibold text-gray-700">
                  Reset Code
                  <div className="mt-2 flex items-center overflow-hidden rounded-xl border border-gray-300 focus-within:border-yellow-500">
                    <div className="px-4 text-gray-400"><ShieldCheck size={20} /></div>
                    <input type="text" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Enter the reset code" className="w-full px-2 py-4 uppercase outline-none" />
                  </div>
                </label>

                <label className="block font-semibold text-gray-700">
                  New Password
                  <div className="mt-2 flex items-center overflow-hidden rounded-xl border border-gray-300 focus-within:border-yellow-500">
                    <div className="px-4 text-gray-400"><KeyRound size={20} /></div>
                    <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Create a new password" className="w-full px-2 py-4 outline-none" />
                  </div>
                </label>

                <label className="block font-semibold text-gray-700">
                  Confirm Password
                  <div className="mt-2 flex items-center overflow-hidden rounded-xl border border-gray-300 focus-within:border-yellow-500">
                    <div className="px-4 text-gray-400"><KeyRound size={20} /></div>
                    <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm your new password" className="w-full px-2 py-4 outline-none" />
                  </div>
                </label>

                <button type="submit" disabled={loading} className="w-full rounded-xl bg-yellow-500 py-4 text-lg font-bold text-[#071426] transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-70">
                  {loading ? "Updating password..." : "Update Password"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Need a new code? <Link to="/forgot-password" className="font-semibold text-yellow-600 hover:underline">Request another reset</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
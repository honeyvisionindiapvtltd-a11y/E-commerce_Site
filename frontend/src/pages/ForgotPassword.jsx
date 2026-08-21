import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";

const ForgotPasswordImage = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786189628/login_odyhdp.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { requestPasswordReset, resetPassword } = useCommerce();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isResetReady = useMemo(() => {
    return email.trim() && token.trim() && newPassword.trim() && confirmPassword.trim();
  }, [email, token, newPassword, confirmPassword]);

  const handleRequestReset = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const data = await requestPasswordReset(email.trim());
      const resetCode = data?.resetToken || "";

      setMessage(
        resetCode
          ? `${data.message} Reset code: ${resetCode}`
          : data?.message || "Password reset code sent. Check your email."
      );
      setToken(resetCode);
      setStep("reset");
    } catch (err) {
      setError(err.message || "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!email.trim() || !token.trim()) {
      setError("Please enter your email and the reset code sent to you.");
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

      setMessage(data?.message || "Password reset successful.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#071426] via-[#0B315A] to-[#102D4E] flex items-center justify-center p-8">
      <div className="w-full max-w-7xl bg-white rounded-[35px] overflow-hidden shadow-2xl">
        <div className="grid lg:grid-cols-2 min-h-[720px]">
          <div className="relative bg-[#071426] overflow-hidden">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-yellow-500/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/20 blur-[120px] rounded-full"></div>

            <div className="relative z-10 flex flex-col justify-center items-center h-full px-12 text-center">
              <img src={ForgotPasswordImage} alt="Honey Vision" className="w-[520px] object-contain drop-shadow-2xl" />
              <h1 className="text-white text-5xl font-bold mt-10 leading-tight">
                Forgot Your
                <span className="block text-yellow-400">Password?</span>
              </h1>
              <p className="text-gray-300 mt-6 text-lg leading-8 max-w-md">
                No worries. Enter your email and we’ll send a secure reset code so you can regain access.
              </p>
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
                <Link to="/login" className="text-yellow-500 hover:underline flex items-center gap-2 text-sm font-semibold">
                  <ArrowLeft size={16} /> Back to login
                </Link>
              </div>

              {message && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5" size={16} />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {step === "email" ? (
                <form onSubmit={handleRequestReset} className="space-y-6">
                  <div>
                    <label className="font-semibold text-gray-700">Email Address</label>
                    <div className="mt-3 flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-yellow-500">
                      <div className="px-4 text-gray-400"><Mail size={20} /></div>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Enter your registered email"
                        className="w-full px-2 py-4 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#071426] font-bold text-lg py-4 rounded-xl transition disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending code..." : "Send Reset Code"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label className="font-semibold text-gray-700">Email Address</label>
                    <div className="mt-3 flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-yellow-500">
                      <div className="px-4 text-gray-400"><Mail size={20} /></div>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-2 py-4 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700">Reset Code</label>
                    <div className="mt-3 flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-yellow-500">
                      <div className="px-4 text-gray-400"><ShieldCheck size={20} /></div>
                      <input
                        type="text"
                        value={token}
                        onChange={(event) => setToken(event.target.value)}
                        placeholder="Enter code from your email"
                        className="w-full px-2 py-4 outline-none uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700">New Password</label>
                    <div className="mt-3 flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-yellow-500">
                      <div className="px-4 text-gray-400"><KeyRound size={20} /></div>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Create a new password"
                        className="w-full px-2 py-4 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700">Confirm Password</label>
                    <div className="mt-3 flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-yellow-500">
                      <div className="px-4 text-gray-400"><KeyRound size={20} /></div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-2 py-4 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isResetReady}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#071426] font-bold text-lg py-4 rounded-xl transition disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating password..." : "Update Password"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError("");
                      setMessage("");
                      setToken("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition"
                  >
                    Request another code
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useCommerce } from "../context/index.js";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.honeyvision.in/api";
const ForgotPasswordImage = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786189628/login_odyhdp.png";

export default function ForgotPassword() {
  const { requestPasswordReset } = useCommerce();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      setMessage(data?.message || "If an account exists for this email, a password reset link has been sent.");
      setStep("reset");
    } catch (err) {
      setError(err.message || "Unable to send reset email.");
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
                No worries. Enter your email and we’ll send a secure reset link so you can regain access.
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
                    {loading ? "Sending reset link..." : "Send Reset Link"}
                  </button>
                </form>
              ) : (
                <div className="space-y-5">
                  <p className="text-gray-600">Check your email for a secure password reset link. The link expires in 15 minutes.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError("");
                      setMessage("");
                    }}
                    className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition"
                  >
                    Request a new reset link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

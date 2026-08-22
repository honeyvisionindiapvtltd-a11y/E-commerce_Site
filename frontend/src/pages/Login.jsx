import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";

const LoginImage = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786189628/login_odyhdp.png";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useCommerce();
  const googleButtonRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const user = await login(email.trim(), password);
      if (user?.role === 'admin') {
        navigate('/admin');
      } else if (user?.role === 'delivery_agent') {
        navigate('/delivery-agent');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return undefined;
    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      if (!window.__honeyVisionGoogleInitialized) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            try {
              setLoading(true); setError("");
              const user = await loginWithGoogle(credential);
              navigate(user?.role === "admin" ? "/admin/dashboard" : "/profile");
            } catch (googleError) { setError(googleError.message || "Google login failed."); }
            finally { setLoading(false); }
          },
        });
        window.__honeyVisionGoogleInitialized = true;
      }
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, { theme: "outline", size: "large", width: 400, text: "continue_with" });
    };
    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) renderGoogleButton();
    else {
      const googleScript = document.createElement("script");
      googleScript.src = "https://accounts.google.com/gsi/client";
      googleScript.async = true; googleScript.defer = true; googleScript.onload = renderGoogleButton;
      document.head.appendChild(googleScript);
    }
    return undefined;
  }, [loginWithGoogle, navigate]);

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#071426] via-[#0B315A] to-[#102D4E] flex items-center justify-center p-8">

      <div className="w-full max-w-7xl bg-white rounded-[35px] overflow-hidden shadow-2xl">

        <div className="grid lg:grid-cols-2 min-h-[700px]">

          {/* ================= LEFT SIDE ================= */}

          <div className="relative bg-[#071426] overflow-hidden">

            {/* Background Glow */}

            <div className="absolute -top-32 -left-32 w-96 h-96 bg-yellow-500/20 blur-[120px] rounded-full"></div>

            <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/20 blur-[120px] rounded-full"></div>

            <div className="relative z-10 flex flex-col justify-center items-center h-full px-12 text-center">

              <img
                src={LoginImage}
                alt="Honey Vision"
                className="w-[520px] object-contain drop-shadow-2xl"
              />

              <h1 className="text-white text-5xl font-bold mt-10 leading-tight">

                Welcome to

                <span className="block text-yellow-400">

                  Honey Vision

                </span>

              </h1>

              <p className="text-gray-300 mt-6 text-lg leading-8 max-w-md">

                India's trusted destination for AI Cameras,
                CCTV, Networking, Smart Home,
                Drones and Enterprise IT Products.

              </p>

            </div>

          </div>

          {/* ================= RIGHT SIDE STARTS HERE ================= */}

                    {/* ================= RIGHT SIDE ================= */}

          <div className="flex items-center justify-center px-10 lg:px-16 py-12 bg-white">

            <div className="w-full max-w-md">

              {/* Logo */}

              <div className="flex justify-center mb-8">

                <div className="w-20 h-20 rounded-2xl bg-[#071426] flex items-center justify-center shadow-lg">

                  <span className="text-yellow-400 text-4xl font-bold">

                    H

                  </span>

                </div>

              </div>

              {/* Heading */}

              <h2 className="text-4xl font-bold text-center text-[#071426]">

                Sign In

              </h2>

              <p className="text-center text-gray-500 mt-3 leading-7">

                Welcome back! Login to your Honey Vision account
                to manage orders, wishlist and smart devices.

              </p>

              {/* Email */}

              <form onSubmit={handleSubmit} className="mt-10">
                {error && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <label className="font-semibold text-gray-700">

                  Email Address

                </label>

                <div className="mt-3 flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-yellow-500">

                  <div className="px-4 text-gray-400">

                    <Mail size={20} />

                  </div>

                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full px-2 py-4 outline-none"
                  />

                </div>

              {/* Password */}

              <div className="mt-6">

                <label className="font-semibold text-gray-700">

                  Password

                </label>

                <div className="mt-3 flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:border-yellow-500">

                  <div className="px-4 text-gray-400">

                    <Lock size={20} />

                  </div>

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full px-2 py-4 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-4 text-gray-500 hover:text-yellow-500 transition"
                  >

                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}

                  </button>

                </div>

              </div>

              {/* Remember & Forgot */}

              <div className="flex justify-between items-center mt-6">

                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">

                  <input
                    type="checkbox"
                    className="accent-yellow-500"
                  />

                  Remember Me

                </label>

                <Link
                  to="/forgot-password"
                  className="text-yellow-500 font-semibold hover:underline"
                >

                  Forgot Password?

                </Link>

              </div>

                            {/* Login Button */}

              <button type="submit" disabled={loading} className="w-full mt-8 bg-yellow-500 hover:bg-yellow-400 text-[#071426] font-bold text-lg py-4 rounded-xl transition duration-300 shadow-lg disabled:cursor-not-allowed disabled:opacity-70">

                {loading ? "Signing In..." : "Sign In"}

              </button>

              </form>

              {/* Divider */}

              <div className="flex items-center gap-4 my-8">

                <div className="flex-1 h-px bg-gray-300"></div>

                <span className="text-gray-500 text-sm">

                  OR CONTINUE WITH

                </span>

                <div className="flex-1 h-px bg-gray-300"></div>

              </div>

              {/* Google Login */}

              {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                <div ref={googleButtonRef} className="flex min-h-11 justify-center" />
              ) : (
                <button type="button" disabled className="w-full rounded-xl border border-gray-300 py-4 font-semibold text-gray-400">Google login is not configured</button>
              )}

              {/* Register */}

              <p className="text-center text-gray-600 mt-8">

                Don't have an account?

                <Link
                  to="/register"
                  className="ml-2 text-yellow-500 font-bold hover:underline"
                >
                  Create Account
                </Link>

              </p>

              {/* Security Card */}

              <div className="mt-10 bg-[#F8FAFC] rounded-2xl border border-gray-200 p-6">

                <h3 className="font-bold text-[#071426]">

                  Why Login?

                </h3>

                <ul className="mt-4 space-y-3 text-gray-600">

                  <li>✅ Track your orders in real-time</li>

                  <li>✅ Save products to your wishlist</li>

                  <li>✅ Faster checkout experience</li>

                  <li>✅ Access invoices & warranty details</li>

                  <li>✅ Exclusive deals & member discounts</li>

                </ul>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>

  );

}
import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Phone,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";

const RegisterImage = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786189630/register_gbw9qh.png";

export default function Register() {

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    interest: "AI Cameras",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useCommerce();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        interest: form.interest,
      });
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (

    <section className="min-h-screen bg-gradient-to-br from-[#071426] via-[#0B315A] to-[#102D4E] flex items-center justify-center py-10 px-6">

      <div className="max-w-7xl w-full bg-white rounded-[35px] overflow-hidden shadow-2xl">

        <div className="grid lg:grid-cols-2 min-h-[850px]">

          {/* ================= LEFT SIDE ================= */}

          <div className="relative bg-[#071426] overflow-hidden">

            <div className="absolute -top-40 -left-32 w-[420px] h-[420px] bg-yellow-500/20 rounded-full blur-[130px]"></div>

            <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-blue-500/20 rounded-full blur-[120px]"></div>

            <div className="relative z-10 flex flex-col justify-center items-center h-full px-12 text-center">

              <img
                src={RegisterImage}
                alt="Honey Vision"
                className="w-[520px] object-contain drop-shadow-2xl"
              />

              <h1 className="text-white text-5xl font-bold mt-10">

                Smart Security,

                <span className="block text-yellow-400 mt-2">

                  Stronger Tomorrow

                </span>

              </h1>

              <p className="text-gray-300 mt-6 text-lg leading-8 max-w-md">

                Join Honey Vision and explore AI Cameras,
                Networking, Smart Home, CCTV, Drones
                and Enterprise IT products.

              </p>

              <div className="grid grid-cols-2 gap-5 mt-10 w-full">

                <div className="bg-white/10 backdrop-blur rounded-2xl p-5">

                  <h3 className="text-yellow-400 text-3xl font-bold">

                    25K+

                  </h3>

                  <p className="text-gray-300 mt-2">

                    Happy Customers

                  </p>

                </div>

                <div className="bg-white/10 backdrop-blur rounded-2xl p-5">

                  <h3 className="text-yellow-400 text-3xl font-bold">

                    500+

                  </h3>

                  <p className="text-gray-300 mt-2">

                    Products

                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* ================= RIGHT SIDE STARTS HERE ================= */}

                    {/* ================= RIGHT SIDE ================= */}

          <div className="flex items-center justify-center px-10 lg:px-16 py-12 bg-white">

            <div className="w-full max-w-lg">

              <h2 className="text-4xl font-bold text-[#071426]">

                Create Your Account
              </h2>

              <p className="text-gray-500 mt-3 leading-7">

                Join Honey Vision and start shopping premium AI Cameras,
                Networking, Smart Home, CCTV and Enterprise IT solutions.

              </p>

              <form onSubmit={handleSubmit} className="mt-10">
                {error && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

              {/* Full Name & Mobile */}

              <div className="grid md:grid-cols-2 gap-5 mt-10">

                <div>

                  <label className="font-semibold text-gray-700">

                    Full Name

                  </label>

                  <div className="mt-3 flex items-center border rounded-xl overflow-hidden focus-within:border-yellow-500">

                    <div className="px-4 text-gray-400">

                      <User size={20} />

                    </div>

                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      type="text"
                      placeholder="Enter your name"
                      className="w-full py-4 pr-4 outline-none"
                    />

                  </div>

                </div>

                <div>

                  <label className="font-semibold text-gray-700">

                    Mobile Number

                  </label>

                  <div className="mt-3 flex items-center border rounded-xl overflow-hidden focus-within:border-yellow-500">

                    <div className="px-4 text-gray-400">

                      <Phone size={20} />

                    </div>

                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      type="tel"
                      placeholder="9876543210"
                      className="w-full py-4 pr-4 outline-none"
                    />

                  </div>

                </div>

              </div>

              {/* Email */}

              <div className="mt-6">

                <label className="font-semibold text-gray-700">

                  Email Address

                </label>

                <div className="mt-3 flex items-center border rounded-xl overflow-hidden focus-within:border-yellow-500">

                  <div className="px-4 text-gray-400">

                    <Mail size={20} />

                  </div>

                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="Enter your email"
                    className="w-full py-4 pr-4 outline-none"
                  />

                </div>

              </div>

              {/* Password */}

              <div className="mt-6">

                <label className="font-semibold text-gray-700">

                  Password

                </label>

                <div className="mt-3 flex items-center border rounded-xl overflow-hidden focus-within:border-yellow-500">

                  <div className="px-4 text-gray-400">

                    <Lock size={20} />

                  </div>

                  <input
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
                    className="w-full py-4 pr-4 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-4 text-gray-500 hover:text-yellow-500"
                  >

                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}

                  </button>

                </div>

              </div>

              {/* Confirm Password */}

              <div className="mt-6">

                <label className="font-semibold text-gray-700">

                  Confirm Password

                </label>

                <div className="mt-3 flex items-center border rounded-xl overflow-hidden focus-within:border-yellow-500">

                  <div className="px-4 text-gray-400">

                    <Shield size={20} />

                  </div>

                  <input
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm password"
                    className="w-full py-4 pr-4 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="px-4 text-gray-500 hover:text-yellow-500"
                  >

                    {showConfirm ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}

                  </button>

                </div>

              </div>

              {/* Interest */}

              <div className="mt-6">

                <label className="font-semibold text-gray-700">

                  Interested In

                </label>

                <select name="interest" value={form.interest} onChange={handleChange} className="w-full mt-3 border rounded-xl px-5 py-4 outline-none focus:border-yellow-500">

                  <option>AI Cameras</option>

                  <option>CCTV Surveillance</option>

                  <option>Drones</option>

                  <option>Networking</option>

                  <option>Storage Solutions</option>

                  <option>Smart Home</option>

                  <option>Enterprise IT</option>

                </select>

              </div>

              {/* Terms */}

              <div className="flex items-start gap-3 mt-6">

                <input
                  type="checkbox"
                  className="accent-yellow-500 mt-1"
                />

                <p className="text-gray-600 leading-6">

                  I agree to the{" "}

                  <span className="text-yellow-500 font-semibold cursor-pointer">

                    Terms & Conditions

                  </span>

                  {" "}and{" "}

                  <span className="text-yellow-500 font-semibold cursor-pointer">

                    Privacy Policy

                  </span>

                </p>

              </div>

                            {/* Create Account Button */}

              <button type="submit" disabled={loading} className="w-full mt-8 bg-yellow-500 hover:bg-yellow-400 text-[#071426] font-bold text-lg py-4 rounded-xl transition duration-300 shadow-lg disabled:cursor-not-allowed disabled:opacity-70">

                {loading ? "Creating Account..." : "Create Account"}

              </button>

              {/* Divider */}

              <div className="flex items-center gap-4 my-8">

                <div className="flex-1 h-px bg-gray-300"></div>

                <span className="text-gray-500 text-sm uppercase">

                  Or Continue With

                </span>

                <div className="flex-1 h-px bg-gray-300"></div>

              </div>

              {/* Social Buttons */}

              <div className="grid grid-cols-2 gap-4">

                {/* Google */}

                <button className="border border-gray-300 hover:border-yellow-500 hover:bg-yellow-50 rounded-xl py-4 flex items-center justify-center gap-3 transition">

                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-6 h-6"
                  />

                  <span className="font-semibold">

                    Google

                  </span>

                </button>

                {/* Facebook */}

                <button className="border border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-xl py-4 flex items-center justify-center gap-3 transition">

                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
                    alt="Facebook"
                    className="w-6 h-6"
                  />

                  <span className="font-semibold">

                    Facebook

                  </span>

                </button>

              </div>

              {/* Security Card */}

              <div className="mt-10 bg-[#F8FAFC] border border-gray-200 rounded-2xl p-6">

                <div className="flex items-start gap-4">

                  <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center">

                    <Shield className="text-yellow-500" size={28} />

                  </div>

                  <div>

                    <h3 className="font-bold text-[#071426]">

                      Your Security is Our Priority

                    </h3>

                    <p className="text-gray-500 mt-2 leading-7">

                      Your personal information is encrypted and securely
                      protected. We never share your data with third parties.

                    </p>

                  </div>

                </div>

              </div>

              </form>

              {/* Login Link */}

              <p className="text-center text-gray-600 mt-10">

                Already have an account?

                <Link
                  to="/login"
                  className="ml-2 text-yellow-500 font-bold hover:underline"
                >

                  Login

                </Link>

              </p>

            </div>

          </div>

        </div>

      </div>

    </section>

  );

}
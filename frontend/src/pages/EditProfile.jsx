import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  ShieldCheck,
  Lock,
  Bell,
  Save,
  ArrowLeft,
  Package,
  Heart,
  Home,
  LogOut,
  Settings,
  ChevronRight,
} from "lucide-react";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, logout } = useCommerce();

  const [formData, setFormData] = useState({
    fullName: user?.name || profile.fullName || "",
    email: user?.email || profile.email || "",
    phone: user?.phone || profile.phone || "",
    alternatePhone: profile.alternatePhone || "",
    dateOfBirth: profile.dateOfBirth || "",
    gender: profile.gender || "",
    location: profile.location || [profile.city, profile.state].filter(Boolean).join(", ") || "",
    address: profile.address || "",
    city: profile.city || "",
    state: profile.state || "",
    pinCode: profile.pinCode || "",
    country: profile.country || "India",
    bio: profile.bio || "",
    emergencyContact: profile.emergencyContact || "",
  });

  useEffect(() => {
    setFormData({
      fullName: user?.name || profile.fullName || "",
      email: user?.email || profile.email || "",
      phone: user?.phone || profile.phone || "",
      alternatePhone: profile.alternatePhone || "",
      dateOfBirth: profile.dateOfBirth || "",
      gender: profile.gender || "",
      location: profile.location || [profile.city, profile.state].filter(Boolean).join(", ") || "",
      address: profile.address || "",
      city: profile.city || "",
      state: profile.state || "",
      pinCode: profile.pinCode || "",
      country: profile.country || "India",
      bio: profile.bio || "",
      emergencyContact: profile.emergencyContact || "",
    });
  }, [user, profile]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await updateProfile({
        ...formData,
        location: formData.location || [formData.city, formData.state].filter(Boolean).join(", "),
      });
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Could not update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const sidebarItems = [
    { name: "My Profile", icon: User, path: "/profile" },
    { name: "My Orders", icon: Package, path: "/orders" },
    { name: "Wishlist", icon: Heart, path: "/wishlist" },
    { name: "My Addresses", icon: Home, path: "/addresses" },
    { name: "Edit Profile", icon: Settings, path: "/edit-profile", active: true },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <span className="cursor-pointer hover:text-[#F4B400]">Home</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-[#F4B400]">My Profile</span>
            <span>/</span>
            <span className="font-medium text-[#F4B400]">Edit Profile</span>
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#071426] md:text-4xl">Edit Profile</h1>
              <p className="mt-2 text-gray-500">Manage your personal information and account settings.</p>
            </div>

            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-[#071426] transition hover:bg-gray-50"
            >
              <ArrowLeft size={18} />
              Back to Profile
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
          <aside className="h-fit overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-6 text-center">
              <div className="relative inline-block">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-[#071426] to-[#17436B] shadow-md">
                  <User size={42} className="text-white" />
                </div>

                <button
                  type="button"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#F4B400] text-[#071426] transition hover:bg-yellow-400"
                >
                  <Camera size={15} />
                </button>
              </div>

              <h2 className="mt-4 text-lg font-bold text-[#071426]">{formData.fullName}</h2>
              <p className="mt-1 text-sm text-gray-500">Honey Vision Customer</p>

              <div className="mt-3 flex items-center justify-center gap-1.5">
                <ShieldCheck size={15} className="text-green-600" />
                <span className="text-xs font-semibold text-green-600">Verified Account</span>
              </div>
            </div>

            <nav className="p-3">
              {sidebarItems.map((item) => {
                const Icon = item.icon;

                if (item.active) {
                  return (
                    <div
                      key={item.name}
                      className="mb-1 flex w-full items-center justify-between rounded-xl bg-[#FFF7DB] px-4 py-3 text-left text-[#071426] transition"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={19} className="text-[#D99D00]" />
                        <span className="text-sm font-bold">{item.name}</span>
                      </div>

                      <ChevronRight size={17} className="text-[#D99D00]" />
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="mb-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-gray-600 transition hover:bg-gray-50 hover:text-[#071426]"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={19} className="text-gray-500" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                  </Link>
                );
              })}

              <div className="my-3 border-t border-gray-100"></div>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-red-500 transition hover:bg-red-50"
              >
                <LogOut size={19} />
                <span className="text-sm font-semibold">Logout</span>
              </button>
            </nav>

            <div className="px-5 pb-5">
              <div className="rounded-xl bg-[#F8F9FB] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#071426]">Profile Completion</span>
                  <span className="text-xs font-bold text-[#D99D00]">80%</span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-[#F4B400]" style={{ width: "80%" }}></div>
                </div>

                <p className="mt-2 text-[11px] leading-4 text-gray-500">Complete your profile to get the best experience.</p>
              </div>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7DB]">
                    <User size={21} className="text-[#D99D00]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#071426]">Personal Information</h2>
                    <p className="mt-1 text-sm text-gray-500">Update your basic personal details.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-[#071426]">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-[#071426] placeholder:text-gray-400 focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#071426]">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email address"
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-[#071426] placeholder:text-gray-400 focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-[#071426]">Phone Number</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-[#071426] placeholder:text-gray-400 focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="alternatePhone" className="mb-2 block text-sm font-semibold text-[#071426]">Alternate Phone</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="alternatePhone"
                        name="alternatePhone"
                        type="tel"
                        value={formData.alternatePhone}
                        onChange={handleChange}
                        placeholder="Enter alternate phone number"
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-[#071426] placeholder:text-gray-400 focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="mb-2 block text-sm font-semibold text-[#071426]">Date of Birth</label>
                    <div className="relative">
                      <Calendar size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-[#071426] focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gender" className="mb-2 block text-sm font-semibold text-[#071426]">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[#071426] outline-none focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="location" className="mb-2 block text-sm font-semibold text-[#071426]">Location</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="location"
                        name="location"
                        type="text"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Enter your city or location"
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-[#071426] placeholder:text-gray-400 focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="bio" className="mb-2 block text-sm font-semibold text-[#071426]">About Me</label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows="5"
                      maxLength="300"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us something about yourself..."
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-[#071426] placeholder:text-gray-400 focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20"
                    />
                    <p className="mt-2 text-xs text-gray-400">Maximum 300 characters.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7DB]">
                    <MapPin size={21} className="text-[#D99D00]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#071426]">Contact & Address</h2>
                    <p className="mt-1 text-sm text-gray-500">Manage your contact details and delivery address.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="mb-2 block text-sm font-semibold text-[#071426]">Full Address</label>
                    <textarea
                      id="address"
                      name="address"
                      rows="3"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter your complete address"
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-[#071426] placeholder:text-gray-400 focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20"
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="city" className="mb-2 block text-sm font-semibold text-[#071426]">City</label>
                    <input id="city" name="city" type="text" value={formData.city} onChange={handleChange} className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[#071426] placeholder:text-gray-400 focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20" />
                  </div>

                  <div>
                    <label htmlFor="state" className="mb-2 block text-sm font-semibold text-[#071426]">State</label>
                    <input id="state" name="state" type="text" value={formData.state} onChange={handleChange} className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[#071426] placeholder:text-gray-400 focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20" />
                  </div>

                  <div>
                    <label htmlFor="pinCode" className="mb-2 block text-sm font-semibold text-[#071426]">PIN Code</label>
                    <input id="pinCode" name="pinCode" type="text" inputMode="numeric" maxLength="6" value={formData.pinCode} onChange={handleChange} className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[#071426] placeholder:text-gray-400 focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20" />
                  </div>

                  <div>
                    <label htmlFor="country" className="mb-2 block text-sm font-semibold text-[#071426]">Country</label>
                    <select id="country" name="country" value={formData.country} onChange={handleChange} className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[#071426] focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20">
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="emergencyContact" className="mb-2 block text-sm font-semibold text-[#071426]">Emergency Contact</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="emergencyContact" name="emergencyContact" type="tel" value={formData.emergencyContact} onChange={handleChange} placeholder="Emergency contact number" className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-[#071426] placeholder:text-gray-400 focus:border-[#F4B400] focus:ring-2 focus:ring-[#F4B400]/20" />
                    </div>
                  </div>
                </div>

                <div className="mt-7 rounded-xl border border-[#F4B400]/20 bg-[#FFFDF5] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF7DB]">
                      <MapPin size={19} className="text-[#D99D00]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#071426]">Delivery Address</h3>
                      <p className="mt-1 text-sm leading-6 text-gray-500">This address will be used for product deliveries, installation services and service appointments. Please make sure your address and PIN code are correct.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-green-100 bg-[#F8FBF8] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <ShieldCheck size={19} className="text-green-600" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-[#071426]">Contact Information</h3>
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-600">Verified</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-gray-500">Your registered email address and phone number are associated with your Honey Vision account.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                    <Lock size={21} className="text-[#071426]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#071426]">Security & Account Settings</h2>
                    <p className="mt-1 text-sm text-gray-500">Manage your password and account security preferences.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex flex-col gap-5 rounded-xl border border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                      <Lock size={20} className="text-[#071426]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#071426]">Password</h3>
                      <p className="mt-1 text-sm text-gray-500">Keep your password strong and updated regularly.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => alert("Change password")} className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 font-semibold text-[#071426] transition hover:border-[#F4B400] hover:bg-[#FFF9E8]">Change Password</button>
                </div>

                <div className="mt-4 flex flex-col gap-5 rounded-xl border border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50">
                      <ShieldCheck size={20} className="text-green-600" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-[#071426]">Two-Factor Authentication</h3>
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">Recommended</span>
                      </div>
                      <p className="mt-1 max-w-xl text-sm text-gray-500">Add an extra layer of security by requiring a verification code when signing in.</p>
                    </div>
                  </div>
                  <button type="button" aria-label="Toggle two-factor authentication" className="h-7 w-12 shrink-0 rounded-full bg-gray-200 p-1 transition">
                    <span className="block h-5 w-5 rounded-full bg-white shadow-sm"></span>
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-5 rounded-xl border border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-50">
                      <Bell size={20} className="text-[#D99D00]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#071426]">Login Alerts</h3>
                      <p className="mt-1 max-w-xl text-sm text-gray-500">Get notified whenever your account is accessed from a new device or location.</p>
                    </div>
                  </div>
                  <button type="button" aria-label="Toggle login alerts" className="h-7 w-12 shrink-0 rounded-full bg-[#F4B400] p-1">
                    <span className="ml-auto block h-5 w-5 rounded-full bg-white shadow-sm"></span>
                  </button>
                </div>

                <div className="mt-4 rounded-xl border border-gray-100 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold text-[#071426]">Active Sessions</h3>
                      <p className="mt-1 text-sm text-gray-500">Manage the devices currently signed into your account.</p>
                    </div>
                    <button type="button" onClick={() => alert("Manage sessions")} className="rounded-lg border border-gray-200 px-5 py-2.5 font-semibold text-[#071426] transition hover:border-[#F4B400] hover:bg-[#FFF9E8]">Manage Sessions</button>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                        <User size={19} className="text-[#071426]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#071426]">Windows PC · Chrome</p>
                        <p className="mt-1 text-xs text-gray-500">Current session</p>
                      </div>
                    </div>

                    <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      Active
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-green-100 bg-[#F8FBF8] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <ShieldCheck size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#071426]">Your account is secure</h3>
                      <p className="mt-1 text-sm leading-6 text-gray-500">Your account is protected with secure authentication. We recommend enabling two-factor authentication for additional protection.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7DB]">
                    <Bell size={21} className="text-[#D99D00]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#071426]">Communication Preferences</h2>
                    <p className="mt-1 text-sm text-gray-500">Choose how you want Honey Vision to contact you.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between gap-5 py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                      <Mail size={19} className="text-[#071426]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#071426]">Email Notifications</h3>
                      <p className="mt-1 text-sm text-gray-500">Receive order updates, invoices and account information.</p>
                    </div>
                  </div>
                  <button type="button" aria-label="Toggle email notifications" className="h-7 w-12 shrink-0 rounded-full bg-[#F4B400] p-1">
                    <span className="ml-auto block h-5 w-5 rounded-full bg-white shadow-sm"></span>
                  </button>
                </div>

                <div className="border-t border-gray-100"></div>

                <div className="flex items-center justify-between gap-5 py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                      <Phone size={19} className="text-[#071426]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#071426]">SMS Notifications</h3>
                      <p className="mt-1 text-sm text-gray-500">Receive delivery, installation and service updates.</p>
                    </div>
                  </div>
                  <button type="button" aria-label="Toggle SMS notifications" className="h-7 w-12 shrink-0 rounded-full bg-[#F4B400] p-1">
                    <span className="ml-auto block h-5 w-5 rounded-full bg-white shadow-sm"></span>
                  </button>
                </div>

                <div className="border-t border-gray-100"></div>

                <div className="flex items-center justify-between gap-5 py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                      <Bell size={19} className="text-[#071426]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#071426]">Offers & Promotions</h3>
                      <p className="mt-1 text-sm text-gray-500">Receive information about new products and special offers.</p>
                    </div>
                  </div>
                  <button type="button" aria-label="Toggle offers and promotions" className="h-7 w-12 shrink-0 rounded-full bg-gray-200 p-1">
                    <span className="block h-5 w-5 rounded-full bg-white shadow-sm"></span>
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#071426]">Save your changes</h3>
                  <p className="mt-1 text-sm text-gray-500">Make sure all your information is correct before saving.</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={() => window.history.back()} className="rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-[#071426] transition hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4B400] px-7 py-3 font-bold text-[#071426] shadow-sm transition hover:bg-[#E5A900] hover:shadow-md disabled:cursor-not-allowed disabled:bg-yellow-200 disabled:text-gray-500">
                    <Save size={19} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 px-2 pb-6">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-green-600" />
              <p className="text-xs leading-5 text-gray-500">Your personal information is protected and will only be used to provide Honey Vision products, services, deliveries and account-related communication.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  ShieldCheck,
  Wrench,
  MapPin,
  CheckCircle2,
  Info,
  Phone,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";

const installationServices = [
  {
    id: "cctv",
    title: "CCTV Installation",
    description: "Professional CCTV camera installation for home or business.",
    price: 1499,
    badge: "Most popular",
  },
  {
    id: "ai-surveillance",
    title: "AI Surveillance Setup",
    description: "AI-enabled surveillance system installation with analytics.",
    price: 2499,
  },
  {
    id: "access-control",
    title: "Access Control Setup",
    description: "Biometric and access control installation for secure entry.",
    price: 1999,
  },
  {
    id: "full-security",
    title: "Full Security Setup",
    description: "Complete installation of CCTV, access control and alarms.",
    price: 4999,
  },
];

const optionalServices = [
  {
    id: "cable-concealment",
    title: "Cable Concealment",
    price: 499,
  },
  {
    id: "wall-drilling",
    title: "Wall Drilling",
    price: 349,
  },
  {
    id: "wifi-config",
    title: "Wi-Fi Configuration",
    price: 299,
  },
  {
    id: "system-demo",
    title: "System Demo",
    price: 199,
  },
];

function formatCurrency(value) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function BookInstallation() {
  const [selectedServiceId, setSelectedServiceId] = useState("cctv");
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    pin: "",
  });
  const [schedule, setSchedule] = useState({
    date: "",
    time: "",
  });

  const selectedService = useMemo(
    () => installationServices.find((service) => service.id === selectedServiceId),
    [selectedServiceId],
  );

  const extrasTotal = selectedExtras.reduce((total, selectedId) => {
    const extra = optionalServices.find((item) => item.id === selectedId);
    return total + (extra?.price || 0);
  }, 0);

  const subtotal = selectedService.price + extrasTotal;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  const toggleExtra = (id) => {
    setSelectedExtras((current) =>
      current.includes(id)
        ? current.filter((extraId) => extraId !== id)
        : [...current, id],
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-[#071426] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,180,0,0.24),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-400">
                Book Installation
              </p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                Book Your Installation
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
                Schedule certified HoneyVision engineers for fast, reliable and fully supported installation services.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3 text-slate-100">
                <ShieldCheck size={22} className="text-amber-400" />
                <span className="font-semibold">1 Year Workmanship Warranty</span>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-400" />
                  Certified Engineers
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-400" />
                  Quick, reliable service
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-400" />
                  End-to-end support
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.75fr_1fr]">
          <div className="space-y-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">1</span>
                Select Service
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {installationServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`group relative rounded-3xl border p-5 text-left transition-all ${
                      selectedServiceId === service.id
                        ? "border-amber-400 bg-amber-50 shadow-lg"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    {service.badge && (
                      <span className="absolute right-4 top-4 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-semibold text-slate-950">
                        {service.badge}
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <Wrench size={20} className="text-amber-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {service.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-sm font-bold text-slate-900">
                      <span>{formatCurrency(service.price)}</span>
                      {selectedServiceId === service.id && (
                        <span className="rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white">
                          Selected
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
                <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">2</span>
                Enter Details
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Full Name
                  <input
                    value={customer.name}
                    onChange={(event) => setCustomer({ ...customer, name: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                    placeholder="Enter your name"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Phone Number
                  <input
                    value={customer.phone}
                    onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                    placeholder="Enter phone number"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
                  Email Address
                  <input
                    value={customer.email}
                    onChange={(event) => setCustomer({ ...customer, email: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                    placeholder="Enter email"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
                  Installation Address
                  <input
                    value={customer.address}
                    onChange={(event) => setCustomer({ ...customer, address: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                    placeholder="House / Office address"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  PIN Code
                  <input
                    value={customer.pin}
                    onChange={(event) => setCustomer({ ...customer, pin: event.target.value.replace(/\D/g, "").slice(0, 6) })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                    placeholder="PIN code"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
                <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">3</span>
                Schedule Appointment
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Preferred Date
                  <input
                    type="date"
                    value={schedule.date}
                    onChange={(event) => setSchedule({ ...schedule, date: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Preferred Time
                  <input
                    type="time"
                    value={schedule.time}
                    onChange={(event) => setSchedule({ ...schedule, time: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
                <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">4</span>
                Confirmation
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-600">
                Complete the form and click "Book Installation" to request a free installation consultation from our certified team.
              </p>
              <div className="mt-6 rounded-3xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <Info size={20} className="text-amber-500" />
                  Estimated response within 24 hours.
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Need help?</p>
                <p className="text-sm text-slate-600">Call us or message our support team anytime.</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071426] px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Book Installation
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Order Summary</h2>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin size={18} className="text-amber-500" />
                    <span>Installation service</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{selectedService.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(selectedService.price)}</p>
                </div>

                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Wrench size={18} className="text-slate-800" />
                    <span>Additional services</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {optionalServices.map((extra) => (
                      <button
                        key={extra.id}
                        type="button"
                        onClick={() => toggleExtra(extra.id)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                          selectedExtras.includes(extra.id)
                            ? "border-amber-400 bg-amber-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span>{extra.title}</span>
                        <span className="font-semibold">{formatCurrency(extra.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Clock3 size={18} className="text-slate-800" />
                    <span>Estimated schedule</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{schedule.date || "Select preferred date"}</p>
                  <p className="text-sm text-slate-700">{schedule.time || "Select preferred time"}</p>
                </div>

                <div className="rounded-3xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>GST (18%)</span>
                    <span>{formatCurrency(gst)}</span>
                  </div>
                  <div className="mt-4 border-t border-slate-200 pt-4 flex items-center justify-between text-lg font-bold text-slate-900">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-[#f8fafc] p-6 text-slate-800 shadow-sm">
              <h3 className="font-semibold text-slate-900">Why Choose HoneyVision Installation?</h3>
              <ul className="mt-5 space-y-4 text-sm leading-6">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 text-amber-500" />
                  Certified engineers with fast turnaround.
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 text-amber-500" />
                  Transparent pricing with no hidden fees.
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 text-amber-500" />
                  Complete support from setup to service.
                </li>
              </ul>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-amber-500" />
                  <div>
                    <p className="font-semibold text-slate-900">Need immediate help?</p>
                    <p className="text-sm text-slate-600">Call us at +91 98765 43210</p>
                  </div>
                </div>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-[#071426] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Contact Us
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

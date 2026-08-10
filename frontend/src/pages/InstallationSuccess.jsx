import { useLocation, Link } from "react-router-dom";
import { CheckCircle2, ArrowLeft, CalendarDays, MapPin, Clock3, ShieldCheck } from "lucide-react";

export default function InstallationSuccess() {
  const location = useLocation();
  const booking = location.state?.booking || null;

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-10 text-center">
        <div className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-10 shadow-lg">
          <CheckCircle2 size={48} className="mx-auto text-green-600" />
          <h1 className="mt-6 text-3xl font-bold text-slate-900">No booking found</h1>
          <p className="mt-4 text-gray-600">It looks like you visited this page directly. Please book an installation first.</p>
          <Link to="/installation" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#061a36] px-6 py-3 text-sm font-semibold text-white hover:bg-[#fbb900] hover:text-[#071426]">
            <ArrowLeft size={18} /> Go to Installation
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] p-10">
      <div className="mx-auto max-w-4xl rounded-[32px] bg-white p-10 shadow-xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900">Installation Booked Successfully</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Your installation request has been received. Our team will contact you shortly to confirm the appointment and complete the service.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-gray-200 bg-[#f8fafc] p-8">
            <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
              <span>Booking ID</span>
              <span className="font-semibold">{booking.id}</span>
            </div>

            <div className="mt-8 space-y-4 text-slate-700">
              <div>
                <p className="text-sm text-slate-500">Service</p>
                <p className="mt-1 text-lg font-semibold">{booking.service}</p>
              </div>

              {booking.additionalServices?.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500">Additional Services</p>
                  <p className="mt-1 text-lg font-semibold">{booking.additionalServices.join(", ")}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-slate-500">Customer</p>
                <p className="mt-1 text-lg font-semibold">{booking.customer.name}</p>
                <p className="text-sm text-slate-500">{booking.customer.email}</p>
                <p className="text-sm text-slate-500">{booking.customer.phone}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="mt-1 text-lg font-semibold">{booking.customer.address}, {booking.customer.city}, {booking.customer.state} - {booking.customer.pinCode}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Preferred Date</p>
                  <p className="mt-1 font-semibold">{booking.preferredDate}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Preferred Slot</p>
                  <p className="mt-1 font-semibold">{booking.preferredSlot}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <ShieldCheck size={18} className="text-[#fbb900]" />
              <span>Workmanship Warranty included</span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-[#f8fafc] p-4">
                <p className="text-sm text-slate-500">Installation</p>
                <p className="mt-1 text-lg font-semibold">{formatPrice(booking.installationPrice)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-[#f8fafc] p-4">
                <p className="text-sm text-slate-500">Additional Services</p>
                <p className="mt-1 text-lg font-semibold">{formatPrice(booking.additionalTotal)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-[#f8fafc] p-4">
                <p className="text-sm text-slate-500">GST</p>
                <p className="mt-1 text-lg font-semibold">{formatPrice(booking.gst)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-[#061a36] p-4 text-white">
                <p className="text-sm">Total payable</p>
                <p className="mt-1 text-2xl font-bold">{formatPrice(booking.total)}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/installation/history" className="inline-flex items-center justify-center rounded-full border border-[#061a36] px-6 py-3 text-sm font-semibold text-[#061a36] hover:bg-[#061a36] hover:text-white transition">
            View Booking History
          </Link>
          <Link to="/installation" className="inline-flex items-center justify-center rounded-full bg-[#061a36] px-6 py-3 text-sm font-semibold text-white hover:bg-[#fbb900] hover:text-[#071426] transition">
            Book Another Installation
          </Link>
        </div>
      </div>
    </main>
  );
}

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

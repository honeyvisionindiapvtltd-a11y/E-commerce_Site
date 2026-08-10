import { Link } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";
import { ArrowLeft, CalendarDays, Clock3, MapPin, Tag, Truck } from "lucide-react";

export default function InstallationHistory() {
  const { installationBookings } = useCommerce();

  if (!installationBookings.length) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-10">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-gray-200 bg-white p-10 shadow-xl text-center">
          <Tag size={48} className="mx-auto text-slate-900" />
          <h1 className="mt-6 text-3xl font-bold text-slate-900">No installation bookings yet</h1>
          <p className="mt-4 text-sm text-slate-600">Book your first installation and track its progress from this page.</p>
          <Link to="/installation" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#061a36] px-6 py-3 text-sm font-semibold text-white hover:bg-[#fbb900] hover:text-[#071426]">
            <ArrowLeft size={18} /> Book Installation
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-gray-200 bg-white p-10 shadow-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">My Installations</p>
              <h1 className="text-3xl font-bold text-slate-900">Booking History</h1>
            </div>
            <Link to="/installation" className="inline-flex items-center gap-2 rounded-full border border-[#061a36] px-6 py-3 text-sm font-semibold text-[#061a36] hover:bg-[#061a36] hover:text-white transition">
              Book New Installation
            </Link>
          </div>
        </section>

        <section className="grid gap-6">
          {installationBookings.map((booking) => (
            <div key={booking.id} className="overflow-hidden rounded-[32px] border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-slate-500">Booking ID</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{booking.id}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <StatusPill status={booking.status || "Booked"} />
                  <DetailItem icon={CalendarDays} label="Date" value={booking.preferredDate || "N/A"} />
                  <DetailItem icon={Clock3} label="Slot" value={booking.preferredSlot || "N/A"} />
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Service</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{booking.service}</p>
                  {booking.additionalServices?.length > 0 && (
                    <p className="mt-2 text-sm text-slate-600">Extras: {booking.additionalServices.join(", ")}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{booking.customer.address}</p>
                  <p className="text-sm text-slate-600">{booking.customer.city}, {booking.customer.state} - {booking.customer.pinCode}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 rounded-3xl bg-[#f8fafc] p-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2"><Truck size={18} /> {booking.notes || "No special instructions provided."}</p>
                <p className="font-semibold text-slate-900">Total: {formatPrice(booking.total)}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function StatusPill({ status }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#d1d5db] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-slate-700">
      {status}
    </span>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white p-4 shadow-sm">
      <Icon size={18} className="text-[#061a36]" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

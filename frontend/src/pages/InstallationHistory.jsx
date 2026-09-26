import { Link } from "react-router-dom";
import { useCommerce } from "../context/index.js";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, Tag, Truck, ArrowUpRight, Search, UserRound, CreditCard } from "lucide-react";

export default function InstallationHistory() {
  const { installationBookings, fetchInstallations } = useCommerce();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    fetchInstallations()
      .catch((error) => {
        if (active) setLoadError(error.message || "Unable to load installation history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [fetchInstallations]);

  if (loading) return <main className="min-h-screen bg-[#f8fafc] p-10"><div className="mx-auto max-w-3xl rounded-[32px] border border-gray-200 bg-white p-10 text-center shadow-xl">Loading installation history...</div></main>;
  if (loadError) return <main className="min-h-screen bg-[#f8fafc] p-10"><div className="mx-auto max-w-3xl rounded-[32px] border border-red-200 bg-red-50 p-10 text-center text-red-700">{loadError}</div></main>;

  const counts = {
    total: installationBookings.length,
    pending: installationBookings.filter((booking) => ["BOOKED", "CONFIRMED"].includes(String(booking.status || "").toUpperCase())).length,
    scheduled: installationBookings.filter((booking) => ["ASSIGNED", "AGENT_ACCEPTED"].includes(String(booking.status || "").toUpperCase())).length,
    completed: installationBookings.filter((booking) => String(booking.status || "").toUpperCase() === "INSTALLATION_COMPLETED").length,
  };
  const visibleBookings = installationBookings.filter((booking) => {
    const status = String(booking.status || "").toUpperCase();
    const matchesFilter = filter === "ALL"
      || (filter === "PENDING" && ["BOOKED", "CONFIRMED"].includes(status))
      || (filter === "SCHEDULED" && ["ASSIGNED", "AGENT_ACCEPTED"].includes(status))
      || (filter === "IN_PROGRESS" && ["ON_THE_WAY", "ARRIVED", "INSTALLATION_IN_PROGRESS"].includes(status))
      || (filter === "COMPLETED" && status === "INSTALLATION_COMPLETED")
      || (filter === "CLOSED" && ["CANCELLED", "FAILED"].includes(status));
    const searchable = `${booking.bookingNumber || booking.id || ""} ${booking.orderNumber || ""} ${booking.productName || ""} ${booking.service || ""}`.toLowerCase();
    return matchesFilter && searchable.includes(query.trim().toLowerCase());
  });

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

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total Installations" value={counts.total} />
          <SummaryCard label="Pending" value={counts.pending} />
          <SummaryCard label="Scheduled" value={counts.scheduled} />
          <SummaryCard label="Completed" value={counts.completed} />
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
          <label className="relative flex-1">
            <Search size={17} className="absolute left-3 top-3 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search booking, order, product or service" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#f4b400]" />
          </label>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700">
            <option value="ALL">All Installations</option>
            <option value="PENDING">Pending</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Cancelled / Failed</option>
          </select>
        </section>

        <section className="grid gap-6">
          {visibleBookings.map((booking) => (
            <div key={booking.id || booking._id || booking.bookingNumber} className="overflow-hidden rounded-[32px] border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-slate-500">Booking ID</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{booking.bookingNumber || booking.id || booking._id}</p>
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
                  {booking.productName && <p className="mt-1 text-sm text-slate-600">Product: {booking.productName}</p>}
                  <p className="mt-1 text-sm text-slate-600">{booking.orderNumber ? `Order: ${booking.orderNumber}` : "Standalone Installation"}</p>
                  {booking.additionalServices?.length > 0 && (
                    <p className="mt-2 text-sm text-slate-600">Extras: {booking.additionalServices.join(", ")}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{booking.customer.address}</p>
                  <p className="text-sm text-slate-600">{booking.customer.city}, {booking.customer.state} - {booking.customer.pinCode}</p>
                  {booking.assignedAgentName && <p className="mt-2 flex items-center gap-1 text-sm text-slate-600"><UserRound size={15} /> {booking.assignedAgentName}</p>}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 rounded-3xl bg-[#f8fafc] p-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2"><Truck size={18} /> {booking.notes || "No special instructions provided."}</p>
                <div className="flex items-center gap-3">
                  <div className="text-right"><p className="font-semibold text-slate-900">Total: {formatPrice(booking.total)}</p><p className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-500"><CreditCard size={13} /> {booking.paymentStatus || "PENDING"}</p></div>
                  <Link to={`/installation/history/${booking.id || booking._id || booking.bookingNumber}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900">
                    View details <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {!visibleBookings.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No installations match this filter.</div>}
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

function SummaryCard({ label, value }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-[#071426]">{value}</p></div>;
}

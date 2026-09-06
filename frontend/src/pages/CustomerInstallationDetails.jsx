import { ArrowLeft, CalendarDays, MapPin, Wrench } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useCommerce } from "../context/index.js";

export default function CustomerInstallationDetails() {
  const { id } = useParams();
  const { installationBookings } = useCommerce();
  const booking = installationBookings.find((item) => String(item.id || item._id) === String(id));

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#f8fafc] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Wrench className="mx-auto text-slate-400" size={36} />
          <h1 className="mt-4 text-2xl font-black text-[#071426]">Installation not found</h1>
          <Link to="/installation/history" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#071426] px-4 py-2.5 text-sm font-bold text-white"><ArrowLeft size={16} /> Back to history</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link to="/installation/history" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#071426]"><ArrowLeft size={16} /> Installation history</Link>
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-wide text-amber-600">Booking {booking.id || booking._id}</p><h1 className="mt-2 text-3xl font-black text-[#071426]">{booking.service || "Installation"}</h1></div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold capitalize text-amber-700">{String(booking.status || "requested").replaceAll("_", " ")}</span>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Info icon={CalendarDays} label="Preferred date" value={booking.preferredDate || "Not scheduled"} />
            <Info icon={MapPin} label="Location" value={booking.customer?.address || booking.address || "Address pending"} />
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ icon: Icon, label, value }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><Icon size={18} className="text-amber-500" /><p className="mt-3 text-xs text-slate-500">{label}</p><p className="mt-1 font-bold text-[#071426]">{value}</p></div>;
}
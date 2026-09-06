import { CalendarDays, ClipboardList, MapPin, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { useCommerce } from "../context/index.js";

const statusLabel = (status) => String(status || "requested").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function AgentInstallationDashboard() {
  const { user } = useCommerce();
  const installations = [];

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-[#071426] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Installation operations</p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">Installation assignments</h1>
              <p className="mt-2 text-sm text-slate-300">Welcome, {user?.name || user?.email || "delivery agent"}.</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
              <Wrench size={28} />
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-amber-500" size={22} />
            <div>
              <h2 className="text-lg font-extrabold text-[#071426]">Assigned installations</h2>
              <p className="mt-1 text-sm text-slate-500">New installation assignments will appear here.</p>
            </div>
          </div>

          {installations.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <CalendarDays className="mx-auto text-slate-400" size={30} />
              <p className="mt-3 font-bold text-slate-700">No installation assignments yet</p>
              <p className="mt-1 text-sm text-slate-500">Check back after an installation is assigned to your account.</p>
              <Link to="/delivery-agent" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#071426] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0b315a]">
                <MapPin size={16} /> Back to deliveries
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {installations.map((installation) => (
                <article key={installation.id || installation._id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-bold text-[#071426]">{installation.service || "Installation"}</h3>
                    <span className="text-xs font-bold text-amber-600">{statusLabel(installation.status)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
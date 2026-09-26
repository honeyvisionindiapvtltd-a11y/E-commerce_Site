import { CalendarDays, ClipboardList, MapPin, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCommerce } from "../context/index.js";

const statusLabel = (status) => String(status || "requested").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function AgentInstallationDashboard() {
  const { user, authToken } = useCommerce();
  const [installations, setInstallations] = useState([]);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  useEffect(() => {
    if (!authToken) return;
    fetch(`${API_BASE}/agent/installations`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "Unable to load installations.");
        setInstallations(payload.data || payload.installations || []);
      })
      .catch((loadError) => setError(loadError.message));
  }, [authToken]);

  const installationId = (installation) => installation.id || installation._id || installation.bookingNumber;

  const updateInstallation = async (installation, action, body = {}) => {
    const key = `${installationId(installation)}:${action}`;
    setBusyKey(key);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/agent/installations/${encodeURIComponent(installationId(installation))}/${action}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Unable to update installation.");
      setInstallations((current) => current.map((item) => String(installationId(item)) === String(installationId(installation)) ? payload.data : item));
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusyKey("");
    }
  };

  const collectPayment = async (installation) => {
    const key = `${installationId(installation)}:payment/collect`;
    setBusyKey(key);
    setError("");
    try {
    const response = await fetch(`${API_BASE}/agent/installations/${encodeURIComponent(installation.id || installation._id)}/payment/collect`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ amount: Number(installation.total) }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "Unable to collect payment.");
      setInstallations((current) => current.map((item) => String(installationId(item)) === String(installationId(installation)) ? payload.data : item));
    } catch (collectError) {
      setError(collectError.message);
    } finally {
      setBusyKey("");
    }
  };

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
                <article key={installationId(installation)} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-bold text-[#071426]">{installation.service || "Installation"}</h3>
                    <span className="text-xs font-bold text-amber-600">{statusLabel(installation.status)}</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    <p>Customer: {installation.customer?.name || installation.customerName || "Customer"}</p>
                    <p>Schedule: {installation.preferredDate || "Not scheduled"} · {installation.preferredSlot || "Slot pending"}</p>
                    <p className="sm:col-span-2">Address: {installation.customer?.address || "Address unavailable"}, {installation.customer?.city || ""}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Payment: {String(installation.paymentMethod || "ONLINE").toUpperCase() === "COD" ? "Cash on Delivery" : String(installation.paymentMethod || "ONLINE").toUpperCase()} · {installation.paymentStatus || "PENDING"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {installation.status === "ASSIGNED" && <><ActionButton label="Accept" busy={busyKey === `${installationId(installation)}:accept`} onClick={() => updateInstallation(installation, "accept")} /><ActionButton label="Decline" busy={busyKey === `${installationId(installation)}:decline`} onClick={() => updateInstallation(installation, "decline", { reason: "Unable to take this assignment" })} /></>}
                    {installation.status === "AGENT_ACCEPTED" && <ActionButton label="Mark On The Way" busy={busyKey === `${installationId(installation)}:update-status`} onClick={() => updateInstallation(installation, "update-status", { status: "ON_THE_WAY" })} />}
                    {installation.status === "ON_THE_WAY" && <ActionButton label="Mark Arrived" busy={busyKey === `${installationId(installation)}:update-status`} onClick={() => updateInstallation(installation, "update-status", { status: "ARRIVED" })} />}
                    {installation.status === "ARRIVED" && <ActionButton label="Start Installation" busy={busyKey === `${installationId(installation)}:update-status`} onClick={() => updateInstallation(installation, "update-status", { status: "INSTALLATION_IN_PROGRESS" })} />}
                    {installation.status === "INSTALLATION_IN_PROGRESS" && <ActionButton label="Complete Installation" busy={busyKey === `${installationId(installation)}:update-status`} onClick={() => updateInstallation(installation, "update-status", { status: "INSTALLATION_COMPLETED", completionDetails: { notes: "Installation completed by assigned agent" } })} />}
                    {String(installation.paymentMethod || "").toUpperCase() === "COD" && installation.paymentStatus !== "PAID" && <ActionButton label={`Collect ₹${Number(installation.total || 0).toLocaleString("en-IN")}`} busy={busyKey === `${installationId(installation)}:payment/collect`} onClick={() => collectPayment(installation)} />}
                  </div>
                </article>
              ))}
            </div>
          )}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </section>
      </div>
    </main>
  );
}

function ActionButton({ label, busy, onClick }) {
  return <button type="button" onClick={onClick} disabled={busy} className="rounded-lg bg-[#071426] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Updating..." : label}</button>;
}
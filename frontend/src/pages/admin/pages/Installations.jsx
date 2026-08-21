import { useEffect, useState } from "react";
import { adminListInstallations, adminUpdateInstallationStatus } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";

const statuses = ["requested", "confirmed", "scheduled", "in_progress", "completed", "cancelled"];
const label = (value) => String(value || "requested").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Installations() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true); setError("");
    try { setRows(await adminListInstallations()); }
    catch (loadError) { setError(loadError.message || "Unable to load installations."); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const updateStatus = async (installation, status) => {
    try { await adminUpdateInstallationStatus(installation.id, status); await refresh(); }
    catch (updateError) { setError(updateError.message || "Unable to update installation."); }
  };

  const filtered = rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageHeader title="Installations" description="Review and manage customer installation bookings." />
    {error && <div className="mb-4 flex justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"><span>{error}</span><button onClick={refresh} className="font-semibold underline">Retry</button></div>}
    <Toolbar search={query} setSearch={setQuery} />
    {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading installations...</p> : <Table rows={filtered} columns={[
      { key: "id", label: "Booking", render: (row) => <b>{row.id || row._id}</b> },
      { key: "customer", label: "Customer", render: (row) => <div><b>{row.customer?.name || row.customerName || row.userId || "Guest"}</b><p className="text-[9px] text-slate-400">{row.customer?.phone || row.customer?.email || ""}</p></div> },
      { key: "service", label: "Service", render: (row) => row.service || row.serviceName || "Installation" },
      { key: "createdAt", label: "Requested", render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN") : "N/A" },
      { key: "status", label: "Status", render: (row) => <select value={row.status || "requested"} onChange={(event) => updateStatus(row, event.target.value)} className="rounded border border-slate-200 px-2 py-1 text-xs">{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select> },
    ]} />}
  </>;
}
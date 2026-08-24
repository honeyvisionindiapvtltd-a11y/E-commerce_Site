import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, MessageSquare, RefreshCw } from "lucide-react";
import { adminListSupportTickets, adminUpdateSupportTicket } from "../api";

const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [state, setState] = useState("loading");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  const loadTickets = async () => {
    setState("loading");
    setError("");
    try {
      const data = await adminListSupportTickets(filter ? { status: filter } : {});
      setTickets(data.tickets || []);
      setState("success");
    } catch {
      setError("Unable to load support tickets.");
      setState("error");
    }
  };

  useEffect(() => {
    loadTickets();
  }, [filter]);

  const updateTicket = async (ticket, patch) => {
    try {
      const data = await adminUpdateSupportTicket(ticket._id, patch);
      setTickets((current) => current.map((item) => item._id === ticket._id ? data.ticket : item));
    } catch {
      setError("Unable to update this support ticket.");
    }
  };

  return <section className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-amber-600">Customer care</p><h2 className="mt-2 text-3xl font-black">Support Tickets</h2><p className="mt-2 text-sm text-slate-500">Review customer requests and keep conversations moving.</p></div>
      <button type="button" onClick={loadTickets} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50"><RefreshCw size={16} /> Refresh</button>
    </div>
    <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><button type="button" onClick={() => setFilter("")} className={`rounded-lg px-3 py-2 text-xs font-bold ${!filter ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>All tickets</button>{statuses.map((status) => <button type="button" key={status} onClick={() => setFilter(status)} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === status ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{status.replace("_", " ")}</button>)}</div>
    {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"><AlertCircle size={17} />{error}</div>}
    {state === "loading" ? <div className="h-40 animate-pulse rounded-2xl bg-slate-200" /> : !tickets.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No support tickets found.</div> : <div className="space-y-4">{tickets.map((ticket) => <TicketCard key={ticket._id} ticket={ticket} onUpdate={updateTicket} />)}</div>}
  </section>;
}

function TicketCard({ ticket, onUpdate }) {
  const [reply, setReply] = useState("");
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><p className="text-xs font-black uppercase tracking-wide text-amber-600">{ticket.ticketNumber}</p><h3 className="mt-1 text-lg font-black">{ticket.subject}</h3><p className="mt-1 text-sm text-slate-500">{ticket.user?.name || "Customer"} · {ticket.user?.email || "Email unavailable"}{ticket.orderNumber && ` · Order ${ticket.orderNumber}`}</p></div><div className="flex flex-wrap gap-2"><select value={ticket.status} onChange={(event) => onUpdate(ticket, { status: event.target.value })} className="rounded-lg border border-slate-300 px-2 py-2 text-xs font-bold"><option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN PROGRESS</option><option value="RESOLVED">RESOLVED</option><option value="CLOSED">CLOSED</option></select><select value={ticket.priority} onChange={(event) => onUpdate(ticket, { priority: event.target.value })} className="rounded-lg border border-slate-300 px-2 py-2 text-xs font-bold">{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></div></div><p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{ticket.description}</p><div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500"><MessageSquare size={15} />{ticket.messages?.length || 0} message(s)</div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply to the customer" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-700" /><button type="button" disabled={!reply.trim()} onClick={() => { onUpdate(ticket, { message: reply.trim(), status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status }); setReply(""); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"><CheckCircle2 size={16} />Send Reply</button></div></article>;
}

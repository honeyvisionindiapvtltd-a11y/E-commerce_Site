import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardList, Search } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useCommerce } from "../context/index.js";
import { getMySupportTickets } from "../services/supportService.js";

const filters = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const label = (value = "") => value.replaceAll("_", " ").toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase());
const date = (value) => value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "Date unavailable";
const statusClass = (status) => ({ OPEN: "bg-amber-50 text-amber-800", IN_PROGRESS: "bg-blue-50 text-blue-800", RESOLVED: "bg-emerald-50 text-emerald-800", CLOSED: "bg-slate-100 text-slate-700" }[status] || "bg-slate-100 text-slate-700");

export default function SupportTickets() {
  const { isLoggedIn, requestJson } = useCommerce();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [state, setState] = useState("loading");

  useEffect(() => {
    if (!isLoggedIn) return;
    getMySupportTickets(requestJson).then((data) => { setTickets(data.tickets || []); setState("success"); }).catch(() => setState("error"));
  }, [isLoggedIn, requestJson]);

  const visible = useMemo(() => tickets.filter((ticket) => {
    const matchesFilter = filter === "ALL" || ticket.status === filter;
    const text = `${ticket.ticketNumber} ${ticket.subject} ${ticket.orderNumber || ""}`.toLowerCase();
    return matchesFilter && text.includes(query.trim().toLowerCase());
  }), [tickets, filter, query]);

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return <main className="min-h-screen bg-[#f5f7fb] px-5 py-10 text-[#071426] sm:px-8 lg:px-12 lg:py-14"><div className="mx-auto max-w-6xl"><Link to="/support" className="inline-flex items-center gap-2 text-sm font-bold text-[#0b4162] hover:text-[#b27800]"><ArrowLeft size={16} /> Help Center</Link><div className="mt-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#b27800]">Customer care</p><h1 className="mt-2 text-4xl font-black tracking-tight">My Support Requests</h1><p className="mt-2 text-slate-600">Track every question, reply, and resolution.</p></div><Link to="/support#orders" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#071426] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#0d3150]">Get help with an order <ArrowRight size={16} /></Link></div><div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"><div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3"><Search className="shrink-0 text-slate-400" size={18} /><label className="sr-only" htmlFor="ticket-search">Search support requests</label><input id="ticket-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticket ID, order number or issue" className="min-w-0 flex-1 py-3 text-sm outline-none" /></div><div className="flex flex-wrap gap-2">{filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-xs font-black transition ${filter === item ? "bg-[#f4b400] text-[#071426]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{label(item)}</button>)}</div></div>{state === "loading" && <div className="mt-5 h-40 animate-pulse rounded-2xl bg-slate-200" />}{state === "error" && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-800">We couldn't load your requests. Refresh and try again.</div>}{state === "success" && <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="hidden grid-cols-[1.1fr_1.5fr_1fr_.8fr_1fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500 md:grid"><span>Ticket</span><span>Issue</span><span>Order</span><span>Status</span><span>Updated</span></div>{visible.length ? visible.map((ticket) => <Link key={ticket.ticketNumber} to={`/support/tickets/${encodeURIComponent(ticket.ticketNumber)}`} className="grid gap-3 border-b border-slate-100 px-5 py-5 transition last:border-0 hover:bg-[#fffdf3] md:grid-cols-[1.1fr_1.5fr_1fr_.8fr_1fr] md:items-center md:gap-4"><span><span className="block text-xs font-black uppercase tracking-wide text-[#b27800]">{ticket.ticketNumber}</span><span className="mt-1 block text-xs text-slate-500">Created {date(ticket.createdAt)}</span></span><span className="font-extrabold">{ticket.subject}</span><span className="text-sm text-slate-600">{ticket.orderNumber || "General enquiry"}</span><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(ticket.status)}`}>{label(ticket.status)}</span><span className="text-sm text-slate-600">{date(ticket.updatedAt || ticket.createdAt)}</span></Link>) : <div className="p-12 text-center"><ClipboardList className="mx-auto text-slate-300" size={36} /><p className="mt-3 font-black">No requests match this view.</p><p className="mt-1 text-sm text-slate-500">Try another filter or search phrase.</p></div>}</div>}</div></main>;
}

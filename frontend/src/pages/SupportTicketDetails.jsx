import { useEffect, useState } from "react";
import { ArrowLeft, Send, UserRound } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useCommerce } from "../context/index.js";
import { addSupportTicketMessage, getSupportTicketById } from "../services/supportService.js";

const label = (value = "") => value.replaceAll("_", " ").toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase());
const date = (value) => value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "Date unavailable";
const statusClass = (status) => ({ OPEN: "bg-amber-50 text-amber-800", IN_PROGRESS: "bg-blue-50 text-blue-800", RESOLVED: "bg-emerald-50 text-emerald-800", CLOSED: "bg-slate-100 text-slate-700" }[status] || "bg-slate-100 text-slate-700");

export default function SupportTicketDetails() {
  const { ticketId } = useParams();
  const { isLoggedIn, requestJson } = useCommerce();
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [state, setState] = useState("loading");

  const load = () => { setState("loading"); getSupportTicketById(requestJson, ticketId).then((data) => { setTicket(data.ticket); setState("success"); }).catch(() => setState("error")); };
  useEffect(() => {
    if (!isLoggedIn) return;
    getSupportTicketById(requestJson, ticketId)
      .then((data) => { setTicket(data.ticket); setState("success"); })
      .catch(() => setState("error"));
  }, [isLoggedIn, ticketId, requestJson]);

  const submit = async (event) => {
    event.preventDefault();
    if (!message.trim() || ticket?.status === "CLOSED") return;
    setState("sending");
    try { await addSupportTicketMessage(requestJson, ticketId, message); setMessage(""); load(); } catch { setState("error"); }
  };

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (state === "loading" || state === "sending") return <main className="min-h-screen bg-[#f5f7fb] p-8"><div className="mx-auto max-w-5xl animate-pulse rounded-3xl bg-slate-200 p-12" /></main>;
  if (state === "error" || !ticket) return <main className="min-h-screen bg-[#f5f7fb] p-8"><div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center"><h1 className="text-2xl font-black">Support request unavailable</h1><p className="mt-2 text-sm text-slate-600">We couldn't load this request.</p><button type="button" onClick={load} className="mt-5 rounded-xl bg-[#071426] px-5 py-3 text-sm font-bold text-white">Try again</button></div></main>;

  return <main className="min-h-screen bg-[#f5f7fb] px-5 py-10 text-[#071426] sm:px-8 lg:px-12 lg:py-14"><div className="mx-auto max-w-5xl"><Link to="/support/tickets" className="inline-flex items-center gap-2 text-sm font-bold text-[#0b4162]"><ArrowLeft size={16} /> All requests</Link><div className="mt-7 grid gap-6 lg:grid-cols-[1fr_300px]"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="border-b border-slate-100 pb-6"><p className="text-xs font-black uppercase tracking-[.18em] text-[#b27800]">{ticket.ticketNumber}</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">{ticket.subject}</h1><p className="mt-2 text-sm text-slate-500">Created {date(ticket.createdAt)}</p></div><div className="space-y-5 py-7">{(ticket.messages || []).map((item, index) => <div key={`${item.createdAt}-${index}`} className={`flex gap-3 ${item.authorRole === "admin" ? "" : "flex-row-reverse"}`}><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${item.authorRole === "admin" ? "bg-[#071426] text-[#f4b400]" : "bg-[#fff8df] text-[#b27800]"}`}><UserRound size={17} /></div><div className={`max-w-[85%] rounded-2xl p-4 ${item.authorRole === "admin" ? "bg-slate-50" : "bg-[#0b3150] text-white"}`}><p className="text-sm leading-6">{item.message}</p><p className={`mt-2 text-[11px] ${item.authorRole === "admin" ? "text-slate-400" : "text-slate-300"}`}>{item.authorRole === "admin" ? "Honey Vision support" : "You"} · {date(item.createdAt)}</p></div></div>)}</div>{ticket.status === "CLOSED" ? <p className="rounded-xl bg-slate-100 p-4 text-sm font-bold text-slate-600">This request is closed and cannot receive new replies.</p> : <form onSubmit={submit} className="border-t border-slate-100 pt-6"><label htmlFor="reply" className="text-sm font-black">Add a reply</label><textarea id="reply" value={message} onChange={(event) => setMessage(event.target.value)} rows={4} placeholder="Write a message..." className="mt-3 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0b4162] focus:ring-2 focus:ring-[#f4b400]/30" /><button type="submit" disabled={!message.trim()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#071426] px-5 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">Send Reply <Send size={16} /></button></form>}</section><aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-black uppercase tracking-[.18em] text-[#b27800]">Request summary</p><span className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(ticket.status)}`}>{label(ticket.status)}</span><dl className="mt-6 space-y-4 text-sm"><div><dt className="text-slate-500">Category</dt><dd className="mt-1 font-extrabold">{label(ticket.category)}</dd></div><div><dt className="text-slate-500">Priority</dt><dd className="mt-1 font-extrabold">{label(ticket.priority)}</dd></div><div><dt className="text-slate-500">Related order</dt><dd className="mt-1 font-extrabold">{ticket.orderNumber || "General enquiry"}</dd></div><div><dt className="text-slate-500">Last updated</dt><dd className="mt-1 font-extrabold">{date(ticket.updatedAt)}</dd></div></dl>{ticket.orderNumber && <Link to={`/orders/${encodeURIComponent(ticket.orderNumber)}/tracking`} className="mt-7 inline-flex items-center gap-2 text-sm font-black text-[#0b4162]">View order tracking <ArrowLeft className="rotate-180" size={15} /></Link>}</aside></div></div></main>;
}

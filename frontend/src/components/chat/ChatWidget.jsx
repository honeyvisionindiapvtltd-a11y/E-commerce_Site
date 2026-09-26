import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Check, ChevronDown, Loader2, MessageCircle, RefreshCw, Send, UserRound, X } from "lucide-react";
import { useCommerce } from "../../context/index.js";
import useRealtimeUpdates from "../../hooks/useRealtimeUpdates.js";
import { createNewConversation, createTicketFromChat, getChatMessages, getCurrentConversation, requestChatAgent, sendChatMessage } from "../../services/chatService.js";

const quickReplies = ["Track my order", "Delivery issue", "Payment issue", "Installation help", "Warranty support", "Talk to an agent"];
const statusLabel = { BOT_ACTIVE: "Virtual assistant", WAITING_FOR_AGENT: "Waiting for an agent", AGENT_ASSIGNED: "Support agent connected", RESOLVED: "Resolved", CLOSED: "Closed" };
const normalizeAssistantMessage = (message) => String(message || "")
  .replace(/^\s{0,3}#{1,6}\s*/gm, "")
  .replace(/\*\*(.*?)\*\*/g, "$1")
  .replace(/__(.*?)__/g, "$1")
  .replace(/`([^`]+)`/g, "$1")
  .trim();
const normalizeMessages = (items) => (Array.isArray(items) ? items : []).map((item) => item.senderType === "customer" ? item : { ...item, message: normalizeAssistantMessage(item.message) });

export default function ChatWidget() {
  const { isLoggedIn, user, authToken, requestJson } = useCommerce();
  const { getSocket } = useRealtimeUpdates(user?.id || user?._id, authToken);
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  const [creatingNewChat, setCreatingNewChat] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const loadConversation = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const data = await getCurrentConversation(requestJson);
      setConversation(data.conversation);
      const history = await getChatMessages(requestJson, data.conversation._id);
      setMessages(normalizeMessages(history.messages));
      setError("");
    } catch (loadError) {
      setError(loadError.message || "We are having trouble connecting to support.");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, requestJson]);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("honeyvision:open-chat", openChat);
    return () => window.removeEventListener("honeyvision:open-chat", openChat);
  }, []);

  useEffect(() => {
    if (!open || !isLoggedIn || conversation) return undefined;
    const timer = window.setTimeout(() => { loadConversation(); }, 0);
    return () => window.clearTimeout(timer);
  }, [open, isLoggedIn, conversation, loadConversation]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversation?._id) return undefined;
    const conversationId = String(conversation._id);
    const handleMessage = ({ conversation: updatedConversation, message }) => {
      if (message) setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
      if (updatedConversation) setConversation(updatedConversation);
      if (!open && message?.senderType !== "customer") setUnread((count) => count + 1);
    };
    const handleUpdate = ({ conversation: updatedConversation }) => updatedConversation && setConversation(updatedConversation);
    socket.emit("chat:join", conversationId);
    socket.on("chat:newMessage", handleMessage);
    socket.on("chat:conversationUpdate", handleUpdate);
    socket.on("chat:agentAssigned", handleUpdate);
    socket.on("chat:typing", () => setTyping(true));
    socket.on("chat:stopTyping", () => setTyping(false));
    return () => {
      socket.emit("chat:leave", conversationId);
      socket.off("chat:newMessage", handleMessage);
      socket.off("chat:conversationUpdate", handleUpdate);
      socket.off("chat:agentAssigned", handleUpdate);
      socket.off("chat:typing");
      socket.off("chat:stopTyping");
    };
  }, [conversation, getSocket, open]);

  useEffect(() => { if (open) window.requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" })); }, [messages, open]);

  const send = async (value = draft) => {
    const message = value.trim();
    if (!message || !conversation || loading) return;
    setDraft("");
    setError("");
    setThinking(true);
    try {
      const data = await sendChatMessage(requestJson, conversation._id, message);
      setMessages((current) => current.some((item) => item._id === data.message?._id) ? current : [...current, data.message]);
      const socket = getSocket();
      socket?.emit("chat:stopTyping", String(conversation._id));
    } catch (sendError) { setError(sendError.message || "Message could not be sent."); } finally { setThinking(false); }
  };

  const askAgent = async () => {
    if (!conversation) return;
    try { const data = await requestChatAgent(requestJson, conversation._id); setConversation(data.conversation); } catch (requestError) { setError(requestError.message); }
  };

  const startNewChat = async () => {
    setCreatingNewChat(true);
    try {
      const data = await createNewConversation(requestJson);
      setConversation(data.conversation);
      setMessages(data.messages || []);
      setTyping(false);
      setThinking(false);
      setUnread(0);
      setError("");
      setShowNewChatConfirm(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } catch (newChatError) {
      setError(newChatError.message || "We could not start a new conversation.");
    } finally {
      setCreatingNewChat(false);
    }
  };

  const handleTyping = (event) => {
    setDraft(event.target.value);
    const socket = getSocket();
    if (socket && conversation?._id) {
      socket.emit("chat:typing", String(conversation._id));
      window.clearTimeout(handleTyping.timeout);
      handleTyping.timeout = window.setTimeout(() => socket.emit("chat:stopTyping", String(conversation._id)), 900);
    }
  };

  return <>
    <button type="button" onClick={() => setOpen(true)} className="fixed bottom-20 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#f4b400] text-[#071426] shadow-xl shadow-[#071426]/25 transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#f4b400]/40 sm:bottom-5" aria-label="Open Honey Vision support chat">
      <MessageCircle size={25} />{unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">{unread}</span>}
    </button>
    {open && <section className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(680px,calc(100vh-40px))] sm:w-[400px] sm:rounded-3xl sm:shadow-2xl" aria-label="Honey Vision Support chat">
      <header className="flex shrink-0 items-center gap-3 bg-[#071426] px-5 py-4 text-white sm:rounded-t-3xl"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#f4b400] text-[#071426]">{conversation?.status === "AGENT_ASSIGNED" ? <UserRound size={21} /> : <Bot size={21} />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{conversation?.assignedAgent?.name || "Honey Vision Support"}</p><p className="text-xs text-slate-300">{conversation ? statusLabel[conversation.status] : "Online"}</p></div>{isLoggedIn && <button type="button" onClick={() => setShowNewChatConfirm(true)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Start new conversation" title="Start new conversation"><RefreshCw size={17} /></button>}<button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Minimize chat"><ChevronDown size={20} /></button><button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close chat"><X size={20} /></button></header>
      {!isLoggedIn ? <div className="flex flex-1 flex-col items-center justify-center px-8 text-center"><Bot size={42} className="text-[#b27800]" /><h2 className="mt-5 text-lg font-black text-[#071426]">Hi, how can we help?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Sign in to chat about your orders or connect with a support agent.</p><a href="/login" className="mt-6 rounded-xl bg-[#071426] px-5 py-3 text-sm font-bold text-white">Sign In</a><div className="mt-8 grid w-full gap-2">{quickReplies.slice(0, 5).map((reply) => <button key={reply} type="button" onClick={() => setDraft(reply)} className="rounded-xl border border-slate-200 px-3 py-2 text-left text-xs font-bold text-[#071426] hover:border-[#f4b400]">{reply}</button>)}</div></div> : <>
        <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f9fb] px-4 py-5">{loading && !messages.length ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#b27800]" /></div> : !messages.length ? <div className="rounded-2xl border border-[#f2d67a] bg-[#fff8df] p-4 text-sm leading-6 text-[#071426]"><p className="font-black">👋 Hi! Welcome to Honey Vision Support.</p><p className="mt-1">I can help with orders, delivery, installation, payments, products and warranty.</p></div> : messages.map((message) => <div key={message._id || `${message.createdAt}-${message.message}`} className={`flex ${message.senderType === "customer" ? "justify-end" : "justify-start"}`}><div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${message.senderType === "customer" ? "rounded-br-md bg-[#071426] text-white" : message.senderType === "system" ? "border border-[#f2d67a] bg-[#fff8df] text-[#071426]" : "rounded-bl-md bg-white text-slate-700 shadow-sm"}`}>{message.senderType === "bot" && <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-[#b27800]">Honey Vision Assistant</p>}{message.message}{message.metadata?.action === "TRACK_ORDER" && <a href={`/orders/${encodeURIComponent(message.metadata.orderNumber)}/tracking`} className="mt-2 block font-bold text-[#f4b400]">Track live order</a>}{Array.isArray(message.metadata?.actions) && message.metadata.actions.map((action) => action.type === "REQUEST_AGENT" ? <button key={action.type} type="button" onClick={askAgent} className="mt-2 block font-bold text-[#0b4162]">{action.label || "Talk to an Agent"}</button> : action.type === "TRACK_ORDER" ? <a key={action.type} href="/orders" className="mt-2 block font-bold text-[#0b4162]">{action.label || "Track Live Order"}</a> : action.type === "VIEW_TICKET" ? <a key={action.type} href="/support/tickets" className="mt-2 block font-bold text-[#0b4162]">{action.label || "View Support Tickets"}</a> : action.type === "OPEN_INSTALLATION" ? <a key={action.type} href="/installation/history" className="mt-2 block font-bold text-[#0b4162]">{action.label || "Open Installation History"}</a> : null)}</div></div>)}{thinking && <div className="flex items-center gap-2 text-xs italic text-slate-400"><Loader2 size={13} className="animate-spin" /> Honey Vision Assistant is thinking...</div>}{typing && <div className="text-xs italic text-slate-400">Support is typing...</div>}<div ref={endRef} /></div>
        {error && <p className="bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">{error}</p>}
        {conversation?.status === "WAITING_FOR_AGENT" && <p className="bg-[#fff8df] px-4 py-2 text-center text-xs font-bold text-[#8b6500]">Waiting for a support agent...</p>}
        {conversation?.status === "BOT_ACTIVE" && <div className="flex gap-2 overflow-x-auto border-t border-slate-100 bg-white px-4 py-3">{quickReplies.map((reply) => <button key={reply} type="button" onClick={() => reply === "Talk to an agent" ? askAgent() : send(reply)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#071426] hover:border-[#f4b400]">{reply}</button>)}</div>}
        {conversation && <button type="button" onClick={async () => { try { await createTicketFromChat(requestJson, conversation._id); setError("Support ticket created. Our team will follow up there too."); } catch (ticketError) { setError(ticketError.message); } }} className="flex w-full items-center justify-center gap-2 border-t border-slate-100 bg-white py-2 text-xs font-bold text-[#0b4162] hover:bg-slate-50"><Check size={14} /> Create Support Ticket</button>}
        <form onSubmit={(event) => { event.preventDefault(); send(); }} className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white p-3 sm:rounded-b-3xl"><label className="sr-only" htmlFor="chat-message">Message</label><input ref={inputRef} id="chat-message" value={draft} onChange={handleTyping} className="min-w-0 flex-1 rounded-xl bg-slate-100 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#f4b400]" placeholder="Type your message..." maxLength={4000} /><button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f4b400] text-[#071426] disabled:opacity-40" disabled={!draft.trim()} aria-label="Send message"><Send size={18} /></button></form>
      </>}
      {showNewChatConfirm && <div className="absolute inset-0 z-10 grid place-items-center bg-[#071426]/50 p-5"><div className="w-full rounded-2xl bg-white p-5 text-[#071426] shadow-xl"><h2 className="text-base font-black">Start a new conversation?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Your current chat will remain in your support history. {conversation?.status === "AGENT_ASSIGNED" ? "Your active human-support conversation will remain connected." : "This will open a fresh AI conversation."}</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowNewChatConfirm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button><button type="button" onClick={startNewChat} disabled={creatingNewChat} className="inline-flex items-center gap-2 rounded-xl bg-[#071426] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{creatingNewChat && <Loader2 size={15} className="animate-spin" />} Start New Chat</button></div></div></div>}
    </section>}
  </>;
}
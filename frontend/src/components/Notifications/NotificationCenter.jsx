import { AlertCircle, Bell, CheckCircle2, CreditCard, MessageCircle, Package, RefreshCw, Truck, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCommerce } from "../../context/index.js";
import { useNotificationContext } from "../../context/useNotificationContext.js";

const iconFor = (type = "") => type.includes("PAYMENT") ? CreditCard : type.includes("DELIVERY") || type.includes("OUT_FOR") ? Truck : type.includes("SUPPORT") || type.includes("CHAT") ? MessageCircle : type.includes("FAILED") || type.includes("ERROR") ? AlertCircle : type.includes("REFUND") ? RefreshCw : type.includes("DELIVERED") ? CheckCircle2 : Package;
const relativeTime = (value) => { const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return "Just now"; const minutes = Math.floor(seconds / 60); if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`; if (hours < 48) return "Yesterday"; return `${Math.floor(hours / 24)}d ago`; };
const notificationPath = (notification, role) => notification.actionUrl || (role === "admin" ? (notification.type?.includes("ORDER") ? "/admin/orders" : "/admin") : role === "delivery_agent" ? "/delivery-agent" : notification.orderNumber ? `/orders/${encodeURIComponent(notification.orderNumber)}/tracking` : "/notifications");

export default function NotificationCenter() {
  const { isLoggedIn, user } = useCommerce();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, removeNotification } = useNotificationContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const read = async (notification) => {
    if (!notification.read) await markAsRead(notification._id);
    setOpen(false);
    navigate(notificationPath(notification, user?.role));
  };
  const remove = async (event, notification) => { event.stopPropagation(); await removeNotification(notification._id); };

  if (!isLoggedIn) return null;
  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Open notifications"><Bell size={19} />{unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}</button>{open && <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><p className="font-black text-[#071426]">Notifications</p><div className="flex items-center gap-2"><button type="button" onClick={markAllAsRead} className="text-xs font-bold text-[#0b4162]">Mark all read</button><button type="button" onClick={() => setOpen(false)} aria-label="Close notifications"><X size={16} /></button></div></div><div className="max-h-96 overflow-y-auto">{loading ? <p className="p-6 text-center text-sm text-slate-500">Loading notifications...</p> : notifications.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">You are all caught up.</p> : notifications.map((notification) => { const Icon = iconFor(notification.type); return <div key={notification._id} className={`flex w-full gap-3 border-b border-slate-100 p-4 text-left ${notification.read ? "bg-white" : "bg-[#fffaf0]"}`}><button type="button" onClick={() => read(notification)} className="flex min-w-0 flex-1 gap-3 text-left hover:bg-slate-50"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff1bf] text-[#9a7000]"><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><strong className="text-xs text-[#071426]">{notification.title}</strong><small className="shrink-0 text-[10px] text-slate-400">{relativeTime(notification.createdAt)}</small></span><span className="mt-1 block text-xs leading-5 text-slate-600">{notification.message}</span></span></button><button type="button" onClick={(event) => remove(event, notification)} className="shrink-0 self-center p-1 text-slate-400 hover:text-red-500" aria-label="Delete notification"><X size={15} /></button></div>; })}</div></div>}</div>;
}

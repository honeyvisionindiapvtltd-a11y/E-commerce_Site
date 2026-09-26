import { useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotificationContext } from "../../context/useNotificationContext.js";
import { useCommerce } from "../../context/index.js";

export default function NotificationCenter() {
  const { notifications, unreadCount } = useNotificationContext();
  const { user } = useCommerce();
  const target = user?.role === "admin" ? "/admin/notifications" : "/notifications";
  const [open, setOpen] = useState(false);
  const content = <><Bell size={18} />{unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#F4B400] px-1 text-center text-[10px] font-bold leading-5 text-[#071426]">{unreadCount > 99 ? "99+" : unreadCount}</span>}</>;
  if (user?.role !== "admin") return <Link to={target} aria-label={`Open notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-amber-400 hover:text-amber-600">{content}</Link>;
  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} aria-label={`Open notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-amber-400 hover:text-amber-600">{content}</button>{open && <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"><div className="flex items-center justify-between border-b border-slate-100 pb-2"><p className="text-sm font-bold text-[#071426]">Notifications</p>{unreadCount > 0 && <span className="text-xs font-semibold text-[#0B4162]">{unreadCount} unread</span>}</div><div className="mt-2 space-y-2">{notifications.slice(0, 4).map((item) => <Link key={item._id} to={item.actionUrl || "/admin/notifications"} onClick={() => setOpen(false)} className={`block rounded-lg p-2 ${item.read ? "" : "bg-amber-50"}`}><p className="truncate text-xs font-semibold text-[#071426]">{item.title}</p><p className="truncate text-xs text-slate-500">{item.message}</p></Link>)}{notifications.length === 0 && <p className="py-3 text-center text-xs text-slate-500">No notifications yet</p>}</div><Link to="/admin/notifications" onClick={() => setOpen(false)} className="mt-2 block border-t border-slate-100 pt-2 text-center text-xs font-bold text-[#0B4162]">View all notifications</Link></div>}</div>;
}
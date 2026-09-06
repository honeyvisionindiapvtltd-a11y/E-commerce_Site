import { Bell, CheckCircle2, CreditCard, Mail, MessageSquareText, Package, RefreshCw, ShieldCheck, Smartphone, Truck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCommerce } from "../context/index.js";
import { useNotificationContext } from "../context/useNotificationContext.js";

const iconMap = {
  mail: Mail,
  message: MessageSquareText,
  shield: ShieldCheck,
  phone: Smartphone,
};

export default function Notifications() {
  const { notifications: preferences, toggleNotification, isLoggedIn } = useCommerce();
  const { notifications: activity, unreadCount, loading, markAsRead, markAllAsRead, removeNotification } = useNotificationContext();
  const navigate = useNavigate();

  const openNotification = async (item) => {
    if (!item.read) await markAsRead(item._id);
    navigate(item.actionUrl || (item.orderNumber ? `/orders/${encodeURIComponent(item.orderNumber)}/tracking` : "/notifications"));
  };
  const remove = async (item) => { await removeNotification(item._id); };
  const readAll = markAllAsRead;

  return (
    <main className="min-h-screen bg-[#F5F7FA] py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#F4B400]">Account</p>
          <h1 className="mt-2 text-3xl font-bold text-[#071426] md:text-4xl">Notifications</h1>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          {isLoggedIn && <section className="mb-8 border-b border-slate-100 pb-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-[#071426]">Activity</h2><p className="text-sm text-slate-500">Order, delivery, payment, and account updates.</p></div>{unreadCount > 0 && <button type="button" onClick={readAll} className="text-sm font-bold text-[#0b4162]">Mark all as read</button>}</div>{loading ? <p className="py-8 text-center text-sm text-slate-500">Loading notifications...</p> : activity.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No activity yet.</p> : <div className="mt-4 space-y-2">{activity.map((item) => { const Icon = item.type?.includes("PAYMENT") ? CreditCard : item.type?.includes("DELIVERY") ? Truck : item.type?.includes("REFUND") ? RefreshCw : item.type?.includes("DELIVERED") ? CheckCircle2 : Package; return <div key={item._id} role="button" tabIndex={0} onClick={() => openNotification(item)} onKeyDown={(event) => event.key === "Enter" && openNotification(item)} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${item.read ? "border-slate-100 bg-white" : "border-amber-100 bg-amber-50"}`}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#fff1bf] text-[#9a7000]"><Icon size={17} /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#071426]">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p></div><button type="button" onClick={(event) => { event.stopPropagation(); remove(item); }} aria-label="Delete notification" className="p-1 text-slate-400 hover:text-red-500"><X size={15} /></button></div>; })}</div>}</section>}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7DB] text-[#D99D00]">
              <Bell size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#071426]">Communication Preferences</h2>
              <p className="text-sm text-slate-500">Manage the alerts you receive from Honey Vision.</p>
            </div>
          </div>

          <div className="space-y-4">
            {preferences.map((item) => {
              const Icon = iconMap[item.icon] || Bell;
              return (
                <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-[#071426]">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#071426]">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Toggle ${item.title}`}
                    onClick={() => toggleNotification(item.id)}
                    className={`h-7 w-12 shrink-0 rounded-full p-1 transition ${item.enabled ? "bg-[#F4B400]" : "bg-gray-200"}`}
                  >
                    <span className={`block h-5 w-5 rounded-full bg-white shadow-sm ${item.enabled ? "ml-auto" : ""}`}></span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

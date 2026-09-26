import { useMemo, useState } from "react";
import { Bell, CreditCard, Headphones, Package, RefreshCw, ShieldAlert, Tag, Trash2, TrendingDown, Truck, Wrench, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationContext } from "../context/useNotificationContext.js";
import { getNotificationDisplayCategory, notificationCategoryLabels } from "../lib/notificationCategories.js";

const filters = ["ALL", "UNREAD", "ORDER", "PAYMENT", "DELIVERY", "INSTALLATION", "PROMOTION", "SECURITY"];
const filterLabels = { ALL: "All", UNREAD: "Unread", ORDER: "Orders", PAYMENT: "Payments", DELIVERY: "Delivery", INSTALLATION: "Installation", PROMOTION: "Promotions", SECURITY: "Security" };
const preferenceGroups = [
  { title: "Order & Delivery", items: [["orderUpdates", "Order Updates", "Order confirmation, packing, shipping, cancellation, and status changes."], ["paymentUpdates", "Payment Updates", "Payment success, pending, refund, and transaction updates."], ["deliveryUpdates", "Delivery Updates", "Dispatch, out-for-delivery, delivery, and failed delivery updates."], ["installationUpdates", "Installation Updates", "Booking, scheduling, technician, and completion updates."]] },
  { title: "Customer Support", items: [["supportUpdates", "Support Updates", "Replies and status changes for your support requests."]] },
  { title: "Offers & Shopping", items: [["promotions", "Promotions & Offers", "Offers, discounts, and new arrivals."], ["priceAlerts", "Price Drop Alerts", "Alerts when products you follow change price."]] },
  { title: "Security", items: [["securityAlerts", "Security Alerts", "Important account safety and access notifications."]] },
  { title: "Notification Channels", items: [["pushNotifications", "Push Notifications", "Instant alerts in the HoneyVision mobile app."], ["emailNotifications", "Email Notifications", "Controls future email notification delivery when email delivery is enabled."], ["smsNotifications", "SMS Notifications", "Controls future SMS notification delivery when SMS delivery is enabled."]] },
];

const iconFor = (notification) => {
  const icons = { PAYMENT: CreditCard, DELIVERY: Truck, INSTALLATION: Wrench, SECURITY: ShieldAlert, PROMOTION: Tag, PRICE_ALERT: TrendingDown, SUPPORT: Headphones, ORDER: Package, SYSTEM: Bell };
  return icons[getNotificationDisplayCategory(notification)] || Bell;
};

const relativeTime = (value) => {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172800) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const emptyMessage = {
  ALL: "No notifications yet",
  UNREAD: "You're all caught up",
  ORDER: "No order updates yet",
  PAYMENT: "No payment updates yet",
  DELIVERY: "No delivery updates yet",
  INSTALLATION: "No installation updates yet",
  PROMOTION: "No new offers right now",
  SECURITY: "No security alerts",
};

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications, unreadCount, loading, loadingMore, error, total, page,
    preferences, preferencesLoading, savingPreferences, preferencesLoadError,
    preferencesSaveError, fetchNotifications, markAsRead, markAllAsRead,
    removeNotification, clearNotifications, savePreference,
  } = useNotificationContext();
  const [filter, setFilter] = useState("ALL");
  const [confirmClear, setConfirmClear] = useState(false);
  const [savedPreferenceKey, setSavedPreferenceKey] = useState(null);

  const visibleNotifications = useMemo(() => notifications.filter((item) => {
    const category = getNotificationDisplayCategory(item);
    return filter === "ALL" || (filter === "UNREAD" ? !item.read : category === filter);
  }), [filter, notifications]);

  const handlePreferenceChange = async (key, value) => {
    setSavedPreferenceKey(null);
    const saved = await savePreference(key, value);
    if (saved) {
      setSavedPreferenceKey(key);
      window.setTimeout(() => setSavedPreferenceKey((current) => current === key ? null : current), 1800);
    }
  };

  const openNotification = async (item) => {
    if (!item.read) await markAsRead(item._id);
    if (item.actionUrl) navigate(item.actionUrl);
    else if (item.orderNumber) navigate(`/orders/${encodeURIComponent(item.orderNumber)}/tracking`);
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA] py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3"><Bell className="text-[#F4B400]" size={26} /><h1 className="text-3xl font-bold text-[#071426]">Notifications</h1>{unreadCount > 0 && <span className="rounded-full bg-[#F4B400] px-2.5 py-1 text-sm font-bold text-[#071426]">{unreadCount}</span>}</div>
            <p className="mt-2 text-sm text-slate-500">Stay updated with your HoneyVision account.</p>
          </div>
          {unreadCount > 0 && <button type="button" onClick={markAllAsRead} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#071426] hover:border-[#F4B400]">Mark all as read</button>}
        </header>

        <section className="mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto border-b border-slate-100"><div className="flex min-w-max gap-1 p-2">{filters.map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${filter === item ? "bg-[#071426] text-white" : "text-slate-500 hover:bg-[#FFF7DB]"}`}>{filterLabels[item]}</button>)}</div></div>
          <div className="p-4 sm:p-6">
            {error && <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 p-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => fetchNotifications(1)} aria-label="Retry loading notifications"><RefreshCw size={16} /></button></div>}
            {loading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div> : visibleNotifications.length === 0 ? <div className="py-12 text-center"><Package className="mx-auto text-[#F4B400]" size={34} /><h2 className="mt-3 font-bold text-[#071426]">{emptyMessage[filter]}</h2><p className="mt-1 text-sm text-slate-500">New account activity will appear here.</p></div> : <div className="space-y-3">{visibleNotifications.map((item) => { const category = getNotificationDisplayCategory(item); const Icon = iconFor(item); const hasAction = Boolean(item.actionUrl || item.orderNumber); return <article key={item._id} role="button" tabIndex={0} onClick={() => openNotification(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openNotification(item); } }} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 outline-none transition focus:ring-2 focus:ring-[#F4B400] ${item.read ? "border-slate-100 bg-white" : "border-amber-200 bg-[#FFF9E8]"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFF1BF] text-[#9A7000]"><Icon size={18} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className={`text-sm ${item.read ? "font-semibold" : "font-bold"} text-[#071426]`}>{item.title}</h2>{!item.read && <span className="h-2 w-2 rounded-full bg-[#F4B400]" aria-label="Unread" />}</div><p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400"><span>{notificationCategoryLabels[category] || "System"}</span>{item.orderNumber && <span>Order #{item.orderNumber}</span>}<span>{relativeTime(item.createdAt)}</span></div></div><div className="flex shrink-0 items-center gap-1">{hasAction && <button type="button" onClick={(event) => { event.stopPropagation(); openNotification(item); }} className="rounded-lg px-3 py-2 text-xs font-bold text-[#0B4162] hover:bg-slate-50">View</button>}<button type="button" title="Delete notification" onClick={(event) => { event.stopPropagation(); removeNotification(item._id); }} aria-label={`Delete ${item.title}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button></div></article>; })}</div>}
            {notifications.length < total && <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">Showing {notifications.length} of {total} notifications</span><button type="button" disabled={loadingMore} onClick={() => fetchNotifications(page + 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-[#071426] disabled:opacity-50">{loadingMore ? "Loading..." : "Load more"}</button></div>}
            {notifications.length > 0 && <button type="button" onClick={() => setConfirmClear(true)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"><Trash2 size={15} />Clear all notifications</button>}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-5"><Bell className="mt-1 text-[#F4B400]" size={22} /><div><h2 className="text-xl font-bold text-[#071426]">Communication Preferences</h2><p className="mt-1 text-sm text-slate-500">Choose which customer updates you receive. Essential security alerts remain enabled.</p></div></div>
          {preferencesLoadError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">Unable to load notification preferences. Please try again.</p>}
          {preferencesSaveError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">Unable to save notification preference. Please try again.</p>}
          {preferencesLoading ? <div className="mt-5 space-y-3">{["Order Updates", "Payment Updates", "Delivery Updates", "Installation Updates"].map((title) => <div key={title} className="rounded-2xl border border-slate-100 p-3.5"><div className="flex items-center justify-between"><div className="h-4 w-36 animate-pulse rounded bg-slate-200" /><div className="h-7 w-12 animate-pulse rounded-full bg-slate-200" /></div><div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-slate-100" /></div>)}</div> : <div className="mt-5 space-y-5">{preferenceGroups.map((group) => <div key={group.title}><h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0B4162]">{group.title}</h3><div className="space-y-2">{group.items.map(([key, title, description]) => { const security = key === "securityAlerts"; const enabled = security || Boolean(preferences?.[key]); const saving = Boolean(savingPreferences?.[key]); return <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-3.5"><div><h4 className="font-semibold text-[#071426]">{title}</h4><p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>{security && <p className="mt-1 text-xs font-medium text-[#0B4162]">Essential security notifications are always enabled.</p>}{savedPreferenceKey === key && <p className="mt-1 text-xs font-semibold text-emerald-600">✓ Saved</p>}{saving && <p className="mt-1 text-xs font-semibold text-slate-500">Saving...</p>}</div><button type="button" disabled={security || saving} aria-pressed={enabled} aria-label={`${title}: ${enabled ? "on" : "off"}`} onClick={() => handlePreferenceChange(key, !enabled)} className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition ${enabled ? "bg-[#F4B400]" : "bg-slate-200"} disabled:cursor-not-allowed disabled:opacity-60`}><span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition ${enabled ? "ml-5" : "ml-0"}`} /></button></div>; })}</div></div>)}</div>}
        </section>
      </div>

      {confirmClear && <div className="fixed inset-0 z-50 grid place-items-center bg-[#071426]/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"><div className="flex justify-between"><h2 className="text-lg font-bold text-[#071426]">Clear all notifications?</h2><button type="button" onClick={() => setConfirmClear(false)} aria-label="Cancel"><X size={18} /></button></div><p className="mt-2 text-sm text-slate-500">This removes notifications from your account only.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirmClear(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button type="button" onClick={async () => { await clearNotifications(); setConfirmClear(false); }} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Clear notifications</button></div></div></div>}
    </main>
  );
}

import { useMemo, useState } from "react";
import { Bell, Check, CreditCard, Headphones, Package, RefreshCw, ShieldAlert, Trash2, Truck, User, Wrench, X, Box } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationContext } from "../../../context/useNotificationContext.js";
import { getNotificationDisplayCategory, notificationCategoryLabels } from "../../../lib/notificationCategories.js";

const filters = ["ALL", "UNREAD", "ORDER", "PAYMENT", "INSTALLATION", "DELIVERY", "SUPPORT", "CUSTOMER", "PRODUCT", "INVENTORY", "SECURITY"];
const labels = { ALL: "All", UNREAD: "Unread", ORDER: "Orders", PAYMENT: "Payments", INSTALLATION: "Installations", DELIVERY: "Delivery", SUPPORT: "Support", CUSTOMER: "Customers", PRODUCT: "Products", INVENTORY: "Inventory", SECURITY: "Security" };
const icons = { ORDER: Package, PAYMENT: CreditCard, INSTALLATION: Wrench, DELIVERY: Truck, SUPPORT: Headphones, CUSTOMER: User, PRODUCT: Box, INVENTORY: Package, SECURITY: ShieldAlert, SYSTEM: Bell };
const emptyMessages = { ALL: "No notifications yet", UNREAD: "No unread notifications", ORDER: "No order notifications", PAYMENT: "No payment notifications", INSTALLATION: "No installation notifications", DELIVERY: "No delivery notifications", SUPPORT: "No support notifications", CUSTOMER: "No customer notifications", PRODUCT: "No product notifications", INVENTORY: "No inventory alerts", SECURITY: "No security alerts" };

const relativeTime = (value) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const preferenceGroups = [
  ["OPERATIONS", [["orderNotifications", "Order Notifications", "New orders, cancellations, and order status changes."], ["paymentNotifications", "Payment Notifications", "Payment confirmations, failures, pending payments, and refunds."], ["installationNotifications", "Installation Notifications", "Installation bookings, assignments, scheduling, and completion."], ["deliveryNotifications", "Delivery Notifications", "Delivery assignment, dispatch, completion, and failed delivery."]]],
  ["CUSTOMERS & SUPPORT", [["customerNotifications", "Customer Notifications", "New customer registrations and important customer activity."], ["supportNotifications", "Support Notifications", "New support tickets, replies, and ticket status changes."]]],
  ["CATALOG & INVENTORY", [["productNotifications", "Product Notifications", "Product creation, updates, and catalog activity."], ["inventoryNotifications", "Inventory Notifications", "Low-stock, out-of-stock, and inventory alerts."]]],
  ["SECURITY", [["securityAlerts", "Security Alerts", "Important administrator security and account-access notifications."]]],
  ["DELIVERY CHANNELS", [["pushNotifications", "Push Notifications", "Available when the HoneyVision mobile app is enabled."], ["emailNotifications", "Email Notifications", "Email delivery will be available after email provider integration."], ["smsNotifications", "SMS Notifications", "SMS delivery will be available after SMS notification integration."]]],
];

export default function AdminNotifications() {
  const navigate = useNavigate();
  const {
    notifications, unreadCount, loading, loadingMore, error, total, page, preferences,
    adminPreferencesLoading, savingAdminPreference, adminPreferencesLoadError,
    adminPreferencesSaveError, fetchNotifications, retryPreferences, markAsRead,
    markAsUnread, markAllAsRead, removeNotification, clearNotifications, savePreference,
  } = useNotificationContext();
  const [filter, setFilter] = useState("ALL");
  const [confirmClear, setConfirmClear] = useState(false);
  const [savedPreferences, setSavedPreferences] = useState({});
  const [mutationError, setMutationError] = useState("");

  const visible = useMemo(() => notifications.filter((item) => {
    const category = getNotificationDisplayCategory(item);
    return filter === "ALL" || (filter === "UNREAD" ? !item.read : category === filter);
  }), [filter, notifications]);

  const runMutation = async (operation) => {
    setMutationError("");
    try {
      await operation();
      return true;
    } catch (requestError) {
      setMutationError(requestError.message || "Unable to update notifications. Please try again.");
      return false;
    }
  };

  const handlePreferenceChange = async (key, value) => {
    setSavedPreferences((current) => ({ ...current, [key]: false }));
    const saved = await savePreference(key, value);
    if (saved) {
      setSavedPreferences((current) => ({ ...current, [key]: true }));
      window.setTimeout(() => setSavedPreferences((current) => ({ ...current, [key]: false })), 1800);
    }
  };

  const open = async (item) => {
    if (!item.read) await runMutation(() => markAsRead(item._id));
    if (item.actionUrl) navigate(item.actionUrl);
    else if (item.orderNumber) navigate("/admin/orders");
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><div className="flex items-center gap-3"><Bell className="text-[#F4B400]" size={24} /><h2 className="text-2xl font-bold text-[#071426]">Notifications</h2>{unreadCount > 0 && <span className="rounded-full bg-[#F4B400] px-2 py-1 text-xs font-bold text-[#071426]">{unreadCount > 99 ? "99+" : unreadCount}</span>}</div><p className="mt-1 text-sm text-slate-500">Stay updated with important activity across your HoneyVision store.</p></div>
      <div className="flex gap-2">{unreadCount > 0 && <button type="button" onClick={() => runMutation(markAllAsRead)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#071426]">Mark all as read</button>}{notifications.length > 0 && <button type="button" onClick={() => setConfirmClear(true)} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600">Clear all</button>}</div>
    </div>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto border-b border-slate-100"><div className="flex min-w-max gap-1 p-2">{filters.map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${filter === item ? "bg-[#071426] text-white" : "text-slate-500 hover:bg-amber-50"}`}>{labels[item]}</button>)}</div></div>
      <div className="p-4">
        {(error || mutationError) && <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"><span>{mutationError || "Unable to load admin notifications. Please try again."}</span>{error && <button type="button" onClick={() => fetchNotifications(1)} aria-label="Retry loading notifications" className="rounded p-1 hover:bg-red-100"><RefreshCw size={16} /></button>}</div>}
        {loading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div> : visible.length === 0 ? <div className="py-12 text-center"><Bell className="mx-auto text-[#F4B400]" size={32} /><p className="mt-3 font-semibold text-[#071426]">{emptyMessages[filter]}</p></div> : <div className="space-y-2">{visible.map((item) => {
          const category = getNotificationDisplayCategory(item);
          const Icon = icons[category] || Bell;
          const hasAction = Boolean(item.actionUrl || item.orderNumber);
          return <article key={item._id} className={`flex items-start gap-3 rounded-xl border p-3 ${item.read ? "border-slate-100 bg-white" : "border-amber-200 bg-amber-50/60"}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#FFF1BF] text-[#9A7000]"><Icon size={18} /></span>
            <button type="button" onClick={() => open(item)} className="min-w-0 flex-1 text-left outline-none focus:ring-2 focus:ring-[#F4B400]"><div className="flex items-center gap-2"><h3 className={`text-sm text-[#071426] ${item.read ? "font-semibold" : "font-bold"}`}>{item.title}</h3>{!item.read && <span className="h-2 w-2 rounded-full bg-[#F4B400]" aria-label="Unread" />}</div><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{notificationCategoryLabels[category] || "System"}{item.orderNumber ? ` · #${item.orderNumber}` : ""} · {relativeTime(item.createdAt)}</p></button>
            <div className="flex shrink-0 items-center gap-1">{hasAction && <button type="button" onClick={() => open(item)} className="rounded-lg px-3 py-2 text-xs font-bold text-[#0B4162]">View</button>}<button type="button" onClick={() => runMutation(() => item.read ? markAsUnread(item._id) : markAsRead(item._id))} aria-label={item.read ? "Mark notification as unread" : "Mark notification as read"} title={item.read ? "Mark as unread" : "Mark as read"} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-amber-50"><Check size={16} /></button><button type="button" title="Delete notification" aria-label="Delete notification" onClick={() => runMutation(() => removeNotification(item._id))} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button></div>
          </article>;
        })}</div>}
        {notifications.length < total && <button type="button" disabled={loadingMore} onClick={() => fetchNotifications(page + 1)} className="mt-4 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50">{loadingMore ? "Loading..." : "Load more"}</button>}
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h3 className="text-lg font-bold text-[#071426]">Admin Notification Preferences</h3><p className="mt-1 text-sm text-slate-500">Control operational alerts for your HoneyVision admin account. Essential security alerts are always enabled.</p>{adminPreferencesLoadError && <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"><span>Unable to load notification preferences. Please try again.</span><button type="button" onClick={retryPreferences} className="inline-flex items-center gap-1 rounded px-2 py-1 font-semibold hover:bg-red-100"><RefreshCw size={14} />Retry</button></div>}{adminPreferencesSaveError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">Unable to save notification preference. Your previous setting has been restored.</p>}{adminPreferencesLoading ? <div className="mt-4 space-y-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div> : preferences && !adminPreferencesLoadError ? <div className="mt-4 space-y-5">{preferenceGroups.map(([group, items]) => <div key={group}><h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0B4162]">{group}</h4><div className="grid gap-2 sm:grid-cols-2">{items.map(([key, title, description]) => { const security = key === "securityAlerts"; const enabled = security || Boolean(preferences[key]); const saving = Boolean(savingAdminPreference?.[key]); return <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3"><div><p className="text-sm font-semibold text-[#071426]">{title}</p><p className="mt-1 text-xs text-slate-500">{description}</p>{security && <p className="mt-1 text-xs font-medium text-[#0B4162]">Always enabled for account protection.</p>}{saving && <p className="text-xs font-semibold text-slate-500">Saving...</p>}{savedPreferences[key] && <p className="text-xs font-semibold text-emerald-600">✓ Saved</p>}</div><button type="button" disabled={security || saving} aria-pressed={enabled} aria-label={`${title}: ${enabled ? "on" : "off"}`} onClick={() => handlePreferenceChange(key, !enabled)} className={`relative h-11 w-12 shrink-0 rounded-full p-1 ${enabled ? "bg-[#F4B400]" : "bg-slate-200"} disabled:opacity-60`}><span className={`block h-9 w-9 rounded-full bg-white shadow-sm ${enabled ? "ml-2" : ""}`} /></button></div>; })}</div></div>)}</div> : null}</section>

    {confirmClear && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"><div className="flex justify-between"><h3 className="font-bold text-[#071426]">Clear all notifications?</h3><button type="button" aria-label="Cancel" onClick={() => setConfirmClear(false)}><X size={18} /></button></div><p className="mt-2 text-sm text-slate-500">This will permanently remove all notifications from your admin account.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirmClear(false)} className="px-3 py-2 text-sm">Cancel</button><button type="button" onClick={async () => { const succeeded = await runMutation(clearNotifications); if (succeeded) setConfirmClear(false); }} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white">Clear all</button></div></div></div>}
  </div>;
}

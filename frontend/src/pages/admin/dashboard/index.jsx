import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, BarChart3, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, CreditCard, Clock3, Eye, Percent, Plus, Settings, Truck, Wrench } from "lucide-react";
import SalesChart from "./SalesChart";
import OrderStatusChart from "./OrderStatusChart";
import StatCard from "./StatCard";
import { useCommerce } from "../../../context/index.js";
import { getStatusLabel } from "../../../services/orderTrackingService";
import useRealtimeUpdates from "../../../hooks/useRealtimeUpdates.js";
import { getAdminDashboard } from "../../../services/adminDashboardService.js";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const installationStatusMap = {
  total: { label: "Total Installations", status: null, icon: Wrench },
  BOOKED: { label: "Pending", status: "BOOKED", icon: Clock3 },
  CONFIRMED: { label: "Confirmed", status: "CONFIRMED", icon: ClipboardList },
  ASSIGNED: { label: "Assigned", status: "ASSIGNED", icon: Wrench },
  ON_THE_WAY: { label: "On The Way", status: "ON_THE_WAY", icon: Truck },
  INSTALLATION_IN_PROGRESS: { label: "Installation In Progress", status: "INSTALLATION_IN_PROGRESS", icon: Clock3 },
  INSTALLATION_COMPLETED: { label: "Completed", status: "INSTALLATION_COMPLETED", icon: CheckCircle2 },
  FAILED: { label: "Failed", status: "FAILED", icon: AlertTriangle },
  CANCELLED: { label: "Cancelled", status: "CANCELLED", icon: AlertTriangle },
};

const formatInstallationDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatInstallationDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const installationStatusLabel = (status) => installationStatusMap[status]?.label || status || "Pending";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

function QuickAction({ icon: Icon, title, type, onClick }) {
  const styles = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    cyan: "bg-cyan-500",
    red: "bg-red-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
    >
      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-white ${styles[type]}`}>
        <Icon size={16} />
      </div>
      <span className="truncate text-[10px] font-semibold">{title}</span>
    </button>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Pending: "bg-amber-50 text-amber-600",
    Processing: "bg-purple-50 text-purple-600",
    Shipped: "bg-blue-50 text-blue-600",
    Delivered: "bg-emerald-50 text-emerald-600",
    Cancelled: "bg-red-50 text-red-500",
  };

  return (
    <span className={`rounded-md px-2 py-1 text-[9px] font-semibold ${styles[status] || "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

export default function DashboardIndex() {
  const { authToken, user } = useCommerce();
  const { getSocket } = useRealtimeUpdates(user?.id || user?._id, authToken);
  const navigate = useNavigate();
  const [period, setPeriod] = useState("Last 7 Days");
  const [orderPage, setOrderPage] = useState(1);
  const [dashboardData, setDashboardData] = useState(null);
  const [installationStats, setInstallationStats] = useState({});
  const [recentInstallations, setRecentInstallations] = useState([]);
  const [installationLoading, setInstallationLoading] = useState(true);
  const [installationError, setInstallationError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const periodKey = { "Last 7 Days": "7days", "Last 30 Days": "30days", "Last 6 Months": "6months", "This Year": "year" }[period];

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAdminDashboard(authToken, periodKey);
        if (active) setDashboardData(data);
      } catch (loadError) {
        if (active) setError(loadError.message || "Unable to load dashboard data");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => { active = false; };
  }, [authToken, periodKey, reloadKey]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const refresh = () => setReloadKey((key) => key + 1);
    socket.on("admin:orderUpdate", refresh);
    socket.on("admin:dashboardUpdate", refresh);
    socket.on("inventory:update", refresh);
    socket.on("admin:installationUpdate", refresh);
    socket.on("admin:installationAssigned", refresh);
    socket.on("admin:installationCompleted", refresh);
    socket.on("admin:installationFailed", refresh);
    socket.on("admin:installationCancelled", refresh);
    return () => {
      socket.off("admin:orderUpdate", refresh);
      socket.off("admin:dashboardUpdate", refresh);
      socket.off("inventory:update", refresh);
      socket.off("admin:installationUpdate", refresh);
      socket.off("admin:installationAssigned", refresh);
      socket.off("admin:installationCompleted", refresh);
      socket.off("admin:installationFailed", refresh);
      socket.off("admin:installationCancelled", refresh);
    };
  }, [getSocket]);

  useEffect(() => {
    let active = true;
    const loadInstallations = async () => {
      if (!authToken) return;
      setInstallationLoading(true);
      setInstallationError("");

      try {
        const [statsRes, recentRes] = await Promise.all([
          fetch(`${API_BASE}/admin/installations/stats`, { headers: { Authorization: `Bearer ${authToken}` } }),
          fetch(`${API_BASE}/admin/installations/recent?limit=8`, { headers: { Authorization: `Bearer ${authToken}` } }),
        ]);

        if (!statsRes.ok || !recentRes.ok) {
          throw new Error("Unable to load installation data");
        }

        const [statsPayload, recentPayload] = await Promise.all([statsRes.json(), recentRes.json()]);
        if (active) {
          setInstallationStats(statsPayload.data || {});
          setRecentInstallations(recentPayload.data || []);
        }
      } catch (loadError) {
        if (active) setInstallationError(loadError.message || "Unable to load installation data");
      } finally {
        if (active) setInstallationLoading(false);
      }
    };

    loadInstallations();
    return () => { active = false; };
  }, [authToken, reloadKey]);

  const refresh = () => { setDashboardData(null); setLoading(true); setError(""); setReloadKey((key) => key + 1); };
  const summary = dashboardData?.summary || { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0, totalCategories: 0, pendingOrders: 0, lowStockItems: 0 };
  const orders = dashboardData?.recentOrders || [];
  const installationTotals = useMemo(() => {
    const values = installationStats || {};
    const total = Number(values.total || 0);
    return {
      total,
      BOOKED: Number(values.BOOKED || 0),
      CONFIRMED: Number(values.CONFIRMED || 0),
      ASSIGNED: Number(values.ASSIGNED || 0),
      ON_THE_WAY: Number(values.ON_THE_WAY || 0),
      INSTALLATION_IN_PROGRESS: Number(values.INSTALLATION_IN_PROGRESS || 0),
      INSTALLATION_COMPLETED: Number(values.INSTALLATION_COMPLETED || 0),
      FAILED: Number(values.FAILED || 0),
      CANCELLED: Number(values.CANCELLED || 0),
    };
  }, [installationStats]);
  const installationCards = [
    { key: "total", label: "Total Installations", value: installationTotals.total, status: null },
    { key: "BOOKED", label: "Pending", value: installationTotals.BOOKED, status: "BOOKED" },
    { key: "CONFIRMED", label: "Confirmed", value: installationTotals.CONFIRMED, status: "CONFIRMED" },
    { key: "ASSIGNED", label: "Assigned", value: installationTotals.ASSIGNED, status: "ASSIGNED" },
    { key: "ON_THE_WAY", label: "On The Way", value: installationTotals.ON_THE_WAY, status: "ON_THE_WAY" },
    { key: "INSTALLATION_IN_PROGRESS", label: "Installation In Progress", value: installationTotals.INSTALLATION_IN_PROGRESS, status: "INSTALLATION_IN_PROGRESS" },
    { key: "INSTALLATION_COMPLETED", label: "Completed", value: installationTotals.INSTALLATION_COMPLETED, status: "INSTALLATION_COMPLETED" },
    { key: "FAILED", label: "Failed", value: installationTotals.FAILED, status: "FAILED" },
    { key: "CANCELLED", label: "Cancelled", value: installationTotals.CANCELLED, status: "CANCELLED" },
  ];
  const salesData = (dashboardData?.salesOverview?.labels || []).map((label, index) => ({ label, value: dashboardData.salesOverview.revenue[index] || 0 }));
  const dashboardStats = [
    { title: "Total Revenue", value: formatCurrency(summary.totalRevenue), change: summary.revenueChange ? `${summary.revenueChange.percentageChange}%` : "", type: "revenue" },
    { title: "Total Orders", value: String(summary.totalOrders), change: summary.ordersChange ? `${summary.ordersChange.percentageChange}%` : "", type: "orders" },
    { title: "Customers", value: String(summary.totalCustomers), type: "customers" },
    { title: "Products", value: String(summary.totalProducts), type: "products" },
    { title: "Categories", value: String(summary.totalCategories), type: "products" },
    { title: "Pending Orders", value: String(summary.pendingOrders), type: "pending" },
    { title: "Low Stock Items", value: String(summary.lowStockItems), type: "lowstock" },
  ];
  const ordersPerPage = 5;
  const totalOrderPages = Math.max(1, Math.ceil(orders.length / ordersPerPage));
  const pagedOrders = orders.slice((orderPage - 1) * ordersPerPage, orderPage * ordersPerPage).map((order) => ({
    id: order.orderNumber,
    customer: order.customerName,
    product: order.items?.[0]?.name || "Product",
    amount: formatCurrency(order.totalAmount),
    status: getStatusLabel(order.status),
    date: formatDate(order.createdAt),
    image: order.items?.[0]?.image || "",
  }));
  const lowStockProducts = (dashboardData?.lowStockProducts || []).slice(0, 4).map((product) => ({ name: product.name, stock: product.stock, image: product.thumbnail || product.images?.[0] || "" }));
  const topProducts = (dashboardData?.topSellingProducts || []).slice(0, 4).map((product) => ({ name: product.name, sold: product.unitsSold, image: product.image || "" }));

  if (loading && !dashboardData) return <div className="min-w-0 flex-1 bg-[#f5f7fa] p-6"><div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading dashboard data...</div></div>;
  if (error && !dashboardData) return <div className="min-w-0 flex-1 bg-[#f5f7fa] p-6"><div className="rounded-xl border border-red-200 bg-white p-8 text-center"><p className="text-sm text-red-600">{error}</p><button type="button" onClick={refresh} className="mt-4 rounded-lg bg-[#071426] px-4 py-2 text-xs font-semibold text-white">Retry</button></div></div>;

  return (
    <div className="min-w-0 flex-1 bg-[#f5f7fa] text-slate-900">
      <main className="p-4 sm:p-5 lg:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900">Good Morning, Admin 👋</h1>
            <p className="mt-1 text-xs text-slate-500">Here's what's happening with your store today.</p>
          </div>

          <button type="button" onClick={() => navigate("/admin/products")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-400 hover:text-slate-950">
            <Plus size={16} />Add Product
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
          {dashboardStats.map((stat) => <StatCard key={stat.title} stat={stat} onClick={() => navigate({
            revenue: "/admin/reports",
            orders: "/admin/orders",
            customers: "/admin/customers",
            products: "/admin/products",
            pending: "/admin/orders",
            lowstock: "/admin/inventory",
          }[stat.type] || "/admin")} />)}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold">Sales Overview</h2>
                <p className="mt-1 text-[10px] text-slate-500">Revenue performance over the selected period</p>
              </div>

              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 6 Months</option>
                <option>This Year</option>
              </select>
            </div>

            <SalesChart data={salesData} />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Order Status</h2>
              <select className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] outline-none">
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
              </select>
            </div>
            <OrderStatusChart statusCounts={dashboardData?.orderStatus || {}} />
          </section>
        </div>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Installation management</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Installation Management</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => navigate("/admin/installations")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:border-slate-300">
                View Installation History
              </button>
              <button type="button" onClick={() => navigate("/admin/installations?view=new")} className="rounded-lg bg-[#071426] px-3 py-2 text-[11px] font-semibold text-white hover:bg-amber-400 hover:text-slate-950">
                + New Installation Booking
              </button>
            </div>
          </div>

          {installationError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
              <p className="text-sm font-semibold text-red-700">Unable to load installation data.</p>
              <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white">Retry</button>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {installationCards.slice(0, 4).map(({ key, label, value, status }) => {
                  const Icon = installationStatusMap[status || "total"].icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => navigate(status ? `/admin/installations?status=${encodeURIComponent(status)}` : "/admin/installations")}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                        <Icon size={16} className="text-slate-500" />
                      </div>
                      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {installationCards.slice(4).map(({ key, label, value, status }) => {
                  const Icon = installationStatusMap[status || "total"].icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => navigate(`/admin/installations?status=${encodeURIComponent(status)}`)}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                        <Icon size={16} className="text-slate-500" />
                      </div>
                      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h3 className="text-sm font-bold text-slate-900">Recent Installation Bookings</h3>
                  <button type="button" onClick={() => navigate("/admin/installations")} className="text-[11px] font-semibold text-blue-600 hover:text-amber-500">
                    View All Installations →
                  </button>
                </div>

                {installationLoading ? (
                  <div className="p-6 text-center text-sm text-slate-500">Loading installation data...</div>
                ) : recentInstallations.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm font-medium text-slate-700">No installation bookings yet.</p>
                    <p className="mt-2 text-sm text-slate-500">Once customers book an installation, their bookings will appear here.</p>
                    <button type="button" onClick={() => navigate("/admin/installations")} className="mt-4 rounded-lg bg-[#071426] px-4 py-2 text-xs font-semibold text-white">View Installation Management</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">Booking ID</th>
                          <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">Customer</th>
                          <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">Installation Type</th>
                          <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">Scheduled Date</th>
                          <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">Assigned Agent</th>
                          <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">Status</th>
                          <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">Last Updated</th>
                          <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentInstallations.map((booking) => {
                          const agentName = booking.assignedAgentId?.name || booking.assignedAgentName || "—";
                          const status = booking.status || "BOOKED";
                          const bookingId = booking.id || booking.bookingNumber || booking._id;
                          return (
                            <tr key={String(booking._id)} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-3 text-[11px] font-semibold text-slate-900">{bookingId}</td>
                              <td className="px-4 py-3 text-[11px] text-slate-700">{booking.customerName || booking.customer?.name || booking.userId?.name || "Unknown customer"}</td>
                              <td className="px-4 py-3 text-[11px] text-slate-700">{booking.service || "Installation"}</td>
                              <td className="px-4 py-3 text-[11px] text-slate-700">{formatInstallationDate(booking.scheduledDate || booking.preferredDate)}</td>
                              <td className="px-4 py-3 text-[11px] text-slate-700">{agentName}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${
                                  status === "INSTALLATION_COMPLETED" ? "bg-emerald-50 text-emerald-600" :
                                  status === "FAILED" ? "bg-red-50 text-red-600" :
                                  status === "ASSIGNED" || status === "ON_THE_WAY" ? "bg-purple-50 text-purple-600" :
                                  status === "BOOKED" ? "bg-amber-50 text-amber-600" :
                                  status === "INSTALLATION_IN_PROGRESS" ? "bg-lime-50 text-lime-600" :
                                  "bg-slate-100 text-slate-600"
                                }`}>
                                  {installationStatusLabel(status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[10px] text-slate-500">{formatInstallationDateTime(booking.updatedAt || booking.createdAt)}</td>
                              <td className="px-4 py-3">
                                <button type="button" onClick={() => navigate(`/admin/installations/${encodeURIComponent(bookingId)}`)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 hover:border-slate-300">
                                  <Eye size={12} /> View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="text-sm font-bold">Recent Orders</h2>
              <button type="button" onClick={() => navigate("/admin/orders")} className="text-[11px] font-semibold text-blue-600 hover:text-amber-500">View All Orders</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-500">ORDER ID</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-500">CUSTOMER</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-500">PRODUCT</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-500">AMOUNT</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-500">STATUS</th>
                    <th className="px-4 py-3 text-[9px] font-bold text-slate-500">DATE</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {pagedOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                      <td className="px-4 py-3 text-[11px] font-semibold">{order.id}</td>
                      <td className="px-4 py-3 text-[11px]">{order.customer}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {order.image ? <img src={order.image} alt={order.product} className="h-7 w-8 rounded object-cover" /> : <span className="h-7 w-8 rounded bg-slate-100" aria-hidden="true" />}
                          <span className="text-[10px] text-slate-600">{order.product}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-semibold">{order.amount}</td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-[10px] text-slate-500">{order.date}</td>
                      <td className="px-4 py-3"><button type="button" aria-label={`Open order ${order.id}`} onClick={() => navigate("/admin/orders")} className="text-lg text-slate-400 hover:text-slate-900">⋮</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-[10px] text-slate-500">Showing {orders.length ? (orderPage - 1) * ordersPerPage + 1 : 0} to {Math.min(orderPage * ordersPerPage, orders.length)} of {orders.length} orders</p>
              <div className="flex items-center gap-1">
                <button type="button" disabled={orderPage === 1} onClick={() => setOrderPage((page) => Math.max(1, page - 1))} className="grid h-7 w-7 place-items-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={13} /></button>
                <span className="min-w-7 text-center text-xs font-semibold">{orderPage} / {totalOrderPages}</span>
                <button type="button" disabled={orderPage === totalOrderPages} onClick={() => setOrderPage((page) => Math.min(totalOrderPages, page + 1))} className="grid h-7 w-7 place-items-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={13} /></button>
              </div>
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h2 className="text-sm font-bold">Low Stock Products</h2>
                <button type="button" onClick={() => navigate("/admin/inventory")} className="text-[10px] font-semibold text-blue-600">View Inventory</button>
              </div>

              <div className="divide-y divide-slate-100">
                {lowStockProducts.map((product) => (
                  <button type="button" key={product.name} onClick={() => navigate("/admin/inventory")} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50">
                    <div className="flex min-w-0 items-center gap-3">
                      {product.image ? <img src={product.image} alt={product.name} className="h-8 w-9 rounded object-cover" /> : <span className="h-8 w-9 rounded bg-slate-100" aria-hidden="true" />}
                      <p className="truncate text-[10px] font-medium">{product.name}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-red-50 px-2 py-1 text-[9px] font-semibold text-red-500">{product.stock} left</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h2 className="text-sm font-bold">Top Selling Products</h2>
                <button type="button" onClick={() => navigate("/admin/products")} className="text-[10px] font-semibold text-blue-600">View Products</button>
              </div>

              <div className="divide-y divide-slate-100">
                {topProducts.map((product) => (
                  <button type="button" key={product.name} onClick={() => navigate("/admin/products")} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50">
                    <div className="flex min-w-0 items-center gap-3">
                      {product.image ? <img src={product.image} alt={product.name} className="h-8 w-9 rounded bg-slate-100 object-cover" aria-hidden="true" /> : <span className="h-8 w-9 rounded bg-slate-100" aria-hidden="true" />}
                      <p className="truncate text-[10px] font-medium">{product.name}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600">{product.sold} sold</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold">Quick Actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <QuickAction icon={Plus} title="Add Product" type="blue" onClick={() => navigate("/admin/products")} />
            <QuickAction icon={ClipboardList} title="Manage Orders" type="green" onClick={() => navigate("/admin/orders")} />
            <QuickAction icon={Percent} title="Create Coupon" type="purple" onClick={() => navigate("/admin/coupons")} />
            <QuickAction icon={Truck} title="Delivery Settings" type="orange" onClick={() => navigate("/admin/delivery")} />
            <QuickAction icon={CreditCard} title="Payment Settings" type="blue" onClick={() => navigate("/admin/payments")} />
            <QuickAction icon={Settings} title="Website Settings" type="cyan" onClick={() => navigate("/admin/settings")} />
            <QuickAction icon={BarChart3} title="View Reports" type="red" onClick={() => navigate("/admin/reports")} />
          </div>
        </section>
      </main>
    </div>
  );
}

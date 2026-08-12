import { useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronLeft, ChevronRight, ClipboardList, CreditCard, Percent, Plus, Settings, Truck } from "lucide-react";
import SalesChart from "./SalesChart";
import OrderStatusChart from "./OrderStatusChart";
import StatCard from "./StatCard";
import { loadAdminData } from "../adminData";
import { products as projectProducts } from "../../../lib/products";

const productImages = {
  "4MP AI CCTV Camera": "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786174380/blog2_fyfiq2.png",
  "Solar CCTV Camera": "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786178835/blog3_rezrfp.png",
  "8 Channel NVR": "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786174374/blog4_fgkwc0.png",
  "1TB Surveillance HDD": "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786173897/blog1_jetmtz.png",
  "128GB Memory Card": "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786174380/blog2_fyfiq2.png",
  default: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786174380/blog2_fyfiq2.png",
};

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

const normalizeOrder = (order, index = 0) => ({
  id: order?.id || `HV${String(index + 1).padStart(4, "0")}`,
  customer: order?.customer || order?.shippingAddress?.name || `Customer ${index + 1}`,
  phone: order?.phone || order?.shippingAddress?.phone || "",
  status: order?.status || "Pending",
  amount: Number(order?.total || order?.amount || 0),
  date: order?.createdAt ? new Date(order.createdAt).toISOString().split("T")[0] : order?.date || new Date().toISOString().split("T")[0],
});

const mergeOrderRows = (source = []) => {
  const map = new Map();

  (Array.isArray(source) ? source : []).forEach((order, index) => {
    const normalized = normalizeOrder(order, index);
    if (normalized.id) {
      map.set(normalized.id, { ...map.get(normalized.id), ...normalized });
    }
  });

  return Array.from(map.values());
};

export default function DashboardIndex() {
  const [period, setPeriod] = useState("Last 7 Days");
  const [dashboardData, setDashboardData] = useState({
    orders: [],
    products: projectProducts,
    customers: [],
    settings: { lowStockLimit: 5 },
  });

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      const adminData = loadAdminData() || {};
      const fallbackProducts = Array.isArray(adminData.products) && adminData.products.length ? adminData.products : projectProducts;
      const fallbackCustomers = Array.isArray(adminData.customers) ? adminData.customers : [];
      const fallbackSettings = adminData.settings || {};

      let liveOrders = [];
      try {
        const response = await fetch("/api/orders");
        if (response.ok) {
          const payload = await response.json();
          if (Array.isArray(payload)) liveOrders = payload;
        }
      } catch {
        // keep the fallback admin order data when the public API is unavailable
      }

      const storedOrders = Array.isArray(adminData.orders) ? adminData.orders : [];
      const orders = mergeOrderRows([...liveOrders, ...storedOrders]);

      if (!active) return;
      setDashboardData({
        orders,
        products: fallbackProducts,
        customers: fallbackCustomers,
        settings: fallbackSettings,
      });
    };

    loadData();
    return () => { active = false; };
  }, []);

  const { orders, products, customers, settings } = dashboardData;
  const lowStockLimit = Number(settings.lowStockLimit || 5);

  const salesData = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      const key = order.date;
      if (!key) return;
      map[key] = (map[key] || 0) + Number(order.amount || 0);
    });

    const sortedDates = Object.keys(map).sort((a, b) => new Date(a) - new Date(b));
    const lastDates = sortedDates.slice(-7);

    if (!lastDates.length) {
      const fallback = [];
      for (let index = 6; index >= 0; index -= 1) {
        const date = new Date();
        date.setDate(date.getDate() - index);
        fallback.push({
          label: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          value: 0,
        });
      }
      return fallback;
    }

    return lastDates.map((date) => ({
      label: new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      value: map[date],
    }));
  }, [orders]);

  const dashboardStats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const pendingOrders = orders.filter((order) => order.status === "Pending").length;
    const lowStockItems = products.filter((product) => Number(product.stock || 0) <= lowStockLimit).length;

    return [
      { title: "Total Revenue", value: formatCurrency(totalRevenue), change: "18.4%", type: "revenue" },
      { title: "Total Orders", value: String(orders.length), change: "12.5%", type: "orders" },
      { title: "Customers", value: String(customers.length), change: "8.2%", type: "customers" },
      { title: "Products", value: String(products.length), change: "4.1%", type: "products" },
      { title: "Pending Orders", value: String(pendingOrders), type: "pending" },
      { title: "Low Stock Items", value: String(lowStockItems), type: "lowstock" },
    ];
  }, [customers.length, lowStockLimit, orders, products]);

  const displayedOrders = [...orders].slice(0, 5).map((order, index) => {
    const product = products.find((item) => item.name === order.product) || products[index % Math.max(products.length, 1)] || { name: "Product", image: productImages.default };
    return {
      id: order.id,
      customer: order.customer,
      product: product.name,
      amount: formatCurrency(order.amount),
      status: order.status,
      date: formatDate(order.date),
      image: productImages[product.name] || productImages.default,
    };
  });

  const lowStockProducts = [...products]
    .filter((product) => Number(product.stock || 0) <= lowStockLimit)
    .slice(0, 4)
    .map((product) => ({
      name: product.name,
      stock: Number(product.stock || 0),
      image: productImages[product.name] || productImages.default,
    }));

  const topProducts = [...products]
    .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    .slice(0, 4)
    .map((product) => ({
      name: product.name,
      sold: Math.max(12, Math.round(Number(product.stock || 0) * 2.5)),
      image: productImages[product.name] || productImages.default,
    }));

  return (
    <div className="min-w-0 flex-1 bg-[#f5f7fa] text-slate-900">
      <main className="p-4 sm:p-5 lg:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900">Good Morning, Admin 👋</h1>
            <p className="mt-1 text-xs text-slate-500">Here's what's happening with your store today.</p>
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-400 hover:text-slate-950">
            <Plus size={16} />Add Product
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
          {dashboardStats.map((stat) => <StatCard key={stat.title} stat={stat} />)}
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
            <OrderStatusChart orders={orders} />
          </section>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="text-sm font-bold">Recent Orders</h2>
              <button className="text-[11px] font-semibold text-blue-600 hover:text-amber-500">View All Orders</button>
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
                  {displayedOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                      <td className="px-4 py-3 text-[11px] font-semibold">{order.id}</td>
                      <td className="px-4 py-3 text-[11px]">{order.customer}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={order.image} alt={order.product} className="h-7 w-8 rounded object-cover" />
                          <span className="text-[10px] text-slate-600">{order.product}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-semibold">{order.amount}</td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-[10px] text-slate-500">{order.date}</td>
                      <td className="px-4 py-3"><button className="text-lg text-slate-400 hover:text-slate-900">⋮</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-[10px] text-slate-500">Showing 1 to {Math.min(displayedOrders.length, 5)} of {orders.length} orders</p>
              <div className="flex items-center gap-1">
                <button className="grid h-7 w-7 place-items-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100"><ChevronLeft size={13} /></button>
                <button className="grid h-7 w-7 place-items-center rounded bg-amber-400 text-xs font-semibold">1</button>
                <button className="grid h-7 w-7 place-items-center rounded border border-slate-200 text-xs hover:bg-slate-100">2</button>
                <button className="grid h-7 w-7 place-items-center rounded border border-slate-200 text-xs hover:bg-slate-100">3</button>
                <span className="px-1 text-xs text-slate-400">...</span>
                <button className="grid h-7 w-7 place-items-center rounded border border-slate-200 text-xs hover:bg-slate-100">50</button>
                <button className="grid h-7 w-7 place-items-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100"><ChevronRight size={13} /></button>
              </div>
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h2 className="text-sm font-bold">Low Stock Products</h2>
                <button className="text-[10px] font-semibold text-blue-600">View Inventory</button>
              </div>

              <div className="divide-y divide-slate-100">
                {lowStockProducts.map((product) => (
                  <div key={product.name} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={product.image} alt={product.name} className="h-8 w-9 rounded object-cover" />
                      <p className="truncate text-[10px] font-medium">{product.name}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-red-50 px-2 py-1 text-[9px] font-semibold text-red-500">{product.stock} left</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h2 className="text-sm font-bold">Top Selling Products</h2>
                <button className="text-[10px] font-semibold text-blue-600">View Products</button>
              </div>

              <div className="divide-y divide-slate-100">
                {topProducts.map((product) => (
                  <div key={product.name} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={product.image} alt={product.name} className="h-8 w-9 rounded object-cover" />
                      <p className="truncate text-[10px] font-medium">{product.name}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600">{product.sold} sold</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold">Quick Actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <QuickAction icon={Plus} title="Add Product" type="blue" onClick={() => {}} />
            <QuickAction icon={ClipboardList} title="Manage Orders" type="green" onClick={() => {}} />
            <QuickAction icon={Percent} title="Create Coupon" type="purple" onClick={() => {}} />
            <QuickAction icon={Truck} title="Delivery Settings" type="orange" onClick={() => {}} />
            <QuickAction icon={CreditCard} title="Payment Settings" type="blue" onClick={() => {}} />
            <QuickAction icon={Settings} title="Website Settings" type="cyan" onClick={() => {}} />
            <QuickAction icon={BarChart3} title="View Reports" type="red" onClick={() => {}} />
          </div>
        </section>
      </main>
    </div>
  );
}

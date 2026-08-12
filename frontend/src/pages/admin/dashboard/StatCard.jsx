import { AlertTriangle, ClipboardList, Package, ShoppingCart, Users } from "lucide-react";

export default function StatCard({ stat }) {
  const config = {
    revenue: { icon: "₹", bg: "bg-amber-400", text: "text-amber-500", showChange: true },
    orders: { icon: ShoppingCart, bg: "bg-blue-500", text: "text-blue-500", showChange: true },
    customers: { icon: Users, bg: "bg-purple-500", text: "text-purple-500", showChange: true },
    products: { icon: Package, bg: "bg-emerald-500", text: "text-emerald-500", showChange: true },
    pending: { icon: ClipboardList, bg: "bg-orange-500", text: "text-orange-500", showChange: false },
    lowstock: { icon: AlertTriangle, bg: "bg-red-500", text: "text-red-500", showChange: false },
  };

  const item = config[stat.type];
  const Icon = item.icon;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] text-slate-500">{stat.title}</p>
          <h3 className="mt-2 text-[20px] font-bold tracking-tight">{stat.value}</h3>

          {item.showChange ? (
            <p className="mt-1 text-[9px]">
              <span className="font-semibold text-emerald-500">↑ {stat.change}</span>
              <span className="ml-1 text-slate-400">vs last month</span>
            </p>
          ) : (
            <p className={`mt-1 text-[9px] font-medium ${item.text}`}>
              View {stat.type === "pending" ? "all pending orders" : "all low stock items"}
            </p>
          )}
        </div>

        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${item.bg} text-white`}>
          {stat.type === "revenue" ? <span className="text-xl font-bold">₹</span> : <Icon size={20} />}
        </div>
      </div>
    </div>
  );
}

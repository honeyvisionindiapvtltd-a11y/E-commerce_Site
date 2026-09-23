import { useMemo } from "react";

const STATUS_CONFIG = [
  ["ORDER_PLACED", "Order Placed", "bg-amber-400", "#fbbf24"],
  ["PROCESSING", "Processing", "bg-blue-500", "#3b82f6"],
  ["PACKED", "Packed", "bg-indigo-500", "#6366f1"],
  ["SHIPPED", "Shipped", "bg-purple-500", "#8b5cf6"],
  ["OUT_FOR_DELIVERY", "Out for Delivery", "bg-orange-500", "#f97316"],
  ["DELIVERED", "Delivered", "bg-emerald-500", "#22c55e"],
  ["CANCELLED", "Cancelled", "bg-red-500", "#ef4444"],
  ["FAILED_DELIVERY", "Failed Delivery", "bg-rose-600", "#e11d48"],
  ["RETURN_REQUESTED", "Return Requested", "bg-yellow-600", "#ca8a04"],
  ["RETURNED", "Returned", "bg-slate-500", "#64748b"],
];

function OrderLegend({ color, name, count, percentage }) {
  return <div className="flex items-center gap-2 text-[10px]"><span className={`h-2 w-2 rounded-full ${color}`} /><span className="flex-1">{name}</span><span className="text-slate-700">{count}</span><span className="text-slate-500">({percentage})</span></div>;
}

export default function OrderStatusChart({ statusCounts = {} }) {
  const statusData = useMemo(() => STATUS_CONFIG.map(([key, name, color, chartColor]) => ({ name, color, chartColor, count: Number(statusCounts[key] || 0) })), [statusCounts]);
  const total = statusData.reduce((sum, item) => sum + item.count, 0);
  const segments = useMemo(() => {
    if (!total) return "#e2e8f0 0deg 360deg";
    let current = 0;
    return `conic-gradient(${statusData.map((item) => { const start = current; current += (item.count / total) * 360; return `${item.chartColor} ${start}deg ${current}deg`; }).join(", ")})`;
  }, [statusData, total]);

  return <div className="mt-5 flex items-center gap-5"><div className="relative h-[175px] w-[175px] shrink-0"><div className="h-full w-full rounded-full" style={{ background: segments }} /><div className="absolute inset-[25px] grid place-items-center rounded-full bg-white"><div className="text-center"><p className="text-[24px] font-bold">{total}</p><p className="text-[9px] text-slate-500">Total</p></div></div></div><div className="min-w-0 flex-1 space-y-4">{statusData.map((item) => <OrderLegend key={item.name} color={item.color} name={item.name} count={item.count} percentage={total ? `${Math.round((item.count / total) * 100)}%` : "0%"} />)}</div></div>;
}

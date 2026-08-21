import { useMemo } from "react";

const STATUS_COLORS = {
  Pending: "bg-amber-400",
  Processing: "bg-blue-500",
  Shipped: "bg-purple-500",
  Delivered: "bg-emerald-500",
  Cancelled: "bg-red-500",
};

const STATUS_ORDER = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

function OrderLegend({ color, name, count, percentage }) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="flex-1">{name}</span>
      <span className="text-slate-700">{count}</span>
      <span className="text-slate-500">({percentage})</span>
    </div>
  );
}

export default function OrderStatusChart({ orders = [] }) {
  const statusData = useMemo(() => {
    const counts = STATUS_ORDER.reduce((result, status) => {
      result[status] = 0;
      return result;
    }, {});

    orders.forEach((order) => {
      const status = STATUS_ORDER.includes(order.status) ? order.status : "Pending";
      counts[status] += 1;
    });

    const total = orders.length || 0;

    return STATUS_ORDER.map((status) => ({
      name: status,
      color: STATUS_COLORS[status],
      count: counts[status],
      percentage: total ? `${Math.round((counts[status] / total) * 100)}%` : "0%",
    }));
  }, [orders]);

  const total = orders.length;

  const segments = useMemo(() => {
    if (!total) {
      return "#e2e8f0 0deg 360deg";
    }

    let current = 0;
    const pieces = statusData.map((item) => {
      const start = current;
      const end = current + (item.count / total) * 360;
      current = end;
      const colorMap = {
        Pending: "#fbbf24",
        Processing: "#3b82f6",
        Shipped: "#8b5cf6",
        Delivered: "#22c55e",
        Cancelled: "#ef4444",
      };
      return `${colorMap[item.name]} ${start}deg ${end}deg`;
    });

    return `conic-gradient(${pieces.join(", ")})`;
  }, [statusData, total]);

  return (
    <div className="mt-5 flex items-center gap-5">
      <div className="relative h-[175px] w-[175px] shrink-0">
        <div
          className="h-full w-full rounded-full"
          style={{ background: segments }}
        />

        <div className="absolute inset-[25px] grid place-items-center rounded-full bg-white">
          <div className="text-center">
            <p className="text-[24px] font-bold">{total}</p>
            <p className="text-[9px] text-slate-500">Total</p>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-4">
        {statusData.map((item) => (
          <OrderLegend
            key={item.name}
            color={item.color}
            name={item.name}
            count={item.count}
            percentage={item.percentage}
          />
        ))}
      </div>
    </div>
  );
}
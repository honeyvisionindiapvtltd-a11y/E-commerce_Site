import React from 'react'

export default function OrderStatusChart({ orders = [] }) {
  const counts = (orders || []).reduce((acc, o) => {
    const status = o.status || 'Pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts);

  if (!entries.length) {
    return (
      <div className="p-4 text-sm text-slate-500">No order data available</div>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {entries.map(([status, count]) => (
        <div key={status} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <div className="text-xs text-slate-400">{status}</div>
          <div className="mt-1 text-lg font-bold">{count}</div>
        </div>
      ))}
    </div>
  );
}

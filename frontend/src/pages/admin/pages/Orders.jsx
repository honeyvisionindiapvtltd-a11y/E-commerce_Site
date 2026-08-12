import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { adminList, adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";
import Modal from "../components/Modal";

const badge = (status) => ({
  Pending: "bg-amber-50 text-amber-600",
  Processing: "bg-purple-50 text-purple-600",
  Shipped: "bg-blue-50 text-blue-600",
  Delivered: "bg-emerald-50 text-emerald-600",
  Cancelled: "bg-red-50 text-red-500",
}[status] || "bg-slate-100 text-slate-500");

const normalizeOrder = (order, index = 0) => {
  const createdAt = order?.createdAt ? new Date(order.createdAt) : new Date();

  return {
    id: order?.id || `HV${(index + 1).toString().padStart(4, "0")}`,
    customer: order?.customer || order?.shippingAddress?.name || `Customer ${index + 1}`,
    phone: order?.phone || order?.shippingAddress?.phone || "",
    items: Array.isArray(order?.items)
      ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
      : Number(order?.items || 0),
    amount: Number(order?.total || order?.amount || 0),
    payment: order?.paymentMethod ? String(order.paymentMethod).toUpperCase() : order?.payment || "COD",
    status: order?.status || "Pending",
    date: order?.createdAt ? createdAt.toISOString().split("T")[0] : order?.date || createdAt.toISOString().split("T")[0],
  };
};

const buildOrderRows = (source = []) => {
  const map = new Map();

  (Array.isArray(source) ? source : []).forEach((order) => {
    const normalized = normalizeOrder(order, Math.random() * 1000);
    if (normalized.id) {
      map.set(normalized.id, { ...map.get(normalized.id), ...normalized });
    }
  });

  return Array.from(map.values());
};

export default function Orders() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState(null);

  const refreshRows = async () => {
    const liveOrders = [];
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const payload = await response.json();
        if (Array.isArray(payload)) liveOrders.push(...payload);
      }
    } catch {
      // ignore fetch failures and fall back to local admin data
    }

    const stored = await adminList("orders");
    setRows(buildOrderRows([...liveOrders, ...(Array.isArray(stored) ? stored : [])]));
  };

  useEffect(() => {
    let active = true;
    const loadRows = async () => {
      const liveOrders = [];
      try {
        const response = await fetch("/api/orders");
        if (response.ok) {
          const payload = await response.json();
          if (Array.isArray(payload)) liveOrders.push(...payload);
        }
      } catch {
        // ignore fetch failures and fall back to local admin data
      }

      const stored = await adminList("orders");
      if (active) setRows(buildOrderRows([...liveOrders, ...(Array.isArray(stored) ? stored : [])]));
    };

    loadRows();
    return () => { active = false; };
  }, []);

  const update = async (id, status) => {
    await adminUpdate("orders", id, { status });
    await refreshRows();
  };

  const filtered = rows.filter((row) =>
    (filter === "All" || row.status === filter) &&
    Object.values(row).join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Orders" description="View, process and track every customer order." />
      <Toolbar
        search={q}
        setSearch={setQ}
        filter={filter}
        setFilter={setFilter}
        options={["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]}
      />

      <Table
        rows={filtered}
        columns={[
          { key: "id", label: "Order ID", render: (row) => <b>#{row.id}</b> },
          { key: "customer", label: "Customer", render: (row) => (
              <div>
                <b>{row.customer}</b>
                <p className="text-[9px] text-slate-400">{row.phone}</p>
              </div>
            )
          },
          { key: "items", label: "Items" },
          { key: "amount", label: "Amount", render: (row) => `₹${Number(row.amount || 0).toLocaleString()}` },
          { key: "payment", label: "Payment" },
          { key: "status", label: "Status", render: (row) => (
              <select
                value={row.status}
                onChange={(event) => update(row.id, event.target.value)}
                className={`rounded px-2 py-1 text-[9px] font-semibold outline-none ${badge(row.status)}`}
              >
                <option>Pending</option>
                <option>Processing</option>
                <option>Shipped</option>
                <option>Delivered</option>
                <option>Cancelled</option>
              </select>
            )
          },
          { key: "date", label: "Date" },
          { key: "view", label: "View", render: (row) => (
              <button onClick={() => setView(row)} className="rounded p-1.5 hover:bg-slate-100">
                <Eye size={15} />
              </button>
            )
          },
        ]}
      />

      <Modal open={!!view} title={`Order #${view?.id || ""}`} onClose={() => setView(null)}>
        {view && (
          <div className="space-y-3 text-xs">
            <p><b>Customer:</b> {view.customer}</p>
            <p><b>Phone:</b> {view.phone}</p>
            <p><b>Items:</b> {view.items}</p>
            <p><b>Total:</b> ₹{Number(view.amount || 0).toLocaleString()}</p>
            <p><b>Payment:</b> {view.payment}</p>
            <p><b>Status:</b> {view.status}</p>
            <p><b>Date:</b> {view.date}</p>
            <button
              onClick={() => {
                setView(null);
                update(view.id, "Processing");
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#071426] px-4 py-2 text-xs font-semibold text-white"
            >
              Mark as Processing
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

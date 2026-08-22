import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { useCommerce } from "../../../context/CommerceContext";
import { ORDER_STATUSES, getStatusLabel } from "../../../services/orderTrackingService";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";
import Modal from "../components/Modal";

const badge = (status) => ({
  ORDER_PLACED: "bg-amber-50 text-amber-600",
  PAYMENT_CONFIRMED: "bg-amber-50 text-amber-600",
  Processing: "bg-purple-50 text-purple-600",
  PACKED: "bg-purple-50 text-purple-600",
  SHIPPED: "bg-blue-50 text-blue-600",
  OUT_FOR_DELIVERY: "bg-blue-50 text-blue-600",
  DELIVERED: "bg-emerald-50 text-emerald-600",
  CANCELLED: "bg-red-50 text-red-500",
}[status] || "bg-slate-100 text-slate-500");

const normalizeOrder = (order, index = 0) => {
  const createdAt = order?.createdAt ? new Date(order.createdAt) : new Date();

  return {
    id: order?.orderNumber || order?.id || order?._id || `HV${(index + 1).toString().padStart(4, "0")}`,
    customer: order?.customer || order?.shippingAddress?.name || `Customer ${index + 1}`,
    phone: order?.phone || order?.shippingAddress?.phone || "",
    items: Array.isArray(order?.items)
      ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
      : Number(order?.items || 0),
    amount: Number(order?.totalAmount || order?.total || order?.amount || 0),
    payment: String(order?.paymentMethod || order?.payment || "COD").toUpperCase() === "COD"
      ? "Cash on Delivery"
      : "Online",
    status: order?.status || ORDER_STATUSES.ORDER_PLACED,
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
  const { authToken } = useCommerce();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState(null);

  const refreshRows = async () => {
    try {
      const response = await fetch("/api/admin/orders?limit=100", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const payload = await response.json();
        setRows(buildOrderRows(payload.orders || []));
      }
    } catch {
      // Preserve the current list when the API is temporarily unavailable.
    }
  };

  useEffect(() => {
    let active = true;
    const loadRows = async () => {
      try {
        const response = await fetch("/api/admin/orders?limit=100", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (response.ok) {
          const payload = await response.json();
          if (active) setRows(buildOrderRows(payload.orders || []));
        }
      } catch {
        // Preserve the current list when the API is temporarily unavailable.
      }
    };

    loadRows();
    return () => { active = false; };
  }, [authToken]);

  const update = async (id, status) => {
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ newStatus: status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update order status");
      await refreshRows();
    } catch (error) {
      window.alert(error.message);
    }
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
        options={Object.values(ORDER_STATUSES)}
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
                {Object.values(ORDER_STATUSES).map((status) => (
                  <option key={status} value={status}>{getStatusLabel(status)}</option>
                ))}
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

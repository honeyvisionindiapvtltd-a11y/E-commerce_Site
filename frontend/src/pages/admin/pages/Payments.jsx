
import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { adminList, adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";

const normalizeOrderToPayment = (order, index = 0) => {
  const method = order.paymentMethod || "cod";
  const gateway = method === "cod" ? "COD" : method === "upi" ? "PhonePe" : "Razorpay";

  return {
    id: `pay-${order.id || index}`,
    order: order.id || `HV-${index + 1}`,
    customer: order.customer || order.shippingAddress?.name || "Customer",
    gateway,
    method: method === "cod" ? "Cash" : method.toUpperCase(),
    amount: Number(order.total || order.amount || 0),
    status: order.paymentStatus === "Paid" || order.status === "Delivered" ? "Success" : "Pending",
    date: order.createdAt ? new Date(order.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
  };
};

const buildPaymentRows = (source = []) => {
  const map = new Map();

  (Array.isArray(source) ? source : []).forEach((row) => {
    const payment = row?.order ? row : normalizeOrderToPayment(row, Math.random());
    if (payment?.order) {
      map.set(payment.order, { ...map.get(payment.order), ...payment });
    }
  });

  return Array.from(map.values());
};

export default function Payments() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

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

    const stored = await adminList("payments");
    const source = [
      ...liveOrders.map((order) => normalizeOrderToPayment(order, liveOrders.indexOf(order))),
      ...(Array.isArray(stored) ? stored : []),
    ];

    setRows(buildPaymentRows(source));
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

      const stored = await adminList("payments");
      const source = [
        ...liveOrders.map((order) => normalizeOrderToPayment(order, liveOrders.indexOf(order))),
        ...(Array.isArray(stored) ? stored : []),
      ];

      if (active) setRows(buildPaymentRows(source));
    };

    loadRows();
    return () => { active = false; };
  }, []);

  const refund = async (row) => {
    if (!window.confirm(`Refund ₹${row.amount}?`)) return;
    await adminUpdate("payments", row.id, { status: "Refunded" });
    await refreshRows();
  };

  const filtered = rows.filter((row) => {
    const matchesFilter = filter === "All" || row.status === filter;
    const matchesSearch = Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <PageHeader title="Payments" description="Monitor transactions, gateways and refunds." />
      <Toolbar
        search={query}
        setSearch={setQuery}
        filter={filter}
        setFilter={setFilter}
        options={["Success", "Pending", "Refunded"]}
      />

      <Table
        rows={filtered}
        columns={[
          { key: "id", label: "Transaction" },
          { key: "order", label: "Order" },
          { key: "customer", label: "Customer" },
          { key: "gateway", label: "Gateway" },
          { key: "method", label: "Method" },
          { key: "amount", label: "Amount", render: (row) => `₹${row.amount.toLocaleString()}` },
          { key: "status", label: "Status" },
          { key: "date", label: "Date" },
          {
            key: "actions",
            label: "Action",
            render: (row) => (
              <button
                disabled={row.status === "Refunded"}
                onClick={() => refund(row)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[9px] disabled:opacity-40"
                aria-label={`Refund ${row.id}`}
              >
                <RefreshCcw size={13} />
              </button>
            ),
          },
        ]}
      />
    </>
  );
}


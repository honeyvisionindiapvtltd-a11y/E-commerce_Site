
import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { adminList, adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";

const normalizeDeliveryStatus = (status) => {
  if (status === "Delivered") return "Delivered";
  if (status === "Shipped" || status === "In Transit" || status === "Processing") return "In Transit";
  return "Preparing";
};

const makeDeliveryRow = (order, index = 0) => {
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const expectedDate = new Date(createdAt);
  expectedDate.setDate(expectedDate.getDate() + (index % 3) + 2);

  const courier = ["Delhivery", "Blue Dart", "DTDC"][index % 3];

  return {
    id: `delivery-${order.id || index}`,
    order: order.id || `HV-${index + 1}`,
    courier,
    tracking: `TRK-${String(order.id || index + 1).replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`,
    expected: expectedDate.toISOString().split("T")[0],
    status: normalizeDeliveryStatus(order.status),
  };
};

const buildDeliveryRows = (source = []) => {
  const map = new Map();

  (Array.isArray(source) ? source : []).forEach((row) => {
    const delivery = row?.order ? row : makeDeliveryRow(row, Math.random());
    if (delivery?.order) {
      map.set(delivery.order, { ...map.get(delivery.order), ...delivery });
    }
  });

  return Array.from(map.values());
};

export default function Delivery() {
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

    const stored = await adminList("delivery");
    const source = [
      ...liveOrders.map((order) => makeDeliveryRow(order, liveOrders.indexOf(order))),
      ...(Array.isArray(stored) ? stored : []),
    ];

    setRows(buildDeliveryRows(source));
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

      const stored = await adminList("delivery");
      const source = [
        ...liveOrders.map((order) => makeDeliveryRow(order, liveOrders.indexOf(order))),
        ...(Array.isArray(stored) ? stored : []),
      ];

      if (active) setRows(buildDeliveryRows(source));
    };

    loadRows();
    return () => { active = false; };
  }, []);

  const updateStatus = async (id, status) => {
    await adminUpdate("delivery", id, { status });
    await refreshRows();
  };

  const filtered = rows.filter((row) => {
    const matchesFilter = filter === "All" || row.status === filter;
    const matchesSearch = Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <PageHeader title="Delivery" description="Track shipments, couriers and expected delivery dates." />
      <Toolbar
        search={query}
        setSearch={setQuery}
        filter={filter}
        setFilter={setFilter}
        options={["Preparing", "In Transit", "Delivered"]}
      />

      <Table
        rows={filtered}
        columns={[
          { key: "order", label: "Order", render: (row) => <b>#{row.order}</b> },
          {
            key: "courier",
            label: "Courier",
            render: (row) => (
              <div className="flex items-center gap-2">
                <Truck size={14} />
                {row.courier}
              </div>
            ),
          },
          { key: "tracking", label: "Tracking" },
          { key: "expected", label: "Expected" },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <select
                value={row.status}
                onChange={(e) => updateStatus(row.id, e.target.value)}
                className="rounded border border-slate-200 px-2 py-1 text-[10px] outline-none"
              >
                <option>Preparing</option>
                <option>In Transit</option>
                <option>Delivered</option>
              </select>
            ),
          },
        ]}
      />
    </>
  );
}


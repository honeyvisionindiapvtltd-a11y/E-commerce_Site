
import { useEffect, useState, useRef } from "react";
import { Truck } from "lucide-react";
import io from "socket.io-client";
import { adminList, adminUpdate } from "../api";
import { useCommerce } from "../../../context/index.js";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";
import { SOCKET_URL } from "../../../lib/socketConfig.js";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const normalizeDeliveryStatus = (status) => {
  const canonical = ["ORDER_PLACED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED_DELIVERY"];
  return canonical.includes(status) ? status : "ORDER_PLACED";
};

const statusLabel = (status) => ({
  ORDER_PLACED: "Preparing",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  FAILED_DELIVERY: "Failed delivery",
}[status] || status);

const allowedStatusTransitions = {
  ORDER_PLACED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED", "RETURN_REQUESTED"],
  PACKED: ["SHIPPED", "OUT_FOR_DELIVERY", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["FAILED_DELIVERY", "CANCELLED"],
  FAILED_DELIVERY: [],
  DELIVERED: ["RETURN_REQUESTED"],
};

const makeDeliveryRow = (order, index = 0) => {
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const expectedDate = new Date(createdAt);
  expectedDate.setDate(expectedDate.getDate() + (index % 3) + 2);

  return {
    id: order.orderNumber || order.id || `HV-${index + 1}`,
    order: order.orderNumber || order.id || `HV-${index + 1}`,
    courier: order.courierName || (order.deliveryAgent ? "HoneyVision Delivery" : "Not assigned"),
    tracking: order.trackingNumber || (order.deliveryAgent ? "Not required" : "Not assigned"),
    expected: order.estimatedDeliveryDate
      ? new Date(order.estimatedDeliveryDate).toISOString().split("T")[0]
      : expectedDate.toISOString().split("T")[0],
    status: normalizeDeliveryStatus(order.status),
    rawStatus: order.status,
    deliveryAgent: order.deliveryAgent || null,
    failedDeliveryReason: order.failedDeliveryReason || "",
    failedDeliveryAt: order.failedDeliveryAt ? new Date(order.failedDeliveryAt).toLocaleString("en-IN") : "",
    failedDeliveryNotes: order.failedDeliveryNotes || "",
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
  const { authToken } = useCommerce();
  const [rows, setRows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const socketRef = useRef(null);
  const rowsRef = useRef(new Map()); // Keep track of current rows for quick updates

  const refreshRows = async () => {
    try {
      const [stored, agentResponse] = await Promise.all([
        adminList("delivery"),
        fetch(`${API_BASE}/delivery/agents`, { headers: { Authorization: `Bearer ${authToken}` } }),
      ]);
      const agentPayload = await agentResponse.json();
      setAgents(agentPayload.agents || []);
      setRows(buildDeliveryRows(stored));
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      try {
        const [stored, agentResponse] = await Promise.all([
          adminList("delivery"),
          fetch(`${API_BASE}/delivery/agents`, { headers: { Authorization: `Bearer ${authToken}` } }),
        ]);
        const agentPayload = await agentResponse.json();
        if (!agentResponse.ok) throw new Error(agentPayload.message || "Unable to load agents");
        if (active) {
          setAgents(agentPayload.agents || []);
          const builtRows = buildDeliveryRows(stored);
          setRows(builtRows);
          // Update ref for quick lookups
          const map = new Map();
          builtRows.forEach((row) => map.set(row.order, row));
          rowsRef.current = map;
        }
      } catch {
        if (active) setRows([]);
      }
    };

    loadRows();
    return () => { active = false; };
  }, [authToken]);

  // Real-time Socket.IO updates for delivery events
  useEffect(() => {
    if (!authToken) return undefined;

    const socket = io(SOCKET_URL, {
      auth: { token: authToken },
      autoConnect: false,
      reconnection: true,
    });

    // Listen for admin room events
    const handleDeliveryUpdate = (update) => {
      // Update a specific delivery row based on order number
      setRows((currentRows) => {
        const updated = currentRows.map((row) => {
          if (String(row.order) === String(update.orderNumber || update.orderId)) {
            return {
              ...row,
              status: normalizeDeliveryStatus(update.currentStatus || update.status),
              rawStatus: update.currentStatus || update.status,
              deliveryAgent: update.agentId || row.deliveryAgent,
              failedDeliveryReason: update.failedDeliveryReason || row.failedDeliveryReason,
              failedDeliveryNotes: update.failedDeliveryNotes || row.failedDeliveryNotes,
              failedDeliveryAt: update.failedDeliveryAt ? new Date(update.failedDeliveryAt).toLocaleString("en-IN") : row.failedDeliveryAt,
            };
          }
          return row;
        });
        // Update ref
        const map = new Map();
        updated.forEach((row) => map.set(row.order, row));
        rowsRef.current = map;
        return updated;
      });
    };

    const handleAgentUpdate = (update) => {
      // Update agent status in the sidebar
      if (update.agentId) {
        setAgents((currentAgents) =>
          currentAgents.map((agent) =>
            String(agent._id || agent.id) === String(update.agentId)
              ? { ...agent, isOnline: update.isOnline }
              : agent
          )
        );
      }
    };

    socket.on('connect', () => {
      // Admin automatically receives delivery events in the admins room
      if (import.meta.env.DEV) {
        console.debug('Admin delivery dashboard connected to real-time updates');
      }
    });

    socket.on('DELIVERY_COMPLETED', handleDeliveryUpdate);
    socket.on('DELIVERY_FAILED', handleDeliveryUpdate);
    socket.on('ORDER_ASSIGNED', handleDeliveryUpdate);
    socket.on('delivery:statusUpdate', handleDeliveryUpdate);
    socket.on('order:statusUpdate', handleDeliveryUpdate);
    socket.on('AGENT_ONLINE', handleAgentUpdate);
    socket.on('AGENT_OFFLINE', handleAgentUpdate);

    socketRef.current = socket;
    socket.connect();

    return () => {
      socket.off('DELIVERY_COMPLETED', handleDeliveryUpdate);
      socket.off('DELIVERY_FAILED', handleDeliveryUpdate);
      socket.off('ORDER_ASSIGNED', handleDeliveryUpdate);
      socket.off('delivery:statusUpdate', handleDeliveryUpdate);
      socket.off('order:statusUpdate', handleDeliveryUpdate);
      socket.off('AGENT_ONLINE', handleAgentUpdate);
      socket.off('AGENT_OFFLINE', handleAgentUpdate);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authToken]);

  const assignAgent = async (orderNumber, agentId) => {
    try {
      const response = agentId
        ? await fetch(`${API_BASE}/orders/${encodeURIComponent(orderNumber)}/assign-agent`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ agentId }),
          })
        : await fetch(`${API_BASE}/delivery/orders/${encodeURIComponent(orderNumber)}/agent`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${authToken}` },
          });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Unable to update delivery agent");
      if (import.meta.env.DEV && payload.developmentOtp) {
        window.alert(`Agent assigned. Development OTP: ${payload.developmentOtp}`);
      }
      await refreshRows();
    } catch (error) {
      window.alert(error.message);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await adminUpdate("delivery", id, { status });
      await refreshRows();
    } catch (error) {
      window.alert(error.message);
    }
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
        options={["ORDER_PLACED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED_DELIVERY"]}
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
          { key: "failedDeliveryReason", label: "Failure reason", render: (row) => row.failedDeliveryReason ? `${row.failedDeliveryReason}${row.failedDeliveryAt ? ` (${row.failedDeliveryAt})` : ""}` : "-" },
          { key: "failedDeliveryNotes", label: "Failure notes", render: (row) => row.failedDeliveryNotes || "-" },
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
                {[row.status, ...(allowedStatusTransitions[row.status] || [])].filter((status, index, statuses) => statuses.indexOf(status) === index).map((status) => (
                  <option key={status} value={status}>{statusLabel(status)}</option>
                ))}
              </select>
            ),
          },
          {
            key: "deliveryAgent",
            label: "Delivery agent",
            render: (row) => (
              <div className="flex min-w-40 flex-col gap-1.5">
                <select
                  value={row.deliveryAgent?._id || row.deliveryAgent?.id || ""}
                  disabled={["DELIVERED", "CANCELLED", "RETURNED"].includes(row.rawStatus) || (row.rawStatus === "OUT_FOR_DELIVERY" && row.deliveryAgent)}
                  onChange={(event) => assignAgent(row.order, event.target.value)}
                  className="max-w-40 rounded border border-slate-200 px-2 py-1 text-[10px] outline-none disabled:bg-slate-100"
                >
                  <option value="">Unassigned</option>
                  {agents.length === 0 && (
                    <option disabled value="no-active-agents">No active agents available</option>
                  )}
                  {agents.map((agent) => (
                    <option key={agent._id || agent.id} value={agent._id || agent.id}>
                      {agent.name} {agent.status !== "Active" ? "(inactive)" : ""}
                    </option>
                  ))}
                </select>
                {row.deliveryAgent && !["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"].includes(row.rawStatus) && (
                  <button
                    type="button"
                    onClick={() => assignAgent(row.order, "")}
                    className="self-start rounded border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-50"
                  >
                    Unassign
                  </button>
                )}
                {row.deliveryAgent && row.rawStatus === "OUT_FOR_DELIVERY" && (
                  <span className="text-[10px] text-slate-500" title="Unassigning is locked while delivery is active">
                    Locked while active
                  </span>
                )}
                {row.deliveryAgent && ["DELIVERED", "CANCELLED", "RETURNED"].includes(row.rawStatus) && (
                  <span className="text-[10px] text-slate-500" title="Closed orders cannot be unassigned">
                    Locked after closure
                  </span>
                )}
              </div>
            ),
          },
        ]}
      />
    </>
  );
}


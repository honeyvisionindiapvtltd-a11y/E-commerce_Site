import { useEffect, useState } from "react";
import { UserCheck, UserX } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";

const getAuthToken = () => {
  try {
    const raw = localStorage.getItem("honey-vision-commerce");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.authToken || null;
  } catch {
    return null;
  }
};

const loadCustomers = async () => {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch("/api/auth/customers", { headers });

  if (!response.ok) {
    throw new Error("Unable to load customers");
  }

  const payload = await response.json();
  return Array.isArray(payload.customers) ? payload.customers : [];
};

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshRows = async () => {
    setError("");
    try {
      const data = await loadCustomers();
      setRows(data);
    } catch (error) {
      setRows([]);
      setError(error.message || "Unable to load customers from MongoDB.");
    }
  };

  useEffect(() => {
    let active = true;
    const loadRows = async () => {
      try {
        const data = await loadCustomers();
        if (active) setRows(data);
      } catch (error) {
        if (active) { setRows([]); setError(error.message || "Unable to load customers from MongoDB."); }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRows();
    return () => { active = false; };
  }, []);

  const toggleCustomer = async (customer) => {
    const nextStatus = customer.status === "Active" ? "Blocked" : "Active";
    const token = getAuthToken();
    const response = await fetch(`/api/auth/customers/${customer.id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) {
      throw new Error("Unable to update customer status");
    }

    await refreshRows();
  };

  const filtered = rows.filter((row) => {
    const matchesFilter = filter === "All" || row.status === filter;
    const matchesSearch = Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <PageHeader title="Customers" description="Manage customer accounts, order history and spending." />
      {error && <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"><span>{error}</span><button onClick={refreshRows} className="font-semibold underline">Retry</button></div>}
      <Toolbar search={query} setSearch={setQuery} filter={filter} setFilter={setFilter} options={["Active", "Blocked"]} />

      {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading customers...</p> : <Table
        rows={filtered}
        columns={[
          {
            key: "name",
            label: "Customer",
            render: (row) => (
              <div>
                <b>{row.name}</b>
                <p className="text-[9px] text-slate-400">{row.email}</p>
              </div>
            ),
          },
          { key: "phone", label: "Phone" },
          { key: "orders", label: "Orders" },
          { key: "spent", label: "Total Spent", render: (row) => `₹${row.spent.toLocaleString()}` },
          { key: "joined", label: "Joined" },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <span className={row.status === "Active" ? "text-emerald-600" : "text-red-500"}>{row.status}</span>
            ),
          },
          {
            key: "actions",
            label: "Action",
            render: (row) => (
              <button onClick={() => toggleCustomer(row)} className="rounded-lg p-2 hover:bg-slate-100">
                {row.status === "Active" ? <UserX size={15} /> : <UserCheck size={15} />}
              </button>
            ),
          },
        ]}
      />}
    </>
  );
}

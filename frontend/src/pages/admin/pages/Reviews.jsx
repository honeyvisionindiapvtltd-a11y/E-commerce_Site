
import { useEffect, useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { adminDelete, adminList, adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";

export default function Reviews() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const refreshRows = async () => {
    const data = await adminList("reviews");
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      const data = await adminList("reviews");
      if (active) setRows(Array.isArray(data) ? data : []);
    };

    loadRows();
    return () => { active = false; };
  }, []);

  const setStatus = async (id, status) => {
    await adminUpdate("reviews", id, { status });
    await refreshRows();
  };

  const filtered = rows.filter((row) => {
    const matchesFilter = filter === "All" || row.status === filter;
    const matchesSearch = Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <PageHeader title="Reviews" description="Moderate customer reviews and reported feedback." />
      <Toolbar
        search={query}
        setSearch={setQuery}
        filter={filter}
        setFilter={setFilter}
        options={["Pending", "Published", "Reported"]}
      />

      <Table
        rows={filtered}
        columns={[
          { key: "product", label: "Product" },
          { key: "customer", label: "Customer" },
          { key: "rating", label: "Rating", render: (row) => `${"★".repeat(row.rating)}${"☆".repeat(5 - row.rating)}` },
          {
            key: "comment",
            label: "Review",
            render: (row) => <span className="block max-w-xs truncate">{row.comment}</span>,
          },
          { key: "status", label: "Status" },
          { key: "date", label: "Date" },
          {
            key: "actions",
            label: "Moderate",
            render: (row) => (
              <div className="flex gap-1">
                <button onClick={() => setStatus(row.id, "Published")} className="rounded bg-emerald-50 p-1.5 text-emerald-600">
                  <Check size={14} />
                </button>
                <button onClick={() => setStatus(row.id, "Reported")} className="rounded bg-amber-50 p-1.5 text-amber-600">
                  <X size={14} />
                </button>
                <button onClick={async () => { await adminDelete("reviews", row.id); await refreshRows(); }} className="rounded bg-red-50 p-1.5 text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}


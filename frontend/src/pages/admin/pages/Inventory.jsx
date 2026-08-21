import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { adminListProducts, adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { Field, inputClass } from "../components/FormField";
const normalizeInventoryRow = (product) => ({
  ...product,
  id: product._id || product.id,
  sku: product.sku || String(product._id || product.id || "").toUpperCase(),
  category: product.category?.name || product.category || "Uncategorized",
  stock: Number(product.stock || 0),
});

export default function Inventory() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [item, setItem] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshRows = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminListProducts();
      setRows((data.products || []).map(normalizeInventoryRow));
    } catch (loadError) {
      setError(loadError.message || "Unable to load inventory from MongoDB.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadRows = async () => {
      try {
        const data = await adminListProducts();
        if (active) setRows((data.products || []).map(normalizeInventoryRow));
      } catch (loadError) {
        if (active) setError(loadError.message || "Unable to load inventory from MongoDB.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRows();
    return () => { active = false; };
  }, []);

  const changeStock = async (direction) => {
    if (!item) return;

    const current = Number(item.stock || 0);
    const delta = direction === "in" ? Number(qty || 0) : -Number(qty || 0);
    const nextStock = Math.max(0, current + delta);

    try {
      await adminUpdate("products", item.id, { stock: nextStock });
      setItem(null);
      setQty(1);
      await refreshRows();
    } catch (updateError) {
      setError(updateError.message || "Unable to update stock.");
    }
  };

  const filtered = rows.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Inventory" description="Monitor stock levels and adjust inventory safely." />
      {error && <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"><span>{error}</span><button onClick={refreshRows} className="font-semibold underline">Retry</button></div>}
      <Toolbar search={query} setSearch={setQuery} />

      {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading inventory...</p> : <Table
        rows={filtered}
        columns={[
          { key: "name", label: "Product", render: (row) => <b>{row.name}</b> },
          { key: "sku", label: "SKU" },
          {
            key: "stock",
            label: "Available",
            render: (row) => (
              <span className={row.stock <= 5 ? "font-bold text-red-500" : "text-emerald-600"}>{row.stock}</span>
            ),
          },
          {
            key: "status",
            label: "Stock Status",
            render: (row) => {
              if (row.stock === 0) return <span className="text-red-500">Out of Stock</span>;
              if (row.stock <= 5) return <span className="text-amber-600">Low Stock</span>;
              return <span className="text-emerald-600">In Stock</span>;
            },
          },
          {
            key: "actions",
            label: "Adjust",
            render: (row) => (
              <div className="flex gap-1">
                <button onClick={() => setItem(row)} className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <ArrowUpFromLine size={14} />
                </button>
                <button onClick={() => setItem({ ...row, _out: true })} className="rounded-lg bg-red-50 p-2 text-red-500">
                  <ArrowDownToLine size={14} />
                </button>
              </div>
            ),
          },
        ]}
      />}

      <Modal open={!!item} title="Adjust Stock" onClose={() => setItem(null)}>
        <div className="space-y-4">
          <p className="text-xs">Product: <b>{item?.name}</b></p>

          <Field label="QUANTITY">
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className={inputClass}
            />
          </Field>

          <button
            onClick={() => changeStock(item?._out ? "out" : "in")}
            className="w-full rounded-lg bg-[#071426] py-2.5 text-xs font-semibold text-white"
          >
            {item?._out ? "Remove Stock" : "Add Stock"}
          </button>
        </div>
      </Modal>
    </>
  );
}

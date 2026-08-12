import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { adminList, adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { Field, inputClass } from "../components/FormField";
import { products as projectProducts } from "../../../lib/products";

const projectInventoryRows = projectProducts.map((product) => ({
  id: product.id,
  name: product.name,
  sku: String(product.id || "").toUpperCase().replace(/-/g, " "),
  category: product.category,
  stock: Number(product.stock || 0),
  status: "Active",
}));

const mergeInventoryRows = (storedRows = []) => {
  const map = new Map();

  projectInventoryRows.forEach((product) => map.set(product.id, product));
  (Array.isArray(storedRows) ? storedRows : []).forEach((product) => {
    if (product?.id) {
      map.set(product.id, { ...map.get(product.id), ...product });
    }
  });

  return Array.from(map.values());
};

export default function Inventory() {
  const [rows, setRows] = useState(projectInventoryRows);
  const [query, setQuery] = useState("");
  const [item, setItem] = useState(null);
  const [qty, setQty] = useState(1);

  const refreshRows = async () => {
    const data = await adminList("products");
    setRows(mergeInventoryRows(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    let active = true;
    const loadRows = async () => {
      const data = await adminList("products");
      if (active) setRows(mergeInventoryRows(Array.isArray(data) ? data : []));
    };

    loadRows();
    return () => { active = false; };
  }, []);

  const changeStock = async (direction) => {
    if (!item) return;

    const current = Number(item.stock || 0);
    const delta = direction === "in" ? Number(qty || 0) : -Number(qty || 0);
    const nextStock = Math.max(0, current + delta);

    await adminUpdate("products", item.id, { stock: nextStock });
    setItem(null);
    setQty(1);
    await refreshRows();
  };

  const filtered = rows.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Inventory" description="Monitor stock levels and adjust inventory safely." />
      <Toolbar search={query} setSearch={setQuery} />

      <Table
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
      />

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

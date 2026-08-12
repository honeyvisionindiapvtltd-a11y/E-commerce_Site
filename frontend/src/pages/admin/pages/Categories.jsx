import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { adminCreate, adminDelete, adminList, adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { Field, inputClass } from "../components/FormField";
import { categories as projectCategories, products as projectProducts } from "../../../lib/products";

const createProjectCategoryRows = () => {
  const counts = projectProducts.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  return projectCategories.map((category, index) => ({
    id: `cat-${index + 1}`,
    name: category,
    slug: category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    products: counts[category] || 0,
    status: "Active",
  }));
};

const mergeCategoryRows = (storedRows = []) => {
  const rows = createProjectCategoryRows();
  const map = new Map();

  rows.forEach((row) => map.set(row.id, row));
  storedRows.forEach((row) => {
    if (row?.id) {
      map.set(row.id, { ...map.get(row.id), ...row });
    }
  });

  return Array.from(map.values());
};

const createBlankCategory = () => ({
  name: "",
  slug: "",
  products: 0,
  status: "Active",
});

export default function Categories() {
  const [rows, setRows] = useState(createProjectCategoryRows());
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(createBlankCategory());

  const refreshRows = async () => {
    const data = await adminList("categories");
    setRows(mergeCategoryRows(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      const data = await adminList("categories");
      if (active) setRows(mergeCategoryRows(Array.isArray(data) ? data : []));
    };

    loadRows();
    return () => { active = false; };
  }, []);

  const openCreateModal = () => {
    setEdit(null);
    setForm(createBlankCategory());
    setOpen(true);
  };

  const openEditModal = (category) => {
    setEdit(category);
    setForm({
      ...category,
      name: category.name || "",
      slug: category.slug || "",
      products: category.products || 0,
      status: category.status || "Active",
    });
    setOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim(),
      products: Number(form.products || 0),
      status: form.status || "Active",
    };

    if (!payload.name || !payload.slug) return;

    if (edit) {
      await adminUpdate("categories", edit.id, payload);
    } else {
      await adminCreate("categories", payload);
    }

    setOpen(false);
    setEdit(null);
    setForm(createBlankCategory());
    await refreshRows();
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    await adminDelete("categories", category.id);
    await refreshRows();
  };

  const filtered = rows.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organize products into customer-friendly categories."
        action={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white"
          >
            <Plus size={15} />Add Category
          </button>
        }
      />

      <Toolbar search={query} setSearch={setQuery} />

      <Table
        rows={filtered}
        columns={[
          { key: "name", label: "Category", render: (row) => <b>{row.name}</b> },
          { key: "slug", label: "Slug" },
          { key: "products", label: "Products" },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <span className="rounded bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600">
                {row.status}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-1">
                <button onClick={() => openEditModal(row)} className="rounded p-1.5 hover:bg-slate-100">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(row)} className="rounded p-1.5 text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={open} title={edit ? "Edit Category" : "Add Category"} onClose={() => { setOpen(false); setEdit(null); setForm(createBlankCategory()); }}>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </Field>

          <Field label="Slug">
            <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} />
          </Field>

          <Field label="Products">
            <input type="number" min="0" value={form.products} onChange={(e) => setForm({ ...form, products: Number(e.target.value || 0) })} className={inputClass} />
          </Field>

          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </Field>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs">Cancel</button>
            <button type="submit" className="rounded-lg bg-[#071426] px-4 py-2 text-xs font-semibold text-white">Save Category</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

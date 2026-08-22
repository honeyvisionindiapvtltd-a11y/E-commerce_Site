import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { adminCreate, adminDelete, adminListCategoryTree, adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { Field, inputClass } from "../components/FormField";
const normalizeCategory = (category) => ({
  ...category,
  id: category._id || category.id,
  parentId: category.parentCategory?._id || category.parentCategory || null,
  parentName: category.parentCategory?.name || "Main category",
  image: category.image || category.src || "",
  products: Number(category.productCount ?? category.products ?? 0),
  status: category.isActive === false ? "Inactive" : "Active",
});

const flattenCategoryTree = (categories = []) => categories.flatMap((category) => [
  normalizeCategory(category),
  ...(category.subcategories || []).map((subcategory) => normalizeCategory({
    ...subcategory,
    parentCategory: { _id: category._id, name: category.name },
  })),
]);

const createBlankCategory = () => ({
  name: "",
  slug: "",
  description: "",
  image: "",
  icon: "",
  parentCategory: "",
  sortOrder: 0,
  products: 0,
  status: "Active",
});

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(createBlankCategory());

  const refreshRows = async () => {
    const data = await adminListCategoryTree();
    setRows(flattenCategoryTree(data));
  };

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      const data = await adminListCategoryTree();
      if (active) setRows(flattenCategoryTree(data));
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
      description: category.description || "",
      image: category.image || category.src || "",
      icon: category.icon || "",
      parentCategory: category.parentId || "",
      sortOrder: category.sortOrder || 0,
      products: category.products || 0,
      status: category.status || "Active",
    });
    setOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      isActive: form.status === "Active",
      sortOrder: Number(form.sortOrder || 0),
      description: form.description || "",
      image: form.image || "",
      icon: form.icon || "",
      parentCategory: form.parentCategory || null,
    };

    if (!payload.name || !payload.slug) return;

    try {
      if (edit) await adminUpdate("categories", edit.id, payload);
      else await adminCreate("categories", payload);

      setOpen(false);
      setEdit(null);
      setForm(createBlankCategory());
      await refreshRows();
    } catch (error) {
      window.alert(error.message || "Unable to save category.");
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    try {
      await adminDelete("categories", category.id);
      await refreshRows();
    } catch (error) {
      window.alert(error.message || "Unable to delete category.");
    }
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
          { key: "name", label: "Category", render: (row) => <div className={row.parentId ? "pl-5" : ""}><b>{row.parentId ? "↳ " : ""}{row.name}</b><p className="text-[10px] text-slate-400">{row.parentName}</p></div> },
          { key: "slug", label: "Slug" },
          { key: "image", label: "Image", render: (row) => row.image ? <img src={row.image} alt={row.name} className="h-10 w-14 rounded object-contain" /> : <span className="text-xs text-slate-400">No image</span> },
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

          <Field label="Parent Category">
            <select value={form.parentCategory} onChange={(e) => setForm({ ...form, parentCategory: e.target.value })} className={inputClass}>
              <option value="">Main category</option>
              {rows.filter((row) => !row.parentId && row.id !== edit?.id).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </Field>

          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} />
          </Field>

          <Field label="Image URL">
            <input type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." className={inputClass} />
          </Field>

          <Field label="Icon">
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inputClass} />
          </Field>

          <Field label="Sort Order">
            <input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className={inputClass} />
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

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { adminCreate, adminDelete, adminList, adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { Field, inputClass } from "../components/FormField";

const createBlankArticle = () => ({
  title: "",
  category: "AI Technology",
  author: "Admin",
  status: "Draft",
  date: "2026-08-12",
});

export default function Blogs() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(createBlankArticle());

  const refreshRows = async () => {
    const data = await adminList("blogs");
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    let active = true;
    const loadRows = async () => {
      const data = await adminList("blogs");
      if (active) setRows(Array.isArray(data) ? data : []);
    };

    loadRows();
    return () => { active = false; };
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      title: form.title.trim(),
      category: form.category.trim(),
      author: form.author.trim(),
      status: form.status || "Draft",
      date: form.date || new Date().toISOString().slice(0, 10),
    };

    if (!payload.title) return;

    if (edit) {
      await adminUpdate("blogs", edit.id, payload);
    } else {
      await adminCreate("blogs", payload);
    }

    setOpen(false);
    setEdit(null);
    setForm(createBlankArticle());
    await refreshRows();
  };

  const filtered = rows.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Website & Blogs" description="Manage blog posts and website content." action={
        <button onClick={() => { setEdit(null); setForm(createBlankArticle()); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white">
          <Plus size={15} />New Article
        </button>
      } />

      <Toolbar search={query} setSearch={setQuery} />

      <Table
        rows={filtered}
        columns={[
          { key: "title", label: "Article", render: (row) => <b>{row.title}</b> },
          { key: "category", label: "Category" },
          { key: "author", label: "Author" },
          { key: "status", label: "Status" },
          { key: "date", label: "Date" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button onClick={() => { setEdit(row); setForm(row); setOpen(true); }}><Pencil size={14} /></button>
                <button onClick={async () => { if (window.confirm("Delete article?")) { await adminDelete("blogs", row.id); await refreshRows(); } }} className="text-red-500"><Trash2 size={14} /></button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={open} title={edit ? "Edit Article" : "New Article"} onClose={() => setOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="TITLE">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
          </Field>

          <Field label="AUTHOR">
            <input required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className={inputClass} />
          </Field>

          <Field label="CATEGORY">
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} />
          </Field>

          <Field label="DATE">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
          </Field>

          <Field label="STATUS">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
              <option>Draft</option>
              <option>Published</option>
              <option>Archived</option>
            </select>
          </Field>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs">Cancel</button>
            <button type="submit" className="rounded-lg bg-[#071426] px-4 py-2 text-xs font-semibold text-white">Save Article</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

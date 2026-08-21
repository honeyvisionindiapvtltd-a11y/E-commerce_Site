import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminCreate, adminDelete, adminListServices, adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { Field, inputClass } from "../components/FormField";

const blank = { title: "", slug: "", description: "", status: "Active" };
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function Services() {
  const [rows, setRows] = useState([]); const [query, setQuery] = useState(""); const [open, setOpen] = useState(false); const [edit, setEdit] = useState(null); const [form, setForm] = useState(blank); const [error, setError] = useState("");
  const refresh = async () => { try { setRows((await adminListServices()).map((service) => ({ ...service, title: service.title || service.name || "Untitled service", status: service.isActive === false ? "Inactive" : "Active" }))); } catch (loadError) { setError(loadError.message || "Unable to load services from MongoDB."); } };
  useEffect(() => { refresh(); }, []);
  const save = async (event) => { event.preventDefault(); try { const payload = { ...form, slug: form.slug || slugify(form.title), isActive: form.status === "Active" }; if (edit) await adminUpdate("services", edit._id, payload); else await adminCreate("services", payload); setOpen(false); setEdit(null); setForm(blank); await refresh(); } catch (saveError) { setError(saveError.message || "Unable to save service."); } };
  const filtered = rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageHeader title="Services" description="Manage the services shown on your website." action={<button onClick={() => { setEdit(null); setForm(blank); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15} />Add Service</button>} />
    {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}
    <Toolbar search={query} setSearch={setQuery} />
    <Table rows={filtered} columns={[{ key: "title", label: "Service", render: (row) => <b>{row.title}</b> }, { key: "slug", label: "Slug" }, { key: "description", label: "Description" }, { key: "status", label: "Status", render: (row) => row.status }, { key: "actions", label: "Actions", render: (row) => <div className="flex gap-1"><button onClick={() => { setEdit(row); setForm({ ...row, status: row.status }); setOpen(true); }} className="rounded p-1.5 hover:bg-slate-100"><Pencil size={14} /></button><button onClick={async () => { if (window.confirm(`Delete ${row.title}?`)) { await adminDelete("services", row._id); await refresh(); } }} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button></div> }]} />
    <Modal open={open} title={edit ? "Edit Service" : "Add Service"} onClose={() => setOpen(false)}><form onSubmit={save} className="space-y-4"><Field label="TITLE"><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} /></Field><Field label="SLUG"><input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className={inputClass} /></Field><Field label="DESCRIPTION"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={inputClass} /></Field><Field label="STATUS"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={inputClass}><option>Active</option><option>Inactive</option></select></Field><button className="w-full rounded-lg bg-[#071426] py-2.5 text-xs font-semibold text-white">Save Service</button></form></Modal>
  </>;
}
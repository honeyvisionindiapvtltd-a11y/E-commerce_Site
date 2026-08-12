
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { adminCreate, adminDelete, adminList, adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { Field, inputClass } from "../components/FormField";

const createBlankAdmin = () => ({
  name: "",
  email: "",
  role: "Manager",
  status: "Active",
  lastLogin: "Never",
});

export default function AdminUsers() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(createBlankAdmin());
  const [saving, setSaving] = useState(false);

  const refreshRows = async () => {
    const data = await adminList("admins");
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      const data = await adminList("admins");
      if (active) {
        setRows(Array.isArray(data) ? data : []);
      }
    };

    loadRows();

    return () => {
      active = false;
    };
  }, []);

  const openCreateModal = () => {
    setEdit(null);
    setForm(createBlankAdmin());
    setOpen(true);
  };

  const openEditModal = (admin) => {
    setEdit(admin);
    setForm({
      ...admin,
      name: admin.name || "",
      email: admin.email || "",
      role: admin.role || "Manager",
      status: admin.status || "Active",
      lastLogin: admin.lastLogin || "Never",
    });
    setOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const cleaned = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role || "Manager",
      status: form.status || "Active",
      lastLogin: form.lastLogin || "Never",
    };

    if (!cleaned.name || !cleaned.email) return;

    setSaving(true);

    try {
      if (edit) {
        await adminUpdate("admins", edit.id, cleaned);
      } else {
        await adminCreate("admins", cleaned);
      }

      setOpen(false);
      setEdit(null);
      setForm(createBlankAdmin());
      await refreshRows();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin) => {
    if (!window.confirm(`Delete admin "${admin.name}"?`)) return;

    await adminDelete("admins", admin.id);
    await refreshRows();
  };

  return (
    <>
      <PageHeader
        title="Admin Users"
        description="Manage staff accounts and administration roles."
        action={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white"
          >
            <Plus size={15} />Add Admin
          </button>
        }
      />

      <Table
        rows={rows}
        columns={[
          { key: "name", label: "Name", render: (row) => <b>{row.name}</b> },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "status", label: "Status" },
          { key: "lastLogin", label: "Last Login" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button onClick={() => openEditModal(row)} className="text-slate-600 hover:text-slate-900" aria-label={`Edit ${row.name}`}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700" aria-label={`Delete ${row.name}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={open} title={edit ? "Edit Admin" : "Add Admin"} onClose={() => { setOpen(false); setEdit(null); setForm(createBlankAdmin()); }}>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Name">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Enter admin name"
            />
          </Field>

          <Field label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="Enter email address"
            />
          </Field>

          <Field label="Role">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}>
              <option>Manager</option>
              <option>Editor</option>
              <option>Support</option>
              <option>Super Admin</option>
            </select>
          </Field>

          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
              <option>Active</option>
              <option>Inactive</option>
              <option>Blocked</option>
            </select>
          </Field>

          <button type="submit" disabled={saving} className="w-full rounded-lg bg-[#071426] py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Saving..." : edit ? "Update Admin" : "Save Admin"}
          </button>
        </form>
      </Modal>
    </>
  );
}

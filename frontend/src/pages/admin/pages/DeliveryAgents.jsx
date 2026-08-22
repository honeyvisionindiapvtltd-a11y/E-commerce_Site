import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, Power, Search, Truck } from "lucide-react";
import { useCommerce } from "../../../context/CommerceContext";
import PageHeader from "../components/PageHeader";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { Field, inputClass } from "../components/FormField";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const blankForm = { name: "", email: "", phone: "", password: "" };

const request = async (path, token, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Delivery-agent request failed");
  return payload;
};

const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "-";

export default function DeliveryAgents() {
  const { authToken } = useCommerce();
  const [agents, setAgents] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(null);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAgents = async () => {
    try {
      const payload = await request("/delivery/management/agents", authToken);
      setAgents(payload.agents || []);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    if (authToken) loadAgents();
  }, [authToken]);

  const openCreate = () => {
    setEdit(null);
    setForm(blankForm);
    setError("");
    setOpen(true);
  };

  const openEdit = (agent) => {
    setEdit(agent);
    setForm({ name: agent.name || "", email: agent.email || "", phone: agent.phone || "", password: "" });
    setError("");
    setOpen(true);
  };

  const saveAgent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = { ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() };
      if (edit && !body.password) delete body.password;
      await request(edit ? `/delivery/management/agents/${edit.id}` : "/delivery/management/agents", authToken, {
        method: edit ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      setOpen(false);
      setEdit(null);
      setForm(blankForm);
      await loadAgents();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (agent) => {
    try {
      await request(`/delivery/management/agents/${agent.id}/status`, authToken, {
        method: "PATCH",
        body: JSON.stringify({ status: agent.status === "Active" ? "Inactive" : "Active" }),
      });
      await loadAgents();
    } catch (statusError) {
      setError(statusError.message);
    }
  };

  const filtered = agents.filter((agent) => [agent.name, agent.email, agent.phone, agent.status].join(" ").toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Delivery Agents"
        description="Manage the HoneyVision internal delivery team."
        action={<button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15} />Add Delivery Agent</button>}
      />

      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}

      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <Search size={15} className="text-slate-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full text-xs outline-none" placeholder="Search delivery agents..." />
      </div>

      <Table
        rows={filtered}
        columns={[
          { key: "name", label: "Name", render: (row) => <div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-full bg-amber-50 text-amber-600"><Truck size={15} /></div><b>{row.name}</b></div> },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "status", label: "Status", render: (row) => <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${row.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{row.status}</span> },
          { key: "assignedOrders", label: "Assigned", render: (row) => row.assignedOrders ?? 0 },
          { key: "deliveredOrders", label: "Delivered", render: (row) => row.deliveredOrders ?? 0 },
          { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
          { key: "actions", label: "Actions", render: (row) => <div className="flex gap-3"><button onClick={() => setView(row)} className="text-slate-500 hover:text-slate-900" aria-label={`View ${row.name}`}><Eye size={15} /></button><button onClick={() => openEdit(row)} className="text-slate-500 hover:text-slate-900" aria-label={`Edit ${row.name}`}><Pencil size={15} /></button><button onClick={() => toggleStatus(row)} className={row.status === "Active" ? "text-amber-600 hover:text-amber-800" : "text-emerald-600 hover:text-emerald-800"} aria-label={`${row.status === "Active" ? "Deactivate" : "Activate"} ${row.name}`}><Power size={15} /></button></div> },
        ]}
      />

      <Modal open={open} title={edit ? "Edit Delivery Agent" : "Add Delivery Agent"} onClose={() => setOpen(false)}>
        <form onSubmit={saveAgent} className="space-y-4">
          <Field label="Full Name"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} /></Field>
          <Field label="Email"><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} /></Field>
          <Field label="Phone Number"><input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass} /></Field>
          <Field label={edit ? "New Password (optional)" : "Password"}><input required={!edit} minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={inputClass} /></Field>
          <p className="text-[11px] text-slate-500">Role is automatically set to Delivery Agent. New accounts are active by default.</p>
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-[#071426] py-2.5 text-xs font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : edit ? "Update Agent" : "Create Agent"}</button>
        </form>
      </Modal>

      <Modal open={!!view} title="Delivery Agent Details" onClose={() => setView(null)}>
        {view && <div className="space-y-3 text-xs"><p><b>Name:</b> {view.name}</p><p><b>Email:</b> {view.email}</p><p><b>Phone:</b> {view.phone}</p><p><b>Status:</b> {view.status}</p><p><b>Assigned orders:</b> {view.assignedOrders}</p><p><b>Delivered orders:</b> {view.deliveredOrders}</p><p><b>Created:</b> {formatDate(view.createdAt)}</p></div>}
      </Modal>
    </>
  );
}
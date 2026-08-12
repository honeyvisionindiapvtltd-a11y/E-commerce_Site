import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { adminCreate, adminDelete, adminList, adminUpdate } from "../api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { Field, inputClass } from "../components/FormField";

const createBlankCoupon = () => ({
  code: "",
  type: "Percentage",
  value: 10,
  minOrder: 1000,
  uses: 0,
  expiry: "2026-12-31",
  status: "Active",
});

export default function Coupons() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(createBlankCoupon());

  const refreshRows = async () => {
    const data = await adminList("coupons");
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    let active = true;
    const loadRows = async () => {
      const data = await adminList("coupons");
      if (active) setRows(Array.isArray(data) ? data : []);
    };

    loadRows();
    return () => { active = false; };
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      code: form.code.trim(),
      value: Number(form.value || 0),
      minOrder: Number(form.minOrder || 0),
      uses: Number(form.uses || 0),
      status: form.status || "Active",
    };

    if (!payload.code) return;

    if (edit) {
      await adminUpdate("coupons", edit.id, payload);
    } else {
      await adminCreate("coupons", payload);
    }

    setOpen(false);
    setEdit(null);
    setForm(createBlankCoupon());
    await refreshRows();
  };

  const toggleStatus = async (coupon) => {
    const nextStatus = coupon.status === "Active" ? "Paused" : "Active";
    await adminUpdate("coupons", coupon.id, { status: nextStatus });
    await refreshRows();
  };

  const filtered = rows.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Coupons & Offers" description="Create discounts and promotional offers." action={
        <button onClick={() => { setEdit(null); setForm(createBlankCoupon()); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white">
          <Plus size={15} />Create Coupon
        </button>
      } />

      <Toolbar search={query} setSearch={setQuery} />

      <Table
        rows={filtered}
        columns={[
          { key: "code", label: "Code", render: (row) => <b>{row.code}</b> },
          { key: "type", label: "Discount", render: (row) => row.type === "Percentage" ? `${row.value}%` : `₹${row.value}` },
          { key: "minOrder", label: "Min Order", render: (row) => `₹${row.minOrder}` },
          { key: "uses", label: "Uses" },
          { key: "expiry", label: "Expiry" },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <button onClick={() => toggleStatus(row)} className={row.status === "Active" ? "text-emerald-600" : "text-slate-400"}>
                {row.status}
              </button>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button onClick={() => { setEdit(row); setForm(row); setOpen(true); }}><Pencil size={14} /></button>
                <button onClick={async () => { if (window.confirm("Delete coupon?")) { await adminDelete("coupons", row.id); await refreshRows(); } }} className="text-red-500"><Trash2 size={14} /></button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={open} title={edit ? "Edit Coupon" : "Create Coupon"} onClose={() => setOpen(false)}>
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
          <Field label="CODE">
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} />
          </Field>
          <Field label="TYPE">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
              <option>Percentage</option>
              <option>Fixed</option>
            </select>
          </Field>
          <Field label="VALUE">
            <input type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value || 0) })} className={inputClass} />
          </Field>
          <Field label="MIN ORDER">
            <input type="number" min="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value || 0) })} className={inputClass} />
          </Field>
          <Field label="USES">
            <input type="number" min="0" value={form.uses} onChange={(e) => setForm({ ...form, uses: Number(e.target.value || 0) })} className={inputClass} />
          </Field>
          <Field label="EXPIRY">
            <input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className={inputClass} />
          </Field>
          <Field label="STATUS">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
              <option>Active</option>
              <option>Paused</option>
            </select>
          </Field>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs">Cancel</button>
            <button type="submit" className="rounded-lg bg-[#071426] px-4 py-2 text-xs font-semibold text-white">Save Coupon</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

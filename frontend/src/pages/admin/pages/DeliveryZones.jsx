import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { adminCreateDeliveryZone, adminDeleteDeliveryZone, adminListDeliveryZones, adminToggleDeliveryZone, adminUpdateDeliveryZone } from "../api";

const blank = { country: "India", state: "Odisha", city: "Bhubaneswar", pincode: "", areas: "", serviceable: true, active: true, deliveryCharge: 0, minDays: 1, maxDays: 2 };

const toForm = (zone) => ({ ...zone, areas: (zone.areas || []).join(", "), minDays: zone.estimatedDeliveryDays?.min ?? 1, maxDays: zone.estimatedDeliveryDays?.max ?? 2 });
const payload = (form) => ({ country: form.country.trim(), state: form.state.trim(), city: form.city.trim(), pincode: form.pincode.trim(), areas: form.areas.split(",").map((area) => area.trim()).filter(Boolean), serviceable: Boolean(form.serviceable), active: Boolean(form.active), deliveryCharge: Number(form.deliveryCharge), estimatedDeliveryDays: { min: Number(form.minDays), max: Number(form.maxDays) } });

export default function DeliveryZones() {
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try { setError(""); const result = await adminListDeliveryZones(); setZones(result.zones || []); } catch (loadError) { setError(loadError.message); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => zones.filter((zone) => (!city || zone.city === city) && (!status || String(zone[status.key]) === status.value) && `${zone.city} ${zone.pincode} ${(zone.areas || []).join(" ")}`.toLowerCase().includes(query.toLowerCase())), [zones, city, status, query]);
  const activeCount = zones.filter((zone) => zone.active).length;
  const serviceableCount = zones.filter((zone) => zone.serviceable && zone.active).length;

  const save = async (event) => {
    event.preventDefault();
    const data = payload(form);
    if (!data.city || !/^\d{6}$/.test(data.pincode) || data.deliveryCharge < 0 || !Number.isInteger(data.estimatedDeliveryDays.min) || !Number.isInteger(data.estimatedDeliveryDays.max) || data.estimatedDeliveryDays.max < data.estimatedDeliveryDays.min) { setError("Enter a city, valid 6-digit PIN, non-negative charge, and valid delivery days."); return; }
    try { if (editing) await adminUpdateDeliveryZone(editing._id, data); else await adminCreateDeliveryZone(data); setEditing(null); setForm(blank); setStatus("Zone saved"); await load(); } catch (saveError) { setError(saveError.message); }
  };

  const toggle = async (zone, field) => { try { await adminToggleDeliveryZone(zone._id, field, !zone[field === "status" ? "active" : "serviceable"]); await load(); } catch (toggleError) { setError(toggleError.message); } };
  const remove = async (zone) => { if (!window.confirm(`Delete ${zone.city} ${zone.pincode}?`)) return; try { await adminDeleteDeliveryZone(zone._id); await load(); } catch (deleteError) { setError(deleteError.message); } };

  return <div>
    <PageHeader title="Delivery Zones" description="Manage exact PIN coverage and delivery promises." action={<button onClick={() => { setEditing(null); setForm(blank); }} className="inline-flex items-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15} />Add zone</button>} />
    {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {status && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</p>}
    <div className="mb-5 grid gap-3 sm:grid-cols-4">{[["Total zones", zones.length], ["Active zones", activeCount], ["Serviceable", serviceableCount], ["Inactive", zones.length - activeCount]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-[#071426]">{value}</p></div>)}</div>
    <form onSubmit={save} className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4 lg:grid-cols-8">
      {[["country","Country"],["state","State"],["city","City"],["pincode","PIN code"],["areas","Areas (comma separated)"],["deliveryCharge","Charge"],["minDays","Min days"],["maxDays","Max days"]].map(([key, label]) => <label key={key} className="text-xs font-semibold text-slate-600"><span>{label}</span><input required={!["areas","deliveryCharge","minDays","maxDays"].includes(key)} type={["deliveryCharge","minDays","maxDays"].includes(key) ? "number" : "text"} min={key === "deliveryCharge" ? 0 : 0} maxLength={key === "pincode" ? 6 : undefined} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>)}
      <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={form.serviceable} onChange={(event) => setForm({ ...form, serviceable: event.target.checked })} /> Serviceable</label><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Active</label><div className="flex items-end gap-2"><button className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold">{editing ? "Update" : "Create"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blank); }} className="rounded-lg border px-4 py-2 text-xs">Cancel</button>}</div>
    </form>
    <div className="mb-4 flex flex-col gap-2 sm:flex-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search city, PIN, or area" className="rounded-lg border px-3 py-2 text-sm" /><select value={city} onChange={(event) => setCity(event.target.value)} className="rounded-lg border px-3 py-2 text-sm"><option value="">All cities</option>{[...new Set(zones.map((zone) => zone.city))].map((name) => <option key={name}>{name}</option>)}</select><select value={status.value || ""} onChange={(event) => setStatus(event.target.value ? { key: "active", value: event.target.value } : "")} className="rounded-lg border px-3 py-2 text-sm"><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select></div>
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["City","PIN code","Areas","Serviceability","Status","Charge","Estimated","Actions"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((zone) => <tr key={zone._id}><td className="px-4 py-3 font-semibold">{zone.city}</td><td className="px-4 py-3 font-mono">{zone.pincode}</td><td className="px-4 py-3">{(zone.areas || []).join(", ") || "-"}</td><td className="px-4 py-3">{zone.serviceable ? "Available" : "Blocked"}</td><td className="px-4 py-3">{zone.active ? "Active" : "Inactive"}</td><td className="px-4 py-3">₹{zone.deliveryCharge}</td><td className="px-4 py-3">{zone.estimatedDeliveryDays.min}-{zone.estimatedDeliveryDays.max} days</td><td className="flex gap-1 px-4 py-3"><button title="Edit" onClick={() => { setEditing(zone); setForm(toForm(zone)); }} className="rounded p-2 hover:bg-slate-100"><Pencil size={15} /></button><button title="Toggle active" onClick={() => toggle(zone, "status")} className="rounded border px-2 text-xs">{zone.active ? "Disable" : "Enable"}</button><button title="Toggle serviceability" onClick={() => toggle(zone, "serviceability")} className="rounded border px-2 text-xs">{zone.serviceable ? "Block" : "Allow"}</button><button title="Delete" onClick={() => remove(zone)} className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>
  </div>;
}

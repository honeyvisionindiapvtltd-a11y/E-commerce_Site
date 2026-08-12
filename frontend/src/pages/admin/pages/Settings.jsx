import { useEffect, useState } from "react";
import { CreditCard, Save, Shield, Store, Truck } from "lucide-react";
import { adminGet, adminUpdateSettings } from "../api";
import PageHeader from "../components/PageHeader";
import { Field, inputClass } from "../components/FormField";

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <span className="text-xs font-medium">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`h-6 w-11 rounded-full p-1 transition ${value ? "bg-emerald-500" : "bg-slate-300"}`}
      >
        <span className={`block h-4 w-4 rounded-full bg-white transition ${value ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100">
          <Icon size={16} />
        </div>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function Settings() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      const data = await adminGet("settings");
      if (active) setForm(data || {});
    };

    loadSettings();
    return () => { active = false; };
  }, []);

  if (!form) return <p>Loading...</p>;

  const save = async () => {
    await adminUpdateSettings({
      ...form,
      taxRate: Number(form.taxRate || 0),
      lowStockLimit: Number(form.lowStockLimit || 0),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <PageHeader title="Settings" description="Configure store, payments, delivery and system preferences." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Section icon={Store} title="Store Information">
          <div className="space-y-4">
            <Field label="STORE NAME">
              <input value={form.storeName || ""} onChange={(e) => setForm({ ...form, storeName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="SUPPORT EMAIL">
              <input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </Field>
            <Field label="SUPPORT PHONE">
              <input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </Field>
            <Field label="CURRENCY">
              <select value={form.currency || "INR"} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputClass}>
                <option>INR</option>
                <option>USD</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section icon={Shield} title="Security & Inventory">
          <div className="space-y-4">
            <Field label="TAX RATE %">
              <input type="number" value={form.taxRate || 0} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} className={inputClass} />
            </Field>
            <Field label="LOW STOCK ALERT LIMIT">
              <input type="number" value={form.lowStockLimit || 0} onChange={(e) => setForm({ ...form, lowStockLimit: e.target.value })} className={inputClass} />
            </Field>
          </div>
        </Section>

        <Section icon={CreditCard} title="Payments & Checkout">
          <div className="space-y-3">
            <Toggle label="Cash on Delivery" value={Boolean(form.codEnabled)} onChange={(value) => setForm({ ...form, codEnabled: value })} />
            <Toggle label="Online Payments" value={Boolean(form.onlinePaymentEnabled)} onChange={(value) => setForm({ ...form, onlinePaymentEnabled: value })} />
          </div>
        </Section>

        <Section icon={Truck} title="Delivery & Operations">
          <div className="space-y-3">
            <Toggle label="Maintenance Mode" value={Boolean(form.maintenanceMode)} onChange={(value) => setForm({ ...form, maintenanceMode: value })} />
          </div>
        </Section>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-2 rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-semibold text-white"
        >
          <Save size={15} />
          {saved ? "Saved" : "Save Settings"}
        </button>
      </div>
    </>
  );
}

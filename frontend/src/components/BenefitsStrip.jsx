import {
  BadgeCheck,
  CreditCard,
  Headphones,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";

const benefits = [
  {
    title: "100% Original Products",
    text: "Sourced from trusted brands",
    icon: BadgeCheck,
  },
  {
    title: "Secure Payments",
    text: "Multiple safe payment options",
    icon: CreditCard,
  },
  {
    title: "Fast Delivery",
    text: "Across India",
    icon: Truck,
  },
  {
    title: "Professional Installation",
    text: "Expert installation support",
    icon: Wrench,
  },
  {
    title: "AMC & Warranty",
    text: "Extended protection plans",
    icon: ShieldCheck,
  },
  {
    title: "24/7 Customer Support",
    text: "Always here to help",
    icon: Headphones,
  },
];

export default function BenefitsStrip() {
  return (
    <section className="w-full">
      <div className="glass-panel grid overflow-hidden rounded-[28px] p-2 sm:grid-cols-2 lg:grid-cols-6">
        {benefits.map(({ title, text, icon: Icon }) => (
          <div
            key={title}
            className="group flex items-center gap-3 rounded-[20px] border border-slate-200/80 bg-gradient-to-br from-white via-sky-50 to-indigo-50 px-4 py-4 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-100"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-200">
              <Icon size={20} strokeWidth={2} className="shrink-0" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800">{title}</h3>
              <p className="mt-1 text-xs text-slate-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
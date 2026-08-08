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
    <section className="w-full px-3 py-3 sm:px-6">
      <div className="grid rounded-xl bg-blue-50 py-2 sm:grid-cols-2 lg:grid-cols-6">
        {benefits.map(({ title, text, icon: Icon }) => (
          <div
            key={title}
            className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 last:border-b-0 sm:odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0"
          >
            <Icon size={30} strokeWidth={1.6} className="shrink-0 text-blue-600" />

            <div>
              <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
              <p className="mt-1 text-xs text-slate-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
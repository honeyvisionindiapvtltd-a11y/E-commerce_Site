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

const repeatedBenefits = [...benefits, ...benefits];

export default function BenefitsStrip() {
  return (
    <section className="w-full">
      <div className="hidden gap-2 overflow-hidden rounded-[22px] p-2 sm:gap-3 sm:rounded-[28px] sm:p-2 md:grid md:grid-cols-2 lg:grid-cols-6">
        {benefits.map(({ title, text, icon: Icon }) => (
          <div
            key={title}
            className="group flex items-center gap-2.5 rounded-[16px] border border-slate-200/80 bg-gradient-to-br from-white via-sky-50 to-indigo-50 px-3 py-3 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-100 sm:gap-3 sm:rounded-[20px] sm:px-4 sm:py-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-200 sm:h-11 sm:w-11 sm:rounded-2xl">
              <Icon size={18} strokeWidth={2} className="shrink-0 sm:h-5 sm:w-5" />
            </div>

            <div className="min-w-0">
              <h3 className="text-[11px] font-bold leading-tight text-slate-800 sm:text-sm">{title}</h3>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-500 sm:text-xs">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mobile-benefits-shell md:hidden">
        <div className="mobile-benefits-track">
          {repeatedBenefits.map(({ title, text, icon: Icon }, index) => (
            <div
              key={`${title}-${index}`}
              className="mobile-benefit-item group flex items-center gap-2.5 rounded-[16px] border border-slate-200/80 bg-gradient-to-br from-white via-sky-50 to-indigo-50 px-3 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-200">
                <Icon size={15} strokeWidth={2} className="shrink-0" />
              </div>

              <div className="min-w-0">
                <h3 className="text-[10px] font-bold leading-tight text-slate-800">{title}</h3>
                <p className="mt-0.5 text-[9px] leading-snug text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
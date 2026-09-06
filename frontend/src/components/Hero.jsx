import {
  BadgeCheck,
  Headphones,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";

const heroImage = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786269627/hero_dgn7no.jpg";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#070c18] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.32),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.25),transparent_24%),linear-gradient(135deg,#0b1220_0%,#0d1b2a_35%,#111827_100%)]" />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.10) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />

      <div className="absolute inset-x-0 bottom-0 h-[42%] sm:h-[46%] lg:inset-y-0 lg:right-0 lg:h-full lg:w-[68%] lg:inset-x-auto">
        <div className="float-slow absolute -right-10 top-8 h-40 w-40 rounded-full bg-violet-500/25 blur-3xl sm:h-48 sm:w-48 lg:-right-10 lg:top-16 lg:h-56 lg:w-56" />
        <div className="float-slow absolute right-10 top-16 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl sm:right-24 sm:top-20 sm:h-64 sm:w-64 lg:right-24 lg:top-28 lg:h-72 lg:w-72" />
        <img
          src={heroImage}
          alt="IT products and security solutions"
          className="h-full w-full object-cover object-center opacity-90 lg:h-full"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,12,24,0.15)_0%,rgba(7,12,24,0.35)_35%,rgba(7,12,24,0.8)_100%)] lg:bg-[linear-gradient(90deg,rgba(7,12,24,1)_0%,rgba(7,12,24,0.96)_8%,rgba(7,12,24,0.85)_22%,rgba(7,12,24,0.38)_52%,rgba(7,12,24,0.10)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[360px] max-w-7xl items-center px-3 py-8 sm:min-h-[520px] sm:px-6 lg:min-h-[640px] lg:px-8 lg:py-16">
        <div className="relative w-full max-w-2xl lg:max-w-[54%]">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[9px] text-sky-100 shadow-[0_0_40px_rgba(59,130,246,0.18)] backdrop-blur-md sm:gap-3 sm:px-4 sm:py-2 sm:text-sm">
            <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-slate-950 sm:px-3 sm:text-[10px]">
              Summer Sale
            </span>
            <span className="whitespace-nowrap">Up to 40% OFF</span>
          </div>

          <h1 className="mt-4 text-[2rem] font-black leading-[1.05] tracking-[-0.05em] text-white sm:mt-7 sm:text-4xl lg:text-6xl">
            Powering your world with
            <span className="mt-1 block bg-gradient-to-r from-amber-300 via-orange-300 to-sky-300 bg-clip-text text-transparent sm:mt-2">
              smart IT & security
            </span>
            solutions
          </h1>

          <p className="mt-3 max-w-xl text-xs leading-5 text-slate-200 sm:mt-6 sm:text-base sm:leading-8 lg:text-lg">
            Smart devices, high-performance networking, CCTV systems, and
            expert support all in one trusted destination.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 text-sm sm:mt-9 sm:gap-x-5 sm:gap-y-5 sm:grid-cols-4">
            <Feature icon={BadgeCheck} title="100% Original" text="Trusted brands" />
            <Feature icon={ShieldCheck} title="Secure Payments" text="Safe checkout" />
            <Feature icon={Truck} title="Fast Delivery" text="India-wide" />
            <Feature icon={Headphones} title="Expert Support" text="Always on" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:mt-10 sm:gap-4">
            <Link
              to="/products"
              className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-orange-400/30 sm:px-8 sm:py-3.5 sm:text-sm"
            >
              Shop Now
            </Link>

            <Link
              to="/solutions"
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:border-sky-300 hover:text-sky-200 sm:px-8 sm:py-3.5 sm:text-sm"
            >
              Explore Services
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] text-slate-200 sm:mt-10 sm:gap-6 sm:text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-300 sm:h-4 sm:w-4" />
              <span>14K+ happy customers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>3.2x faster support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur-sm sm:rounded-2xl sm:px-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-amber-300 sm:h-[18px] sm:w-[18px]" />
      <div>
        <p className="text-[10px] font-semibold text-white sm:text-[11px]">{title}</p>
        <p className="mt-1 text-[9px] text-slate-300 sm:text-[10px]">{text}</p>
      </div>
    </div>
  );
}
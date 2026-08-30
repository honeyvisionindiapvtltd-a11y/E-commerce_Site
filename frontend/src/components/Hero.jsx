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

      <div className="absolute right-0 top-0 h-full w-full lg:w-[68%]">
        <div className="float-slow absolute -right-10 top-16 h-56 w-56 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="float-slow absolute right-24 top-28 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <img
          src={heroImage}
          alt="IT products and security solutions"
          className="h-full w-full object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,12,24,1)_0%,rgba(7,12,24,0.96)_8%,rgba(7,12,24,0.85)_22%,rgba(7,12,24,0.38)_52%,rgba(7,12,24,0.10)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[640px] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl lg:max-w-[54%]">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-sky-100 shadow-[0_0_40px_rgba(59,130,246,0.18)] backdrop-blur-md">
            <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-950">
              Summer Sale
            </span>
            <span>Up to 40% OFF on best-sellers</span>
          </div>

          <h1 className="mt-7 text-4xl font-black leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
            Powering your world with
            <span className="mt-2 block bg-gradient-to-r from-amber-300 via-orange-300 to-sky-300 bg-clip-text text-transparent">
              smart IT & security
            </span>
            solutions
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
            Smart devices, high-performance networking, CCTV systems, and
            expert support all in one trusted destination.
          </p>

          <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-5 text-sm sm:grid-cols-4">
            <Feature icon={BadgeCheck} title="100% Original" text="Trusted brands" />
            <Feature icon={ShieldCheck} title="Secure Payments" text="Safe checkout" />
            <Feature icon={Truck} title="Fast Delivery" text="India-wide" />
            <Feature icon={Headphones} title="Expert Support" text="Always on" />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/products"
              className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-orange-400/30"
            >
              Shop Now
            </Link>

            <Link
              to="/solutions"
              className="rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-sky-300 hover:text-sky-200"
            >
              Explore Services
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>14K+ happy customers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
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
    <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
      <Icon size={18} className="mt-0.5 shrink-0 text-amber-300" />
      <div>
        <p className="text-[11px] font-semibold text-white">{title}</p>
        <p className="mt-1 text-[10px] text-slate-300">{text}</p>
      </div>
    </div>
  );
}
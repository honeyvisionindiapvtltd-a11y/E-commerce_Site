import {
  BadgeCheck,
  Headphones,
  Play,
  ShieldCheck,
  Truck,
} from "lucide-react";

import heroImage from "../assets/hero.jpeg";

export default function Hero() {
  return (
    <section className="relative min-h-[620px] overflow-hidden bg-[#020b1d] text-white">
      {/* Full hero visual, merged into the background */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[70%]">
        <img
          src={heroImage}
          alt="IT products and security solutions"
          className="h-full w-full object-cover object-center"
        />

        {/* Fade image into the left background — removes separate-card look */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#020b1d_0%,rgba(2,11,29,0.98)_8%,rgba(2,11,29,0.78)_28%,rgba(2,11,29,0.18)_55%,rgba(2,11,29,0.05)_100%)]" />

        {/* Bottom fade for a polished unified look */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020b1d]/60 via-transparent to-[#020b1d]/10" />
      </div>

      {/* Subtle blue light across the entire hero */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_65%_42%,rgba(14,116,223,0.2),transparent_38%)]" />

      {/* Text content */}
      <div className="relative z-10 mx-auto flex min-h-[620px] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl lg:max-w-[52%]">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-amber-200 backdrop-blur-sm">
            <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950">
              Summer Sale
            </span>
            <span>Up to 40% OFF on Top Products</span>
          </div>

          <h1 className="mt-7 text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
            Powering Your World with Smart{" "}
            <span className="text-amber-400">IT & Security</span> Solutions
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
            Your one-stop destination for IT products, CCTV, drones,
            networking, accessories and more with professional installation
            and after-sales support.
          </p>

          <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-5 text-sm sm:grid-cols-4">
            <Feature
              icon={BadgeCheck}
              title="100% Original"
              text="Genuine Products"
            />
            <Feature
              icon={ShieldCheck}
              title="Secure Payments"
              text="Multiple Options"
            />
            <Feature icon={Truck} title="Fast Delivery" text="Across India" />
            <Feature
              icon={Headphones}
              title="Expert Installation"
              text="Support Available"
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button className="rounded-lg bg-amber-500 px-8 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
              Shop Now
            </button>

            <button className="rounded-lg border border-white/40 px-8 py-3.5 text-sm font-semibold text-white transition hover:border-amber-400 hover:text-amber-300">
              Explore Solutions
            </button>

            <button className="flex items-center gap-3 px-2 py-2 text-sm font-medium text-white transition hover:text-amber-300">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-white/40">
                <Play size={17} fill="currentColor" />
              </span>
              Watch Video
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={22} className="mt-0.5 shrink-0 text-amber-400" />
      <div>
        <p className="text-xs font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs text-slate-300">{text}</p>
      </div>
    </div>
  );
}
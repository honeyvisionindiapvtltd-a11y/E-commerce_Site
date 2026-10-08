import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Globe2,
  Headphones,
  Mail,
  MapPin,
  MonitorCog,
  Network,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { companyInfo } from "../config/companyInfo.js";

const services = [
  {
    icon: ShieldCheck,
    title: "CCTV & Security",
    text: "Advanced surveillance, access control and smart security systems.",
  },
  {
    icon: Network,
    title: "Networking",
    text: "Reliable structured cabling, Wi-Fi and enterprise network solutions.",
  },
  {
    icon: MonitorCog,
    title: "IT Infrastructure",
    text: "Computers, servers, peripherals and complete office IT setup.",
  },
  {
    icon: Headphones,
    title: "Support & AMC",
    text: "Professional installation, maintenance and responsive after-sales care.",
  },
];

const industries = [
  "Retail & Showrooms",
  "Corporate Offices",
  "Educational Institutions",
  "Healthcare Facilities",
  "Warehouses & Logistics",
  "Residential Projects",
];

export default function About() {
  return (
    <main className="about-page bg-[#020b1d] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_30%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-8 lg:py-20">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400 sm:text-sm sm:tracking-[0.22em]">
              About Honey Vision
            </p>

            <h1 className="about-display-heading mt-3 max-w-4xl text-3xl font-bold leading-tight sm:mt-5 sm:text-5xl lg:text-6xl">
              Technology that protects,{" "}
              <span className="text-amber-400">connects and powers your world.</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-6 sm:text-lg sm:leading-8">
              Honey Vision delivers dependable IT products, smart security
              systems and expert support for homes, businesses and institutions
              across India.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 sm:mt-10 sm:gap-4">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 sm:px-6 sm:py-3"
              >
                Talk to an Expert <ArrowRight size={18} />
              </a>

              <a
                href="#services"
                className="rounded-lg border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-amber-400 hover:text-amber-300 sm:px-6 sm:py-3"
              >
                Explore Our Services
              </a>

              <a
                href="https://honeyvision.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/5 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/10"
              >
                <Globe2 size={16} className="text-cyan-300" />
                honeyvision.in
                <ExternalLink size={14} className="text-cyan-300" />
              </a>
            </div>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-[18rem] items-center justify-center sm:max-w-[24rem] lg:max-w-[28rem]">
            <div aria-hidden="true" className="absolute inset-[8%] rounded-full bg-cyan-400/10 blur-3xl" />
            <div aria-hidden="true" className="absolute inset-[13%] rounded-full border border-cyan-300/15 bg-[radial-gradient(circle,rgba(14,165,233,0.13),rgba(7,19,38,0.18)_58%,transparent_72%)] shadow-[0_0_90px_rgba(14,165,233,0.12)]" />
            <div aria-hidden="true" className="absolute inset-[19%] rounded-full border border-white/10" />
            <div aria-hidden="true" className="absolute inset-[27%] rounded-full border border-amber-300/20" />
            <div aria-hidden="true" className="absolute left-[17%] top-[21%] h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.9)]" />
            <div aria-hidden="true" className="absolute bottom-[23%] right-[18%] h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.9)]" />

            <div className="relative z-10 flex h-[62%] w-[76%] items-center justify-center rounded-[2rem] border border-white/10 bg-slate-950/55 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-md sm:rounded-[2.5rem] sm:p-8">
              <img
                src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1788235324/logo1_fzsjda.png"
                alt="Honey Vision company logo"
                className="h-auto max-h-full w-full object-contain drop-shadow-[0_0_24px_rgba(250,204,21,0.2)]"
              />
            </div>

            <div aria-hidden="true" className="absolute left-0 top-[38%] z-20 grid h-11 w-11 place-items-center rounded-2xl border border-cyan-200/20 bg-[#0b1d35]/90 text-cyan-200 shadow-lg shadow-cyan-950/40 sm:h-14 sm:w-14">
              <ShieldCheck size={22} />
            </div>
            <div aria-hidden="true" className="absolute right-[2%] top-[24%] z-20 grid h-11 w-11 place-items-center rounded-2xl border border-amber-200/20 bg-[#0b1d35]/90 text-amber-300 shadow-lg shadow-amber-950/30 sm:h-14 sm:w-14">
              <Network size={22} />
            </div>
            <div aria-hidden="true" className="absolute bottom-[17%] left-[22%] z-20 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#0b1d35]/90 text-slate-200 shadow-lg sm:h-12 sm:w-12">
              <MonitorCog size={20} />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="border-b border-white/10 bg-slate-950/50">
        <div className="mx-auto flex max-w-7xl gap-4 overflow-x-auto px-4 py-3 text-xs font-medium text-slate-300 sm:gap-6 sm:px-6 sm:py-5 sm:text-sm lg:px-8">
          {[
            ["About Honey Vision", "#about"],
            ["Our Services", "#services"],
            ["Technology", "#technology"],
            ["Industry Solutions", "#industries"],
            ["Careers", "#careers"],
            ["Contact", "#contact"],
          ].map(([label, link]) => (
            <a
              key={link}
              href={link}
              className="whitespace-nowrap transition hover:text-amber-400"
            >
              {label}
            </a>
          ))}
        </div>
      </section>

      {/* About Honey Vision */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-6 sm:gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Who We Are
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:mt-4 sm:text-4xl">
              About Honey Vision
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300 sm:mt-6 sm:text-base sm:leading-8">
              Honey Vision is your trusted destination for IT products,
              security solutions, networking equipment and professional
              technology services. We combine quality products with practical
              expertise to deliver solutions that work reliably every day.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300 sm:mt-4 sm:text-base sm:leading-8">
              From a single security camera to complete enterprise
              infrastructure, our team helps customers choose, install and
              maintain technology with confidence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <Stat number="10+" label="Years of Experience" />
            <Stat number="5K+" label="Happy Customers" />
            <Stat number="100+" label="Products & Solutions" />
            <Stat number="24/7" label="Customer Support" />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-slate-900/60 py-10 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400 sm:text-sm sm:tracking-[0.2em]">
            What We Do
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:mt-4 sm:text-4xl">Our Services</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-5 sm:text-base sm:leading-8">
            End-to-end technology services—from product selection to
            installation, configuration and long-term support.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {services.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-xl border border-white/10 bg-[#071326] p-3 transition hover:-translate-y-1 hover:border-amber-400/50 sm:rounded-2xl sm:p-6"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-400/10 text-amber-400 sm:h-12 sm:w-12 sm:rounded-xl">
                  <Icon size={19} className="sm:h-[25px] sm:w-[25px]" />
                </div>
                <h3 className="mt-3 text-sm font-bold sm:mt-5 sm:text-lg">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-300 sm:mt-3 sm:text-sm sm:leading-6">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-6 sm:gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-2xl border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.22),transparent_45%),#071326] p-5 sm:rounded-3xl sm:p-10">
            <Cpu className="text-cyan-300" size={32} />
            <h2 className="mt-3 text-2xl font-bold sm:mt-6 sm:text-3xl">Technology That Works</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300 sm:mt-4 sm:text-base sm:leading-8">
              We partner trusted brands and modern technology with practical
              implementation—giving you reliable performance, simplified
              management and the confidence to grow.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Our Approach
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:mt-4 sm:text-4xl">
              Smart solutions, built around your needs.
            </h2>

            <div className="mt-5 space-y-3 sm:mt-8 sm:space-y-5">
              {[
                "Genuine products from trusted technology brands",
                "Solution planning tailored to your budget and requirements",
                "Certified installation and professional configuration",
                "Reliable after-sales support, AMC and upgrades",
              ].map((item) => (
                <div key={item} className="flex gap-2 text-sm text-slate-200 sm:gap-3 sm:text-base">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-amber-400" size={18} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section id="industries" className="bg-slate-900/60 py-10 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400 sm:text-sm sm:tracking-[0.2em]">
            Built for Every Sector
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:mt-4 sm:text-4xl">
            Industry Solutions
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-5 sm:text-base sm:leading-8">
            Every environment has different security, connectivity and IT
            requirements. We design practical solutions for each one.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {industries.map((industry) => (
              <div
                key={industry}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#071326] p-3 text-xs sm:gap-4 sm:rounded-xl sm:p-5 sm:text-base"
              >
                <Building2 className="shrink-0 text-amber-400" size={19} />
                <span className="font-semibold">{industry}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Careers */}
      <section id="careers" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8">
        <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400/15 to-cyan-500/10 p-5 sm:rounded-3xl sm:p-12">
          <BriefcaseBusiness className="text-amber-400" size={28} />
          <h2 className="mt-3 text-2xl font-bold sm:mt-5 sm:text-4xl">
            Build the future with Honey Vision.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200 sm:mt-4 sm:text-base sm:leading-8">
            We are always looking for motivated technicians, sales
            professionals and technology enthusiasts who care about excellent
            customer service.
          </p>
          <a
            href="mailto:careers@honeyvision.in"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 sm:mt-7 sm:px-6 sm:py-3"
          >
            View Career Opportunities <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-white/10 bg-slate-950 py-10 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400 sm:text-sm sm:tracking-[0.2em]">
                Let’s Talk
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:mt-4 sm:text-4xl">
                Contact Honey Vision
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:mt-5 sm:text-base sm:leading-8">
                Tell us what you need. Our team will help you find the right
                IT, networking or security solution.
              </p>

              <div className="mt-5 space-y-3 text-sm text-slate-200 sm:mt-8 sm:space-y-5 sm:text-base">
                <ContactRow icon={Phone} href={`tel:${companyInfo.phoneRaw}`} text={companyInfo.phone} />
                <ContactRow icon={Mail} href={`mailto:${companyInfo.supportEmail}`} text={companyInfo.supportEmail} />
                <ContactRow icon={MapPin} href={companyInfo.locationHref} text={companyInfo.location} />
              </div>
            </div>

            <form className="grid gap-3 rounded-xl border border-white/10 bg-[#071326] p-4 sm:gap-4 sm:rounded-2xl sm:p-8">
              <input
                type="text"
                placeholder="Your name"
                className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400 sm:px-4 sm:py-3 sm:text-base"
              />
              <input
                type="email"
                placeholder="Email address"
                className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400 sm:px-4 sm:py-3 sm:text-base"
              />
              <textarea
                rows="4"
                placeholder="How can we help?"
                className="resize-none rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400 sm:px-4 sm:py-3 sm:text-base"
              />
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 sm:px-6 sm:py-3 sm:text-base"
              >
                Send Enquiry
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ number, label }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-3 sm:rounded-2xl sm:p-6">
      <p className="text-2xl font-extrabold text-amber-400 sm:text-3xl">{number}</p>
      <p className="mt-1 text-xs text-slate-300 sm:mt-2 sm:text-sm">{label}</p>
    </div>
  );
}

function ContactRow({ icon: Icon, text, href }) {
  const content = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-400/10 text-amber-400 sm:h-11 sm:w-11">
        <Icon size={18} />
      </span>
      <span>{text}</span>
    </>
  );

  if (!href) {
    return <div className="flex items-center gap-3 sm:gap-4">{content}</div>;
  }

  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}     className="flex items-center gap-3 transition hover:text-amber-300 sm:gap-4">
      {content}
    </a>
  );
}

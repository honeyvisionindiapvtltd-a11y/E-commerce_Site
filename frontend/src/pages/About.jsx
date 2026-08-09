import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Cpu,
  Headphones,
  Mail,
  MapPin,
  MonitorCog,
  Network,
  Phone,
  ShieldCheck,
} from "lucide-react";

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
    <main className="bg-[#020b1d] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-400">
            About Honey Vision
          </p>

          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Technology that protects, connects and powers your world.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Honey Vision delivers dependable IT products, smart security
            systems and expert support for homes, businesses and institutions
            across India.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Talk to an Expert <ArrowRight size={18} />
            </a>

            <a
              href="#services"
              className="rounded-lg border border-white/25 px-6 py-3 font-semibold text-white transition hover:border-amber-400 hover:text-amber-300"
            >
              Explore Our Services
            </a>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="border-b border-white/10 bg-slate-950/50">
        <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-5 text-sm font-medium text-slate-300 sm:px-6 lg:px-8">
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
      <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Who We Are
            </p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              About Honey Vision
            </h2>
            <p className="mt-6 leading-8 text-slate-300">
              Honey Vision is your trusted destination for IT products,
              security solutions, networking equipment and professional
              technology services. We combine quality products with practical
              expertise to deliver solutions that work reliably every day.
            </p>
            <p className="mt-4 leading-8 text-slate-300">
              From a single security camera to complete enterprise
              infrastructure, our team helps customers choose, install and
              maintain technology with confidence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Stat number="10+" label="Years of Experience" />
            <Stat number="5K+" label="Happy Customers" />
            <Stat number="100+" label="Products & Solutions" />
            <Stat number="24/7" label="Customer Support" />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-slate-900/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
            What We Do
          </p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Our Services</h2>
          <p className="mt-5 max-w-2xl leading-8 text-slate-300">
            End-to-end technology services—from product selection to
            installation, configuration and long-term support.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/10 bg-[#071326] p-6 transition hover:-translate-y-1 hover:border-amber-400/50"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-400/10 text-amber-400">
                  <Icon size={25} />
                </div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-3xl border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.22),transparent_45%),#071326] p-8 sm:p-10">
            <Cpu className="text-cyan-300" size={42} />
            <h2 className="mt-6 text-3xl font-bold">Technology That Works</h2>
            <p className="mt-4 leading-8 text-slate-300">
              We partner trusted brands and modern technology with practical
              implementation—giving you reliable performance, simplified
              management and the confidence to grow.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Our Approach
            </p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Smart solutions, built around your needs.
            </h2>

            <div className="mt-8 space-y-5">
              {[
                "Genuine products from trusted technology brands",
                "Solution planning tailored to your budget and requirements",
                "Certified installation and professional configuration",
                "Reliable after-sales support, AMC and upgrades",
              ].map((item) => (
                <div key={item} className="flex gap-3 text-slate-200">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-amber-400" size={21} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section id="industries" className="bg-slate-900/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
            Built for Every Sector
          </p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
            Industry Solutions
          </h2>
          <p className="mt-5 max-w-2xl leading-8 text-slate-300">
            Every environment has different security, connectivity and IT
            requirements. We design practical solutions for each one.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry) => (
              <div
                key={industry}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#071326] p-5"
              >
                <Building2 className="text-amber-400" size={24} />
                <span className="font-semibold">{industry}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Careers */}
      <section id="careers" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-r from-amber-400/15 to-cyan-500/10 p-8 sm:p-12">
          <BriefcaseBusiness className="text-amber-400" size={36} />
          <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
            Build the future with Honey Vision.
          </h2>
          <p className="mt-4 max-w-2xl leading-8 text-slate-200">
            We are always looking for motivated technicians, sales
            professionals and technology enthusiasts who care about excellent
            customer service.
          </p>
          <a
            href="mailto:careers@honeyvision.in"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            View Career Opportunities <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-white/10 bg-slate-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
                Let’s Talk
              </p>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                Contact Honey Vision
              </h2>
              <p className="mt-5 max-w-xl leading-8 text-slate-300">
                Tell us what you need. Our team will help you find the right
                IT, networking or security solution.
              </p>

              <div className="mt-8 space-y-5 text-slate-200">
                <ContactRow icon={Phone} text="+91 98765 43210" />
                <ContactRow icon={Mail} text="support@honeyvision.in" />
                <ContactRow icon={MapPin} text="Bhubaneswar, Odisha, India" />
              </div>
            </div>

            <form className="grid gap-4 rounded-2xl border border-white/10 bg-[#071326] p-6 sm:p-8">
              <input
                type="text"
                placeholder="Your name"
                className="rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
              />
              <input
                type="email"
                placeholder="Email address"
                className="rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
              />
              <textarea
                rows="4"
                placeholder="How can we help?"
                className="resize-none rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
              />
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
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
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
      <p className="text-3xl font-extrabold text-amber-400">{number}</p>
      <p className="mt-2 text-sm text-slate-300">{label}</p>
    </div>
  );
}

function ContactRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-4">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-400/10 text-amber-400">
        <Icon size={20} />
      </span>
      <span>{text}</span>
    </div>
  );
}

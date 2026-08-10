import {
  Activity,
  ArrowRight,
  Bot,
  Brain,
  Camera,
  Car,
  ChartLine,
  Cloud,
  Database,
  Flame,
  LockKeyhole,
  MessageSquare,
  PlayCircle,
  ScanFace,
  Search,
  ShieldAlert,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const aiTools = [
  {
    title: "Camera Recommendation",
    description:
      "Get AI-powered camera recommendations based on your site type, area, and requirements.",
    icon: Camera,
    color: "from-purple-500/30 to-fuchsia-500/10",
    link: "/ai-tools/camera-recommendation",
  },
  {
    title: "Coverage Calculator",
    description:
      "Calculate optimal camera placement and coverage area with AI accuracy.",
    icon: Target,
    color: "from-blue-500/30 to-cyan-500/10",
    link: "/ai-tools/coverage-calculator",
  },
  {
    title: "Storage Calculator",
    description:
      "Estimate storage requirements based on resolution, retention period, and frame rate.",
    icon: Database,
    color: "from-teal-500/30 to-emerald-500/10",
    link: "/ai-tools/storage-calculator",
  },
  {
    title: "Bandwidth Calculator",
    description:
      "Calculate bandwidth needs based on camera count, resolution, and compression.",
    icon: Activity,
    color: "from-amber-500/30 to-orange-500/10",
    link: "/ai-tools/bandwidth-calculator",
  },
  {
    title: "AI Chat Assistant",
    description:
      "Get instant answers to your surveillance queries from our AI assistant.",
    icon: MessageSquare,
    color: "from-purple-500/30 to-violet-500/10",
    link: "/ai-tools/chat-assistant",
  },
  {
    title: "Face Recognition",
    description:
      "Detect, recognize and match faces in real-time with high accuracy AI models.",
    icon: ScanFace,
    color: "from-blue-500/30 to-indigo-500/10",
    link: "/ai-tools/face-recognition",
  },
  {
    title: "Vehicle Detection",
    description:
      "Detect and classify vehicles in real-time with AI-powered analytics.",
    icon: Car,
    color: "from-teal-500/30 to-cyan-500/10",
    link: "/ai-tools/vehicle-detection",
  },
  {
    title: "Fire Detection",
    description:
      "Identify smoke and fire events instantly and get real-time alerts.",
    icon: Flame,
    color: "from-red-500/30 to-orange-500/10",
    link: "/ai-tools/fire-detection",
  },
  {
    title: "Intrusion Detection",
    description:
      "Detect unauthorized access or intrusions and strengthen your security.",
    icon: ShieldAlert,
    color: "from-violet-500/30 to-purple-500/10",
    link: "/ai-tools/intrusion-detection",
  },
];

const solutions = [
  {
    title: "Intelligent Surveillance",
    description:
      "AI-enhanced monitoring for real-time detection, alerts and automated response.",
    icon: Camera,
  },
  {
    title: "Smart Analytics",
    description:
      "Extract meaningful insights with advanced analytics and behavior detection.",
    icon: ChartLine,
  },
  {
    title: "AI Video Search",
    description:
      "Search footage by objects, faces, events and attributes in seconds.",
    icon: Search,
  },
  {
    title: "Predictive Monitoring",
    description:
      "Predict risks and anomalies before they happen with AI-powered predictive models.",
    icon: ShieldCheck,
  },
];

const advantages = [
  {
    title: "Fast Processing",
    description:
      "AI algorithms optimized for real-time processing and quick results.",
    icon: Zap,
    border: "border-blue-500/70",
    iconColor: "text-blue-400",
  },
  {
    title: "99.9% Accuracy",
    description:
      "High accuracy AI models ensure reliable detection and reduced false alerts.",
    icon: Target,
    border: "border-purple-500/70",
    iconColor: "text-purple-400",
  },
  {
    title: "Cloud Integration",
    description:
      "Seamless integration with cloud for scalable storage and remote access.",
    icon: Cloud,
    border: "border-teal-500/70",
    iconColor: "text-teal-300",
  },
  {
    title: "Enterprise Security",
    description:
      "Bank-grade encryption and security for complete data protection.",
    icon: LockKeyhole,
    border: "border-amber-500/70",
    iconColor: "text-amber-400",
  },
];

export default function AiTools() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020b1b] text-white">
      {/* Render your Navbar component globally in App.jsx or Layout.jsx */}

      {/* Hero */}
      <section className="relative border-b border-blue-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_45%,rgba(0,99,255,0.24),transparent_30%),radial-gradient(circle_at_25%_30%,rgba(25,105,255,0.12),transparent_28%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-3 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-22">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <Brain size={14} className="text-blue-400" />
              AI POWERED SOLUTIONS
            </span>

            <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
                AI
              </span>{" "}
              Tools
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              Powerful AI-powered calculators and intelligent security tools
              designed to simplify surveillance planning and management.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="#tools"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                <Bot size={18} />
                Explore AI Tools
              </Link>

              <Link
                to="/request-demo"
                className="inline-flex items-center gap-2 rounded-lg border border-blue-400/70 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-500/10"
              >
                <PlayCircle size={18} />
                Watch Demo
              </Link>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-4">
              <SmallBenefit icon={Brain} text="Smart & Accurate Calculations" />
              <SmallBenefit icon={Zap} text="Save Time & Resources" />
              <SmallBenefit icon={Target} text="Data Driven Decisions" />
            </div>
          </div>

          <div className="relative">
            <img
              src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1786345411/Ai_zmtvl8.png"
              alt="AI-powered surveillance tools"
              className="mx-auto w-full max-w-xl object-contain"
            />
          </div>
        </div>
      </section>

      {/* AI tools cards */}
      <section id="tools" className="px-3 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-xl border border-blue-500/20 bg-[#06142c]/80 p-5 shadow-[0_0_35px_rgba(20,85,255,0.08)] sm:p-7">
          <div className="text-center">
            <h2 className="text-3xl font-bold">AI Tools</h2>
            <p className="mt-3 text-sm text-slate-400">
              Explore our advanced AI tools built for smarter surveillance
              planning and management.
            </p>
            <div className="mx-auto mt-3 h-0.5 w-10 bg-gradient-to-r from-blue-500 to-purple-500" />
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aiTools.map(({ title, description, icon: Icon, color, link }) => (
              <Link
                key={title}
                to={link}
                className="group rounded-xl border border-blue-500/40 bg-[#07172e] p-5 transition hover:-translate-y-1 hover:border-blue-400 hover:bg-[#0a1e3e]"
              >
                <div className="flex gap-4">
                  <div
                    className={`grid h-13 w-13 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${color}`}
                  >
                    <Icon size={27} className="text-cyan-300" />
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-5 text-slate-400">
                      {description}
                    </p>
                  </div>
                </div>

                <span className="ml-auto mt-4 flex h-8 w-8 items-center justify-center rounded-full border border-blue-400/60 text-blue-300 transition group-hover:bg-blue-500 group-hover:text-white">
                  <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured solution */}
      <section className="px-3 py-2 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-7 rounded-xl border border-blue-500/20 bg-[#06142c]/80 p-5 sm:p-7 lg:grid-cols-2 lg:items-center">
          <img
            src="/images/ai/ai-dashboard.png"
            alt="HoneyVision AI surveillance dashboard"
            className="w-full rounded-lg border border-blue-400/30"
          />

          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <Zap size={14} />
              SMARTER SURVEILLANCE
            </span>

            <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
              Featured{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                AI
              </span>{" "}
              Solutions
            </h2>

            <p className="mt-4 max-w-lg text-slate-400">
              Advanced AI solutions to help you monitor, analyze and respond
              smarter.
            </p>

            <div className="mt-6 space-y-5">
              {solutions.map(({ title, description, icon: Icon }) => (
                <div key={title} className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-blue-500/50 bg-blue-500/10 text-blue-300">
                    <Icon size={23} />
                  </div>

                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-400">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="px-3 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-xl border border-blue-500/20 bg-[#06142c]/80 p-5 sm:p-7">
          <h2 className="text-center text-3xl font-bold">
            Why Use{" "}
            <span className="text-amber-400">HoneyVision AI?</span>
          </h2>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map(({ title, description, icon: Icon, border, iconColor }) => (
              <article
                key={title}
                className={`rounded-xl border ${border} bg-[#07172e] p-6 text-center`}
              >
                <Icon className={`mx-auto ${iconColor}`} size={42} />
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-3 pb-10 sm:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-blue-400 bg-gradient-to-r from-purple-900 via-blue-900 to-[#071d4f] p-7 sm:p-10">
          <img
            src="/images/ai/ai-cta.png"
            alt=""
            className="pointer-events-none absolute bottom-0 left-0 h-full w-1/3 object-contain opacity-60"
          />

          <div className="relative ml-auto max-w-xl">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Experience
              <br />
              AI-Powered Security?
            </h2>

            <p className="mt-4 text-slate-300">
              Transform your security operations with intelligent AI tools and
              advanced analytics.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                to="/get-started"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
              >
                Get Started
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/contact"
                className="rounded-lg border border-white/50 px-6 py-3 font-semibold hover:bg-white/10"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-500/20 bg-[#010816] px-3 py-10 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-7 text-sm text-slate-400 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-white">
              Honey<span className="text-amber-400">Vision</span>
            </h2>
            <p className="mt-4 leading-6">
              Delivering next-level visual systems and AI-powered solutions that
              transform security, agriculture, and the human experience.
            </p>
          </div>

          <FooterLinks
            title="Solutions"
            links={["AI Surveillance", "Cloud Monitoring", "Smart Analytics", "Access Control", "Custom AI Solutions"]}
          />
          <FooterLinks
            title="AI Tools"
            links={["Camera Recommendation", "Coverage Calculator", "Storage Calculator", "Bandwidth Calculator", "AI Chat Assistant"]}
          />
          <FooterLinks
            title="Company"
            links={["About Us", "Why Choose Us", "Our Technology", "Careers", "Contact Us"]}
          />
          <FooterLinks
            title="Contact Us"
            links={["+91 98765 43210", "info@honeyvision.in", "www.honeyvision.in", "India"]}
          />
        </div>

        <div className="mx-auto mt-8 flex max-w-7xl flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
          <span>© 2024 HoneyVision. All rights reserved.</span>
          <span>Privacy Policy &nbsp; | &nbsp; Terms of Service</span>
        </div>
      </footer>
    </main>
  );
}

function SmallBenefit({ icon: Icon, text }) {
  return (
    <div className="flex items-start gap-2 text-xs text-slate-300">
      <div className="rounded-md bg-violet-500/20 p-2 text-cyan-300">
        <Icon size={15} />
      </div>
      <span className="leading-5">{text}</span>
    </div>
  );
}

function FooterLinks({ title, links }) {
  return (
    <div>
      <h3 className="font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link}>
            <Link to="#" className="hover:text-blue-300">
              {link}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

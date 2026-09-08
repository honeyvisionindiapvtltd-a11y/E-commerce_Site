import { Link } from "react-router-dom";
import {
  Wrench,
  ShieldCheck,
  CalendarCheck,
  MapPin,
  Users,
  Clock3,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const services = [
  {
    icon: <Wrench size={34} />,
    title: "CCTV Installation",
    desc: "Professional installation for IP Cameras, Dome Cameras, Bullet Cameras, PTZ Cameras and complete surveillance systems.",
  },
  {
    icon: <ShieldCheck size={34} />,
    title: "Networking Setup",
    desc: "Enterprise WiFi, Routers, Switches, Structured Cabling and Server Rack Installation.",
  },
  {
    icon: <Users size={34} />,
    title: "Smart Office Deployment",
    desc: "Complete office IT infrastructure including access control, biometric systems and workstations.",
  },
  {
    icon: <CalendarCheck size={34} />,
    title: "Annual Maintenance",
    desc: "AMC plans with preventive maintenance, health checks and priority technical support.",
  },
];

export default function InstallationSection() {
  return (
    <section className="bg-white py-6 sm:py-10 lg:py-14">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-500 sm:text-sm sm:tracking-widest">
              Installation & AMC
            </p>
            <h2 className="mt-2 max-w-xl text-2xl font-bold leading-tight text-[#0A1931] sm:mt-3 sm:text-3xl lg:text-4xl">
              Professional Installation Services
            </h2>
            <p className="mt-3 max-w-xl text-xs leading-5 text-gray-600 sm:mt-4 sm:text-sm sm:leading-6">
              From CCTV cameras and drones to networking, servers and complete IT infrastructure,
              our certified engineers provide end-to-end installation and maintenance services.
            </p>
            <div className="mt-4 grid gap-2 sm:mt-6 sm:grid-cols-2 sm:gap-y-3">
              <div className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
                <CheckCircle size={16} className="shrink-0 text-green-500 sm:h-5 sm:w-5" />
                Certified Engineers
              </div>
              <div className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
                <CheckCircle size={16} className="shrink-0 text-green-500 sm:h-5 sm:w-5" />
                Pan India Installation
              </div>
              <div className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
                <CheckCircle size={16} className="shrink-0 text-green-500 sm:h-5 sm:w-5" />
                AMC & Warranty Support
              </div>
              <div className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
                <CheckCircle size={16} className="shrink-0 text-green-500 sm:h-5 sm:w-5" />
                Same Day Site Visit*
              </div>
              <div className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
                <CheckCircle size={16} className="shrink-0 text-green-500 sm:h-5 sm:w-5" />
                Remote Technical Assistance
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-7 sm:gap-3">
              <Link
                to="/installation"
                className="inline-flex items-center justify-center rounded-lg bg-[#0A1931] px-3 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#112C55] sm:rounded-xl sm:px-6 sm:py-3 sm:text-sm"
              >
                Book Installation
              </Link>
              <Link
                to="/amc"
                className="inline-flex items-center justify-center rounded-lg bg-[#0A1931] px-3 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#112C55] sm:rounded-xl sm:px-6 sm:py-3 sm:text-sm"
              >
                View AMC Plans
              </Link>
            </div>
          </div>

          <div>
            <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
              {services.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-100 bg-gray-50 p-3 transition hover:shadow-lg sm:rounded-2xl sm:p-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 sm:h-10 sm:w-10 sm:rounded-xl">
                    {item.icon}
                  </div>
                  <h3 className="mt-2 text-sm font-bold sm:mt-3 sm:text-base">{item.title}</h3>
                  <p className="mt-1.5 text-[11px] leading-4 text-gray-500 sm:mt-2 sm:text-xs sm:leading-5">{item.desc}</p>
                  <Link
                    to="/services"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A1931] sm:mt-3 sm:gap-2 sm:text-xs"
                  >
                    Learn More
                    <ArrowRight size={15} className="sm:h-[18px] sm:w-[18px]" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#06142B] to-[#0A1931] p-3 text-white sm:mt-5 sm:rounded-2xl sm:p-5">
              <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4 sm:gap-4">
                <div>
                  <MapPin size={19} className="mx-auto text-yellow-400 sm:h-6 sm:w-6" />
                  <h3 className="mt-1.5 text-[10px] font-bold leading-3 sm:mt-2 sm:text-xs">500+ Cities Covered</h3>
                </div>
                <div>
                  <Clock3 size={19} className="mx-auto text-yellow-400 sm:h-6 sm:w-6" />
                  <h3 className="mt-1.5 text-[10px] font-bold leading-3 sm:mt-2 sm:text-xs">24×7 Technical Support</h3>
                </div>
                <div>
                  <Users size={19} className="mx-auto text-yellow-400 sm:h-6 sm:w-6" />
                  <h3 className="mt-1.5 text-[10px] font-bold leading-3 sm:mt-2 sm:text-xs">Certified Engineers</h3>
                </div>
                <div>
                  <ShieldCheck size={19} className="mx-auto text-yellow-400 sm:h-6 sm:w-6" />
                  <h3 className="mt-1.5 text-[10px] font-bold leading-3 sm:mt-2 sm:text-xs">Warranty & AMC</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

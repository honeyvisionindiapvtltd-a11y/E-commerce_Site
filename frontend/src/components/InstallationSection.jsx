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
    <section className="bg-white py-8 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-500 sm:text-sm sm:tracking-widest">
              Installation & AMC
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-[#0A1931] sm:mt-4 sm:text-4xl lg:text-5xl">
              Professional Installation Services
            </h2>
            <p className="mt-3 text-xs leading-5 text-gray-600 sm:mt-6 sm:text-base sm:leading-8">
              From CCTV cameras and drones to networking, servers and complete IT infrastructure,
              our certified engineers provide end-to-end installation and maintenance services.
            </p>
            <div className="mt-5 space-y-2 sm:mt-10 sm:space-y-5">
              <div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-base">
                <CheckCircle size={17} className="shrink-0 text-green-500 sm:h-6 sm:w-6" />
                Certified Engineers
              </div>
              <div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-base">
                <CheckCircle size={17} className="shrink-0 text-green-500 sm:h-6 sm:w-6" />
                Pan India Installation
              </div>
              <div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-base">
                <CheckCircle size={17} className="shrink-0 text-green-500 sm:h-6 sm:w-6" />
                AMC & Warranty Support
              </div>
              <div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-base">
                <CheckCircle size={17} className="shrink-0 text-green-500 sm:h-6 sm:w-6" />
                Same Day Site Visit*
              </div>
              <div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-base">
                <CheckCircle size={17} className="shrink-0 text-green-500 sm:h-6 sm:w-6" />
                Remote Technical Assistance
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-10 sm:gap-5">
              <Link
                to="/installation"
                className="inline-flex items-center justify-center rounded-lg bg-[#0A1931] px-3 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#112C55] sm:rounded-xl sm:px-8 sm:py-4 sm:text-base"
              >
                Book Installation
              </Link>
              <Link
                to="/amc"
                className="inline-flex items-center justify-center rounded-lg bg-[#0A1931] px-3 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#112C55] sm:rounded-xl sm:px-8 sm:py-4 sm:text-base"
              >
                View AMC Plans
              </Link>
            </div>
          </div>

          <div>
            <div className="grid gap-2.5 sm:gap-6 md:grid-cols-2">
              {services.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-gray-50 p-3 transition hover:shadow-xl sm:rounded-3xl sm:p-7"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 sm:h-16 sm:w-16 sm:rounded-2xl">
                    {item.icon}
                  </div>
                  <h3 className="mt-2 text-sm font-bold sm:mt-6 sm:text-xl">{item.title}</h3>
                  <p className="mt-1.5 text-[11px] leading-4 text-gray-500 sm:mt-4 sm:text-base sm:leading-7">{item.desc}</p>
                  <Link
                    to="/services"
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A1931] sm:mt-6 sm:gap-2 sm:text-base"
                  >
                    Learn More
                    <ArrowRight size={15} className="sm:h-[18px] sm:w-[18px]" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#06142B] to-[#0A1931] p-3.5 text-white sm:mt-16 sm:rounded-3xl sm:p-10">
              <div className="grid grid-cols-2 gap-3 text-center sm:gap-8 lg:grid-cols-4">
                <div>
                  <MapPin size={19} className="mx-auto text-yellow-400 sm:h-6 sm:w-6" />
                  <h3 className="mt-1.5 text-[10px] font-bold leading-3 sm:mt-4 sm:text-base">500+ Cities Covered</h3>
                </div>
                <div>
                  <Clock3 size={19} className="mx-auto text-yellow-400 sm:h-6 sm:w-6" />
                  <h3 className="mt-1.5 text-[10px] font-bold leading-3 sm:mt-4 sm:text-base">24×7 Technical Support</h3>
                </div>
                <div>
                  <Users size={19} className="mx-auto text-yellow-400 sm:h-6 sm:w-6" />
                  <h3 className="mt-1.5 text-[10px] font-bold leading-3 sm:mt-4 sm:text-base">Certified Engineers</h3>
                </div>
                <div>
                  <ShieldCheck size={19} className="mx-auto text-yellow-400 sm:h-6 sm:w-6" />
                  <h3 className="mt-1.5 text-[10px] font-bold leading-3 sm:mt-4 sm:text-base">Warranty & AMC</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

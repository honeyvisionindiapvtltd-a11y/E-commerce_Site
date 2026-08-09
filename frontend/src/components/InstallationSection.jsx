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
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-yellow-500 uppercase font-semibold tracking-widest">
              Installation & AMC
            </p>
            <h2 className="text-5xl font-bold mt-4 text-[#0A1931]">
              Professional Installation Services
            </h2>
            <p className="text-gray-600 leading-8 mt-6">
              From CCTV cameras and drones to networking, servers and complete IT infrastructure,
              our certified engineers provide end-to-end installation and maintenance services.
            </p>
            <div className="space-y-5 mt-10">
              <div className="flex items-center gap-4">
                <CheckCircle className="text-green-500" />
                Certified Engineers
              </div>
              <div className="flex items-center gap-4">
                <CheckCircle className="text-green-500" />
                Pan India Installation
              </div>
              <div className="flex items-center gap-4">
                <CheckCircle className="text-green-500" />
                AMC & Warranty Support
              </div>
              <div className="flex items-center gap-4">
                <CheckCircle className="text-green-500" />
                Same Day Site Visit*
              </div>
              <div className="flex items-center gap-4">
                <CheckCircle className="text-green-500" />
                Remote Technical Assistance
              </div>
            </div>
            <div className="flex flex-wrap gap-5 mt-10">
              <Link
                to="/installation"
                className="inline-flex items-center justify-center rounded-xl bg-[#0A1931] px-8 py-4 text-white hover:bg-[#112C55]"
              >
                Book Installation
              </Link>
              <Link
                to="/amc"
                className="inline-flex items-center justify-center rounded-xl bg-[#0A1931] px-8 py-4 text-white hover:bg-[#112C55]"
              >
                View AMC Plans
              </Link>
            </div>
          </div>

          <div>
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-3xl p-7 hover:shadow-xl transition"
                >
                  <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-600">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-xl mt-6">{item.title}</h3>
                  <p className="text-gray-500 mt-4 leading-7">{item.desc}</p>
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-2 mt-6 font-semibold text-[#0A1931]"
                  >
                    Learn More
                    <ArrowRight size={18} />
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-16 rounded-3xl bg-gradient-to-r from-[#06142B] to-[#0A1931] text-white p-10">
              <div className="grid lg:grid-cols-4 gap-8 text-center">
                <div>
                  <MapPin className="mx-auto text-yellow-400" />
                  <h3 className="font-bold mt-4">500+ Cities Covered</h3>
                </div>
                <div>
                  <Clock3 className="mx-auto text-yellow-400" />
                  <h3 className="font-bold mt-4">24×7 Technical Support</h3>
                </div>
                <div>
                  <Users className="mx-auto text-yellow-400" />
                  <h3 className="font-bold mt-4">Certified Engineers</h3>
                </div>
                <div>
                  <ShieldCheck className="mx-auto text-yellow-400" />
                  <h3 className="font-bold mt-4">Warranty & AMC</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

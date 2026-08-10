import { useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Check, ShieldCheck, Wrench, Phone } from "lucide-react";
import { getServiceBySlug } from "../lib/serviceData";

const ServiceDetail = () => {
  const { serviceSlug } = useParams();
  const navigate = useNavigate();
  const service = useMemo(() => getServiceBySlug(serviceSlug), [serviceSlug]);

  if (!service) {
    return (
      <div className="min-h-screen bg-white px-6 py-20 text-[#071426]">
        <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#fbb900]">Service not found</p>
          <h1 className="mt-6 text-3xl font-extrabold">Oops, that service does not exist.</h1>
          <p className="mt-4 text-sm leading-6 text-gray-600">Please choose from our main service page or contact our team for help.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center rounded-lg border border-[#071426] px-5 py-3 text-sm font-semibold text-[#071426] transition hover:bg-[#071426] hover:text-white"
            >
              Go Back
            </button>
            <Link
              to="/services"
              className="inline-flex items-center justify-center rounded-lg bg-[#fbb900] px-5 py-3 text-sm font-semibold text-[#071426] transition hover:bg-[#e2a500]"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const Icon = service.icon;

  return (
    <div className="min-h-screen bg-white px-6 py-20 text-[#071426]">
      <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#fbb900]/15 text-[#fbb900] shadow-sm">
              <Icon size={32} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#fbb900]">Service Detail</p>
              <h1 className="mt-4 text-4xl font-extrabold text-[#071426]">{service.title}</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600">{service.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {service.details.map((detail) => (
                <div key={detail} className="rounded-3xl border border-gray-200 bg-[#f8fafc] p-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#071426] text-white">
                    <Check size={16} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#071426]">{detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={service.cta.to}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#071426] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1c2a39]"
              >
                {service.cta.label}
                <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-[#071426] transition hover:bg-gray-100"
              >
                Back to Services
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-6 rounded-3xl border border-gray-200 bg-[#f8fafc] p-8 shadow-sm">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#fbb900]">Book a Consultation</p>
            <h2 className="mt-4 text-2xl font-bold text-[#071426]">Talk to our experts</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Our team can help you choose the right solution, schedule installation, or design a custom service package.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                <ShieldCheck size={20} className="text-[#fbb900]" />
                <div>
                  <p className="text-sm font-semibold text-[#071426]">Certified Engineers</p>
                  <p className="text-xs text-gray-500">Fast, trusted installations.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                <Wrench size={20} className="text-[#071426]" />
                <div>
                  <p className="text-sm font-semibold text-[#071426]">Professional Installers</p>
                  <p className="text-xs text-gray-500">Safe and precise setup.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                <Phone size={20} className="text-[#071426]" />
                <div>
                  <p className="text-sm font-semibold text-[#071426]">Call Support</p>
                  <p className="text-xs text-gray-500">+91 98765 43210</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#fbb900]">Why work with us</p>
            <ul className="mt-5 space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-[#071426]" />
                Reliable end-to-end support.
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-[#071426]" />
                Transparent pricing across services.
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-[#071426]" />
                Dedicated support for every customer.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ServiceDetail;

import React from "react";
import {
  Monitor,
  Wrench,
  ShieldCheck,
  Cloud,
  Headphones,
  Network,
  Volume2,
  Printer,
  Code2,
  UserRound,
  Settings,
  ClipboardList,
  Palette,
  PackageCheck,
  FileCheck2,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock3,
  CheckCircle2,
  Users,
  Award,
  Rocket,
  Star,
  Building2,
  Store,
  Factory,
  GraduationCap,
  HeartPulse,
  Hotel,
  Warehouse,
  Landmark,
  ArrowRight,
} from "lucide-react";

import serviceBanner from "../assets/service-banner.jpeg";


const Services = () => {

  /* =========================================================
     CORE SERVICES
  ========================================================= */

  const services = [
    {
      icon: Monitor,
      title: "IT Products Supply",
      description:
        "Wide range of IT products including computers, laptops, printers, servers, networking & more.",
    },
    {
      icon: Wrench,
      title: "Installation & Deployment",
      description:
        "Professional installation of hardware, software, networks & complete IT infrastructure.",
    },
    {
      icon: ShieldCheck,
      title: "Security Solutions",
      description:
        "CCTV, Access Control, Biometric, Video Door Phone, Fire Alarm & Intrusion Detection Systems.",
    },
    {
      icon: Network,
      title: "Networking Solutions",
      description:
        "LAN/WAN setup, Wi-Fi solutions, structured cabling, rack setup, VPN & network configuration.",
    },
    {
      icon: Headphones,
      title: "AMC & Maintenance",
      description:
        "Annual Maintenance Contracts for all IT products and systems with priority support.",
    },
    {
      icon: Cloud,
      title: "Cloud Solutions",
      description:
        "Cloud storage, backup, remote access, virtualization & cloud migration services.",
    },
    {
      icon: Volume2,
      title: "Audio Visual Solutions",
      description:
        "Display systems, projectors, LED screens, public address systems, conferencing & more.",
    },
    {
      icon: Printer,
      title: "Printer & Peripherals",
      description:
        "Printers, scanners, copiers, consumables & all types of IT peripherals and accessories.",
    },
    {
      icon: Code2,
      title: "Software Solutions",
      description:
        "Licensed software, antivirus, business applications, custom software & ERP solutions.",
    },
    {
      icon: UserRound,
      title: "Support & Consultation",
      description:
        "IT consulting, troubleshooting, system optimization & dedicated 24/7 technical support.",
    },
  ];


  /* =========================================================
     WHY CHOOSE US
  ========================================================= */

  const advantages = [
    {
      icon: Users,
      value: "100+",
      label: "IT Experts",
    },
    {
      icon: Award,
      value: "10+ Years",
      label: "Experience",
    },
    {
      icon: PackageCheck,
      value: "Genuine",
      label: "Products",
    },
    {
      icon: Rocket,
      value: "Quick",
      label: "Installation",
    },
    {
      icon: Clock3,
      value: "On-time",
      label: "Support",
    },
    {
      icon: Star,
      value: "100%",
      label: "Customer Satisfaction",
    },
  ];


  /* =========================================================
     SERVICE PROCESS
  ========================================================= */

  const process = [
    {
      number: "01",
      icon: ClipboardList,
      title: "Requirement Analysis",
      description:
        "We understand your needs and suggest the best IT solutions.",
    },
    {
      number: "02",
      icon: Palette,
      title: "Planning & Design",
      description:
        "Customized solution planning and system design.",
    },
    {
      number: "03",
      icon: Settings,
      title: "Installation & Setup",
      description:
        "Professional installation by certified engineers with quality assurance.",
    },
    {
      number: "04",
      icon: FileCheck2,
      title: "Testing & Handover",
      description:
        "Complete testing and documentation before final handover.",
    },
    {
      number: "05",
      icon: Headphones,
      title: "Support & Maintenance",
      description:
        "Ongoing support and AMC services for smooth performance.",
    },
  ];


  /* =========================================================
     SERVICE CENTERS
  ========================================================= */

  const serviceCenters = [
    {
      city: "Bhubaneswar",
      type: "Head Office",
      address:
        "Plot No. 123, Patia, Bhubaneswar, Odisha - 751024",
      phone: "+91 98765 43210",
    },
    {
      city: "Cuttack",
      type: "Service Center",
      address:
        "2nd Floor, Link Road, Cuttack, Odisha - 753002",
      phone: "+91 98765 43211",
    },
    {
      city: "Rourkela",
      type: "Service Center",
      address:
        "1st Floor, Civil Township, Rourkela, Odisha - 769004",
      phone: "+91 98765 43212",
    },
    {
      city: "Berhampur",
      type: "Service Center",
      address:
        "Door No. 45, Sanjib Nagar, Berhampur, Odisha - 760010",
      phone: "+91 98765 43213",
    },
  ];


  /* =========================================================
     INDUSTRIES
  ========================================================= */

  const industries = [
    {
      icon: Building2,
      title: "Corporate Offices",
    },
    {
      icon: Store,
      title: "Retail Stores",
    },
    {
      icon: Factory,
      title: "Industries",
    },
    {
      icon: GraduationCap,
      title: "Educational Institutions",
    },
    {
      icon: HeartPulse,
      title: "Healthcare",
    },
    {
      icon: Hotel,
      title: "Hotels & Hospitality",
    },
    {
      icon: Warehouse,
      title: "Warehouses & Logistics",
    },
    {
      icon: Landmark,
      title: "Government & Public Sector",
    },
  ];


  return (
    <div className="min-h-screen bg-white text-[#071426]">


      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#061426]">

        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#061426] via-[#061426]/95 to-[#061426]/30" />
        </div>


        <div className="relative mx-auto grid min-h-[610px] max-w-[1500px] grid-cols-1 lg:grid-cols-2">


          {/* LEFT CONTENT */}

          <div className="relative z-10 flex flex-col justify-center px-6 py-24 lg:px-12 xl:px-16">

            {/* Breadcrumb */}

            <div className="mb-8 flex items-center gap-2 text-sm text-gray-300">

              <span>Home</span>

              <span>›</span>

              <span className="text-white">
                Services
              </span>

            </div>


            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#fbb900]">
              Our Services
            </p>


            <h1 className="max-w-[700px] text-5xl font-extrabold leading-[1.05] text-white md:text-6xl">

              Complete IT Solutions

              <br />

              <span className="text-[#fbb900]">
                Products, Installation
              </span>

              <br />

              <span className="text-[#fbb900]">
                & Service
              </span>

            </h1>


            <p className="mt-6 max-w-[650px] text-base leading-7 text-gray-300 md:text-lg">

              We provide end-to-end IT solutions including products,
              professional installation, reliable maintenance and
              expert support to keep your home and business running smoothly.

            </p>


            {/* HERO FEATURES */}

            <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-4">

              <HeroFeature
                icon={Monitor}
                title="All IT Products"
                subtitle="Under One Roof"
              />

              <HeroFeature
                icon={Wrench}
                title="Expert Installation"
                subtitle="& Integration"
              />

              <HeroFeature
                icon={ShieldCheck}
                title="AMC & After-Sales"
                subtitle="Support"
              />

              <HeroFeature
                icon={Headphones}
                title="Quick Response"
                subtitle="24/7 Support"
              />

            </div>


            {/* BUTTON */}

            <div className="mt-9">

              <button
                onClick={() =>
                  document
                    .getElementById("services")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
                className="inline-flex items-center gap-3 rounded-lg bg-[#fbb900] px-7 py-3.5 font-bold text-[#071426] transition hover:bg-white"
              >

                Explore Our Services

                <ArrowRight size={19} />

              </button>

            </div>

          </div>


          {/* RIGHT IMAGE */}

          <div className="relative min-h-[500px] lg:min-h-full">

            <img
              src={serviceBanner}
              alt="HoneyVision IT products and services"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#061426] via-[#061426]/40 to-transparent" />

          </div>

        </div>


        {/* YELLOW BOTTOM SHAPE */}

        <div className="absolute bottom-0 left-0 h-2 w-full bg-[#fbb900]" />

      </section>



      {/* =====================================================
          SERVICES
      ===================================================== */}

      <section
        id="services"
        className="mx-auto max-w-[1450px] px-6 py-20 lg:px-10"
      >

        <div className="text-center">

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f5ae00]">
            What We Offer
          </p>

          <h2 className="mt-2 text-4xl font-extrabold text-[#071426]">
            Our IT Services
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-gray-500">
            Complete technology solutions for homes, offices,
            businesses, institutions and industries.
          </p>

        </div>


        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">

          {services.map((service) => {

            const Icon = service.icon;

            return (

              <ServiceCard
                key={service.title}
                icon={Icon}
                title={service.title}
                description={service.description}
              />

            );

          })}

        </div>

      </section>



      {/* =====================================================
          WHY CHOOSE US
      ===================================================== */}

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10">

        <div className="overflow-hidden rounded-2xl bg-[#061426]">

          <div className="grid items-center lg:grid-cols-[1.4fr_3fr]">


            {/* TITLE */}

            <div className="p-8 lg:p-10">

              <p className="text-xs font-bold uppercase tracking-widest text-[#fbb900]">
                Why Choose Us?
              </p>

              <h2 className="mt-2 text-3xl font-extrabold leading-tight text-white">
                Trusted Service.
                <br />
                Proven Excellence.
                <br />
                Complete Peace of Mind.
              </h2>

            </div>


            {/* STATS */}

            <div className="grid grid-cols-2 border-t border-white/10 sm:grid-cols-3 lg:grid-cols-6 lg:border-l lg:border-t-0">

              {advantages.map((item) => {

                const Icon = item.icon;

                return (

                  <div
                    key={item.label}
                    className="flex min-h-[130px] flex-col items-center justify-center border-white/10 p-5 text-center lg:border-r"
                  >

                    <Icon
                      size={30}
                      strokeWidth={1.5}
                      className="text-white"
                    />

                    <p className="mt-3 text-sm font-bold text-white">
                      {item.value}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {item.label}
                    </p>

                  </div>

                );

              })}

            </div>

          </div>

        </div>

      </section>



      {/* =====================================================
          PROCESS
      ===================================================== */}

      <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">

        <div className="text-center">

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f5ae00]">
            Our Service Process
          </p>

          <h2 className="mt-2 text-4xl font-extrabold">
            How We Work
          </h2>

        </div>


        <div className="relative mt-14 grid gap-10 md:grid-cols-5">

          {/* Connecting Line */}

          <div className="absolute left-[10%] right-[10%] top-7 hidden border-t border-dashed border-gray-300 md:block" />


          {process.map((item) => {

            const Icon = item.icon;

            return (

              <div
                key={item.number}
                className="relative text-center"
              >

                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#071426] text-sm font-bold text-white shadow-md">

                  {item.number}

                </div>


                <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm">

                  <Icon
                    size={29}
                    strokeWidth={1.5}
                    className="text-[#071426]"
                  />

                </div>


                <h3 className="mt-4 text-sm font-bold">
                  {item.title}
                </h3>

                <p className="mx-auto mt-2 max-w-[210px] text-xs leading-5 text-gray-500">
                  {item.description}
                </p>

              </div>

            );

          })}

        </div>

      </section>



      {/* =====================================================
          SERVICE CENTERS
      ===================================================== */}

      <section className="mx-auto max-w-[1400px] px-6 pb-20 lg:px-10">

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-10">


          <div className="text-center">

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f5ae00]">
              Our Service Centers
            </p>

            <h2 className="mt-2 text-4xl font-extrabold">
              We Are Closer to You
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              Our service network helps us provide faster installation,
              maintenance and after-sales support across locations.
            </p>

          </div>


          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1.5fr_0.8fr]">


            {/* LOCATION LIST */}

            <div className="space-y-3">

              {serviceCenters.map((center) => (

                <div
                  key={center.city}
                  className="rounded-xl border border-gray-200 p-4 transition hover:border-[#fbb900] hover:shadow-sm"
                >

                  <div className="flex gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbb900]/10">

                      <MapPin
                        size={20}
                        className="text-[#e4a600]"
                      />

                    </div>


                    <div>

                      <h3 className="font-bold">
                        {center.city}{" "}
                        <span className="font-normal text-gray-500">
                          ({center.type})
                        </span>
                      </h3>

                      <p className="mt-1 text-sm leading-5 text-gray-500">
                        {center.address}
                      </p>

                      <p className="mt-2 text-xs font-semibold text-[#071426]">
                        {center.phone}
                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>


            {/* MAP AREA */}

            <div className="relative min-h-[420px] overflow-hidden rounded-xl bg-[#eef4f8]">

              {/* Decorative map */}

              <div className="absolute inset-0 opacity-30">

                <div className="absolute left-[10%] top-[20%] h-[1px] w-[80%] rotate-12 bg-[#78909c]" />

                <div className="absolute left-[15%] top-[50%] h-[1px] w-[75%] -rotate-12 bg-[#78909c]" />

                <div className="absolute left-[35%] top-[5%] h-[90%] w-[1px] rotate-[15deg] bg-[#78909c]" />

                <div className="absolute left-[65%] top-[5%] h-[90%] w-[1px] -rotate-[20deg] bg-[#78909c]" />

                <div className="absolute left-[20%] top-[35%] h-[180px] w-[180px] rounded-full border border-[#78909c]" />

                <div className="absolute bottom-[10%] right-[10%] h-[200px] w-[200px] rounded-full border border-[#78909c]" />

              </div>


              {/* Location Pins */}

              <MapPinMarker
                city="Rourkela"
                position="top-[20%] left-[30%]"
              />

              <MapPinMarker
                city="Cuttack"
                position="top-[35%] right-[25%]"
              />

              <MapPinMarker
                city="Bhubaneswar"
                position="top-[48%] right-[40%]"
                active
              />

              <MapPinMarker
                city="Berhampur"
                position="bottom-[20%] left-[45%]"
              />


              <div className="absolute bottom-5 left-5 rounded-lg bg-white/95 p-4 shadow-lg">

                <p className="text-xs font-semibold text-gray-500">
                  Service Coverage
                </p>

                <p className="mt-1 text-sm font-bold text-[#071426]">
                  Odisha & Nearby Regions
                </p>

              </div>

            </div>


            {/* CONTACT CARD */}

            <div className="flex flex-col justify-between rounded-xl bg-[#edf5fa] p-6">

              <div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#071426]">

                  <Headphones
                    size={25}
                    className="text-[#fbb900]"
                  />

                </div>


                <h3 className="mt-5 text-xl font-bold">
                  Need Service?
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Our service team is available across Odisha
                  to provide quick on-site support and solutions.
                </p>

              </div>


              <div className="mt-8">

                <p className="text-xs font-semibold text-gray-500">
                  Call us
                </p>

                <p className="mt-1 text-xl font-extrabold text-[#071426]">
                  +91 98765 43210
                </p>


                <button
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#071426] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#fbb900] hover:text-[#071426]"
                >

                  Request Service

                  <ArrowRight size={17} />

                </button>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* =====================================================
          INDUSTRIES
      ===================================================== */}

      <section className="mx-auto max-w-[1400px] px-6 pb-20 lg:px-10">

        <div className="text-center">

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f5ae00]">
            Industries We Serve
          </p>

          <h2 className="mt-2 text-4xl font-extrabold">
            Technology for Every Industry
          </h2>

        </div>


        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">

          {industries.map((industry) => {

            const Icon = industry.icon;

            return (

              <div
                key={industry.title}
                className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-5 text-center transition hover:-translate-y-1 hover:border-[#fbb900] hover:shadow-md"
              >

                <Icon
                  size={31}
                  strokeWidth={1.5}
                  className="text-[#071426]"
                />

                <p className="mt-3 text-xs font-semibold leading-5">
                  {industry.title}
                </p>

              </div>

            );

          })}

        </div>

      </section>



      {/* =====================================================
          CONTACT CTA
      ===================================================== */}

      <section className="mx-auto max-w-[1400px] px-6 pb-10 lg:px-10">

        <div className="overflow-hidden rounded-2xl bg-[#061426] p-7 lg:p-9">

          <div className="grid gap-8 lg:grid-cols-[1fr_2.5fr] lg:items-center">


            {/* LEFT */}

            <div>

              <p className="text-xs font-bold uppercase tracking-widest text-[#fbb900]">
                Need Any IT Solution?
              </p>

              <h2 className="mt-2 text-3xl font-extrabold text-white">
                We're Here to Help!
              </h2>

              <p className="mt-3 max-w-[380px] text-sm leading-6 text-gray-400">
                Contact us today for IT products, professional
                installation and reliable support.
              </p>


              <button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#fbb900] px-5 py-3 text-sm font-bold text-[#071426]">

                Get in Touch

                <ArrowRight size={17} />

              </button>

            </div>


            {/* CONTACT OPTIONS */}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <ContactBox
                icon={Phone}
                title="Call Us"
                value="+91 98765 43210"
              />

              <ContactBox
                icon={MessageCircle}
                title="WhatsApp"
                value="+91 98765 43210"
                green
              />

              <ContactBox
                icon={Mail}
                title="Email Us"
                value="support@honeyvision.in"
              />

              <ContactBox
                icon={MapPin}
                title="Our Location"
                value="Bhubaneswar, Odisha"
              />

            </div>

          </div>

        </div>

      </section>

    </div>
  );
};



/* =========================================================
   HERO FEATURE
========================================================= */

const HeroFeature = ({
  icon: Icon,
  title,
  subtitle,
}) => {

  return (

    <div className="flex items-center gap-2">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">

        <Icon
          size={19}
          className="text-[#fbb900]"
        />

      </div>

      <div>

        <p className="text-xs font-bold text-white">
          {title}
        </p>

        <p className="text-[11px] text-gray-400">
          {subtitle}
        </p>

      </div>

    </div>

  );
};



/* =========================================================
   SERVICE CARD
========================================================= */

const ServiceCard = ({
  icon: Icon,
  title,
  description,
}) => {

  return (

    <div className="group flex min-h-[265px] flex-col rounded-xl border border-gray-200 bg-white p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-[#fbb900] hover:shadow-lg">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef5fa] transition group-hover:bg-[#fff4d0]">

        <Icon
          size={29}
          strokeWidth={1.6}
          className="text-[#071426]"
        />

      </div>


      <h3 className="mt-5 text-base font-bold">
        {title}
      </h3>


      <p className="mt-3 flex-1 text-xs leading-5 text-gray-500">
        {description}
      </p>


      <button className="mt-5 inline-flex items-center justify-center gap-2 text-xs font-bold text-[#1457a6]">

        Learn More

        <ArrowRight
          size={15}
          className="transition group-hover:translate-x-1"
        />

      </button>

    </div>

  );
};



/* =========================================================
   MAP MARKER
========================================================= */

const MapPinMarker = ({
  city,
  position,
  active = false,
}) => {

  return (

    <div
      className={`absolute ${position} flex flex-col items-center`}
    >

      <div
        className={`rounded-full p-1.5 shadow-md ${
          active
            ? "bg-[#fbb900]"
            : "bg-[#071426]"
        }`}
      >

        <MapPin
          size={18}
          className={
            active
              ? "text-[#071426]"
              : "text-white"
          }
        />

      </div>


      <span
        className={`mt-1 rounded-full px-3 py-1 text-[10px] font-bold shadow-sm ${
          active
            ? "bg-[#071426] text-white"
            : "bg-white text-[#071426]"
        }`}
      >
        {city}
      </span>

    </div>

  );
};



/* =========================================================
   CONTACT BOX
========================================================= */

const ContactBox = ({
  icon: Icon,
  title,
  value,
  green = false,
}) => {

  return (

    <div className="rounded-xl border border-white/15 bg-white/5 p-4">

      <Icon
        size={25}
        className={
          green
            ? "text-green-400"
            : "text-[#fbb900]"
        }
      />


      <p className="mt-3 text-xs text-gray-400">
        {title}
      </p>


      <p className="mt-1 text-xs font-bold text-white">
        {value}
      </p>

    </div>

  );
};


export default Services;
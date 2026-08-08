import React, { useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Search,
  ShoppingCart,
  User,
  CalendarDays,
  UserRoundCheck,
  Headphones,
  ShieldCheck,
  Award,
  Clock3,
  BadgeCheck,
  Sparkles,
  Wrench,
  Video,
  Bell,
  LockKeyhole,
  Cable,
  Drill,
  Wifi,
  MonitorPlay,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Star,
  Check,
  ArrowRight,
} from "lucide-react";


// ============================================================
// SERVICES
// ============================================================

const services = [
  {
    id: "cctv",
    title: "CCTV Installation",
    description: "Professional CCTV camera installation",
    price: 1499,
    icon: Video,
  },
  {
    id: "ai",
    title: "AI Surveillance Setup",
    description: "AI-powered surveillance system installation",
    price: 2499,
    icon: Sparkles,
  },
  {
    id: "access",
    title: "Access Control Setup",
    description: "Biometric & access control installation",
    price: 1999,
    icon: LockKeyhole,
  },
  {
    id: "doorphone",
    title: "Video Door Phone",
    description: "Video door phone installation",
    price: 1299,
    icon: MonitorPlay,
  },
  {
    id: "alarm",
    title: "Alarm System Setup",
    description: "Home/Office alarm system installation",
    price: 999,
    icon: Bell,
  },
  {
    id: "security",
    title: "Full Security Setup",
    description: "Complete security solution installation",
    price: 4999,
    icon: ShieldCheck,
  },
];


// ============================================================
// ADDITIONAL SERVICES
// ============================================================

const additionalServices = [
  {
    id: "cable",
    title: "Cable Concealment",
    price: 499,
    icon: Cable,
  },
  {
    id: "drilling",
    title: "Wall Drilling",
    price: 349,
    icon: Drill,
  },
  {
    id: "wifi",
    title: "Wi-Fi Configuration",
    price: 299,
    icon: Wifi,
  },
  {
    id: "demo",
    title: "System Demo",
    price: 199,
    icon: MonitorPlay,
  },
];


// ============================================================
// MAIN COMPONENT
// ============================================================

function BookInstallation() {
  const [selectedService, setSelectedService] = useState("cctv");

  const [selectedAdditional, setSelectedAdditional] = useState([]);

  const productPrice = 11996;

  const quantity = 4;


  // ----------------------------------------------------------
  // SELECTED SERVICE
  // ----------------------------------------------------------

  const currentService = services.find(
    (service) => service.id === selectedService
  );


  // ----------------------------------------------------------
  // ADDITIONAL SERVICES TOTAL
  // ----------------------------------------------------------

  const additionalTotal = useMemo(() => {
    return selectedAdditional.reduce((total, id) => {
      const service = additionalServices.find(
        (item) => item.id === id
      );

      return total + (service?.price || 0);
    }, 0);
  }, [selectedAdditional]);


  // ----------------------------------------------------------
  // PRICE CALCULATIONS
  // ----------------------------------------------------------

  const installationPrice = currentService?.price || 0;

  const subtotal =
    productPrice +
    installationPrice +
    additionalTotal;

  const gst = Math.round(subtotal * 0.18);

  const total = subtotal + gst;


  // ----------------------------------------------------------
  // TOGGLE ADDITIONAL SERVICE
  // ----------------------------------------------------------

  const toggleAdditional = (id) => {
    setSelectedAdditional((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  };


  // ----------------------------------------------------------
  // FORMAT PRICE
  // ----------------------------------------------------------

  const formatPrice = (price) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };


  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#101828]">


      {/* ======================================================
          HERO SECTION
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#03111f] text-white">

        {/* Background */}
        <div className="absolute inset-0">

          <img
            src="/images/installation-background.jpg"
            alt=""
            className="h-full w-full object-cover"
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#03111f] via-[#03111f]/95 to-[#03111f]/20" />

          <div className="absolute inset-0 bg-gradient-to-t from-[#03111f]/50 via-transparent to-transparent" />

        </div>


        {/* HERO CONTENT */}

        <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">

          {/* Breadcrumb */}

          <div className="flex items-center gap-2 pt-7 text-xs text-gray-300">

            <span>Home</span>

            <ChevronRight size={13} />

            <span>Services</span>

            <ChevronRight size={13} />

            <span className="font-medium text-white">
              Book Installation
            </span>

          </div>


          {/* Hero grid */}

          <div className="relative grid min-h-[420px] grid-cols-1 items-center lg:grid-cols-[48%_52%]">


            {/* ==================================================
                LEFT CONTENT
            ================================================== */}

            <div className="relative z-20 max-w-[620px] py-14 lg:py-16">

              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[48px]">

                Book Your

                <span className="block text-[#ffbd00]">
                  Installation
                </span>

              </h1>


              <p className="mt-5 max-w-[560px] text-sm leading-6 text-gray-200 sm:text-base sm:leading-7">

                Professional installation by HoneyVision certified
                engineers. Quick, reliable and hassle-free service
                at your convenience.

              </p>


              {/* Hero features */}

              <div className="mt-7 flex flex-wrap gap-x-7 gap-y-4">

                <HeroFeature
                  icon={ShieldCheck}
                  text="Certified Engineers"
                />

                <HeroFeature
                  icon={Award}
                  text="Quick & Reliable"
                />

                <HeroFeature
                  icon={ShieldCheck}
                  text="1 Year Workmanship Warranty"
                />

              </div>

            </div>


            {/* ==================================================
                TRANSPARENT TECHNICIAN IMAGE
            ================================================== */}

            <div className="pointer-events-none absolute bottom-0 right-[260px] z-10 hidden h-[430px] w-[650px] lg:block">

              <img
                src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1786180008/installationbg_kfei2n.png"
                alt="HoneyVision installation technician"
                className="absolute bottom-0 right-0 h-[470px] w-auto max-w-none object-contain object-bottom"
              />

            </div>


            {/* ==================================================
                RIGHT INFORMATION CARD
            ================================================== */}

            <div className="relative z-30 flex justify-end pb-10 lg:pb-0">

              <div className="w-full max-w-[300px] rounded-2xl border border-white/10 bg-[#152435]/95 p-5 shadow-2xl backdrop-blur-md">

                <HeroCardItem
                  icon={CalendarDays}
                  title="Quick Booking"
                  description="Schedule at your convenience"
                />

                <HeroCardItem
                  icon={UserRoundCheck}
                  title="Expert Installation"
                  description="Trained & experienced professionals"
                />

                <HeroCardItem
                  icon={Headphones}
                  title="Complete Support"
                  description="End-to-end support before & after installation"
                  last
                />

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="relative mx-auto -mt-8 max-w-[1440px] px-5 sm:px-8 lg:px-10">


        {/* ====================================================
            BOOKING STEPS
        ==================================================== */}

        <section className="relative z-40 rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm sm:px-10">

          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">

            <Step
              number="1"
              title="Select Service"
              active
            />

            <StepLine />

            <Step
              number="2"
              title="Enter Details"
            />

            <StepLine />

            <Step
              number="3"
              title="Schedule Appointment"
            />

            <StepLine />

            <Step
              number="4"
              title="Confirmation"
            />

          </div>

        </section>



        {/* ====================================================
            BOOKING AREA
        ==================================================== */}

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_310px]">


          {/* ==================================================
              SERVICE SELECTION
          ================================================== */}

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

            <h2 className="text-lg font-bold">
              1. Select Service
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Choose the installation service you need
            </p>


            {/* SERVICE CARDS */}

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

              {services.map((service) => {

                const Icon = service.icon;

                const isSelected =
                  selectedService === service.id;


                return (
                  <button
                    key={service.id}
                    onClick={() =>
                      setSelectedService(service.id)
                    }
                    className={`relative rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-[#f5bd22] bg-[#fffdf6] shadow-[0_0_0_1px_rgba(245,189,34,0.15)]"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >

                    {/* Radio */}

                    <span
                      className={`absolute right-4 top-4 flex h-4 w-4 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-[#f5bd22]"
                          : "border-gray-400"
                      }`}
                    >

                      {isSelected && (
                        <span className="h-2.5 w-2.5 rounded-full bg-[#f5bd22]" />
                      )}

                    </span>


                    <Icon
                      size={27}
                      strokeWidth={1.7}
                      className="mb-5 text-[#101820]"
                    />


                    <h3 className="text-sm font-bold">
                      {service.title}
                    </h3>


                    <p className="mt-2 min-h-[40px] text-xs leading-5 text-gray-600">
                      {service.description}
                    </p>


                    <div className="mt-3 text-sm font-bold">
                      {formatPrice(service.price)}
                    </div>

                  </button>
                );

              })}

            </div>



            {/* =================================================
                ADDITIONAL SERVICES
            ================================================= */}

            <div className="mt-5">

              <h3 className="text-sm font-bold">

                Additional Services

                <span className="font-normal text-gray-500">
                  {" "}
                  (Optional)
                </span>

              </h3>


              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                {additionalServices.map((service) => {

                  const checked =
                    selectedAdditional.includes(service.id);


                  return (
                    <button
                      key={service.id}
                      onClick={() =>
                        toggleAdditional(service.id)
                      }
                      className={`flex items-start gap-2 rounded-lg border p-3 text-left transition ${
                        checked
                          ? "border-[#f5bd22] bg-[#fffdf6]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >

                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? "border-[#f5bd22] bg-[#f5bd22] text-white"
                            : "border-gray-400"
                        }`}
                      >

                        {checked && (
                          <Check size={11} />
                        )}

                      </span>


                      <div>

                        <span className="text-xs font-medium">
                          {service.title}
                        </span>

                        <div className="mt-2 text-[11px] font-semibold">
                          {formatPrice(service.price)}
                        </div>

                      </div>

                    </button>
                  );

                })}

              </div>

            </div>



            {/* CONTINUE */}

            <div className="mt-5 flex justify-end">

              <button
                className="flex items-center gap-5 rounded-lg bg-[#03111f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#10273d]"
              >

                Continue

                <ArrowRight size={17} />

              </button>

            </div>

          </section>



          {/* ==================================================
              ORDER SUMMARY
          ================================================== */}

          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

            <h2 className="text-lg font-bold">
              Order Summary
            </h2>


            {/* Product */}

            <div className="mt-5 flex gap-3 border-b border-gray-200 pb-4">

              <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">

                <img
                  src="/images/hikvision-bullet-camera.jpg"
                  alt="Hikvision 2MP Bullet Camera"
                  className="h-full w-full object-contain"
                />

              </div>


              <div className="flex min-w-0 flex-1 flex-col justify-between">

                <div className="text-sm font-bold leading-5">
                  Hikvision 2MP
                  <br />
                  Bullet Camera
                </div>


                <div className="flex items-end justify-between">

                  <span className="text-xs text-gray-500">
                    Qty: {quantity}
                  </span>

                  <span className="text-sm font-bold">
                    {formatPrice(productPrice)}
                  </span>

                </div>

              </div>

            </div>



            {/* PRICE */}

            <div className="space-y-4 py-4 text-sm">

              <PriceRow
                label="Installation Service"
                value={formatPrice(installationPrice)}
              />

              <PriceRow
                label="Additional Services"
                value={formatPrice(additionalTotal)}
              />


              <div className="border-t border-gray-200 pt-4">

                <PriceRow
                  label="Subtotal"
                  value={formatPrice(subtotal)}
                />

              </div>


              <PriceRow
                label="GST (18%)"
                value={formatPrice(gst)}
              />


              <div className="flex items-center justify-between border-t border-gray-200 pt-4">

                <span className="font-bold">
                  Total Amount
                </span>

                <span className="text-xl font-bold">
                  {formatPrice(total)}
                </span>

              </div>

            </div>



            {/* SECURITY BOX */}

            <div className="rounded-xl bg-[#eff9f3] p-4">

              <SecurityInfo
                icon={ShieldCheck}
                title="Secure Booking"
                description="Your data is protected and secure"
              />

              <SecurityInfo
                icon={UserRoundCheck}
                title="No Hidden Charges"
                description="Transparent pricing with no surprises"
              />

              <SecurityInfo
                icon={ShieldCheck}
                title="Workmanship Warranty"
                description="1 year warranty on installation service"
                last
              />

            </div>

          </aside>

        </div>



        {/* ====================================================
            WHY CHOOSE
        ==================================================== */}

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

          <h2 className="text-center text-xl font-bold">
            Why Choose HoneyVision Installation?
          </h2>


          <div className="mt-5 grid grid-cols-1 divide-y divide-gray-200 md:grid-cols-5 md:divide-x md:divide-y-0">

            <WhyItem
              icon={UserRoundCheck}
              title={
                <>
                  Certified & Trained
                  <br />
                  Engineers
                </>
              }
              description="Expert professionals with hands-on experience"
            />

            <WhyItem
              icon={Clock3}
              title="On-Time Installation"
              description="Punctual service at your scheduled time"
            />

            <WhyItem
              icon={BadgeCheck}
              title="Quality Assurance"
              description="100% quality check before completion"
            />

            <WhyItem
              icon={Wrench}
              title="Clean & Neat Work"
              description="Professional installation with neat finishing"
            />

            <WhyItem
              icon={UserRoundCheck}
              title="Post Installation Support"
              description="Dedicated support after installation"
            />

          </div>

        </section>



        {/* ====================================================
            HELP SECTION
        ==================================================== */}

        <section className="mt-5 rounded-2xl bg-[#03111f] p-5 text-white shadow-lg sm:p-7">

          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">


            <div className="max-w-[380px]">

              <p className="text-sm font-bold text-[#fdbb08]">
                Need Help?
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                We're Here to Assist You
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-300">
                Our support team is ready to help you with your
                installation requirements.
              </p>

            </div>


            <div className="grid gap-3 sm:grid-cols-3">

              <ContactButton
                icon={Phone}
                title="Call Us"
                value="+91 98765 43210"
              />

              <ContactButton
                icon={MessageCircle}
                title="WhatsApp"
                value="+91 98765 43210"
              />

              <ContactButton
                icon={Mail}
                title="Email Us"
                value="support@honeyvision.in"
              />

            </div>

          </div>

        </section>



        {/* ====================================================
            TRUST BAR
        ==================================================== */}

        <section className="mb-8 mt-5 rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-2 md:grid-cols-4 md:divide-x md:divide-y-0">

            <TrustItem
              icon={UserRoundCheck}
              text="Trusted by 10,000+ Customers"
            />

            <TrustItem
              icon={Star}
              text="4.8/5 Average Rating"
            />

            <TrustItem
              icon={MapPin}
              text="PAN India Service"
            />

            <TrustItem
              icon={ShieldCheck}
              text="100% Satisfaction Guaranteed"
            />

          </div>

        </section>

      </main>

    </div>
  );
}


// ============================================================
// HERO FEATURE
// ============================================================

function HeroFeature({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2">

      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">

        <Icon
          size={19}
          strokeWidth={1.7}
          className="text-[#fdbb08]"
        />

      </div>

      <span className="text-xs font-medium text-gray-100 sm:text-sm">
        {text}
      </span>

    </div>
  );
}


// ============================================================
// HERO CARD
// ============================================================

function HeroCardItem({
  icon: Icon,
  title,
  description,
  last = false,
}) {
  return (
    <div className={`flex gap-4 ${!last ? "mb-6" : ""}`}>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center">

        <Icon
          size={27}
          strokeWidth={1.6}
          className="text-[#fdbb08]"
        />

      </div>


      <div>

        <h3 className="text-sm font-bold">
          {title}
        </h3>

        <p className="mt-1 max-w-[220px] text-xs leading-5 text-gray-300">
          {description}
        </p>

      </div>

    </div>
  );
}


// ============================================================
// BOOKING STEP
// ============================================================

function Step({
  number,
  title,
  active = false,
}) {
  return (
    <div className="flex min-w-[130px] flex-col items-center text-center">

      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
          active
            ? "bg-[#fdbb08] text-white"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {number}
      </div>

      <span
        className={`mt-2 text-xs font-medium ${
          active
            ? "text-gray-900"
            : "text-gray-500"
        }`}
      >
        {title}
      </span>

    </div>
  );
}


// ============================================================
// STEP LINE
// ============================================================

function StepLine() {
  return (
    <div className="hidden h-px flex-1 border-t border-dashed border-gray-300 md:block" />
  );
}


// ============================================================
// PRICE ROW
// ============================================================

function PriceRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-gray-600">
        {label}
      </span>

      <span className="font-medium text-gray-900">
        {value}
      </span>

    </div>
  );
}


// ============================================================
// SECURITY INFO
// ============================================================

function SecurityInfo({
  icon: Icon,
  title,
  description,
  last = false,
}) {
  return (
    <div className={`flex gap-3 ${!last ? "mb-5" : ""}`}>

      <Icon
        size={22}
        strokeWidth={1.7}
        className="mt-0.5 shrink-0 text-[#17834b]"
      />

      <div>

        <h3 className="text-xs font-bold">
          {title}
        </h3>

        <p className="mt-1 text-[11px] leading-4 text-gray-600">
          {description}
        </p>

      </div>

    </div>
  );
}


// ============================================================
// WHY ITEM
// ============================================================

function WhyItem({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex flex-col items-center px-5 py-5 text-center">

      <Icon
        size={27}
        strokeWidth={1.6}
        className="text-[#d59e00]"
      />

      <h3 className="mt-3 text-xs font-bold leading-4">
        {title}
      </h3>

      <p className="mt-2 max-w-[180px] text-[11px] leading-4 text-gray-600">
        {description}
      </p>

    </div>
  );
}


// ============================================================
// CONTACT BUTTON
// ============================================================

function ContactButton({
  icon: Icon,
  title,
  value,
}) {
  return (
    <a
      href="#"
      className="flex min-w-[180px] items-center gap-3 rounded-xl border border-white/20 px-4 py-3 transition hover:border-[#fdbb08] hover:bg-white/5"
    >

      <Icon
        size={24}
        strokeWidth={1.7}
        className="text-[#fdbb08]"
      />

      <div className="text-left">

        <div className="text-xs font-bold">
          {title}
        </div>

        <div className="mt-1 text-[11px] text-gray-300">
          {value}
        </div>

      </div>

    </a>
  );
}


// ============================================================
// TRUST ITEM
// ============================================================

function TrustItem({
  icon: Icon,
  text,
}) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-4">

      <Icon
        size={20}
        strokeWidth={1.5}
        className="text-gray-500"
      />

      <span className="text-xs font-medium text-gray-600">
        {text}
      </span>

    </div>
  );
}


export default BookInstallation;
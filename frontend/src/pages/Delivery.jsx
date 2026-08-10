import React, { useState } from "react";
import DeliveryChecker from "../components/DeliveryChecker.jsx";
import {
  Truck,
  ShieldCheck,
  MapPin,
  ClipboardCheck,
  Package,
  Navigation,
  Home,
  Clock3,
  Headphones,
  ThumbsUp,
  Search,
  ArrowRight,
  Check,
  MapPinned,
  Box,
  CircleCheck,
} from "lucide-react";

const deliveryTruck = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786343326/delivery_in8izl.png"
const deliveryBox = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786343327/pakage_xfplmv.png"


const Delivery = () => {

  const [orderId, setOrderId] = useState("");
  const [trackingMessage, setTrackingMessage] = useState("");


  /* =========================================================
     DELIVERY PROCESS
  ========================================================= */

  const deliverySteps = [
    {
      number: "01",
      icon: ClipboardCheck,
      title: "Order Placed",
      description: "You place your order on our website.",
    },
    {
      number: "02",
      icon: Package,
      title: "Order Confirmed",
      description: "We confirm your order and prepare it.",
    },
    {
      number: "03",
      icon: Truck,
      title: "Order Shipped",
      description: "Your order is shipped from our warehouse.",
    },
    {
      number: "04",
      icon: MapPin,
      title: "Out for Delivery",
      description: "Your order is out for delivery to you.",
    },
    {
      number: "05",
      icon: Home,
      title: "Delivered",
      description: "Your order is delivered safely at your doorstep.",
    },
  ];


  /* =========================================================
     DELIVERY INFORMATION
  ========================================================= */

  const deliveryInformation = [
    {
      icon: MapPinned,
      title: "Delivery PAN India",
      description:
        "We deliver our products to every pin code across India.",
    },
    {
      icon: Clock3,
      title: "Delivery Time",
      description:
        "Standard delivery time is 2-5 business days depending on your location.",
    },
    {
      icon: Truck,
      title: "Shipping Partners",
      description:
        "We work with trusted courier partners to ensure safe delivery.",
    },
    {
      icon: Box,
      title: "Secure Packaging",
      description:
        "All products are carefully packed to ensure zero damage.",
    },
  ];


  /* =========================================================
     DELIVERY BENEFITS
  ========================================================= */

  const benefits = [
    {
      icon: Clock3,
      title: "On-Time Delivery",
      description:
        "We value your time and deliver on schedule.",
    },
    {
      icon: ShieldCheck,
      title: "Safe & Secure",
      description:
        "Your products are in safe hands.",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description:
        "Need help? Our support team is always here.",
    },
    {
      icon: ThumbsUp,
      title: "Happy Customers",
      description:
        "Thousands of customers trust us every day.",
    },
  ];


  /* =========================================================
     TRACK ORDER
  ========================================================= */

  const handleTrackOrder = () => {

    if (!orderId.trim()) {
      setTrackingMessage("Please enter your Order ID.");
      return;
    }

    setTrackingMessage(
      `Tracking information for Order ${orderId} will be displayed here.`
    );
  };


  return (

    <div className="min-h-screen bg-white text-[#071426]">


      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#031426]">

        {/* Background glow */}

        <div className="absolute inset-0">

          <div className="absolute left-[35%] top-[10%] h-[350px] w-[350px] rounded-full bg-blue-500/10 blur-3xl" />

          <div className="absolute right-[5%] top-[15%] h-[400px] w-[400px] rounded-full bg-blue-400/10 blur-3xl" />

        </div>


        {/* Decorative route */}

        <svg
          className="absolute right-[5%] top-[50px] hidden h-[260px] w-[650px] opacity-40 lg:block"
          viewBox="0 0 650 260"
          fill="none"
        >

          <path
            d="M30 180 C150 100 180 220 300 130 C400 50 470 180 620 50"
            stroke="#7286ad"
            strokeWidth="2"
            strokeDasharray="10 10"
          />

        </svg>


        <div className="relative mx-auto grid min-h-[520px] max-w-[1500px] grid-cols-1 lg:grid-cols-2">


          {/* =================================================
              HERO LEFT
          ================================================= */}

          <div className="relative z-10 flex flex-col justify-center px-6 py-24 lg:px-12 xl:px-16">

            <p className="mb-4 text-sm font-extrabold tracking-[0.15em] text-[#fbb900]">
              FAST • SAFE • RELIABLE
            </p>


            <h1 className="text-5xl font-extrabold leading-[1.05] text-white md:text-6xl">

              Delivery You

              <br />

              <span className="text-[#fbb900]">
                Can Trust
              </span>

            </h1>


            <p className="mt-6 max-w-[470px] text-base leading-7 text-gray-300 md:text-lg">

              We ensure your security products reach you
              safely, on time, every time.

            </p>


            {/* HERO FEATURES */}

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

              <HeroFeature
                icon={Truck}
                title="Fast Delivery"
                subtitle="On-time, every time"
              />

              <HeroFeature
                icon={ShieldCheck}
                title="Safe & Secure"
                subtitle="Careful handling"
              />

              <HeroFeature
                icon={MapPin}
                title="Live Tracking"
                subtitle="Track your order"
              />

            </div>

          </div>


          {/* =================================================
              HERO RIGHT IMAGE
          ================================================= */}

          <div className="relative min-h-[390px] lg:min-h-full">

            <img
              src={deliveryTruck}
              alt="HoneyVision delivery truck"
              className="absolute inset-0 h-full w-full object-contain object-center lg:object-right"
            />

          </div>

        </div>

      </section>



      {/* =====================================================
          DELIVERY PROCESS
      ===================================================== */}

      <section className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10 lg:py-10">


        {/* Heading */}

        <div className="text-center">

          <div className="flex items-center justify-center gap-3">

            <span className="h-[2px] w-8 bg-[#fbb900]" />

            <p className="text-xs font-bold uppercase tracking-widest text-[#071426]">
              Our Delivery Process
            </p>

            <span className="h-[2px] w-8 bg-[#fbb900]" />

          </div>


          <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">
            From Our Warehouse to Your Doorstep
          </h2>


          <p className="mt-2 text-sm text-gray-600 md:text-base">
            Simple, transparent and customer-first delivery experience.
          </p>

        </div>



        {/* Process cards */}

        <div className="mt-8 grid gap-4 md:grid-cols-5">

          {deliverySteps.map((step, index) => {

            const Icon = step.icon;

            return (

              <div
                key={step.number}
                className="relative rounded-xl border border-gray-200 bg-white px-5 py-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-[#fbb900] hover:shadow-md"
              >

                {/* Arrow */}

                {index !== deliverySteps.length - 1 && (
                  <div className="absolute -right-4 top-[50%] z-10 hidden -translate-y-1/2 md:block">

                    <ArrowRight
                      size={19}
                      className="text-[#071426]"
                    />

                  </div>
                )}


                {/* Number */}

                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#fbb900] text-sm font-extrabold text-[#071426]">

                  {step.number}

                </div>


                {/* Icon */}

                <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center">

                  <Icon
                    size={46}
                    strokeWidth={1.4}
                    className="text-[#071426]"
                  />

                </div>


                <h3 className="mt-3 text-sm font-bold md:text-base">
                  {step.title}
                </h3>


                <p className="mt-2 text-xs leading-5 text-gray-600">
                  {step.description}
                </p>

              </div>

            );

          })}

        </div>

      </section>



      {/* =====================================================
          DELIVERY INFORMATION + TRACKING
      ===================================================== */}

      <section className="mx-auto max-w-[1400px] px-6 pb-8 lg:px-10">


        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">


          {/* =================================================
              DELIVERY INFORMATION
          ================================================= */}

          <div className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">

            <h2 className="text-2xl font-extrabold">
              Delivery Information
            </h2>


            <div className="mt-6 space-y-5">

              {deliveryInformation.map((item) => {

                const Icon = item.icon;

                return (

                  <div
                    key={item.title}
                    className="flex gap-4"
                  >

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center">

                      <Icon
                        size={31}
                        strokeWidth={1.5}
                        className="text-[#071426]"
                      />

                    </div>


                    <div>

                      <h3 className="text-sm font-bold">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-gray-600">
                        {item.description}
                      </p>

                    </div>

                  </div>

                );

              })}

            </div>


            <button className="mt-7 flex items-center justify-center gap-2 rounded-lg bg-[#071426] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#fbb900] hover:text-[#071426]">

              Learn More About Delivery

              <ArrowRight size={17} />

            </button>

          </div>



          {/* =================================================
              ORDER TRACKING
          ================================================= */}

          <div className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">

            <div>

              <h2 className="text-2xl font-extrabold">
                Real-time Order Tracking
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Track your order status in real time.
              </p>

            </div>


            {/* Input */}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

              <div className="relative flex-1">

                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter your Order ID"
                  className="h-12 w-full rounded-lg border border-gray-300 pl-11 pr-4 text-sm outline-none transition focus:border-[#fbb900] focus:ring-2 focus:ring-[#fbb900]/20"
                />

              </div>


              <button
                onClick={handleTrackOrder}
                className="h-12 rounded-lg bg-[#fbb900] px-7 text-sm font-bold text-[#071426] transition hover:bg-[#071426] hover:text-white"
              >

                Track Order

              </button>

            </div>


            {trackingMessage && (

              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">

                {trackingMessage}

              </div>

            )}



            {/* MAP */}

            <div className="relative mt-5 h-[190px] overflow-hidden rounded-xl bg-[#edf3f8]">

              {/* Fake map roads */}

              <div className="absolute inset-0 opacity-40">

                <div className="absolute left-[-10%] top-[65%] h-[2px] w-[120%] rotate-[-8deg] bg-white" />

                <div className="absolute left-[-10%] top-[35%] h-[2px] w-[120%] rotate-[12deg] bg-white" />

                <div className="absolute left-[20%] top-[-20%] h-[150%] w-[2px] rotate-[25deg] bg-white" />

                <div className="absolute right-[25%] top-[-20%] h-[150%] w-[2px] rotate-[-20deg] bg-white" />

              </div>


              {/* Route */}

              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 800 250"
                preserveAspectRatio="none"
              >

                <path
                  d="M70 190 C180 160 170 120 280 130 C380 145 390 70 500 105 C600 140 650 100 730 65"
                  fill="none"
                  stroke="#fbb900"
                  strokeWidth="5"
                />

              </svg>


              {/* Start pin */}

              <div className="absolute bottom-[25%] left-[7%]">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#071426] shadow-lg">

                  <MapPin
                    size={22}
                    className="text-white"
                  />

                </div>

              </div>


              {/* Truck */}

              <div className="absolute left-[48%] top-[37%] flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">

                <Truck
                  size={23}
                  className="text-[#071426]"
                />

              </div>


              {/* Destination */}

              <div className="absolute right-[5%] top-[20%]">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fbb900] shadow-lg">

                  <MapPin
                    size={24}
                    className="text-[#071426]"
                  />

                </div>

              </div>

            </div>



            {/* Timeline */}

            <div className="relative mt-8">

              <div className="absolute left-[5%] right-[5%] top-[8px] h-[3px] bg-gray-300" />

              <div className="absolute left-[5%] top-[8px] h-[3px] w-[67%] bg-[#fbb900]" />


              <div className="relative grid grid-cols-4">

                <TimelineStep
                  active
                  title="Order Placed"
                  time="12 May, 10:30 AM"
                />

                <TimelineStep
                  active
                  title="Shipped"
                  time="12 May, 04:15 PM"
                />

                <TimelineStep
                  active
                  title="Out for Delivery"
                  time="13 May, 09:20 AM"
                />

                <TimelineStep
                  title="Delivered"
                  time="Expected"
                />

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* =====================================================
          WHY CUSTOMERS LOVE DELIVERY
      ===================================================== */}

      <section className="mx-auto max-w-[1400px] px-6 pb-8 lg:px-10">

        <div className="overflow-hidden rounded-xl bg-[#061a36]">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

            {benefits.map((benefit, index) => {

              const Icon = benefit.icon;

              return (

                <div
                  key={benefit.title}
                  className={`flex items-center gap-4 p-6 lg:px-7 ${
                    index !== benefits.length - 1
                      ? "border-b border-white/20 lg:border-b-0 lg:border-r"
                      : ""
                  }`}
                >

                  <Icon
                    size={38}
                    strokeWidth={1.6}
                    className="shrink-0 text-[#fbb900]"
                  />


                  <div>

                    <h3 className="text-sm font-bold text-white">
                      {benefit.title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-gray-300">
                      {benefit.description}
                    </p>

                  </div>

                </div>

              );

            })}

          </div>

        </div>

      </section>



      {/* =====================================================
          HELP CTA
      ===================================================== */}

      <section className="mx-auto max-w-[1400px] px-6 pb-10 lg:px-10">

        <div className="relative overflow-hidden rounded-xl border border-[#f5d88a] bg-[#fffdf6]">

          <div className="grid items-center gap-6 p-6 md:grid-cols-[180px_1fr_auto] lg:p-7">


            {/* BOX IMAGE */}

            <div className="flex justify-center">

              <img
                src={deliveryBox}
                alt="HoneyVision package"
                className="h-[120px] w-[160px] object-contain"
              />

            </div>


            {/* TEXT */}

            <div>

              <h2 className="text-2xl font-extrabold">
                Need Help with Your Delivery?
              </h2>

              <p className="mt-2 max-w-[600px] text-sm leading-6 text-gray-600">
                Our support team is here to help you with any
                delivery related queries.
              </p>

            </div>


            {/* BUTTON */}

            <button className="flex items-center justify-center gap-3 rounded-lg bg-[#071426] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#fbb900] hover:text-[#071426]">

              <Headphones size={19} />

              Contact Support

            </button>

          </div>

        </div>

      </section>

    </div>

  );
};



/* =========================================================
   HERO FEATURE COMPONENT
========================================================= */

const HeroFeature = ({
  icon: Icon,
  title,
  subtitle,
}) => {

  return (

    <div className="flex items-center gap-3">

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/40 bg-white/5">

        <Icon
          size={24}
          strokeWidth={1.5}
          className="text-white"
        />

      </div>


      <div>

        <p className="text-xs font-bold text-white">
          {title}
        </p>

        <p className="mt-1 text-[11px] text-gray-400">
          {subtitle}
        </p>

      </div>

    </div>

  );

};



/* =========================================================
   TIMELINE STEP
========================================================= */

const TimelineStep = ({
  active = false,
  title,
  time,
}) => {

  return (

    <div className="flex flex-col items-center text-center">

      <div
        className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
          active
            ? "border-[#fbb900] bg-[#fbb900]"
            : "border-gray-400 bg-gray-300"
        }`}
      >

        {active && (
          <Check
            size={11}
            strokeWidth={3}
            className="text-[#071426]"
          />
        )}

      </div>


      <p className="mt-3 text-xs font-bold text-[#071426]">
        {title}
      </p>

      <p className="mt-1 text-[10px] text-gray-500">
        {time}
      </p>

    </div>

  );

};


export default Delivery;
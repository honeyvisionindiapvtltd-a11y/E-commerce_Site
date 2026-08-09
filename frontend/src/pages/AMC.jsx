import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Clock3,
  Wrench,
  Headphones,
  RefreshCw,
  FileCheck,
  Settings,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle2,
  CircleCheck,
  Zap,
  Shield,
  BadgeCheck,
  TrendingUp,
  IndianRupee,
  CalendarCheck,
  Activity,
} from "lucide-react";

import amcTechnician from "../assets/amc_technician.png";
import amcSystem from "../assets/amc_system.png";

const AMC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("Standard AMC");

  const includedServices = [
    {
      icon: Settings,
      title: "Routine System Check-up",
      text: "Regular inspection and health check of devices",
    },
    {
      icon: Wrench,
      title: "Preventive Maintenance",
      text: "Cleaning, tuning and performance optimization",
    },
    {
      icon: Headphones,
      title: "Priority Support",
      text: "24/7 support with faster response time",
    },
    {
      icon: RefreshCw,
      title: "Software Updates",
      text: "Firmware & software update and upgrade",
    },
    {
      icon: Wrench,
      title: "Genuine Parts Replacement",
      text: "Original & genuine parts for replacements",
    },
    {
      icon: FileCheck,
      title: "Detailed Service Reports",
      text: "Complete report after each service visit",
    },
  ];

  const plans = [
    {
      name: "Basic AMC",
      label: "Essential",
      description: "Ideal for small setups",
      price: "2,499",
      features: [
        "2 Preventive Maintenance Visits",
        "24/7 Support (Phone & WhatsApp)",
        "System Health Check",
        "Basic Issue Resolution",
        "Service Report",
      ],
      button: "Get Basic AMC",
    },
    {
      name: "Standard AMC",
      label: "Recommended",
      description: "Perfect for homes & businesses",
      price: "4,999",
      popular: true,
      features: [
        "4 Preventive Maintenance Visits",
        "24/7 Priority Support",
        "System Health Check",
        "Software Updates",
        "Minor Parts Replacement",
        "Service Report",
      ],
      button: "Get Standard AMC",
    },
    {
      name: "Premium AMC",
      label: "Best Value",
      description: "For large & critical installations",
      price: "9,999",
      features: [
        "Unlimited Preventive Visits",
        "24/7 Priority Support",
        "Comprehensive System Check",
        "Software Updates",
        "Parts Replacement (Included)",
        "On-site Emergency Support",
        "Detailed Service Report",
      ],
      button: "Get Premium AMC",
    },
  ];

  const benefits = [
    {
      icon: Activity,
      title: "Ensures 24/7",
      subtitle: "Surveillance",
    },
    {
      icon: ShieldCheck,
      title: "Reduces Downtime",
      subtitle: "& Failures",
    },
    {
      icon: TrendingUp,
      title: "Extends Equipment",
      subtitle: "Lifespan",
    },
    {
      icon: IndianRupee,
      title: "Saves on Repair",
      subtitle: "Costs",
    },
    {
      icon: BadgeCheck,
      title: "Peace of Mind",
      subtitle: "Guaranteed",
    },
  ];

  const selectedPlanDetails = useMemo(
    () => plans.find((plan) => plan.name === selectedPlan) || plans[1],
    [selectedPlan]
  );

  const handleSelectPlan = (planName) => {
    const plan = plans.find((item) => item.name === planName) || selectedPlanDetails;
    setSelectedPlan(plan.name);
    navigate("/payment-methods", {
      state: {
        selectedAmcPlan: plan.name,
        amcPrice: plan.price,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#111827]">

      {/* =====================================================
          HERO SECTION
      ===================================================== */}
      <section className="relative overflow-hidden bg-white">

        {/* Breadcrumb */}
        <div className="absolute left-0 right-0 top-0 z-20">
          <div className="mx-auto max-w-[1400px] px-6 pt-7 lg:px-10">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Home</span>
              <span>›</span>
              <span>Services</span>
              <span>›</span>
              <span className="font-semibold text-gray-900">AMC</span>
            </div>
          </div>
        </div>

        <div className="mx-auto grid min-h-[610px] max-w-[1400px] grid-cols-1 lg:grid-cols-2">

          {/* LEFT */}
          <div className="relative z-10 flex flex-col justify-center px-6 pb-12 pt-32 lg:px-10 lg:pt-28">

            <p className="mb-3 text-base font-bold tracking-wide text-[#fbb900]">
              AMC SERVICES
            </p>

            <h1 className="max-w-[620px] text-5xl font-extrabold leading-[1.05] tracking-tight text-[#071426] md:text-6xl">
              Complete Protection.
              <br />
              <span className="text-[#fbb900]">
                Zero Worries.
              </span>
            </h1>

            <p className="mt-6 max-w-[590px] text-lg leading-8 text-gray-600">
              HoneyVision AMC ensures your security systems are always
              in perfect working condition with regular maintenance,
              priority support, and expert care.
            </p>

            {/* Features */}
            <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">

              <HeroFeature
                icon={Clock3}
                title="24/7 Priority"
                subtitle="Support"
              />

              <HeroFeature
                icon={Wrench}
                title="Regular"
                subtitle="Maintenance"
              />

              <HeroFeature
                icon={ShieldCheck}
                title="Quick Issue"
                subtitle="Resolution"
              />

              <HeroFeature
                icon={BadgeCheck}
                title="Genuine Parts"
                subtitle="Replacement"
              />

            </div>

            <div className="mt-8">
              <button
                onClick={() =>
                  document
                    .getElementById("amc-plans")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center gap-3 rounded-lg bg-[#071426] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#fbb900] hover:text-[#071426]"
              >
                <ShieldCheck size={20} />
                Choose Your AMC Plan
              </button>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="relative min-h-[500px] overflow-hidden lg:min-h-full">

            <img
              src={amcTechnician}
              alt="HoneyVision AMC technician installing CCTV"
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent lg:from-white/80 lg:via-transparent" />

            {/* Floating Card */}
            <div className="absolute bottom-10 right-6 max-w-[300px] rounded-xl border border-[#fbb900] bg-[#071426]/95 p-5 text-white shadow-2xl lg:right-10">

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fbb900]/10">
                  <ShieldCheck
                    size={28}
                    className="text-[#fbb900]"
                  />
                </div>

                <div>
                  <h3 className="font-bold">
                    Protect Your Investment
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-300">
                    Maximize uptime and extend the life of your
                    security systems.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHAT IS AMC
      ===================================================== */}
      <section className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="grid items-center gap-8 p-8 md:grid-cols-2 lg:p-12">

            {/* AMC IMAGE */}
            <div className="flex items-center justify-center">
              <img
                src={amcSystem}
                alt="AMC security system"
                className="h-[300px] w-full max-w-[470px] object-contain"
              />
            </div>

            {/* CONTENT */}
            <div>

              <h2 className="text-3xl font-bold text-[#071426]">
                What is AMC?
              </h2>

              <p className="mt-4 text-base leading-7 text-gray-600">
                AMC (Annual Maintenance Contract) is a comprehensive
                maintenance service that ensures the smooth functioning
                of your security and surveillance systems throughout
                the year.
              </p>

              <div className="mt-6 space-y-4">

                <CheckItem>
                  Preventive maintenance to avoid unexpected breakdowns
                </CheckItem>

                <CheckItem>
                  Priority support and quick response
                </CheckItem>

                <CheckItem>
                  Cost-effective solution for long-term security
                </CheckItem>

                <CheckItem>
                  Expert engineers and genuine spare parts
                </CheckItem>

              </div>
            </div>

          </div>
        </div>

      </section>

      {/* =====================================================
          INCLUDED SERVICES
      ===================================================== */}
      <section className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">

        <div className="rounded-2xl border border-gray-200 bg-white p-8 lg:p-10">

          <h2 className="text-center text-3xl font-bold text-[#071426]">
            What's Included in Our AMC?
          </h2>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">

            {includedServices.map((service, index) => {
              const Icon = service.icon;

              return (
                <div
                  key={service.title}
                  className={`px-5 py-4 text-center ${
                    index !== includedServices.length - 1
                      ? "lg:border-r lg:border-gray-200"
                      : ""
                  }`}
                >

                  <div className="mx-auto flex h-14 w-14 items-center justify-center">
                    <Icon
                      size={38}
                      strokeWidth={1.6}
                      className="text-[#071426]"
                    />
                  </div>

                  <h3 className="mt-4 text-sm font-bold">
                    {service.title}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    {service.text}
                  </p>

                </div>
              );
            })}

          </div>
        </div>

      </section>

      {/* =====================================================
          AMC PLANS
      ===================================================== */}
      <section
        id="amc-plans"
        className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10"
      >

        <h2 className="text-center text-3xl font-bold text-[#071426]">
          Choose the Right AMC Plan for You
        </h2>

        <div className="mt-10 grid gap-7 lg:grid-cols-3">

          {plans.map((plan) => {
            const isSelected = selectedPlanDetails.name === plan.name;

            return (
            <div
              key={plan.name}
              className={`relative rounded-2xl border bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                isSelected
                  ? "border-[#fbb900] shadow-lg"
                  : plan.popular
                    ? "border-[#fbb900]/50"
                    : "border-gray-200"
              }`}
            >

              {/* Popular top border */}
              {plan.popular && (
                <div className="absolute left-0 right-0 top-0 h-2 rounded-t-2xl bg-[#fbb900]" />
              )}

              {plan.popular && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fbb900] px-5 py-1 text-xs font-bold text-[#071426]">
                  Most Popular
                </div>
              )}

              <div className="flex items-center justify-between">

                <h3 className="text-xl font-bold">
                  {plan.name}
                </h3>

                <span
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    plan.popular
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {plan.label}
                </span>

              </div>

              <p className="mt-3 text-sm text-gray-500">
                {plan.description}
              </p>

              <div className="mt-6">
                <span className="text-4xl font-extrabold text-[#071426]">
                  ₹{plan.price}
                </span>

                <span className="ml-1 text-sm text-gray-500">
                  / Year
                </span>
              </div>

              <div className="my-6 h-px bg-gray-200" />

              <div className="space-y-4">

                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2
                      size={17}
                      className="mt-0.5 shrink-0 text-[#fbb900]"
                    />

                    <span className="text-sm text-gray-700">
                      {feature}
                    </span>
                  </div>
                ))}

              </div>

              <button
                onClick={() => handleSelectPlan(plan.name)}
                className={`mt-8 w-full rounded-lg border px-5 py-3 font-semibold transition ${
                  isSelected
                    ? "border-[#fbb900] bg-[#fbb900] text-[#071426]"
                    : plan.popular
                      ? "border-[#fbb900] bg-[#fbb900]/90 text-[#071426] hover:bg-[#071426] hover:text-white"
                      : "border-gray-300 bg-white text-[#071426] hover:border-[#fbb900] hover:bg-[#fbb900]"
                }`}
              >
                {isSelected ? "Selected Plan" : plan.button}
              </button>

            </div>
            );
          })}

        </div>

        <div className="mt-8 rounded-2xl border border-[#fbb900]/40 bg-[#fffdf5] p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#fbb900]">Selected plan</p>
          <h3 className="mt-1 text-2xl font-bold text-[#071426]">{selectedPlanDetails.name}</h3>
          <p className="mt-2 text-sm text-gray-600">
            Selecting a plan sends you directly to payment options for confirmation.
          </p>
        </div>
      </section>

      {/* =====================================================
          BENEFITS
      ===================================================== */}
      <section className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">

        <div className="rounded-2xl border border-[#f4d98b] bg-[#fffdf5] p-8">

          <h2 className="text-center text-2xl font-bold text-[#071426]">
            Benefits of Choosing HoneyVision AMC
          </h2>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">

            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className={`flex flex-col items-center px-5 py-3 text-center ${
                    index !== benefits.length - 1
                      ? "lg:border-r lg:border-gray-200"
                      : ""
                  }`}
                >

                  <Icon
                    size={34}
                    strokeWidth={1.6}
                    className="text-[#071426]"
                  />

                  <p className="mt-3 text-sm font-bold">
                    {benefit.title}
                  </p>

                  <p className="text-sm font-bold">
                    {benefit.subtitle}
                  </p>

                </div>
              );
            })}

          </div>

        </div>

      </section>

      {/* =====================================================
          CONTACT / HELP
      ===================================================== */}
      <section className="mx-auto max-w-[1400px] px-6 py-6 pb-10 lg:px-10">

        <div className="overflow-hidden rounded-2xl bg-[#071426] p-7 text-white shadow-xl lg:p-8">

          <div className="grid items-center gap-8 lg:grid-cols-[1fr_2fr]">

            <div>

              <p className="font-bold text-[#fbb900]">
                Need Help Choosing a Plan?
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                We're Here to Help You
              </h2>

              <p className="mt-2 max-w-[380px] text-sm leading-6 text-gray-300">
                Our experts will help you choose the best AMC plan
                as per your requirements.
              </p>

            </div>

            <div className="grid gap-3 md:grid-cols-3">

              <ContactCard
                icon={Phone}
                title="Call Us"
                value="+91 98765 43210"
              />

              <ContactCard
                icon={MessageCircle}
                title="WhatsApp"
                value="+91 98765 43210"
              />

              <ContactCard
                icon={Mail}
                title="Email Us"
                value="support@honeyvision.in"
              />

            </div>

          </div>

        </div>

      </section>

    </div>
  );
};


/* =========================================================
   SMALL COMPONENTS
========================================================= */

const HeroFeature = ({ icon: Icon, title, subtitle }) => {
  return (
    <div className="flex items-center gap-2">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbb900]/10">
        <Icon
          size={20}
          className="text-[#fbb900]"
        />
      </div>

      <div className="text-xs font-semibold text-gray-700">
        <div>{title}</div>
        <div>{subtitle}</div>
      </div>

    </div>
  );
};


const CheckItem = ({ children }) => {
  return (
    <div className="flex items-start gap-3">

      <CircleCheck
        size={20}
        className="mt-0.5 shrink-0 text-[#fbb900]"
      />

      <span className="text-sm leading-6 text-gray-700">
        {children}
      </span>

    </div>
  );
};


const ContactCard = ({ icon: Icon, title, value }) => {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/20 px-4 py-4">

      <Icon
        size={27}
        className="shrink-0 text-[#fbb900]"
      />

      <div>
        <p className="text-xs text-gray-300">
          {title}
        </p>

        <p className="mt-1 text-sm font-bold">
          {value}
        </p>
      </div>

    </div>
  );
};


export default AMC;
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
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
  ArrowLeft,
} from "lucide-react";
import { useCommerce } from "../context/CommerceContext";


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
  const { profile, addInstallationBooking } = useCommerce();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState("cctv");
  const [selectedAdditional, setSelectedAdditional] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: profile?.fullName || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
    address: profile?.address || "",
    city: profile?.city || "",
    state: profile?.state || "",
    pinCode: profile?.pinCode || "",
    preferredDate: "",
    preferredSlot: "",
    notes: "",
  });

  const productPrice = 11996;
  const quantity = 4;
  const today = new Date().toISOString().split("T")[0];
  const slotOptions = [
    "Morning (9:00 AM - 12:00 PM)",
    "Afternoon (12:00 PM - 3:00 PM)",
    "Evening (3:00 PM - 6:00 PM)",
  ];

  const currentService = services.find((service) => service.id === selectedService);

  const additionalTotal = useMemo(() => {
    return selectedAdditional.reduce((total, id) => {
      const service = additionalServices.find((item) => item.id === id);
      return total + (service?.price || 0);
    }, 0);
  }, [selectedAdditional]);

  const installationPrice = currentService?.price || 0;
  const subtotal = (productPrice * quantity) + installationPrice + additionalTotal;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  const toggleAdditional = (id) => {
    setSelectedAdditional((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  };

  const formatPrice = (price) => `₹${price.toLocaleString("en-IN")}`;

  const handleInputChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: "" }));
    }
  };

  const validateCurrentStep = () => {
    const nextErrors = {};

    if (currentStep === 2) {
      if (!formData.name.trim()) nextErrors.name = "Full name is required.";
      if (!formData.phone.trim()) nextErrors.phone = "Phone number is required.";
      else if (formData.phone.replace(/\D/g, "").length < 10) nextErrors.phone = "Enter a valid 10-digit phone number.";
      if (!formData.email.trim()) nextErrors.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = "Enter a valid email address.";
      if (!formData.address.trim()) nextErrors.address = "Address is required.";
      if (!formData.city.trim()) nextErrors.city = "City is required.";
      if (!formData.state.trim()) nextErrors.state = "State is required.";
      if (!formData.pinCode.trim()) nextErrors.pinCode = "PIN code is required.";
      else if (formData.pinCode.replace(/\D/g, "").length !== 6) nextErrors.pinCode = "Enter a valid 6-digit PIN code.";
    }

    if (currentStep === 3) {
      if (!formData.preferredDate) nextErrors.preferredDate = "Choose a preferred date.";
      if (!formData.preferredSlot) nextErrors.preferredSlot = "Choose a preferred slot.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep((step) => Math.min(step + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);

    const booking = {
      id: `INST-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      service: currentService?.title || "Installation",
      serviceId: selectedService,
      additionalServices: selectedAdditional.map((id) => additionalServices.find((service) => service.id === id)?.title).filter(Boolean),
      customer: {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pinCode: formData.pinCode.trim(),
      },
      preferredDate: formData.preferredDate,
      preferredSlot: formData.preferredSlot,
      notes: formData.notes.trim(),
      installationPrice,
      additionalTotal,
      subtotal,
      gst,
      total,
    };

    await addInstallationBooking(booking);
    setSubmittedBooking(booking);
    setIsSubmitting(false);
    setCurrentStep(4);

    navigate("/installation/success", { state: { booking } });
  };

  const resetBooking = () => {
    setCurrentStep(1);
    setSelectedService("cctv");
    setSelectedAdditional([]);
    setSubmittedBooking(null);
    setErrors({});
    setFormData({
      name: profile?.fullName || "",
      phone: profile?.phone || "",
      email: profile?.email || "",
      address: profile?.address || "",
      city: profile?.city || "",
      state: profile?.state || "",
      pinCode: profile?.pinCode || "",
      preferredDate: "",
      preferredSlot: "",
      notes: "",
    });
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
            <Step number="1" title="Select Service" active={currentStep >= 1} completed={currentStep > 1} />
            <StepLine />
            <Step number="2" title="Enter Details" active={currentStep >= 2} completed={currentStep > 2} />
            <StepLine />
            <Step number="3" title="Schedule Appointment" active={currentStep >= 3} completed={currentStep > 3} />
            <StepLine />
            <Step number="4" title="Confirmation" active={currentStep >= 4} completed={submittedBooking !== null} />
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_310px]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">
                  {currentStep === 1 && "1. Select Service"}
                  {currentStep === 2 && "2. Enter Your Details"}
                  {currentStep === 3 && "3. Schedule Appointment"}
                  {currentStep === 4 && "4. Confirm Your Booking"}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {currentStep === 1 && "Choose the installation service you need."}
                  {currentStep === 2 && "Share your contact and site details for the technician."}
                  {currentStep === 3 && "Select a convenient appointment slot."}
                  {currentStep === 4 && "Review everything before confirming your booking."}
                </p>
              </div>

              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-[#f5bd22] hover:text-[#03111f]"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              )}
            </div>

            {currentStep === 1 && (
              <div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {services.map((service) => {
                    const Icon = service.icon;
                    const isSelected = selectedService === service.id;

                    return (
                      <button
                        key={service.id}
                        onClick={() => setSelectedService(service.id)}
                        className={`relative rounded-xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-[#f5bd22] bg-[#fffdf6] shadow-[0_0_0_1px_rgba(245,189,34,0.15)]"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <span className={`absolute right-4 top-4 flex h-4 w-4 items-center justify-center rounded-full border ${isSelected ? "border-[#f5bd22]" : "border-gray-400"}`}>
                          {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-[#f5bd22]" />}
                        </span>

                        <Icon size={27} strokeWidth={1.7} className="mb-5 text-[#101820]" />
                        <h3 className="text-sm font-bold">{service.title}</h3>
                        <p className="mt-2 min-h-[40px] text-xs leading-5 text-gray-600">{service.description}</p>
                        <div className="mt-3 text-sm font-bold">{formatPrice(service.price)}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <h3 className="text-sm font-bold">
                    Additional Services
                    <span className="font-normal text-gray-500"> (Optional)</span>
                  </h3>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {additionalServices.map((service) => {
                      const checked = selectedAdditional.includes(service.id);

                      return (
                        <button
                          key={service.id}
                          onClick={() => toggleAdditional(service.id)}
                          className={`flex items-start gap-2 rounded-lg border p-3 text-left transition ${checked ? "border-[#f5bd22] bg-[#fffdf6]" : "border-gray-200 hover:border-gray-300"}`}
                        >
                          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-[#f5bd22] bg-[#f5bd22] text-white" : "border-gray-400"}`}>
                            {checked && <Check size={11} />}
                          </span>

                          <div>
                            <span className="text-xs font-medium">{service.title}</span>
                            <div className="mt-2 text-[11px] font-semibold">{formatPrice(service.price)}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="flex items-center gap-5 rounded-lg bg-[#03111f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#10273d]"
                  >
                    Continue
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Full name" value={formData.name} error={errors.name} onChange={(value) => handleInputChange("name", value)} />
                  <FormField label="Phone number" value={formData.phone} type="tel" error={errors.phone} onChange={(value) => handleInputChange("phone", value)} />
                  <FormField label="Email" value={formData.email} type="email" error={errors.email} onChange={(value) => handleInputChange("email", value)} />
                  <FormField label="City" value={formData.city} error={errors.city} onChange={(value) => handleInputChange("city", value)} />
                  <FormField label="State" value={formData.state} error={errors.state} onChange={(value) => handleInputChange("state", value)} />
                  <FormField label="PIN code" value={formData.pinCode} error={errors.pinCode} onChange={(value) => handleInputChange("pinCode", value.replace(/\D/g, "").slice(0, 6))} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Installation address
                    <textarea
                      rows="3"
                      value={formData.address}
                      onChange={(event) => handleInputChange("address", event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-[#f5bd22]"
                      placeholder="Enter the site address where the installation will be carried out"
                    />
                  </label>
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={handleContinue} className="flex items-center gap-5 rounded-lg bg-[#03111f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#10273d]">
                    Continue
                    <ArrowRight size={17} />
                  </button>
                </div>
              </form>
            )}

            {currentStep === 3 && (
              <form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Preferred date
                    <input
                      type="date"
                      min={today}
                      value={formData.preferredDate}
                      onChange={(event) => handleInputChange("preferredDate", event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-[#f5bd22]"
                    />
                    {errors.preferredDate && <p className="mt-1 text-sm text-red-600">{errors.preferredDate}</p>}
                  </label>

                  <label className="block text-sm font-semibold text-gray-700">
                    Preferred slot
                    <select
                      value={formData.preferredSlot}
                      onChange={(event) => handleInputChange("preferredSlot", event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-[#f5bd22]"
                    >
                      <option value="">Select a slot</option>
                      {slotOptions.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    {errors.preferredSlot && <p className="mt-1 text-sm text-red-600">{errors.preferredSlot}</p>}
                  </label>
                </div>

                <label className="block text-sm font-semibold text-gray-700">
                  Notes for the technician
                  <textarea
                    rows="3"
                    value={formData.notes}
                    onChange={(event) => handleInputChange("notes", event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-[#f5bd22]"
                    placeholder="Any special instructions or access details"
                  />
                </label>

                <div className="flex justify-end">
                  <button type="button" onClick={handleContinue} className="flex items-center gap-5 rounded-lg bg-[#03111f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#10273d]">
                    Review Booking
                    <ArrowRight size={17} />
                  </button>
                </div>
              </form>
            )}

            {currentStep === 4 && (
              <div className="mt-6 space-y-4">
                {submittedBooking ? (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <Check size={18} />
                      Installation booked successfully
                    </div>
                    <p className="mt-2 leading-6">
                      Your booking request <span className="font-semibold">{submittedBooking.id}</span> has been saved. Our team will confirm the appointment shortly.
                    </p>
                    <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                      <p className="font-semibold">Service: {submittedBooking.service}</p>
                      <p className="mt-1 text-sm text-gray-600">Preferred slot: {submittedBooking.preferredDate} • {submittedBooking.preferredSlot}</p>
                      <p className="mt-1 text-sm text-gray-600">Technician contact: {submittedBooking.customer.phone}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button type="button" onClick={resetBooking} className="rounded-lg bg-[#03111f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#10273d]">
                        Book Another Installation
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-[#f9fafb] p-4">
                      <h3 className="text-sm font-semibold text-gray-900">Booking summary</h3>
                      <ul className="mt-3 space-y-2 text-sm text-gray-600">
                        <li><span className="font-medium text-gray-900">Service:</span> {currentService?.title}</li>
                        <li><span className="font-medium text-gray-900">Additional services:</span> {selectedAdditional.length ? selectedAdditional.map((id) => additionalServices.find((service) => service.id === id)?.title).join(", ") : "None"}</li>
                        <li><span className="font-medium text-gray-900">Contact:</span> {formData.name} • {formData.phone}</li>
                        <li><span className="font-medium text-gray-900">Site:</span> {formData.address}, {formData.city}, {formData.state} - {formData.pinCode}</li>
                        <li><span className="font-medium text-gray-900">Preferred slot:</span> {formData.preferredDate || "To be confirmed"} • {formData.preferredSlot || "To be confirmed"}</li>
                      </ul>
                    </div>

                    <div className="flex justify-end">
                      <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-5 rounded-lg bg-[#f5bd22] px-5 py-3 text-sm font-semibold text-[#03111f] transition hover:bg-[#f0b511] disabled:cursor-not-allowed disabled:opacity-70">
                        {isSubmitting ? "Booking..." : "Book Installation"}
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">Order Summary</h2>
                <p className="mt-2 text-sm text-gray-500">Quickly access your installation bookings and history.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/installation/history" className="inline-flex items-center justify-center rounded-full border border-[#061a36] px-4 py-2 text-xs font-semibold text-[#061a36] transition hover:bg-[#061a36] hover:text-white">
                  View History
                </Link>
              </div>
            </div>
            <div className="mt-5 flex gap-3 border-b border-gray-200 pb-4">
              <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                <img src="/images/hikvision-bullet-camera.jpg" alt="Hikvision 2MP Bullet Camera" className="h-full w-full object-contain" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="text-sm font-bold leading-5">Hikvision 2MP<br />Bullet Camera</div>
                <div className="flex items-end justify-between">
                  <span className="text-xs text-gray-500">Qty: {quantity}</span>
                  <span className="text-sm font-bold">{formatPrice(productPrice)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 py-4 text-sm">
              <PriceRow label="Installation Service" value={formatPrice(installationPrice)} />
              <PriceRow label="Additional Services" value={formatPrice(additionalTotal)} />
              <div className="border-t border-gray-200 pt-4">
                <PriceRow label="Subtotal" value={formatPrice(subtotal)} />
              </div>
              <PriceRow label="GST (18%)" value={formatPrice(gst)} />
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="font-bold">Total Amount</span>
                <span className="text-xl font-bold">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="rounded-xl bg-[#eff9f3] p-4">
              <SecurityInfo icon={ShieldCheck} title="Secure Booking" description="Your data is protected and secure" />
              <SecurityInfo icon={UserRoundCheck} title="No Hidden Charges" description="Transparent pricing with no surprises" />
              <SecurityInfo icon={ShieldCheck} title="Workmanship Warranty" description="1 year warranty on installation service" last />
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
  completed = false,
}) {
  return (
    <div className="flex min-w-[130px] flex-col items-center text-center">

      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
          completed
            ? "bg-[#17834b] text-white"
            : active
              ? "bg-[#fdbb08] text-white"
              : "bg-gray-100 text-gray-800"
        }`}
      >
        {completed ? <Check size={15} /> : number}
      </div>

      <span
        className={`mt-2 text-xs font-medium ${
          active || completed
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
      <Icon size={20} strokeWidth={1.5} className="text-gray-500" />
      <span className="text-xs font-medium text-gray-600">{text}</span>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", error = "" }) {
  return (
    <label className="block text-sm font-semibold text-gray-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-[#f5bd22]"
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </label>
  );
}

export default BookInstallation;
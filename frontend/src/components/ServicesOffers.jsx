import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Truck,
  Wrench,
  BadgeCheck,
  Headphones,
  Gift,
} from "lucide-react";

export default function ServicesOffers() {
  const navigate = useNavigate();
  const [activeOffer, setActiveOffer] = useState(0);
  const services = [
    {
      icon: <ShieldCheck size={30} />,
      title: "100% Genuine Products",
      desc: "Trusted brands with official warranty",
    },
    {
      icon: <Truck size={30} />,
      title: "Fast Delivery",
      desc: "Delivery across India",
    },
    {
      icon: <Wrench size={30} />,
      title: "Professional Installation",
      desc: "Expert CCTV & IT setup service",
    },
    {
      icon: <BadgeCheck size={30} />,
      title: "Warranty & AMC",
      desc: "Extended support available",
    },
    {
      icon: <Headphones size={30} />,
      title: "24/7 Support",
      desc: "Technical assistance anytime",
    },
    {
      icon: <Gift size={30} />,
      title: "Exclusive Discounts",
      desc: "Save more on every purchase",
    },
  ];

  const offers = [
    {
      id: "hot-deal",
      badge: "HOT DEAL",
      badgeClass: "bg-red-500 text-white",
      title: "Flat 25% OFF",
      text: "On CCTV Cameras, Drones & Networking Products.",
      buttonText: "Shop Now",
      onClick: () => navigate("/products"),
      buttonClass: "bg-yellow-500 text-black",
      image: "/offers/cctv-drone.png",
      imageClass: "w-24 sm:w-32 lg:w-48",
      cardClass:
        "mobile-offer-card mobile-offer-card--dark bg-gradient-to-br from-[#0b1730] via-[#102c4f] to-[#1a4f8f] text-white shadow-[0_18px_28px_rgba(15,23,42,0.28)] ring-1 ring-white/10",
    },
    {
      id: "installation",
      badge: "LIMITED OFFER",
      badgeClass: "bg-white text-blue-700",
      title: "Free Installation",
      text: "On selected CCTV packages and office networking solutions.",
      buttonText: "Learn More",
      onClick: () => navigate("/services"),
      buttonClass: "bg-white text-blue-700 shadow-[0_8px_18px_rgba(255,255,255,0.3)]",
      image: "/offers/install.png",
      imageClass: "w-20 sm:w-28 lg:w-44",
      cardClass:
        "mobile-offer-card mobile-offer-card--blue bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#60a5fa] text-white shadow-[0_18px_28px_rgba(37,99,235,0.28)] ring-1 ring-white/10",
    },
    {
      id: "coupon",
      badge: "COUPON",
      badgeClass: "bg-black text-white",
      title: "HONEY10",
      text: "Get Extra 10% OFF on prepaid orders above ₹10,000.",
      buttonText: "Copy Coupon",
      onClick: () => navigator.clipboard?.writeText("HONEY10"),
      buttonClass: "bg-black text-white shadow-[0_8px_18px_rgba(15,23,42,0.25)]",
      image: "/offers/coupon.png",
      imageClass: "w-20 sm:w-24 lg:w-40",
      cardClass:
        "mobile-offer-card mobile-offer-card--yellow bg-gradient-to-br from-[#ffe27a] via-[#facc15] to-[#f59e0b] text-slate-900 shadow-[0_18px_28px_rgba(245,158,11,0.35)] ring-1 ring-slate-900/10",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveOffer((current) => (current + 1) % offers.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [offers.length]);

  return (
    <section className="bg-gray-50 py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 lg:gap-6">
          {services.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-4 lg:p-6"
            >
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-r from-amber-100 via-yellow-50 to-sky-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative text-yellow-500 sm:text-[30px]">{item.icon}</div>

              <h3 className="relative mt-2 text-[11px] font-bold leading-tight sm:text-sm lg:mt-4">
                {item.title}
              </h3>

              <p className="relative mt-1 text-[10px] leading-snug text-gray-500 sm:text-xs lg:mt-2">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 lg:mt-14">
          <div className="sm:hidden">
            <div className="overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${activeOffer * 100}%)` }}
              >
                {offers.map((offer) => (
                  <div key={offer.id} className="min-w-full">
                    <div className={`${offer.cardClass} relative overflow-hidden rounded-2xl p-4`}>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold sm:text-xs ${offer.badgeClass}`}>
                        {offer.badge}
                      </span>

                      <h2 className="mt-3 text-xl font-bold sm:text-2xl lg:text-3xl">
                        {offer.title}
                      </h2>

                      <p className="mt-2 text-xs opacity-90 sm:text-sm lg:mt-4">
                        {offer.text}
                      </p>

                      <button
                        type="button"
                        onClick={offer.onClick}
                        className={`mt-4 rounded-lg px-3 py-2 text-xs font-semibold transition hover:scale-[1.02] sm:px-4 sm:py-2.5 lg:mt-8 lg:px-6 lg:py-3 ${offer.buttonClass}`}
                      >
                        {offer.buttonText}
                      </button>

                      <img
                        src={offer.image}
                        alt=""
                        className={`absolute -bottom-1 right-0 ${offer.imageClass}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              {offers.map((offer, index) => (
                <button
                  key={`${offer.id}-dot`}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => setActiveOffer(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeOffer === index ? "w-7 bg-slate-900" : "w-2 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="hidden gap-4 sm:grid lg:grid-cols-3">
            {offers.map((offer) => (
              <div key={`${offer.id}-desktop`} className={`${offer.cardClass} relative overflow-hidden rounded-2xl p-4 sm:p-6 lg:rounded-3xl lg:p-8`}>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold sm:text-xs ${offer.badgeClass}`}>
                  {offer.badge}
                </span>

                <h2 className="mt-3 text-xl font-bold sm:text-2xl lg:text-3xl">
                  {offer.title}
                </h2>

                <p className="mt-2 text-xs opacity-90 sm:text-sm lg:mt-4">
                  {offer.text}
                </p>

                <button
                  type="button"
                  onClick={offer.onClick}
                  className={`mt-4 rounded-lg px-3 py-2 text-xs font-semibold transition hover:scale-[1.02] sm:px-4 sm:py-2.5 lg:mt-8 lg:px-6 lg:py-3 ${offer.buttonClass}`}
                >
                  {offer.buttonText}
                </button>

                <img
                  src={offer.image}
                  alt=""
                  className={`absolute -bottom-1 right-0 ${offer.imageClass}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
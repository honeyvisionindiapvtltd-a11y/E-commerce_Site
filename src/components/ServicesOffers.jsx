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

  return (
    <section className="bg-gray-50 py-16">

      <div className="max-w-7xl mx-auto px-6">

        {/* Services */}

        <div className="grid lg:grid-cols-6 md:grid-cols-3 grid-cols-2 gap-6">

          {services.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow hover:shadow-xl transition"
            >
              <div className="text-yellow-500">{item.icon}</div>

              <h3 className="font-bold mt-4">
                {item.title}
              </h3>

              <p className="text-gray-500 text-sm mt-2">
                {item.desc}
              </p>
            </div>
          ))}

        </div>

        {/* Promotional Offers */}

        <div className="grid lg:grid-cols-3 gap-8 mt-14">

          {/* Left Banner */}

          <div className="rounded-3xl bg-[#0A1931] text-white p-8 relative overflow-hidden">

            <span className="bg-red-500 px-3 py-1 rounded-full text-xs">
              HOT DEAL
            </span>

            <h2 className="text-3xl font-bold mt-5">
              Flat 25% OFF
            </h2>

            <p className="mt-4 text-gray-300">
              On CCTV Cameras, Drones &
              Networking Products.
            </p>

            <button type="button" onClick={() => navigate("/products")} className="mt-8 bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold">
              Shop Now
            </button>

            <img
              src="/offers/cctv-drone.png"
              alt=""
              className="absolute bottom-0 right-0 w-48"
            />

          </div>

          {/* Center Banner */}

          <div className="rounded-3xl bg-blue-600 text-white p-8 relative overflow-hidden">

            <span className="bg-white text-blue-700 px-3 py-1 rounded-full text-xs">
              LIMITED OFFER
            </span>

            <h2 className="text-3xl font-bold mt-5">
              Free Installation
            </h2>

            <p className="mt-4">
              On selected CCTV packages and
              office networking solutions.
            </p>

            <button type="button" onClick={() => navigate("/services")} className="mt-8 bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold">
              Learn More
            </button>

            <img
              src="/offers/install.png"
              alt=""
              className="absolute bottom-0 right-0 w-44"
            />

          </div>

          {/* Right Banner */}

          <div className="rounded-3xl bg-yellow-500 text-black p-8 relative overflow-hidden">

            <span className="bg-black text-white px-3 py-1 rounded-full text-xs">
              COUPON
            </span>

            <h2 className="text-4xl font-bold mt-5">
              HONEY10
            </h2>

            <p className="mt-4">
              Get Extra 10% OFF on prepaid
              orders above ₹10,000.
            </p>

            <button type="button" onClick={() => navigator.clipboard?.writeText("HONEY10") } className="mt-8 bg-black text-white px-6 py-3 rounded-lg font-semibold">
              Copy Coupon
            </button>

            <img
              src="/offers/coupon.png"
              alt=""
              className="absolute bottom-0 right-0 w-40"
            />

          </div>

        </div>

      </div>

    </section>
  );
}
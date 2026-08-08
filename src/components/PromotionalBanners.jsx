import { Link } from "react-router-dom";

const banners = [
  {
    eyebrow: "SUMMER SALE",
    title: "Up to 40% OFF",
    description: "On Top IT Products",
    button: "Shop Now",
    link: "/products",
    image: "/images/banners/summer-sale.png",
    background: "bg-amber-50",
    eyebrowColor: "text-amber-600",
  },
  {
    eyebrow: "COMBO OFFERS",
    title: "Best Combos\nBest Savings",
    description: "Build more. Save more.",
    button: "Explore Combos",
    link: "/combos",
    image: "/images/banners/combo-offers.png",
    background: "bg-blue-50",
    eyebrowColor: "text-blue-600",
  },
  {
    eyebrow: "INSTALLATION SERVICE",
    title: "Hassle-free\nInstallation",
    description: "Trained professionals at your service",
    button: "Book Now",
    link: "/services",
    image: "/images/banners/installation-service.png",
    background: "bg-green-50",
    eyebrowColor: "text-green-700",
  },
];

export default function PromotionalBanners() {
  return (
    <section className="w-full px-3 py-6 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {banners.map((banner) => (
          <article
            key={banner.title}
            className={`relative min-h-50 overflow-hidden rounded-xl p-6 ${banner.background}`}
          >
            <div className="relative z-10 max-w-45">
              <p className={`text-xs font-bold ${banner.eyebrowColor}`}>
                {banner.eyebrow}
              </p>

              <h2 className="mt-3 whitespace-pre-line text-2xl font-bold leading-tight text-slate-900">
                {banner.title}
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                {banner.description}
              </p>

              <Link
                to={banner.link}
                className="mt-5 inline-block rounded-md bg-[#071426] px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 hover:text-slate-950"
              >
                {banner.button}
              </Link>
            </div>

            <img
              src={banner.image}
              alt={banner.title}
              className="absolute bottom-0 right-0 h-full w-3/5 object-contain object-bottom"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
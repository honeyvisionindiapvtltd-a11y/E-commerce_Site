import { Link } from "react-router-dom";

const banners = [
  {
    eyebrow: "SUMMER SALE",
    title: "Up to 40% OFF",
    description: "On Top IT Products",
    button: "Shop Now",
    link: "/products",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786683027/summer_sale.png",
    background: "bg-amber-50",
    eyebrowColor: "text-amber-600",
  },
  {
    eyebrow: "COMBO OFFERS",
    title: "Best Combos\nBest Savings",
    description: "Build more. Save more.",
    button: "Explore Combos",
    link: "/combo-deals",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786014495/combo_offer_ctmhk5.png",
    background: "bg-blue-50",
    eyebrowColor: "text-blue-600",
  },
  {
    eyebrow: "INSTALLATION SERVICE",
    title: "Hassle-free\nInstallation",
    description: "Trained professionals at your service",
    button: "Book Now",
    link: "/services",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786014495/installation_service_oq6cyh.png",
    background: "bg-green-50",
    eyebrowColor: "text-green-700",
  },
];

export default function PromotionalBanners() {
  return (
    <section className="w-full px-3 py-4 sm:px-6 sm:py-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {banners.map((banner) => (
          <article
            key={banner.title}
            className={`relative min-h-45 overflow-hidden rounded-xl p-4 sm:min-h-50 sm:p-6 ${banner.background}`}
          >
            <div className="relative z-10 max-w-[56%] sm:max-w-45">
              <p className={`text-[10px] font-bold leading-tight sm:text-xs ${banner.eyebrowColor}`}>
                {banner.eyebrow}
              </p>

              <h2 className="mt-2 whitespace-pre-line text-xl font-bold leading-tight text-slate-900 sm:mt-3 sm:text-2xl">
                {banner.title}
              </h2>

              <p className="mt-1.5 text-xs leading-4 text-slate-600 sm:mt-2 sm:text-sm sm:leading-normal">
                {banner.description}
              </p>

              <Link
                to={banner.link}
                className="mt-3 inline-block rounded-md bg-[#071426] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 hover:text-slate-950 sm:mt-5 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                {banner.button}
              </Link>
            </div>

            <img
              src={banner.image}
              alt={banner.title}
              className="absolute bottom-0 right-0 h-full w-[48%] object-contain object-bottom sm:w-3/5"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
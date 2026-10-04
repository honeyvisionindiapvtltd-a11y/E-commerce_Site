import { useEffect, useRef, useState } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const touchStart = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767.98px)");
    const updateMobileState = () => setIsMobile(mediaQuery.matches);

    updateMobileState();
    mediaQuery.addEventListener("change", updateMobileState);
    return () => mediaQuery.removeEventListener("change", updateMobileState);
  }, []);

  useEffect(() => {
    if (!isMobile) return undefined;

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setActiveIndex((current) => (current + 1) % banners.length);
      }
    }, 4500);

    return () => window.clearInterval(timer);
  }, [isMobile]);

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const handleTouchEnd = (event) => {
    if (!touchStart.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touch ? touch.clientX - touchStart.current.x : 0;
    const deltaY = touch ? touch.clientY - touchStart.current.y : 0;
    touchStart.current = null;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    setActiveIndex((current) =>
      (current + (deltaX < 0 ? 1 : -1) + banners.length) % banners.length
    );
  };

  return (
    <section
      className="home-promo-section w-full px-3 py-4 sm:px-6 sm:py-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Promotional offers"
    >
      <div
        className="home-promo-track grid gap-4 lg:grid-cols-3"
        style={{ "--promo-offset": `${activeIndex * 100}%` }}
        aria-live="off"
      >
        {banners.map((banner, index) => (
          <article
            key={banner.title}
            className={`home-promo-card home-promo-card-${index} relative min-h-45 overflow-hidden rounded-xl p-4 sm:min-h-50 sm:p-6 ${banner.background}`}
            aria-hidden={isMobile && index !== activeIndex}
            inert={isMobile && index !== activeIndex}
          >
            <div className="relative z-10 max-w-[56%] sm:max-w-45">
              <p className={`text-[10px] font-bold leading-tight sm:text-xs ${banner.eyebrowColor}`}>
                {banner.eyebrow}
              </p>

              <h2 className="home-promo-title mt-2 whitespace-pre-line text-xl font-bold leading-tight text-slate-900 sm:mt-3 sm:text-2xl">
                {banner.title}
              </h2>

              <p className="home-promo-copy mt-1.5 text-xs leading-4 text-slate-600 sm:mt-2 sm:text-sm sm:leading-normal">
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

      <div className="home-promo-dots" aria-label="Choose a promotional banner">
        {banners.map((banner, index) => (
          <button
            key={`${banner.eyebrow}-dot`}
            type="button"
            className={index === activeIndex ? "is-active" : ""}
            aria-label={`Show ${banner.eyebrow.toLowerCase()} banner`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}
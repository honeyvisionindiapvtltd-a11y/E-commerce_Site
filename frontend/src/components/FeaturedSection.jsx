import {
  Clock3,
  ChevronRight,
  Heart,
  Eye,
  Star,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCommerce } from "../context/index.js";
import { money, normalizeProduct } from "../lib/products";

const brandLogos = {
  Honeywell: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377703/Honeywell-Logo_cdkjfy.svg",
  Prizor: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377703/prizor-logo_x0zxl2.jpg",
  "CP Plus": "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377702/cp_plus-logo_asuqmb.png",
  Dahua: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172595/Dahua_Technology_logo_veja1o.jpg",
  Dell: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172601/Dell_Logo_lmfwhj.png",
  Prama: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377702/prama-logo_pqskkz.png",
  Hikvision: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172596/Hikvision_logo_joawjl.png",
  HP: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172600/HP_LOGO_xkbqb1.png",
  DJI: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172591/DJI_logo_s90zht.png",
  "TP-Link": "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172593/Tp-Link_logo_2016_tlbnnn.png",
  Samgsung: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172590/Samsung_logo_nqxgxw.svg",
  Seagate: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172589/Seagate_logo_saaft5.svg",
  Lenovo: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172599/Lenovo_logo__2015_onwards_z586id.png",
  ASUS: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172597/ASUS_Logo_pdifp0.svg",
  Samsung: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172590/Samsung_logo_nqxgxw.svg",
};

const requestedBrands = [
  "Honeywell",
  "Prizor",
  "CP Plus",
  "Dell",
  "Prama",
  "HP",
  "Hikvision",
  "Dahua",
  "TP-Link",
  "DJI",
  "Samsung",
  "Seagate",
];

export default function FeaturedSection() {
  const { toggleWishlist, wishlist, products } = useCommerce();
  const brandRailRef = useRef(null);
  const [draggingBrands, setDraggingBrands] = useState(false);
  const [saleSeconds, setSaleSeconds] = useState((12 * 24 * 60 * 60) + (8 * 60 * 60) + (45 * 60) + 21);
  const dragState = useRef({ active: false, startX: 0, startScroll: 0 });
  const brands = requestedBrands.map((name) => ({
    name,
    logo: brandLogos[name] || "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172600/HP_LOGO_xkbqb1.png",
  }));
  const productRailRef = useRef(null);
  const scrollBrands = (direction) => brandRailRef.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
  const scrollProducts = (direction) => productRailRef.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
  const startBrandDrag = (event) => {
    if (!brandRailRef.current) return;
    dragState.current = { active: true, startX: event.clientX, startScroll: brandRailRef.current.scrollLeft };
    setDraggingBrands(true);
    brandRailRef.current.setPointerCapture?.(event.pointerId);
  };
  const moveBrandDrag = (event) => {
    if (!dragState.current.active || !brandRailRef.current) return;
    brandRailRef.current.scrollLeft = dragState.current.startScroll - (event.clientX - dragState.current.startX);
  };
  const stopBrandDrag = () => {
    dragState.current.active = false;
    setDraggingBrands(false);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSaleSeconds((remaining) => Math.max(remaining - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const saleTime = [
    Math.floor(saleSeconds / 86400),
    Math.floor((saleSeconds % 86400) / 3600),
    Math.floor((saleSeconds % 3600) / 60),
    saleSeconds % 60,
  ];
  const saleLabels = ["Days", "Hours", "Minutes", "Seconds"];
  const isCameraOnlyProduct = (product) => {
    const haystack = `${product?.name || ""} ${product?.category || ""} ${product?.subCategory || ""}`.toLowerCase();

    const hasCameraSignal = /(cctv|camera|surveillance|bullet|dome|ptz|ip camera|wifi camera|wireless camera|security camera|fisheye|anpr|thermal camera|outdoor camera|indoor camera|analog camera|network camera|smart camera|video door)/.test(haystack);
    const hasNonCameraSignal = /(printer|thermal printer|laptop|desktop|monitor|keyboard|mouse|router|switch|nvr|dvr|ups|smps|battery|adapter|mount|bracket|stand|holder|connector|cable|server|storage|drive|module|accessory|junction box|power supply|power adapter|display|housing|trim)/.test(haystack);

    return hasCameraSignal && !hasNonCameraSignal;
  };

  const normalizedProducts = (Array.isArray(products) ? products : []).map(normalizeProduct).filter(Boolean);

  const selectMixedBrandProducts = (items, limit = 18) => {
    if (!items.length) return [];

    const grouped = new Map();
    items.forEach((item) => {
      const brand = (item.brand || "CCTV").toString().trim() || "CCTV";
      if (!grouped.has(brand)) grouped.set(brand, []);
      grouped.get(brand).push(item);
    });

    const brandOrder = [...grouped.keys()];
    const selected = [];
    const usedIds = new Set();
    const maxRounds = Math.max(1, Math.ceil(limit / Math.max(brandOrder.length, 1)));

    for (let round = 0; round < maxRounds && selected.length < limit; round += 1) {
      for (const brand of brandOrder) {
        const bucket = grouped.get(brand) || [];
        const nextItem = bucket.find((item) => !usedIds.has(String(item.id)));
        if (nextItem && selected.length < limit) {
          selected.push(nextItem);
          usedIds.add(String(nextItem.id));
        }
      }
    }

    if (selected.length >= limit) return selected.slice(0, limit);

    const fallback = items.filter((item) => !usedIds.has(String(item.id)));
    return [...selected, ...fallback].slice(0, limit);
  };

  const finalProductsToShow = selectMixedBrandProducts(normalizedProducts, 18);

  return (
    <section className="home-brand-section bg-gray-50 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500 sm:text-sm">
              Trusted CCTV Brands
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
              Shop by Top Security Brands
            </h2>
          </div>

          <Link
            className="home-brand-link inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-amber-600"
            to="/brands"
          >
            View All Brands
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="relative mt-6 sm:mt-10" aria-label="Shop products by brand">
          <button
            type="button"
            onClick={() => scrollBrands(-1)}
            aria-label="Scroll brands left"
            className="home-brand-arrow absolute left-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-amber-400 hover:text-slate-950 sm:h-9 sm:w-9"
          >
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scrollBrands(1)}
            aria-label="Scroll brands right"
            className="home-brand-arrow absolute right-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-amber-400 hover:text-slate-950 sm:h-9 sm:w-9"
          >
            <ChevronRight size={16} />
          </button>

          <div
            ref={brandRailRef}
            className={`brand-marquee mt-6 sm:mt-10 ${draggingBrands ? "cursor-grabbing" : "cursor-grab"}`}
            onPointerDown={startBrandDrag}
            onPointerMove={moveBrandDrag}
            onPointerUp={stopBrandDrag}
            onPointerCancel={stopBrandDrag}
            onPointerLeave={stopBrandDrag}
          >
            <div className="brand-marquee-track home-brand-track">
              {[...brands, ...brands].map((brand, index) => (
                <Link
                  key={`${brand.name}-${index}`}
                  to={`/products?brand=${encodeURIComponent(brand.name)}`}
                  aria-label={`Shop ${brand.name} products`}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="brand-marquee-card home-brand-card flex items-center justify-center rounded-2xl bg-white p-3 shadow transition hover:shadow-xl sm:p-6"
                >
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    draggable="false"
                    className="h-8 object-contain sm:h-10"
                  />
                </Link>
              ))}
          </div>
        </div>
        </div>

        <div className="mt-10 rounded-3xl bg-[#0A1931] p-5 text-white sm:mt-14 sm:p-8 lg:mt-20 lg:flex lg:items-center lg:justify-between lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400 sm:text-sm">
              FLASH SALE
            </p>

            <h2 className="mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
              Up to 40% OFF
            </h2>

            <p className="mt-2 text-xs text-gray-300 sm:mt-4 sm:text-sm">
              CCTV • Laptops • Networking • Drones • Gaming
            </p>
          </div>

          <div className="mt-6 flex gap-2.5 sm:mt-8 lg:mt-0 lg:gap-5">
            {saleTime.map((item, index) => (
              <div
                key={index}
                aria-label={`${String(item).padStart(2, "0")} ${saleLabels[index]}`}
                className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-white text-black sm:h-16 sm:w-16 lg:h-20 lg:w-20"
              >
                <Clock3 size={14} />
                <span className="text-base font-bold sm:text-xl lg:text-2xl">
                  {String(item).padStart(2, "0")}
                </span>
                <span className="sr-only">{saleLabels[index]}</span>
              </div>
            ))}
          </div>

        </div>
        <div className="relative mt-10 sm:mt-16">
          <button
            type="button"
            onClick={() => scrollProducts(-1)}
            className="absolute left-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-amber-400 hover:text-slate-950 sm:h-10 sm:w-10"
          >
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scrollProducts(1)}
            aria-label="Scroll featured products right"
            className="absolute right-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-amber-400 hover:text-slate-950 sm:h-10 sm:w-10"
          >
            <ChevronRight size={16} />
          </button>

          <div ref={productRailRef} className="overflow-x-auto pb-2 px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-10">
            <div className="flex min-w-max gap-3 sm:gap-5">
              {finalProductsToShow.map((item) => {
                const isWishlisted = wishlist.includes(item.id);
                const discount = Math.max(5, Math.round(((item.mrp - item.price) / Math.max(item.mrp, 1)) * 100));

                return (
                  <div
                    key={item.id}
                    className="home-featured-product group relative w-[180px] shrink-0 overflow-hidden rounded-[22px] border border-sky-100 bg-gradient-to-b from-white via-sky-50 to-slate-50 shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(14,116,144,0.12)] sm:w-[230px]"
                  >
                    <div className="absolute left-3 top-3 z-10 rounded bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                      {discount}% OFF
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleWishlist(item.id)}
                      className={`absolute right-3 top-3 z-10 rounded-full p-2 shadow-sm transition ${isWishlisted ? "bg-red-50 text-red-500" : "bg-white/90 text-slate-500 hover:text-red-500"}`}
                      aria-label={`Toggle wishlist for ${item.name}`}
                    >
                      <Heart size={14} fill={isWishlisted ? "currentColor" : "none"} />
                    </button>

                    <div className="home-product-image bg-white p-3 pt-8 sm:p-4 sm:pt-10">
                      <Link to={`/products/${item.id}`} className="block">
                        <img
                          src={item.image}
                          className="mx-auto h-28 rounded-xl object-contain transition duration-500 group-hover:scale-105 sm:h-36"
                          alt={item.name}
                        />
                      </Link>
                    </div>

                    <div className="p-3 sm:p-4">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star fill="currentColor" size={12} />
                        <span className="home-featured-rating text-[11px] font-medium text-slate-700 sm:text-xs">{item.rating}</span>
                      </div>

                      <Link
                        to={`/products/${item.id}`}
                        className="home-featured-title mt-2 block text-xs font-semibold leading-snug text-slate-800 transition hover:text-amber-600 sm:mt-3 sm:text-sm"
                      >
                        {item.name}
                      </Link>

                      <div className="mt-2 flex items-center gap-2 sm:mt-3">
                        <span className="home-featured-price text-base font-bold text-[#0A1931] sm:text-xl">
                          {money(item.price)}
                        </span>
                        <span className="home-featured-mrp text-[10px] text-slate-400 line-through sm:text-xs">
                          {money(item.mrp)}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
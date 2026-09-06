import {
  Clock3,
  ChevronRight,
  ShoppingCart,
  Heart,
  Eye,
  Star,
} from "lucide-react";
import { useRef, useState } from "react";
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
  const { addToCart, toggleWishlist, wishlist, products } = useCommerce();
  const brandRailRef = useRef(null);
  const [draggingBrands, setDraggingBrands] = useState(false);
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
    <section className="py-20 bg-gray-50">

      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}

        <div className="flex justify-between items-center">

          <div>

            <p className="text-yellow-500 uppercase font-semibold">
              Trusted CCTV Brands
            </p>

            <h2 className="text-4xl font-bold mt-2">
              Shop by Top Security Brands
            </h2>

          </div>

          <Link to="/brands" className="flex items-center gap-2 font-semibold text-slate-900 hover:text-amber-600">
            View All Brands
            <ChevronRight size={18} />
          </Link>

        </div>

        {/* Brands */}

        <div className="relative mt-10" aria-label="Shop products by brand">
          <button type="button" onClick={() => scrollBrands(-1)} aria-label="Scroll brands left" className="absolute left-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-amber-400 hover:text-slate-950">
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <button type="button" onClick={() => scrollBrands(1)} aria-label="Scroll brands right" className="absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-amber-400 hover:text-slate-950">
            <ChevronRight size={18} />
          </button>
          <div
            ref={brandRailRef}
            className={`brand-marquee mt-10 ${draggingBrands ? "cursor-grabbing" : "cursor-grab"}`}
            onPointerDown={startBrandDrag}
            onPointerMove={moveBrandDrag}
            onPointerUp={stopBrandDrag}
            onPointerCancel={stopBrandDrag}
            onPointerLeave={stopBrandDrag}
          >
          <div className="brand-marquee-track">
            {[...brands, ...brands].map((brand, index) => (
              <Link
                key={`${brand.name}-${index}`}
                to={`/products?brand=${encodeURIComponent(brand.name)}`}
                aria-label={`Shop ${brand.name} products`}
                onPointerDown={(event) => event.stopPropagation()}
                className="brand-marquee-card bg-white rounded-2xl p-6 shadow hover:shadow-xl transition flex items-center justify-center"
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  draggable="false"
                  className="h-10 object-contain"
                />
              </Link>
            ))}
          </div>
          </div>
        </div>

        {/* Flash Sale */}

        <div className="mt-20 rounded-3xl bg-[#0A1931] text-white p-10 flex flex-col lg:flex-row justify-between items-center">

          <div>

            <p className="text-yellow-400 font-semibold">
              FLASH SALE
            </p>

            <h2 className="text-4xl font-bold mt-3">
              Up to 40% OFF
            </h2>

            <p className="mt-4 text-gray-300">
              CCTV • Laptops • Networking • Drones • Gaming
            </p>

          </div>

          <div className="flex gap-5 mt-8 lg:mt-0">

            {["12", "08", "45", "21"].map((item, index) => (

              <div
                key={index}
                className="bg-white text-black rounded-xl w-20 h-20 flex flex-col justify-center items-center"
              >
                <Clock3 size={18}/>
                <span className="text-2xl font-bold">
                  {item}
                </span>
              </div>

            ))}

          </div>

        </div>

        {/* Featured Products */}

        <div className="relative mt-16">
          <button
            type="button"
            onClick={() => scrollProducts(-1)}
            aria-label="Scroll featured products left"
            className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-amber-400 hover:text-slate-950"
          >
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scrollProducts(1)}
            aria-label="Scroll featured products right"
            className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-amber-400 hover:text-slate-950"
          >
            <ChevronRight size={18} />
          </button>

          <div ref={productRailRef} className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-10">
            <div className="flex min-w-max gap-5">

            {finalProductsToShow.map((item) => {
              const isWishlisted = wishlist.includes(item.id);
              const discount = Math.max(5, Math.round(((item.mrp - item.price) / Math.max(item.mrp, 1)) * 100));

              return (
                <div
                  key={item.id}
                  className="group relative w-[230px] shrink-0 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                >
                  <div className="absolute left-3 top-3 z-10 rounded bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                    {discount}% OFF
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleWishlist(item.id)}
                    className={`absolute right-3 top-3 z-10 rounded-full p-2 shadow-sm transition ${isWishlisted ? "bg-red-50 text-red-500" : "bg-white/90 text-slate-500 hover:text-red-500"}`}
                    aria-label={`Toggle wishlist for ${item.name}`}
                  >
                    <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
                  </button>

                  <div className="bg-slate-100 p-4 pt-10">
                    <Link to={`/products/${item.id}`} className="block">
                      <img
                        src={item.image}
                        className="mx-auto h-36 object-contain transition duration-500 group-hover:scale-105"
                        alt={item.name}
                      />
                    </Link>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star fill="currentColor" size={13} />
                      <span className="text-xs font-medium text-slate-700">{item.rating}</span>
                    </div>

                    <Link to={`/products/${item.id}`} className="mt-3 block text-sm font-semibold leading-snug text-slate-800 transition hover:text-amber-600">
                      {item.name}
                    </Link>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xl font-bold text-[#0A1931]">
                        {money(item.price)}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        {money(item.mrp)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(item.id)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#071426] px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <ShoppingCart size={15} />
                      Add to cart
                    </button>
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
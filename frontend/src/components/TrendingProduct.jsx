import { Heart, Star, ShoppingCart, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { useCommerce } from "../context/index.js";
import { money, normalizeProduct } from "../lib/products";

const isCameraOnlyProduct = (product) => {
  const haystack = `${product?.name || ""} ${product?.category || ""} ${product?.subCategory || ""}`.toLowerCase();

  const hasCameraSignal = /(cctv|camera|surveillance|bullet|dome|ptz|ip camera|wifi camera|wireless camera|security camera|fisheye|anpr|thermal camera|outdoor camera|indoor camera|analog camera|network camera|smart camera|video door)/.test(haystack);
  const hasNonCameraSignal = /(printer|thermal printer|laptop|desktop|monitor|keyboard|mouse|router|switch|nvr|dvr|ups|smps|battery|adapter|mount|bracket|stand|holder|connector|cable|server|storage|drive|module|accessory|junction box|power supply|power adapter|display|housing|trim)/.test(haystack);

  return hasCameraSignal && !hasNonCameraSignal;
};

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

export default function TrendingProducts() {
  const { addToCart, toggleWishlist, wishlist, products } = useCommerce();
  const productRailRef = useRef(null);
  const allProducts = (Array.isArray(products) ? products : []).map(normalizeProduct).filter(Boolean);
  const cameraProducts = allProducts.filter(isCameraOnlyProduct);
  const trendingProducts = selectMixedBrandProducts(cameraProducts, 18);

  const scrollProducts = (direction) => {
    productRailRef.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
  };

  return (
    <section className="w-full px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-5">
        <h2 className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">CCTV & Security Products</h2>

        <Link
          to="/products"
          className="shrink-0 text-xs font-semibold text-blue-600 hover:text-amber-500 sm:text-sm"
        >
          View All Products →
        </Link>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollProducts(-1)}
          aria-label="Scroll trending products left"
          className="absolute left-0 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-amber-400 hover:text-slate-950 sm:h-10 sm:w-10"
        >
          <ChevronRight size={18} className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => scrollProducts(1)}
          aria-label="Scroll trending products right"
          className="absolute right-0 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-amber-400 hover:text-slate-950 sm:h-10 sm:w-10"
        >
          <ChevronRight size={18} />
        </button>

        <div ref={productRailRef} className="overflow-x-auto pb-1.5 pl-9 pr-9 sm:pb-2 sm:pl-10 sm:pr-10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2.5 sm:gap-4">
          {trendingProducts.map((product) => {
            const isWishlisted = wishlist.includes(product.id);
            const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

            return (
              <article
                key={product.id}
                className="group relative w-[185px] shrink-0 rounded-xl border border-slate-200 bg-white p-3 transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg sm:w-[240px] sm:p-4"
              >
              <span className="absolute left-2 top-2 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white sm:left-3 sm:top-3 sm:px-2 sm:py-1 sm:text-[10px]">
                {discount}% OFF
              </span>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`absolute right-2 top-2 rounded-full p-1.5 sm:right-3 sm:top-3 sm:p-2 ${isWishlisted ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-400 hover:text-red-500"}`}
                aria-label={`Add ${product.name} to wishlist`}
              >
                <Heart size={16} className="sm:h-[19px] sm:w-[19px]" fill={isWishlisted ? "currentColor" : "none"} />
              </button>

              <Link to={`/products/${product.id}`}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="mt-4 h-28 w-full object-contain transition group-hover:scale-105 sm:mt-5 sm:h-35"
                />

                <h3 className="mt-2 min-h-9 text-xs font-semibold leading-4 text-slate-800 sm:mt-4 sm:min-h-10 sm:text-sm sm:leading-normal">
                  {product.name}
                </h3>

                <div className="mt-1.5 flex items-center gap-1.5 sm:mt-2 sm:gap-2">
                  <span className="text-base font-bold text-slate-900 sm:text-lg">
                    {money(product.price)}
                  </span>
                  <span className="text-[10px] text-slate-400 line-through sm:text-xs">
                    {money(product.mrp)}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-0.5 sm:mt-3 sm:gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={12}
                      className="fill-amber-400 text-amber-400 sm:h-[14px] sm:w-[14px]"
                    />
                  ))}
                  <span className="ml-1 text-[10px] text-slate-500 sm:text-xs">
                    ({product.reviews})
                  </span>
                </div>
              </Link>

                <button
                  type="button"
                  onClick={() => addToCart(product.id)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#071426] px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:mt-4 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <ShoppingCart size={14} className="sm:h-4 sm:w-4" />
                  Add to cart
                </button>
              </article>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}
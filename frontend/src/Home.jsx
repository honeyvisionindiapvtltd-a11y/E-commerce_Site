import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "./context/useAuth.js";
import { useCatalog } from "./context/CatalogContext.jsx";
import { money, normalizeProduct } from "./lib/products";
import { getRecentlyViewed, RECENTLY_VIEWED_EVENT } from "./lib/recentlyViewed";
import Hero from "./components/Hero";
import ServicesOffers from "./components/ServicesOffers";
import TrendingProduct from "./components/TrendingProduct";
import FeaturedSection from "./components/FeaturedSection";

import InstallationSection from "./components/InstallationSection";
// import Testimonals from "./components/Testimonals";
import AutoProductShowcase from "./components/AutoProductShowcase";
import ShopByCategory from "./components/ShopByCategory";
import BenefitsStrip from "./components/BenefitsStrip";
import PromotionalBanners from "./components/PromotionalBanners";


function RecentlyViewedSection() {
  const { products } = useCatalog();
  const { user } = useAuth();
  const userId = user?.id || user?._id || null;
  const viewedScope = userId == null ? "guest" : String(userId);
  const [viewedState, setViewedState] = useState({ scope: viewedScope, ids: [] });

  useEffect(() => {
    const readViewedIds = () => {
      setViewedState({ scope: viewedScope, ids: getRecentlyViewed(userId).slice(0, 4) });
    };

    readViewedIds();
    window.addEventListener("storage", readViewedIds);
    window.addEventListener(RECENTLY_VIEWED_EVENT, readViewedIds);
    window.addEventListener("focus", readViewedIds);
    return () => {
      window.removeEventListener("storage", readViewedIds);
      window.removeEventListener(RECENTLY_VIEWED_EVENT, readViewedIds);
      window.removeEventListener("focus", readViewedIds);
    };
  }, [userId, viewedScope]);

  const catalog = (Array.isArray(products) ? products : [])
    .map(normalizeProduct)
    .filter((product) => product?.id);
  const viewedIds = viewedState.scope === viewedScope ? viewedState.ids : [];
  const viewedProducts = viewedIds
    .map((id) => catalog.find((product) => String(product.id) === String(id)))
    .filter(Boolean);

  if (!viewedProducts.length) return null;

  return (
    <section className="home-section-shell bg-white/70 py-7 sm:py-9">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase text-amber-600">Pick up where you left off</p>
            <h2 className="mt-1 text-xl font-extrabold text-[#071426] sm:text-2xl">Recently viewed</h2>
          </div>
          <Link to="/products" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600 hover:text-amber-600 sm:text-sm">
            View all <ArrowRight size={15} />
          </Link>
        </div>

        <div className="recently-viewed-home-list flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {viewedProducts.map((product) => (
            <Link
              key={product.id}
              to={`/products/${encodeURIComponent(product.id)}`}
              className="recently-viewed-home-card group min-w-[160px] max-w-[220px] flex-[0_0_160px] snap-start overflow-hidden rounded-lg border border-slate-200 bg-white p-2.5 transition hover:border-amber-300 hover:shadow-md sm:min-w-[205px] sm:flex-[0_0_205px] sm:p-3"
            >
              <div className="flex h-28 items-center justify-center rounded-md bg-slate-50 sm:h-36">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-contain p-2 transition group-hover:scale-105"
                />
              </div>
              <h3 className="mt-2 line-clamp-2 min-h-8 text-xs font-bold leading-4 text-slate-800 sm:text-sm">
                {product.name}
              </h3>
              <p className="mt-1 text-sm font-extrabold text-[#071426]">
                {money(product.price)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


export default function Home() {
  return (
    <div className="home-shell">
      <div className="home-ambient one" />
      <div className="home-ambient two" />
      <div className="home-ambient three" />

      <div className="relative z-10 flex flex-col gap-4 sm:gap-8">
        <Hero />

        <div className="home-section-shell home-section-category px-3 pt-2 sm:px-6">
          <ShopByCategory />
        </div>

        <div className="home-section-shell home-section-benefits px-3 sm:px-6">
          <BenefitsStrip />
        </div>

        <div className="home-section-shell home-section-trending bg-white/55 px-0 sm:px-6">
          <TrendingProduct />
        </div>

        <div className="home-section-shell home-section-promos px-3 sm:px-6">
          <PromotionalBanners />
        </div>

        <RecentlyViewedSection />

        <div className="home-section-shell home-section-featured px-0 sm:px-6">
          <FeaturedSection />
        </div>

        <div className="home-section-shell home-section-installation px-3 sm:px-6">
          <InstallationSection />
        </div>

        <div className="home-section-shell home-section-subcategories px-3 sm:px-6">
          <ShopByCategory mode="subcategories" title="Explore Subcategories" />
        </div>

        <div className="home-section-shell home-section-services px-3 sm:px-6">
          <ServicesOffers />
        </div>

        <div className="home-section-shell home-section-catalog px-3 sm:px-6">
          <AutoProductShowcase />
        </div>
      </div>
    </div>
  );
}
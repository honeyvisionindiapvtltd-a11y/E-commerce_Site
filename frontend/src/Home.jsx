import Hero from "./components/Hero";
import ServicesOffers from "./components/ServicesOffers";
import TrendingProduct from "./components/TrendingProduct";
import FeaturedSection from "./components/FeaturedSection";

import InstallationSection from "./components/InstallationSection";
// import Testimonals from "./components/Testimonals";
import BlogSection from "./components/BlogSection";
import ShopByCategory from "./components/ShopByCategory";
import BenefitsStrip from "./components/BenefitsStrip";
import PromotionalBanners from "./components/PromotionalBanners";



export default function Home() {
  return (
    <div className="home-shell">
      <div className="home-ambient one" />
      <div className="home-ambient two" />
      <div className="home-ambient three" />

      <div className="relative z-10">
        <Hero />

        <div className="home-section-shell px-3 pb-8 pt-2 sm:px-6">
          <ShopByCategory />
        </div>

        <div className="home-section-shell px-3 pb-8 sm:px-6">
          <BenefitsStrip />
        </div>

        <div className="home-section-shell bg-white/55 px-3 pb-8 sm:px-6">
          <TrendingProduct />
        </div>

        <div className="home-section-shell px-3 pb-8 sm:px-6">
          <PromotionalBanners />
        </div>

        <div className="home-section-shell px-3 pb-8 sm:px-6">
          <FeaturedSection />
        </div>

        <div className="home-section-shell px-3 pb-8 sm:px-6">
          <InstallationSection />
        </div>

        <div className="home-section-shell px-3 pb-8 sm:px-6">
          <ServicesOffers />
        </div>

        <div className="home-section-shell px-3 pb-8 sm:px-6">
          <BlogSection />
        </div>
      </div>
    </div>
  );
}
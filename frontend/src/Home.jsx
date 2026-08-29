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
    <>
      <Hero />

      <ShopByCategory />
      <BenefitsStrip />

      <div className="bg-white">
        <TrendingProduct />
      </div>

      <div className="bg-slate-50 py-2">
        <PromotionalBanners />
      </div>

      <FeaturedSection />
      <InstallationSection />
      <ServicesOffers />
      {/* <Testimonals /> */}
      <BlogSection />
    </>
  );
}
import Hero from "./components/Hero";
import ServicesOffers from "./components/ServicesOffers";
import TrendingProduct from "./components/TrendingProduct";
import FeaturedSection from "./components/FeaturedSection";

import InstallationSection from "./components/InstallationSection";
import Testimonals from "./components/Testimonals";
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
      <PromotionalBanners />     
       <TrendingProduct />
        <FeaturedSection />
        <InstallationSection />
         <ServicesOffers />
        <Testimonals />
        <BlogSection />
    </>
  );
}
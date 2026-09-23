import { Link, useNavigate } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Send,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
  FaYoutube,
} from 'react-icons/fa'
import { companyInfo } from "../config/companyInfo.js";

export default function Footer() {
  const navigate = useNavigate();

  const categoryLinks = [
    ["Laptops", "laptops"],
    ["Desktop PCs", "desktop-pcs"],
    ["CCTV Cameras", "cctv-cameras"],
    ["Drones", "drones"],
    ["Networking", "networking"],
    ["Storage", "storage"],
    ["Gaming", "gaming"],
    ["Printers", "printers"],
  ];

  const supportLinks = [
    ["Contact Us", "/contact"],
    ["Track Order", "/order-tracking"],
    ["Installation Service", "/installation"],
    ["AMC Plans", "/amc"],
    ["Warranty", "/warranty"],
    ["Returns", "/contact?topic=returns"],
    ["FAQs", "/faqs"],
  ];

  const companyLinks = [
    ["About Us", "/about"],
    ["Solutions", "/solutions"],
    ["Technology", "/technology"],
    ["Industries", "/industries"],
    ["Blogs", "/blogs"],
    ["Privacy Policy", "/privacy-policy"],
    ["Terms & Conditions", "/terms"],
  ];

  const socialLinks = [
    [FaFacebookF, companyInfo.socialLinks.facebook, "Facebook"],
    [FaInstagram, companyInfo.socialLinks.instagram, "Instagram"],
    [FaLinkedinIn, companyInfo.socialLinks.linkedin, "LinkedIn"],
    [FaTwitter, companyInfo.socialLinks.twitter, "Twitter"],
    [FaYoutube, companyInfo.socialLinks.youtube, "YouTube"],
  ];

  const handleSubscribe = () => {
    navigate("/contact");
  };

  const handleBrochure = () => {
    navigate("/contact?topic=brochure");
  };

  return (
    <footer className="bg-[#06142B] text-gray-300">

      {/* Top Section */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">

        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-10 lg:grid-cols-5">

          {/* Company */}

          <div className="col-span-2 lg:col-span-1">

            <img
              src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1788235324/logo1_fzsjda.png"
              alt="Honey Vision"
              className="h-10 sm:h-12"
            />

            <p className="mt-4 max-w-sm text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">
              Honey Vision is your trusted destination
              for laptops, desktops, CCTV cameras,
              drones, networking equipment,
              smart home solutions and enterprise
              IT infrastructure with professional
              installation services.
            </p>

            <div className="mt-5 space-y-2.5 text-xs sm:mt-6 sm:space-y-3 sm:text-sm">

              <div className="flex gap-3">
                <MapPin size={16} className="shrink-0 text-yellow-400"/>
                <a href={companyInfo.locationHref} target="_blank" rel="noreferrer" className="hover:text-yellow-400">
                  {companyInfo.location}
                </a>
              </div>

              <div className="flex gap-3">
                <Phone size={16} className="shrink-0 text-yellow-400"/>
                <a href={`tel:${companyInfo.phoneRaw}`} className="hover:text-yellow-400">
                  {companyInfo.phone}
                </a>
              </div>

              <div className="flex gap-3">
                <Mail size={16} className="shrink-0 text-yellow-400"/>
                <a href={`mailto:${companyInfo.supportEmail}`} className="hover:text-yellow-400">
                  {companyInfo.supportEmail}
                </a>
              </div>

            </div>

          </div>

          {/* Categories */}

          <div>

            <h3 className="mb-3 text-sm font-semibold text-white sm:mb-5 sm:text-lg">
              Categories
            </h3>

            <ul className="space-y-2 text-xs sm:space-y-3 sm:text-sm">

              {categoryLinks.map(([label, slug]) => (
                <li key={slug}>
                  <Link to={`/products?category=${slug}`} className="transition hover:text-yellow-400">{label}</Link>
                </li>
              ))}

            </ul>

          </div>

          {/* Customer Support */}

          <div>

            <h3 className="mb-3 text-sm font-semibold text-white sm:mb-5 sm:text-lg">
              Customer Support
            </h3>

            <ul className="space-y-2 text-xs sm:space-y-3 sm:text-sm">

              {supportLinks.map(([label, path]) => (
                <li key={path}>
                  <Link to={path} className="transition hover:text-yellow-400">{label}</Link>
                </li>
              ))}

            </ul>

          </div>

          {/* Company */}

          <div>

            <h3 className="mb-3 text-sm font-semibold text-white sm:mb-5 sm:text-lg">
              Company
            </h3>

            <ul className="space-y-2 text-xs sm:space-y-3 sm:text-sm">

              {companyLinks.map(([label, path]) => (
                <li key={path}>
                  <Link to={path} className="transition hover:text-yellow-400">{label}</Link>
                </li>
              ))}

            </ul>

          </div>

          {/* Newsletter */}

          <div className="col-span-2 lg:col-span-1">

            <h3 className="mb-3 text-sm font-semibold text-white sm:mb-5 sm:text-lg">
              Stay Updated
            </h3>

            <p className="max-w-sm text-xs leading-5 sm:text-sm sm:leading-6">
              Subscribe to receive the latest
              product launches, offers and
              technology updates.
            </p>

            <div className="mt-4 flex sm:mt-5">

              <input
                type="email"
                placeholder="Enter email"
                className="w-full min-w-0 rounded-l-lg px-3 py-2.5 text-sm text-black outline-none"
              />

              <button type="button" onClick={handleSubscribe} aria-label="Subscribe" className="rounded-r-lg bg-yellow-500 px-4 hover:bg-yellow-600">

                <Send size={17} className="text-black"/>

              </button>

            </div>

            <button type="button" onClick={handleBrochure} className="mt-4 w-full rounded-lg bg-yellow-500 py-2.5 text-sm font-semibold text-black hover:bg-yellow-600 sm:mt-5">
              Request Brochure
            </button>

          </div>

        </div>

      </div>

      {/* Features */}

      <div className="border-t border-gray-700">

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7">

          <div className="grid grid-cols-2 gap-4 text-center sm:gap-6 lg:grid-cols-4">

            <div>
              <span className="text-lg">🚚</span> <h4 className="mt-1 text-xs font-semibold text-white sm:text-sm">Fast Delivery</h4>
            </div>

            <div>
              <span className="text-lg">🛠</span> <h4 className="mt-1 text-xs font-semibold text-white sm:text-sm">Professional Installation</h4>
            </div>

            <div>
              <span className="text-lg">🛡</span> <h4 className="mt-1 text-xs font-semibold text-white sm:text-sm">100% Genuine Products</h4>
            </div>

            <div>
              <span className="text-lg">📞</span> <h4 className="mt-1 text-xs font-semibold text-white sm:text-sm">24×7 Technical Support</h4>
            </div>

          </div>

        </div>

      </div>

      {/* Bottom Footer */}

      <div className="border-t border-gray-700">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-center text-xs sm:px-6 sm:py-5 sm:text-sm lg:flex-row lg:text-left">

          <p>
            © 2026 Honey Vision Pvt. Ltd. All Rights Reserved.
          </p>

          <div className="mt-1 flex gap-4 lg:mt-0">

            {socialLinks.map(([Icon, href, label]) => href ? (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="transition hover:text-yellow-400">
                <Icon />
              </a>
            ) : null)}

          </div>

        </div>

      </div>

    </footer>
  );
}
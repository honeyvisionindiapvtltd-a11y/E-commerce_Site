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

const categoryLinks = [
  ["Laptops", "/products?category=computers-laptops"],
  ["Desktop PCs", "/products?category=computers-laptops"],
  ["CCTV Cameras", "/products?category=cctv-cameras"],
  ["Drones", "/products?category=drones"],
  ["Networking", "/products?category=networking-products"],
  ["Storage", "/products?category=storage-hard-drives"],
  ["Gaming", "/products?category=gaming"],
  ["Printers", "/products?category=printers-scanners"],
];

const supportLinks = [
  ["Contact Us", "/contact"],
  ["Track Order", "/order-tracking"],
  ["Installation Service", "/installation"],
  ["AMC Plans", "/amc"],
  ["Warranty", "/warranty"],
  ["Returns", "/contact"],
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

export default function Footer() {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    navigate("/contact");
  };

  const handleBrochure = () => {
    window.open("https://www.honeyvision.in", "_blank", "noopener,noreferrer");
  };

  return (
    <footer className="bg-[#06142B] text-gray-300">

      {/* Top Section */}

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">

        <div className="grid grid-cols-2 gap-x-5 gap-y-5 sm:gap-7 lg:grid-cols-5">

          {/* Company */}

          <div className="col-span-2 lg:col-span-1">

            <img
              src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1788235324/logo1_fzsjda.png"
              alt="Honey Vision"
              className="h-8 sm:h-10"
            />

            <p className="mt-3 max-w-sm text-[11px] leading-4 text-slate-300 sm:text-xs sm:leading-5">
              Honey Vision is your trusted destination
              for laptops, desktops, CCTV cameras,
              drones, networking equipment,
              smart home solutions and enterprise
              IT infrastructure with professional
              installation services.
            </p>

            <div className="mt-4 space-y-2 text-[11px] sm:mt-5 sm:space-y-2.5 sm:text-xs">

              <div className="flex gap-3">
                <MapPin size={16} className="shrink-0 text-yellow-400"/>
                Bengaluru, India
              </div>

              <a href="tel:+919999999999" className="flex gap-3 hover:text-yellow-400">
                <Phone size={16} className="shrink-0 text-yellow-400"/>
                +91 XXXXX XXXXX
              </a>

              <a href="mailto:support@honeyvision.in" className="flex gap-3 hover:text-yellow-400">
                <Mail size={16} className="shrink-0 text-yellow-400"/>
                support@honeyvision.in
              </a>

            </div>

          </div>

          {/* Categories */}

          <div>

            <h3 className="mb-2 text-xs font-semibold text-white sm:mb-3 sm:text-sm">
              Categories
            </h3>

            <ul className="space-y-1.5 text-[11px] sm:space-y-2 sm:text-xs">

              {categoryLinks.map(([label, to]) => <li key={label}><Link to={to} className="hover:text-yellow-400">{label}</Link></li>)}

            </ul>

          </div>

          {/* Customer Support */}

          <div>

            <h3 className="mb-2 text-xs font-semibold text-white sm:mb-3 sm:text-sm">
              Customer Support
            </h3>

            <ul className="space-y-1.5 text-[11px] sm:space-y-2 sm:text-xs">

              {supportLinks.map(([label, to]) => <li key={label}><Link to={to} className="hover:text-yellow-400">{label}</Link></li>)}

            </ul>

          </div>

          {/* Company */}

          <div>

            <h3 className="mb-2 text-xs font-semibold text-white sm:mb-3 sm:text-sm">
              Company
            </h3>

            <ul className="space-y-1.5 text-[11px] sm:space-y-2 sm:text-xs">

              {companyLinks.map(([label, to]) => <li key={label}><Link to={to} className="hover:text-yellow-400">{label}</Link></li>)}

            </ul>

          </div>

          {/* Newsletter */}

          <div className="col-span-2 lg:col-span-1">

            <h3 className="mb-2 text-xs font-semibold text-white sm:mb-3 sm:text-sm">
              Stay Updated
            </h3>

            <p className="max-w-sm text-[11px] leading-4 sm:text-xs sm:leading-5">
              Subscribe to receive the latest
              product launches, offers and
              technology updates.
            </p>

            <div className="mt-3 flex sm:mt-4">

              <input
                type="email"
                placeholder="Enter email"
                className="w-full min-w-0 rounded-l-lg px-3 py-2 text-xs text-black outline-none"
              />

              <button type="button" onClick={handleSubscribe} aria-label="Subscribe" className="rounded-r-lg bg-yellow-500 px-4 hover:bg-yellow-600">

                <Send size={17} className="text-black"/>

              </button>

            </div>

              <button type="button" onClick={handleBrochure} className="mt-3 w-full rounded-lg bg-yellow-500 py-2 text-xs font-semibold text-black hover:bg-yellow-600 sm:mt-4">
              Download Brochure
            </button>

          </div>

        </div>

      </div>

      {/* Features */}

      <div className="border-t border-gray-700">

        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">

          <div className="grid grid-cols-2 gap-3 text-center sm:gap-5 lg:grid-cols-4">

            <div>
              <span className="text-base">🚚</span> <h4 className="mt-0.5 text-[11px] font-semibold text-white sm:text-xs">Fast Delivery</h4>
            </div>

            <div>
              <span className="text-base">🛠</span> <h4 className="mt-0.5 text-[11px] font-semibold text-white sm:text-xs">Professional Installation</h4>
            </div>

            <div>
              <span className="text-base">🛡</span> <h4 className="mt-0.5 text-[11px] font-semibold text-white sm:text-xs">100% Genuine Products</h4>
            </div>

            <div>
              <span className="text-base">📞</span> <h4 className="mt-0.5 text-[11px] font-semibold text-white sm:text-xs">24×7 Technical Support</h4>
            </div>

          </div>

        </div>

      </div>

      {/* Bottom Footer */}

      <div className="border-t border-gray-700">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-3 text-center text-[11px] sm:px-6 sm:py-4 sm:text-xs lg:flex-row lg:text-left">

          <p>
            © 2026 Honey Vision Pvt. Ltd. All Rights Reserved.
          </p>

          <div className="mt-1 flex gap-4 lg:mt-0">

            <a href="https://www.facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-yellow-400"><FaFacebookF /></a>
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-yellow-400"><FaInstagram /></a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-yellow-400"><FaLinkedinIn /></a>
            <a href="https://www.twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="hover:text-yellow-400"><FaTwitter /></a>
            <a href="https://www.youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="hover:text-yellow-400"><FaYoutube /></a>

          </div>

        </div>

      </div>

    </footer>
  );
}
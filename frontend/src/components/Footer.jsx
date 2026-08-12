import { useNavigate } from "react-router-dom";
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

      <div className="max-w-7xl mx-auto px-6 py-16">

        <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-10">

          {/* Company */}

          <div>

            <img
              src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1786269504/logo.png_tun5nq.png"
              alt="Honey Vision"
              className="h-14"
            />

            <p className="mt-6 leading-7">
              Honey Vision is your trusted destination
              for laptops, desktops, CCTV cameras,
              drones, networking equipment,
              smart home solutions and enterprise
              IT infrastructure with professional
              installation services.
            </p>

            <div className="space-y-4 mt-8">

              <div className="flex gap-3">
                <MapPin className="text-yellow-400"/>
                Bengaluru, India
              </div>

              <div className="flex gap-3">
                <Phone className="text-yellow-400"/>
                +91 XXXXX XXXXX
              </div>

              <div className="flex gap-3">
                <Mail className="text-yellow-400"/>
                support@honeyvision.in
              </div>

            </div>

          </div>

          {/* Categories */}

          <div>

            <h3 className="text-white text-xl font-semibold mb-6">
              Categories
            </h3>

            <ul className="space-y-3">

              <li>Laptops</li>
              <li>Desktop PCs</li>
              <li>CCTV Cameras</li>
              <li>Drones</li>
              <li>Networking</li>
              <li>Storage</li>
              <li>Gaming</li>
              <li>Printers</li>

            </ul>

          </div>

          {/* Customer Support */}

          <div>

            <h3 className="text-white text-xl font-semibold mb-6">
              Customer Support
            </h3>

            <ul className="space-y-3">

              <li>Contact Us</li>
              <li>Track Order</li>
              <li>Installation Service</li>
              <li>AMC Plans</li>
              <li>Warranty</li>
              <li>Returns</li>
              <li>FAQs</li>

            </ul>

          </div>

          {/* Company */}

          <div>

            <h3 className="text-white text-xl font-semibold mb-6">
              Company
            </h3>

            <ul className="space-y-3">

              <li>About Us</li>
              <li>Solutions</li>
              <li>Technology</li>
              <li>Industries</li>
              <li>Blogs</li>
              <li>Privacy Policy</li>
              <li>Terms & Conditions</li>

            </ul>

          </div>

          {/* Newsletter */}

          <div>

            <h3 className="text-white text-xl font-semibold mb-6">
              Stay Updated
            </h3>

            <p>
              Subscribe to receive the latest
              product launches, offers and
              technology updates.
            </p>

            <div className="flex mt-6">

              <input
                type="email"
                placeholder="Enter email"
                className="w-full rounded-l-lg px-4 py-3 text-black outline-none"
              />

              <button type="button" onClick={handleSubscribe} className="bg-yellow-500 px-5 rounded-r-lg hover:bg-yellow-600">

                <Send className="text-black"/>

              </button>

            </div>

            <button type="button" onClick={handleBrochure} className="w-full mt-6 bg-yellow-500 text-black py-3 rounded-xl font-semibold hover:bg-yellow-600">
              Download Brochure
            </button>

          </div>

        </div>

      </div>

      {/* Features */}

      <div className="border-t border-gray-700">

        <div className="max-w-7xl mx-auto px-6 py-8">

          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 text-center">

            <div>
              🚚 <h4 className="font-semibold text-white mt-2">Fast Delivery</h4>
            </div>

            <div>
              🛠 <h4 className="font-semibold text-white mt-2">Professional Installation</h4>
            </div>

            <div>
              🛡 <h4 className="font-semibold text-white mt-2">100% Genuine Products</h4>
            </div>

            <div>
              📞 <h4 className="font-semibold text-white mt-2">24×7 Technical Support</h4>
            </div>

          </div>

        </div>

      </div>

      {/* Bottom Footer */}

      <div className="border-t border-gray-700">

        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col lg:flex-row justify-between items-center">

          <p>
            © 2026 Honey Vision Pvt. Ltd. All Rights Reserved.
          </p>

          <div className="flex gap-5 mt-5 lg:mt-0">

            <FaFacebookF className="hover:text-yellow-400 cursor-pointer"/>
            <FaInstagram className="hover:text-yellow-400 cursor-pointer"/>
            <FaLinkedinIn className="hover:text-yellow-400 cursor-pointer"/>
            <FaTwitter className="hover:text-yellow-400 cursor-pointer"/>
            <FaYoutube className="hover:text-yellow-400 cursor-pointer"/>

          </div>

        </div>

      </div>

    </footer>
  );
}
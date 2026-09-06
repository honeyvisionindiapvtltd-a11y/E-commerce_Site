import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter, FaYoutube } from "react-icons/fa";
import { companyInfo } from "../config/companyInfo.js";
import { slugifyCategory } from "../lib/products.js";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const categories = ["Laptops", "Desktop PCs", "CCTV Cameras", "Drones", "Networking", "Storage", "Gaming", "Printers"];
const socialIcons = { facebook: FaFacebookF, instagram: FaInstagram, linkedin: FaLinkedinIn, twitter: FaTwitter, youtube: FaYoutube };

export default function Footer() {
  const [email, setEmail] = useState("");
  const [newsletterState, setNewsletterState] = useState({ loading: false, message: "", error: false });

  const handleSubscribe = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setNewsletterState({ loading: false, message: "Enter a valid email address.", error: true });
      return;
    }
    setNewsletterState({ loading: true, message: "", error: false });
    try {
      const response = await fetch(`${API_BASE}/newsletter/subscribe`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: normalizedEmail }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to subscribe right now.");
      setEmail("");
      setNewsletterState({ loading: false, message: data.message || "You are subscribed.", error: false });
    } catch (error) {
      setNewsletterState({ loading: false, message: error.message, error: true });
    }
  };

  const linkClass = "transition hover:text-yellow-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400";
  const brochureUrl = import.meta.env.VITE_BROCHURE_URL || "";
  const configuredSocials = Object.entries(companyInfo.socialLinks).filter(([, url]) => url);

  return <footer className="bg-[#06142B] text-gray-300">
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-10">
        <div>
          <img src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1786269504/logo.png_tun5nq.png" alt="Honey Vision" className="h-14" />
          <p className="mt-6 leading-7">Honey Vision is your trusted destination for laptops, desktops, CCTV cameras, drones, networking equipment, smart home solutions and enterprise IT infrastructure with professional installation services.</p>
          <div className="space-y-4 mt-8">
            <a href={companyInfo.locationHref} target="_blank" rel="noreferrer" className={`flex gap-3 ${linkClass}`}><MapPin className="text-yellow-400" />{companyInfo.location}</a>
            <a href={`tel:${companyInfo.phoneRaw}`} className={`flex gap-3 ${linkClass}`}><Phone className="text-yellow-400" />{companyInfo.phone}</a>
            <a href={`mailto:${companyInfo.supportEmail}`} className={`flex gap-3 ${linkClass}`}><Mail className="text-yellow-400" />{companyInfo.supportEmail}</a>
          </div>
        </div>
        <div><h3 className="text-white text-xl font-semibold mb-6">Categories</h3><ul className="space-y-3">{categories.map((category) => <li key={category}><Link className={linkClass} to={`/products?category=${encodeURIComponent(slugifyCategory(category))}`}>{category}</Link></li>)}</ul></div>
        <div><h3 className="text-white text-xl font-semibold mb-6">Customer Support</h3><ul className="space-y-3"><li><Link className={linkClass} to="/contact">Contact Us</Link></li><li><Link className={linkClass} to="/track-order">Track Order</Link></li><li><Link className={linkClass} to="/installation">Installation Service</Link></li><li><Link className={linkClass} to="/amc">AMC Plans</Link></li><li><Link className={linkClass} to="/warranty">Warranty</Link></li><li><Link className={linkClass} to="/support/tickets">Returns</Link></li><li><Link className={linkClass} to="/faqs">FAQs</Link></li></ul></div>
        <div><h3 className="text-white text-xl font-semibold mb-6">Company</h3><ul className="space-y-3"><li><Link className={linkClass} to="/about">About Us</Link></li><li><Link className={linkClass} to="/solutions">Solutions</Link></li><li><Link className={linkClass} to="/technology">Technology</Link></li><li><Link className={linkClass} to="/industries">Industries</Link></li><li><Link className={linkClass} to="/blogs">Blogs</Link></li><li><Link className={linkClass} to="/privacy-policy">Privacy Policy</Link></li><li><Link className={linkClass} to="/terms">Terms &amp; Conditions</Link></li></ul></div>
        <div><h3 className="text-white text-xl font-semibold mb-6">Stay Updated</h3><p>Subscribe to receive the latest product launches, offers and technology updates.</p><form onSubmit={handleSubscribe} className="mt-6"><div className="flex"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter email" aria-label="Email address for newsletter" disabled={newsletterState.loading} className="w-full min-w-0 rounded-l-lg px-4 py-3 text-black outline-none focus:ring-2 focus:ring-yellow-400" /><button type="submit" aria-label="Subscribe to newsletter" disabled={newsletterState.loading} className="bg-yellow-500 px-5 rounded-r-lg hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-60"><Send className="text-black" /></button></div>{newsletterState.message && <p role="status" className={`mt-2 text-xs ${newsletterState.error ? "text-red-300" : "text-emerald-300"}`}>{newsletterState.message}</p>}</form>{brochureUrl ? <a href={brochureUrl} download target="_blank" rel="noopener noreferrer" className="mt-6 block w-full rounded-xl bg-yellow-500 py-3 text-center font-semibold text-black hover:bg-yellow-600">Download Brochure</a> : <button type="button" disabled title="Brochure file is not configured" className="mt-6 w-full cursor-not-allowed rounded-xl bg-yellow-500/50 py-3 font-semibold text-black/70">Download Brochure</button>}</div>
      </div>
    </div>
    <div className="border-t border-gray-700"><div className="max-w-7xl mx-auto px-6 py-8"><div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 text-center"><div>🚚 <h4 className="font-semibold text-white mt-2">Fast Delivery</h4></div><div>🛠 <h4 className="font-semibold text-white mt-2">Professional Installation</h4></div><div>🛡 <h4 className="font-semibold text-white mt-2">100% Genuine Products</h4></div><div>📞 <h4 className="font-semibold text-white mt-2">24×7 Technical Support</h4></div></div></div></div>
    <div className="border-t border-gray-700"><div className="max-w-7xl mx-auto px-6 py-6 flex flex-col lg:flex-row justify-between items-center"><p>© 2026 Honey Vision Pvt. Ltd. All Rights Reserved.</p>{configuredSocials.length > 0 && <div className="flex gap-5 mt-5 lg:mt-0">{configuredSocials.map(([name, url]) => { const Icon = socialIcons[name]; return <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={`HoneyVision on ${name}`} className={linkClass}><Icon /></a>; })}</div>}</div></div>
  </footer>;
}

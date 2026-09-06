import { Link, useLocation } from "react-router-dom";

const content = {
  "/warranty": ["Warranty", "Warranty support for HoneyVision products is handled by our support team. Contact us with your order details and product information for assistance."],
  "/faqs": ["FAQs", "For questions about products, orders, delivery, installation, and support, contact the HoneyVision team and we will help with the next step."],
  "/privacy-policy": ["Privacy Policy", "HoneyVision uses the information you provide to process orders, provide support, and communicate service updates. Contact us for questions about your information."],
  "/terms": ["Terms & Conditions", "HoneyVision services and purchases are subject to the product, delivery, payment, and support terms communicated during your order. Contact us if you need clarification."],
};

export default function InformationPage() {
  const { pathname } = useLocation();
  const [title, description] = content[pathname] || ["Information", "Contact HoneyVision for assistance."];
  return <main className="min-h-screen bg-[#F5F7FA] px-6 py-16"><div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12"><p className="text-sm font-medium uppercase tracking-[0.18em] text-[#F4B400]">HoneyVision</p><h1 className="mt-3 text-3xl font-bold text-[#071426]">{title}</h1><p className="mt-5 leading-7 text-slate-600">{description}</p><Link to="/contact" className="mt-8 inline-flex rounded-xl bg-[#071426] px-5 py-3 text-sm font-bold text-white hover:bg-[#0b4162]">Contact Us</Link></div></main>;
}
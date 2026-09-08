import { useLocation } from "react-router-dom";

const pageContent = {
  "/warranty": ["Warranty", "Our products are supported by applicable manufacturer warranty terms. Keep your invoice and contact support for assistance."],
  "/faqs": ["Frequently Asked Questions", "Find answers about products, delivery, payments, installation, returns, and support."],
  "/privacy-policy": ["Privacy Policy", "We use account and order information to provide secure shopping, delivery, payment, and support services."],
  "/terms": ["Terms and Conditions", "Use of this store is subject to the applicable purchase, payment, delivery, return, and support terms."],
};

export default function InformationPage() {
  const { pathname } = useLocation();
  const [title, description] = pageContent[pathname] || ["Information", "Please contact our support team if you need more information."];

  return <main className="min-h-screen bg-[#f5f7fb] px-4 py-12 sm:px-6"><article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"><p className="text-xs font-bold uppercase tracking-widest text-amber-600">HoneyVision</p><h1 className="mt-3 text-3xl font-black text-[#071426]">{title}</h1><p className="mt-5 leading-7 text-slate-600">{description}</p></article></main>;
}
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  ShieldCheck,
  Award,
  Headphones,
  Truck,
  BadgeCheck,
  Send,
  User,
  Tag,
  Pencil,
} from "lucide-react";

const ContactHero = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786189628/contact_ptyzsi.png";

export default function Contact() {
  return (
    <section className="bg-[#f5f7fb] min-h-screen">

      {/* ================= HERO ================= */}

      <section className="relative overflow-hidden bg-gradient-to-r from-[#061324] via-[#0B2A4A] to-[#113D67]">

        {/* Background */}

        <div className="absolute inset-0">

          <div className="absolute inset-0 bg-[url('/city-bg.jpg')] bg-cover bg-center opacity-20"></div>

          <div className="absolute inset-0 bg-gradient-to-r from-[#061324]/95 via-[#0B2A4A]/80 to-transparent"></div>

        </div>

        <div className="relative max-w-screen-2xl mx-auto px-6 lg:px-12">

          <div className="grid lg:grid-cols-2 items-center min-h-[280px] lg:min-h-[320px]">

            {/* Left */}

            <div className="py-16 lg:py-20">

              <div className="w-16 h-1 bg-[#FDB913] rounded-full mb-8"></div>

              <h1 className="text-6xl font-black text-white leading-none">

                Contact

                <span className="text-[#FDB913] ml-4">

                  Us

                </span>

              </h1>

              <p className="mt-8 text-xl leading-9 text-gray-200 max-w-xl">

                We're here to help you with the best security
                solutions. Reach out to us for product enquiries,
                technical support, installation services and
                business partnerships.

              </p>

            </div>

            {/* Right */}

            <div className="flex justify-center lg:justify-end">

              <img
                src={ContactHero}
                alt="Honey Vision Camera"
                className="w-full max-w-[460px] object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,.35)]"
              />

            </div>

          </div>

        </div>

      </section>

      {/* ================= CONTENT STARTS HERE ================= */}

      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-12">

        <div className="grid lg:grid-cols-12 gap-8">

                    {/* ================= LEFT CONTACT INFO ================= */}

          <div className="lg:col-span-3">

            <h2 className="text-4xl font-bold text-[#071426]">

              Get In Touch

            </h2>

            <div className="w-14 h-1 bg-[#FDB913] rounded-full mt-3 mb-8"></div>

            <div className="space-y-5">

              {/* Location */}

              <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex gap-5 border border-gray-100">

                <div className="w-16 h-16 rounded-2xl bg-[#071426] flex items-center justify-center flex-shrink-0">

                  <MapPin size={28} className="text-white" />

                </div>

                <div>

                  <h3 className="font-bold text-xl text-[#071426]">

                    Our Location

                  </h3>

                  <p className="text-gray-600 leading-7 mt-2">

                    Honey Vision India Pvt. Ltd.
                    <br />
                    Bhubaneswar,
                    Odisha - 751024
                    <br />
                    India

                  </p>

                </div>

              </div>

              {/* Email */}

              <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex gap-5 border border-gray-100">

                <div className="w-16 h-16 rounded-2xl bg-[#071426] flex items-center justify-center flex-shrink-0">

                  <Mail size={28} className="text-white" />

                </div>

                <div>

                  <h3 className="font-bold text-xl text-[#071426]">

                    Email Us

                  </h3>

                  <p className="text-gray-600 mt-2">

                    info@honeyvision.in

                  </p>

                </div>

              </div>

              {/* Phone */}

              <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex gap-5 border border-gray-100">

                <div className="w-16 h-16 rounded-2xl bg-[#071426] flex items-center justify-center flex-shrink-0">

                  <Phone size={28} className="text-white" />

                </div>

                <div>

                  <h3 className="font-bold text-xl text-[#071426]">

                    Call Us

                  </h3>

                  <p className="text-gray-600 mt-2">

                    +91 98765 43210

                  </p>

                  <p className="text-gray-600">

                    +91 674 123 4567

                  </p>

                </div>

              </div>

              {/* Support */}

              <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex gap-5 border border-gray-100">

                <div className="w-16 h-16 rounded-2xl bg-[#071426] flex items-center justify-center flex-shrink-0">

                  <Headphones size={28} className="text-white" />

                </div>

                <div>

                  <h3 className="font-bold text-xl text-[#071426]">

                    Support

                  </h3>

                  <p className="text-gray-600 mt-2">

                    support@honeyvision.in

                  </p>

                </div>

              </div>

              {/* Working Hours */}

              <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex gap-5 border border-gray-100">

                <div className="w-16 h-16 rounded-2xl bg-[#071426] flex items-center justify-center flex-shrink-0">

                  <Clock size={28} className="text-white" />

                </div>

                <div>

                  <h3 className="font-bold text-xl text-[#071426]">

                    Working Hours

                  </h3>

                  <p className="text-gray-600 mt-2">

                    Monday - Saturday

                  </p>

                  <p className="text-gray-600">

                    9:00 AM - 6:00 PM

                  </p>

                  <p className="text-gray-600">

                    Sunday: Closed

                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* ================= CONTACT FORM STARTS HERE ================= */}

          <div className="lg:col-span-6">

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

              <h2 className="text-4xl font-bold text-[#071426]">

                Send Us a Message

              </h2>

              <div className="w-14 h-1 bg-[#FDB913] rounded-full mt-3 mb-8"></div>

              {/* Name & Email */}

              <div className="grid md:grid-cols-2 gap-5">

                <div className="relative">

                  <User
                    size={20}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full h-14 pl-14 pr-5 rounded-xl border border-gray-200 outline-none focus:border-[#FDB913] transition"
                  />

                </div>

                <div className="relative">

                  <Mail
                    size={20}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    placeholder="Your Email"
                    className="w-full h-14 pl-14 pr-5 rounded-xl border border-gray-200 outline-none focus:border-[#FDB913] transition"
                  />

                </div>

              </div>

              {/* Phone */}

              <div className="relative mt-5">

                <Phone
                  size={20}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Phone Number"
                  className="w-full h-14 pl-14 pr-5 rounded-xl border border-gray-200 outline-none focus:border-[#FDB913] transition"
                />

              </div>

              {/* Subject */}

              <div className="relative mt-5">

                <Tag
                  size={20}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Subject"
                  className="w-full h-14 pl-14 pr-5 rounded-xl border border-gray-200 outline-none focus:border-[#FDB913] transition"
                />

              </div>

              {/* Message */}

              <div className="relative mt-5">

                <Pencil
                  size={20}
                  className="absolute left-5 top-6 text-gray-400"
                />

                <textarea
                  rows={6}
                  placeholder="Your Message"
                  className="w-full pl-14 pr-5 pt-5 rounded-xl border border-gray-200 outline-none resize-none focus:border-[#FDB913] transition"
                ></textarea>

              </div>

              {/* Bottom */}

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mt-8">

                <label className="flex items-center gap-3 text-gray-600">

                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-[#FDB913]"
                  />

                  <span>

                    I agree to the

                    <a
                      href="#"
                      className="text-blue-600 font-medium ml-1 hover:underline"
                    >
                      Privacy Policy
                    </a>

                  </span>

                </label>

                <button className="bg-[#FDB913] hover:bg-yellow-400 text-[#071426] font-bold px-10 py-4 rounded-xl flex items-center justify-center gap-3 transition">

                  Send Message

                  <Send size={20} />

                </button>

              </div>

            </div>

          </div>

          {/* ================= RIGHT SIDEBAR STARTS HERE ================= */}

          <div className="lg:col-span-3">

                        {/* Why Choose Honey Vision */}

            <div className="bg-gradient-to-b from-[#071426] to-[#0B315A] rounded-3xl p-8 text-white shadow-lg">

              <h2 className="text-3xl font-bold leading-snug">

                Why Choose

                <span className="text-[#FDB913] ml-2">

                  Honey Vision?

                </span>

              </h2>

              <div className="space-y-8 mt-10">

                <div className="flex gap-4">

                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">

                    <ShieldCheck className="text-[#FDB913]" size={26} />

                  </div>

                  <div>

                    <h3 className="font-semibold text-lg">

                      Trusted Security Experts

                    </h3>

                    <p className="text-gray-300 mt-1">

                      Years of experience delivering reliable security solutions.

                    </p>

                  </div>

                </div>

                <div className="flex gap-4">

                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">

                    <Award className="text-[#FDB913]" size={26} />

                  </div>

                  <div>

                    <h3 className="font-semibold text-lg">

                      Premium Quality Products

                    </h3>

                    <p className="text-gray-300 mt-1">

                      Top brands with enterprise-grade performance.

                    </p>

                  </div>

                </div>

                <div className="flex gap-4">

                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">

                    <Headphones className="text-[#FDB913]" size={26} />

                  </div>

                  <div>

                    <h3 className="font-semibold text-lg">

                      24×7 Customer Support

                    </h3>

                    <p className="text-gray-300 mt-1">

                      Friendly support whenever you need assistance.

                    </p>

                  </div>

                </div>

                <div className="flex gap-4">

                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">

                    <BadgeCheck className="text-[#FDB913]" size={26} />

                  </div>

                  <div>

                    <h3 className="font-semibold text-lg">

                      End-to-End Solutions

                    </h3>

                    <p className="text-gray-300 mt-1">

                      Consultation, installation and maintenance under one roof.

                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* Call Card */}

            <div className="mt-6 bg-[#FFF7E8] border border-[#FFE29A] rounded-3xl p-6">

              <div className="flex items-center gap-4">

                <div className="w-16 h-16 rounded-full bg-[#FDB913] flex items-center justify-center">

                  <Phone className="text-[#071426]" size={28} />

                </div>

                <div>

                  <h3 className="text-xl font-bold text-[#071426]">

                    Need Immediate Assistance?

                  </h3>

                  <p className="text-gray-600 mt-1">

                    Our experts are ready to help.

                  </p>

                </div>

              </div>

              <div className="flex items-center justify-between mt-6">

                <h3 className="text-3xl font-bold text-[#071426]">

                  +91 98765 43210

                </h3>

                <button className="bg-[#071426] hover:bg-[#0B315A] text-white px-6 py-3 rounded-xl font-semibold transition">

                  Call Now

                </button>

              </div>

            </div>

          </div>

        </div>

        {/* Bottom Feature Strip */}

        <div className="mt-10 rounded-3xl overflow-hidden bg-gradient-to-r from-[#071426] to-[#0B315A]">

          <div className="grid lg:grid-cols-5 divide-x divide-white/10">

            <div className="flex items-center gap-4 p-8">

              <ShieldCheck className="text-[#FDB913]" size={42} />

              <div>

                <h3 className="font-bold text-white">

                  100% Secure

                </h3>

                <p className="text-gray-300 text-sm">

                  Your safety is our priority.

                </p>

              </div>

            </div>

            <div className="flex items-center gap-4 p-8">

              <Award className="text-[#FDB913]" size={42} />

              <div>

                <h3 className="font-bold text-white">

                  Certified Products

                </h3>

                <p className="text-gray-300 text-sm">

                  Quality tested solutions.

                </p>

              </div>

            </div>

            <div className="flex items-center gap-4 p-8">

              <Headphones className="text-[#FDB913]" size={42} />

              <div>

                <h3 className="font-bold text-white">

                  Expert Support

                </h3>

                <p className="text-gray-300 text-sm">

                  Professional assistance.

                </p>

              </div>

            </div>

            <div className="flex items-center gap-4 p-8">

              <Truck className="text-[#FDB913]" size={42} />

              <div>

                <h3 className="font-bold text-white">

                  Pan India Service

                </h3>

                <p className="text-gray-300 text-sm">

                  Serving customers nationwide.

                </p>

              </div>

            </div>

            <div className="flex items-center gap-4 p-8">

              <BadgeCheck className="text-[#FDB913]" size={42} />

              <div>

                <h3 className="font-bold text-white">

                  Trusted by Thousands

                </h3>

                <p className="text-gray-300 text-sm">

                  Thousands of happy customers.

                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>

  );

}
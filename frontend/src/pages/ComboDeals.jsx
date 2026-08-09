import React, { useMemo, useState } from "react";

import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Award,
  Headphones,
  Monitor,
  Laptop,
  Router,
  Printer,
  Camera,
  Headset,
  HardDrive,
  Zap,
  Keyboard,
  Mouse,
  PackageCheck,
  RefreshCcw,
  Truck,
  CreditCard,
  FileText,
  Smartphone,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  CheckCircle2,
  CircleDollarSign,
  Wrench,
  BadgeCheck,
  Boxes,
  Settings,
  Star,
} from "lucide-react";


// ============================================================
// COMBO PRODUCTS
// ============================================================

const comboProducts = [
  {
    id: 1,
    category: "Computers",
    badge: "Best Seller",
    badgeColor: "yellow",

    name: "Office Essential Combo",

    description: "Complete Solution for Work",

    image: "/images/combos/office-combo.png",

    features: [
      "Desktop PC (i5, 16GB, 512GB SSD)",
      '22" Full HD Monitor',
      "Keyboard & Mouse",
      "Wi-Fi Router",
      "1TB External HDD",
    ],

    price: 41999,
    mrp: 52999,
    discount: "21% OFF",
  },

  {
    id: 2,
    category: "Laptops",
    badge: "Most Popular",
    badgeColor: "blue",

    name: "Student Study Combo",

    description: "Perfect for Students",

    image: "/images/combos/student-combo.png",

    features: [
      "Laptop (i3, 8GB, 512GB SSD)",
      "Backpack",
      "Wireless Mouse",
      "Headset",
      "Pen Drive 32GB",
    ],

    price: 36999,
    mrp: 46999,
    discount: "21% OFF",
  },

  {
    id: 3,
    category: "Printers",
    badge: "Great Value",
    badgeColor: "purple",

    name: "Home Office Combo",

    description: "Work From Home Made Easy",

    image: "/images/combos/home-office-combo.png",

    features: [
      "All-in-One Ink Tank Printer",
      "Wi-Fi Router",
      "A4 Paper Ream (500 Sheets)",
      "USB Cable",
      "Pen Drive 64GB",
    ],

    price: 18999,
    mrp: 24999,
    discount: "24% OFF",
  },

  {
    id: 4,
    category: "CCTV & Security",
    badge: "Power Combo",
    badgeColor: "green",

    name: "Complete Security Combo",

    description: "Smart Security for Home & Office",

    image: "/images/combos/security-combo.png",

    features: [
      "4 × 2MP Full HD Cameras",
      "8 Channel DVR",
      "1TB Surveillance HDD",
      "Coaxial Cable 90m",
      "Power Supply",
    ],

    price: 24999,
    mrp: 32999,
    discount: "24% OFF",
  },
];


// ============================================================
// COMBO CATEGORIES
// ============================================================

const comboCategories = [
  {
    id: "all",
    name: "All Combos",
    icon: Boxes,
  },

  {
    id: "computers",
    name: "Computers",
    icon: Monitor,
  },

  {
    id: "laptops",
    name: "Laptops",
    icon: Laptop,
  },

  {
    id: "networking",
    name: "Networking",
    icon: Router,
  },

  {
    id: "printers",
    name: "Printers",
    icon: Printer,
  },

  {
    id: "security",
    name: "CCTV & Security",
    icon: Camera,
  },

  {
    id: "accessories",
    name: "Accessories",
    icon: Headset,
  },

  {
    id: "storage",
    name: "Storage",
    icon: HardDrive,
  },

  {
    id: "power",
    name: "Power Backup",
    icon: Zap,
  },

  {
    id: "software",
    name: "Software",
    icon: Settings,
  },

  {
    id: "peripherals",
    name: "Peripherals",
    icon: Keyboard,
  },
];


// ============================================================
// ALL COMBO CATEGORY CARDS
// ============================================================

const allComboCategories = [
  {
    title: "Computers Combo",

    description:
      "Desktops with monitor & accessories",

    image: "/images/combos/categories/computer-combo.png",
  },

  {
    title: "Laptops Combo",

    description:
      "Laptops with bags, mouse & accessories",

    image: "/images/combos/categories/laptop-combo.png",
  },

  {
    title: "Networking Combo",

    description:
      "Routers, Switches, Access Points & cables",

    image: "/images/combos/categories/networking-combo.png",
  },

  {
    title: "CCTV & Security Combo",

    description:
      "Cameras, DVR/NVR, Hard Disk & accessories",

    image: "/images/combos/categories/cctv-combo.png",
  },

  {
    title: "Printers Combo",

    description:
      "Printers with ink, paper & accessories",

    image: "/images/combos/categories/printer-combo.png",
  },

  {
    title: "Storage Combo",

    description:
      "HDD, SSD, Pen Drive & Memory Cards",

    image: "/images/combos/categories/storage-combo.png",
  },

  {
    title: "Accessories Combo",

    description:
      "Keyboards, Mice, Headsets & more",

    image: "/images/combos/categories/accessories-combo.png",
  },

  {
    title: "Power Backup Combo",

    description:
      "UPS, Inverters & Batteries",

    image: "/images/combos/categories/power-combo.png",
  },

  {
    title: "Software Combo",

    description:
      "OS, Office, Antivirus & Productivity Software",

    image: "/images/combos/categories/software-combo.png",
  },

  {
    title: "Peripherals Combo",

    description:
      "Monitors, Projectors, Webcams & more",

    image: "/images/combos/categories/peripherals-combo.png",
  },
];


// ============================================================
// MAIN COMPONENT
// ============================================================

function ComboDeals() {
  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("popularity");


  // ==========================================================
  // FILTER PRODUCTS
  // ==========================================================

  const filteredProducts = useMemo(() => {
    let products = [...comboProducts];


    if (selectedCategory !== "all") {
      products = products.filter((product) => {

        if (
          selectedCategory === "computers"
        ) {
          return product.category === "Computers";
        }

        if (
          selectedCategory === "laptops"
        ) {
          return product.category === "Laptops";
        }

        if (
          selectedCategory === "printers"
        ) {
          return product.category === "Printers";
        }

        if (
          selectedCategory === "security"
        ) {
          return product.category === "CCTV & Security";
        }

        return true;
      });
    }


    // ========================================================
    // SORT
    // ========================================================

    if (sortBy === "price-low") {
      products.sort(
        (a, b) => a.price - b.price
      );
    }

    if (sortBy === "price-high") {
      products.sort(
        (a, b) => b.price - a.price
      );
    }


    return products;

  }, [
    selectedCategory,
    sortBy,
  ]);


  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#0b1324]">


      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-white">

        {/* Background gradient */}

        <div className="absolute inset-0 bg-gradient-to-r from-white via-white to-[#eef3f7]" />


        <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">


          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <div className="flex items-center gap-2 pt-6 text-xs text-gray-600">

            <span>
              Home
            </span>

            <ChevronRight size={13} />

            <span className="font-medium text-gray-900">
              Combo Deals
            </span>

          </div>



          {/* ==================================================
              HERO GRID
          ================================================== */}

          <div className="grid min-h-[365px] items-center gap-5 py-8 lg:grid-cols-[38%_42%_20%]">


            {/* =================================================
                HERO LEFT
            ================================================= */}

            <div>

              <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">

                Smart IT Solutions

                <span className="block text-[#f7ad00]">
                  Combo Deals
                </span>

              </h1>


              <p className="mt-4 max-w-[530px] text-sm leading-6 text-gray-700 sm:text-base">

                Save more with our smart combo offers on all IT
                products. High quality. Perfect compatibility.
                Best value for your money. Everything you need,
                in one perfect combo.

              </p>



              {/* HERO FEATURES */}

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">

                <HeroFeature
                  icon={ShieldCheck}
                  title="Best Value"
                  text="Save more with combo offers"
                />

                <HeroFeature
                  icon={BadgeCheck}
                  title="100% Compatible"
                  text="All products work seamlessly"
                />

                <HeroFeature
                  icon={Award}
                  title="Trusted Quality"
                  text="Genuine products you can rely on"
                />

                <HeroFeature
                  icon={Headphones}
                  title="Expert Support"
                  text="Installation & after-sales support"
                />

              </div>

            </div>



            {/* =================================================
                HERO PRODUCTS IMAGE
            ================================================= */}

            <div className="relative flex min-h-[300px] items-center justify-center">
              <img
                src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1786185334/combo_emz1zv.png"
                alt="HoneyVision IT Combo Products"
                className="h-[320px] w-full max-w-[920px] object-contain object-center"
              />
            </div>



            {/* =================================================
                HERO BENEFITS CARD
            ================================================= */}

            <div className="rounded-2xl bg-[#061626] p-5 text-white shadow-xl">

              <HeroBenefit
                icon={PackageCheck}
                title="Complete Solutions"
                text="All your IT needs in one combo"
              />

              <HeroBenefit
                icon={CircleDollarSign}
                title="Great Savings"
                text="Lowest prices on combo packages"
              />

              <HeroBenefit
                icon={Settings}
                title="Easy Setup"
                text="Pre-tested & easy to install"
              />

              <HeroBenefit
                icon={ShieldCheck}
                title="Warranty"
                text="Assured warranty on all products"
                last
              />

            </div>

          </div>

        </div>

      </section>



      {/* ======================================================
          CATEGORY NAVIGATION
      ====================================================== */}

      <section className="relative z-20 mx-auto -mt-1 max-w-[1400px] px-5 sm:px-8 lg:px-10">

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="flex overflow-x-auto scrollbar-hide">

            {comboCategories.map((category) => {

              const Icon = category.icon;

              const active =
                selectedCategory === category.id;


              return (
                <button
                  key={category.id}
                  onClick={() =>
                    setSelectedCategory(
                      category.id
                    )
                  }
                  className={`group flex min-w-[105px] flex-1 flex-col items-center justify-center gap-2 px-3 py-4 text-center transition ${
                    active
                      ? "bg-[#fffaf0]"
                      : "hover:bg-gray-50"
                  }`}
                >

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      active
                        ? "bg-[#fff4d6]"
                        : "bg-gray-50"
                    }`}
                  >

                    <Icon
                      size={24}
                      strokeWidth={1.7}
                      className={
                        active
                          ? "text-[#f5ae00]"
                          : "text-gray-800"
                      }
                    />

                  </div>


                  <span
                    className={`whitespace-nowrap text-[11px] font-semibold ${
                      active
                        ? "text-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    {category.name}
                  </span>

                </button>
              );

            })}

          </div>

        </div>

      </section>



      {/* ======================================================
          POPULAR COMBO PACKAGES
      ====================================================== */}

      <section className="mx-auto max-w-[1440px] px-5 pt-6 sm:px-8 lg:px-10">


        {/* SECTION HEADER */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <h2 className="text-xl font-bold sm:text-2xl">
            Popular Combo Packages
          </h2>


          <div className="flex items-center gap-2">

            <span className="text-xs text-gray-500">
              Sort by:
            </span>


            <div className="relative">

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
                className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-xs font-medium outline-none focus:border-[#f5ae00]"
              >

                <option value="popularity">
                  Popularity
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

              </select>

              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              />

            </div>

          </div>

        </div>



        {/* PRODUCTS */}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {filteredProducts.map((product) => (

            <ComboProductCard
              key={product.id}
              product={product}
            />

          ))}

        </div>

      </section>



      {/* ======================================================
          ALL COMBO CATEGORIES
      ====================================================== */}

      <section className="mx-auto max-w-[1440px] px-5 pt-5 sm:px-8 lg:px-10">

        <h2 className="text-xl font-bold sm:text-2xl">
          All IT Product Combo Categories
        </h2>


        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

          {allComboCategories.map(
            (category) => (

              <ComboCategoryCard
                key={category.title}
                category={category}
              />

            )
          )}

        </div>

      </section>



      {/* ======================================================
          WHAT'S INCLUDED
      ====================================================== */}

      <section className="mx-auto max-w-[1400px] px-5 pt-5 sm:px-8 lg:px-10">

        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-5">

          <h2 className="text-center text-lg font-bold">
            What's Included in Every Combo?
          </h2>


          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">

            <IncludedItem
              icon={BadgeCheck}
              title="100% Compatibility"
              text="All products tested to work perfectly together"
            />

            <IncludedItem
              icon={Award}
              title="Quality Products"
              text="Genuine branded products with warranty"
            />

            <IncludedItem
              icon={Headphones}
              title="Expert Support"
              text="Installation guidance & after-sales support"
            />

            <IncludedItem
              icon={Zap}
              title="Best Prices"
              text="Special discount on combo packages"
            />

            <IncludedItem
              icon={RefreshCcw}
              title="Easy Returns"
              text="7-day easy return on all combo orders"
            />

            <IncludedItem
              icon={PackageCheck}
              title="Secure Packaging"
              text="Safe & secure packaging for every order"
            />

          </div>

        </div>

      </section>



      {/* ======================================================
          WHY CHOOSE + HELP
      ====================================================== */}

      <section className="mx-auto max-w-[1400px] px-5 pb-5 pt-5 sm:px-8 lg:px-10">

        <div className="grid gap-5 lg:grid-cols-[40%_60%]">


          {/* ==================================================
              WHY CHOOSE
          ================================================== */}

          <div className="rounded-2xl bg-white p-5">

            <h2 className="text-2xl font-bold leading-tight">

              Why Choose

              <span className="block text-[#f5ae00]">
                HoneyVision Combos?
              </span>

            </h2>


            <p className="mt-3 max-w-[500px] text-sm leading-6 text-gray-600">

              We provide smart, reliable and cost-effective IT
              solutions for every user – Home, Office, Business
              & Enterprise.

            </p>


            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

              <MiniTrust
                icon={ShieldCheck}
                number="5000+"
                text="Happy Customers"
              />

              <MiniTrust
                icon={Award}
                number="2 Years"
                text="Warranty"
              />

              <MiniTrust
                icon={Headphones}
                number="24/7"
                text="Support"
              />

              <MiniTrust
                icon={BadgeCheck}
                number="Trusted"
                text="Company"
              />

            </div>

          </div>



          {/* ==================================================
              HELP CARD
          ================================================== */}

          <div className="rounded-2xl bg-[#061626] p-5 text-white sm:p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#13283b]">

                <ShieldCheck
                  size={27}
                  className="text-[#f5ae00]"
                />

              </div>


              <div>

                <h2 className="text-lg font-bold">
                  Need Help Choosing the Right Combo?
                </h2>

                <p className="mt-1 text-xs text-gray-300">
                  Our experts are here to help you find the
                  perfect IT solution for your needs.
                </p>

              </div>

            </div>


            <div className="mt-5 grid gap-3 sm:grid-cols-3">

              <ContactCard
                icon={Phone}
                title="Call Us"
                value="+91 98765 43210"
              />

              <ContactCard
                icon={MessageCircle}
                title="WhatsApp"
                value="+91 98765 43210"
                green
              />

              <ContactCard
                icon={Mail}
                title="Email Us"
                value="support@honeyvision.in"
              />

            </div>

          </div>

        </div>

      </section>



      {/* ======================================================
          BOTTOM SERVICE BAR
      ====================================================== */}

      <section className="mx-auto max-w-[1400px] px-5 pb-8 sm:px-8 lg:px-10">

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

          <div className="grid divide-y divide-gray-200 sm:grid-cols-2 lg:grid-cols-6 lg:divide-x lg:divide-y-0">

            <BottomService
              icon={Truck}
              title="Free Shipping"
              text="On all combo orders"
            />

            <BottomService
              icon={ShieldCheck}
              title="Secure Payment"
              text="100% safe & secure"
            />

            <BottomService
              icon={FileText}
              title="GST Invoice"
              text="Business invoices available"
            />

            <BottomService
              icon={CreditCard}
              title="Easy EMI Options"
              text="Flexible payment options"
            />

            <BottomService
              icon={MapPin}
              title="PAN India Service"
              text="Delivery across India"
            />

            <BottomService
              icon={Headphones}
              title="Dedicated Support"
              text="Always here to help you"
            />

          </div>

        </div>

      </section>

    </div>
  );
}


// ============================================================
// HERO FEATURE
// ============================================================

function HeroFeature({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="flex items-start gap-2">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">

        <Icon
          size={20}
          strokeWidth={1.6}
          className="text-[#f5ae00]"
        />

      </div>


      <div>

        <h3 className="text-[11px] font-bold">
          {title}
        </h3>

        <p className="mt-1 max-w-[100px] text-[9px] leading-3.5 text-gray-600">
          {text}
        </p>

      </div>

    </div>
  );
}


// ============================================================
// HERO BENEFIT
// ============================================================

function HeroBenefit({
  icon: Icon,
  title,
  text,
  last = false,
}) {
  return (
    <div
      className={`flex gap-3 ${
        !last ? "mb-5" : ""
      }`}
    >

      <Icon
        size={23}
        strokeWidth={1.7}
        className="shrink-0 text-[#f5ae00]"
      />

      <div>

        <h3 className="text-xs font-bold">
          {title}
        </h3>

        <p className="mt-1 text-[10px] leading-4 text-gray-300">
          {text}
        </p>

      </div>

    </div>
  );
}


// ============================================================
// COMBO PRODUCT CARD
// ============================================================

function ComboProductCard({
  product,
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

      {/* Badge */}

      <div className="flex h-6 items-start">

        <span
          className={`rounded-md px-2 py-1 text-[9px] font-bold text-white ${
            product.badgeColor === "yellow"
              ? "bg-[#f4b400]"
              : product.badgeColor === "blue"
              ? "bg-blue-600"
              : product.badgeColor === "purple"
              ? "bg-purple-600"
              : "bg-green-600"
          }`}
        >
          {product.badge}
        </span>

      </div>


      {/* IMAGE */}

      <div className="mt-1 flex h-[150px] items-center justify-center overflow-hidden rounded-lg bg-white">

        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
        />

      </div>


      {/* CONTENT */}

      <div className="mt-2">

        <h3 className="text-sm font-bold">
          {product.name}
        </h3>

        <p className="mt-1 text-[10px] text-gray-500">
          {product.description}
        </p>


        {/* FEATURES */}

        <ul className="mt-3 space-y-1.5">

          {product.features.map(
            (feature) => (

              <li
                key={feature}
                className="flex items-start gap-1.5 text-[9px] text-gray-700"
              >

                <CheckCircle2
                  size={12}
                  strokeWidth={2}
                  className="mt-[1px] shrink-0 text-[#f5ae00]"
                />

                <span>
                  {feature}
                </span>

              </li>

            )
          )}

        </ul>


        {/* PRICE */}

        <div className="mt-4 flex items-end gap-2">

          <span className="text-base font-bold">
            ₹{product.price.toLocaleString("en-IN")}
          </span>

          <span className="text-[10px] text-gray-400 line-through">
            ₹{product.mrp.toLocaleString("en-IN")}
          </span>

          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
            {product.discount}
          </span>

        </div>


        {/* BUTTON */}

        <button className="mt-3 flex w-full items-center justify-center gap-3 rounded-lg bg-[#f6b300] py-2.5 text-xs font-bold text-gray-900 transition hover:bg-[#e5a700]">

          View Details

          <ArrowRight size={15} />

        </button>

      </div>

    </article>
  );
}


// ============================================================
// CATEGORY CARD
// ============================================================

function ComboCategoryCard({
  category,
}) {
  return (
    <article className="group relative flex min-h-[108px] overflow-hidden rounded-xl border border-gray-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">

      <div className="max-w-[58%]">

        <h3 className="text-xs font-bold">
          {category.title}
        </h3>

        <p className="mt-1 text-[9px] leading-4 text-gray-600">
          {category.description}
        </p>


        <button className="mt-3 flex items-center gap-1 text-[9px] font-semibold text-blue-700">
          View Combos
          <ArrowRight size={11} />
        </button>

      </div>


      <div className="absolute bottom-2 right-1 flex h-[80px] w-[100px] items-center justify-center">

        <img
          src={category.image}
          alt={category.title}
          className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
        />

      </div>

    </article>
  );
}


// ============================================================
// INCLUDED ITEM
// ============================================================

function IncludedItem({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="flex gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center">

        <Icon
          size={25}
          strokeWidth={1.5}
          className="text-[#f5ae00]"
        />

      </div>


      <div>

        <h3 className="text-[10px] font-bold">
          {title}
        </h3>

        <p className="mt-1 text-[9px] leading-3.5 text-gray-600">
          {text}
        </p>

      </div>

    </div>
  );
}


// ============================================================
// MINI TRUST
// ============================================================

function MiniTrust({
  icon: Icon,
  number,
  text,
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">

      <Icon
        size={20}
        className="text-[#f5ae00]"
        strokeWidth={1.6}
      />

      <div className="mt-2 text-xs font-bold">
        {number}
      </div>

      <div className="mt-1 text-[9px] text-gray-500">
        {text}
      </div>

    </div>
  );
}


// ============================================================
// CONTACT CARD
// ============================================================

function ContactCard({
  icon: Icon,
  title,
  value,
  green = false,
}) {
  return (
    <a
      href="#"
      className="flex items-center gap-3 rounded-lg border border-white/20 px-3 py-3 transition hover:border-[#f5ae00] hover:bg-white/5"
    >

      <Icon
        size={23}
        strokeWidth={1.7}
        className={
          green
            ? "text-green-400"
            : "text-[#f5ae00]"
        }
      />

      <div>

        <div className="text-[10px] font-bold">
          {title}
        </div>

        <div className="mt-1 text-[9px] text-gray-300">
          {value}
        </div>

      </div>

    </a>
  );
}


// ============================================================
// BOTTOM SERVICE
// ============================================================

function BottomService({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">

      <Icon
        size={22}
        strokeWidth={1.5}
        className="shrink-0 text-gray-600"
      />

      <div>

        <h3 className="text-[10px] font-bold">
          {title}
        </h3>

        <p className="mt-1 text-[9px] text-gray-500">
          {text}
        </p>

      </div>

    </div>
  );
}


export default ComboDeals;
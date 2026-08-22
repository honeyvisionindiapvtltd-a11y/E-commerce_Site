import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  Grid3X3,
  List,
  Search,
  ShieldCheck,
  Headphones,
  Package,
  Truck,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const categoryImageFallback =
  "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010029/laptop_ktvxcs.png";

const categoryDescription = (name) => {
  const normalized = name || "Category";
  return `Browse all ${normalized.toLowerCase()} items and related subcategories available in the live catalog.`;
};

export default function Categories() {
  const [categoryTiles, setCategoryTiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const response = await fetch("/api/categories/tree");
        if (!response.ok) throw new Error("Unable to load categories");

        const data = await response.json();
        const trees = Array.isArray(data.categories)
          ? data.categories
          : [];

        const nextTiles = trees.map((category) => ({
          name: category.name || category.label || "Category",
          slug: category.slug || "",
          image: category.image || categoryImageFallback,
          subcategories: Array.isArray(category.subcategories)
            ? category.subcategories
            : [],
        }));

        if (isMounted) setCategoryTiles(nextTiles);
      } catch (error) {
        console.error("Failed to load categories:", error);

        if (isMounted) setCategoryTiles([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleTiles = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return categoryTiles.filter((category) => {
      const matchesCategory =
        selectedCategory === "All Categories" ||
        category.name === selectedCategory;

      if (!search) return matchesCategory;

      const matchesName = category.name.toLowerCase().includes(search);

      const matchesSubcategory = category.subcategories.some((sub) =>
        (sub.name || "").toLowerCase().includes(search)
      );

      return matchesCategory && (matchesName || matchesSubcategory);
    });
  }, [categoryTiles, searchTerm, selectedCategory]);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      {/* =========================================================
          HERO SECTION
      ========================================================== */}
      <section className="relative overflow-hidden bg-[#061a38]">
        {/* Decorative background */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-2 text-sm text-slate-300">
            <Link
              to="/"
              className="transition hover:text-amber-400"
            >
              Home
            </Link>

            <ChevronRight size={15} />

            <span className="text-white">Categories</span>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-[1fr_420px]">
            {/* Hero Content */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                <Sparkles size={15} />
                Explore Our Catalog
              </div>

              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                Everything You Need.
                <span className="block text-amber-400">
                  All in One Place.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Explore our complete range of IT products, security
                solutions, networking equipment, computer components,
                power solutions and more.
              </p>

              {/* Trust Points */}
              <div className="mt-8 flex flex-wrap gap-5">
                <div className="flex items-center gap-2 text-sm text-white">
                  <ShieldCheck
                    size={20}
                    className="text-amber-400"
                  />
                  Genuine Products
                </div>

                <div className="flex items-center gap-2 text-sm text-white">
                  <Package
                    size={20}
                    className="text-amber-400"
                  />
                  Wide Product Range
                </div>

                <div className="flex items-center gap-2 text-sm text-white">
                  <Truck
                    size={20}
                    className="text-amber-400"
                  />
                  PAN India Delivery
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 rounded-[2rem] bg-amber-400/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-[#061a38]">
                      <Package size={24} />
                    </div>

                    <p className="text-2xl font-bold text-white">
                      {categoryTiles.length || "--"}
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      Main Categories
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-amber-400">
                      <Grid3X3 size={24} />
                    </div>

                    <p className="text-2xl font-bold text-white">
                      IT
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      Complete Solutions
                    </p>
                  </div>

                  <div className="col-span-2 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400/10 to-transparent p-5">
                    <p className="text-sm font-semibold text-amber-400">
                      HoneyVision
                    </p>

                    <p className="mt-1 text-lg font-bold text-white">
                      Technology You Can Trust.
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Products • Installation • Service
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Yellow bottom accent */}
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
      </section>

      {/* =========================================================
          MAIN CONTENT
      ========================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Search + Controls */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative w-full lg:max-w-xl">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories or subcategories..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10"
              />
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">
                View:
              </span>

              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-lg p-2 transition ${
                    viewMode === "grid"
                      ? "bg-[#061a38] text-white shadow"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Grid3X3 size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg p-2 transition ${
                    viewMode === "list"
                      ? "bg-[#061a38] text-white shadow"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            CONTENT + SIDEBAR
        ====================================================== */}
        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          {/* ===================================================
              CATEGORY SIDEBAR
          ==================================================== */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-[#061a38] px-5 py-4">
                <div className="flex items-center gap-3">
                  <Grid3X3
                    size={20}
                    className="text-amber-400"
                  />

                  <h2 className="font-bold text-white">
                    All Categories
                  </h2>
                </div>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCategory("All Categories")
                  }
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                    selectedCategory === "All Categories"
                      ? "bg-[#061a38] text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>All Categories</span>
                  <ChevronRight size={16} />
                </button>

                {categoryTiles.map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(category.name)
                    }
                    className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition ${
                      selectedCategory === category.name
                        ? "bg-amber-50 font-semibold text-slate-950"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <span className="truncate pr-2">
                      {category.name}
                    </span>

                    <ChevronRight
                      size={15}
                      className={`shrink-0 ${
                        selectedCategory === category.name
                          ? "text-amber-500"
                          : "text-slate-300 group-hover:text-amber-500"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Support */}
              <div className="m-3 rounded-2xl bg-gradient-to-br from-[#061a38] to-[#0b315f] p-5 text-white">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-[#061a38]">
                  <Headphones size={22} />
                </div>

                <h3 className="font-bold">
                  Need Help?
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-300">
                  Our experts can help you choose the right
                  IT products for your requirements.
                </p>

                <Link
                  to="/contact"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-300"
                >
                  Contact Us
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </aside>

          {/* ===================================================
              CATEGORY CONTENT
          ==================================================== */}
          <div>
            {/* Mobile Category Dropdown */}
            <div className="mb-5 lg:hidden">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value)
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium outline-none focus:border-amber-400"
                >
                  <option value="All Categories">
                    All Categories
                  </option>

                  {categoryTiles.map((category) => (
                    <option
                      key={category.name}
                      value={category.name}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
            </div>

            {/* Section Header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-500">
                  Explore
                </p>

                <h2 className="mt-2 text-3xl font-bold text-[#061a38]">
                  {selectedCategory}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {visibleTiles.length}{" "}
                  {visibleTiles.length === 1
                    ? "category"
                    : "categories"}{" "}
                  available
                </p>
              </div>

              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#061a38] transition hover:text-amber-500"
              >
                Browse All Products
                <ArrowRight size={17} />
              </Link>
            </div>

            {/* Loading */}
            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <div className="h-44 bg-slate-200" />

                    <div className="space-y-3 p-5">
                      <div className="h-5 w-2/3 rounded bg-slate-200" />
                      <div className="h-4 w-full rounded bg-slate-200" />
                      <div className="h-4 w-1/2 rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Empty */}
            {!isLoading && visibleTiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Search
                    size={25}
                    className="text-slate-400"
                  />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  No categories found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Try another search term or select another
                  category.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All Categories");
                  }}
                  className="mt-5 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
                >
                  Clear Filters
                </button>
              </div>
            ) : null}

            {/* =================================================
                CATEGORY CARDS
            ================================================== */}
            {!isLoading && visibleTiles.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                    : "space-y-5"
                }
              >
                {visibleTiles.map(
                  ({
                    name,
                    slug,
                    image,
                    subcategories,
                  }) => (
                    <div
                      key={name}
                      className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl ${
                        viewMode === "list"
                          ? "flex flex-col md:flex-row"
                          : ""
                      }`}
                    >
                      {/* Image */}
                      <Link
                        to={`/products?category=${slug}`}
                        className={`relative block overflow-hidden bg-slate-100 ${
                          viewMode === "list"
                            ? "h-52 md:h-auto md:w-64 md:shrink-0"
                            : "h-48"
                        }`}
                      >
                        <img
                          src={image || categoryImageFallback}
                          alt={name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.src =
                              categoryImageFallback;
                          }}
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#061a38]/50 via-transparent to-transparent opacity-60" />

                        {/* Explore */}
                        <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#061a38] shadow-lg">
                          Explore
                          <ArrowRight size={13} />
                        </div>
                      </Link>

                      {/* Card Content */}
                      <div className="flex min-w-0 flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link
                              to={`/products?category=${slug}`}
                              className="text-xl font-bold text-[#061a38] transition hover:text-amber-500"
                            >
                              {name}
                            </Link>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {categoryDescription(name)}
                            </p>
                          </div>

                          <Link
                            to={`/products?category=${slug}`}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600"
                          >
                            <ChevronRight size={17} />
                          </Link>
                        </div>

                        {/* Subcategories */}
                        {subcategories.length > 0 ? (
                          <div className="mt-5 border-t border-slate-100 pt-4">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Subcategories
                              </p>

                              <span className="text-xs font-semibold text-slate-400">
                                {subcategories.length}
                              </span>
                            </div>

                            <div className="flex max-h-24 flex-wrap gap-2 overflow-hidden">
                              {subcategories
                                .slice(0, 6)
                                .map((subcategory) => (
                                  <Link
                                    key={
                                      subcategory._id ||
                                      subcategory.slug ||
                                      subcategory.name
                                    }
                                    to={`/products?category=${
                                      subcategory.slug || slug
                                    }`}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-slate-950"
                                  >
                                    {subcategory.name}
                                  </Link>
                                ))}
                            </div>

                            {subcategories.length > 6 ? (
                              <Link
                                to={`/products?category=${slug}`}
                                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
                              >
                                View all subcategories
                                <ChevronRight size={13} />
                              </Link>
                            ) : null}
                          </div>
                        ) : (
                          <div className="mt-auto pt-5">
                            <Link
                              to={`/products?category=${slug}`}
                              className="inline-flex items-center gap-2 text-sm font-bold text-[#061a38] transition hover:text-amber-500"
                            >
                              View Products
                              <ArrowRight size={16} />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* =========================================================
          TRUST STRIP
      ========================================================== */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-slate-200 px-4 py-6 sm:grid-cols-2 sm:px-6 sm:py-0 lg:grid-cols-4 lg:divide-x lg:divide-y-0 lg:px-8">
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <ShieldCheck size={22} />
            </div>

            <div>
              <p className="text-sm font-bold text-[#061a38]">
                Genuine Products
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Quality products from trusted brands
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-4 py-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#061a38]">
              <Package size={22} />
            </div>

            <div>
              <p className="text-sm font-bold text-[#061a38]">
                Complete IT Range
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Products for home and business
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-4 py-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <Truck size={22} />
            </div>

            <div>
              <p className="text-sm font-bold text-[#061a38]">
                Fast Delivery
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Reliable delivery across India
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-4 py-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#061a38]">
              <Headphones size={22} />
            </div>

            <div>
              <p className="text-sm font-bold text-[#061a38]">
                Expert Support
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Help before and after purchase
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CTA
      ========================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#061a38] px-6 py-10 sm:px-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
                Need a solution?
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Can't find what you're looking for?
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Contact our team and we'll help you find the right
                product or IT solution for your requirement.
              </p>
            </div>

            <div className="shrink-0">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-300"
              >
                Talk to an Expert
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
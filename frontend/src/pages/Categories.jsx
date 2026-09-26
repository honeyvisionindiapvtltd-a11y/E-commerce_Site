import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext.jsx";
const API_BASE = import.meta.env.VITE_API_URL || "/api";
import {
  ChevronRight,
  Grid2X2,
  Search,
} from "lucide-react";

const categoryImageFallback =
  "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010029/laptop_ktvxcs.png";

const popularBrands = [
  ["Hikvision", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172596/Hikvision_logo_joawjl.png"],
  ["Dahua", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172595/Dahua_Technology_logo_veja1o.jpg"],
  ["CP Plus", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377702/cp_plus-logo_asuqmb.png"],
  ["Honeywell", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377703/Honeywell-Logo_cdkjfy.svg"],
  ["Prama", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377702/prama-logo_pqskkz.png"],
];

export default function Categories() {
  const { products } = useCatalog();
  const [categoryTiles, setCategoryTiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const selectedCategoryButtonRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/categories/tree?light=true`);
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

  const selectedCategoryData = useMemo(
    () => categoryTiles.find((category) => category.name === selectedCategory),
    [categoryTiles, selectedCategory]
  );

  const visibleSubcategories = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const subcategories = selectedCategoryData?.subcategories || [];

    if (!search) return subcategories;

    return subcategories.filter((subcategory) =>
      (subcategory.name || "").toLowerCase().includes(search)
    );
  }, [selectedCategoryData, searchTerm]);

  useEffect(() => {
    if (selectedCategory === "All Categories") return;

    selectedCategoryButtonRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedCategory, categoryTiles]);

  const featuredProducts = useMemo(() => {
    const categoryProducts = selectedCategory === "All Categories"
      ? products
      : products.filter((product) => product.category === selectedCategory);

    return (categoryProducts.length ? categoryProducts : products).slice(0, 4);
  }, [products, selectedCategory]);

  return (
    <main className="categories-page min-h-screen overflow-x-clip bg-[#f4f8fc] text-[#123563]">
      <section className="mx-auto max-w-[1600px] px-3 pb-5 pt-3 sm:px-6 sm:pt-5 lg:px-8">
        <div className="mb-3 hidden items-center gap-2 text-[11px] font-semibold text-[#6f89a8] sm:flex">
          <Link to="/" className="hover:text-[#123563]">Home</Link>
          <ChevronRight size={13} />
          <span className="text-[#123563]">All Categories</span>
        </div>

        <div className="categories-sticky-bar sticky top-11 z-50 isolate -mx-3 mb-3 block overflow-x-auto bg-[#f4f8fc] px-3 pb-2 pt-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 lg:hidden">
          <div className="flex min-w-max gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("All Categories")}
              aria-pressed={selectedCategory === "All Categories"}
              className={`min-h-11 rounded-full px-3 py-2 text-sm font-semibold transition ${selectedCategory === "All Categories" ? "bg-[#0862c6] text-white shadow-sm" : "border border-[#dbe7f3] bg-white text-[#123563]"}`}
            >
              All Categories
            </button>
            {categoryTiles.map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() => setSelectedCategory(category.name)}
                ref={selectedCategory === category.name ? selectedCategoryButtonRef : null}
                aria-pressed={selectedCategory === category.name}
                className={`min-h-11 rounded-full px-3 py-2 text-sm font-semibold transition ${selectedCategory === category.name ? "bg-[#fff4cf] text-[#123563] shadow-sm" : "border border-[#dbe7f3] bg-white text-[#34577f]"}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-4">
          <aside className="categories-sidebar hidden self-start overflow-hidden rounded-xl border border-[#dbe7f3] bg-white shadow-[0_2px_8px_rgba(24,61,103,0.04)] lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-slate-100">
            <div className="flex items-center gap-2 border-b border-[#e2ebf4] px-3 py-2.5">
              <Grid2X2 size={17} className="text-[#123563]" />
              <h2 className="text-[15px] font-extrabold">All Categories</h2>
            </div>
            <div className="p-1.5">
              <button type="button" onClick={() => setSelectedCategory("All Categories")} className={`flex w-full items-center justify-between rounded-md px-2 py-2.5 text-left text-[11px] font-bold ${selectedCategory === "All Categories" ? "bg-[#0862c6] text-white" : "text-[#123563] hover:bg-[#f1f6fb]"}`}>
                <span className="truncate">All Categories</span>
                <ChevronRight size={13} />
              </button>
              {categoryTiles.map((category) => (
                <button key={category.name} type="button" onClick={() => setSelectedCategory(category.name)} className={`group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[10px] font-semibold leading-tight ${selectedCategory === category.name ? "bg-[#fff4cf] text-[#123563]" : "text-[#34577f] hover:bg-[#f1f6fb]"}`}>
                  <img src={category.image || categoryImageFallback} alt="" className="h-7 w-10 shrink-0 rounded object-contain" onError={(e) => { e.currentTarget.src = categoryImageFallback; }} />
                  <span className="min-w-0 flex-1 truncate">{category.name}</span>
                  <ChevronRight size={12} className="hidden shrink-0 text-[#87a1bd] group-hover:text-[#123563] sm:block" />
                </button>
              ))}
            </div>
          </aside>

          <div className="categories-content-panel min-w-0 rounded-xl border border-[#dbe7f3] bg-white p-3 shadow-[0_2px_8px_rgba(24,61,103,0.04)] sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#e4edf5] pb-3">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#edf5fc] text-[#123563] sm:h-10 sm:w-10"><Grid2X2 size={16} /></div>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-extrabold sm:text-2xl">{selectedCategory}</h1>
                  <p className="hidden text-[10px] text-[#6f89a8] sm:block">Explore our range of high-quality {selectedCategory.toLowerCase()} for home, office and business.</p>
                </div>
              </div>
              <div className="relative hidden w-48 sm:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba4bd]" />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search categories" className="h-9 w-full rounded-md border border-[#dbe7f3] bg-[#f8fbfe] pl-8 pr-2 text-[11px] outline-none focus:border-[#3779b8]" />
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {[1,2,3,4,5,6].map((item) => <div key={item} className="h-36 animate-pulse rounded-lg bg-[#eef4f9]" />)}
              </div>
            ) : null}

            {!isLoading && (selectedCategory === "All Categories" ? visibleTiles.length === 0 : visibleSubcategories.length === 0) ? (
              <div className="p-10 text-center text-sm text-[#6f89a8]">No categories found.</div>
            ) : null}

            {!isLoading && selectedCategory === "All Categories" && visibleTiles.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6">
                {visibleTiles.map(({ name, slug, image, subcategories }) => (
                  <Link key={name} to={`/products?category=${slug}`} onClick={(event) => { event.preventDefault(); setSelectedCategory(name); setSearchTerm(""); }} className="category-tile group overflow-hidden rounded-xl border border-[#e1ebf4] bg-gradient-to-b from-[#fbfdff] to-[#f1f6fb] transition hover:-translate-y-0.5 hover:border-[#8bb3d7] hover:shadow-md">
                    <div className="flex h-24 items-center justify-center p-2 sm:h-28">
                      <img src={image || categoryImageFallback} alt={name} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" onError={(e) => { e.currentTarget.src = categoryImageFallback; }} />
                    </div>
                    <div className="category-name-section border-t border-[#e4edf5] px-2 py-2">
                      <h3 className="truncate text-[11px] font-extrabold text-[#123563] sm:text-[11px]">{name}</h3>
                      <p className="mt-1 hidden truncate text-[9px] text-[#6f89a8] sm:block">{subcategories.length ? `${subcategories.length} subcategories` : "Explore products"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            {!isLoading && selectedCategory !== "All Categories" && visibleSubcategories.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6">
                {visibleSubcategories.map((subcategory) => (
                  <Link key={subcategory._id || subcategory.slug || subcategory.name} to={`/products?category=${selectedCategoryData.slug}&subCategory=${subcategory.slug}`} className="category-tile group overflow-hidden rounded-xl border border-[#e1ebf4] bg-gradient-to-b from-[#fbfdff] to-[#f1f6fb] transition hover:-translate-y-0.5 hover:border-[#8bb3d7] hover:shadow-md">
                    <div className="flex h-24 items-center justify-center p-2 sm:h-28">
                      <img src={subcategory.image || categoryImageFallback} alt={subcategory.name} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" onError={(e) => { e.currentTarget.src = categoryImageFallback; }} />
                    </div>
                    <div className="category-name-section border-t border-[#e4edf5] px-2 py-2">
                      <h3 className="truncate text-[11px] font-extrabold text-[#123563] sm:text-[11px]">{subcategory.name}</h3>
                      <p className="mt-1 hidden truncate text-[9px] text-[#6f89a8] sm:block">{subcategory.productCount ? `${subcategory.productCount} products` : "Explore products"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-4 border-t border-[#e4edf5] pt-3 sm:mt-5 sm:pt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold sm:text-base">Popular Brands</h2>
                <Link to="/brands" className="text-[10px] font-semibold text-[#3779b8] sm:text-[11px]">View all <ChevronRight size={10} className="inline" /></Link>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {popularBrands.map(([name, logo]) => (
                  <Link key={name} to={`/products?brand=${encodeURIComponent(name)}`} className="category-brand-card flex h-12 items-center justify-center rounded-lg border border-[#e1ebf4] bg-white px-2 transition hover:border-[#8bb3d7] hover:shadow-sm sm:h-14">
                    <img src={logo} alt={name} className="max-h-7 w-full object-contain sm:max-h-9" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-[#e4edf5] pt-3 sm:mt-5 sm:pt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold sm:text-base">Featured Products</h2>
                <Link to="/products" className="text-[10px] font-semibold text-[#3779b8] sm:text-[11px]">Shop all <ChevronRight size={10} className="inline" /></Link>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {featuredProducts.map((product) => (
                  <Link key={product.id || product._id || product.name} to={`/products/${product.slug || product.id || product._id}`} className="category-featured-card group min-w-0 overflow-hidden rounded-xl border border-[#e1ebf4] bg-white p-2 transition hover:-translate-y-0.5 hover:border-[#8bb3d7] hover:shadow-sm">
                    <div className="flex h-20 items-center justify-center rounded-lg bg-[#f7fafd] sm:h-24"><img src={product.image || product.thumbnail || categoryImageFallback} alt={product.name} className="h-full w-full object-contain p-1 transition group-hover:scale-105" /></div>
                    <p className="mt-2 truncate text-[11px] font-bold text-[#123563] sm:text-[12px]">{product.name}</p>
                    <p className="mt-1 text-[10px] font-extrabold text-[#123563] sm:text-[11px]">₹{Number(product.price || 0).toLocaleString("en-IN")}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
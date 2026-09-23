import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext.jsx";
const API_BASE = import.meta.env.VITE_API_URL || "/api";
import {
  ChevronRight,
  ChevronDown,
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

  const featuredProducts = useMemo(() => {
    const categoryProducts = selectedCategory === "All Categories"
      ? products
      : products.filter((product) => product.category === selectedCategory);

    return (categoryProducts.length ? categoryProducts : products).slice(0, 4);
  }, [products, selectedCategory]);

  return (
        <main className="min-h-screen bg-[#f4f8fc] text-[#123563]">
          <section className="mx-auto max-w-360 px-1 pb-5 pt-2 sm:px-6 sm:pt-5 lg:px-10">
            <div className="mb-2 hidden items-center gap-2 text-[11px] font-semibold text-[#6f89a8] sm:flex">
              <Link to="/" className="hover:text-[#123563]">Home</Link>
              <ChevronRight size={13} />
              <span className="text-[#123563]">All Categories</span>
            </div>

            <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-1 sm:gap-3 lg:grid-cols-[218px_minmax(0,1fr)]">
              <aside className="overflow-hidden rounded-md border border-[#dbe7f3] bg-white shadow-[0_2px_8px_rgba(24,61,103,0.04)] sm:rounded-lg">
                <div className="hidden items-center gap-2 border-b border-[#e2ebf4] px-3 py-2.5 lg:flex">
                  <Grid2X2 size={17} className="text-[#123563]" />
                  <h2 className="text-[15px] font-extrabold">All Categories</h2>
                </div>
                <div className="p-0.5 sm:p-1.5">
                  <button type="button" onClick={() => setSelectedCategory("All Categories")} className={`flex w-full items-center justify-center rounded-md px-0.5 py-1 text-center text-[8px] font-bold sm:justify-between sm:px-2 sm:py-1.5 sm:text-left sm:text-[11px] ${selectedCategory === "All Categories" ? "bg-[#0862c6] text-white" : "text-[#123563] hover:bg-[#f1f6fb]"}`}>
                    <span className="truncate">All Categories</span><ChevronRight size={13} className="hidden sm:block" />
                  </button>
                  {categoryTiles.map((category) => (
                    <button key={category.name} type="button" onClick={() => setSelectedCategory(category.name)} className={`group flex w-full flex-col items-center gap-0.5 rounded-md px-0.5 py-1 text-center text-[7px] font-semibold leading-tight sm:flex-row sm:gap-2 sm:px-1 sm:py-1 sm:text-left sm:text-[10px] ${selectedCategory === category.name ? "bg-[#fff4cf] text-[#123563]" : "text-[#34577f] hover:bg-[#f1f6fb]"}`}>
                      <img src={category.image || categoryImageFallback} alt="" className="h-7 w-12 shrink-0 rounded object-contain sm:h-7 sm:w-10" onError={(e) => { e.currentTarget.src = categoryImageFallback; }} />
                      <span className="min-w-0 flex-1 truncate sm:pr-0.5">{category.name}</span>
                      <ChevronRight size={12} className="hidden shrink-0 text-[#87a1bd] group-hover:text-[#123563] sm:block" />
                    </button>
                  ))}
                </div>
              </aside>

              <div className="min-w-0 rounded-md border border-[#dbe7f3] bg-white p-1.5 shadow-[0_2px_8px_rgba(24,61,103,0.04)] sm:rounded-lg sm:p-4">
                <div className="mb-2 flex items-center justify-between gap-1 border-b border-[#e4edf5] pb-2 sm:mb-3 sm:gap-3 sm:pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#edf5fc] text-[#123563] sm:h-9 sm:w-9"><Grid2X2 size={16} /></div>
                    <div><h1 className="truncate text-sm font-extrabold sm:text-2xl">{selectedCategory}</h1><p className="hidden text-[10px] text-[#6f89a8] sm:block">Explore our range of high-quality {selectedCategory.toLowerCase()} for home, office and business.</p></div>
                  </div>
                  <div className="relative hidden w-full sm:block sm:w-48"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba4bd]" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search categories" className="h-8 w-full rounded-md border border-[#dbe7f3] bg-[#f8fbfe] pl-8 pr-2 text-[11px] outline-none focus:border-[#3779b8]" /></div>
                </div>

                <div className="mb-2 lg:hidden"><div className="relative"><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="hidden h-9 w-full appearance-none rounded-md border border-[#dbe7f3] bg-white px-3 pr-8 text-xs font-semibold"><option>All Categories</option>{categoryTiles.map((category) => <option key={category.name}>{category.name}</option>)}</select><ChevronDown size={15} className="hidden" /></div></div>

                {isLoading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-36 animate-pulse rounded-lg bg-[#eef4f9]" />)}</div> : null}
                {!isLoading && (selectedCategory === "All Categories" ? visibleTiles.length === 0 : visibleSubcategories.length === 0) ? <div className="p-10 text-center text-sm text-[#6f89a8]">No categories found.</div> : null}
                {!isLoading && selectedCategory === "All Categories" && visibleTiles.length > 0 ? <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6">{visibleTiles.map(({ name, slug, image, subcategories }) => <Link key={name} to={`/products?category=${slug}`} className="group overflow-hidden rounded-md border border-[#e1ebf4] bg-linear-to-b from-[#fbfdff] to-[#f1f6fb] transition hover:-translate-y-0.5 hover:border-[#8bb3d7] hover:shadow-md"><div className="flex h-20 items-center justify-center p-1 sm:h-28 sm:p-2"><img src={image || categoryImageFallback} alt={name} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" onError={(e) => { e.currentTarget.src = categoryImageFallback; }} /></div><div className="border-t border-[#e4edf5] px-1.5 py-1.5 sm:px-2.5 sm:py-2"><h3 className="truncate text-[8px] font-extrabold text-[#123563] sm:text-[11px]">{name}</h3><p className="mt-0.5 hidden truncate text-[9px] text-[#6f89a8] sm:block">{subcategories.length ? `${subcategories.length} subcategories` : "Explore products"}</p></div></Link>)}</div> : null}
                {!isLoading && selectedCategory !== "All Categories" && visibleSubcategories.length > 0 ? <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6">{visibleSubcategories.map((subcategory) => <Link key={subcategory._id || subcategory.slug || subcategory.name} to={`/products?category=${subcategory.slug || selectedCategoryData.slug}`} className="group overflow-hidden rounded-md border border-[#e1ebf4] bg-linear-to-b from-[#fbfdff] to-[#f1f6fb] transition hover:-translate-y-0.5 hover:border-[#8bb3d7] hover:shadow-md"><div className="flex h-20 items-center justify-center p-1 sm:h-28 sm:p-2"><img src={subcategory.image || categoryImageFallback} alt={subcategory.name} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" onError={(e) => { e.currentTarget.src = categoryImageFallback; }} /></div><div className="border-t border-[#e4edf5] px-1.5 py-1.5 sm:px-2.5 sm:py-2"><h3 className="truncate text-[8px] font-extrabold text-[#123563] sm:text-[11px]">{subcategory.name}</h3><p className="mt-0.5 hidden truncate text-[9px] text-[#6f89a8] sm:block">{subcategory.productCount ? `${subcategory.productCount} products` : "Explore products"}</p></div></Link>)}</div> : null}

                <div className="mt-3 border-t border-[#e4edf5] pt-2 sm:mt-5 sm:pt-3">
                  <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                    <h2 className="text-[10px] font-extrabold sm:text-sm">Popular Brands</h2>
                    <Link to="/brands" className="text-[8px] font-semibold text-[#3779b8] sm:text-[10px]">View all <ChevronRight size={10} className="inline" /></Link>
                  </div>
                  <div className="grid grid-cols-5 gap-1 sm:gap-2">
                    {popularBrands.map(([name, logo]) => (
                      <Link key={name} to={`/products?brand=${encodeURIComponent(name)}`} className="flex h-9 items-center justify-center rounded-md border border-[#e1ebf4] bg-white px-1 transition hover:border-[#8bb3d7] hover:shadow-sm sm:h-12 sm:px-2">
                        <img src={logo} alt={name} className="max-h-6 w-full object-contain sm:max-h-8" />
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-3 border-t border-[#e4edf5] pt-2 sm:mt-5 sm:pt-3">
                  <div className="mb-1.5 flex items-center justify-between sm:mb-2">
                    <h2 className="text-[10px] font-extrabold sm:text-sm">Featured Products</h2>
                    <Link to="/products" className="text-[8px] font-semibold text-[#3779b8] sm:text-[10px]">Shop all <ChevronRight size={10} className="inline" /></Link>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
                    {featuredProducts.map((product) => (
                      <Link key={product.id || product._id || product.name} to={`/products/${product.slug || product.id || product._id}`} className="group min-w-0 overflow-hidden rounded-md border border-[#e1ebf4] bg-white p-1.5 transition hover:-translate-y-0.5 hover:border-[#8bb3d7] hover:shadow-sm sm:p-2">
                        <div className="flex h-16 items-center justify-center rounded bg-[#f7fafd] sm:h-24"><img src={product.image || product.thumbnail || categoryImageFallback} alt={product.name} className="h-full w-full object-contain p-1 transition group-hover:scale-105" /></div>
                        <p className="mt-1 truncate text-[8px] font-bold text-[#123563] sm:text-[10px]">{product.name}</p>
                        <p className="mt-0.5 text-[9px] font-extrabold text-[#123563] sm:text-[11px]">₹{Number(product.price || 0).toLocaleString("en-IN")}</p>
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
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const categoryImageFallback = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010029/laptop_ktvxcs.png";

const categoryDescription = (name) => {
  const normalized = name || "Category";
  return `Browse all ${normalized.toLowerCase()} items and related subcategories available in the live catalog.`;
};

export default function Categories() {
  const [categoryTiles, setCategoryTiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const response = await fetch("/api/categories/tree");
        if (!response.ok) throw new Error("Unable to load categories");

        const data = await response.json();
        const trees = Array.isArray(data.categories) ? data.categories : [];

        const nextTiles = trees.map((category) => ({
          name: category.name || category.label || "Category",
          slug: category.slug || "",
          image: category.image || categoryImageFallback,
          subcategories: Array.isArray(category.subcategories) ? category.subcategories : [],
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

  const visibleTiles = useMemo(() => categoryTiles, [categoryTiles]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Explore categories</p>
            <h1 className="mt-4 text-4xl font-bold text-slate-950">Shop by Category</h1>
            <p className="mt-4 max-w-2xl text-slate-600">
              Discover every category and subcategory coming directly from the backend catalog.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Browse All Products
            <ChevronRight size={18} />
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-100 p-8 text-center text-slate-600">
            Loading categories from backend...
          </div>
        ) : null}

        {!isLoading && visibleTiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-100 p-8 text-center text-slate-600">
            No categories available from the backend API.
          </div>
        ) : null}

        <div className="space-y-6">
          {visibleTiles.map(({ name, slug, image, subcategories }) => (
            <div key={name} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-5 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
                <Link to={`/products?category=${slug}`} className="flex items-center gap-4 text-left">
                  <img src={image} alt={name} className="h-20 w-20 rounded-2xl object-cover" />
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">{name}</h2>
                    <p className="mt-1 text-sm text-slate-600">{categoryDescription(name)}</p>
                  </div>
                </Link>
                <Link
                  to={`/products?category=${slug}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                >
                  View all
                  <ChevronRight size={16} />
                </Link>
              </div>

              {subcategories.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-5">
                  {subcategories.map((subcategory) => (
                    <Link
                      key={subcategory._id || subcategory.slug || subcategory.name}
                      to={`/products?category=${subcategory.slug || slug}`}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-slate-950"
                    >
                      {subcategory.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

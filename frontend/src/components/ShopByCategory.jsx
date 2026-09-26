import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { slugifyCategory } from "../lib/products";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const FALLBACK_CATEGORY_IMAGE = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80";

export default function ShopByCategory() {
  const scrollRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/categories/tree?light=true`);
        if (!response.ok) {
          throw new Error("Failed to load categories");
        }

        const data = await response.json();
        const tree = Array.isArray(data?.categories) ? data.categories : [];

        if (!ignore) {
          setCategories(
            tree.filter((category) => category && category.name && category.isActive !== false).slice(0, 12)
          );
        }
      } catch (error) {
        console.error("Failed to load shop categories:", error);
        if (!ignore) setCategories([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full overflow-x-hidden px-0 py-6 sm:px-0">
      <div className="rounded-[22px] bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Shop by Category</h2>

          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-amber-500 hover:text-white sm:h-10 sm:w-10"
              type="button"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => scroll("right")}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-amber-500 hover:text-white sm:h-10 sm:w-10"
              type="button"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="min-w-[150px] rounded-xl border border-slate-200 bg-slate-100 p-3 sm:min-w-[180px]">
                <div className="mx-auto h-20 w-28 animate-pulse rounded-lg bg-slate-200" />
                <div className="mt-3 h-4 w-20 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((category) => {
              const firstSubcategory = category.subcategories?.[0];
              const image = category.image || category.icon || firstSubcategory?.image || FALLBACK_CATEGORY_IMAGE;
              const route = firstSubcategory
                ? `/products?category=${slugifyCategory(category.name)}&subCategory=${slugifyCategory(firstSubcategory.name)}`
                : `/products?category=${slugifyCategory(category.name)}`;

              return (
                <Link
                  key={category._id || category.slug || category.name}
                  to={route}
                  className="home-category-card group min-w-[150px] rounded-xl border border-slate-200 bg-white p-3 text-center transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-md sm:min-w-[180px]"
                >
                  <img
                    src={image}
                    alt={category.name}
                    className="mx-auto h-20 w-28 rounded-lg object-cover transition group-hover:scale-105 sm:h-24 sm:w-32"
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_CATEGORY_IMAGE;
                    }}
                  />
                  <p className="home-category-title mt-3 text-sm font-semibold text-slate-700">{category.name}</p>
                  <div className="mx-auto mt-2 h-0.5 w-7 bg-amber-300" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
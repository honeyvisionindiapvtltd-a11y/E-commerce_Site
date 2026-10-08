import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { slugifyCategory } from "../lib/products";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const FALLBACK_CATEGORY_IMAGE = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80";
const getCategoryKey = (category) => category._id || category.slug || category.name;

export default function ShopByCategory({
  className = "",
  title = "Shop by Category",
  mode = "categories",
}) {
  const scrollRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("all");
  const isSubcategoryMode = mode === "subcategories";

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
            tree.filter((category) => category && category.name && category.isActive !== false)
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
    const list = scrollRef.current;
    if (!list) return;

    const firstCard = list.firstElementChild;
    const cardStep = firstCard
      ? firstCard.getBoundingClientRect().width +
        Number.parseFloat(window.getComputedStyle(list).columnGap || "0")
      : 300;

    list.scrollBy({
      left: (direction === "left" ? -1 : 1) * (isSubcategoryMode ? cardStep : 300),
      behavior: "smooth",
    });
  };

  const visibleCategories =
    selectedCategoryKey === "all"
      ? categories
      : categories.filter((category) => getCategoryKey(category) === selectedCategoryKey);

  const subcategories = isSubcategoryMode
    ? visibleCategories.flatMap((category) =>
        (Array.isArray(category.subcategories) ? category.subcategories : [])
          .filter((subcategory) => subcategory?.name && subcategory.isActive !== false)
          .map((subcategory) => ({
            ...subcategory,
            parentName: category.name,
            parentImage: category.image || category.icon,
          }))
      )
    : [];

  return (
    <section className={`shop-category-section w-full overflow-x-hidden px-0 py-3 sm:px-0 sm:py-4 ${isSubcategoryMode ? "subcategory-image-section" : ""} ${className}`}>
      <div className="shop-category-panel rounded-[22px] bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>

          <div className="flex gap-2" aria-label={`Scroll ${isSubcategoryMode ? "subcategories" : "categories"}`}>
            <button
              onClick={() => scroll("left")}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-amber-500 hover:text-white sm:h-10 sm:w-10"
              type="button"
              aria-label={`Scroll ${isSubcategoryMode ? "subcategories" : "categories"} left`}
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => scroll("right")}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-amber-500 hover:text-white sm:h-10 sm:w-10"
              type="button"
              aria-label={`Scroll ${isSubcategoryMode ? "subcategories" : "categories"} right`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {isSubcategoryMode && !loading && (
          <div
            className="subcategory-category-filter mb-3"
            role="group"
            aria-label="Filter subcategories by category"
          >
            <button
              type="button"
              className={`subcategory-category-filter-button ${selectedCategoryKey === "all" ? "is-active" : ""}`}
              aria-pressed={selectedCategoryKey === "all"}
              onClick={() => setSelectedCategoryKey("all")}
            >
              All
            </button>
            {categories.map((category) => {
              const categoryKey = getCategoryKey(category);
              const isActive = selectedCategoryKey === categoryKey;

              return (
                <button
                  key={categoryKey}
                  type="button"
                  className={`subcategory-category-filter-button ${isActive ? "is-active" : ""}`}
                  aria-pressed={isActive}
                  onClick={() => setSelectedCategoryKey(categoryKey)}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className={`flex gap-3 overflow-x-auto pb-2 ${isSubcategoryMode ? "subcategory-image-list" : ""}`}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={`shop-category-skeleton min-w-[150px] rounded-xl border border-slate-200 bg-slate-100 p-3 sm:min-w-[180px] ${isSubcategoryMode ? "subcategory-image-skeleton" : ""}`}
              >
                <div className="mx-auto h-20 w-28 animate-pulse rounded-lg bg-slate-200" />
                {!isSubcategoryMode && <div className="mt-3 h-4 w-20 animate-pulse rounded bg-slate-200" />}
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className={`shop-category-list flex gap-3 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isSubcategoryMode ? "subcategory-image-list" : ""}`}
          >
            {isSubcategoryMode
              ? subcategories.length > 0
                ? subcategories.map((subcategory) => (
                  <Link
                    key={`${subcategory.parentName}-${subcategory._id || subcategory.slug || subcategory.name}`}
                    to={`/products?category=${slugifyCategory(subcategory.parentName)}&subCategory=${slugifyCategory(subcategory.name)}`}
                    className="subcategory-image-card group"
                    aria-label={`Browse ${subcategory.name}`}
                    title={subcategory.name}
                  >
                    <img
                      src={subcategory.image || subcategory.icon || subcategory.parentImage || FALLBACK_CATEGORY_IMAGE}
                      alt={subcategory.name}
                      loading="lazy"
                      className="subcategory-image"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_CATEGORY_IMAGE;
                      }}
                    />
                    <span className="subcategory-image-name">{subcategory.name}</span>
                  </Link>
                ))
                : <p className="subcategory-empty-message">{selectedCategoryKey === "all" ? "No subcategories are available yet." : "No subcategories are available for this category."}</p>
              : categories.map((category) => {
                  const firstSubcategory = category.subcategories?.[0];
                  const image = category.image || category.icon || firstSubcategory?.image || FALLBACK_CATEGORY_IMAGE;
                  const route = firstSubcategory
                    ? `/products?category=${slugifyCategory(category.name)}&subCategory=${slugifyCategory(firstSubcategory.name)}`
                    : `/products?category=${slugifyCategory(category.name)}`;

                  return (
                    <Link
                      key={category._id || category.slug || category.name}
                      to={route}
                      className="home-category-card shop-category-tile group min-w-[150px] rounded-xl border border-slate-200 bg-white p-3 text-center transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-md sm:min-w-[180px]"
                    >
                      <img
                        src={image}
                        alt={category.name}
                        className="shop-category-image mx-auto h-20 w-28 rounded-lg object-cover transition group-hover:scale-105 sm:h-24 sm:w-32"
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_CATEGORY_IMAGE;
                        }}
                      />
                      <p className="home-category-title shop-category-title mt-3 text-sm font-semibold text-slate-700">{category.name}</p>
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
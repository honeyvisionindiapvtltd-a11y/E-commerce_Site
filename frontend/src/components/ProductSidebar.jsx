import {
  useEffect,
  useState,
} from "react";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  Package,
  X,
  RotateCcw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function ProductSidebar({
  categories = [],
  selectedCategorySlug = "",
  selectedSubCategorySlug = "",
  drawerOnly = false,
  isOpen = true,
  isLoading = false,
  onClose = () => {},
}) {
  const navigate = useNavigate();

  const [expandedCategories, setExpandedCategories] =
    useState({});

  // ==========================================
  // AUTO EXPAND SELECTED CATEGORY
  // ==========================================

  useEffect(() => {
    if (!selectedCategorySlug) {
      return;
    }

    setExpandedCategories(
      (previous) => ({
        ...previous,
        [selectedCategorySlug]: true,
      })
    );
  }, [
    selectedCategorySlug,
  ]);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const goToCategory = (
    category
  ) => {
    const params =
      new URLSearchParams();

    params.set(
      "category",
      category.slug
    );

    params.set(
      "page",
      "1"
    );

    navigate(
      `/products?${params.toString()}`
    );

    onClose();
  };

  const goToSubCategory = (
    category,
    subcategory
  ) => {
    const params =
      new URLSearchParams();

    params.set(
      "category",
      category.slug
    );

    params.set(
      "subCategory",
      subcategory.slug
    );

    params.set(
      "page",
      "1"
    );

    navigate(
      `/products?${params.toString()}`
    );

    onClose();
  };

  const clearFilters = () => {
    navigate(
      "/products"
    );

    onClose();
  };

  // ==========================================
  // EXPAND / COLLAPSE
  // ==========================================

  const toggleCategory = (
    slug
  ) => {
    setExpandedCategories(
      (previous) => ({
        ...previous,
        [slug]:
          !previous[slug],
      })
    );
  };

  // ==========================================
  // CONTENT
  // ==========================================

  const content = (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

        <div>
          <h2 className="text-base font-black text-[#071426]">
            Categories
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Browse products
          </p>
        </div>

        {drawerOnly && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        )}

      </div>

      {/* ALL PRODUCTS */}
      <div className="p-3">

        <button
          type="button"
          onClick={
            clearFilters
          }
          className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition ${
            !selectedCategorySlug &&
            !selectedSubCategorySlug
              ? "bg-amber-50 text-[#071426]"
              : "text-slate-700 hover:bg-slate-50"
          }`}
        >

          <div className="flex items-center gap-3">

            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                !selectedCategorySlug &&
                !selectedSubCategorySlug
                  ? "bg-amber-400 text-[#071426]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <Package
                size={17}
              />
            </div>

            <div>
              <div className="text-sm font-bold">
                All Products
              </div>

              <div className="text-xs text-slate-400">
                Complete catalog
              </div>
            </div>

          </div>

          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
            {getTotalCount(
              categories
            )}
          </span>

        </button>

      </div>

      {/* CATEGORY LIST */}
      <div className="px-3 pb-4">

        {isLoading ? (
          <CategorySkeleton />
        ) : categories.length ===
          0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center">

            <Folder
              size={25}
              className="mx-auto text-slate-300"
            />

            <p className="mt-2 text-sm font-semibold text-slate-500">
              No categories found
            </p>

          </div>
        ) : (
          <div className="space-y-1">

            {categories.map(
              (category) => {
                const isSelected =
                  selectedCategorySlug ===
                  category.slug;

                const isExpanded =
                  expandedCategories[
                    category.slug
                  ];

                const subcategories =
                  Array.isArray(
                    category.subcategories
                  )
                    ? category.subcategories
                    : [];

                return (
                  <div
                    key={
                      category._id ||
                      category.slug
                    }
                  >

                    {/* MAIN CATEGORY */}
                    <div
                      className={`flex items-center rounded-2xl transition ${
                        isSelected
                          ? "bg-amber-50"
                          : "hover:bg-slate-50"
                      }`}
                    >

                      <button
                        type="button"
                        onClick={() =>
                          goToCategory(
                            category
                          )
                        }
                        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
                      >

                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isSelected
                              ? "bg-amber-400 text-[#071426]"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Folder
                            size={17}
                          />
                        </div>

                        <span
                          className={`min-w-0 flex-1 truncate text-sm ${
                            isSelected
                              ? "font-black text-[#071426]"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {
                            category.name
                          }
                        </span>

                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                          {Number(
                            category.productCount ||
                              0
                          )}
                        </span>

                      </button>

                      {subcategories.length >
                        0 && (
                        <button
                          type="button"
                          onClick={() =>
                            toggleCategory(
                              category.slug
                            )
                          }
                          className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-[#071426]"
                          aria-label={
                            isExpanded
                              ? "Collapse category"
                              : "Expand category"
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown
                              size={17}
                            />
                          ) : (
                            <ChevronRight
                              size={17}
                            />
                          )}
                        </button>
                      )}

                    </div>

                    {/* SUBCATEGORIES */}
                    {isExpanded &&
                      subcategories.length >
                        0 && (
                        <div className="ml-5 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">

                          {subcategories.map(
                            (
                              subcategory
                            ) => {
                              const isSubSelected =
                                selectedSubCategorySlug ===
                                subcategory.slug;

                              return (
                                <button
                                  key={
                                    subcategory._id ||
                                    subcategory.slug
                                  }
                                  type="button"
                                  onClick={() =>
                                    goToSubCategory(
                                      category,
                                      subcategory
                                    )
                                  }
                                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                                    isSubSelected
                                      ? "bg-amber-50 text-[#071426]"
                                      : "text-slate-600 hover:bg-slate-50"
                                  }`}
                                >

                                  <span
                                    className={`min-w-0 truncate text-sm ${
                                      isSubSelected
                                        ? "font-bold"
                                        : "font-medium"
                                    }`}
                                  >
                                    {
                                      subcategory.name
                                    }
                                  </span>

                                  <span className="shrink-0 text-xs font-bold text-slate-400">
                                    {Number(
                                      subcategory.productCount ||
                                        0
                                    )}
                                  </span>

                                </button>
                              );
                            }
                          )}

                        </div>
                      )}

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* RESET */}
      {(selectedCategorySlug ||
        selectedSubCategorySlug) && (
        <div className="border-t border-slate-200 p-4">

          <button
            type="button"
            onClick={
              clearFilters
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-amber-400 hover:text-[#071426]"
          >
            <RotateCcw
              size={16}
            />
            Clear Categories
          </button>

        </div>
      )}

    </div>
  );

  // ==========================================
  // DESKTOP
  // ==========================================

  if (!drawerOnly) {
    return content;
  }

  // ==========================================
  // MOBILE DRAWER
  // ==========================================

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">

      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Close filters"
      />

      <div className="absolute left-0 top-0 h-full w-[320px] max-w-[90vw] overflow-y-auto bg-[#f6f8fb] p-4 shadow-2xl">
        {content}
      </div>

    </div>
  );
}

// ==========================================
// TOTAL CATEGORY COUNT
// ==========================================

function getTotalCount(
  categories
) {
  return categories.reduce(
    (total, category) =>
      total +
      Number(
        category.productCount || 0
      ),
    0
  );
}

// ==========================================
// LOADING SKELETON
// ==========================================

function CategorySkeleton() {
  return (
    <div className="space-y-3 px-2 py-3">

      {Array.from({
        length: 7,
      }).map(
        (_, index) => (
          <div
            key={index}
            className="flex items-center gap-3"
          >
            <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200" />

            <div className="h-4 flex-1 animate-pulse rounded bg-slate-200" />

            <div className="h-5 w-8 animate-pulse rounded-full bg-slate-200" />
          </div>
        )
      )}

    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import {
  useSearchParams,
  useNavigate,
} from "react-router-dom";

import {
  LayoutGrid,
  List,
  ChevronDown,
  SlidersHorizontal,
  Package,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import ProductSidebar from "../components/ProductSidebar";
import CategoryLandingHero from "../components/CategoryLandingHero";
import ProductGrid from "../components/ProductGrid";
import SkeletonGrid from "../components/SkeletonGrid";
import FilterChips from "../components/FilterChips";

import {
  normalizeProduct,
} from "../lib/products";

export default function Products() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const navigate = useNavigate();

  const [products, setProducts] = useState([]);

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [categoryLoading, setCategoryLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [gridView, setGridView] =
    useState(true);

  const [filterOpen, setFilterOpen] =
    useState(false);

  const [apiTotal, setApiTotal] =
    useState(0);

  const [apiPages, setApiPages] =
    useState(1);

  // ==========================================
  // URL PARAMETERS
  // ==========================================

  const categorySlug =
    searchParams.get("category") || "";

  const subCategorySlug =
    searchParams.get("subCategory") || "";

  const searchQuery =
    searchParams.get("q") ||
    searchParams.get("search") ||
    "";

  const selectedBrand =
    searchParams.get("brand") || "";

  const minPrice =
    searchParams.get("minPrice") || "";

  const maxPrice =
    searchParams.get("maxPrice") || "";

  const inStock =
    searchParams.get("inStock") === "true";

  const sort =
    searchParams.get("sort") || "popular";

  const page = Math.max(
    1,
    Number(searchParams.get("page") || 1)
  );

  const limit = Math.max(
    1,
    Number(searchParams.get("limit") || 24)
  );

  // ==========================================
  // FIND SELECTED CATEGORY FROM REAL API DATA
  // ==========================================

  const selectedCategory = useMemo(() => {
    if (!categorySlug) {
      return null;
    }

    const category =
      categories.find(
        (item) =>
          item.slug === categorySlug
      );

    return category || null;
  }, [
    categories,
    categorySlug,
  ]);

  const selectedSubCategory = useMemo(() => {
    if (
      !categorySlug ||
      !subCategorySlug
    ) {
      return null;
    }

    const parent =
      categories.find(
        (item) =>
          item.slug === categorySlug
      );

    if (!parent) {
      return null;
    }

    return (
      parent.subcategories?.find(
        (item) =>
          item.slug ===
          subCategorySlug
      ) || null
    );
  }, [
    categories,
    categorySlug,
    subCategorySlug,
  ]);

  // ==========================================
  // LOAD CATEGORY TREE
  // ==========================================

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      setCategoryLoading(true);

      try {
        const response = await fetch(
          "/api/categories/tree"
        );

        if (!response.ok) {
          throw new Error(
            `Category API failed with status ${response.status}`
          );
        }

        const data =
          await response.json();

        if (!mounted) return;

        setCategories(
          Array.isArray(data?.categories)
            ? data.categories
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load categories:",
          error
        );

        if (mounted) {
          setCategories([]);
        }
      } finally {
        if (mounted) {
          setCategoryLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================
  // BUILD PRODUCT QUERY
  // ==========================================

  const buildProductQuery = () => {
    const query =
      new URLSearchParams();

    if (categorySlug) {
      query.set(
        "category",
        categorySlug
      );
    }

    if (subCategorySlug) {
      query.set(
        "subCategory",
        subCategorySlug
      );
    }

    // IMPORTANT:
    // Backend now supports q as well.
    if (searchQuery.trim()) {
      query.set(
        "q",
        searchQuery.trim()
      );
    }

    if (selectedBrand) {
      query.set(
        "brand",
        selectedBrand
      );
    }

    if (minPrice) {
      query.set(
        "minPrice",
        minPrice
      );
    }

    if (maxPrice) {
      query.set(
        "maxPrice",
        maxPrice
      );
    }

    if (inStock) {
      query.set(
        "inStock",
        "true"
      );
    }

    if (
      sort &&
      sort !== "popular"
    ) {
      query.set(
        "sort",
        sort
      );
    }

    query.set(
      "page",
      String(page)
    );

    query.set(
      "limit",
      String(limit)
    );

    return query;
  };

  // ==========================================
  // LOAD PRODUCTS
  // ==========================================

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const query =
          buildProductQuery();

        const response =
          await fetch(
            `/api/products?${query.toString()}`
          );

        if (!response.ok) {
          throw new Error(
            `Products API failed with status ${response.status}`
          );
        }

        const data =
          await response.json();

        if (!mounted) return;

        const productList =
          Array.isArray(
            data?.products
          )
            ? data.products.map(normalizeProduct)
            : [];

        setProducts(productList);

        setApiTotal(
          Number(
            data?.totalProducts || 0
          )
        );

        setApiPages(
          Number(
            data?.totalPages || 1
          )
        );
      } catch (error) {
        console.error(
          "Failed to load products:",
          error
        );

        if (!mounted) return;

        setProducts([]);
        setApiTotal(0);
        setApiPages(1);

        setError(
          error?.message ||
            "Unable to load products."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [
    categorySlug,
    subCategorySlug,
    searchQuery,
    selectedBrand,
    minPrice,
    maxPrice,
    inStock,
    sort,
    page,
    limit,
  ]);

  // ==========================================
  // NO CLIENT-SIDE CATEGORY FILTERING
  //
  // Backend already does this.
  // This avoids [object Object] problems
  // caused by populated MongoDB categories.
  // ==========================================

  const filteredProducts =
    products;

  // ==========================================
  // FILTER CHIPS
  // ==========================================

  const chips = useMemo(() => {
    const list = [];

    if (searchQuery) {
      list.push({
        key: "q",
        label: `Search: "${searchQuery}"`,
      });
    }

    if (categorySlug) {
      list.push({
        key: "category",
        label: `Category: ${
          selectedCategory?.name ||
          categorySlug
        }`,
      });
    }

    if (subCategorySlug) {
      list.push({
        key: "subCategory",
        label: `Subcategory: ${
          selectedSubCategory?.name ||
          subCategorySlug.replaceAll(
            "-",
            " "
          )
        }`,
      });
    }

    if (selectedBrand) {
      list.push({
        key: "brand",
        label: `Brand: ${selectedBrand}`,
      });
    }

    if (minPrice) {
      list.push({
        key: "minPrice",
        label: `Min ₹${Number(
          minPrice
        ).toLocaleString("en-IN")}`,
      });
    }

    if (maxPrice) {
      list.push({
        key: "maxPrice",
        label: `Max ₹${Number(
          maxPrice
        ).toLocaleString("en-IN")}`,
      });
    }

    if (inStock) {
      list.push({
        key: "inStock",
        label: "In Stock",
      });
    }

    if (sort !== "popular") {
      list.push({
        key: "sort",
        label:
          sort === "price_low"
            ? "Price: Low to High"
            : sort === "price_high"
            ? "Price: High to Low"
            : "Newest",
      });
    }

    return list;
  }, [
    searchQuery,
    categorySlug,
    subCategorySlug,
    selectedCategory,
    selectedSubCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    inStock,
    sort,
  ]);

  // ==========================================
  // URL HELPERS
  // ==========================================

  const updateParams = (
    updates = {}
  ) => {
    const params =
      new URLSearchParams(
        searchParams
      );

    Object.entries(
      updates
    ).forEach(
      ([key, value]) => {
        if (
          value === null ||
          value === undefined ||
          value === ""
        ) {
          params.delete(key);
        } else {
          params.set(
            key,
            String(value)
          );
        }
      }
    );

    setSearchParams(params);
  };

  const handleRemoveChip = (
    chip
  ) => {
    const params =
      new URLSearchParams(
        searchParams
      );

    params.delete(chip.key);

    if (
      chip.key ===
        "category" ||
      chip.key ===
        "subCategory"
    ) {
      params.delete(
        "category"
      );

      params.delete(
        "subCategory"
      );
    }

    params.set(
      "page",
      "1"
    );

    setSearchParams(params);
  };

  const handleClearChips = () => {
    navigate("/products");
  };

  const handleSortChange = (
    event
  ) => {
    updateParams({
      sort:
        event.target.value,
      page: 1,
    });
  };

  // ==========================================
  // PAGE TITLE
  // ==========================================

  const pageTitle =
    searchQuery
      ? `Search results for "${searchQuery}"`
      : selectedSubCategory
      ? selectedSubCategory.name
      : selectedCategory
      ? selectedCategory.name
      : "All IT Products";

  const pageSubtitle =
    searchQuery
      ? "Explore products matching your search"
      : selectedSubCategory
      ? `Browse all ${selectedSubCategory.name.toLowerCase()} products`
      : selectedCategory
      ? `Browse all ${selectedCategory.name.toLowerCase()} products`
      : "Explore cameras, networking, computers, displays, storage, power solutions and complete IT equipment.";

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalProducts =
    apiTotal;

  const totalPages =
    Math.max(
      1,
      apiPages
    );

  const currentStart =
    totalProducts === 0
      ? 0
      : (page - 1) *
          limit +
        1;

  const currentEnd =
    totalProducts === 0
      ? 0
      : Math.min(
          page * limit,
          totalProducts
        );

  const hasPrevious =
    page > 1;

  const hasNext =
    page < totalPages;

  const goToPage = (
    newPage
  ) => {
    if (
      newPage < 1 ||
      newPage > totalPages
    ) {
      return;
    }

    updateParams({
      page: newPage,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const getPageNumbers =
    () => {
      const pages = [];

      if (totalPages <= 5) {
        for (
          let i = 1;
          i <= totalPages;
          i++
        ) {
          pages.push(i);
        }

        return pages;
      }

      pages.push(1);

      if (page > 3) {
        pages.push("...");
      }

      const start = Math.max(
        2,
        page - 1
      );

      const end = Math.min(
        totalPages - 1,
        page + 1
      );

      for (
        let i = start;
        i <= end;
        i++
      ) {
        pages.push(i);
      }

      if (
        page <
        totalPages - 2
      ) {
        pages.push("...");
      }

      pages.push(
        totalPages
      );

      return pages;
    };

  // ==========================================
  // UI
  // ==========================================

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#071426]">

      {/* HEADER */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-375 px-4 py-7 sm:px-6 lg:px-8">

          <div className="mb-5 flex items-center gap-2 text-sm text-slate-500">

            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
              className="transition hover:text-[#071426]"
            >
              Home
            </button>

            <span>/</span>

            <span className="font-medium text-[#071426]">
              Products
            </span>

            {selectedCategory && (
              <>
                <span>/</span>

                <span className="text-slate-500">
                  {
                    selectedCategory.name
                  }
                </span>
              </>
            )}

            {selectedSubCategory && (
              <>
                <span>/</span>

                <span className="text-slate-500">
                  {
                    selectedSubCategory.name
                  }
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div className="max-w-3xl">

              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-600">
                <Sparkles size={14} />
                HoneyVision IT Store
              </div>

              <h1 className="text-3xl font-black tracking-tight text-[#071426] sm:text-4xl lg:text-5xl">
                {pageTitle}
              </h1>

              <p className="mt-3 text-base leading-7 text-slate-500">
                {pageSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-3">

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">

                <div className="text-xs font-medium text-slate-500">
                  Products
                </div>

                <div className="mt-0.5 text-xl font-black text-[#071426]">
                  {totalProducts}
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-amber-400 hover:text-amber-500"
                title="Refresh products"
              >
                <RefreshCw
                  size={18}
                />
              </button>

            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section className="mx-auto max-w-375 px-4 py-7 sm:px-6 lg:px-8">

        <div className="grid gap-7 lg:grid-cols-[270px_minmax(0,1fr)]">

          {/* SIDEBAR */}
          <aside className="lg:sticky lg:top-24 lg:self-start">

            <ProductSidebar
              categories={
                categories
              }
              selectedCategorySlug={
                categorySlug
              }
              selectedSubCategorySlug={
                subCategorySlug
              }
              drawerOnly={false}
              isOpen={
                filterOpen
              }
              isLoading={
                categoryLoading
              }
              onClose={() =>
                setFilterOpen(
                  false
                )
              }
            />

            <div className="mt-5 hidden overflow-hidden rounded-3xl bg-[#061a36] p-6 text-white shadow-xl lg:block">

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-[#071426]">
                <Package
                  size={21}
                />
              </div>

              <h3 className="text-xl font-bold">
                Need Help?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Not sure which product
                is right for you? Our IT
                experts can help.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/contact"
                  )
                }
                className="mt-5 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-[#071426] transition hover:bg-amber-300"
              >
                Contact Us
              </button>
            </div>
          </aside>

          {/* PRODUCTS */}
          <section className="min-w-0">

            <div className="mb-6 overflow-hidden rounded-3xl">
              <CategoryLandingHero
                title={pageTitle}
                subtitle={
                  pageSubtitle
                }
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

              {/* TOOLBAR */}
              <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">

                <div className="flex flex-wrap items-center gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setFilterOpen(
                        true
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:text-[#071426] lg:hidden"
                  >
                    <SlidersHorizontal
                      size={17}
                    />
                    Filters
                  </button>

                  <div className="relative">

                    <select
                      value={sort}
                      onChange={
                        handleSortChange
                      }
                      className="h-11 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value="popular">
                        Popularity
                      </option>

                      <option value="price_low">
                        Price: Low to High
                      </option>

                      <option value="price_high">
                        Price: High to Low
                      </option>

                      <option value="newest">
                        Newest
                      </option>
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">

                  <div className="text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-bold text-[#071426]">
                      {currentStart}-
                      {currentEnd}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-[#071426]">
                      {totalProducts}
                    </span>
                  </div>

                  <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">

                    <button
                      type="button"
                      onClick={() =>
                        setGridView(
                          true
                        )
                      }
                      className={`flex h-9 w-10 items-center justify-center rounded-lg transition ${
                        gridView
                          ? "bg-amber-400 text-[#071426] shadow-sm"
                          : "text-slate-500 hover:text-[#071426]"
                      }`}
                    >
                      <LayoutGrid
                        size={18}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setGridView(
                          false
                        )
                      }
                      className={`flex h-9 w-10 items-center justify-center rounded-lg transition ${
                        !gridView
                          ? "bg-amber-400 text-[#071426] shadow-sm"
                          : "text-slate-500 hover:text-[#071426]"
                      }`}
                    >
                      <List
                        size={18}
                      />
                    </button>

                  </div>
                </div>
              </div>

              {/* CHIPS */}
              {chips.length >
                0 && (
                <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
                  <FilterChips
                    chips={
                      chips
                    }
                    onRemove={
                      handleRemoveChip
                    }
                    onClear={
                      handleClearChips
                    }
                  />
                </div>
              )}

              {/* PRODUCT AREA */}
              <div className="p-4 sm:p-5">

                {error &&
                  !loading && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5">

                      <h3 className="font-bold text-red-800">
                        Unable to load
                        products
                      </h3>

                      <p className="mt-1 text-sm text-red-600">
                        {error}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          window.location.reload()
                        }
                        className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Retry
                      </button>

                    </div>
                  )}

                {loading && (
                  <SkeletonGrid
                    gridView={
                      gridView
                    }
                    count={limit}
                  />
                )}

                {!loading &&
                  !error &&
                  filteredProducts.length ===
                    0 && (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">

                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                        <Package
                          size={28}
                        />
                      </div>

                      <h2 className="mt-5 text-2xl font-bold text-[#071426]">
                        No products
                        found
                      </h2>

                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        We couldn't find
                        products matching
                        your current
                        filters.
                      </p>

                      <button
                        type="button"
                        onClick={
                          handleClearChips
                        }
                        className="mt-6 rounded-xl bg-[#061a36] px-6 py-3 text-sm font-bold text-white transition hover:bg-amber-400 hover:text-[#071426]"
                      >
                        Browse All
                        Products
                      </button>

                    </div>
                  )}

                {!loading &&
                  !error &&
                  filteredProducts.length >
                    0 && (
                    <ProductGrid
                      products={
                        filteredProducts
                      }
                      gridView={
                        gridView
                      }
                    />
                  )}
              </div>
            </div>

            {/* PAGINATION */}
            {!loading &&
              !error &&
              totalProducts >
                0 &&
              totalPages >
                1 && (
                <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

                  <div className="text-sm text-slate-500">
                    Page{" "}
                    <span className="font-bold text-[#071426]">
                      {page}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-[#071426]">
                      {totalPages}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      disabled={
                        !hasPrevious
                      }
                      onClick={() =>
                        goToPage(
                          page - 1
                        )
                      }
                      className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-amber-400 hover:text-[#071426] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft
                        size={17}
                      />
                      <span className="hidden sm:inline">
                        Previous
                      </span>
                    </button>

                    {getPageNumbers().map(
                      (
                        pageNumber,
                        index
                      ) =>
                        pageNumber ===
                        "..." ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="flex h-10 w-8 items-center justify-center text-slate-400"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={
                              pageNumber
                            }
                            type="button"
                            onClick={() =>
                              goToPage(
                                pageNumber
                              )
                            }
                            className={`h-10 min-w-10 rounded-xl px-3 text-sm font-bold transition ${
                              pageNumber ===
                              page
                                ? "bg-amber-400 text-[#071426] shadow-sm"
                                : "border border-slate-200 text-slate-600 hover:border-amber-400 hover:text-[#071426]"
                            }`}
                          >
                            {
                              pageNumber
                            }
                          </button>
                        )
                    )}

                    <button
                      type="button"
                      disabled={
                        !hasNext
                      }
                      onClick={() =>
                        goToPage(
                          page + 1
                        )
                      }
                      className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-amber-400 hover:text-[#071426] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="hidden sm:inline">
                        Next
                      </span>
                      <ChevronRight
                        size={17}
                      />
                    </button>

                  </div>
                </div>
              )}

            {/* TRUST BAR */}
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">

              <TrustItem
                icon={
                  <CheckCircle2
                    size={19}
                  />
                }
                title="Original Products"
                text="Genuine IT equipment"
              />

              <TrustItem
                icon={
                  <Package
                    size={19}
                  />
                }
                title="Secure Packaging"
                text="Safe delivery across India"
              />

              <TrustItem
                icon={
                  <Sparkles
                    size={19}
                  />
                }
                title="Expert Support"
                text="Professional assistance"
              />

              <TrustItem
                icon={
                  <RefreshCw
                    size={19}
                  />
                }
                title="Easy Service"
                text="Installation & AMC support"
              />

            </div>

          </section>
        </div>
      </section>
    </main>
  );
}

// ==========================================
// TRUST ITEM
// ==========================================

function TrustItem({
  icon,
  title,
  text,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-start gap-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
          {icon}
        </div>

        <div className="min-w-0">

          <h3 className="text-sm font-bold text-[#071426]">
            {title}
          </h3>

          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            {text}
          </p>

        </div>

      </div>
    </div>
  );
}
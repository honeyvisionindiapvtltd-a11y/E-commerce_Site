import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Grid2X2,
  Headphones,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useCatalog } from "../context/CatalogContext.jsx";
import { useCommerce } from "../context/index.js";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const categoryImageFallback =
  "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010029/laptop_ktvxcs.png";

const popularBrands = [
  ["Hikvision", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172596/Hikvision_logo_joawjl.png"],
  ["Dahua", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172595/Dahua_Technology_logo_veja1o.jpg"],
  ["CP Plus", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377702/cp_plus-logo_asuqmb.png"],
  ["Honeywell", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377703/Honeywell-Logo_cdkjfy.svg"],
  ["Prama", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1787377702/prama-logo_pqskkz.png"],
  ["TP-Link", "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172593/Tp-Link_logo_2016_tlbnnn.png"],
];

const heroImages = [
  {
    src: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1791460545/application_based_opgyfw.png",
    alt: "AI PTZ security camera",
    className: "categories-hero-camera",
  },
  {
    src: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1791527381/368-3686253_cctv-camera-with-dvr-png-clipart_p7tmjw.png",
    alt: "Office security system",
    className: "categories-hero-combo",
  },
  {
    src: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1788069523/Samsung_Ultrawide_Monitors_m2acv9.webp",
    alt: "Laptop and connected technology",
    className: "categories-hero-laptop",
  },
];

export default function Categories() {
  const { products } = useCatalog();
  const { addToCart } = useCommerce();
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
        const trees = Array.isArray(data.categories) ? data.categories : [];
        const nextTiles = trees
          .filter((category) => category && category.name && category.isActive !== false)
          .map((category) => ({
            name: category.name,
            slug: category.slug || "",
            image: category.image || category.icon || categoryImageFallback,
            subcategories: Array.isArray(category.subcategories)
              ? category.subcategories.filter((subcategory) => subcategory?.isActive !== false)
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

  useEffect(() => {
    if (selectedCategory === "All Categories") return;

    selectedCategoryButtonRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedCategory, categoryTiles]);

  const visibleCategories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return categoryTiles.filter((category) => {
      const matchesSelected =
        selectedCategory === "All Categories" || category.name === selectedCategory;
      if (!query) return matchesSelected;

      return matchesSelected && (
        category.name.toLowerCase().includes(query) ||
        category.subcategories.some((subcategory) =>
          (subcategory.name || "").toLowerCase().includes(query)
        )
      );
    });
  }, [categoryTiles, searchTerm, selectedCategory]);

  const selectedCategoryData = useMemo(
    () => categoryTiles.find((category) => category.name === selectedCategory),
    [categoryTiles, selectedCategory]
  );

  const visibleTiles = selectedCategory === "All Categories"
    ? visibleCategories
    : (selectedCategoryData?.subcategories || []).filter((subcategory) => (
      !searchTerm.trim() ||
      (subcategory.name || "").toLowerCase().includes(searchTerm.trim().toLowerCase())
    ));

  const featuredProducts = useMemo(() => {
    const catalog = Array.isArray(products) ? products : [];
    if (selectedCategory === "All Categories") return catalog.slice(0, 5);

    const matchingProducts = catalog.filter((product) => (
      product.category === selectedCategory ||
      product.category?.name === selectedCategory
    ));
    const matchingIds = new Set(matchingProducts.map((product) => String(product.id || product._id)));
    return [
      ...matchingProducts,
      ...catalog.filter((product) => !matchingIds.has(String(product.id || product._id))),
    ].slice(0, 5);
  }, [products, selectedCategory]);

  const selectCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    setSearchTerm("");
  };

  return (
    <main className="categories-page categories-redesign">
      <div className="categories-layout">
        <div className="categories-breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={13} />
          <span>Categories</span>
        </div>

        <div className="categories-mobile-filter" aria-label="Filter by category">
          <button
            type="button"
            className={selectedCategory === "All Categories" ? "is-active" : ""}
            aria-pressed={selectedCategory === "All Categories"}
            onClick={() => selectCategory("All Categories")}
          >
            All Categories
          </button>
          {categoryTiles.map((category) => (
            <button
              key={category.name}
              ref={selectedCategory === category.name ? selectedCategoryButtonRef : null}
              type="button"
              className={selectedCategory === category.name ? "is-active" : ""}
              aria-pressed={selectedCategory === category.name}
              onClick={() => selectCategory(category.name)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="categories-columns">
          <aside className="categories-sidebar">
            <div className="categories-sidebar-heading">
              <Grid2X2 size={18} />
              <span>All Categories</span>
            </div>
            <button
              type="button"
              className={`categories-sidebar-row ${selectedCategory === "All Categories" ? "is-selected" : ""}`}
              onClick={() => selectCategory("All Categories")}
            >
              <span className="categories-sidebar-all-icon"><Grid2X2 size={15} /></span>
              <span className="categories-sidebar-name">All Categories</span>
              <span className="categories-sidebar-count">{categoryTiles.length}</span>
            </button>
            <div className="categories-sidebar-list">
              {categoryTiles.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  className={`categories-sidebar-row ${selectedCategory === category.name ? "is-selected" : ""}`}
                  onClick={() => selectCategory(category.name)}
                >
                  <img
                    src={category.image}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = categoryImageFallback;
                    }}
                  />
                  <span className="categories-sidebar-name">{category.name}</span>
                  <span className="categories-sidebar-count">{category.subcategories.length}</span>
                </button>
              ))}
            </div>
            <div className="categories-expert-card">
              <img
                src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1791460549/indoor_camera_i7yryb.png"
                alt=""
                loading="lazy"
              />
              <p className="categories-expert-title">Need help choosing?</p>
              <p className="categories-expert-copy">Talk with our team to find the right solution.</p>
              <Link to="/contact">
                Talk to an Expert <ArrowRight size={13} />
              </Link>
            </div>
          </aside>

          <div className="categories-main">
            <section className="categories-hero">
              <div className="categories-hero-copy">
                <p className="categories-eyebrow"><span /> Our categories</p>
                <h1>Explore Our Product Categories</h1>
                <p className="categories-hero-description">
                  Find the perfect technology solutions for your home, office and business.
                </p>
                <div className="categories-hero-benefits">
                  <span><ShieldCheck size={17} /> Genuine Products</span>
                  <span><Truck size={17} /> Fast Delivery</span>
                  <span><Headphones size={17} /> Expert Support</span>
                </div>
              </div>
              <div className="categories-hero-art" aria-hidden="true">
                {heroImages.map((image) => (
                  <img
                    key={image.className}
                    src={image.src}
                    alt={image.alt}
                    className={image.className}
                  />
                ))}
              </div>
            </section>

            <section className="categories-section" id="category-grid">
              <div className="categories-section-heading">
                <h2>{selectedCategory === "All Categories" ? "Shop by Category" : `Explore ${selectedCategory}`}</h2>
                <div className="categories-heading-actions">
                  <label className="categories-search">
                    <Search size={14} />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search categories"
                    />
                  </label>
                  {selectedCategory !== "All Categories" && (
                    <button type="button" onClick={() => selectCategory("All Categories")}>
                      All Categories <ArrowRight size={13} />
                    </button>
                  )}
                  {selectedCategory === "All Categories" && (
                    <Link to="/products">
                      View All Categories <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="categories-grid">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div className="categories-card-skeleton" key={index} />
                  ))}
                </div>
              ) : visibleTiles.length ? (
                <div className="categories-grid">
                  {selectedCategory === "All Categories"
                    ? visibleTiles.map((category) => (
                      <button
                        type="button"
                        key={category.name}
                        className="categories-card"
                        onClick={() => selectCategory(category.name)}
                      >
                        <span className="categories-card-image">
                          <img
                            src={category.image}
                            alt={category.name}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.src = categoryImageFallback;
                            }}
                          />
                        </span>
                        <span className="categories-card-info">
                          <strong>{category.name}</strong>
                          <small>{category.subcategories.length} subcategories</small>
                        </span>
                        <span className="categories-card-arrow"><ArrowRight size={12} /></span>
                      </button>
                    ))
                    : visibleTiles.map((subcategory) => (
                      <Link
                        key={subcategory._id || subcategory.slug || subcategory.name}
                        className="categories-card"
                        to={`/products?category=${selectedCategoryData?.slug || ""}&subCategory=${subcategory.slug || ""}`}
                      >
                        <span className="categories-card-image">
                          <img
                            src={subcategory.image || categoryImageFallback}
                            alt={subcategory.name}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.src = categoryImageFallback;
                            }}
                          />
                        </span>
                        <span className="categories-card-info">
                          <strong>{subcategory.name}</strong>
                          <small>{subcategory.productCount || 0} products</small>
                        </span>
                        <span className="categories-card-arrow"><ArrowRight size={12} /></span>
                      </Link>
                    ))}
                </div>
              ) : (
                <p className="categories-empty">
                  {isLoading ? "Loading categories..." : "No categories found. Try a different search."}
                </p>
              )}
            </section>

            <section className="categories-section categories-brands">
              <div className="categories-section-heading">
                <h2>Popular Brands</h2>
                <Link to="/brands">View All Brands <ArrowRight size={13} /></Link>
              </div>
              <div className="categories-brand-grid">
                {popularBrands.map(([name, logo]) => (
                  <Link key={name} to={`/products?brand=${encodeURIComponent(name)}`} aria-label={`Shop ${name}`}>
                    <img src={logo} alt={name} loading="lazy" />
                  </Link>
                ))}
              </div>
            </section>

            <section className="categories-section categories-featured">
              <div className="categories-section-heading">
                <h2>Featured Products</h2>
                <Link to="/products">View All Featured Products <ArrowRight size={13} /></Link>
              </div>
              {featuredProducts.length ? (
                <div className="categories-product-grid">
                  {featuredProducts.map((product, index) => {
                    const productId = product.id || product._id;
                    const price = Number(product.price || 0);
                    const mrp = Number(product.mrp || 0);
                    const hasDiscount = mrp > price && mrp > 0;
                    const discount = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;
                    const productImage = product.image || product.thumbnail || categoryImageFallback;

                    return (
                      <article className="categories-product-card" key={productId || product.name}>
                        {index === 0 && <span className="categories-product-badge">Featured</span>}
                        <Link to={`/products/${product.slug || productId}`} className="categories-product-image">
                          <img src={productImage} alt={product.name} loading="lazy" />
                        </Link>
                        <div className="categories-product-details">
                          <Link to={`/products/${product.slug || productId}`} className="categories-product-name">
                            {product.name}
                          </Link>
                          <div className="categories-product-rating" aria-label={`Rated ${product.rating || 0} out of 5`}>
                            <span>★★★★★</span>
                            <small>({Number(product.reviews || 0)})</small>
                          </div>
                          <div className="categories-product-pricing">
                            <strong>₹{price.toLocaleString("en-IN")}</strong>
                            {hasDiscount && <del>₹{mrp.toLocaleString("en-IN")}</del>}
                            {discount > 0 && <span>{discount}% OFF</span>}
                          </div>
                          <button
                            type="button"
                            className="categories-add-to-cart"
                            disabled={Number(product.stock) <= 0}
                            onClick={() => addToCart(productId, 1, false, product)}
                          >
                            <ShoppingCart size={13} />
                            {Number(product.stock) <= 0 ? "Out of Stock" : "Add to Cart"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="categories-empty">Featured products will appear here when available.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

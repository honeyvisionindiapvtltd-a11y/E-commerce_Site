import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useCommerce } from "../context/index.js";
import DeliveryAvailability from "../components/DeliveryAvailability";
import ReviewCard from "../components/ReviewCard";
import ShopByCategory from "../components/ShopByCategory";
import { getProductGallery, money, normalizeProduct } from "../lib/products";
import { getRecentlyViewed, trackRecentlyViewed } from "../lib/recentlyViewed";
import { getCanonicalUrl, removeJsonLd, setJsonLd, setPageMetadata } from "../utils/seoMetadata";
import {
  Heart,
  Share2,
  Star,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  GitCompareArrows,
  Check,
  PackageCheck,
  Headphones,
  Zap,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const SUPPORT_EMAIL = "support@honeyvision.in";

const FALLBACK_IMAGE =
  "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786017607/AI_PTZ_Camera_jdwn7h.webp";

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getDiscountPercent(price, mrp) {
  const currentPrice = safeNumber(price);
  const originalPrice = safeNumber(mrp);

  if (originalPrice <= currentPrice || originalPrice <= 0) return 0;

  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

function ProductImage({ src, alt, className = "", style }) {
  const [failedSrc, setFailedSrc] = useState("");

  return (
    <img
      src={src && failedSrc !== src ? src : FALLBACK_IMAGE}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  );
}

function EmptyState({ children }) {
  return (
    <section className="min-h-screen bg-[#f5f7fb] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        {children}
      </div>
    </section>
  );
}

function TrustItem({ icon: Icon, title, subtitle, iconClass = "text-emerald-600" }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 px-3 py-3">
      <Icon size={18} className={`shrink-0 ${iconClass}`} />
      <div className="min-w-0">
        <p className="truncate text-[10px] font-extrabold text-slate-800 sm:text-xs">
          {title}
        </p>
        <p className="truncate text-[9px] text-slate-400 sm:text-[10px]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function MiniBenefit({ icon: Icon, title, subtitle, iconClass }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 ${iconClass}`}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-extrabold text-slate-800">
          {title}
        </p>
        <p className="truncate text-[9px] text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

const productPromoSlides = [
  {
    title: "Smart Security Upgrades",
    subtitle: "Get premium protection and installation-ready essentials for every corner of your home.",
    button: "Explore Deals",
    href: "/products",
    accent: "#f2b900",
    gradient: "linear-gradient(135deg, #fff7d6 0%, #f7f0ff 45%, #eef6ff 100%)",
  },
  {
    title: "Bundle & Save More",
    subtitle: "Pair cameras, storage and accessories to build a complete surveillance setup with extra savings.",
    button: "View Bundles",
    href: "/products",
    accent: "#0f766e",
    gradient: "linear-gradient(135deg, #ecfeff 0%, #dbeafe 48%, #fef3c7 100%)",
  },
  {
    title: "Expert Support Included",
    subtitle: "Talk to our team for product guidance, installation help and system recommendations.",
    button: "Book a Call",
    href: "/contact",
    accent: "#2563eb",
    gradient: "linear-gradient(135deg, #e0f2fe 0%, #f5f3ff 45%, #fefce8 100%)",
  },
];

function ProductPromoBannerStrip() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % productPromoSlides.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="product-banner-strip mt-4">
      <div className="product-banner-viewport">
        <div
          className="product-banner-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {productPromoSlides.map((slide) => (
            <article
              key={slide.title}
              className="product-banner-slide"
              style={{ background: slide.gradient }}
            >
              <div className="product-banner-copy">
                <span
                  className="product-banner-kicker"
                  style={{ color: slide.accent }}
                >
                  Honey Vision
                </span>
                <h3>{slide.title}</h3>
                <p>{slide.subtitle}</p>
                <Link to={slide.href} className="product-banner-button">
                  {slide.button}
                </Link>
              </div>

              <div
                className="product-banner-badge"
                style={{ backgroundColor: slide.accent }}
              >
                Special Offer
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="product-banner-dots" aria-label="Banner navigation">
        {productPromoSlides.map((slide, index) => (
          <button
            key={`${slide.title}-dot`}
            type="button"
            aria-label={`Go to banner ${index + 1}`}
            className={index === activeIndex ? "is-active" : ""}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { products, user, addToCart, addBundleToCart, toggleWishlist, wishlist } = useCommerce();
  const userId = user?.id || user?._id || null;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const purchaseBoxRef = useRef(null);
  const [showMobilePurchaseBar, setShowMobilePurchaseBar] = useState(false);
  const [imageSelection, setImageSelection] = useState({ productId: null, index: 0 });
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [specificationsExpanded, setSpecificationsExpanded] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [cartStatus, setCartStatus] = useState("");
  const recentlyViewed = useMemo(
    () => getRecentlyViewed(userId)
      .filter((id) => String(id) !== String(product?.id))
      .map((id) => products.find((item) => String(item.id) === String(id)))
      .filter(Boolean)
      .slice(0, 4)
      .map((item) => normalizeProduct(item)),
    [product?.id, products, userId]
  );
  const [relatedCatalogProducts, setRelatedCatalogProducts] = useState([]);
  const [relatedProductsLoading, setRelatedProductsLoading] = useState(false);
  const galleryTouchStartX = useRef(null);
  const [bundleResponse, setBundleResponse] = useState({ productId: "", status: "idle", bundles: [] });
  const [addingBundleId, setAddingBundleId] = useState("");
  const [bundleCartMessage, setBundleCartMessage] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const purchaseBox = purchaseBoxRef.current;
    if (!purchaseBox) return undefined;

    const updateVisibility = () => {
      const purchaseBoxPassed = purchaseBox.getBoundingClientRect().bottom < 0;
      const footerTop = document.querySelector(".site-footer")?.getBoundingClientRect().top;
      const footerVisible = footerTop !== undefined && footerTop < window.innerHeight;

      setShowMobilePurchaseBar(purchaseBoxPassed && !footerVisible);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [product?.id]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "mobile-purchase-bar-visible",
      showMobilePurchaseBar
    );
    return () => document.documentElement.classList.remove("mobile-purchase-bar-visible");
  }, [showMobilePurchaseBar]);

  useEffect(() => {
    if (product && String(product.id) !== String(productId)) return;

    if (!product) {
      if (!loading) {
        setPageMetadata({
          title: "Product not found | Honey Vision",
          description: "This product may have been removed or is no longer available.",
          canonicalUrl: getCanonicalUrl(`/products/${encodeURIComponent(productId || "")}`),
          robots: "noindex,follow",
        });
        removeJsonLd("honeyvision-product-jsonld", "honeyvision-breadcrumb-jsonld");
      }
      return;
    }

    const canonicalPath = `/products/${encodeURIComponent(productId)}`;
    const canonicalUrl = getCanonicalUrl(canonicalPath);
    const description = String(product.metaDescription || product.description || "").trim()
      || `${product.name} from Honey Vision.`;
    const title = String(product.metaTitle || "").trim()
      || `${product.name} | Honey Vision`;
    const imageUrls = (product.seoImages || [])
      .map((image) => {
        try {
          const url = new URL(image, "https://honeyvision.co.in");
          return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    setPageMetadata({
      title,
      description,
      canonicalUrl,
      image: imageUrls[0],
      type: "product",
    });

    const productStructuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description,
      url: canonicalUrl,
      ...(imageUrls.length ? { image: imageUrls } : {}),
      ...(product.sku ? { sku: String(product.sku) } : {}),
      ...(product.brand ? { brand: { "@type": "Brand", name: String(product.brand) } } : {}),
    };
    const productPrice = Number(product.price);
    if (Number.isFinite(productPrice) && productPrice >= 0) {
      productStructuredData.offers = {
        "@type": "Offer",
        url: canonicalUrl,
        priceCurrency: "INR",
        price: productPrice,
        availability: Number(product.stock) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      };
    }
    setJsonLd("honeyvision-product-jsonld", productStructuredData);

    const breadcrumbItems = [
      { name: "Home", url: getCanonicalUrl("/") },
      { name: "Products", url: getCanonicalUrl("/products") },
    ];
    if (product.categorySlug) {
      breadcrumbItems.push({
        name: product.category,
        url: getCanonicalUrl(`/products?category=${encodeURIComponent(product.categorySlug)}`),
      });
    }
    if (product.subCategorySlug) {
      const subcategoryQuery = new URLSearchParams({
        ...(product.categorySlug ? { category: product.categorySlug } : {}),
        subCategory: product.subCategorySlug,
      });
      breadcrumbItems.push({
        name: product.subCategory,
        url: getCanonicalUrl(`/products?${subcategoryQuery.toString()}`),
      });
    }
    breadcrumbItems.push({ name: product.name, url: canonicalUrl });
    setJsonLd("honeyvision-breadcrumb-jsonld", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    });

    return () => removeJsonLd("honeyvision-product-jsonld", "honeyvision-breadcrumb-jsonld");
  }, [loading, product, productId]);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      if (!productId) {
        setProduct(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const contextProduct = products.find(
        (item) => String(item.id) === String(productId)
      );

      if (contextProduct && !cancelled) {
        const normalized = normalizeProduct(contextProduct);
        setProduct(normalized);
      }

      try {
        const response = await fetch(
          `${API_BASE}/products/${encodeURIComponent(productId)}`
        );

        if (!response.ok) {
          throw new Error(`Product request failed: ${response.status}`);
        }

        const data = await response.json();
        const apiProduct = data?.product || data?.data || data;

        if (apiProduct && !cancelled) {
          const normalized = normalizeProduct(apiProduct);
          setProduct(normalized);
        }
      } catch {
        if (!cancelled && !contextProduct) {
          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId, products]);

  useEffect(() => {
    let cancelled = false;

    async function loadRelatedProducts() {
      if (!product?.id) {
        setRelatedCatalogProducts([]);
        setRelatedProductsLoading(false);
        return;
      }

      const params = [];
      if (product.categorySlug) params.push(`category=${encodeURIComponent(product.categorySlug)}`);
      if (product.subCategorySlug) params.push(`subCategory=${encodeURIComponent(product.subCategorySlug)}`);

      if (!params.length) {
        setRelatedCatalogProducts([]);
        setRelatedProductsLoading(false);
        return;
      }

      setRelatedProductsLoading(true);
      const results = await Promise.all(params.map(async (param) => {
        try {
          const response = await fetch(`${API_BASE}/products?${param}&limit=100`);
          if (!response.ok) return [];
          const data = await response.json();
          const items = Array.isArray(data?.products) ? data.products : [];
          return items.map(normalizeProduct).filter(Boolean);
        } catch {
          return [];
        }
      }));

      if (!cancelled) {
        setRelatedCatalogProducts(results.flat());
        setRelatedProductsLoading(false);
      }
    }

    loadRelatedProducts();

    return () => {
      cancelled = true;
    };
  }, [product?.id, product?.categorySlug, product?.subCategorySlug]);

  useEffect(() => {
    if (!product?.id) return undefined;

    let active = true;
    fetch(`${API_BASE}/bundles/product/${encodeURIComponent(product.id)}`)
      .then((response) => {
        if (!response.ok) throw new Error("Bundle request failed");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setBundleResponse({
          productId: String(product.id),
          status: "loaded",
          bundles: Array.isArray(data?.bundles) ? data.bundles : [],
        });
      })
      .catch(() => {
        if (!active) return;
        setBundleResponse({ productId: String(product.id), status: "failed", bundles: [] });
      });

    return () => { active = false; };
  }, [product?.id]);

  const bundleStateIsCurrent = Boolean(product?.id)
    && String(bundleResponse.productId) === String(product.id);
  const bundleLoadStatus = bundleStateIsCurrent ? bundleResponse.status : product?.id ? "loading" : "idle";
  const bundles = bundleStateIsCurrent ? bundleResponse.bundles : [];

  const handleAddBundleToCart = async (bundleId) => {
    setAddingBundleId(bundleId);
    setBundleCartMessage("");
    try {
      const response = await fetch(`${API_BASE}/cart/bundle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleId, quantity: 1 }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.bundle) throw new Error(data.message || "This bundle is unavailable.");
      addBundleToCart(bundleId, data.bundle);
      setBundleCartMessage("Bundle added to cart.");
    } catch (error) {
      setBundleCartMessage(error.message || "This bundle is unavailable.");
    } finally {
      setAddingBundleId("");
    }
  };

  const images = useMemo(() => {
    const gallery = getProductGallery(product || {});
    const validImages = Array.isArray(gallery)
      ? gallery.filter(Boolean)
      : [];

    if (validImages.length > 0) {
      return [...new Set(validImages)];
    }

    if (product?.image) {
      return [product.image];
    }

    return [FALLBACK_IMAGE];
  }, [product]);

  const imageIndex = Math.min(
    imageSelection.productId === product?.id ? imageSelection.index : 0,
    images.length - 1
  );
  const visibleThumbs = images;

  useEffect(() => {
    if (!product?.id) return;

    trackRecentlyViewed(product.id, userId);
  }, [product?.id, products, userId]);

  // Fetch product reviews
  useEffect(() => {
    if (!productId) return;

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const response = await fetch(
          `${API_BASE}/reviews/product/${productId}`
        );

        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  const inWishlist = Boolean(
    product &&
      Array.isArray(wishlist) &&
      wishlist.some((id) => String(id) === String(product.id))
  );

  const relatedProducts = useMemo(() => {
    if (!product?.id) return [];

    const normalizedCatalog = [...products, ...relatedCatalogProducts].map(normalizeProduct).filter(Boolean);
    const catalogById = new Map(normalizedCatalog.map((item) => [String(item.id), item]));
    const explicitRelated = (Array.isArray(product.relatedProducts) ? product.relatedProducts : [])
      .map((item) => {
        if (item && typeof item === "object") return normalizeProduct(item);
        return catalogById.get(String(item));
      })
      .filter((item) => item && String(item.id) !== String(product.id));
    const explicitRelatedIds = new Set(explicitRelated.map((item) => String(item.id)));
    const relationKeys = (...values) => new Set(values
      .filter(Boolean)
      .flatMap((value) => {
        const normalized = String(value).trim().toLowerCase();
        const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return [normalized, slug, slug.replaceAll("-and-", "-")];
      }));
    const sharesKey = (left, right) => [...left].some((key) => right.has(key));
    const productSubCategoryKeys = relationKeys(product.subCategorySlug, product.subCategory);
    const productCategoryKeys = relationKeys(product.categorySlug, product.category);
    const categoryRelated = normalizedCatalog.filter((item) =>
      {
        const itemSubCategoryKeys = relationKeys(item.subCategorySlug, item.subCategory);
        const itemCategoryKeys = relationKeys(item.categorySlug, item.category);
        return String(item.id) !== String(product.id)
          && !explicitRelatedIds.has(String(item.id))
          && (
            sharesKey(productSubCategoryKeys, itemSubCategoryKeys)
            || sharesKey(productCategoryKeys, itemCategoryKeys)
          );
      }
    );

    return [...explicitRelated, ...categoryRelated]
      .filter((item, index, items) => items.findIndex((candidate) => String(candidate.id) === String(item.id)) === index)
      .slice(0, 25);
  }, [products, product, relatedCatalogProducts]);

  const price = safeNumber(product?.price);
  const mrp = safeNumber(product?.mrp);
  const stock = Math.max(0, safeNumber(product?.stock));
  const discount = getDiscountPercent(price, mrp);
  const hasDiscount = discount > 0;
  const maxQuantity = stock > 0 ? stock : 1;

  const requestMessage = encodeURIComponent(
    `Hi Honey Vision, I need help with ${
      product?.name || "a product"
    }. Please contact me.`
  );

  const handleBuyNow = () => {
    if (!product || stock <= 0) return;
    navigate("/checkout", {
      state: {
        buyNowItem: {
          productId: product.id,
          quantity,
          installation: false,
          product,
        },
      },
    });
  };

  const handleAddToCart = () => {
    if (!product || stock <= 0) return;
    addToCart(product.id, quantity, false, product);
    setCartStatus(`${quantity} item${quantity === 1 ? "" : "s"} added to cart`);
    window.setTimeout(() => setCartStatus(""), 2200);
  };

  const handleQuantityChange = (nextQuantity) => {
    const next = Math.max(1, Math.min(maxQuantity, nextQuantity));
    setQuantity(next);
  };

  const handleShare = async () => {
    if (!product) return;

    const shareUrl =
      typeof window !== "undefined" ? window.location.href : "";

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} from Honey Vision India`,
          url: shareUrl,
        });
        setShareStatus("Shared successfully");
      } else if (
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("Product link copied");
      } else if (typeof window !== "undefined") {
        window.prompt("Copy this product link", shareUrl);
        setShareStatus("Copy the link manually");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        setShareStatus("Unable to share right now");
      }
    }

    window.setTimeout(() => setShareStatus(""), 2200);
  };

  const handleCompare = () => {
    if (!product) return;
    const selectedIds = [...new Set([...searchParams.getAll("compare"), product.id].filter(Boolean))].slice(0, 3);
    const compareParams = new URLSearchParams();
    selectedIds.forEach((id) => compareParams.append("compare", id));
    navigate(`/compare?${compareParams.toString()}`);
  };

  const selectImage = (index) => {
    if (!images.length) return;

    const nextIndex = index < 0
      ? images.length - 1
      : index >= images.length
        ? 0
        : index;

    setImageSelection({ productId: product?.id ?? null, index: nextIndex });
  };

  const handleGalleryTouchStart = (event) => {
    galleryTouchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleGalleryTouchEnd = (event) => {
    if (galleryTouchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX ?? galleryTouchStartX.current;
    const deltaX = endX - galleryTouchStartX.current;
    galleryTouchStartX.current = null;

    if (Math.abs(deltaX) < 35) return;

    if (deltaX < 0) {
      selectImage(imageIndex + 1);
    } else {
      selectImage(imageIndex - 1);
    }
  };

  if (loading && !product) {
    return (
      <EmptyState>
        <div className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-slate-100">
          <PackageCheck className="text-slate-400" size={26} />
        </div>
        <h2 className="mt-5 text-xl font-bold text-[#071426]">
          Loading product...
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Please wait while we load the latest product information.
        </p>
      </EmptyState>
    );
  }

  if (!product) {
    return (
      <EmptyState>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <PackageCheck size={26} />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold text-[#071426]">
          Product not found
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          This product may have been removed or is no longer available.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex rounded-xl bg-[#071426] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0b315a]"
        >
          Browse Products
        </Link>
      </EmptyState>
    );
  }

  const specificationRows = [
    ["Brand", product.brand],
    ["Model", product.model],
    ["Camera Type", product.cameraType],
    ["Technology", product.technology],
    ["Resolution", product.resolution],
    ["Night Vision", product.nightVisionType || (product.nightVision ? "Yes" : undefined)],
    ["Connectivity", product.connectivity],
    ["Lens", product.lens],
    ["Protection", product.ipRating],
    ["Power", product.powerType],
    [
      "Applications",
      Array.isArray(product.applications)
        ? product.applications.join(", ")
        : product.applications,
    ],
  ].filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );

  const features =
    Array.isArray(product.features) && product.features.length
      ? product.features
      : [
          "High quality build",
          "Reliable daily performance",
          "Easy installation",
          "Professional support",
        ];

  return (
    <section className="product-details-page bg-[#f5f7fb] pb-6 pt-4 text-[#071426]">
      <div className="mx-auto max-w-[1450px] px-3 sm:px-5 lg:px-7">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 overflow-hidden px-1 text-xs sm:text-sm">
          <Link
            to="/"
            className="shrink-0 text-slate-500 transition hover:text-[#d59f00]"
          >
            Home
          </Link>
          <ChevronRight size={13} className="shrink-0 text-slate-400" />
          <Link
            to="/products"
            className="shrink-0 text-slate-500 transition hover:text-[#d59f00]"
          >
            Products
          </Link>
          {product.categorySlug && (
            <>
              <ChevronRight size={13} className="shrink-0 text-slate-400" />
              <Link
                to={`/products?category=${encodeURIComponent(product.categorySlug)}`}
                className="shrink-0 text-slate-500 transition hover:text-[#d59f00]"
              >
                {product.category}
              </Link>
            </>
          )}
          {product.subCategorySlug && (
            <>
              <ChevronRight size={13} className="shrink-0 text-slate-400" />
              <Link
                to={`/products?${new URLSearchParams({
                  ...(product.categorySlug ? { category: product.categorySlug } : {}),
                  subCategory: product.subCategorySlug,
                }).toString()}`}
                className="shrink-0 text-slate-500 transition hover:text-[#d59f00]"
              >
                {product.subCategory}
              </Link>
            </>
          )}
          <ChevronRight size={13} className="shrink-0 text-slate-400" />
          <span className="truncate font-bold text-slate-700">
            {product.name}
          </span>
        </nav>

        {/* =========================================================
            MAIN LAYOUT
            Mobile: flex with reordering (gallery, price, specs, delivery)
            Desktop: 2-column grid (left: gallery, specs, delivery | right: price)
           ========================================================= */}
        <div className="product-main-layout flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:auto-rows-max lg:gap-4">
          {/* =========================
              LEFT CARD - Gallery
             ========================= */}
          <div className="product-gallery-card order-1 flex min-w-0 flex-col rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_12px_38px_rgba(7,20,38,.07)] sm:p-4 lg:order-none lg:col-start-1 lg:row-start-1">
            {/* Gallery */}
            <div className="flex min-w-0 gap-3">
              {/* Thumbnails */}
              <div className="hidden w-[82px] shrink-0 sm:flex">
                <div className="flex max-h-[360px] w-full flex-col gap-2.5 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => selectImage(index)}
                      className={`product-image-surface flex h-[70px] w-[70px] items-center justify-center overflow-hidden rounded-xl border bg-white p-1 transition ${
                        index === imageIndex
                          ? "border-[#f2b900] bg-[#fffaf0] ring-2 ring-[#f2b900]/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      aria-label={`View product image ${index + 1}`}
                    >
                      <ProductImage
                        src={image}
                        alt=""
                        className="h-full w-full object-contain"
                        style={{ filter: stock <= 0 ? "grayscale(1)" : "none" }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Main image panel */}
              <div className="min-w-0 flex-1">
                <div
                  className="product-main-image product-image-surface relative flex min-h-[330px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200 bg-[radial-gradient(circle_at_center,#ffffff_0%,#f7f9fc_75%)] sm:min-h-[395px] lg:min-h-[420px]"
                  onTouchStart={handleGalleryTouchStart}
                  onTouchEnd={handleGalleryTouchEnd}
                >
                  {stock <= 0 && (
                    <span className="absolute bottom-4 left-4 z-10 rounded-full bg-red-600 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md sm:bottom-5 sm:left-5 sm:text-xs">
                      Out of stock
                    </span>
                  )}
                  <div className="absolute left-3 top-3 z-10 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-[10px] font-extrabold text-slate-600 shadow-sm">
                    {imageIndex + 1} / {images.length}
                  </div>

                  <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => toggleWishlist(product.id)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white shadow-sm transition hover:shadow-md ${
                        inWishlist
                          ? "border-[#f2b900] text-[#d59f00]"
                          : "border-slate-200 text-slate-700"
                      }`}
                      aria-label="Toggle wishlist"
                    >
                      <Heart
                        size={17}
                        fill={inWishlist ? "currentColor" : "none"}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:shadow-md"
                      aria-label="Share product"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={images.length <= 1 || imageIndex === 0}
                    onClick={() => selectImage(imageIndex - 1)}
                    className="absolute left-2.5 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:scale-105 disabled:opacity-25"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="product-gallery-slider h-full w-full" style={{ transform: `translateX(-${imageIndex * 100}%)` }}>
                    {images.map((image, index) => (
                      <div key={`${image}-${index}`} className="product-gallery-slide h-full w-full">
                        <ProductImage
                          src={image}
                          alt={`${product.name} image ${index + 1}`}
                          className="max-h-[360px] w-[87%] object-contain p-3 transition duration-500 hover:scale-[1.02] sm:max-h-[390px]"
                          style={{ filter: stock <= 0 ? "grayscale(1)" : "none" }}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={
                      images.length <= 1 ||
                      imageIndex === images.length - 1
                    }
                    onClick={() => selectImage(imageIndex + 1)}
                    className="absolute right-2.5 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:scale-105 disabled:opacity-25"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>

                  {/* Slider dots */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {images.map((_, index) => (
                        <button
                          key={`dot-${index}`}
                          type="button"
                          onClick={() => selectImage(index)}
                          className={`h-1.5 rounded-full transition-all ${
                            index === imageIndex
                              ? "w-5 bg-[#071426]"
                              : "w-1.5 bg-slate-300"
                          }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile thumbnails */}
                <div className="mobile-product-thumbnails mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden">
                  {visibleThumbs.map((image, index) => (
                    <button
                      key={`mobile-${image}-${index}`}
                      type="button"
                      onClick={() => selectImage(index)}
                      className={`product-image-surface h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-white p-1 ${
                        index === imageIndex
                          ? "border-[#f2b900] ring-2 ring-[#f2b900]/20"
                          : "border-slate-200"
                      }`}
                    >
                      <ProductImage
                        src={image}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Trust strip */}
            <div className="product-trust-strip mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50">
              <TrustItem
                icon={ShieldCheck}
                title="Genuine Product"
                subtitle="100% Original"
                iconClass="text-emerald-600"
              />
              <TrustItem
                icon={Truck}
                title="Fast Delivery"
                subtitle="Pan India"
                iconClass="text-blue-600"
              />
              <TrustItem
                icon={Headphones}
                title="Expert Support"
                subtitle="7 Days a Week"
                iconClass="text-[#d59f00]"
              />
            </div>


          </div>

          {/* =========================
              RIGHT CARD - Price + Purchase
             ========================= */}
          <div className="product-info-card order-2 flex min-w-0 flex-col rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_38px_rgba(7,20,38,.07)] sm:p-5 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-3">
            {/* Header */}
            <div className="product-info-header flex items-center justify-between gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-extrabold text-blue-700 ring-1 ring-blue-100">
                {product.brand || "Honey Vision"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCompare}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-[10px] font-extrabold text-slate-600 transition hover:border-[#f2b900] hover:bg-[#fffaf0]"
                >
                  <GitCompareArrows size={14} />
                  Compare
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                    inWishlist
                      ? "border-[#f2b900] bg-[#fffaf0] text-[#d59f00]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  aria-label="Toggle wishlist"
                >
                  <Heart
                    size={15}
                    fill={inWishlist ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </div>

            {/* Product title */}
            <h1 className="product-info-title mt-4 text-[25px] font-extrabold leading-[1.18] tracking-[-0.025em] text-[#071426] sm:text-[30px]">
              {product.name}
            </h1>

            <p className="product-info-description mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
              <span className={`product-info-description-copy ${descriptionExpanded ? "is-expanded" : ""}`}>
                {product.description ||
                  "Professional security product designed for reliable performance and easy installation."}
              </span>
              <button
                type="button"
                onClick={() => setDescriptionExpanded((expanded) => !expanded)}
                className="mobile-description-toggle"
              >
                {descriptionExpanded ? "Read Less" : "Read More"}
              </button>
            </p>

            {/* Rating / stock */}
            <div className="product-info-rating mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
              <span className="inline-flex items-center gap-1 font-extrabold text-amber-500">
                <Star size={14} fill="currentColor" />
                {product.rating || "0"}
              </span>

              <span className="text-slate-500">
                {product.reviews || 0} Reviews
              </span>

              <span
                className={`inline-flex items-center gap-1.5 font-extrabold ${
                  stock > 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {stock > 0 ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            <div className="product-info-divider my-3 h-px bg-slate-100" />

            {/* Price */}
            <div className="product-info-price flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="text-[35px] font-extrabold tracking-tight text-[#071426] sm:text-[40px]">
                {money(price)}
              </span>

              {hasDiscount && (
                <>
                  <span className="pb-1 text-sm text-slate-400 line-through sm:text-base">
                    {money(mrp)}
                  </span>

                  <span className="mb-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-extrabold text-red-600">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            <p className="product-info-tax mt-0.5 text-[10px] font-extrabold text-emerald-600">
              Inclusive of all taxes
            </p>

            {/* Highlights */}
            <div className="product-info-highlights mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
              <h2 className="text-xs font-extrabold text-slate-800 sm:text-sm">
                Key highlights
              </h2>

              <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
                {features.slice(0, 4).map((feature, index) => (
                  <div
                    key={`${feature}-${index}`}
                    className="flex min-w-0 items-start gap-1.5 text-[9px] leading-4 text-slate-600 sm:text-[10px]"
                  >
                    <Check
                      size={13}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                    <span className="line-clamp-2">
                      {String(feature)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase box */}
            <div ref={purchaseBoxRef} className="product-purchase-box mt-3 rounded-xl border border-slate-200 p-3.5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    Quantity
                  </p>

                  <div className="mt-1.5 flex h-9 items-center overflow-hidden rounded-lg border border-slate-200">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() =>
                        handleQuantityChange(quantity - 1)
                      }
                      className="flex h-full w-9 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-35"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="w-9 text-center text-xs font-extrabold">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      disabled={quantity >= maxQuantity}
                      onClick={() =>
                        handleQuantityChange(quantity + 1)
                      }
                      className="flex h-full w-9 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-35"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[9px] font-semibold text-slate-400">
                    Total
                  </p>
                  <p className="text-lg font-extrabold text-[#071426]">
                    {money(price * quantity)}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={stock <= 0}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border-2 border-[#f2b900] bg-[#fffaf0] px-3 text-xs font-extrabold text-[#071426] transition hover:bg-[#fff3c7] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart size={15} />
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={stock <= 0}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#071426] px-3 text-xs font-extrabold text-white transition hover:bg-[#0b315a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap size={15} />
                  Buy Now
                </button>
              </div>

              {cartStatus && (
                <p className="mt-2 text-center text-[10px] font-bold text-emerald-600">
                  {cartStatus}
                </p>
              )}
            </div>

            {/* Benefits */}
            <div className="product-info-benefits mt-3 grid grid-cols-2 gap-2">
              <MiniBenefit
                icon={Truck}
                title="Free Delivery"
                subtitle="On orders above ₹999"
                iconClass="text-emerald-600"
              />
              <MiniBenefit
                icon={ShieldCheck}
                title="1 Year Warranty"
                subtitle="Official Warranty"
                iconClass="text-blue-600"
              />
              <MiniBenefit
                icon={RotateCcw}
                title="7 Days Replacement"
                subtitle="Easy returns"
                iconClass="text-purple-600"
              />
              <MiniBenefit
                icon={CreditCard}
                title="Secure Payment"
                subtitle="100% Secure"
                iconClass="text-orange-600"
              />
            </div>

            {/* Enquiry */}
            <div className="product-info-enquiry mt-3 rounded-2xl p-3.5">
              <p className="text-xs font-extrabold text-[#1a2435]">
                Need a different model or custom requirement?
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-600">
                Contact our team for alternate models, bulk orders,
                installation or technical guidance.
              </p>

              <div className="mt-2.5 flex flex-wrap gap-2">
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                    `Product enquiry: ${product.name}`
                  )}&body=${requestMessage}`}
                  className="rounded-xl bg-[#071426] px-3 py-2 text-[10px] font-extrabold text-white transition hover:bg-[#102c4d]"
                >
                  Email Us
                </a>

              </div>
            </div>

            {shareStatus && (
              <p className="mt-2 text-[10px] font-bold text-emerald-600">
                {shareStatus}
              </p>
            )}
          </div>

          <div
            className={`mobile-purchase-bar ${showMobilePurchaseBar ? "is-visible" : ""}`}
            aria-label="Quick purchase"
            aria-hidden={!showMobilePurchaseBar}
          >
            <span className="mobile-purchase-price">{money(price)}</span>
            <button type="button" onClick={handleAddToCart} disabled={stock <= 0}>
              <ShoppingCart size={15} />
              {stock > 0 ? "Add to Cart" : "Sold out"}
            </button>
            <button type="button" onClick={handleBuyNow} disabled={stock <= 0}>
              <Zap size={15} />
              {stock > 0 ? "Buy Now" : "Sold out"}
            </button>
          </div>

          {/* =========================
              QUICK SPECIFICATIONS - Below price on mobile, right column on desktop
             ========================= */}
          <div className="product-quick-specifications order-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_12px_38px_rgba(7,20,38,.07)] lg:order-none lg:col-start-1 lg:row-start-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-extrabold text-slate-800 sm:text-sm">
                Quick specifications
              </h2>

              <button
                type="button"
                onClick={() => setActiveTab("specs")}
                className="text-[10px] font-extrabold text-blue-600 hover:text-[#d59f00]"
              >
                View all
              </button>
            </div>

            {specificationRows.length > 0 ? (
              <dl className="mt-2.5 grid grid-cols-2 gap-x-5">
                {specificationRows.slice(0, 6).map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-0 border-b border-slate-100 py-2"
                  >
                    <dt className="text-[9px] text-slate-400">
                      {label}
                    </dt>
                    <dd className="mt-0.5 truncate text-[10px] font-extrabold text-slate-700 sm:text-xs">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                Specifications will be updated soon.
              </p>
            )}
          </div>

          {/* =========================
              DELIVERY AVAILABILITY - Below specs on mobile, right column on desktop
             ========================= */}
          <div className="order-4 lg:order-none lg:col-start-1 lg:row-start-3">
            <DeliveryAvailability />
          </div>
        </div>

        {/* Service benefits */}
          <div className="product-service-benefits mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Truck,
              title: "Fast Delivery",
              text: "Reliable dispatch and delivery support across India.",
            },
            {
              icon: ShieldCheck,
              title: "Genuine Products",
              text: "Original products with manufacturer support.",
            },
            {
              icon: RotateCcw,
              title: "Easy Replacement",
              text: "Replacement support for eligible product issues.",
            },
            {
              icon: CreditCard,
              title: "Secure Payments",
              text: "UPI, cards, EMI and net banking supported.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#071426]">
                <Icon size={19} />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  {title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="product-secondary-sections flex flex-col">
        {/* Product tabs */}
        <div className="product-detail-tabs order-2 mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(7,20,38,.05)]">
          <div className="flex overflow-x-auto border-b border-slate-200 px-2 sm:px-5">
            {[
              ["overview", "Overview"],
              ["specs", "Specifications"],
              ["reviews", `Reviews (${product.reviews || 0})`],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`relative shrink-0 px-4 py-3.5 text-xs font-extrabold transition sm:text-sm ${
                  activeTab === key
                    ? "text-[#071426]"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {label}

                {activeTab === key && (
                  <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-[#f2b900]" />
                )}
              </button>
            ))}
          </div>

          <div className="product-tabs-content p-5 sm:p-7">
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    Product Overview
                  </h2>

                    <p className="product-overview-copy mt-3 text-sm leading-6 text-slate-600">
                    {product.description ||
                      "This product is designed for dependable performance, simple installation and professional security applications."}
                  </p>

                  <div className="product-overview-highlights mt-5 grid gap-2 sm:grid-cols-2">
                    {features.slice(0, 6).map((feature, index) => (
                      <div
                        key={`${feature}-overview-${index}`}
                        className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700"
                      >
                        <Check
                          size={15}
                          className="mt-0.5 shrink-0 text-emerald-600"
                        />
                        <span>{String(feature)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="product-overview-specs">
                  <h3 className="text-sm font-extrabold text-slate-800">
                    Main specifications
                  </h3>

                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                    {specificationRows.slice(0, 7).map(([label, value]) => (
                      <div
                        key={`overview-spec-${label}`}
                        className="flex items-center justify-between gap-4 border-b border-slate-100 px-3 py-2.5 last:border-0"
                      >
                        <span className="text-[10px] text-slate-400">
                          {label}
                        </span>
                        <span className="text-right text-[10px] font-extrabold text-slate-700">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("specs")}
                    className="mt-3 text-xs font-extrabold text-blue-600 hover:text-[#d59f00]"
                  >
                    View full specifications →
                  </button>
                </div>
              </div>
            )}

            {activeTab === "specs" && (
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Technical Specifications
                </h2>

                {specificationRows.length > 0 ? (
                  <div>
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                      <div className={`mobile-specification-list grid sm:grid-cols-2 ${specificationsExpanded ? "is-expanded" : ""}`}>
                        {specificationRows.map(([label, value], index) => (
                          <div
                            key={`full-spec-${label}`}
                            className={`flex min-h-[50px] items-center justify-between gap-5 border-b border-slate-100 px-4 py-2.5 ${
                              index % 2 === 0
                                ? "bg-slate-50/70"
                                : "bg-white"
                            }`}
                          >
                            <span className="text-xs text-slate-500">
                              {label}
                            </span>
                            <span className="max-w-[60%] text-right text-xs font-bold text-slate-800">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {specificationRows.length > 6 && (
                      <button
                        type="button"
                        onClick={() => setSpecificationsExpanded((expanded) => !expanded)}
                        className="mobile-specification-toggle"
                      >
                        {specificationsExpanded ? "Show Fewer Specifications" : "View All Specifications"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    Detailed specifications are not available yet.
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight">
                      Customer Reviews
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Customer feedback for this product.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-extrabold text-amber-700">
                    <Star size={15} fill="currentColor" />
                    {product.rating || "0"} / 5
                  </div>
                </div>

                {reviewsLoading ? (
                  <div className="mt-5 text-center py-8">
                    <p className="text-slate-500">Loading reviews...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {reviews.slice(0, 4).map((review) => (
                      <ReviewCard key={review._id} review={review} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <Star
                      size={28}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 font-bold text-slate-700">
                      No reviews yet
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Be the first customer to review this product.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <div className="product-recently-viewed order-3 mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold">
                  Recently Viewed
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Products you viewed earlier.
                </p>
              </div>

              <Link
                to="/products"
                className="text-xs font-extrabold text-blue-600 hover:text-[#d59f00]"
              >
                View All
              </Link>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {recentlyViewed.map((item) => (
                <Link
                  key={item.id}
                  to={`/products/${item.id}`}
                  className="recently-viewed-card group min-w-[175px] flex-[0_0_175px] rounded-lg border border-slate-200 p-2 transition duration-200 hover:-translate-y-1 hover:border-[#f2b900] hover:shadow-lg sm:min-w-[200px] sm:flex-[0_0_200px]"
                >
                  <div
                    className="product-image-surface-white flex h-24 items-center justify-center rounded-md bg-slate-50"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                        className="h-full w-full object-contain p-2 transition group-hover:scale-105"
                    />
                  </div>

                  <h3 className="mt-1.5 line-clamp-2 text-[11px] font-bold leading-4 text-slate-800">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-xs font-extrabold text-[#071426]">
                    {money(safeNumber(item.price))}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Final CTA */}
        <div className="product-mobile-cta order-4 mt-4 overflow-hidden rounded-[24px] bg-[#071426] p-5 text-white shadow-[0_15px_40px_rgba(7,20,38,.14)] sm:p-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#f2b900] sm:flex">
                <Headphones size={25} />
              </div>

              <div className="max-w-2xl">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#f2b900]">
                  Honey Vision Advantage
                </span>

                <h2 className="mt-1.5 text-xl font-extrabold sm:text-2xl">
                  Need help choosing the right security product?
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Get product guidance, installation consultation and
                  compatible accessory recommendations from our team.
                </p>
              </div>
            </div>

            <Link
              to="/products"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#f2b900] px-5 py-3 text-xs font-extrabold text-[#071426] transition hover:bg-[#ffc928]"
            >
              Explore Products
            </Link>
          </div>
        </div>        

        {product && bundleLoadStatus !== "idle" && bundleLoadStatus !== "failed" && (
          <section className="bundle-section order-1 mt-4 rounded-2xl border border-amber-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold">Bundle &amp; Save More</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">Complete your setup and save when you buy together.</p>
              </div>
            </div>

            {bundleLoadStatus === "loading" && <p className="mt-3 text-xs text-slate-500">Checking available bundles…</p>}
            {bundleLoadStatus === "loaded" && bundles.length === 0 && <p className="mt-3 text-xs text-slate-500">No active bundles are available for this product yet.</p>}

            {bundles.length > 0 && <div className="bundle-list mt-3 grid gap-3">
              {bundles.map((bundle) => (
                <article key={bundle.id} className="bundle-card rounded-xl border border-slate-200 p-3">
                  <h3 className="text-sm font-bold text-slate-900">{bundle.name}</h3>
                  {bundle.description && <p className="mt-1 text-[11px] text-slate-500">{bundle.description}</p>}
                  <div className="bundle-products mt-3 flex gap-2 overflow-x-auto pb-1">
                    {bundle.products.map((item, index) => (
                      <div key={item.productId} className="flex shrink-0 items-center gap-2">
                        {index > 0 && <span className="text-lg font-bold text-amber-500">+</span>}
                        <Link to={`/products/${encodeURIComponent(item.productId)}`} className="bundle-product-card w-28 rounded-lg border border-slate-200 p-2 transition hover:border-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500" aria-label={`View ${item.name}`}>
                          <img src={item.image || FALLBACK_IMAGE} alt={item.name} className="bundle-product-image h-16 w-full object-contain" />
                          <p className="mt-1 line-clamp-2 min-h-8 text-[10px] font-semibold text-slate-700">{item.name}</p>
                          <p className="mt-1 text-[10px] font-bold text-slate-900">{money(item.unitPrice)}</p>
                          <p className="text-[9px] text-emerald-700">Included × {item.quantity}</p>
                        </Link>
                      </div>
                    ))}
                  </div>
                  <div className="bundle-summary mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3">
                    <div className="bundle-totals space-y-1 text-xs">
                      <p className="text-slate-500">Individual total: <span className="font-semibold text-slate-800">{money(bundle.originalTotal)}</span></p>
                      <p className="text-emerald-700">Bundle savings: <b>-{money(bundle.discountAmount)}</b></p>
                      <p className="text-sm font-extrabold text-slate-900">Bundle price: {money(bundle.finalTotal)}</p>
                    </div>
                    <button type="button" onClick={() => handleAddBundleToCart(bundle.id)} disabled={addingBundleId === bundle.id} className="bundle-add-button rounded-lg bg-[#071426] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">
                      {addingBundleId === bundle.id ? "Adding…" : "Add bundle to cart"}
                    </button>
                  </div>
                </article>
              ))}
            </div>}
            {bundleCartMessage && <p role="status" className="mt-2 text-xs text-slate-600">{bundleCartMessage}</p>}
          </section>
        )}
        </div>

        {/* Related products */}
        {product && (
          <div className="related-products-section mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold">
                  You May Also Like
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Related products for your security setup.
                </p>
              </div>
              <Link to="/products" className="shrink-0 text-[11px] font-extrabold text-blue-600 hover:text-[#d59f00]">
                View All
              </Link>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {relatedProducts.length > 0 ? relatedProducts.map((item) => (
                <div
                  key={item.id}
                  className="related-product-card group min-w-[175px] flex-[0_0_175px] overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-[#f2b900] hover:shadow-lg sm:min-w-[200px] sm:flex-[0_0_200px]"
                >
                  <Link to={`/products/${item.id}`} className="block">
                    <div
                      className="product-image-surface-white relative flex h-24 items-center justify-center bg-slate-50"
                      style={{ backgroundColor: "#ffffff" }}
                    >
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  </Link>

                  <div className="p-2">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                      {item.category || "Product"}
                    </p>

                    <h3 className="mt-1 line-clamp-2 min-h-[32px] text-[11px] font-bold leading-4 text-slate-800">
                      {item.name}
                    </h3>

                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-amber-500">
                        ★★★★★
                      </span>

                      <span className="text-xs font-extrabold text-[#071426]">
                        {money(safeNumber(item.price))}
                      </span>
                    </div>

                    <div className="mt-1.5" />
                  </div>
                </div>
              )) : (
                <p className="py-4 text-xs text-slate-500">
                  {relatedProductsLoading ? "Finding related products..." : "No related products are available for this item yet."}
                </p>
              )}
            </div>
          </div>
        )}

        {product && (
          <ShopByCategory
            className="product-details-shop-categories"
            title="Shop by Categories"
          />
        )}

        <ProductPromoBannerStrip />

      </div>
    </section>
  );
}

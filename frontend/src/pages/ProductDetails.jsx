import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useCommerce } from "../context/index.js";
import DeliveryAvailability from "../components/DeliveryAvailability";
import { getProductGallery, money, normalizeProduct } from "../lib/products";
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
  ChevronRight,
  ChevronLeft,
  GitCompareArrows,
  Check,
  PackageCheck,
  Headphones,
  Zap,
  MapPin,
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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <img
      src={!failed && src ? src : FALLBACK_IMAGE}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
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

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { products, addToCart, toggleWishlist, wishlist } = useCommerce();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [shareStatus, setShareStatus] = useState("");
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);

      const contextProduct = products.find(
        (item) => String(item.id) === String(productId)
      );

      if (contextProduct && !cancelled) {
        const normalized = normalizeProduct(contextProduct);
        const gallery = getProductGallery(normalized);

        setProduct(normalized);
        setSelectedImage(
          gallery[0] || normalized.image || FALLBACK_IMAGE
        );
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
          const gallery = getProductGallery(normalized);

          setProduct(normalized);
          setSelectedImage(
            gallery[0] || normalized.image || FALLBACK_IMAGE
          );
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

    if (productId) {
      loadProduct();
    } else {
      setProduct(null);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [productId, products]);

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

  const visibleThumbs = useMemo(() => images.slice(0, 5), [images]);

  useEffect(() => {
    if (!images.length) {
      setImageIndex(0);
      setSelectedImage(FALLBACK_IMAGE);
      return;
    }

    const currentIndex = images.indexOf(selectedImage);

    if (currentIndex >= 0) {
      setImageIndex(currentIndex);
    } else {
      setImageIndex(0);
      setSelectedImage(images[0]);
    }
  }, [images, selectedImage]);

  useEffect(() => {
    if (!product?.id) return;

    try {
      const storageKey = "honeyvision_recently_viewed";
      const saved = JSON.parse(
        window.localStorage.getItem(storageKey) || "[]"
      );

      const ids = Array.isArray(saved) ? saved : [];

      const nextIds = [
        product.id,
        ...ids.filter((id) => String(id) !== String(product.id)),
      ].slice(0, 6);

      window.localStorage.setItem(storageKey, JSON.stringify(nextIds));

      const viewed = products
        .filter(
          (item) =>
            nextIds.some((id) => String(id) === String(item.id)) &&
            String(item.id) !== String(product.id)
        )
        .slice(0, 4)
        .map((item) => normalizeProduct(item));

      setRecentlyViewed(viewed);
    } catch {
      setRecentlyViewed([]);
    }
  }, [product?.id, products]);

  const inWishlist = Boolean(
    product &&
      Array.isArray(wishlist) &&
      wishlist.some((id) => String(id) === String(product.id))
  );

  const relatedProducts = useMemo(() => {
    if (!product?.id) return [];

    return products
      .filter((item) => String(item.id) !== String(product.id))
      .slice(0, 8)
      .map((item) => normalizeProduct(item));
  }, [products, product?.id]);

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
    addToCart(product.id, quantity, false);
    navigate("/checkout");
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
    const nextIndex = Math.max(
      0,
      Math.min(images.length - 1, index)
    );

    setImageIndex(nextIndex);
    setSelectedImage(images[nextIndex]);
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
    <section className="min-h-screen bg-[#f5f7fb] pb-16 pt-4 text-[#071426]">
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
          <ChevronRight size={13} className="shrink-0 text-slate-400" />
          <span className="truncate font-bold text-slate-700">
            {product.name}
          </span>
        </nav>

        {/* =========================================================
            MAIN TWO-COLUMN AREA
            Both cards are flex columns with h-full.
            The grid uses items-stretch so both cards finish together.
           ========================================================= */}
        <div className="grid items-stretch gap-4 lg:grid-cols-2 lg:auto-rows-fr">
          {/* =========================
              LEFT CARD
             ========================= */}
          <div className="flex h-full min-w-0 flex-col rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_12px_38px_rgba(7,20,38,.07)] sm:p-4">
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
                      className={`flex h-[70px] w-[70px] items-center justify-center overflow-hidden rounded-xl border bg-white p-1 transition ${
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
                <div className="relative flex min-h-[330px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200 bg-[radial-gradient(circle_at_center,#ffffff_0%,#f7f9fc_75%)] sm:min-h-[395px] lg:min-h-[420px]">
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

                  <ProductImage
                    src={images[imageIndex]}
                    alt={product.name}
                    className="max-h-[360px] w-[87%] object-contain p-3 transition duration-500 hover:scale-[1.02] sm:max-h-[390px]"
                    style={{ filter: stock <= 0 ? "grayscale(1)" : "none" }}
                  />

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
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden">
                  {visibleThumbs.map((image, index) => (
                    <button
                      key={`mobile-${image}-${index}`}
                      type="button"
                      onClick={() => selectImage(index)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-white p-1 ${
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
            <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50">
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

            {/* Quick specifications - LEFT */}
            <div className="mt-3 rounded-xl border border-slate-200 p-3.5">
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

            {/* Delivery - LEFT */}
            <div className="mt-3">
              <DeliveryAvailability />
            </div>
          </div>

          {/* =========================
              RIGHT CARD
             ========================= */}
          <div className="flex h-full min-w-0 flex-col rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_38px_rgba(7,20,38,.07)] sm:p-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
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
            <h1 className="mt-4 text-[25px] font-extrabold leading-[1.18] tracking-[-0.025em] text-[#071426] sm:text-[30px]">
              {product.name}
            </h1>

            <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
              {product.description ||
                "Professional security product designed for reliable performance and easy installation."}
            </p>

            {/* Rating / stock */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
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

            <div className="my-3 h-px bg-slate-100" />

            {/* Price */}
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
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

            <p className="mt-0.5 text-[10px] font-extrabold text-emerald-600">
              Inclusive of all taxes
            </p>

            {/* Highlights */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
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
            <div className="mt-3 rounded-xl border border-slate-200 p-3.5">
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
                  onClick={handleBuyNow}
                  disabled={stock <= 0}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#071426] px-3 text-xs font-extrabold text-white transition hover:bg-[#0b315a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap size={15} />
                  Buy Now
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-3 grid grid-cols-2 gap-2">
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
            <div className="mt-3 rounded-xl border border-amber-200 bg-[#fffaf0] p-3.5">
              <p className="text-xs font-extrabold text-slate-800">
                Need a different model or custom requirement?
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                Contact our team for alternate models, bulk orders,
                installation or technical guidance.
              </p>

              <div className="mt-2.5 flex flex-wrap gap-2">
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                    `Product enquiry: ${product.name}`
                  )}&body=${requestMessage}`}
                  className="rounded-lg bg-[#071426] px-3 py-2 text-[10px] font-extrabold text-white transition hover:bg-[#0b315a]"
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

            {/* This spacer makes the right card naturally use the full grid
                height while keeping all primary purchase content together. */}
            <div className="flex-1" />
          </div>
        </div>

        {/* Service benefits */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Product tabs */}
        <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(7,20,38,.05)]">
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

          <div className="p-5 sm:p-7">
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    Product Overview
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {product.description ||
                      "This product is designed for dependable performance, simple installation and professional security applications."}
                  </p>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
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

                <div>
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
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                    <div className="grid sm:grid-cols-2">
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

                {safeNumber(product.reviews) > 0 ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {[1, 2].map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <p className="font-extrabold text-slate-800">
                          Verified Customer
                        </p>
                        <div className="mt-1 text-sm text-amber-500">
                          ★★★★★
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          Excellent product quality and reliable performance.
                        </p>
                      </div>
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
          <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold">
                  Recently Viewed
                </h2>
                <p className="mt-1 text-xs text-slate-500">
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

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recentlyViewed.map((item) => (
                <Link
                  key={item.id}
                  to={`/products/${item.id}`}
                  className="group rounded-xl border border-slate-200 p-3 transition hover:-translate-y-1 hover:border-[#f2b900] hover:shadow-md"
                >
                  <div className="flex h-32 items-center justify-center rounded-lg bg-slate-50">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain p-3 transition group-hover:scale-105"
                    />
                  </div>

                  <h3 className="mt-2 line-clamp-2 text-xs font-bold text-slate-800">
                    {item.name}
                  </h3>

                  <p className="mt-2 text-sm font-extrabold text-[#071426]">
                    {money(safeNumber(item.price))}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Final CTA */}
        <div className="mt-4 overflow-hidden rounded-[24px] bg-[#071426] p-5 text-white shadow-[0_15px_40px_rgba(7,20,38,.14)] sm:p-7">
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

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-extrabold">
                You May Also Like
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Related products for your security setup.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
                >
                  <Link to={`/products/${item.id}`} className="block">
                    <div className="relative flex aspect-square items-center justify-center bg-slate-50">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  </Link>

                  <div className="p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {item.category || "Product"}
                    </p>

                    <h3 className="mt-1 line-clamp-2 min-h-[34px] text-xs font-bold text-slate-800">
                      {item.name}
                    </h3>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-amber-500">
                        ★★★★★
                      </span>

                      <span className="text-sm font-extrabold text-[#071426]">
                        {money(safeNumber(item.price))}
                      </span>
                    </div>

                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/products/${item.id}`)
                        }
                        className="rounded-lg border border-slate-200 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";
import { money, normalizeProduct } from "../lib/products";
import {
  Heart,
  Share2,
  Star,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  ChevronRight,
  GitCompareArrows,
} from "lucide-react";

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, toggleWishlist, wishlist } = useCommerce();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadProduct = async () => {
      const fallbackProduct = products.find((p) => p.id === productId) || products[0] || null;
      if (fallbackProduct && !ignore) {
        setProduct(fallbackProduct);
        setSelectedImage(fallbackProduct.image || "");
      }

      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error("Product not found");

        const data = await response.json();
        const nextProduct = data.product || data.data || null;

        if (!ignore && nextProduct) {
          const normalized = normalizeProduct(nextProduct);
          setProduct(normalized);
          setSelectedImage(normalized.image);
        }
      } catch {
        if (!ignore) {
          setProduct(fallbackProduct);
          setSelectedImage(fallbackProduct?.image || "");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadProduct();
    return () => {
      ignore = true;
    };
  }, [productId, products]);

  const images = [
    product?.image || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1602524812759-4b0b5f7e6f37?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581092334444-9b8b0e5c2b8b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=800&q=80",
  ];
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const idx = Math.max(0, images.indexOf(selectedImage));
    setImageIndex(idx >= 0 ? idx : 0);
  }, [selectedImage]);

  const inWishlist = product ? wishlist.includes(product.id) : false;
  const relatedProducts = products.filter((item) => item.id !== product?.id).slice(0, 4);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product.id, quantity, false);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product.id, quantity, false);
    navigate("/checkout");
  };

  const handleShare = async () => {
    if (!product) return;

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareText = `Check out ${product.name} from Honey Vision India`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
        setShareStatus("Shared successfully");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("Product link copied");
        return;
      }

      window.prompt("Copy this product link", shareUrl);
      setShareStatus("Copy the link manually");
    } catch (error) {
      if (error?.name !== "AbortError") {
        setShareStatus("Unable to share right now");
      }
    }

    window.setTimeout(() => setShareStatus(""), 2200);
  };

  const handleCompare = () => {
    if (!product) return;
    navigate(`/compare?compare=${product.id}`);
  };

  if (loading) {
    return (
      <section className="bg-[#F6F8FC] min-h-screen py-10">
        <div className="mx-auto max-w-4xl rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          Loading product from backend...
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="bg-[#F6F8FC] min-h-screen py-10">
        <div className="mx-auto max-w-4xl rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          Product not found.
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#F6F8FC] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <span className="hover:text-yellow-500">Home</span>
          <ChevronRight size={15} />
          <span className="hover:text-yellow-500">Products</span>
          <ChevronRight size={15} />
          <span className="font-semibold text-[#071426]">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="flex gap-6">
              <div className="flex flex-col gap-4">
                {images.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`rounded-2xl overflow-hidden transition ${selectedImage === img ? "ring-2 ring-yellow-500" : "border border-gray-200"}`}
                  >
                    <img src={img} alt={`Thumbnail ${index + 1}`} className="w-24 h-24 object-cover" />
                  </button>
                ))}
              </div>

              <div className="group relative flex-1 flex items-center justify-center bg-[#fafafa] rounded-3xl overflow-hidden">
                <button
                  type="button"
                  aria-label="Add to wishlist"
                  onClick={() => toggleWishlist(product.id)}
                  className={`absolute top-5 right-5 w-12 h-12 rounded-full bg-white shadow flex items-center justify-center transition-all duration-300 ${inWishlist ? "bg-yellow-500 text-white" : "hover:bg-yellow-100"}`}
                >
                  <Heart size={20} fill={inWishlist ? "currentColor" : "none"} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="absolute top-20 right-5 w-12 h-12 rounded-full bg-white shadow flex items-center justify-center hover:bg-yellow-100 transition"
                  aria-label="Share product"
                >
                  <Share2 size={18} />
                </button>
                <button type="button" onClick={() => setImageIndex((i) => Math.max(0, i - 1))} className="absolute left-4 z-10 rounded-full bg-white p-3 shadow">‹</button>
                <img src={images[imageIndex] || selectedImage || product.image} alt={product.name} className="h-[520px] object-contain transition-transform duration-500 hover:scale-105" />
                <button type="button" onClick={() => setImageIndex((i) => Math.min(images.length - 1, i + 1))} className="absolute right-4 z-10 rounded-full bg-white p-3 shadow">›</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">{product.brand}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCompare}
                  className="rounded-full border border-slate-200 bg-white p-3 text-slate-700 transition hover:bg-yellow-100 hover:text-slate-900"
                  aria-label={`Compare ${product.name}`}
                >
                  <GitCompareArrows size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`rounded-full p-3 border transition ${inWishlist ? "bg-yellow-500 text-white border-yellow-500" : "bg-white text-gray-700 hover:bg-yellow-100"}`}
                >
                  <Heart size={18} fill={inWishlist ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-[#071426] mt-6 leading-tight">{product.name}</h1>
            <p className="text-gray-500 text-lg mt-5 leading-8">{product.description}</p>

            <div className="flex items-center gap-5 mt-8">
              <div className="flex items-center gap-2 text-yellow-500">
                <Star size={18} />
                <span className="font-semibold">{product.rating}</span>
              </div>
              <span className="text-gray-600">{product.reviews} Reviews</span>
              <span className={`font-semibold ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                {product.stock > 0 ? "● In Stock" : "● Out of Stock"}
              </span>
            </div>

            <div className="mt-10">
              <div className="flex items-end gap-5">
                <h2 className="text-5xl font-bold text-[#071426]">{money(product.price || 0)}</h2>
                <span className="text-2xl line-through text-gray-400">{money(product.mrp || 0)}</span>
                <span className="bg-red-100 text-red-600 px-4 py-2 rounded-full font-semibold">
                  Save {Math.round(((product.mrp - product.price) / (product.mrp || 1)) * 100)}%
                </span>
              </div>
              <p className="text-green-600 mt-3 font-medium">Inclusive of all taxes</p>
            </div>

            <div className="grid grid-cols-2 gap-5 mt-10">
              {product.features?.slice(0, 4).map((feat, index) => (
                <div key={index} className="flex items-center gap-3 text-gray-700">
                  <span>✅</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <h3 className="font-semibold text-lg mb-4">Quantity</h3>
              <div className="flex items-center border rounded-xl overflow-hidden w-fit">
                <button onClick={() => setQuantity((qty) => Math.max(1, qty - 1))} className="px-5 py-3 hover:bg-gray-100" type="button">
                  <Minus size={18} />
                </button>
                <span className="px-8 font-semibold">{quantity}</span>
                <button onClick={() => setQuantity((qty) => qty + 1)} className="px-5 py-3 hover:bg-gray-100" type="button">
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mt-10">
              <button onClick={handleAddToCart} className="bg-[#071426] hover:bg-[#0B315A] text-white rounded-xl py-4 flex justify-center items-center gap-3 text-lg font-semibold transition" type="button">
                <ShoppingCart size={22} />
                Add To Cart
              </button>
              <button onClick={handleBuyNow} className="bg-yellow-500 hover:bg-yellow-400 rounded-xl py-4 text-lg font-bold text-black transition" type="button">
                Buy Now
              </button>
            </div>

            {shareStatus && (
              <p className="mt-4 text-sm text-green-600">{shareStatus}</p>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#071426] mb-6">Delivery & Services</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-5 border rounded-3xl bg-slate-50">
              <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center"><Truck className="text-yellow-500" size={26} /></div>
              <div>
                <h3 className="font-semibold text-lg">Free Delivery</h3>
                <p className="text-gray-500 mt-2">Delivery within 2–5 business days across India.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 border rounded-3xl bg-slate-50">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center"><ShieldCheck className="text-blue-600" size={26} /></div>
              <div>
                <h3 className="font-semibold text-lg">2 Years Warranty</h3>
                <p className="text-gray-500 mt-2">Manufacturer warranty with nationwide service support.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 border rounded-3xl bg-slate-50">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center"><RotateCcw className="text-green-600" size={26} /></div>
              <div>
                <h3 className="font-semibold text-lg">Easy Returns</h3>
                <p className="text-gray-500 mt-2">7-Day replacement for manufacturing defects.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 border rounded-3xl bg-slate-50">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center"><CreditCard className="text-purple-600" size={26} /></div>
              <div>
                <h3 className="font-semibold text-lg">Secure Payments</h3>
                <p className="text-gray-500 mt-2">UPI, Debit Card, Credit Card, EMI & Net Banking supported.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-[#071426] to-[#0B315A] rounded-3xl p-8 text-white">
          <span className="bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-semibold">LIMITED OFFER</span>
          <h2 className="text-3xl font-bold mt-6">Save More with Honey Vision</h2>
          <p className="text-gray-300 mt-4 leading-8">Buy this category product today and get exclusive installation discounts, free technical consultation, and special combo offers on accessories and support packages.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <div className="bg-white/10 px-5 py-3 rounded-xl">🎁 Extra ₹500 OFF</div>
            <div className="bg-white/10 px-5 py-3 rounded-xl">🚚 Free Delivery</div>
            <div className="bg-white/10 px-5 py-3 rounded-xl">🔧 Free Installation Consultation</div>
          </div>
        </div>

        <div className="mt-10 bg-white rounded-3xl shadow-lg p-8">
          <div className="flex gap-4 border-b pb-4">
            <button onClick={() => setActiveTab("overview")} className={`pb-2 ${activeTab === "overview" ? "border-b-2 border-yellow-500 font-semibold" : "text-gray-500"}`} type="button">
              Overview
            </button>
            <button onClick={() => setActiveTab("specs")} className={`pb-2 ${activeTab === "specs" ? "border-b-2 border-yellow-500 font-semibold" : "text-gray-500"}`} type="button">
              Specifications
            </button>
            <button onClick={() => setActiveTab("reviews")} className={`pb-2 ${activeTab === "reviews" ? "border-b-2 border-yellow-500 font-semibold" : "text-gray-500"}`} type="button">
              Reviews
            </button>
          </div>

          <div className="mt-6">
            {activeTab === "overview" && (
              <div>
                <h2 className="text-3xl font-bold text-[#071426]">Product Overview</h2>
                <p className="text-gray-600 leading-8 mt-6">{product.description}</p>
                <p className="text-gray-600 leading-8 mt-5">Designed for reliability, fast setup, and long-term support, this product is ideal for homes, offices, and commercial installations.</p>
              </div>
            )}

            {activeTab === "specs" && (
              <div className="grid gap-8">
                <div>
                  <h2 className="text-3xl font-bold text-[#071426] mb-6">Key Features</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {(product.features?.length ? product.features : ["High quality build", "Reliable daily performance", "Strong warranty support", "Easy installation"]).map((feature, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="text-green-500 text-2xl">✔</div>
                        <div>
                          <h3 className="font-semibold text-lg">{feature}</h3>
                          <p className="text-gray-500 mt-2">Built for dependable long-term use.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-3xl p-6">
                  <h2 className="text-3xl font-bold text-[#071426] mb-6">Technical Specifications</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex justify-between border-b pb-4"><span className="text-gray-500">Brand</span><span className="font-semibold">{product.brand}</span></div>
                    <div className="flex justify-between border-b pb-4"><span className="text-gray-500">Category</span><span className="font-semibold">{product.category}</span></div>
                    <div className="flex justify-between border-b pb-4"><span className="text-gray-500">Stock</span><span className="font-semibold">{product.stock}</span></div>
                    <div className="flex justify-between border-b pb-4"><span className="text-gray-500">Rating</span><span className="font-semibold">{product.rating}</span></div>
                    <div className="flex justify-between border-b pb-4"><span className="text-gray-500">Installation</span><span className="font-semibold">{product.installationEligible ? "Available" : "Not required"}</span></div>
                    <div className="flex justify-between pb-4"><span className="text-gray-500">Delivery</span><span className="font-semibold">Fast dispatch</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-8">
                <div className="border-b pb-8">
                  <div className="flex justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-[#071426]">Customer Reviews</h2>
                    </div>
                    <button className="text-yellow-500 font-semibold hover:underline" type="button">View All Reviews</button>
                  </div>
                  <div className="mt-8">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-bold text-lg">Rajesh Kumar</h3>
                        <div className="flex text-yellow-500 mt-2">⭐⭐⭐⭐⭐</div>
                      </div>
                      <span className="text-gray-400">2 Days Ago</span>
                    </div>
                    <p className="text-gray-600 mt-5 leading-8">Excellent product quality. It works reliably and feels premium.</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold text-lg">Priya Sharma</h3>
                      <div className="flex text-yellow-500 mt-2">⭐⭐⭐⭐⭐</div>
                    </div>
                    <span className="text-gray-400">1 Week Ago</span>
                  </div>
                  <p className="text-gray-600 mt-5 leading-8">Smooth setup and great support. I would definitely recommend it.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-[#071426] mb-8">Frequently Bought Together</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition flex flex-col overflow-hidden">
                <div className="aspect-square bg-gray-50 w-full overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-2">{item.category}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-yellow-500 text-xs">⭐⭐⭐⭐⭐</div>
                    <p className="text-md font-bold">{money(item.price)}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => navigate(`/products/${item.id}`)} className="flex-1 bg-white border border-gray-200 py-2 rounded-md text-sm" type="button">
                      View
                    </button>
                    <button onClick={() => addToCart(item.id, 1, false)} className="flex-1 bg-[#071426] text-white py-2 rounded-md text-sm" type="button">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

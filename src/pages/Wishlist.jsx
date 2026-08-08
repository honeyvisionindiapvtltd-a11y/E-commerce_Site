import { useMemo } from "react";import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Trash2 , CheckSquare} from "lucide-react";
import { FaCheckCircle } from "react-icons/fa";
import { useCommerce } from "../context/CommerceContext";

const formatPrice = (value) => `₹${value.toLocaleString()}`;

export default function Wishlist() {
  const navigate = useNavigate();
  const { products, wishlist, addToCart, toggleWishlist, moveWishlistToCart, clearWishlist } = useCommerce();

  const wishlistItems = useMemo(
    () => products.filter((product) => wishlist.includes(product.id)),
    [products, wishlist]
  );

  const recommendedProducts = useMemo(
    () => products.filter((product) => !wishlist.includes(product.id)).slice(0, 4),
    [products, wishlist]
  );

  const totalWishlist = wishlistItems.length;

  const handleMoveAllToCart = () => {
    if (!wishlist.length) return;
    moveWishlistToCart(wishlist);
    navigate("/cart");
  };

  const handleAddToCart = (productId) => {
    addToCart(productId, 1, false);
  };

  const handleRemove = (productId) => {
    toggleWishlist(productId);
  };

  return (
    <section className="bg-[#f6f8fc] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-[#071426]">My Wishlist ❤️</h1>
            <p className="text-gray-500 mt-3">
              {totalWishlist} product{totalWishlist === 1 ? "" : "s"} saved for later
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={handleMoveAllToCart}
              disabled={totalWishlist === 0}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl transition ${
                totalWishlist === 0
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-[#071426] text-white hover:bg-yellow-500 hover:text-black"
              }`}
            >
              <ShoppingCart size={18} />
              Move All To Cart
            </button>
            <button
              type="button"
              onClick={clearWishlist}
              disabled={totalWishlist === 0}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl transition ${
                totalWishlist === 0
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-white border border-gray-300 text-slate-700 hover:bg-gray-100"
              }`}
            >
              <Trash2 size={18} />
              Clear Wishlist
            </button>
            <Link
              to="/products"
              className="flex items-center gap-2 bg-yellow-500 text-black px-5 py-3 rounded-xl hover:bg-yellow-400 transition"
            >
              <CheckSquare size={18} />
              Browse Products
            </Link>
          </div>
        </div>

        {!totalWishlist ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center">
            <h2 className="text-3xl font-bold text-[#071426]">Your wishlist is empty</h2>
            <p className="mt-4 text-slate-500">Add products to your wishlist and save them for later.</p>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="mt-8 rounded-2xl bg-[#071426] px-8 py-4 text-white hover:bg-yellow-500 hover:text-black transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid gap-8">
            {wishlistItems.map((product) => (
              <div key={product.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center">
                  <div className="flex h-64 w-full items-center justify-center rounded-3xl bg-slate-50 p-6 lg:w-72">
                    <img src={product.image} alt={product.name} className="h-44 object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-amber-500">{product.category}</p>
                        <h2 className="mt-3 text-2xl font-bold text-[#071426]">{product.name}</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(product.id)}
                        className="rounded-2xl border border-red-200 p-3 text-red-500 hover:bg-red-500 hover:text-white transition"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-gray-500 text-sm">
                      <FaCheckCircle className="text-green-500" />
                      <span>{product.stock > 0 ? "In Stock" : "Out of Stock"}</span>
                      {product.delivery && <span>• {product.delivery}</span>}
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <div>
                        <p className="text-3xl font-bold text-[#071426]">{formatPrice(product.price)}</p>
                        {product.mrp && <p className="text-sm line-through text-slate-400">{formatPrice(product.mrp)}</p>}
                      </div>
                      {product.price && product.mrp && product.mrp > product.price && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-600">
                          {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                        </span>
                      )}
                    </div>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product.id)}
                        className="flex-1 rounded-2xl bg-[#071426] px-6 py-4 text-white font-semibold hover:bg-yellow-500 hover:text-black transition"
                      >
                        <ShoppingCart size={18} className="inline-block mr-2" />
                        Add to Cart
                      </button>
                      <Link
                        to={`/products/${product.id}`}
                        className="flex-1 rounded-2xl border border-slate-200 px-6 py-4 text-center text-slate-700 hover:bg-slate-100 transition"
                      >
                        View Product
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-24">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#071426]">Recommended for you</h2>
              <p className="text-gray-500 mt-2">Products you may like based on your wishlist</p>
            </div>
            <Link to="/products" className="text-yellow-500 font-semibold hover:underline">
              View All Products
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendedProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-xl transition duration-300 group">
                <div className="bg-slate-50 p-6 flex items-center justify-center h-56">
                  <img src={product.image} alt={product.name} className="h-40 object-contain" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#071426]">{product.name}</h3>
                  <p className="mt-3 text-sm text-slate-500">{product.category}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-2xl font-bold text-[#071426]">{formatPrice(product.price)}</span>
                    {product.mrp && <span className="line-through text-gray-400">{formatPrice(product.mrp)}</span>}
                  </div>
                  <div className="mt-6 grid gap-3">
                    <Link
                      to={`/products/${product.id}`}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-slate-700 hover:bg-slate-100 transition"
                    >
                      View Product
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product.id)}
                      className="rounded-2xl bg-yellow-500 text-black px-4 py-3 font-semibold hover:bg-yellow-400 transition"
                    >
                      Add to Cart
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

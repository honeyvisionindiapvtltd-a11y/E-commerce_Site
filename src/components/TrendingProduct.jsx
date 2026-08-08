import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";

const products = [
  {
    name: "Dell Inspiron 15 Laptop",
    price: "₹54,990",
    oldPrice: "₹66,990",
    discount: "16% OFF",
    reviews: "128",
    image: "/images/products/dell-laptop.png",
  },
  {
    name: "Hikvision 2MP Dome Camera",
    price: "₹1,999",
    oldPrice: "₹2,599",
    discount: "23% OFF",
    reviews: "256",
    image: "/images/products/hikvision-camera.png",
  },
  {
    name: "TP-Link AX1500 WiFi 6 Router",
    price: "₹3,299",
    oldPrice: "₹3,899",
    discount: "15% OFF",
    reviews: "89",
    image: "/images/products/tplink-router.png",
  },
  {
    name: "Samsung 1TB SSD",
    price: "₹6,999",
    oldPrice: "₹8,799",
    discount: "20% OFF",
    reviews: "112",
    image: "/images/products/samsung-ssd.png",
  },
  {
    name: "DJI Mini 2 Drone",
    price: "₹29,999",
    oldPrice: "₹33,999",
    discount: "12% OFF",
    reviews: "74",
    image: "/images/products/dji-drone.png",
  },
  {
    name: "Zebronics Gaming Cabinet",
    price: "₹2,499",
    oldPrice: "₹2,999",
    discount: "17% OFF",
    reviews: "63",
    image: "/images/products/gaming-cabinet.png",
  },
];

export default function TrendingProducts() {
  return (
    <section className="w-full px-3 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Trending Products</h2>

        <Link
          to="/products"
          className="text-sm font-semibold text-blue-600 hover:text-amber-500"
        >
          View All Products →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {products.map((product) => (
          <article
            key={product.name}
            className="group relative rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
          >
            <span className="absolute left-3 top-3 rounded bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
              {product.discount}
            </span>

            <button
              className="absolute right-3 top-3 text-slate-400 hover:text-red-500"
              aria-label={`Add ${product.name} to wishlist`}
            >
              <Heart size={19} />
            </button>

            <Link to="/products/product-details">
              <img
                src={product.image}
                alt={product.name}
                className="mt-5 h-35 w-full object-contain transition group-hover:scale-105"
              />

              <h3 className="mt-4 min-h-10 text-sm font-semibold text-slate-800">
                {product.name}
              </h3>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">
                  {product.price}
                </span>
                <span className="text-xs text-slate-400 line-through">
                  {product.oldPrice}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className="fill-amber-400 text-amber-400"
                  />
                ))}
                <span className="ml-1 text-xs text-slate-500">
                  ({product.reviews})
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
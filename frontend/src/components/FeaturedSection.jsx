import {
  Clock3,
  ChevronRight,
  ShoppingCart,
  Heart,
  Eye,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";
import { money } from "../lib/products";

const brands = [
  { name: "Dell", logo: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172601/Dell_Logo_lmfwhj.png" },
  { name: "HP", logo: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172600/HP_LOGO_xkbqb1.png" },
  { name: "Lenovo", logo: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172599/Lenovo_logo__2015_onwards_z586id.png" },
  { name: "ASUS", logo: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172597/ASUS_Logo_pdifp0.svg" },
  { name: "Hikvision", logo: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172596/Hikvision_logo_joawjl.png" },
  { name: "Dahua", logo: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172595/Dahua_Technology_logo_veja1o.jpg" },
  { name: "TP-Link", logo: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172593/Tp-Link_logo_2016_tlbnnn.png" },
  { name: "DJI", logo: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172591/DJI_logo_s90zht.png" },
  { name: "Samsung", logo: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172590/Samsung_logo_nqxgxw.svg" },
  { name: "Seagate", logo: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786172589/Seagate_logo_saaft5.svg" },
];

export default function FeaturedSection() {
  const { addToCart, toggleWishlist, wishlist, products } = useCommerce();
  const productsToShow = products.slice(0, 4);

  return (
    <section className="py-20 bg-gray-50">

      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}

        <div className="flex justify-between items-center">

          <div>

            <p className="text-yellow-500 uppercase font-semibold">
              Trusted Brands
            </p>

            <h2 className="text-4xl font-bold mt-2">
              Shop by Top Brands
            </h2>

          </div>

          <Link to="/products" className="flex items-center gap-2 font-semibold text-slate-900 hover:text-amber-600">
            View All
            <ChevronRight size={18} />
          </Link>

        </div>

        {/* Brands */}

        <div className="grid lg:grid-cols-10 md:grid-cols-5 grid-cols-2 gap-5 mt-10">

          {brands.map((brand, index) => (

            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow hover:shadow-xl transition flex items-center justify-center"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-10 object-contain"
              />
            </div>

          ))}

        </div>

        {/* Flash Sale */}

        <div className="mt-20 rounded-3xl bg-[#0A1931] text-white p-10 flex flex-col lg:flex-row justify-between items-center">

          <div>

            <p className="text-yellow-400 font-semibold">
              FLASH SALE
            </p>

            <h2 className="text-4xl font-bold mt-3">
              Up to 40% OFF
            </h2>

            <p className="mt-4 text-gray-300">
              CCTV • Laptops • Networking • Drones • Gaming
            </p>

          </div>

          <div className="flex gap-5 mt-8 lg:mt-0">

            {["12", "08", "45", "21"].map((item, index) => (

              <div
                key={index}
                className="bg-white text-black rounded-xl w-20 h-20 flex flex-col justify-center items-center"
              >
                <Clock3 size={18}/>
                <span className="text-2xl font-bold">
                  {item}
                </span>
              </div>

            ))}

          </div>

        </div>

        {/* Featured Products */}

        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mt-16">

          {productsToShow.map((item) => {
            const isWishlisted = wishlist.includes(item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden shadow hover:shadow-2xl transition"
              >

                <div className="relative bg-gray-100 p-8">

                  <button
                    type="button"
                    onClick={() => toggleWishlist(item.id)}
                    className={`absolute top-4 right-4 rounded-full p-2 shadow ${isWishlisted ? "bg-red-50 text-red-500" : "bg-white text-slate-500"}`}
                    aria-label={`Toggle wishlist for ${item.name}`}
                  >
                    <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
                  </button>

                  <Link to={`/products/${item.id}`}>
                    <img
                      src={item.image}
                      className="h-56 mx-auto object-contain"
                      alt={item.name}
                    />
                  </Link>

                </div>

                <div className="p-6">

                  <div className="flex text-yellow-500 items-center gap-1">
                    <Star fill="currentColor" size={16} />
                    {item.rating}
                  </div>

                  <Link to={`/products/${item.id}`} className="block font-bold text-lg mt-3 text-slate-900 hover:text-amber-600">
                    {item.name}
                  </Link>

                  <div className="flex gap-3 mt-4 items-center">

                    <span className="text-2xl font-bold text-[#0A1931]">
                      {money(item.price)}
                    </span>

                    <span className="line-through text-gray-400">
                      {money(item.mrp)}
                    </span>

                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">

                    <button
                      type="button"
                      onClick={() => addToCart(item.id)}
                      className="bg-[#0A1931] text-white py-3 rounded-xl flex justify-center gap-2 items-center"
                    >
                      <ShoppingCart size={18} />
                      Cart
                    </button>

                    <Link to={`/products/${item.id}`} className="border py-3 rounded-xl flex justify-center gap-2 items-center text-slate-900 hover:border-amber-300 hover:text-amber-600">
                      <Eye size={18} />
                      View
                    </Link>

                  </div>

                </div>

              </div>
            );
          })}

        </div>

      </div>

    </section>
  );
}
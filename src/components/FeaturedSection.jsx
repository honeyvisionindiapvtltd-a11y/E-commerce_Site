import {
  Clock3,
  ChevronRight,
  ShoppingCart,
  Heart,
  Eye,
  Star,
} from "lucide-react";

const brands = [
  { name: "Dell", logo: "/brands/dell.png" },
  { name: "HP", logo: "/brands/hp.png" },
  { name: "Lenovo", logo: "/brands/lenovo.png" },
  { name: "ASUS", logo: "/brands/asus.png" },
  { name: "Hikvision", logo: "/brands/hikvision.png" },
  { name: "Dahua", logo: "/brands/dahua.png" },
  { name: "TP-Link", logo: "/brands/tplink.png" },
  { name: "DJI", logo: "/brands/dji.png" },
  { name: "Samsung", logo: "/brands/samsung.png" },
  { name: "Seagate", logo: "/brands/seagate.png" },
];

const featured = [
  {
    name: "ASUS ROG Laptop",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786017606/ASUS_ROG_Laptop_wlgrgg.webp",
    price: "₹1,19,999",
    oldPrice: "₹1,34,999",
    rating: 4.9,
  },
  {
    name: "AI PTZ Camera",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786017607/AI_PTZ_Camera_jdwn7h.webp",
    price: "₹16,999",
    oldPrice: "₹21,999",
    rating: 4.8,
  },
  {
    name: "Synology NAS",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786017607/Synology_NAS_uhhbsb.webp",
    price: "₹42,999",
    oldPrice: "₹48,999",
    rating: 4.7,
  },
  {
    name: "DJI Air Drone",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786017613/DJI_Air_Drone_pgogse.webp",
    price: "₹82,999",
    oldPrice: "₹89,999",
    rating: 4.9,
  },
];

export default function FeaturedSection() {
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

          <button className="flex items-center gap-2 font-semibold">
            View All
            <ChevronRight size={18}/>
          </button>

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

          {featured.map((item, index) => (

            <div
              key={index}
              className="bg-white rounded-3xl overflow-hidden shadow hover:shadow-2xl transition"
            >

              <div className="relative bg-gray-100 p-8">

                <button className="absolute top-4 right-4 bg-white p-2 rounded-full shadow">
                  <Heart size={18}/>
                </button>

                <img
                  src={item.image}
                  className="h-56 mx-auto object-contain"
                  alt={item.name}
                />

              </div>

              <div className="p-6">

                <div className="flex text-yellow-500 items-center gap-1">
                  <Star fill="currentColor" size={16}/>
                  {item.rating}
                </div>

                <h3 className="font-bold text-lg mt-3">
                  {item.name}
                </h3>

                <div className="flex gap-3 mt-4 items-center">

                  <span className="text-2xl font-bold text-[#0A1931]">
                    {item.price}
                  </span>

                  <span className="line-through text-gray-400">
                    {item.oldPrice}
                  </span>

                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">

                  <button className="bg-[#0A1931] text-white py-3 rounded-xl flex justify-center gap-2 items-center">
                    <ShoppingCart size={18}/>
                    Cart
                  </button>

                  <button className="border py-3 rounded-xl flex justify-center gap-2 items-center">
                    <Eye size={18}/>
                    View
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}
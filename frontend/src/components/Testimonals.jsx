import { Link } from "react-router-dom";
import {
  Star,
  Quote,
  Building2,
  Users,
  PackageCheck,
  Wrench,
} from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Rahul Sharma",
    company: "ABC Technologies",
    image: "/customers/customer1.jpg",
    rating: 5,
    review:
      "Honey Vision provided excellent CCTV installation and networking solutions. The team was professional and completed the project on time.",
  },
  {
    id: 2,
    name: "Priya Das",
    company: "Green Valley School",
    image: "/customers/customer2.jpg",
    rating: 5,
    review:
      "The AI camera recommendation helped us choose the perfect surveillance system for our campus. Highly recommended.",
  },
  {
    id: 3,
    name: "Amit Patel",
    company: "Patel Industries",
    image: "/customers/customer3.jpg",
    rating: 5,
    review:
      "Amazing support, genuine products, and excellent after-sales service with AMC. We are very satisfied.",
  },
];

const stats = [
  {
    icon: <Users size={34} />,
    value: "10,000+",
    label: "Happy Customers",
  },
  {
    icon: <PackageCheck size={34} />,
    value: "5,000+",
    label: "Products Delivered",
  },
  {
    icon: <Wrench size={34} />,
    value: "2,500+",
    label: "Installations",
  },
  {
    icon: <Building2 size={34} />,
    value: "500+",
    label: "Business Clients",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-gray-50">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center">

          <p className="text-yellow-500 uppercase tracking-widest font-semibold">
            Testimonials
          </p>

          <h2 className="text-5xl font-bold text-[#0A1931] mt-4">
            Trusted by Thousands of Customers
          </h2>

          <p className="text-gray-500 mt-5 max-w-3xl mx-auto">
            Businesses, schools, hospitals and homeowners trust Honey Vision
            for reliable IT products, surveillance solutions and professional installation.
          </p>

        </div>

        {/* Statistics */}

        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mt-16">

          {stats.map((item, index) => (

            <div
              key={index}
              className="bg-white rounded-3xl p-8 text-center shadow hover:shadow-xl transition"
            >

              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500 mx-auto">
                {item.icon}
              </div>

              <h3 className="text-4xl font-bold text-[#0A1931] mt-6">
                {item.value}
              </h3>

              <p className="text-gray-500 mt-2">
                {item.label}
              </p>

            </div>

          ))}

        </div>

        {/* Customer Reviews */}

        <div className="grid lg:grid-cols-3 gap-8 mt-20">

          {testimonials.map((item) => (

            <div
              key={item.id}
              className="bg-white rounded-3xl p-8 shadow hover:shadow-2xl transition"
            >

              <Quote className="text-yellow-500" size={36} />

              <div className="flex mt-5">

                {[...Array(item.rating)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className="text-yellow-500 fill-yellow-500"
                  />
                ))}

              </div>

              <p className="text-gray-600 leading-8 mt-6">
                "{item.review}"
              </p>

              <div className="flex items-center gap-4 mt-8">

                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-full object-cover"
                />

                <div>

                  <h3 className="font-bold">
                    {item.name}
                  </h3>

                  <p className="text-gray-500 text-sm">
                    {item.company}
                  </p>

                </div>

              </div>

            </div>

          ))}

        </div>

        {/* CTA */}

        <div className="mt-20 bg-gradient-to-r from-[#06142B] to-[#0A1931] rounded-3xl p-12 flex flex-col lg:flex-row items-center justify-between">

          <div>

            <h2 className="text-4xl font-bold text-white">
              Ready to Secure Your Business?
            </h2>

            <p className="text-gray-300 mt-4 max-w-2xl">
              Explore our complete range of IT products, CCTV systems, drones,
              networking devices and professional installation services.
            </p>

          </div>

          <div className="flex gap-4 mt-8 lg:mt-0">

            <Link to="/products" className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4 rounded-xl font-semibold inline-flex items-center justify-center">
              Shop Now
            </Link>

            <Link to="/contact" className="border border-white text-white px-8 py-4 rounded-xl hover:bg-white hover:text-[#0A1931] transition inline-flex items-center justify-center">
              Contact Us
            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}
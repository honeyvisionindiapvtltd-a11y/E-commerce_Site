import {
  CalendarDays,
  Clock3,
  ArrowRight,
} from "lucide-react";

const blogs = [
  {
    id: 1,
    title: "How AI CCTV Cameras are Transforming Modern Security",
    image: "/blogs/blog1.jpg",
    category: "AI Security",
    date: "05 Aug 2026",
    read: "6 Min Read",
  },
  {
    id: 2,
    title: "Top 10 Laptops for Business & Professional Work",
    image: "/blogs/blog2.jpg",
    category: "Laptops",
    date: "02 Aug 2026",
    read: "5 Min Read",
  },
  {
    id: 3,
    title: "Complete Guide to Enterprise Networking Solutions",
    image: "/blogs/blog3.jpg",
    category: "Networking",
    date: "30 Jul 2026",
    read: "8 Min Read",
  },
  {
    id: 4,
    title: "Drone Technology for Industrial Inspection & Surveillance",
    image: "/blogs/blog4.jpg",
    category: "Drones",
    date: "28 Jul 2026",
    read: "7 Min Read",
  },
];

export default function BlogSection() {
  return (
    <section className="py-24 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}

        <div className="flex justify-between items-center flex-wrap gap-5">

          <div>

            <p className="uppercase tracking-widest text-yellow-500 font-semibold">
              Latest Articles
            </p>

            <h2 className="text-5xl font-bold text-[#0A1931] mt-4">
              Technology Insights & Blogs
            </h2>

          </div>

          <button className="border border-[#0A1931] px-7 py-3 rounded-xl hover:bg-[#0A1931] hover:text-white transition">
            View All Blogs
          </button>

        </div>

        {/* Featured Blog */}

        <div className="grid lg:grid-cols-2 gap-10 mt-16">

          <div className="rounded-3xl overflow-hidden shadow-xl">

            <img
              src="/blogs/featured.jpg"
              alt="Featured Blog"
              className="w-full h-[420px] object-cover"
            />

          </div>

          <div className="flex flex-col justify-center">

            <span className="bg-yellow-100 text-yellow-700 w-fit px-4 py-2 rounded-full">
              Featured Article
            </span>

            <h2 className="text-4xl font-bold mt-6 text-[#0A1931]">
              Complete Guide to Building a Smart Office with AI Security
            </h2>

            <p className="text-gray-600 mt-6 leading-8">
              Discover how AI surveillance, access control,
              networking, cloud storage, and automation
              help businesses create a secure and efficient
              smart office environment.
            </p>

            <div className="flex gap-8 mt-8 text-gray-500">

              <div className="flex items-center gap-2">
                <CalendarDays size={18}/>
                05 Aug 2026
              </div>

              <div className="flex items-center gap-2">
                <Clock3 size={18}/>
                10 Min Read
              </div>

            </div>

            <button className="flex items-center gap-2 mt-8 text-[#0A1931] font-semibold">
              Read Full Article
              <ArrowRight size={18}/>
            </button>

          </div>

        </div>

        {/* Blog Cards */}

        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mt-20">

          {blogs.map((blog) => (

            <div
              key={blog.id}
              className="rounded-3xl overflow-hidden shadow hover:shadow-2xl transition bg-white"
            >

              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-56 object-cover"
              />

              <div className="p-6">

                <span className="bg-blue-100 text-blue-600 text-xs px-3 py-2 rounded-full">
                  {blog.category}
                </span>

                <h3 className="text-xl font-bold mt-5">
                  {blog.title}
                </h3>

                <div className="flex justify-between text-gray-500 text-sm mt-6">

                  <div className="flex items-center gap-2">
                    <CalendarDays size={16}/>
                    {blog.date}
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock3 size={16}/>
                    {blog.read}
                  </div>

                </div>

                <button className="mt-6 text-[#0A1931] font-semibold flex items-center gap-2">
                  Read More
                  <ArrowRight size={18}/>
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}
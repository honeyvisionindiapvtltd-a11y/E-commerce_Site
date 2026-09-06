import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const blogs = [
  {
    id: 1,
    title: "How AI CCTV Cameras are Transforming Modern Security",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786173897/blog1_jetmtz.png",
    category: "AI Security",
    date: "05 Aug 2026",
    read: "6 Min Read",
  },
  {
    id: 2,
    title: "Top 10 Laptops for Business & Professional Work",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786174380/blog2_fyfiq2.png",
    category: "Laptops",
    date: "02 Aug 2026",
    read: "5 Min Read",
  },
  {
    id: 3,
    title: "Complete Guide to Enterprise Networking Solutions",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786178835/blog3_rezrfp.png",
    category: "Networking",
    date: "30 Jul 2026",
    read: "8 Min Read",
  },
  {
    id: 4,
    title: "Drone Technology for Industrial Inspection & Surveillance",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786174374/blog4_fgkwc0.png",
    category: "Drones",
    date: "28 Jul 2026",
    read: "7 Min Read",
  },
];

export default function BlogSection() {
  const navigate = useNavigate();
  const [activeBlog, setActiveBlog] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBlog((current) => (current + 1) % blogs.length);
    }, 4200);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-white py-8 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-500 sm:text-sm">
              Latest Articles
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#0A1931] sm:text-4xl lg:text-5xl">
              Technology Insights & Blogs
            </h2>
          </div>

          <Link
            to="/blogs"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-[#0A1931] px-3 py-2 text-xs font-medium transition hover:bg-[#0A1931] hover:text-white sm:px-7 sm:py-3 sm:text-sm"
          >
            View All Blogs
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:mt-16 lg:grid-cols-2 lg:gap-10">
          <div className="overflow-hidden rounded-2xl shadow-xl sm:rounded-3xl">
            <img
              src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1786173653/blog-bg_xhxpvn.png"
              alt="Featured Blog"
              className="h-40 w-full object-cover sm:h-72 lg:h-[420px]"
            />
          </div>

          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full bg-yellow-100 px-2.5 py-1.5 text-[10px] font-medium text-yellow-700 sm:px-4 sm:text-xs">
              Featured Article
            </span>

            <h2 className="mt-3 text-xl font-bold text-[#0A1931] sm:text-3xl lg:text-4xl">
              Complete Guide to Building a Smart Office with AI Security
            </h2>

            <p className="mt-3 text-xs leading-6 text-gray-600 sm:text-base sm:leading-8">
              Discover how AI surveillance, access control, networking, cloud
              storage, and automation help businesses create a secure and
              efficient smart office environment.
            </p>

            <div className="mt-4 flex flex-col gap-2 text-xs text-gray-500 sm:mt-8 sm:flex-row sm:gap-8 sm:text-sm">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} />
                05 Aug 2026
              </div>

              <div className="flex items-center gap-2">
                <Clock3 size={16} />
                10 Min Read
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/blogs")}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0A1931] sm:mt-8"
            >
              Read Full Article
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="mt-10 sm:mt-16">
          <div className="sm:hidden">
            <div className="overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${activeBlog * 100}%)` }}
              >
                {blogs.map((blog) => (
                  <div key={blog.id} className="min-w-full">
                    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                      <div className="overflow-hidden">
                        <img
                          src={blog.image}
                          alt={blog.title}
                          className="h-40 w-full object-cover object-center"
                        />
                      </div>

                      <div className="p-2.5">
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-[9px] font-medium text-blue-600">
                          {blog.category}
                        </span>

                        <h3 className="mt-2.5 text-sm font-bold text-[#0A1931]">
                          {blog.title}
                        </h3>

                        <div className="mt-2.5 flex flex-col gap-1 text-[10px] text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays size={12} />
                            {blog.date}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Clock3 size={12} />
                            {blog.read}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate("/blogs")}
                          className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0A1931]"
                        >
                          Read More
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              {blogs.map((blog, index) => (
                <button
                  key={`${blog.id}-dot`}
                  type="button"
                  aria-label={`Go to blog ${index + 1}`}
                  onClick={() => setActiveBlog(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeBlog === index ? "w-7 bg-slate-900" : "w-2 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="hidden gap-5 sm:grid lg:grid-cols-4 lg:gap-8">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="overflow-hidden rounded-3xl bg-white shadow transition hover:shadow-2xl"
              >
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="h-44 w-full object-cover sm:h-52"
                />

                <div className="p-4 sm:p-6">
                  <span className="inline-block rounded-full bg-blue-100 px-2.5 py-1.5 text-[10px] font-medium text-blue-600 sm:text-xs">
                    {blog.category}
                  </span>

                  <h3 className="mt-4 text-base font-bold text-[#0A1931] sm:text-xl">
                    {blog.title}
                  </h3>

                  <div className="mt-4 flex flex-col gap-2 text-[11px] text-gray-500 sm:flex-row sm:justify-between sm:text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} />
                      {blog.date}
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3 size={14} />
                      {blog.read}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/blogs")}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0A1931]"
                  >
                    Read More
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
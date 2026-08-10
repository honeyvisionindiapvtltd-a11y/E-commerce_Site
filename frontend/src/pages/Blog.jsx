import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Cloud,
  LockKeyhole,
  Network,
  Search,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";

const latestArticles = [
  {
    category: "CLOUD COMPUTING",
    title: "Cloud Solutions for Modern Businesses",
    date: "May 18, 2024",
    readTime: "4 Min Read",
    image:
      "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786174380/blog2_fyfiq2.png",
    link: "/blogs/cloud-solutions-modern-businesses",
  },
  {
    category: "NETWORKING",
    title: "5G & Beyond: The Future of Connectivity",
    date: "May 16, 2024",
    readTime: "5 Min Read",
    image:
      "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786173897/blog1_jetmtz.png",
    link: "/blogs/5g-future-connectivity",
  },
  {
    category: "DRONES",
    title: "Drones in Industry: Applications & Use Cases",
    date: "May 14, 2024",
    readTime: "6 Min Read",
    image:
      "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786174374/blog4_fgkwc0.png",
    link: "/blogs/drones-in-industry",
  },
  {
    category: "CYBER SECURITY",
    title: "Cyber Security Best Practices for Enterprises",
    date: "May 12, 2024",
    readTime: "6 Min Read",
    image:
      "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786178835/blog3_rezrfp.png",
    link: "/blogs/cyber-security-best-practices",
  },
];

const categories = [
  ["AI Technology", "18", Shield],
  ["Surveillance", "15", Shield],
  ["Networking", "12", Network],
  ["Cloud Computing", "10", Cloud],
  ["Cyber Security", "14", LockKeyhole],
  ["Drones", "9", Network],
  ["Industry Insights", "11", Shield],
  ["Product Updates", "8", Cloud],
];

const popularPosts = [
  {
    title: "How AI Cameras Improve Business Security",
    date: "May 10, 2024",
    image: "/images/blogs/ai-camera-thumb.jpg",
    link: "/blogs/ai-cameras-business-security",
  },
  {
    title: "Choosing the Right Network Switch for Your Business",
    date: "May 08, 2024",
    image: "/images/blogs/network-switch-thumb.jpg",
    link: "/blogs/right-network-switch",
  },
  {
    title: "Top 5 Benefits of Cloud Storage Solutions",
    date: "May 06, 2024",
    image: "/images/blogs/cloud-storage-thumb.jpg",
    link: "/blogs/cloud-storage-benefits",
  },
];

export default function Blog() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navbar is rendered in App.jsx or Layout.jsx */}

      {/* Hero */}
      <section className="relative min-h-[260px] overflow-hidden text-white sm:min-h-[340px]">
        {/* Hero Image */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] flex w-[48%] items-center justify-end sm:w-[50%] lg:w-[52%]">
          <img
            src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1786344410/blog-hero_tzpjd0.png"
            alt="Honey Vision technology blog"
            className="h-full w-full object-contain object-right drop-shadow-[0_30px_60px_rgba(0,0,0,.35)]"
          />
        </div>

        {/* Background Overlay */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-[#031426]/95 via-[#031426]/75 to-[#031426]/35" />

        {/* Hero Content */}
        <div className="relative z-[3] mx-auto max-w-7xl px-3 py-12 sm:px-6 lg:py-16">
          <span className="inline-block rounded-full border border-amber-400 px-4 py-1.5 text-xs font-semibold text-amber-400">
            OUR BLOG
          </span>

          <h1 className="mt-5 max-w-xl text-4xl font-bold leading-tight sm:text-5xl">
            Technology Insights
            <br />
            That <span className="text-amber-400">Drive Innovation</span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
            Stay updated with the latest trends, expert insights, and in-depth
            knowledge on AI, security, networking, and emerging technologies.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section>
            {/* Featured article */}
            <h2 className="border-b-2 border-amber-400 pb-2 text-xl font-bold text-slate-900">
              Featured Article
            </h2>

            <article className="mt-4 grid overflow-hidden rounded-xl bg-white shadow-md md:grid-cols-[38%_1fr]">
              <div className="relative h-[260px] w-full overflow-hidden md:h-full">
                <img
                  src="https://res.cloudinary.com/vhrkwyzs/image/upload/v1786173897/blog1_jetmtz.png"
                  alt="AI surveillance camera"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              <div className="p-5 sm:p-6">
                <span className="rounded-md bg-amber-400 px-2 py-1 text-[10px] font-bold text-slate-950">
                  FEATURED
                </span>

                <h3 className="mt-3 text-2xl font-bold leading-tight text-slate-900">
                  AI in Surveillance: Building Smarter & Safer Environments
                </h3>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={14} />
                    May 20, 2024
                  </span>

                  <span>AI Technology</span>

                  <span className="flex items-center gap-1">
                    <Clock3 size={14} />
                    6 Min Read
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Explore how AI-powered surveillance systems are transforming
                  security operations with real-time analytics, object
                  detection, and intelligent alerts.
                </p>

                <Link
                  to="/blogs/ai-surveillance-smarter-safer-environments"
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#071426] px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 hover:text-slate-950"
                >
                  Read Full Article
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>

            {/* Latest articles */}
            <div className="mt-7 flex items-center justify-between">
              <h2 className="border-b-2 border-amber-400 pb-2 text-xl font-bold text-slate-900">
                Latest Articles
              </h2>

              <Link
                to="/blogs"
                className="text-sm font-semibold text-blue-600 hover:text-amber-500"
              >
                View All Articles →
              </Link>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {latestArticles.map((article) => (
                <ArticleCard key={article.title} article={article} />
              ))}
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="font-bold text-slate-900">Search Blogs</h2>

              <form className="mt-3 flex overflow-hidden rounded-md border border-slate-200">
                <input
                  type="search"
                  placeholder="Search articles..."
                  className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none"
                />

                <button
                  type="submit"
                  className="grid w-12 place-items-center bg-[#071426] text-white hover:bg-amber-500 hover:text-slate-950"
                  aria-label="Search blogs"
                >
                  <Search size={18} />
                </button>
              </form>
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="border-b-2 border-amber-400 pb-2 font-bold text-slate-900">
                Categories
              </h2>

              <div className="mt-3 space-y-3">
                {categories.map(([name, count, Icon]) => (
                  <Link
                    key={name}
                    to={`/blogs/category/${name
                      .toLowerCase()
                      .replaceAll(" ", "-")}`}
                    className="flex items-center justify-between text-sm text-slate-600 hover:text-amber-600"
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={15} />
                      {name}
                    </span>

                    <span className="rounded bg-[#071426] px-2 py-0.5 text-xs text-white">
                      {count}
                    </span>
                  </Link>
                ))}
              </div>

              <Link
                to="/blogs/categories"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-600"
              >
                View All Categories
                <ArrowRight size={15} />
              </Link>
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="border-b-2 border-amber-400 pb-2 font-bold text-slate-900">
                Popular Posts
              </h2>

              <div className="mt-3 space-y-4">
                {popularPosts.map((post) => (
                  <Link
                    key={post.title}
                    to={post.link}
                    className="flex gap-3 hover:text-amber-600"
                  >
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-14 w-16 rounded-md object-cover"
                    />

                    <div>
                      <h3 className="text-sm font-semibold leading-5 text-slate-800">
                        {post.title}
                      </h3>

                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <CalendarDays size={12} />
                        {post.date}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Newsletter footer */}
      <section className="bg-[#031426] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-3 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-400 text-slate-950">
              <MailIcon />
            </div>

            <div>
              <h2 className="font-bold">Stay Updated with Honey Vision</h2>

              <p className="mt-1 text-sm text-slate-300">
                Get the latest updates, insights, and offers to your inbox.
              </p>
            </div>
          </div>

          <form className="flex h-11 w-full overflow-hidden rounded-md bg-white lg:w-[420px]">
            <input
              type="email"
              placeholder="Enter your email address"
              className="min-w-0 flex-1 px-4 text-sm text-slate-800 outline-none"
            />

            <button
              type="submit"
              className="bg-amber-500 px-6 text-sm font-semibold text-slate-950 hover:bg-amber-400"
            >
              Subscribe
            </button>
          </form>

          <div className="flex items-center gap-3">
            <span className="mr-2 text-sm font-semibold">Follow Us</span>

            <SocialIcon label="f" />
            <SocialIcon label="in" />
            <SocialIcon label="◎" />
            <SocialIcon label="▶" />
          </div>
        </div>
      </section>
    </main>
  );
}

function ArticleCard({ article }) {
  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm">
      <Link to={article.link}>
        <div className="h-40 w-full overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

        <div className="p-4">
          <p className="text-[10px] font-bold text-amber-600">
            {article.category}
          </p>

          <h3 className="mt-2 min-h-11 text-sm font-bold leading-5 text-slate-900">
            {article.title}
          </h3>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <CalendarDays size={13} />
              {article.date}
            </span>

            <span className="flex items-center gap-1">
              <Clock3 size={13} />
              {article.readTime}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function SocialIcon({ label }) {
  return (
    <button
      type="button"
      className="grid h-9 w-9 place-items-center rounded-full border border-white/40 text-sm font-bold hover:border-amber-400 hover:text-amber-400"
      aria-label={label}
    >
      {label}
    </button>
  );
}

function MailIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
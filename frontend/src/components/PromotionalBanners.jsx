import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const banners = [
  {
    eyebrow: "SURVEILLANCE CAMERAS",
    title: "See every detail",
    description: "Explore smart camera technology for your home or business.",
    button: "Shop Cameras",
    link: "/products",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786017607/AI_PTZ_Camera_jdwn7h.webp",
    imageAlt: "AI PTZ security camera",
    theme: "camera",
  },
  {
    eyebrow: "HOME SECURITY",
    title: "Protection, all in one",
    description: "Discover complete CCTV bundles for home monitoring.",
    button: "Explore Home Combos",
    link: "/combo-deals",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1792925121/cctv_cameras_cik4he.png",
    imageAlt: "Home Guardian CCTV combo",
    theme: "home",
  },
  {
    eyebrow: "NETWORKING",
    title: "Build a connected space",
    description: "Explore security and networking solutions for your business.",
    button: "Shop Networking",
    link: "/products",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1792927349/9caf2390-8c4e-494a-b09c-df8f9060adf4_ihtegp.png",
    imageAlt: "Office security and networking combo",
    theme: "network",
  },
  {
    eyebrow: "SMART SECURITY",
    title: "Smarter home protection",
    description: "Explore connected security bundles for larger spaces.",
    button: "View Smart Combos",
    link: "/combo-deals",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1792927803/bc909d8c-ab29-43cf-8367-aab160273a91_wds2uh.png",
    imageAlt: "Smart Villa security combo",
    theme: "smart",
  },
  {
    eyebrow: "BUSINESS SECURITY",
    title: "Keep an eye on business",
    description: "Browse complete security setups for retail and offices.",
    button: "Explore Business Combos",
    link: "/combo-deals",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1792928006/ee149b51-7fd9-4d45-82f4-06fa11b0b2e4_g1xbop.png",
    imageAlt: "Retail Watch security combo",
    theme: "business",
  },
  {
    eyebrow: "FEATURED TECH",
    title: "Find your next upgrade",
    description: "Browse laptops and other everyday technology essentials.",
    button: "Shop Products",
    link: "/products",
    image: "https://res.cloudinary.com/vhrkwyzs/image/upload/v1792928006/d2792247-935a-4550-b08c-387bdf2c15ef_x7xch4.png",
    imageAlt: "Laptop from the HoneyVision product range",
    theme: "tech",
  },
];

const ROTATION_DELAY = 5000;
const TRANSITION_DURATION = 650;

export default function PromotionalBanners() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [settledIndex, setSettledIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const activeIndexRef = useRef(0);
  const transitionTimer = useRef(null);
  const resumeTimer = useRef(null);
  const touchStart = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  const pauseForInteraction = useCallback(() => {
    setInteractionPaused(true);
    window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      setInteractionPaused(false);
    }, ROTATION_DELAY);
  }, []);

  const moveTo = useCallback((nextIndex) => {
    const normalizedIndex = (nextIndex + banners.length) % banners.length;
    if (normalizedIndex === activeIndexRef.current) return;

    activeIndexRef.current = normalizedIndex;
    setActiveIndex(normalizedIndex);
    setSettledIndex(null);
    window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => {
      if (activeIndexRef.current === normalizedIndex) {
        setSettledIndex(normalizedIndex);
      }
    }, reducedMotion ? 0 : TRANSITION_DURATION + 50);
  }, [reducedMotion]);

  const navigateManually = useCallback((nextIndex) => {
    pauseForInteraction();
    moveTo(nextIndex);
  }, [moveTo, pauseForInteraction]);

  useEffect(() => () => {
    window.clearTimeout(transitionTimer.current);
    window.clearTimeout(resumeTimer.current);
  }, []);

  useEffect(() => {
    if (
      hovered ||
      focused ||
      interactionPaused ||
      settledIndex !== activeIndex
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      moveTo(activeIndexRef.current + 1);
    }, ROTATION_DELAY);
    return () => window.clearTimeout(timer);
  }, [activeIndex, focused, hovered, interactionPaused, moveTo, settledIndex]);

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const handleTouchEnd = (event) => {
    if (!touchStart.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touch ? touch.clientX - touchStart.current.x : 0;
    const deltaY = touch ? touch.clientY - touchStart.current.y : 0;
    touchStart.current = null;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    navigateManually(activeIndexRef.current + (deltaX < 0 ? 1 : -1));
  };

  return (
    <section
      className="hv-promo-carousel mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8"
      aria-label="HoneyVision featured products and offers"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mb-4 flex items-end justify-between gap-3 sm:mb-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 sm:text-xs">
            HoneyVision highlights
          </p>
          <h2 className="hv-promo-section-title mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
            Find the right fit for your space
          </h2>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => navigateManually(activeIndexRef.current - 1)}
            className="hv-promo-control"
            aria-label="Previous banner"
          >
            <ChevronLeft size={19} />
          </button>
          <button
            type="button"
            onClick={() => navigateManually(activeIndexRef.current + 1)}
            className="hv-promo-control"
            aria-label="Next banner"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>

      <div
        className={`hv-promo-viewport${reducedMotion ? " hv-promo-reduced-motion" : ""}`}
        aria-live="off"
      >
        {banners.map((banner, index) => {
          let distance = (index - activeIndex + banners.length) % banners.length;
          if (distance > banners.length / 2) distance -= banners.length;
          const absoluteDistance = Math.abs(distance);
          const isCentered = index === activeIndex;
          const isSettled = isCentered && settledIndex === activeIndex;
          const scale = isCentered ? 1.04 : absoluteDistance === 1 ? 0.84 : 0.72;
          const opacity = isCentered ? 1 : absoluteDistance === 1 ? 0.82 : 0.42;

          return (
            <article
              key={banner.theme}
              className={`hv-promo-slide hv-promo-slide-${banner.theme}${isCentered ? " is-centered" : ""}`}
              data-banner-index={index}
              aria-hidden={!isCentered || !isSettled}
              inert={!isCentered || !isSettled}
              style={{
                "--slide-x": `${distance * 96}%`,
                "--slide-scale": scale,
                "--slide-opacity": opacity,
                zIndex: banners.length - absoluteDistance,
              }}
            >
              <div className="hv-promo-content">
                <span className="hv-promo-eyebrow">{banner.eyebrow}</span>
                <h3 className="hv-promo-title">{banner.title}</h3>
                <p className="hv-promo-description">{banner.description}</p>
                <Link to={banner.link} className="hv-promo-cta">
                  {banner.button}
                  <ChevronRight size={16} />
                </Link>
              </div>
              <img
                src={banner.image}
                alt={banner.imageAlt}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
                className="hv-promo-image"
              />
            </article>
          );
        })}
      </div>

      <div className="hv-promo-pagination" aria-label="Choose a banner">
        {banners.map((banner, index) => (
          <button
            key={banner.theme}
            type="button"
            className={`hv-promo-dot${index === activeIndex ? " is-active" : ""}`}
            aria-label={`Show ${banner.eyebrow.toLowerCase()} banner`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => navigateManually(index)}
          />
        ))}
      </div>
    </section>
  );
}

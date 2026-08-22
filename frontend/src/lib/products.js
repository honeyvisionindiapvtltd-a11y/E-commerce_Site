// Fallback empty array - all products are fetched from the backend API
// This is used only when the API is unavailable
export const products = [];

// Product bundle recommendations are now managed by the backend API
export const bundleByProductId = {};

export function recommendationsFor(productId, limit = 4) {
  // Recommendations are now fetched from the backend API
  // This function is kept for backward compatibility
  return [];
}

// Categories are now fetched from the backend API
export const categories = [];

const categorySlugMap = {
  "all-products": null,
  "cctv-surveillance": "CCTV & Surveillance",
  "dvr-nvr-recording": "DVR / NVR & Recording",
  "ai-cameras-analytics": "AI Cameras & Analytics",
  "storage-hard-drives": "Storage & Hard Drives",
  "networking-products": "Networking Products",
  "access-control": "Access Control",
  "video-door-phones": "Video Door Phones",
  "alarm-safety-systems": "Alarm & Safety Systems",
  "smart-home-automation": "Smart Home & Automation",
  "audio-visual": "Audio Visual",
  "video-conferencing": "Video Conferencing",
  "led-displays-signage": "LED Displays & Digital Signage",
  "servers-data-center": "Servers & Data Center",
  "computers-laptops": "Computers & Laptops",
  "ups-power-solutions": "UPS & Power Solutions",
  "drones-accessories": "Drones & Accessories",
  "smart-agriculture": "Smart Agriculture",
  "cloud-software": "Cloud & Software",
  "cabling-accessories": "Cabling & Accessories",
  "tools-testers": "Tools & Testers",
  "office-equipment": "Office Equipment",
  "pos-retail-solutions": "POS & Retail Solutions",
  "iot-devices-sensors": "IoT Devices & Sensors",
  "vehicle-parking-solutions": "Vehicle & Parking Solutions",
  "solar-backup-solutions": "Solar & Backup Solutions",
  "combo-packages": "Combo Packages",
  "amc-maintenance": "AMC & Maintenance",
  "cctv-and-security": "CCTV & Surveillance",
  "bullet-camera": "CCTV & Surveillance",
  "dome-camera": "CCTV & Surveillance",
  "ip-camera": "CCTV & Surveillance",
  "ptz-camera": "CCTV & Surveillance",
  "wi-fi-camera": "CCTV & Surveillance",
  "solar-cctv": "CCTV & Surveillance",
  "video-doorbell": "CCTV & Surveillance",
  "cctv-accessories": "CCTV & Surveillance",
  "dvr-and-nvr": "DVR / NVR & Recording",
  "4-channel": "DVR / NVR & Recording",
  "8-channel": "DVR / NVR & Recording",
  "16-channel": "DVR / NVR & Recording",
  "32-channel": "DVR / NVR & Recording",
  "nvr": "DVR / NVR & Recording",
  "xvr": "DVR / NVR & Recording",
  "poe-nvr": "DVR / NVR & Recording",
  "computers-and-laptops": "Computers & Laptops",
  laptops: "Computers & Laptops",
  desktop: "Computers & Laptops",
  "gaming-pc": "Computers & Laptops",
  monitors: "Computers & Laptops",
  "computer-components": "Components",
  networking: "Networking Products",
  "wi-fi-router": "Networking Products",
  "network-switch": "Networking Products",
  "poe-switch": "Networking Products",
  "access-point": "Networking Products",
  "lan-cable": "Networking Products",
  "network-accessories": "Networking Products",
  storage: "Storage & Hard Drives",
  hdd: "Storage & Hard Drives",
  "surveillance-hdd": "Storage & Hard Drives",
  ssd: "Storage & Hard Drives",
  "nvme-ssd": "Storage & Hard Drives",
  "pen-drive": "Storage & Hard Drives",
  "memory-card": "Storage & Hard Drives",
  "external-hdd": "Storage & Hard Drives",
  "it-accessories": "IT Accessories",
  accessories: "IT Accessories",
  mouse: "IT Accessories",
  keyboard: "IT Accessories",
  webcam: "IT Accessories",
  headset: "IT Accessories",
  "laptop-stand": "IT Accessories",
  "laptop-bag": "IT Accessories",
  "usb-hub": "IT Accessories",
  "cables-and-connectors": "Cabling & Accessories",
  "hdmi-cable": "Cabling & Accessories",
  "usb-cable": "Cabling & Accessories",
  "lan-cable-connectors": "Cabling & Accessories",
  "cat6-cable": "Cabling & Accessories",
  "bnc-connector": "Cabling & Accessories",
  "power-cable": "Cabling & Accessories",
  "printers-and-office": "Office Equipment",
  printers: "Office Equipment",
  cartridges: "Office Equipment",
  toners: "Office Equipment",
  "barcode-scanner": "Office Equipment",
  projector: "Office Equipment",
  "power-backup": "UPS & Power Solutions",
  ups: "UPS & Power Solutions",
  inverter: "UPS & Power Solutions",
  battery: "UPS & Power Solutions",
  stabilizer: "UPS & Power Solutions",
  "extension-board": "UPS & Power Solutions",
  drones: "Drones & Accessories",
  "camera-drone": "Drones & Accessories",
  "4k-drone": "Drones & Accessories",
  "gps-drone": "Drones & Accessories",
  "mini-drone": "Drones & Accessories",
  "drone-accessories": "Drones & Accessories",
  "access-control": "Access Control",
  biometric: "Access Control",
  "face-recognition": "Access Control",
  rfid: "Access Control",
  "smart-lock": "Smart Home & Automation",
  "access-controller": "Access Control",
  "safety-and-detection": "Alarm & Safety Systems",
  "smoke-detector": "Alarm & Safety Systems",
  "fire-alarm": "Alarm & Safety Systems",
  "motion-sensor": "Alarm & Safety Systems",
  "door-sensor": "Alarm & Safety Systems",
  "security-alarm": "Alarm & Safety Systems",
  "installation-and-services": "AMC & Maintenance",
  "cctv-installation": "CCTV & Surveillance",
  "cctv-amc": "AMC & Maintenance",
  "cctv-maintenance": "AMC & Maintenance",
  "network-installation": "Networking Products",
  "it-support": "IT Accessories",
};

export const slugifyCategory = (category) =>
  category
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const categoryFromSlug = (slug) => {
  if (!slug) return null;
  const directMatch = categorySlugMap[slug];
  if (directMatch) return directMatch;
  return categories.find((category) => slugifyCategory(category) === slug) || null;
};

export const matchesCategorySlug = (productCategory, slug) => {
  if (!slug || slug === "all-products") return true;
  const canonicalCategory = categoryFromSlug(slug);
  return Boolean(canonicalCategory && productCategory === canonicalCategory);
};

export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

/**
 * Normalizes product data from API responses to a consistent internal format
 * Used across all product pages (Products, ProductDetails, Category, etc.)
 */
export const normalizeProduct = (product) => {
  if (!product) return null;
  
  const category = product.category && typeof product.category === "object" 
    ? product.category.name 
    : product.category || "General";
  
  const subCategory = product.subCategory && typeof product.subCategory === "object"
    ? product.subCategory.name
    : product.subCategory || "";

  return {
    id: product._id || product.id || product.slug || `${category}-${product.name}`,
    name: product.name || "Product",
    category,
    subCategory,
    brand: product.brand || "HoneyVision",
    price: Number(product.price ?? product.salePrice ?? 0),
    mrp: Number(product.mrp ?? product.originalPrice ?? product.price ?? 0),
    rating: Number(product.rating ?? product.averageRating ?? 4.5),
    reviews: Number(product.reviewCount ?? product.reviews ?? 0),
    stock: Number(product.stock ?? 0),
    delivery: product.delivery || "Delivery available",
    image: product.thumbnail || product.image || product.images?.[0] || "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786010029/laptop_ktvxcs.png",
    description: product.shortDescription || product.description || "",
    features: Array.isArray(product.features) ? product.features : 
              Array.isArray(product.specifications?.features) ? product.specifications.features : [],
    specifications: product.specifications || {},
    warranty: product.warranty || null,
    installationEligible: Boolean(product.installationEligible),
  };
};

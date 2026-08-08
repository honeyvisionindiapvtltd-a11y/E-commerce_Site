import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { matchesCategorySlug } from "../lib/products";
import {
  ChevronDown,
  ChevronRight,
  Cpu,
  HardDrive,
  Lock,
  Mouse,
  Network,
  Plane,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  SquareStack,
  Wrench,
  Zap,
  X,
} from "lucide-react";

const categoryTree = [
  {
    label: "All Products",
    slug: "all-products",
    icon: Sparkles,
    children: [],
  },
  {
    label: "CCTV & Security",
    slug: "cctv-and-security",
    icon: ShieldCheck,
    children: [
      { label: "Bullet Camera", slug: "bullet-camera" },
      { label: "Dome Camera", slug: "dome-camera" },
      { label: "IP Camera", slug: "ip-camera" },
      { label: "PTZ Camera", slug: "ptz-camera" },
      { label: "Wi-Fi Camera", slug: "wi-fi-camera" },
      { label: "Solar CCTV", slug: "solar-cctv" },
      { label: "Video Doorbell", slug: "video-doorbell" },
      { label: "CCTV Accessories", slug: "cctv-accessories" },
      {
        label: "DVR / NVR",
        slug: "dvr-and-nvr",
        children: [
          { label: "4 Channel", slug: "4-channel" },
          { label: "8 Channel", slug: "8-channel" },
          { label: "16 Channel", slug: "16-channel" },
          { label: "32 Channel", slug: "32-channel" },
          { label: "NVR", slug: "nvr" },
          { label: "XVR", slug: "xvr" },
          { label: "PoE NVR", slug: "poe-nvr" },
        ],
      },
    ],
  },
  {
    label: "Computers & Laptops",
    slug: "computers-and-laptops",
    icon: Cpu,
    children: [
      { label: "Laptops", slug: "laptops" },
      { label: "Desktop", slug: "desktop" },
      { label: "Gaming PC", slug: "gaming-pc" },
      { label: "Monitors", slug: "monitors" },
      { label: "Computer Components", slug: "computer-components" },
    ],
  },
  {
    label: "Networking",
    slug: "networking",
    icon: Network,
    children: [
      { label: "Wi-Fi Router", slug: "wi-fi-router" },
      { label: "Network Switch", slug: "network-switch" },
      { label: "PoE Switch", slug: "poe-switch" },
      { label: "Access Point", slug: "access-point" },
      { label: "LAN Cable", slug: "lan-cable" },
      { label: "Network Accessories", slug: "network-accessories" },
    ],
  },
  {
    label: "Storage",
    slug: "storage",
    icon: HardDrive,
    children: [
      { label: "HDD", slug: "hdd" },
      { label: "Surveillance HDD", slug: "surveillance-hdd" },
      { label: "SSD", slug: "ssd" },
      { label: "NVMe SSD", slug: "nvme-ssd" },
      { label: "Pen Drive", slug: "pen-drive" },
      { label: "Memory Card", slug: "memory-card" },
      { label: "External HDD", slug: "external-hdd" },
    ],
  },
  {
    label: "IT Accessories",
    slug: "it-accessories",
    icon: Mouse,
    children: [
      { label: "Mouse", slug: "mouse" },
      { label: "Keyboard", slug: "keyboard" },
      { label: "Webcam", slug: "webcam" },
      { label: "Headset", slug: "headset" },
      { label: "Laptop Stand", slug: "laptop-stand" },
      { label: "Laptop Bag", slug: "laptop-bag" },
      { label: "USB Hub", slug: "usb-hub" },
    ],
  },
  {
    label: "Cables & Connectors",
    slug: "cables-and-connectors",
    icon: SquareStack,
    children: [
      { label: "HDMI Cable", slug: "hdmi-cable" },
      { label: "USB Cable", slug: "usb-cable" },
      { label: "LAN Cable", slug: "lan-cable-connectors" },
      { label: "CAT6 Cable", slug: "cat6-cable" },
      { label: "BNC Connector", slug: "bnc-connector" },
      { label: "Power Cable", slug: "power-cable" },
    ],
  },
  {
    label: "Printers & Office",
    slug: "printers-and-office",
    icon: Printer,
    children: [
      { label: "Printers", slug: "printers" },
      { label: "Cartridges", slug: "cartridges" },
      { label: "Toners", slug: "toners" },
      { label: "Barcode Scanner", slug: "barcode-scanner" },
      { label: "Projector", slug: "projector" },
    ],
  },
  {
    label: "Power Backup",
    slug: "power-backup",
    icon: Zap,
    children: [
      { label: "UPS", slug: "ups" },
      { label: "Inverter", slug: "inverter" },
      { label: "Battery", slug: "battery" },
      { label: "Stabilizer", slug: "stabilizer" },
      { label: "Extension Board", slug: "extension-board" },
    ],
  },
  {
    label: "Drones",
    slug: "drones",
    icon: Plane,
    children: [
      { label: "Camera Drone", slug: "camera-drone" },
      { label: "4K Drone", slug: "4k-drone" },
      { label: "GPS Drone", slug: "gps-drone" },
      { label: "Mini Drone", slug: "mini-drone" },
      { label: "Drone Accessories", slug: "drone-accessories" },
    ],
  },
  {
    label: "Access Control",
    slug: "access-control",
    icon: Lock,
    children: [
      { label: "Biometric", slug: "biometric" },
      { label: "Face Recognition", slug: "face-recognition" },
      { label: "RFID", slug: "rfid" },
      { label: "Smart Lock", slug: "smart-lock" },
      { label: "Access Controller", slug: "access-controller" },
    ],
  },
  {
    label: "Safety & Detection",
    slug: "safety-and-detection",
    icon: ShieldCheck,
    children: [
      { label: "Smoke Detector", slug: "smoke-detector" },
      { label: "Fire Alarm", slug: "fire-alarm" },
      { label: "Motion Sensor", slug: "motion-sensor" },
      { label: "Door Sensor", slug: "door-sensor" },
      { label: "Security Alarm", slug: "security-alarm" },
    ],
  },
  {
    label: "Installation & Services",
    slug: "installation-and-services",
    icon: Wrench,
    children: [
      { label: "CCTV Installation", slug: "cctv-installation" },
      { label: "CCTV AMC", slug: "cctv-amc" },
      { label: "CCTV Maintenance", slug: "cctv-maintenance" },
      { label: "Network Installation", slug: "network-installation" },
      { label: "IT Support", slug: "it-support" },
    ],
  },
];

const matchesCategorySelection = (productCategory, selectedSlug) => matchesCategorySlug(productCategory, selectedSlug);

function filterTree(nodes, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return nodes;

  return nodes
    .map((node) => {
      const labelMatch = node.label.toLowerCase().includes(normalizedQuery);
      const children = node.children?.length ? filterTree(node.children, query) : [];
      if (labelMatch || children.length) {
        return { ...node, children };
      }
      return null;
    })
    .filter(Boolean);
}

function getCountForNode(node, products) {
  if (node.slug === "all-products") return products.length;
  return products.filter((product) => matchesCategorySelection(product.category, node.slug)).length;
}

function isBranchActive(node, selectedSlug) {
  if (!selectedSlug) return false;
  if (selectedSlug === node.slug) return true;
  return !!node.children?.some((child) => isBranchActive(child, selectedSlug));
}

function getInitialOpenNodes(nodes, selectedSlug) {
  const nextOpen = {};
  const walk = (items) => {
    items.forEach((item) => {
      if (item.children?.length) {
        const shouldOpen = isBranchActive(item, selectedSlug);
        if (shouldOpen) nextOpen[item.slug] = true;
        walk(item.children);
      }
    });
  };
  walk(nodes);
  return nextOpen;
}

export default function ProductSidebar({ products = [], selectedCategorySlug = null }) {
  const [search, setSearch] = useState("");
  const [openNodes, setOpenNodes] = useState(() => getInitialOpenNodes(categoryTree, selectedCategorySlug));
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredTree = useMemo(() => filterTree(categoryTree, search), [search]);

  const toggleNode = (slug) => {
    setOpenNodes((current) => ({ ...current, [slug]: !current[slug] }));
  };

  const renderNode = (node, depth = 0) => {
    const hasChildren = !!node.children?.length;
    const isOpen = openNodes[node.slug];
    const count = getCountForNode(node, products);
    const isActive = selectedCategorySlug === node.slug || isBranchActive(node, selectedCategorySlug);
    const Icon = node.icon;

    return (
      <div key={node.slug} className="space-y-2">
        <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition ${isActive ? "border-sky-400 bg-sky-50 shadow-sm" : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"}`}>
          <Link
            to={node.slug === "all-products" ? "/products" : `/products?category=${node.slug}`}
            className="flex flex-1 items-center justify-between gap-3 text-sm font-medium text-slate-700"
            onClick={() => setIsMobileOpen(false)}
          >
            <span className="flex items-center gap-2">
              {Icon ? <Icon size={16} className={isActive ? "text-sky-600" : "text-slate-500"} /> : <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />}
              <span className={isActive ? "text-slate-950" : "text-slate-700"}>{node.label}</span>
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"}`}>
              {count}
            </span>
          </Link>
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleNode(node.slug)}
              className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={isOpen ? `Collapse ${node.label}` : `Expand ${node.label}`}
            >
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : null}
        </div>
        {hasChildren && isOpen ? (
          <div className="ml-3 space-y-2 border-l border-slate-200 pl-3" style={{ paddingTop: 4 }}>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <style>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 shadow-sm lg:hidden"
      >
        <Search size={16} />
        Open category filters
      </button>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_-24px_rgba(2,8,23,0.28)] lg:block">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Category navigation</p>
              <p className="text-sm text-slate-500">Browse premium products by department</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-2 text-sky-600">
              <Search size={16} />
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories"
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="mt-5 space-y-2">
            {filteredTree.map((node) => renderNode(node))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Active filter</span>
              <span className="font-semibold text-slate-900">{selectedCategorySlug ? selectedCategorySlug.replaceAll("-", " ") : "All products"}</span>
            </div>
            <Link
              to="/products"
              className="mt-3 inline-flex rounded-full border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              onClick={() => setIsMobileOpen(false)}
            >
              Clear filters
            </Link>
          </div>
        </div>

        <div className={`fixed inset-0 z-50 bg-slate-950/60 transition lg:hidden ${isMobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
          <div className={`absolute right-0 top-0 h-full w-[92%] max-w-sm bg-white p-4 shadow-2xl transition ${isMobileOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">Category filters</p>
                <p className="text-sm text-slate-500">Filter products instantly</p>
              </div>
              <button type="button" onClick={() => setIsMobileOpen(false)} className="rounded-full p-2 text-slate-600 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <label className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories"
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="hide-scrollbar mt-4 max-h-[calc(100vh-220px)] space-y-2 overflow-y-auto pr-1">
              {filteredTree.map((node) => renderNode(node))}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <Link
                to="/products"
                className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                onClick={() => setIsMobileOpen(false)}
              >
                Clear filters
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

import {
  Monitor,
  Wrench,
  ShieldCheck,
  Network,
  Headphones,
  Cloud,
  Volume2,
  Printer,
  Code2,
  UserRound,
} from "lucide-react";

export const services = [
  {
    title: "IT Products Supply",
    slug: "it-products-supply",
    icon: Monitor,
    description:
      "Wide range of IT products including computers, laptops, printers, servers, networking devices and accessories.",
    details: [
      "Business-class desktops, laptops and servers",
      "Professional CCTV, networking, storage and AV hardware",
      "Genuine branded products with warranty support",
    ],
    cta: {
      label: "Browse Products",
      to: "/products",
    },
  },
  {
    title: "Installation & Deployment",
    slug: "installation-and-deployment",
    icon: Wrench,
    description:
      "Professional installation of hardware, software, networks and complete IT infrastructure.",
    details: [
      "On-site assessment and solution design",
      "Certified installation of cameras, routers, servers and access control",
      "System configuration, testing and handover",
    ],
    cta: {
      label: "Book Installation",
      to: "/installation",
    },
  },
  {
    title: "Security Solutions",
    slug: "security-solutions",
    icon: ShieldCheck,
    description:
      "Complete CCTV, access control, biometric, video door phone, fire alarm and intrusion detection systems.",
    details: [
      "Smart surveillance systems for homes and businesses",
      "Access control and biometric authentication",
      "Integrated alarm and emergency response solutions",
    ],
    cta: {
      label: "Request Security Support",
      to: "/contact",
    },
  },
  {
    title: "Networking Solutions",
    slug: "networking-solutions",
    icon: Network,
    description:
      "LAN/WAN setup, Wi-Fi solutions, structured cabling, rack setup, VPN and network configuration.",
    details: [
      "High-performance wired and wireless networks",
      "Network planning, cabling and rack deployment",
      "Firewall, VPN and secure remote access setup",
    ],
    cta: {
      label: "Get Network Support",
      to: "/contact",
    },
  },
  {
    title: "AMC & Maintenance",
    slug: "amc-and-maintenance",
    icon: Headphones,
    description:
      "Annual Maintenance Contracts for all IT products and systems with priority support.",
    details: [
      "Scheduled maintenance visits and system health checks",
      "Priority service and rapid issue resolution",
      "Firmware updates, spare parts and warranty support",
    ],
    cta: {
      label: "View AMC Plans",
      to: "/amc",
    },
  },
  {
    title: "Cloud Solutions",
    slug: "cloud-solutions",
    icon: Cloud,
    description:
      "Cloud storage, backup, remote access, virtualization and cloud migration services.",
    details: [
      "Secure cloud backup and data recovery",
      "Virtualization and remote access solutions",
      "Cloud migration and hybrid infrastructure support",
    ],
    cta: {
      label: "Schedule Cloud Consultation",
      to: "/contact",
    },
  },
  {
    title: "Audio Visual Solutions",
    slug: "audio-visual-solutions",
    icon: Volume2,
    description:
      "Display systems, projectors, LED screens, public address systems, conferencing and more.",
    details: [
      "Corporate meeting room AV setups",
      "Digital signage and video walls",
      "Conference room audio, display and control systems",
    ],
    cta: {
      label: "Request AV Support",
      to: "/contact",
    },
  },
  {
    title: "Printer & Peripherals",
    slug: "printer-peripherals",
    icon: Printer,
    description:
      "Printers, scanners, copiers, consumables and all types of IT peripherals and accessories.",
    details: [
      "Business printers, scanners and MFPs",
      "Genuine consumables and spare parts",
      "Printer network integration and support",
    ],
    cta: {
      label: "Browse Accessories",
      to: "/products",
    },
  },
  {
    title: "Software Solutions",
    slug: "software-solutions",
    icon: Code2,
    description:
      "Licensed software, antivirus, business applications, custom software and ERP solutions.",
    details: [
      "Business productivity and security software",
      "ERP, CRM and specialized application licensing",
      "Custom deployment, activation and updates",
    ],
    cta: {
      label: "Request Software Help",
      to: "/contact",
    },
  },
  {
    title: "Support & Consultation",
    slug: "support-and-consultation",
    icon: UserRound,
    description:
      "IT consulting, troubleshooting, system optimization and dedicated 24/7 technical support.",
    details: [
      "Expert guidance for IT upgrades and projects",
      "Remote and on-site troubleshooting",
      "Ongoing support and managed services",
    ],
    cta: {
      label: "Contact Support",
      to: "/support",
    },
  },
];

export const getServiceBySlug = (serviceSlug) =>
  services.find((service) => service.slug === serviceSlug);

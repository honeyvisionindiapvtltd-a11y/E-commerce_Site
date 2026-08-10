export const productData = [

  // ============================================================
  // 1. CCTV & SURVEILLANCE
  // ============================================================

  {
    name: "4MP AI Bullet Camera",
    slug: "4mp-ai-bullet-camera",
    sku: "HV-CCTV-BULLET-4MP-001",
    brand: "HoneyVision",
    categorySlug: "cctv-surveillance",
    subCategorySlug: "bullet-cameras",
    productType: "physical",
    price: 5999,
    mrp: 7999,
    stock: 100,
    warranty: "2 Years",
    shortDescription: "4MP AI-powered outdoor bullet security camera",
    tags: ["CCTV", "AI Camera", "Bullet Camera", "4MP"],
    specifications: {
      resolution: "4MP",
      lens: "2.8mm",
      nightVision: "30m",
      weatherProtection: "IP67",
      ai: ["Human Detection", "Vehicle Detection"],
      compression: "H.265+"
    }
  },

  {
    name: "5MP AI Dome Camera",
    slug: "5mp-ai-dome-camera",
    sku: "HV-CCTV-DOME-5MP-001",
    brand: "HoneyVision",
    categorySlug: "cctv-surveillance",
    subCategorySlug: "dome-cameras",
    productType: "physical",
    price: 6999,
    mrp: 8999,
    stock: 80,
    warranty: "2 Years",
    shortDescription: "5MP indoor AI dome surveillance camera",
    tags: ["CCTV", "Dome", "AI", "5MP"],
    specifications: {
      resolution: "5MP",
      lens: "2.8mm",
      nightVision: "25m",
      weatherProtection: "IP67",
      ai: ["Human Detection", "Intrusion Detection"]
    }
  },

  {
    name: "8MP 4K IP Camera",
    slug: "8mp-4k-ip-camera",
    sku: "HV-IP-8MP-001",
    brand: "HoneyVision",
    categorySlug: "cctv-surveillance",
    subCategorySlug: "ip-cameras",
    productType: "physical",
    price: 9999,
    mrp: 12999,
    stock: 50,
    warranty: "2 Years",
    shortDescription: "4K ultra HD IP surveillance camera",
    tags: ["4K", "IP Camera", "8MP"],
    specifications: {
      resolution: "8MP",
      video: "4K UHD",
      lens: "3.6mm",
      nightVision: "40m",
      compression: "H.265+"
    }
  },

  {
    name: "360° PTZ Speed Dome Camera",
    slug: "360-ptz-speed-dome-camera",
    sku: "HV-PTZ-001",
    brand: "HoneyVision",
    categorySlug: "cctv-surveillance",
    subCategorySlug: "ptz-cameras",
    productType: "physical",
    price: 24999,
    mrp: 32999,
    stock: 30,
    warranty: "2 Years",
    shortDescription: "360 degree PTZ camera with optical zoom",
    tags: ["PTZ", "Speed Dome", "Zoom"],
    specifications: {
      resolution: "4MP",
      zoom: "25X Optical Zoom",
      rotation: "360°",
      nightVision: "150m"
    }
  },

  // ============================================================
  // 2. IP CAMERAS
  // ============================================================

  {
    name: "2MP Network Bullet Camera",
    slug: "2mp-network-bullet-camera",
    sku: "HV-IP-BULLET-2MP-001",
    brand: "HoneyVision",
    categorySlug: "ip-cameras",
    subCategorySlug: "ip-bullet-cameras",
    productType: "physical",
    price: 3499,
    mrp: 4999,
    stock: 100,
    warranty: "2 Years",
    shortDescription: "2MP network bullet camera",
    specifications: {
      resolution: "2MP",
      lens: "2.8mm",
      nightVision: "30m",
      connectivity: "PoE"
    }
  },

  {
    name: "4MP Network Dome Camera",
    slug: "4mp-network-dome-camera",
    sku: "HV-IP-DOME-4MP-001",
    brand: "HoneyVision",
    categorySlug: "ip-cameras",
    subCategorySlug: "ip-dome-cameras",
    productType: "physical",
    price: 5499,
    mrp: 7499,
    stock: 70,
    warranty: "2 Years",
    shortDescription: "4MP PoE network dome camera",
    specifications: {
      resolution: "4MP",
      connectivity: "PoE",
      nightVision: "30m",
      compression: "H.265"
    }
  },

  {
    name: "6MP AI Network Camera",
    slug: "6mp-ai-network-camera",
    sku: "HV-IP-AI-6MP-001",
    brand: "HoneyVision",
    categorySlug: "ip-cameras",
    subCategorySlug: "ai-ip-cameras",
    productType: "physical",
    price: 8499,
    mrp: 10999,
    stock: 50,
    warranty: "2 Years",
    shortDescription: "6MP AI-enabled IP camera",
    specifications: {
      resolution: "6MP",
      ai: [
        "Human Detection",
        "Vehicle Detection",
        "Face Detection"
      ],
      connectivity: "PoE"
    }
  },

  // ============================================================
  // 3. DVR
  // ============================================================

  {
    name: "4 Channel 5MP DVR",
    slug: "4-channel-5mp-dvr",
    sku: "HV-DVR-4CH-001",
    brand: "HoneyVision",
    categorySlug: "dvr",
    subCategorySlug: "4-channel-dvr",
    productType: "physical",
    price: 4499,
    mrp: 5999,
    stock: 50,
    warranty: "2 Years",
    specifications: {
      channels: 4,
      resolution: "5MP",
      compression: "H.265+",
      storageSupport: "Up to 8TB"
    }
  },

  {
    name: "8 Channel AI DVR",
    slug: "8-channel-ai-dvr",
    sku: "HV-DVR-8CH-AI-001",
    brand: "HoneyVision",
    categorySlug: "dvr",
    subCategorySlug: "8-channel-dvr",
    productType: "physical",
    price: 6999,
    mrp: 8999,
    stock: 40,
    warranty: "2 Years",
    specifications: {
      channels: 8,
      resolution: "5MP",
      ai: ["Human Detection", "Vehicle Detection"],
      storageSupport: "Up to 10TB"
    }
  },

  {
    name: "16 Channel AI DVR",
    slug: "16-channel-ai-dvr",
    sku: "HV-DVR-16CH-AI-001",
    brand: "HoneyVision",
    categorySlug: "dvr",
    subCategorySlug: "16-channel-dvr",
    productType: "physical",
    price: 11999,
    mrp: 14999,
    stock: 30,
    warranty: "2 Years",
    specifications: {
      channels: 16,
      resolution: "5MP",
      ai: ["Human Detection", "Vehicle Detection"],
      storageSupport: "Up to 12TB"
    }
  },

  // ============================================================
  // 4. NVR
  // ============================================================

  {
    name: "8 Channel AI NVR",
    slug: "8-channel-ai-nvr",
    sku: "HV-NVR-8CH-AI-001",
    brand: "HoneyVision",
    categorySlug: "nvr",
    subCategorySlug: "8-channel-nvr",
    productType: "physical",
    price: 7999,
    mrp: 9999,
    stock: 50,
    warranty: "2 Years",
    specifications: {
      channels: 8,
      resolution: "4K",
      ai: ["Human Detection", "Vehicle Detection"],
      storageSupport: "Up to 10TB",
      poe: true
    }
  },

  {
    name: "16 Channel 4K NVR",
    slug: "16-channel-4k-nvr",
    sku: "HV-NVR-16CH-4K-001",
    brand: "HoneyVision",
    categorySlug: "nvr",
    subCategorySlug: "16-channel-nvr",
    productType: "physical",
    price: 12999,
    mrp: 16999,
    stock: 35,
    warranty: "2 Years",
    specifications: {
      channels: 16,
      resolution: "4K",
      storageSupport: "Up to 16TB",
      poe: true
    }
  },

  {
    name: "32 Channel Enterprise NVR",
    slug: "32-channel-enterprise-nvr",
    sku: "HV-NVR-32CH-001",
    brand: "HoneyVision",
    categorySlug: "nvr",
    subCategorySlug: "32-channel-nvr",
    productType: "physical",
    price: 24999,
    mrp: 29999,
    stock: 20,
    warranty: "3 Years",
    specifications: {
      channels: 32,
      resolution: "4K",
      storageSupport: "Up to 24TB",
      enterprise: true
    }
  },

  // ============================================================
  // 5. STORAGE
  // ============================================================

  {
    name: "1TB Surveillance HDD",
    slug: "1tb-surveillance-hdd",
    sku: "HV-HDD-1TB-001",
    brand: "HoneyVision",
    categorySlug: "storage",
    subCategorySlug: "surveillance-hard-drives",
    productType: "physical",
    price: 4499,
    mrp: 5499,
    stock: 100,
    warranty: "3 Years",
    specifications: {
      capacity: "1TB",
      type: "Surveillance HDD",
      interface: "SATA"
    }
  },

  {
    name: "2TB Surveillance HDD",
    slug: "2tb-surveillance-hdd",
    sku: "HV-HDD-2TB-001",
    brand: "HoneyVision",
    categorySlug: "storage",
    subCategorySlug: "surveillance-hard-drives",
    productType: "physical",
    price: 5999,
    mrp: 7499,
    stock: 100,
    warranty: "3 Years",
    specifications: {
      capacity: "2TB",
      type: "Surveillance HDD",
      interface: "SATA"
    }
  },

  {
    name: "4TB Surveillance HDD",
    slug: "4tb-surveillance-hdd",
    sku: "HV-HDD-4TB-001",
    brand: "HoneyVision",
    categorySlug: "storage",
    subCategorySlug: "surveillance-hard-drives",
    productType: "physical",
    price: 9999,
    mrp: 11999,
    stock: 70,
    warranty: "3 Years",
    specifications: {
      capacity: "4TB",
      type: "Surveillance HDD",
      interface: "SATA"
    }
  },

  // ============================================================
  // 6. ACCESS CONTROL
  // ============================================================

  {
    name: "Fingerprint Access Control Machine",
    slug: "fingerprint-access-control-machine",
    sku: "HV-AC-FP-001",
    brand: "HoneyVision",
    categorySlug: "access-control",
    subCategorySlug: "biometric-access-control",
    productType: "physical",
    price: 5999,
    mrp: 7999,
    stock: 60,
    warranty: "1 Year",
    specifications: {
      authentication: ["Fingerprint", "Password"],
      users: 1000,
      connectivity: "TCP/IP"
    }
  },

  {
    name: "Face Recognition Access Control",
    slug: "face-recognition-access-control",
    sku: "HV-AC-FACE-001",
    brand: "HoneyVision",
    categorySlug: "access-control",
    subCategorySlug: "face-recognition",
    productType: "physical",
    price: 12999,
    mrp: 15999,
    stock: 40,
    warranty: "1 Year",
    specifications: {
      authentication: ["Face", "Fingerprint", "Card"],
      users: 3000,
      connectivity: "TCP/IP"
    }
  },

  {
    name: "RFID Card Reader",
    slug: "rfid-card-reader",
    sku: "HV-RFID-001",
    brand: "HoneyVision",
    categorySlug: "access-control",
    subCategorySlug: "rfid-readers",
    productType: "physical",
    price: 2499,
    mrp: 3499,
    stock: 100,
    warranty: "1 Year",
    specifications: {
      technology: "RFID",
      frequency: "13.56MHz"
    }
  },

  // ============================================================
  // 7. TIME ATTENDANCE
  // ============================================================

  {
    name: "Biometric Attendance Machine",
    slug: "biometric-attendance-machine",
    sku: "HV-ATT-FP-001",
    brand: "HoneyVision",
    categorySlug: "time-attendance",
    subCategorySlug: "fingerprint-attendance",
    productType: "physical",
    price: 4999,
    mrp: 6999,
    stock: 80,
    warranty: "1 Year",
    specifications: {
      authentication: "Fingerprint",
      users: 1000,
      attendanceCapacity: "100000"
    }
  },

  {
    name: "Face Attendance Terminal",
    slug: "face-attendance-terminal",
    sku: "HV-ATT-FACE-001",
    brand: "HoneyVision",
    categorySlug: "time-attendance",
    subCategorySlug: "face-attendance",
    productType: "physical",
    price: 9999,
    mrp: 12999,
    stock: 50,
    warranty: "1 Year",
    specifications: {
      authentication: "Face Recognition",
      users: 3000,
      attendanceCapacity: "200000"
    }
  },

  // ============================================================
  // 8. VIDEO DOOR PHONE
  // ============================================================

  {
    name: "7 Inch Video Door Phone",
    slug: "7-inch-video-door-phone",
    sku: "HV-VDP-7-001",
    brand: "HoneyVision",
    categorySlug: "video-door-phone",
    subCategorySlug: "indoor-monitors",
    productType: "physical",
    price: 6999,
    mrp: 8999,
    stock: 60,
    warranty: "1 Year",
    specifications: {
      display: "7 Inch",
      camera: "2MP",
      communication: "Two Way Audio"
    }
  },

  {
    name: "Smart WiFi Video Door Phone",
    slug: "smart-wifi-video-door-phone",
    sku: "HV-VDP-WIFI-001",
    brand: "HoneyVision",
    categorySlug: "video-door-phone",
    subCategorySlug: "smart-video-door-phone",
    productType: "physical",
    price: 11999,
    mrp: 14999,
    stock: 40,
    warranty: "1 Year",
    specifications: {
      connectivity: "WiFi",
      mobileApp: true,
      video: "1080P"
    }
  },

  // ============================================================
  // 9. INTRUSION ALARM
  // ============================================================

  {
    name: "Wireless Alarm System",
    slug: "wireless-alarm-system",
    sku: "HV-ALARM-WIRELESS-001",
    brand: "HoneyVision",
    categorySlug: "intrusion-alarm",
    subCategorySlug: "wireless-alarm",
    productType: "physical",
    price: 7999,
    mrp: 9999,
    stock: 50,
    warranty: "1 Year",
    specifications: {
      connectivity: "Wireless",
      sensors: 4,
      mobileAlert: true,
      siren: true
    }
  },

  {
    name: "PIR Motion Sensor",
    slug: "pir-motion-sensor",
    sku: "HV-SENSOR-PIR-001",
    brand: "HoneyVision",
    categorySlug: "intrusion-alarm",
    subCategorySlug: "motion-sensors",
    productType: "physical",
    price: 1299,
    mrp: 1799,
    stock: 200,
    warranty: "1 Year",
    specifications: {
      detectionRange: "12m",
      angle: "110°"
    }
  },

  {
    name: "Door Magnetic Sensor",
    slug: "door-magnetic-sensor",
    sku: "HV-SENSOR-DOOR-001",
    brand: "HoneyVision",
    categorySlug: "intrusion-alarm",
    subCategorySlug: "door-sensors",
    productType: "physical",
    price: 799,
    mrp: 999,
    stock: 200,
    warranty: "1 Year"
  },

  // ============================================================
  // 10. FIRE ALARM
  // ============================================================

  {
    name: "Addressable Fire Alarm Panel",
    slug: "addressable-fire-alarm-panel",
    sku: "HV-FIRE-PANEL-001",
    brand: "HoneyVision",
    categorySlug: "fire-alarm",
    subCategorySlug: "fire-alarm-panels",
    productType: "physical",
    price: 24999,
    mrp: 29999,
    stock: 20,
    warranty: "2 Years",
    specifications: {
      zones: 8,
      type: "Addressable",
      networking: true
    }
  },

  {
    name: "Smoke Detector",
    slug: "smoke-detector",
    sku: "HV-FIRE-SMOKE-001",
    brand: "HoneyVision",
    categorySlug: "fire-alarm",
    subCategorySlug: "smoke-detectors",
    productType: "physical",
    price: 999,
    mrp: 1299,
    stock: 300,
    warranty: "1 Year"
  },

  {
    name: "Manual Call Point",
    slug: "manual-call-point",
    sku: "HV-FIRE-MCP-001",
    brand: "HoneyVision",
    categorySlug: "fire-alarm",
    subCategorySlug: "manual-call-points",
    productType: "physical",
    price: 799,
    mrp: 999,
    stock: 200,
    warranty: "1 Year"
  },

  // ============================================================
  // 11. NETWORKING
  // ============================================================

  {
    name: "8 Port Gigabit Network Switch",
    slug: "8-port-gigabit-network-switch",
    sku: "HV-SWITCH-8G-001",
    brand: "HoneyVision",
    categorySlug: "networking",
    subCategorySlug: "network-switches",
    productType: "physical",
    price: 1999,
    mrp: 2499,
    stock: 100,
    warranty: "1 Year",
    specifications: {
      ports: 8,
      speed: "Gigabit",
      managed: false
    }
  },

  {
    name: "16 Port Gigabit Switch",
    slug: "16-port-gigabit-switch",
    sku: "HV-SWITCH-16G-001",
    brand: "HoneyVision",
    categorySlug: "networking",
    subCategorySlug: "network-switches",
    productType: "physical",
    price: 3999,
    mrp: 4999,
    stock: 80,
    warranty: "1 Year",
    specifications: {
      ports: 16,
      speed: "Gigabit"
    }
  },

  {
    name: "24 Port PoE Switch",
    slug: "24-port-poe-switch",
    sku: "HV-POE-24-001",
    brand: "HoneyVision",
    categorySlug: "networking",
    subCategorySlug: "poe-switches",
    productType: "physical",
    price: 8999,
    mrp: 10999,
    stock: 50,
    warranty: "2 Years",
    specifications: {
      ports: 24,
      poePower: "250W",
      speed: "Gigabit"
    }
  },

  // ============================================================
  // 12. ROUTERS
  // ============================================================

  {
    name: "Dual Band WiFi 6 Router",
    slug: "dual-band-wifi-6-router",
    sku: "HV-ROUTER-WIFI6-001",
    brand: "HoneyVision",
    categorySlug: "routers",
    subCategorySlug: "wifi-routers",
    productType: "physical",
    price: 3999,
    mrp: 4999,
    stock: 100,
    warranty: "1 Year",
    specifications: {
      wifi: "WiFi 6",
      bands: "2.4GHz + 5GHz",
      speed: "1800Mbps"
    }
  },

  {
    name: "4G LTE SIM Router",
    slug: "4g-lte-sim-router",
    sku: "HV-ROUTER-4G-001",
    brand: "HoneyVision",
    categorySlug: "routers",
    subCategorySlug: "4g-routers",
    productType: "physical",
    price: 3499,
    mrp: 4499,
    stock: 80,
    warranty: "1 Year",
    specifications: {
      network: "4G LTE",
      sim: "Nano SIM",
      wifi: "Dual Band"
    }
  },

  // ============================================================
  // 13. WIFI & WIRELESS
  // ============================================================

  {
    name: "Indoor WiFi Access Point",
    slug: "indoor-wifi-access-point",
    sku: "HV-WIFI-AP-001",
    brand: "HoneyVision",
    categorySlug: "wifi-wireless",
    subCategorySlug: "wifi-access-points",
    productType: "physical",
    price: 2999,
    mrp: 3999,
    stock: 100,
    warranty: "1 Year",
    specifications: {
      wifi: "WiFi 6",
      speed: "1800Mbps",
      poe: true
    }
  },

  {
    name: "Outdoor WiFi Access Point",
    slug: "outdoor-wifi-access-point",
    sku: "HV-WIFI-OUTDOOR-001",
    brand: "HoneyVision",
    categorySlug: "wifi-wireless",
    subCategorySlug: "outdoor-access-points",
    productType: "physical",
    price: 4999,
    mrp: 5999,
    stock: 60,
    warranty: "1 Year",
    specifications: {
      wifi: "WiFi 6",
      weatherProtection: "IP67",
      range: "300m"
    }
  },

  // ============================================================
  // 14. FIBER OPTICS
  // ============================================================

  {
    name: "Single Mode Fiber Cable 1KM",
    slug: "single-mode-fiber-cable-1km",
    sku: "HV-FIBER-SM-1KM",
    brand: "HoneyVision",
    categorySlug: "fiber-optics",
    subCategorySlug: "fiber-cables",
    productType: "physical",
    price: 5999,
    mrp: 7499,
    stock: 50,
    warranty: "1 Year",
    specifications: {
      type: "Single Mode",
      length: "1KM"
    }
  },

  {
    name: "Gigabit SFP Module",
    slug: "gigabit-sfp-module",
    sku: "HV-SFP-1G-001",
    brand: "HoneyVision",
    categorySlug: "fiber-optics",
    subCategorySlug: "sfp-modules",
    productType: "physical",
    price: 1499,
    mrp: 1999,
    stock: 150,
    warranty: "1 Year",
    specifications: {
      speed: "1Gbps",
      connector: "LC"
    }
  },

  // ============================================================
  // 15. SERVER
  // ============================================================

  {
    name: "Tower Server Entry",
    slug: "tower-server-entry",
    sku: "HV-SERVER-TOWER-001",
    brand: "HoneyVision",
    categorySlug: "servers",
    subCategorySlug: "tower-servers",
    productType: "physical",
    price: 69999,
    mrp: 79999,
    stock: 10,
    warranty: "3 Years",
    specifications: {
      processor: "Intel Xeon",
      ram: "16GB ECC",
      storage: "1TB SSD"
    }
  },

  {
    name: "Rack Server Enterprise",
    slug: "rack-server-enterprise",
    sku: "HV-SERVER-RACK-001",
    brand: "HoneyVision",
    categorySlug: "servers",
    subCategorySlug: "rack-servers",
    productType: "physical",
    price: 129999,
    mrp: 149999,
    stock: 5,
    warranty: "3 Years",
    specifications: {
      processor: "Intel Xeon",
      ram: "32GB ECC",
      storage: "2TB SSD",
      rack: "2U"
    }
  },

  // ============================================================
  // 16. COMPUTERS
  // ============================================================

  {
    name: "Business Desktop Computer",
    slug: "business-desktop-computer",
    sku: "HV-DESKTOP-BUSINESS-001",
    brand: "HoneyVision",
    categorySlug: "computers",
    subCategorySlug: "desktop-computers",
    productType: "physical",
    price: 42999,
    mrp: 49999,
    stock: 30,
    warranty: "3 Years",
    specifications: {
      processor: "Intel Core i5",
      ram: "16GB",
      storage: "512GB SSD"
    }
  },

  {
    name: "Mini PC",
    slug: "honeyvision-mini-pc",
    sku: "HV-MINIPC-001",
    brand: "HoneyVision",
    categorySlug: "computers",
    subCategorySlug: "mini-pc",
    productType: "physical",
    price: 29999,
    mrp: 34999,
    stock: 40,
    warranty: "2 Years",
    specifications: {
      processor: "Intel Core i5",
      ram: "16GB",
      storage: "512GB SSD"
    }
  },

  // ============================================================
  // 17. LAPTOPS
  // ============================================================

  {
    name: "Business Laptop Core i5",
    slug: "business-laptop-core-i5",
    sku: "HV-LAPTOP-I5-001",
    brand: "HoneyVision",
    categorySlug: "laptops",
    subCategorySlug: "business-laptops",
    productType: "physical",
    price: 54999,
    mrp: 64999,
    stock: 30,
    warranty: "2 Years",
    specifications: {
      processor: "Intel Core i5",
      ram: "16GB",
      storage: "512GB SSD",
      display: "15.6 Inch"
    }
  },

  {
    name: "Professional Laptop Core i7",
    slug: "professional-laptop-core-i7",
    sku: "HV-LAPTOP-I7-001",
    brand: "HoneyVision",
    categorySlug: "laptops",
    subCategorySlug: "professional-laptops",
    productType: "physical",
    price: 74999,
    mrp: 84999,
    stock: 20,
    warranty: "2 Years",
    specifications: {
      processor: "Intel Core i7",
      ram: "16GB",
      storage: "1TB SSD",
      display: "15.6 Inch"
    }
  },

  // ============================================================
  // 18. MONITORS & DISPLAYS
  // ============================================================

  {
    name: "24 Inch Full HD Monitor",
    slug: "24-inch-full-hd-monitor",
    sku: "HV-MONITOR-24-001",
    brand: "HoneyVision",
    categorySlug: "monitors-displays",
    subCategorySlug: "computer-monitors",
    productType: "physical",
    price: 7999,
    mrp: 9999,
    stock: 80,
    warranty: "3 Years",
    specifications: {
      size: "24 Inch",
      resolution: "1920x1080",
      refreshRate: "75Hz"
    }
  },

  {
    name: "27 Inch 4K Professional Monitor",
    slug: "27-inch-4k-professional-monitor",
    sku: "HV-MONITOR-27-4K-001",
    brand: "HoneyVision",
    categorySlug: "monitors-displays",
    subCategorySlug: "professional-monitors",
    productType: "physical",
    price: 24999,
    mrp: 29999,
    stock: 30,
    warranty: "3 Years",
    specifications: {
      size: "27 Inch",
      resolution: "4K UHD",
      refreshRate: "60Hz"
    }
  },

  // ============================================================
  // 19. LED / DIGITAL SIGNAGE
  // ============================================================

  {
    name: "43 Inch Commercial Display",
    slug: "43-inch-commercial-display",
    sku: "HV-DISPLAY-43-001",
    brand: "HoneyVision",
    categorySlug: "digital-signage",
    subCategorySlug: "commercial-displays",
    productType: "physical",
    price: 39999,
    mrp: 44999,
    stock: 20,
    warranty: "3 Years",
    specifications: {
      size: "43 Inch",
      resolution: "4K",
      usage: "Commercial"
    }
  },

  {
    name: "55 Inch Digital Signage Display",
    slug: "55-inch-digital-signage-display",
    sku: "HV-DISPLAY-55-001",
    brand: "HoneyVision",
    categorySlug: "digital-signage",
    subCategorySlug: "digital-signage",
    productType: "physical",
    price: 59999,
    mrp: 69999,
    stock: 15,
    warranty: "3 Years",
    specifications: {
      size: "55 Inch",
      resolution: "4K",
      signage: true
    }
  },

  // ============================================================
  // 20. PROJECTORS
  // ============================================================

  {
    name: "Full HD Business Projector",
    slug: "full-hd-business-projector",
    sku: "HV-PROJECTOR-FHD-001",
    brand: "HoneyVision",
    categorySlug: "projectors",
    subCategorySlug: "business-projectors",
    productType: "physical",
    price: 29999,
    mrp: 34999,
    stock: 25,
    warranty: "2 Years",
    specifications: {
      resolution: "1920x1080",
      brightness: "4000 Lumens",
      connectivity: ["HDMI", "USB"]
    }
  },

  {
    name: "4K Conference Projector",
    slug: "4k-conference-projector",
    sku: "HV-PROJECTOR-4K-001",
    brand: "HoneyVision",
    categorySlug: "projectors",
    subCategorySlug: "4k-projectors",
    productType: "physical",
    price: 59999,
    mrp: 69999,
    stock: 15,
    warranty: "2 Years",
    specifications: {
      resolution: "4K",
      brightness: "5000 Lumens"
    }
  },

  // ============================================================
  // 21. AUDIO
  // ============================================================

  {
    name: "Ceiling Speaker 6W",
    slug: "ceiling-speaker-6w",
    sku: "HV-AUDIO-CEILING-6W",
    brand: "HoneyVision",
    categorySlug: "audio-systems",
    subCategorySlug: "ceiling-speakers",
    productType: "physical",
    price: 999,
    mrp: 1299,
    stock: 200,
    warranty: "1 Year",
    specifications: {
      power: "6W",
      type: "Ceiling Speaker"
    }
  },

  {
    name: "PA Amplifier 120W",
    slug: "pa-amplifier-120w",
    sku: "HV-AMP-120W-001",
    brand: "HoneyVision",
    categorySlug: "audio-systems",
    subCategorySlug: "amplifiers",
    productType: "physical",
    price: 6999,
    mrp: 8999,
    stock: 50,
    warranty: "1 Year",
    specifications: {
      power: "120W",
      inputs: ["Mic", "AUX", "USB"]
    }
  },

  {
    name: "Wireless Conference Microphone",
    slug: "wireless-conference-microphone",
    sku: "HV-MIC-WIRELESS-001",
    brand: "HoneyVision",
    categorySlug: "audio-systems",
    subCategorySlug: "microphones",
    productType: "physical",
    price: 4999,
    mrp: 6499,
    stock: 60,
    warranty: "1 Year"
  },

  // ============================================================
  // 22. VIDEO CONFERENCING
  // ============================================================

  {
    name: "4K Conference Camera",
    slug: "4k-conference-camera",
    sku: "HV-CONF-CAM-4K-001",
    brand: "HoneyVision",
    categorySlug: "video-conferencing",
    subCategorySlug: "conference-cameras",
    productType: "physical",
    price: 19999,
    mrp: 24999,
    stock: 40,
    warranty: "2 Years",
    specifications: {
      resolution: "4K",
      fieldOfView: "120°",
      microphone: true,
      autoFraming: true
    }
  },

  {
    name: "All-in-One Video Conference Bar",
    slug: "all-in-one-video-conference-bar",
    sku: "HV-CONF-BAR-001",
    brand: "HoneyVision",
    categorySlug: "video-conferencing",
    subCategorySlug: "conference-bars",
    productType: "physical",
    price: 39999,
    mrp: 49999,
    stock: 25,
    warranty: "2 Years",
    specifications: {
      camera: "4K",
      microphone: "Array",
      speaker: true,
      autoFraming: true
    }
  },

  // ============================================================
  // 23. UPS & POWER
  // ============================================================

  {
    name: "1KVA Online UPS",
    slug: "1kva-online-ups",
    sku: "HV-UPS-1KVA-001",
    brand: "HoneyVision",
    categorySlug: "ups-power",
    subCategorySlug: "online-ups",
    productType: "physical",
    price: 11999,
    mrp: 14999,
    stock: 50,
    warranty: "2 Years",
    specifications: {
      capacity: "1KVA",
      type: "Online UPS"
    }
  },

  {
    name: "2KVA Online UPS",
    slug: "2kva-online-ups",
    sku: "HV-UPS-2KVA-001",
    brand: "HoneyVision",
    categorySlug: "ups-power",
    subCategorySlug: "online-ups",
    productType: "physical",
    price: 19999,
    mrp: 24999,
    stock: 30,
    warranty: "2 Years",
    specifications: {
      capacity: "2KVA",
      type: "Online UPS"
    }
  },

  {
    name: "CCTV Power Supply 12V",
    slug: "cctv-power-supply-12v",
    sku: "HV-PSU-12V-001",
    brand: "HoneyVision",
    categorySlug: "ups-power",
    subCategorySlug: "cctv-power-supplies",
    productType: "physical",
    price: 999,
    mrp: 1299,
    stock: 200,
    warranty: "1 Year",
    specifications: {
      output: "12V",
      application: "CCTV"
    }
  },

  // ============================================================
  // 24. SMART HOME & IOT
  // ============================================================

  {
    name: "Smart WiFi Door Lock",
    slug: "smart-wifi-door-lock",
    sku: "HV-SMART-LOCK-001",
    brand: "HoneyVision",
    categorySlug: "smart-home-iot",
    subCategorySlug: "smart-locks",
    productType: "physical",
    price: 8999,
    mrp: 11999,
    stock: 50,
    warranty: "1 Year",
    specifications: {
      unlocking: [
        "Fingerprint",
        "PIN",
        "Mobile App",
        "Key"
      ],
      connectivity: "WiFi"
    }
  },

  {
    name: "Smart WiFi Switch",
    slug: "smart-wifi-switch",
    sku: "HV-SMART-SWITCH-001",
    brand: "HoneyVision",
    categorySlug: "smart-home-iot",
    subCategorySlug: "smart-switches",
    productType: "physical",
    price: 1499,
    mrp: 1999,
    stock: 200,
    warranty: "1 Year",
    specifications: {
      connectivity: "WiFi",
      voiceControl: true,
      mobileApp: true
    }
  },

  {
    name: "Smart Motion Sensor",
    slug: "smart-motion-sensor",
    sku: "HV-SMART-PIR-001",
    brand: "HoneyVision",
    categorySlug: "smart-home-iot",
    subCategorySlug: "smart-sensors",
    productType: "physical",
    price: 1299,
    mrp: 1699,
    stock: 150,
    warranty: "1 Year",
    specifications: {
      connectivity: "WiFi",
      detection: "Motion"
    }
  },

  // ============================================================
  // 25. DRONES
  // ============================================================

  {
    name: "Professional 4K Camera Drone",
    slug: "professional-4k-camera-drone",
    sku: "HV-DRONE-4K-001",
    brand: "HoneyVision",
    categorySlug: "drones",
    subCategorySlug: "camera-drones",
    productType: "physical",
    price: 79999,
    mrp: 89999,
    stock: 10,
    warranty: "1 Year",
    specifications: {
      camera: "4K",
      flightTime: "35 Minutes",
      range: "5KM",
      gps: true
    }
  },

  {
    name: "Agriculture Survey Drone",
    slug: "agriculture-survey-drone",
    sku: "HV-DRONE-AGRI-001",
    brand: "HoneyVision",
    categorySlug: "drones",
    subCategorySlug: "agriculture-drones",
    productType: "physical",
    price: 149999,
    mrp: 179999,
    stock: 5,
    warranty: "1 Year",
    specifications: {
      application: "Agriculture",
      gps: true,
      multispectral: true
    }
  },

  {
    name: "Industrial Inspection Drone",
    slug: "industrial-inspection-drone",
    sku: "HV-DRONE-IND-001",
    brand: "HoneyVision",
    categorySlug: "drones",
    subCategorySlug: "industrial-drones",
    productType: "physical",
    price: 199999,
    mrp: 229999,
    stock: 5,
    warranty: "1 Year",
    specifications: {
      application: "Industrial Inspection",
      camera: "4K",
      thermal: true,
      gps: true
    }
  },

  // ============================================================
  // 26. AI & SOFTWARE
  // ============================================================

  {
    name: "AI Video Analytics Software",
    slug: "ai-video-analytics-software",
    sku: "HV-AI-VMS-001",
    brand: "HoneyVision",
    categorySlug: "ai-software",
    subCategorySlug: "video-analytics",
    productType: "software",
    price: 24999,
    mrp: 29999,
    stock: 999,
    warranty: "1 Year",
    specifications: {
      features: [
        "Face Recognition",
        "Vehicle Detection",
        "Intrusion Detection",
        "Fire Detection"
      ],
      license: "Annual"
    }
  },

  {
    name: "Face Recognition AI License",
    slug: "face-recognition-ai-license",
    sku: "HV-AI-FACE-001",
    brand: "HoneyVision",
    categorySlug: "ai-software",
    subCategorySlug: "face-recognition",
    productType: "subscription",
    price: 9999,
    mrp: 12999,
    stock: 999,
    warranty: "1 Year",
    specifications: {
      license: "1 Year",
      recognition: "Face Recognition"
    }
  },

  {
    name: "Vehicle Detection AI License",
    slug: "vehicle-detection-ai-license",
    sku: "HV-AI-VEHICLE-001",
    brand: "HoneyVision",
    categorySlug: "ai-software",
    subCategorySlug: "vehicle-detection",
    productType: "subscription",
    price: 9999,
    mrp: 12999,
    stock: 999,
    warranty: "1 Year",
    specifications: {
      license: "1 Year",
      detection: [
        "Car",
        "Truck",
        "Bus",
        "Motorcycle"
      ]
    }
  },

  {
    name: "Cloud Video Management Subscription",
    slug: "cloud-video-management-subscription",
    sku: "HV-CLOUD-VMS-001",
    brand: "HoneyVision",
    categorySlug: "ai-software",
    subCategorySlug: "cloud-vms",
    productType: "subscription",
    price: 4999,
    mrp: 5999,
    stock: 999,
    warranty: "1 Year",
    specifications: {
      storage: "1TB",
      duration: "12 Months",
      mobileApp: true,
      remoteMonitoring: true
    }
  },

  // ============================================================
  // 27. CABLES & ACCESSORIES
  // ============================================================

  {
    name: "Cat6 Network Cable 305m",
    slug: "cat6-network-cable-305m",
    sku: "HV-CAT6-305M-001",
    brand: "HoneyVision",
    categorySlug: "cables-accessories",
    subCategorySlug: "network-cables",
    productType: "physical",
    price: 6999,
    mrp: 8499,
    stock: 100,
    warranty: "1 Year",
    specifications: {
      category: "Cat6",
      length: "305m",
      conductor: "Copper"
    }
  },

  {
    name: "HDMI Cable 10m",
    slug: "hdmi-cable-10m",
    sku: "HV-HDMI-10M-001",
    brand: "HoneyVision",
    categorySlug: "cables-accessories",
    subCategorySlug: "hdmi-cables",
    productType: "physical",
    price: 999,
    mrp: 1299,
    stock: 200,
    warranty: "1 Year",
    specifications: {
      length: "10m",
      resolution: "4K"
    }
  },

  {
    name: "USB Type-C Hub",
    slug: "usb-type-c-hub",
    sku: "HV-USB-HUB-001",
    brand: "HoneyVision",
    categorySlug: "cables-accessories",
    subCategorySlug: "usb-accessories",
    productType: "physical",
    price: 1499,
    mrp: 1999,
    stock: 150,
    warranty: "1 Year",
    specifications: {
      ports: [
        "USB 3.0",
        "HDMI",
        "Type-C",
        "SD Card"
      ]
    }
  }

];

export default productData;
import { categories } from './categoryData.js';
import { productData } from './productData.js';

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const categorySlugAliases = {
  'cctv-surveillance': 'cctv-surveillance',
  'ip-cameras': 'cctv-surveillance',
  storage: 'storage-hard-drives',
  'fiber-optics': 'cabling-accessories',
  'video-conferencing': 'video-conferencing',
  'access-control': 'access-control',
  dvr: 'dvr-nvr-recording',
  nvr: 'dvr-nvr-recording',
  networking: 'networking-products',
  routers: 'networking-products',
  'wifi-wireless': 'networking-products',
  computers: 'computers-laptops',
  laptops: 'computers-laptops',
  'monitors-displays': 'computers-laptops',
  'digital-signage': 'led-displays-signage',
  'ups-power': 'ups-power-solutions',
  'smart-home-iot': 'smart-home-automation',
  'video-door-phone': 'video-door-phones',
  'time-attendance': 'access-control',
  'intrusion-alarm': 'alarm-safety-systems',
  'fire-alarm': 'alarm-safety-systems',
  'audio-systems': 'audio-visual',
  projectors: 'office-equipment',
  'cables-accessories': 'cabling-accessories',
  'smart-agriculture': 'smart-agriculture',
  'ai-software': 'cloud-software',
  servers: 'servers-data-center',
  drones: 'drones-accessories',
  'ups-power-solutions': 'ups-power-solutions',
};

const subCategorySlugAliases = {
  'ai-ip-cameras': 'ip-cameras',
  'ip-bullet-cameras': 'bullet-cameras',
  'ip-dome-cameras': 'dome-cameras',
  'four-channel-dvr': 'dvr',
  '4-channel-dvr': 'dvr',
  '8-channel-dvr': 'dvr',
  '16-channel-dvr': 'dvr',
  '8-channel-nvr': 'nvr',
  '16-channel-nvr': 'nvr',
  '32-channel-nvr': 'nvr',
  'surveillance-hard-drives': 'surveillance-hdd',
  'biometric-access-control': 'biometric-access-controllers',
  'face-attendance': 'face-recognition-attendance',
  'face-recognition': 'face-recognition-attendance',
  'smart-video-door-phone': 'smart-video-doorbells',
  'wireless-alarm': 'wireless-alarm-systems',
  'motion-sensors': 'pir-motion-sensors',
  'door-sensors': 'door-magnetic-sensors',
  'wifi-routers': 'routers',
  '4g-routers': 'routers',
  'wifi-access-points': 'wi-fi-access-points',
  'outdoor-access-points': 'outdoor-wi-fi',
  'fiber-cables': 'fiber-optic-cable',
  'network-cables': 'cat6-network-cable',
  'usb-accessories': 'usb-cables',
  'sfp-modules': 'fiber-optic-cable',
  'desktop-computers': 'business-desktops',
  'mini-pc': 'mini-pcs',
  'professional-monitors': 'computer-monitors',
  'digital-signage': 'digital-signage-displays',
  'business-projectors': 'office-projectors',
  '4k-projectors': 'office-projectors',
  amplifiers: 'power-amplifiers',
  microphones: 'wireless-microphones',
  'conference-cameras': 'conference-cameras',
  'conference-bars': 'conference-bars',
  'cctv-power-supplies': 'power-distribution-units',
  'smart-locks': 'smart-door-locks',
  'smart-sensors': 'smart-motion-sensors',
  'video-analytics': 'ai-video-analytics-software',
  'cloud-vms': 'video-management-software',
  'vehicle-detection': 'ai-video-analytics-software',
};

const resolveCategorySlug = (rawSlug) => categorySlugAliases[rawSlug] || rawSlug;
const resolveSubCategorySlug = (rawSlug) => subCategorySlugAliases[rawSlug] || rawSlug;

const missing = new Map();
for (const product of productData) {
  const targetCategory = resolveCategorySlug(product.categorySlug);
  const category = categories.find((item) => item.slug === targetCategory);

  if (!category) {
    if (!missing.has(targetCategory)) missing.set(targetCategory, new Set());
    missing.get(targetCategory).add('CATEGORY NOT FOUND');
    continue;
  }

  if (!product.subCategorySlug) continue;

  const targetSubCategory = resolveSubCategorySlug(product.subCategorySlug);
  const available = category.subcategories.map(slugify);
  if (!available.includes(targetSubCategory)) {
    if (!missing.has(targetCategory)) missing.set(targetCategory, new Set());
    missing.get(targetCategory).add(`${product.subCategorySlug} -> ${targetSubCategory}`);
  }
}

for (const [category, missingSubs] of missing) {
  console.log(`=== ${category}`);
  for (const sub of [...missingSubs].sort()) {
    console.log('  ', sub);
  }
}
console.log('TOTAL MISSING', [...missing.values()].reduce((count, set) => count + set.size, 0));

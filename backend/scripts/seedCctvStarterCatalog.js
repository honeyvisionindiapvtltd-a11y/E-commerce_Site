import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dbConfig from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

dotenv.config();

const source = (url) => ({ manufacturerSource: url });
const products = [
  ['Analog / HD Cameras', 'CP Plus', 'CP-URC-TC24PL3C', '2MP Analog HD Dome Camera', 'Dome', 'HD', '2MP', 2, 'https://www.cpplusworld.com/'],
  ['Analog / HD Cameras', 'Hikvision', 'DS-2CE76D0T-ITPFS', '2MP TurboHD Analog Dome Camera', 'Dome', 'HD', '2MP', 2, 'https://www.hikvision.com/en/products/analog-cameras/turbohd-camera/'],
  ['Analog / HD Cameras', 'Dahua', 'HAC-HDW1200TLP-A', '2MP HDCVI IR Eyeball Camera', 'Dome', 'HD', '2MP', 2, 'https://www.dahuasecurity.com/products/All-Products/HDCVI-Cameras/Lite-Series/2MP'],

  ['IP / Network Cameras', 'Hikvision', 'DS-2CD2347G2-LU', '4MP ColorVu IP Turret Camera', 'Turret', 'IP', '4MP', 4, 'https://www.hikvision.com/en/products/IP-Products/Network-Cameras/ColorVu-Series/'],
  ['IP / Network Cameras', 'Dahua', 'IPC-HDW2431T-AS-S2', '4MP WizSense IP Eyeball Camera', 'Turret', 'IP', '4MP', 4, 'https://www.dahuasecurity.com/products/All-Products/Network-Cameras/WizSense-Series'],
  ['IP / Network Cameras', 'TP-Link', 'VIGI C340', '4MP VIGI Outdoor Full-Color IP Bullet Camera', 'Bullet', 'IP', '4MP', 4, 'https://www.tp-link.com/en/business-networking/vigi-network-camera/vigi-c340/'],

  ['4G / SIM Cameras', 'Reolink', 'Go Plus', '4MP 4G LTE Battery Camera', 'Bullet', '4G', '4MP', 4, 'https://reolink.com/product/reolink-go-plus/'],
  ['4G / SIM Cameras', 'Reolink', 'Go PT Plus', '2K 4G LTE Pan-Tilt Battery Camera', 'PTZ', '4G', '2K', 4, 'https://reolink.com/product/reolink-go-pt-plus/'],
  ['4G / SIM Cameras', 'EZVIZ', 'EB8 4G', '3MP 4G LTE Outdoor Pan-Tilt Camera', 'PTZ', '4G', '3MP', 3, 'https://www.ezviz.com/product/EB8-4G/'],

  ['AI & Smart Cameras', 'Hikvision', 'DS-2CD2386G2-I(U)', '8MP AcuSense Smart IP Turret Camera', 'Turret', 'IP', '8MP / 4K', 8, 'https://www.hikvision.com/en/products/IP-Products/Network-Cameras/AcuSense-Series/'],
  ['AI & Smart Cameras', 'Dahua', 'IPC-HDW5442T-ASE', '4MP WizMind AI IP Eyeball Camera', 'Turret', 'IP', '4MP', 4, 'https://www.dahuasecurity.com/products/All-Products/Network-Cameras/WizMind-Series'],
  ['AI & Smart Cameras', 'Axis', 'P3265-LV', '2MP Intelligent Lightfinder IP Dome Camera', 'Dome', 'IP', '2MP', 2, 'https://www.axis.com/products/axis-p3265-lv'],

  ['PTZ & Long Range', 'Hikvision', 'DS-2DE4A425IWG-E', '4MP 25x IR Speed Dome PTZ Camera', 'Speed Dome', 'IP', '4MP', 4, 'https://www.hikvision.com/en/products/IP-Products/PTZ-Cameras/'],
  ['PTZ & Long Range', 'Dahua', 'SD49425XB-HNR', '4MP 25x Starlight IR PTZ Camera', 'PTZ', 'IP', '4MP', 4, 'https://www.dahuasecurity.com/products/All-Products/Network-Cameras/PTZ-Cameras'],
  ['PTZ & Long Range', 'Axis', 'Q6075-E', '2MP 40x Outdoor PTZ Network Camera', 'PTZ', 'IP', '2MP', 2, 'https://www.axis.com/products/axis-q6075-e'],

  ['Night Vision', 'Hikvision', 'DS-2CD2347G2-LSU/SL', '4MP ColorVu Full-Color IP Turret Camera', 'Turret', 'IP', '4MP', 4, 'https://www.hikvision.com/en/products/IP-Products/Network-Cameras/ColorVu-Series/'],
  ['Night Vision', 'Dahua', 'IPC-HFW5442E-ZE', '4MP Full-Color Starlight IP Bullet Camera', 'Bullet', 'IP', '4MP', 4, 'https://www.dahuasecurity.com/products/All-Products/Network-Cameras/WizMind-Series'],
  ['Night Vision', 'TP-Link', 'VIGI C540S', '4MP ColorPro Night Vision PTZ Camera', 'PTZ', 'IP', '4MP', 4, 'https://www.tp-link.com/en/business-networking/vigi-network-camera/vigi-c540s/'],

  ['Specialized Cameras', 'Hikvision', 'DS-2TD1217B-6/PA', 'Thermal Network Turret Camera', 'Thermal', 'IP', 'Thermal', 0, 'https://www.hikvision.com/en/products/Thermal-Products/Thermal-Network-Cameras/'],
  ['Specialized Cameras', 'Hikvision', 'iDS-2CD7A46G0/P-IZHS(Y)', '4MP DeepinView ANPR IP Bullet Camera', 'ANPR / LPR', 'IP', '4MP', 4, 'https://www.hikvision.com/en/products/IP-Products/Network-Cameras/DeepinView-Series/'],
  ['Specialized Cameras', 'Axis', 'M3058-PLVE', '12MP Panoramic Fisheye Network Camera', 'Fisheye', 'IP', '12MP+', 12, 'https://www.axis.com/products/axis-m3058-plve'],

  ['Solar & Battery Cameras', 'Hikvision', 'DS-2XS2T47G1-IZS/4G/C0', '4MP Solar-Powered 4G Bullet Camera', 'Bullet', '4G', '4MP', 4, 'https://www.hikvision.com/en/products/IP-Products/Network-Cameras/Solar-Powered-Series/'],
  ['Solar & Battery Cameras', 'Reolink', 'Argus 3 Pro', '4MP Wire-Free Battery Security Camera', 'Bullet', 'Wireless', '4MP', 4, 'https://reolink.com/product/argus-3-pro/'],
  ['Solar & Battery Cameras', 'EZVIZ', 'EB3', '2K Wire-Free Battery Camera', 'Bullet', 'Wireless', '2K', 3, 'https://www.ezviz.com/product/EB3/'],

  ['Application-Based Cameras', 'Axis', 'M3085-V', '2MP Indoor Dome Network Camera for Offices and Retail', 'Dome', 'IP', '2MP', 2, 'https://www.axis.com/products/axis-m3085-v'],
  ['Application-Based Cameras', 'Hikvision', 'DS-2CD2686G2-IZS', '8MP AcuSense Outdoor Varifocal Bullet Camera', 'Bullet', 'IP', '8MP / 4K', 8, 'https://www.hikvision.com/en/products/IP-Products/Network-Cameras/AcuSense-Series/'],
  ['Application-Based Cameras', 'TP-Link', 'Tapo C520WS', '4MP Outdoor Pan-Tilt Security Wi-Fi Camera', 'PTZ', 'Wi-Fi', '4MP', 4, 'https://www.tp-link.com/en/home-networking/cloud-camera/tapo-c520ws/'],
];

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const seedCctvStarterCatalog = async () => {
  await mongoose.connect(dbConfig.mongoUri);
  const parent = await Category.findOne({ slug: 'cctv-cameras', isActive: true }).select('_id');
  if (!parent) throw new Error('Existing CCTV Cameras category was not found.');

  const categoryDocs = await Category.find({ parentCategory: parent._id, isActive: true }).select('_id slug');
  const categories = new Map(categoryDocs.map((category) => [category.slug, category._id]));
  let created = 0;
  let skipped = 0;

  for (let index = 0; index < products.length; index += 1) {
    const [subcategoryName, brand, model, name, cameraType, technology, resolution, megapixels, manufacturerSource] = products[index];
    const subcategorySlug = subcategoryName === 'Night Vision' ? 'night-vision-cameras' : slugify(subcategoryName);
    const subCategory = categories.get(subcategorySlug);
    if (!subCategory) throw new Error(`Missing CCTV subcategory: ${subcategoryName}`);

    const sku = `HV-CCTV-${String(index + 1).padStart(4, '0')}`;
    const slug = slugify(`${brand}-${name}-${model}`);
    const duplicate = await Product.findOne({ $or: [{ sku }, { model }, { slug }, { name }] }).select('_id');
    if (duplicate) {
      skipped += 1;
      continue;
    }

    await Product.create({
      name,
      slug,
      sku,
      brand,
      model,
      category: parent._id,
      subCategory,
      productType: 'physical',
      shortDescription: `${brand} ${model} ${cameraType} surveillance camera.`,
      description: `${name}. Product information is based on the manufacturer's published product page; verify commercial availability before publishing.`,
      price: 0,
      mrp: 0,
      stock: 0,
      gstPercentage: 18,
      warranty: 'Verify with supplier',
      images: [],
      thumbnail: '',
      specifications: source(manufacturerSource),
      cameraType,
      technology,
      resolution,
      megapixels: megapixels || null,
      isActive: true,
      featured: false,
      bestSeller: false,
      newArrival: false,
      recommended: false,
      installationAvailable: false,
      installationPrice: 0,
      tags: ['cctv', brand.toLowerCase(), cameraType.toLowerCase()],
    });
    created += 1;
    console.log(`Created ${sku}: ${name}`);
  }

  console.log(`CCTV starter catalog complete. Created: ${created}; skipped: ${skipped}. Commercial fields remain zero/unverified by design.`);
  await mongoose.disconnect();
};

seedCctvStarterCatalog().catch(async (error) => {
  console.error('CCTV starter catalog failed:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});

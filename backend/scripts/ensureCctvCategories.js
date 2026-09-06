import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dbConfig from '../config/db.js';
import Category from '../models/Category.js';

dotenv.config();

const cctvGroups = [
  ['Analog / HD Cameras', 'analog-hd-cameras', 'Dome, Bullet, Turret and PTZ analog or HD cameras'],
  ['IP / Network Cameras', 'ip-network-cameras', 'IP Dome, IP Bullet, IP Turret, IP PTZ and PoE cameras'],
  ['4G / SIM Cameras', '4g-sim-cameras', '4G, 4G PTZ and 4G Solar cameras'],
  ['AI & Smart Cameras', 'ai-smart-cameras', 'Human detection, face recognition, people counting and intrusion detection'],
  ['PTZ & Long Range', 'ptz-long-range', 'PTZ, Speed Dome, Long Range and Laser PTZ cameras'],
  ['Night Vision', 'night-vision-cameras', 'IR, Color Night Vision, Full Color and Starlight cameras'],
  ['Specialized Cameras', 'specialized-cameras', 'Thermal, ANPR, Fisheye, Panoramic, Multi-Sensor and Explosion-Proof cameras'],
  ['Solar & Battery Cameras', 'solar-battery-cameras', 'Solar, Battery and Solar + 4G cameras'],
  ['Application-Based Cameras', 'application-based-cameras', 'Home, Office, Retail, Warehouse, Industrial, ATM, Elevator and Traffic cameras'],
];

const ensureCctvCategories = async () => {
  await mongoose.connect(dbConfig.mongoUri);
  const parent = await Category.findOneAndUpdate(
    { slug: 'cctv-cameras' },
    { $set: { name: 'CCTV Cameras', description: 'CCTV Cameras products and solutions', isActive: true } },
    { new: true }
  );

  if (!parent) throw new Error('Existing CCTV Cameras category was not found; no categories were changed.');

  for (let index = 0; index < cctvGroups.length; index += 1) {
    const [name, slug, description] = cctvGroups[index];
    await Category.findOneAndUpdate(
      { slug },
      { $set: { name, description, parentCategory: parent._id, sortOrder: 100 + index, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Ensured CCTV category: ${name}`);
  }

  console.log(`Ensured ${cctvGroups.length} CCTV browsing groups under CCTV Cameras.`);
  await mongoose.disconnect();
};

ensureCctvCategories().catch(async (error) => {
  console.error('CCTV category setup failed:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});

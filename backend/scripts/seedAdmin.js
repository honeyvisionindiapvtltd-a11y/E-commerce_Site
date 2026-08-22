import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dbConfig from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME || 'Administrator';
const adminPhone = process.env.ADMIN_PHONE || '9999999999';

export async function seedAdmin() {
  if (!adminEmail || !adminPassword) {
    console.log('ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping admin seeding.');
    return;
  }

  const ownsConnection = mongoose.connection.readyState !== 1;

  try {
    if (ownsConnection) {
      await mongoose.connect(dbConfig.mongoUri, { serverSelectionTimeoutMS: 10000 });
    }
    console.log('Connected to MongoDB for seeding admin');

    const existing = await User.findOne({ email: String(adminEmail).toLowerCase() }).exec();
    if (existing) {
      existing.name = existing.name || adminName;
      existing.phone = existing.phone || adminPhone;
      existing.role = 'admin';
      existing.status = 'Active';
      existing.setPassword(adminPassword);
      await existing.save();
      console.log(`Updated admin credentials for ${adminEmail}.`);
      return;
    }

    const user = new User({
      name: adminName,
      email: String(adminEmail).toLowerCase(),
      phone: adminPhone,
      role: 'admin',
      status: 'Active',
      profile: { fullName: adminName, email: String(adminEmail).toLowerCase(), phone: adminPhone, memberSince: new Date().getFullYear().toString() },
    });

    user.setPassword(adminPassword);
    await user.save();

    console.log(`Created admin user ${adminEmail}`);
  } catch (err) {
    console.error('Failed to seed admin user:', err.message || err);
    throw err;
  } finally {
    if (ownsConnection) {
      try { await mongoose.disconnect(); } catch {}
    }
  }
}

// Auto-run when executed directly
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  seedAdmin().then(() => process.exit(0)).catch(() => process.exit(1));
}

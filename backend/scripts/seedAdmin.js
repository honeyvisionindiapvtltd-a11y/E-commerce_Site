import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { connectDB, getDB } from '../db.js';

dotenv.config();

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME || 'Admin';
const adminPhone = process.env.ADMIN_PHONE || '+91 70000 00000';

async function seedAdmin() {
  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env to seed the admin user.');
  }

  await connectDB();
  const db = getDB();
  const usersCollection = db.collection('users');
  const tokensCollection = db.collection('tokens');

  const normalizedEmail = adminEmail.toLowerCase();
  const existingUser = await usersCollection.findOne({ email: normalizedEmail });

  if (existingUser) {
    console.log(`Admin user already exists: ${normalizedEmail}`);
    return existingUser;
  }

  const id = `admin-${Date.now()}`;
  const token = `token-${id}`;
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const adminUser = {
    id,
    name: adminName,
    email: normalizedEmail,
    phone: adminPhone,
    interest: 'Admin',
    role: 'admin',
    password: hashedPassword,
    token,
    profile: {
      fullName: adminName,
      email: normalizedEmail,
      phone: adminPhone,
      alternatePhone: '',
      dateOfBirth: '',
      gender: '',
      location: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
      country: 'India',
      emergencyContact: '',
      bio: '',
      memberSince: `${new Date().getFullYear()}`,
    },
  };

  await Promise.all([
    usersCollection.insertOne(adminUser),
    tokensCollection.insertOne({ token, userId: id }),
  ]);

  console.log(`Created admin user: ${normalizedEmail}`);
  return adminUser;
}

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to seed admin user:', err);
      process.exit(1);
    });
}

export { seedAdmin };

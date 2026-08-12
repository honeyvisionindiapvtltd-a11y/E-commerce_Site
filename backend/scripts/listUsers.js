import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dbConfig from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

async function main() {
  try {
    await mongoose.connect(dbConfig.mongoUri);
    console.log('Connected to MongoDB');
    const users = await User.find({}).limit(50).lean();
    if (!users.length) {
      console.log('No users found');
    } else {
      users.forEach((u) => {
        console.log('---');
        console.log('id:', u._id?.toString());
        console.log('email:', u.email);
        console.log('phone:', u.phone);
        console.log('passwordHash present:', Boolean(u.passwordHash));
        console.log('passwordSalt present:', Boolean(u.passwordSalt));
        console.log('emailVerified:', u.emailVerified);
      });
    }
  } catch (err) {
    console.error('Error listing users:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

main();

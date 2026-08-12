import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB, getDB } from '../db.js';

dotenv.config();

const bcryptHashPattern = /^\$2[aby]\$/;

async function hashPasswords() {
  await connectDB();
  const db = getDB();
  const usersCollection = db.collection('users');

  const users = await usersCollection.find({}).toArray();
  let updatedCount = 0;

  for (const user of users) {
    const existingPassword = user.password || '';
    if (!existingPassword || bcryptHashPattern.test(existingPassword)) {
      continue;
    }

    const hashedPassword = await bcrypt.hash(existingPassword, 10);
    await usersCollection.updateOne({ id: user.id }, { $set: { password: hashedPassword } });
    updatedCount += 1;
    console.log(`Hashed password for user: ${user.email}`);
  }

  console.log(`Password hash migration complete. Updated ${updatedCount} user(s).`);
  process.exit(0);
}

hashPasswords().catch((err) => {
  console.error('Password hash migration failed:', err);
  process.exit(1);
});

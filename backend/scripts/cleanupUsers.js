import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dbConfig from '../config/db.js';

dotenv.config();

const runCleanup = async () => {
  try {
    await mongoose.connect(dbConfig.mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log('Connected to MongoDB for cleanup');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const result = await usersCollection.updateMany(
      {
        $or: [
          { password: { $exists: true } },
          { token: { $exists: true } },
        ],
      },
      {
        $unset: {
          password: '',
          token: '',
        },
      }
    );

    console.log(`Cleanup completed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runCleanup();

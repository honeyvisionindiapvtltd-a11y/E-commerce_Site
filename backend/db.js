import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || 'honeyvision';
const defaultLocalUri = `mongodb://127.0.0.1:27017/${dbName}`;
const directUri = process.env.MONGODB_DIRECT_URI;
const serverUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const fallbackUri = process.env.NODE_ENV === 'production' ? '' : defaultLocalUri;
const uri = (directUri && directUri.trim()) || (serverUri && serverUri.trim()) || fallbackUri;

const client = new MongoClient(uri, {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  },
});

let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(dbName);
    console.log(`Connected to MongoDB database: ${dbName}`);
  }
  return db;
}

export function getDB() {
  if (!db) {
    throw new Error('MongoDB not connected yet. Call connectDB first.');
  }
  return db;
}

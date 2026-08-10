import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const srvUri = process.env.MONGODB_URI;
const directUri = process.env.MONGODB_DIRECT_URI;
const dbName = process.env.DB_NAME || 'honeyvision';
const uri = directUri || srvUri;

if (!uri) {
  throw new Error('MONGODB_URI or MONGODB_DIRECT_URI is required in .env');
}

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

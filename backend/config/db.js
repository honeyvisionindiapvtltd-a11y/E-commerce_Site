import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const defaultDatabase = 'honeyvision';

const appendDefaultDatabase = (uri, database) => {
  if (!uri) return uri;
  const [main, query = ''] = uri.split('?');
  if (!main.includes('://')) return uri;

  const [protocol, rest] = main.split('://');
  if (!rest.includes('/')) {
    return `${protocol}://${rest}/${database}${query ? `?${query}` : ''}`;
  }

  const path = rest.substring(rest.indexOf('/'));
  if (path === '/' || path === '') {
    return `${protocol}://${rest.replace(/\/$/, '')}/${database}${query ? `?${query}` : ''}`;
  }

  return uri;
};

const rawUri = process.env.MONGO_URI || process.env.MONGODB_URI || `mongodb://127.0.0.1:27017/${defaultDatabase}`;
const mongoUri = appendDefaultDatabase(rawUri.trim(), defaultDatabase);

const dbConfig = {
  mongoUri,
};

export default dbConfig;

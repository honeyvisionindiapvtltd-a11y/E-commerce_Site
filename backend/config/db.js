import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const defaultDatabase = 'honeyvision';
const defaultLocalUri = `mongodb://127.0.0.1:27017/${defaultDatabase}`;

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

const resolveMongoUri = () => {
  const directUri = process.env.MONGODB_DIRECT_URI;
  if (directUri && directUri.trim()) return directUri.trim();

  const remoteUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (remoteUri && remoteUri.trim()) {
    const uri = remoteUri.trim();
    if (/localhost|127\.0\.0\.1/.test(uri)) return uri;
    if (!/mongodb\.(net|com)|mongodb\+srv/i.test(uri)) return uri;
    return defaultLocalUri;
  }

  return defaultLocalUri;
};

const rawUri = resolveMongoUri();
const mongoUri = appendDefaultDatabase(rawUri, defaultDatabase);

const dbConfig = {
  mongoUri,
};

export default dbConfig;

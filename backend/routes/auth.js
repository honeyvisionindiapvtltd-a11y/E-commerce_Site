import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDB } from '../db.js';

const router = Router();

const getUsersCollection = () => getDB().collection('users');
const getTokensCollection = () => getDB().collection('tokens');

const getSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  interest: user.interest,
  role: user.role || 'customer',
});

const getProfile = (user) => ({
  ...(user.profile || {}),
  memberSince: user.profile?.memberSince || '2026',
});

function verifyLegacyPassword(user, password) {
  if (!user.passwordHash || !user.passwordSalt) {
    return false;
  }

  const salt = user.passwordSalt;
  const normalizedHash = String(user.passwordHash).toLowerCase();
  const candidates = [];

  try {
    candidates.push(
      crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex'),
    );
    candidates.push(
      crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex'),
    );
    candidates.push(
      crypto.pbkdf2Sync(password, salt, 50000, 64, 'sha512').toString('hex'),
    );
    candidates.push(
      crypto.pbkdf2Sync(password, salt, 200000, 64, 'sha512').toString('hex'),
    );
  } catch (error) {
    // ignore invalid legacy PBKDF2 parameters
  }

  candidates.push(crypto.createHash('sha256').update(password + salt).digest('hex'));
  candidates.push(crypto.createHash('sha256').update(salt + password).digest('hex'));
  candidates.push(crypto.createHash('sha512').update(password + salt).digest('hex'));
  candidates.push(crypto.createHash('sha512').update(salt + password).digest('hex'));

  return candidates.some((candidate) => candidate === normalizedHash);
}

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized. Missing or invalid token.' });
  }

  const tokenDoc = await getTokensCollection().findOne({ token });
  if (!tokenDoc) {
    return res.status(401).json({ message: 'Unauthorized. Missing or invalid token.' });
  }

  const user = await getUsersCollection().findOne({ id: tokenDoc.userId });
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized. User not found.' });
  }

  req.user = user;
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admins only.' });
  }
  next();
};

router.post('/register', async (req, res) => {
  const { name, email, password, phone, interest, role } = req.body || {};

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Name, email, password and phone are required.' });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await getUsersCollection().findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = `user-${Date.now()}`;
  const token = `token-${id}`;
  const normalizedRole = role === 'admin' && req.body.adminSecret === process.env.ADMIN_SECRET ? 'admin' : 'customer';
  const user = {
    id,
    name,
    email: normalizedEmail,
    phone,
    interest: interest || 'AI Cameras',
    role: normalizedRole,
    password: hashedPassword,
    token,
    profile: {
      fullName: name,
      email: normalizedEmail,
      phone,
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
      memberSince: '2026',
    },
  };

  await Promise.all([
    getUsersCollection().insertOne(user),
    getTokensCollection().insertOne({ token, userId: id }),
  ]);

  res.status(201).json({
    user: getSafeUser(user),
    profile: getProfile(user),
    token,
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase();
  const user = await getUsersCollection().findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const isBcryptHash = typeof user.password === 'string' && /^\$2[ayb]\$/.test(user.password);
  let passwordMatches = false;

  if (user.password) {
    if (isBcryptHash) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      passwordMatches = password === user.password;
    }
  }

  if (!passwordMatches && user.passwordHash && user.passwordSalt) {
    passwordMatches = verifyLegacyPassword(user, password);
  }

  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  if (!isBcryptHash && user.password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await getUsersCollection().updateOne({ id: user.id }, { $set: { password: hashedPassword } });
  }

  if (!(user.password || isBcryptHash) && user.passwordHash && user.passwordSalt) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await getUsersCollection().updateOne(
      { id: user.id },
      {
        $set: {
          password: hashedPassword,
        },
        $unset: {
          passwordHash: '',
          passwordSalt: '',
        },
      }
    );
  }

  const token = user.token || `token-${user.id}`;
  await getUsersCollection().updateOne({ id: user.id }, { $set: { token } });
  await getTokensCollection().updateOne(
    { userId: user.id },
    { $set: { token, userId: user.id } },
    { upsert: true },
  );

  res.json({
    user: getSafeUser({ ...user, token }),
    profile: getProfile(user),
    token,
  });
});

router.get('/profile', authMiddleware, (req, res) => {
  const user = req.user;
  res.json({
    user: getSafeUser(user),
    profile: getProfile(user),
  });
});

router.post('/admin/create', async (req, res) => {
  const { name, email, password, phone, interest, adminSecret } = req.body || {};

  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ message: 'Forbidden. Invalid admin secret.' });
  }

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Name, email, password and phone are required to create an admin.' });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await getUsersCollection().findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'Admin user already exists.' });
  }

  const id = `admin-${Date.now()}`;
  const token = `token-${id}`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id,
    name,
    email: normalizedEmail,
    phone,
    interest: interest || 'Admin',
    role: 'admin',
    password: hashedPassword,
    token,
    profile: {
      fullName: name,
      email: normalizedEmail,
      phone,
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
      memberSince: '2026',
    },
  };

  await Promise.all([
    getUsersCollection().insertOne(user),
    getTokensCollection().insertOne({ token, userId: id }),
  ]);

  res.status(201).json({
    user: getSafeUser(user),
    profile: getProfile(user),
    token,
  });
});

router.get('/admin', authMiddleware, requireAdmin, (req, res) => {
  res.json({
    message: 'Admin access granted.',
    user: getSafeUser(req.user),
  });
});

router.get('/customers', authMiddleware, requireAdmin, async (req, res) => {
  const users = await getUsersCollection()
    .find({ role: { $ne: 'admin' } })
    .sort({ _id: -1 })
    .toArray();

  const customers = users.map((user) => ({
    id: user.id,
    name: user.name || user.profile?.fullName || 'Unknown Customer',
    email: user.email,
    phone: user.phone || '',
    orders: Number(user.orders || 0),
    spent: Number(user.spent || 0),
    status: user.status || 'Active',
    joined: user.profile?.memberSince || user.createdAt || '2026',
  }));

  res.json({ customers });
});

router.put('/customers/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  const allowedStatuses = ['Active', 'Blocked'];
  const { status } = req.body || {};

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid customer status.' });
  }

  const result = await getUsersCollection().updateOne({ id: req.params.id }, { $set: { status } });

  res.json({
    success: result.modifiedCount > 0 || result.matchedCount > 0,
    status,
  });
});

router.put('/profile', authMiddleware, async (req, res) => {
  const user = req.user;
  const body = req.body || {};

  const updatedUser = {
    ...user,
    name: body.fullName || body.name || user.name,
    email: body.email ? body.email.toLowerCase() : user.email,
    phone: body.phone || user.phone,
    interest: body.interest || user.interest,
    profile: {
      ...user.profile,
      ...body,
      fullName: body.fullName || user.name,
      email: body.email ? body.email.toLowerCase() : user.email,
      phone: body.phone || user.phone,
      memberSince: user.profile?.memberSince || '2026',
    },
  };

  await getUsersCollection().updateOne({ id: user.id }, { $set: updatedUser });

  res.json({
    user: getSafeUser(updatedUser),
    profile: getProfile(updatedUser),
  });
});

export default router;

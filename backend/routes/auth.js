import { Router } from 'express';
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
});

const getProfile = (user) => ({
  ...(user.profile || {}),
  memberSince: user.profile?.memberSince || '2026',
});

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

router.post('/register', async (req, res) => {
  const { name, email, password, phone, interest } = req.body || {};

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Name, email, password and phone are required.' });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await getUsersCollection().findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  const id = `user-${Date.now()}`;
  const token = `token-${id}`;
  const user = {
    id,
    name,
    email: normalizedEmail,
    phone,
    interest: interest || 'AI Cameras',
    password,
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
  const user = await getUsersCollection().findOne({ email: normalizedEmail, password });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
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

import { Router } from 'express';

const router = Router();
const users = [];
const tokenMap = new Map();

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

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token || !tokenMap.has(token)) {
    return res.status(401).json({ message: 'Unauthorized. Missing or invalid token.' });
  }

  const userId = tokenMap.get(token);
  const user = users.find((entry) => entry.id === userId);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized. User not found.' });
  }

  req.user = user;
  next();
};

router.post('/register', (req, res) => {
  const { name, email, password, phone, interest } = req.body || {};

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Name, email, password and phone are required.' });
  }

  const existing = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  const id = `user-${Date.now()}`;
  const token = `token-${id}`;
  const user = {
    id,
    name,
    email,
    phone,
    interest: interest || 'AI Cameras',
    password,
    token,
    profile: {
      fullName: name,
      email,
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

  users.push(user);
  tokenMap.set(token, id);

  res.status(201).json({
    user: getSafeUser(user),
    profile: getProfile(user),
    token,
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  if (!user.token) {
    user.token = `token-${user.id}`;
  }
  tokenMap.set(user.token, user.id);

  res.json({
    user: getSafeUser(user),
    profile: getProfile(user),
    token: user.token,
  });
});

router.get('/profile', authMiddleware, (req, res) => {
  const user = req.user;
  res.json({
    user: getSafeUser(user),
    profile: getProfile(user),
  });
});

router.put('/profile', authMiddleware, (req, res) => {
  const user = req.user;
  const body = req.body || {};

  user.name = body.fullName || body.name || user.name;
  user.email = body.email || user.email;
  user.phone = body.phone || user.phone;
  user.interest = body.interest || user.interest;
  user.profile = {
    ...user.profile,
    ...body,
    fullName: user.name,
    email: user.email,
    phone: user.phone,
    memberSince: user.profile?.memberSince || '2026',
  };

  res.json({
    user: getSafeUser(user),
    profile: getProfile(user),
  });
});

export default router;

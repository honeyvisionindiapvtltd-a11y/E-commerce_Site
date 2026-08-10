import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';

const router = Router();
const jwtSecret = process.env.JWT_SECRET || 'honeyvision-default-secret';
const jwtExpiresIn = '7d';

const getSafeUser = (user) => ({
  id: user._id?.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  interest: user.interest,
  emailVerified: user.emailVerified,
});

const getProfile = (user) => ({
  ...(user.profile || {}),
  memberSince: user.profile?.memberSince || new Date().getFullYear().toString(),
});

const signToken = (user) => jwt.sign({ userId: user._id?.toString() }, jwtSecret, { expiresIn: jwtExpiresIn });

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized. Missing token.' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.userId).exec();
    if (!user) {
      throw new Error('User not found');
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized. Invalid token.' });
  }
};

const createAuthResponse = (user) => ({
  user: getSafeUser(user),
  profile: getProfile(user),
  token: signToken(user),
});

const sendEmailToken = (email, subject, token) => {
  console.log(`Email to ${email}: ${subject} - token=${token}`);
};

router.post('/register', async (req, res) => {
  const { name, email, password, phone, interest } = req.body || {};

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Name, email, password and phone are required.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() }).exec();
  if (existing) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  const user = new User({
    name,
    email: email.toLowerCase(),
    phone,
    interest: interest || 'AI Cameras',
    profile: {
      fullName: name,
      email: email.toLowerCase(),
      phone,
      country: 'India',
      memberSince: new Date().getFullYear().toString(),
    },
  });

  user.setPassword(password);
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  sendEmailToken(user.email, 'Verify Your Email', verificationToken);

  res.status(201).json({
    ...createAuthResponse(user),
    verificationToken,
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).exec();
  if (!user || !user.validatePassword(password)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  res.json(createAuthResponse(user));
});

router.post('/verify-email', async (req, res) => {
  const { email, token } = req.body || {};

  if (!email || !token) {
    return res.status(400).json({ message: 'Email and token are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase(), emailVerificationToken: token }).exec();
  if (!user) {
    return res.status(400).json({ message: 'Invalid verification token.' });
  }

  user.emailVerified = true;
  user.emailVerificationToken = '';
  await user.save();

  res.json({ message: 'Email verified successfully.' });
});

router.post('/request-email-verification', async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).exec();
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  sendEmailToken(user.email, 'Verify Your Email', verificationToken);

  res.json({ message: 'Verification token generated.', verificationToken });
});

router.post('/request-password-reset', async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).exec();
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save();

  sendEmailToken(user.email, 'Password Reset', resetToken);

  res.json({ message: 'Password reset token generated.', resetToken });
});

router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body || {};

  if (!email || !token || !newPassword) {
    return res.status(400).json({ message: 'Email, token, and new password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase(), passwordResetToken: token }).exec();
  if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired password reset token.' });
  }

  user.setPassword(newPassword);
  user.clearPasswordResetToken();
  await user.save();

  res.json({ message: 'Password reset successfully.' });
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

  user.name = body.fullName || body.name || user.name;
  user.email = body.email ? body.email.toLowerCase() : user.email;
  user.phone = body.phone || user.phone;
  user.interest = body.interest || user.interest;

  user.profile = {
    ...user.profile,
    ...body,
    fullName: user.name,
    email: user.email,
    phone: user.phone,
    memberSince: user.profile?.memberSince || new Date().getFullYear().toString(),
  };

  await user.save();

  res.json({
    user: getSafeUser(updatedUser),
    profile: getProfile(updatedUser),
  });
});

export default router;

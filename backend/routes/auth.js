import { Router } from 'express';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
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
  role: user.role || 'customer',
  status: user.status || 'Active',
  emailVerified: user.emailVerified,
});

const getProfile = (user) => ({
  ...(user.profile || {}),
  memberSince: user.profile?.memberSince || new Date().getFullYear().toString(),
});

const signToken = (user) => jwt.sign({ userId: user._id?.toString() }, jwtSecret, { expiresIn: jwtExpiresIn });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'honeyvisionindiapvtltd@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || '',
  },
});

const sendEmailToken = async (email, subject, token) => {
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.log(`Email to ${email}: ${subject} - token=${token}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER || 'honeyvisionindiapvtltd@gmail.com',
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #071426;">Honey Vision</h2>
          <p>Hello,</p>
          <p>Your ${subject.toLowerCase()} code is:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; background: #FFF7DB; padding: 16px; border-radius: 8px; margin: 18px 0; display: inline-block;">${token}</div>
          <p>This code will expire in 1 hour.</p>
          <p>Thank you,<br />Honey Vision Team</p>
        </div>
      `,
    });

    console.log(`Real email sent to ${email} for ${subject}`);
  } catch (error) {
    console.error('Email send failed:', error.message);
    console.log(`Email fallback to ${email}: ${subject} - token=${token}`);
  }
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized. Missing token.' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.userId).exec();
    if (!user || (user.status && user.status !== 'Active')) {
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

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admins only.' });
  }

  next();
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, interest, role, adminSecret } = req.body || {};

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Name, email, password and phone are required.' });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).exec();
    if (existing) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    const normalizedRole = role === 'admin' && adminSecret === process.env.ADMIN_SECRET ? 'admin' : 'customer';

    const user = new User({
      name,
      email: normalizedEmail,
      phone,
      interest: interest || 'AI Cameras',
      role: normalizedRole,
      status: 'Active',
      profile: {
        fullName: name,
        email: normalizedEmail,
        phone,
        country: 'India',
        memberSince: new Date().getFullYear().toString(),
      },
    });

    user.setPassword(password);
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    await sendEmailToken(user.email, 'Verify Your Email', verificationToken);

    res.status(201).json({
      ...createAuthResponse(user),
      verificationToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again later.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).exec();

    if (!user) {
      console.warn(`Login attempt: user not found for email ${normalizedEmail}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status && user.status !== 'Active') {
      return res.status(403).json({ message: 'This account is inactive. Contact an administrator.' });
    }

    const isPasswordValid = user.validatePassword(password);
    
    if (!isPasswordValid) {
      console.warn(`Login attempt: invalid password for user ${normalizedEmail}. Has salt: ${!!user.passwordSalt}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json(createAuthResponse(user));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again later.' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body || {};
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required.' });
    }

    const googleResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
    );
    const googleUser = await googleResponse.json();
    if (!googleResponse.ok || googleUser.aud !== process.env.GOOGLE_CLIENT_ID || !googleUser.email_verified) {
      return res.status(401).json({ message: 'Invalid Google account credential.' });
    }

    const email = String(googleUser.email).toLowerCase();
    let user = await User.findOne({ email }).exec();

    if (user) {
      if (user.status && user.status !== 'Active') {
        return res.status(403).json({ message: 'This account is inactive. Contact an administrator.' });
      }
    } else {
      const name = String(googleUser.name || googleUser.email.split('@')[0]).trim();
      user = new User({
        name,
        email,
        phone: `google-${crypto.randomUUID()}`,
        role: 'customer',
        status: 'Active',
        emailVerified: true,
        profile: {
          fullName: name,
          email,
          country: 'India',
          memberSince: new Date().getFullYear().toString(),
        },
      });
      user.setPassword(crypto.randomUUID());
      await user.save();
    }

    res.json(createAuthResponse(user));
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Google login failed. Please try again later.' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { email, token } = req.body || {};

    if (!email || !token) {
      return res.status(400).json({ message: 'Email and token are required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase(), emailVerificationToken: token }).exec();
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token.' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = '';
    await user.save();

    res.json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Email verification failed. Please try again later.' });
  }
});

router.post('/request-email-verification', async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).exec();
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    await sendEmailToken(user.email, 'Verify Your Email', verificationToken);

    res.json({ message: 'Verification token generated.', verificationToken });
  } catch (error) {
    console.error('Request email verification error:', error);
    res.status(500).json({ message: 'Email verification request failed. Please try again later.' });
  }
});

router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).exec();
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    await sendEmailToken(user.email, 'Password Reset', resetToken);

    res.json({
      message: 'Password reset code generated. Use the code shown in the app or check the backend console while email is not configured.',
      resetToken,
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ message: 'Password reset request failed. Please try again later.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Email, token, and new password are required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase(), passwordResetToken: token }).exec();
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    user.setPassword(newPassword);
    user.clearPasswordResetToken();
    await user.save();

    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Password reset failed. Please try again later.' });
  }
});

router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    user: getSafeUser(req.user),
    profile: getProfile(req.user),
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

  const normalizedEmail = String(email).toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail }).exec();
  if (existing) {
    return res.status(409).json({ message: 'Admin user already exists.' });
  }

  const user = new User({
    name,
    email: normalizedEmail,
    phone,
    interest: interest || 'Admin',
    role: 'admin',
    status: 'Active',
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
  });

  user.setPassword(password);
  await user.save();

  res.status(201).json(createAuthResponse(user));
});

router.get('/admin', authMiddleware, requireAdmin, (req, res) => {
  res.json({
    message: 'Admin access granted.',
    user: getSafeUser(req.user),
  });
});

router.get('/customers', authMiddleware, requireAdmin, async (req, res) => {
  const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).exec();

  const customers = users.map((user) => ({
    id: user._id.toString(),
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

  const updatedUser = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).exec();

  res.json({
    success: !!updatedUser,
    status,
  });
});

router.put('/profile', authMiddleware, async (req, res) => {
  const user = req.user;
  const body = req.body || {};

  user.name = body.fullName || body.name || user.name;
  user.email = body.email ? String(body.email).toLowerCase() : user.email;
  user.phone = body.phone || user.phone;
  user.interest = body.interest || user.interest;

  user.profile = {
    ...(user.profile || {}),
    ...body,
    fullName: user.name,
    email: user.email,
    phone: user.phone,
    memberSince: user.profile?.memberSince || new Date().getFullYear().toString(),
  };

  await user.save();

  res.json({
    user: getSafeUser(user),
    profile: getProfile(user),
  });
});

export default router;

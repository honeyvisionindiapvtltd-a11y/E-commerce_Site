import { Router } from 'express';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { getJwtSecret } from '../config/env.js';
import { notifyAdmins } from '../services/notificationService.js';
import { requireCustomer } from '../middleware/authMiddleware.js';

const router = Router();
const jwtSecret = getJwtSecret();
const jwtExpiresIn = '7d';
const PASSWORD_RESET_COOLDOWN_MS = 60 * 1000;
const PASSWORD_RESET_EXPIRY_MS = 15 * 60 * 1000;

const getSafeUser = (user) => ({
  id: user._id?.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  interest: user.interest,
  role: user.role || 'customer',
  status: user.status || 'Active',
  emailVerified: user.emailVerified,
  authProvider: user.authProvider || 'password',
  lastLoginAt: user.lastLoginAt || null,
});

const getProfile = (user) => ({
  ...(user.profile || {}),
  memberSince: user.profile?.memberSince || new Date().getFullYear().toString(),
});

const signToken = (user) => jwt.sign({ userId: user._id?.toString(), role: user.role || 'customer' }, jwtSecret, { expiresIn: jwtExpiresIn });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'honeyvisionindiapvtltd@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || '',
  },
});

const sendEmailToken = async (email, subject, token) => {
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.warn(`Verification email skipped for ${email}: email delivery is not configured.`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER || 'honeyvisionindiapvtltd@gmail.com',
      to: email,
      subject,
      text: `Your HoneyVision verification token is ${token}.`,
      html: `<p>Your HoneyVision verification token is:</p><p><strong>${token}</strong></p>`,
    });
  } catch (error) {
    console.error('Verification email send failed:', error.message);
  }
};

const getFrontendUrl = () => {
  const configured = String(process.env.FRONTEND_URL || '').trim();

  if (!configured) {
    throw new Error('FRONTEND_URL is not configured. Set the frontend base URL for reset links.');
  }

  return configured.replace(/\/$/, '');
};

const buildPasswordResetUrl = (token) => `${getFrontendUrl()}/reset-password?token=${encodeURIComponent(token)}`;

const sendPasswordResetEmail = async (email, token) => {
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.warn(`Password reset email skipped for ${email}: email delivery is not configured.`);
    return;
  }

  const requestId = crypto.randomUUID();
  const resetUrl = buildPasswordResetUrl(token);

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER || 'honeyvisionindiapvtltd@gmail.com',
      to: email,
      subject: 'Reset your HoneyVision password',
      text: `Reset your HoneyVision password using this link: ${resetUrl}\n\nThis link expires in 15 minutes. If you did not request this password reset, you can safely ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #071426;">Honey Vision</h2>
          <h3>Reset your password</h3>
          <p>We received a request to reset your HoneyVision password.</p>
          <p><a href="${resetUrl}" style="display: inline-block; background: #F4B400; color: #071426; padding: 12px 22px; border-radius: 8px; font-weight: bold; text-decoration: none;">Reset Password</a></p>
          <p>This link expires in 15 minutes.</p>
          <p>If the button does not work, use this link:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p>If you did not request this password reset, you can safely ignore this email.</p>
          <p>Thank you,<br />HoneyVision Team</p>
        </div>
      `,
    });

    console.log(`[password-reset] Email sent successfully requestId=${requestId} email=${email}`);
  } catch (error) {
    console.error(`[password-reset] Email failed requestId=${requestId} email=${email} error=${error.message}`);
    throw error;
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
    if (payload.role && payload.role !== user.role) throw new Error('Role changed; please sign in again');
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
      authProvider: 'password',
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

    user.authProvider = 'password';
    user.lastLoginAt = new Date();
    await user.save();

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
        authProvider: 'google',
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

    user.authProvider = 'google';
    user.lastLoginAt = new Date();
    await user.save();

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

const handlePasswordResetRequest = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const requestId = crypto.randomUUID();
    const genericResponse = {
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
    };

    if (!email) {
      return res.json(genericResponse);
    }

    const user = await User.findOne({ email }).select('+passwordResetRequestedAt +passwordResetTokenHash +passwordResetExpires').exec();
    if (!user) {
      console.info(`[password-reset] No user found for email=${email} requestId=${requestId}`);
      return res.json(genericResponse);
    }

    const now = Date.now();
    const lastRequestedAt = user.passwordResetRequestedAt ? new Date(user.passwordResetRequestedAt).getTime() : 0;
    if (lastRequestedAt && now - lastRequestedAt < PASSWORD_RESET_COOLDOWN_MS) {
      console.warn(`[password-reset] Throttled email=${email} requestId=${requestId} nextAllowedAt=${new Date(lastRequestedAt + PASSWORD_RESET_COOLDOWN_MS).toISOString()}`);
      return res.json(genericResponse);
    }

    // Generate token but DO NOT save it yet
    const resetToken = user.generatePasswordResetToken();

    try {
      // Attempt to send email BEFORE persisting token
      await sendPasswordResetEmail(user.email, resetToken);
      
      // Only save the user with the token if email was sent successfully
      await user.save();
      console.log(`[password-reset] Email sent and token persisted requestId=${requestId} email=${user.email}`);
    } catch (emailError) {
      // Do NOT save the token if email fails
      console.error(`[password-reset] Email send failed - token NOT persisted requestId=${requestId} email=${user.email} error=${emailError.message}`);
      // Still return generic response to not expose email existence
    }

    return res.json(genericResponse);
  } catch (error) {
    console.error('Request password reset error:', error);
    return res.status(500).json({ success: false, message: 'Password reset request failed. Please try again later.' });
  }
};

router.post('/forgot-password', handlePasswordResetRequest);
router.post('/request-password-reset', handlePasswordResetRequest);

router.get('/validate-reset-token', async (req, res) => {
  try {
    const normalizedToken = String(req.query?.token || '').trim();
    if (!normalizedToken) {
      return res.status(400).json({ success: false, message: 'Password reset link is invalid or has expired.' });
    }

    // Hash the token and query MongoDB directly instead of loading all users
    const tokenHash = crypto
      .createHash('sha256')
      .update(normalizedToken)
      .digest('hex');

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    })
      .select('+passwordResetTokenHash +passwordResetExpires')
      .exec();

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password reset link is invalid or has expired.' });
    }

    return res.json({ success: true, message: 'Valid reset link.' });
  } catch (error) {
    console.error('Validate password reset token error:', error.message);
    return res.status(400).json({ success: false, message: 'Password reset link is invalid or has expired.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body || {};
    const normalizedToken = String(token || '').trim();
    const normalizedPassword = String(password || '').trim();
    const normalizedConfirmPassword = String(confirmPassword || '').trim();

    // Validate request body
    if (!normalizedToken || !normalizedPassword) {
      return res.status(400).json({ success: false, message: 'Token and password are required.' });
    }

    // Validate password confirmation
    if (normalizedPassword !== normalizedConfirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Validate password length (8 characters minimum)
    if (normalizedPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    // Hash the token and query MongoDB directly instead of loading all users
    const tokenHash = crypto
      .createHash('sha256')
      .update(normalizedToken)
      .digest('hex');

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    })
      .select('+passwordResetTokenHash +passwordResetExpires +passwordResetRequestedAt')
      .exec();

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password reset link is invalid or has expired.' });
    }

    // Update password and clear reset token
    user.setPassword(normalizedPassword);
    user.clearPasswordResetToken();
    await user.save();

    console.log(`[password-reset] Password reset successfully for user=${user._id}`);
    res.json({ success: true, message: 'Password updated successfully. Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Password reset failed. Please try again later.' });
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

  if (user.role !== 'admin') void notifyAdmins({ type: 'CUSTOMER_REGISTERED', title: 'New customer registered', message: `${user.name} created a new customer account.`, relatedId: user._id, relatedType: 'User', eventKey: `customer:${user._id}:registered` });

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
    authProvider: user.authProvider || 'password',
    lastLoginAt: user.lastLoginAt || null,
    location: user.addresses?.find((address) => address.isDefault)?.formattedAddress
      || user.addresses?.find((address) => address.isDefault)?.city
      || user.profile?.location
      || [user.profile?.city, user.profile?.state].filter(Boolean).join(', ')
      || 'Not provided',
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

router.put('/profile', authMiddleware, requireCustomer, async (req, res) => {
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

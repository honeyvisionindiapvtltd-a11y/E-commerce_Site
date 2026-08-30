import mongoose from 'mongoose';
import crypto from 'crypto';

const userProfileSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    alternatePhone: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: '' },
    location: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pinCode: { type: String, default: '' },
    country: { type: String, default: 'India' },
    emergencyContact: { type: String, default: '' },
    bio: { type: String, default: '' },
    memberSince: { type: String, default: new Date().getFullYear().toString() },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: '', trim: true },
    type: { type: String, default: 'Home', trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: '', trim: true },
    landmark: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, default: '', trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true },
    pincode: { type: String, required: true, trim: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    locationResolved: { type: Boolean, default: false },
    googlePlaceId: { type: String, default: '', trim: true },
    formattedAddress: { type: String, default: '', trim: true },
    addressType: { type: String, enum: ['HOME', 'WORK', 'OTHER'], default: 'HOME' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    authProvider: { type: String, enum: ['password', 'google'], default: 'password' },
    lastLoginAt: { type: Date, default: null },
    phone: { type: String, required: true, trim: true },
    interest: { type: String, default: 'AI Cameras', trim: true },
    role: { type: String, enum: ['customer', 'admin', 'delivery_agent'], default: 'customer' },
    status: { type: String, default: 'Active' },
    orders: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: '' },
    passwordResetToken: { type: String, default: '' },
    passwordResetExpires: { type: Date },
    profile: { type: userProfileSchema, default: () => ({}) },
    addresses: { type: [addressSchema], default: () => [] },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.passwordSalt;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.passwordSalt;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.id;
        return ret;
      },
    },
  }
);

userSchema.methods.setPassword = function (password) {
  const salt = crypto.randomBytes(16).toString('hex');
  this.passwordSalt = salt;
  this.passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');
};

userSchema.methods.validatePassword = function (password) {
  // Always use the stored salt, no fallbacks
  if (!this.passwordSalt) {
    return false;
  }
  const hash = crypto.scryptSync(password, this.passwordSalt, 64).toString('hex');
  return hash === this.passwordHash;
};

userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomUUID();
  this.emailVerificationToken = token;
  return token;
};

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomUUID();
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  return token;
};

userSchema.methods.clearPasswordResetToken = function () {
  this.passwordResetToken = '';
  this.passwordResetExpires = undefined;
};

userSchema.methods.safeObject = function () {
  const obj = this.toObject({ getters: true, versionKey: false });
  return {
    id: obj._id?.toString(),
    name: obj.name,
    email: obj.email,
    phone: obj.phone,
    interest: obj.interest,
    role: obj.role,
    status: obj.status,
    emailVerified: obj.emailVerified,
    profile: obj.profile,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);
export default User;

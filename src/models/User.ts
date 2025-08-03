import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  role: 'customer' | 'admin' | 'super_admin';
  isEmailVerified: boolean;
  isActive: boolean;
  avatar?: string;
  addresses: IAddress[];
  referralCode: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IAddress {
  _id?: string;
  label: string; // 'home', 'office', etc.
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const AddressSchema = new Schema<IAddress>({
  label: { type: String, required: true },
  recipientName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'Indonesia' },
  isDefault: { type: Boolean, default: false }
});

const UserSchema = new Schema<IUser>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, trim: true },
  dateOfBirth: { type: Date },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other']
  },
  role: { 
    type: String, 
    enum: ['customer', 'admin', 'super_admin'], 
    default: 'customer' 
  },
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  avatar: { type: String },
  addresses: [AddressSchema],
  referralCode: { 
    type: String, 
    unique: true, 
    required: true,
    default: () => `ARC${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  },
  referredBy: { type: String }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Generate referral code before saving
UserSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = `ARC${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ referralCode: 1 });
UserSchema.index({ referredBy: 1 });

export default mongoose.model<IUser>('User', UserSchema);
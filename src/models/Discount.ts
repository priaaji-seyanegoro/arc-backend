import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  _id: string;
  code: string;
  name: string;
  description?: string;
  
  // Discount Configuration
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number; // Percentage (0-100) or fixed amount
  
  // Usage Limits
  maxUses: number; // Total usage limit
  usedCount: number; // Current usage count
  maxUsesPerUser: number; // Per user limit
  
  // Conditions
  minimumAmount: number; // Minimum order amount
  maximumDiscount?: number; // Maximum discount amount (for percentage)
  applicableCategories: mongoose.Types.ObjectId[]; // Empty = all categories
  applicableProducts: mongoose.Types.ObjectId[]; // Empty = all products
  
  // Validity
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReferral extends Document {
  _id: string;
  referrer: mongoose.Types.ObjectId; // User who refers
  referee: mongoose.Types.ObjectId; // User who was referred
  
  // Rewards
  referrerReward: number; // Amount for referrer
  refereeReward: number; // Amount for referee
  
  // Status
  status: 'pending' | 'completed' | 'expired';
  completedAt?: Date;
  
  // Order that triggered the reward
  triggerOrder?: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    trim: true
  },
  name: { type: String, required: true },
  description: { type: String },
  
  // Discount Configuration
  type: { 
    type: String, 
    enum: ['percentage', 'fixed_amount', 'free_shipping'], 
    required: true 
  },
  value: { type: Number, required: true, min: 0 },
  
  // Usage Limits
  maxUses: { type: Number, required: true, min: 1 },
  usedCount: { type: Number, default: 0, min: 0 },
  maxUsesPerUser: { type: Number, default: 1, min: 1 },
  
  // Conditions
  minimumAmount: { type: Number, default: 0, min: 0 },
  maximumDiscount: { type: Number, min: 0 },
  applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  
  // Validity
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  
  // Metadata
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

const ReferralSchema = new Schema<IReferral>({
  referrer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  referee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Rewards
  referrerReward: { type: Number, required: true, min: 0 },
  refereeReward: { type: Number, required: true, min: 0 },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'expired'], 
    default: 'pending' 
  },
  completedAt: { type: Date },
  
  // Order that triggered the reward
  triggerOrder: { type: Schema.Types.ObjectId, ref: 'Order' }
}, {
  timestamps: true
});

// Validation: endDate must be after startDate
CouponSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});

// Indexes
CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
CouponSchema.index({ applicableCategories: 1 });
CouponSchema.index({ applicableProducts: 1 });

ReferralSchema.index({ referrer: 1 });
ReferralSchema.index({ referee: 1 });
ReferralSchema.index({ status: 1 });
ReferralSchema.index({ triggerOrder: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
export const Referral = mongoose.model<IReferral>('Referral', ReferralSchema);
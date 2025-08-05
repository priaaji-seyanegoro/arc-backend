import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  _id?: string;
  product: mongoose.Types.ObjectId;
  sku: string;
  productName: string; // Snapshot at time of order
  size: string;
  color: string;
  quantity: number;
  price: number; // Price at time of order
  weight: number; // in grams
  image: string; // Main product image snapshot
}

export interface IShippingAddress {
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrder extends Document {
  _id: string;
  orderNumber: string; // ARC-YYYYMMDD-XXXXX
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  
  // Pricing
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  // Shipping
  shippingAddress: IShippingAddress;
  shippingMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  
  // Payment
  paymentMethod: 'midtrans' | 'bank_transfer' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string; // Midtrans transaction ID
  paidAt?: Date;
  
  // Order Status
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  
  // Discounts Applied
  couponCode?: string;
  referralDiscount?: number;
  
  // Metadata
  notes?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true },
  productName: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  weight: { type: Number, required: true, min: 0 },
  image: { type: String, required: true }
});

const ShippingAddressSchema = new Schema<IShippingAddress>({
  recipientName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'Indonesia' }
});

const OrderSchema = new Schema<IOrder>({
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true,
    default: function() {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.random().toString(36).substr(2, 5).toUpperCase();
      return `ARC-${date}-${random}`;
    }
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [OrderItemSchema],
  
  // Pricing
  subtotal: { type: Number, required: true, min: 0 },
  shippingCost: { type: Number, required: true, min: 0, default: 0 },
  taxAmount: { type: Number, required: true, min: 0, default: 0 },
  discountAmount: { type: Number, min: 0, default: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  
  // Shipping
  shippingAddress: { type: ShippingAddressSchema, required: true },
  shippingMethod: { type: String, required: true },
  trackingNumber: { type: String },
  estimatedDelivery: { type: Date },
  
  // Payment
  paymentMethod: { 
    type: String, 
    enum: ['midtrans', 'bank_transfer', 'cod'], 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentId: { type: String },
  paidAt: { type: Date },
  
  // Order Status
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'], 
    default: 'pending' 
  },
  
  // Discounts
  couponCode: { type: String },
  referralDiscount: { type: Number, min: 0, default: 0 },
  
  // Metadata
  notes: { type: String },
  cancelReason: { type: String }
}, {
  timestamps: true
});

// Generate order number before saving
OrderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.orderNumber = `ARC-${date}-${random}`;
  }
  next();
});

// Indexes (hapus orderNumber karena sudah unique: true)
// OrderSchema.index({ orderNumber: 1 }); // HAPUS BARIS INI
OrderSchema.index({ user: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'items.product': 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
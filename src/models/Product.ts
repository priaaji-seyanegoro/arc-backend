import mongoose, { Document, Schema } from 'mongoose';

export interface ISKU {
  _id?: string;
  sku: string; // Format: ARC-{CATEGORY}-{SIZE}-{COLOR}-{ID}
  size: string;
  color: string;
  stock: number;
  price: number;
  compareAtPrice?: number; // Original price for discount display
  weight: number; // in grams
  images: string[];
  isActive: boolean;
}

export interface IProduct extends Document {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: mongoose.Types.ObjectId;
  brand?: string;
  tags: string[];
  skus: ISKU[];
  basePrice: number;
  images: string[];
  features: string[];
  materials: string[];
  careInstructions: string[];
  sizeChart?: string;
  isActive: boolean;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  totalStock: number;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Add method declaration
  generateSKU(size: string, color: string, categoryCode: string): string;
}

const SKUSchema = new Schema<ISKU>({
  sku: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true
  },
  size: { type: String, required: true },
  color: { type: String, required: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  weight: { type: Number, required: true, min: 0 }, // in grams
  images: [{ type: String }],
  isActive: { type: Boolean, default: true }
});

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  description: { type: String, required: true },
  shortDescription: { type: String, maxlength: 200 },
  category: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  brand: { type: String, trim: true },
  tags: [{ type: String, lowercase: true }],
  skus: [SKUSchema],
  basePrice: { type: Number, required: true, min: 0 },
  images: [{ type: String }],
  features: [{ type: String }],
  materials: [{ type: String }],
  careInstructions: [{ type: String }],
  sizeChart: { type: String },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  metaTitle: { type: String },
  metaDescription: { type: String },
  totalStock: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true
});

// Generate slug before saving
ProductSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Calculate total stock from SKUs
ProductSchema.pre('save', function(next) {
  if (this.isModified('skus')) {
    this.totalStock = this.skus.reduce((total, sku) => total + sku.stock, 0);
  }
  next();
});

// Generate SKU codes
ProductSchema.methods.generateSKU = function(size: string, color: string, categoryCode: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const randomId = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `ARC-${categoryCode.toUpperCase()}-${size.toUpperCase()}-${color.toUpperCase()}-${timestamp}${randomId}`;
};

// Indexes
ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1, isFeatured: -1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ 'skus.sku': 1 });
ProductSchema.index({ totalStock: 1 });
ProductSchema.index({ averageRating: -1 });
ProductSchema.index({ createdAt: -1 });

export default mongoose.model<IProduct>('Product', ProductSchema);
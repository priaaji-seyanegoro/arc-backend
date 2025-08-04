import mongoose, { Document, Schema } from 'mongoose';

export interface ICollection extends Document {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  code: string; // Unique collection code (e.g., "ARC-001", "WINTER-2024")
  type: 'seasonal' | 'capsule' | 'limited' | 'regular';
  image?: string;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<ICollection>({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  slug: {
    type: String,
    required: true,
    lowercase: true
    // Hapus unique: true dari sini
  },
  description: { 
    type: String, 
    trim: true 
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
    // Hapus unique: true dari sini
  },
  type: {
    type: String,
    enum: ['seasonal', 'capsule', 'limited', 'regular'],
    default: 'regular'
  },
  image: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  metaTitle: { type: String },
  metaDescription: { type: String }
}, {
  timestamps: true
});

// Keep only these indexes with unique constraint
CollectionSchema.index({ slug: 1 }, { unique: true });
CollectionSchema.index({ code: 1 }, { unique: true });
CollectionSchema.index({ isActive: 1, isFeatured: -1 });
CollectionSchema.index({ type: 1 });
CollectionSchema.index({ startDate: 1, endDate: 1 });
CollectionSchema.index({ sortOrder: 1 });

export default mongoose.model<ICollection>('Collection', CollectionSchema);
import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: { type: String, trim: true },
    image: { type: String },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Generate slug before saving
CategorySchema.pre("save", function (next) {
  if ((this.isModified("name") || this.isNew) && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

// Indexes
// CategorySchema.index({ slug: 1 }); // REMOVE - sudah unique: true
CategorySchema.index({ parentCategory: 1 });
CategorySchema.index({ isActive: 1, sortOrder: 1 });

export default mongoose.model<ICategory>("Category", CategorySchema);

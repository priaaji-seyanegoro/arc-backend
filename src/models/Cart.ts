import mongoose, { Document, Schema } from "mongoose";

export interface ICartItem {
  _id?: string;
  product: mongoose.Types.ObjectId; // FIXED: Changed from string to ObjectId
  sku: string;
  quantity: number;
  price: number; // Price at the time of adding to cart
  addedAt: Date;
}

export interface ICart extends Document {
  _id: string;
  user: mongoose.Types.ObjectId; // FIXED: Changed from string to ObjectId
  items: ICartItem[];
  totalItems: number;
  totalAmount: number;
  updatedAt: Date;
  createdAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  addedAt: { type: Date, default: Date.now },
});

const CartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
    totalItems: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Calculate totals before saving
CartSchema.pre("save", function (next) {
  this.totalItems = this.items.reduce(
    (total, item) => total + item.quantity,
    0
  );
  this.totalAmount = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  next();
});

CartSchema.index({ "items.product": 1 });
CartSchema.index({ "items.sku": 1 });

export default mongoose.model<ICart>("Cart", CartSchema);

// models/Revenue.ts
import mongoose from 'mongoose';

export interface RevenueType {
  month: string;
  revenue: number;
}

const revenueSchema = new mongoose.Schema({
  month: { type: String, unique: true },
  revenue: Number,
});

export default mongoose.models.Revenue ||
  mongoose.model('Revenue', revenueSchema);

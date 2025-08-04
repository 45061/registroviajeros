// models/Customer.ts
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: String,
  email: String,
  image_url: String,
});

export default mongoose.models.Customer ||
  mongoose.model('Customer', customerSchema);

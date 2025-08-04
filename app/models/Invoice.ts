// models/Invoice.ts
import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  customer_id: String,
  amount: Number,
  status: String,
  date: Date,
});

export default mongoose.models.Invoice ||
  mongoose.model('Invoice', invoiceSchema);

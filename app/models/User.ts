import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  name: String,
  email: { type: String, unique: true },
  password: String,
});

export default mongoose.models.User || mongoose.model('User', userSchema);

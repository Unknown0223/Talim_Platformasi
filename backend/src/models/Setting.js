import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String },
  group: { type: String, default: 'general' } // general, telegram, finance etc.
}, { timestamps: true });

export default mongoose.model('Setting', settingSchema);

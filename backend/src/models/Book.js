import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['Darslik', 'Badiiy', 'Lug\'at', 'Qo\'llanma'], default: 'Darslik' },
  coverImage: { type: String }, // URL to image
  fileUrl: { type: String }, // URL to PDF/file
  downloadCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Book', bookSchema);

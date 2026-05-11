import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    type: { type: String, enum: ['online', 'offline'], required: true },
    price: { type: Number, default: 0 },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Course', courseSchema);

import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    videoUrl: { type: String, default: '' },
    liveLink: { type: String, default: '' },
    date: { type: Date, default: null },
    type: { type: String, enum: ['video', 'live'], default: 'video' },
    subtitleUrl: { type: String, default: '' },
    segments: [{ start: Number, end: Number, title: String }],
  },
  { timestamps: true }
);

export default mongoose.model('Lesson', lessonSchema);

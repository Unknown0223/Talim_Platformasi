import mongoose from 'mongoose';

const guestResultSchema = new mongoose.Schema(
  {
    guestName: { type: String, required: true },
    testType: { type: String, enum: ['random', 'subject'], required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  },
  { timestamps: true }
);

export default mongoose.model('GuestResult', guestResultSchema);

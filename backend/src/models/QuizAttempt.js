import mongoose from 'mongoose';

const QuizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  question: String,
  chosen: String,
  correctAnswer: String,
  score: Number,
  timeTakenSec: Number,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('QuizAttempt', QuizAttemptSchema);

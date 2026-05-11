import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['broadcast', 'schedule_change', 'payment', 'approval'], default: 'broadcast' },
    message: { type: String, required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // Masalan courseId yoki paymentId
    status: { type: String, enum: ['sent', 'confirmed'], default: 'sent' },
    telegramMessageId: { type: String },
    confirmedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);

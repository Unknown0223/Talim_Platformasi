import mongoose from 'mongoose';
import crypto from 'crypto';

const battleSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, uppercase: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    players: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        score: Number,
        submittedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

battleSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 }); // 24 soatdan keyin o'chiriladi

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[bytes[i] % chars.length];
  return code;
}

battleSchema.statics.createRoom = async function (subjectId) {
  let code;
  for (let i = 0; i < 10; i++) {
    code = randomCode();
    const exists = await this.findOne({ roomCode: code });
    if (!exists) break;
  }
  const room = await this.create({ roomCode: code, subjectId, players: [] });
  return room;
};

export default mongoose.model('Battle', battleSchema);

import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Teacher or Receptionist
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // Optional, for student attendance
    type: { type: String, enum: ['student', 'teacher'], required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Attendance', attendanceSchema);

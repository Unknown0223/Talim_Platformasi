import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['student', 'teacher', 'admin', 'cashier', 'receptionist', 'parent'], default: 'student' },
    studentId: { type: String, unique: true, sparse: true },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    badges: [{ type: String }],
    rank: { type: String, default: 'Beginner' },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referralCount: { type: Number, default: 0 },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    birthDate: { type: Date },
    balance: { type: Number, default: 0 }, // O'qituvchilar uchun
    parentOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Ota-onalar uchun (ko'p farzandli bo'lishi mumkin)
    telegramId: { type: String, unique: true, sparse: true }, // Telegram bot bilan bog'lash uchun
    teacherDetails: {
      specialization: { type: String },
      education: { type: String },
      experience: { type: String },
      achievements: { type: [String] },
      bio: { type: String },
    },
    isApproved: { type: Boolean, default: true }, // Yangi foydalanuvchilar uchun false bo'lishi mumkin
    avatar: { type: String }, // Profil rasmi yo'li
    permissions: [{ type: String }], // Granular ruxsatlar: 'admin_dashboard', 'import_data', 'manage_library', etc.
    managedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],   // Xodimga biriktirilgan kurslar
    managedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }], // Xodimga biriktirilgan fanlar
    lastSeen: { type: Date },  // Oxirgi faollik vaqti (monitoring uchun)
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (this.name && (!this.firstName || !this.lastName)) {
    const parts = this.name.split(' ');
    this.firstName = parts[0];
    this.lastName = parts.slice(1).join(' ');
  }
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.virtual('age').get(function () {
  if (!this.birthDate) return null;
  const diff = Date.now() - this.birthDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

export default mongoose.model('User', userSchema);

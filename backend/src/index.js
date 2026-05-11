import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import testRoutes from './routes/testRoutes.js';
import enrollRoutes from './routes/enrollRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import studyPlanRoutes from './routes/studyPlanRoutes.js';
import battleRoutes from './routes/battleRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import parentRoutes from './routes/parentRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import { initBot } from './services/telegramBot.js';
import rankingRoutes from './routes/rankingRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import monitoringRoutes from './routes/monitoringRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import jwt from 'jsonwebtoken';
import { getPrisma } from './lib/prisma.js';
import { setupRealtime } from './services/realtime.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5001;
const frontendUrls = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
].filter(Boolean);

app.use(cors({ origin: frontendUrls.length ? frontendUrls : true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// lastSeen middleware — foydalanuvchi faoliyatini yangilaydi
app.use((req, _res, next) => {
  try {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      const token = auth.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      if (decoded?.id) {
        const prisma = getPrisma();
        prisma.user.update({ where: { id: decoded.id }, data: { lastSeen: new Date() } }).catch(() => {});
      }
    }
  } catch (_) { /* ignore */ }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/library', bookRoutes); 
app.use('/api/subjects', subjectRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/enroll', enrollRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/study-plan', studyPlanRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/feedback', feedbackRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((req, res) => res.status(404).json({ message: 'Topilmadi' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server xatosi' });
});

connectDB().then(async () => {
  initBot();
}).catch(() => {});

setupRealtime(server, frontendUrls);
server.listen(PORT, () => console.log(`Server ${PORT} da ishlayapti`));

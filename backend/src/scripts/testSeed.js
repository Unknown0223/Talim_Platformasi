import 'dotenv/config';
import mongoose from 'mongoose';
import { User, Subject, Course, Test, Location, Lesson, Schedule, Enrollment, TestResult, Certificate, Room } from '../src/models/index.js';
import Book from '../src/models/Book.js';

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/talim';

const ok = (label, val) => console.log(`  [OK] ${label}: ${val}`);
const warn = (label, val, expected) => console.log(`  [!!] ${label}: ${val} (kutilgan: ${expected})`);
const check = (label, val, expected) => val >= expected ? ok(label, val) : warn(label, val, '>= ' + expected);

async function testSeed() {
  console.log('\n=== SEED DATA TEST ===\n');
  await mongoose.connect(URI);
  console.log('MongoDB ulandi\n');

  // --- USERS ---
  console.log('--- FOYDALANUVCHILAR ---');
  const totalUsers = await User.countDocuments();
  const admins = await User.countDocuments({ role: 'admin' });
  const teachers = await User.countDocuments({ role: 'teacher' });
  const students = await User.countDocuments({ role: 'student' });
  const cashiers = await User.countDocuments({ role: 'cashier' });
  const receptionists = await User.countDocuments({ role: 'receptionist' });
  const parents = await User.countDocuments({ role: 'parent' });

  check('Jami foydalanuvchilar', totalUsers, 20);
  check('Admin', admins, 1);
  check('O\'qituvchilar', teachers, 9);
  check('O\'quvchilar', students, 10);
  check('Kassirlar', cashiers, 1);
  check('Resepshnistlar', receptionists, 1);
  ok('Ota-onalar', parents);

  // Check specific users exist
  const adminUser = await User.findOne({ role: 'admin' }).select('name email isApproved');
  const teacherUser = await User.findOne({ role: 'teacher' }).select('name email isApproved teacherDetails');
  const studentUser = await User.findOne({ role: 'student' }).select('name email isApproved');

  if (adminUser) ok('Admin user', `${adminUser.name} <${adminUser.email}> isApproved:${adminUser.isApproved}`);
  else warn('Admin user', 'TOPILMADI', 'admin@talim.uz');

  if (teacherUser) ok('Teacher user', `${teacherUser.name} isApproved:${teacherUser.isApproved} teacherDetails:${!!teacherUser.teacherDetails}`);
  else warn('Teacher user', 'TOPILMADI', 'mavjud bo\'lishi kerak');

  if (studentUser) ok('Student user', `${studentUser.name} isApproved:${studentUser.isApproved}`);
  else warn('Student user', 'TOPILMADI', 'mavjud bo\'lishi kerak');

  // --- SUBJECTS ---
  console.log('\n--- FANLAR ---');
  const subjectCount = await Subject.countDocuments();
  check('Jami fanlar', subjectCount, 7);
  const subjectNames = await Subject.find().select('name');
  ok('Fan nomlari', subjectNames.map(s => s.name).join(', '));

  // --- COURSES ---
  console.log('\n--- KURSLAR ---');
  const courseCount = await Course.countDocuments();
  check('Jami kurslar', courseCount, 15);
  const onlineCourses = await Course.countDocuments({ type: 'online' });
  const offlineCourses = await Course.countDocuments({ type: 'offline' });
  ok('Online kurslar', onlineCourses);
  ok('Offline kurslar', offlineCourses);

  // Check courses have teacherId and subjectId
  const coursesWithTeacher = await Course.countDocuments({ teacherId: { $exists: true, $ne: null } });
  const coursesWithSubject = await Course.countDocuments({ subjectId: { $exists: true, $ne: null } });
  check('Kurslar (teacher bor)', coursesWithTeacher, courseCount);
  check('Kurslar (subject bor)', coursesWithSubject, courseCount);

  // --- TESTS ---
  console.log('\n--- TESTLAR ---');
  const testCount = await Test.countDocuments();
  check('Jami testlar', testCount, 7);
  const testsWithQuestions = await Test.find().select('subjectId questions');
  for (const t of testsWithQuestions) {
    const subj = await Subject.findById(t.subjectId).select('name');
    ok(`Test (${subj?.name || '?'})`, `${t.questions?.length || 0} ta savol`);
  }

  // --- LESSONS ---
  console.log('\n--- DARSLAR ---');
  const lessonCount = await Lesson.countDocuments();
  check('Jami darslar', lessonCount, 30);
  const lessonsWithVideo = await Lesson.countDocuments({ videoUrl: { $exists: true, $ne: '' } });
  ok('Video URL bor', lessonsWithVideo);

  // --- LOCATIONS & ROOMS ---
  console.log('\n--- JOYLAR VA XONALAR ---');
  const locationCount = await Location.countDocuments();
  const roomCount = await Room.countDocuments();
  check('Joylar', locationCount, 3);
  ok('Xonalar', roomCount);

  // --- SCHEDULES ---
  console.log('\n--- DARS JADVALLARI ---');
  const scheduleCount = await Schedule.countDocuments();
  check('Jadvallar', scheduleCount, 1);

  // --- ENROLLMENTS ---
  console.log('\n--- YOZILISHLAR ---');
  const enrollCount = await Enrollment.countDocuments();
  check('Jami yozilishlar', enrollCount, 10);
  const activeEnroll = await Enrollment.countDocuments({ status: 'active' });
  const completedEnroll = await Enrollment.countDocuments({ status: 'completed' });
  ok('Faol (active)', activeEnroll);
  ok('Yakunlangan (completed)', completedEnroll);

  // Check enrollment has userId and courseId
  const sampleEnroll = await Enrollment.findOne().populate('userId', 'name').populate('courseId', 'title');
  if (sampleEnroll) ok('Enrollment namuna', `${sampleEnroll.userId?.name} → ${sampleEnroll.courseId?.title}`);

  // --- CERTIFICATES ---
  console.log('\n--- SERTIFIKATLAR ---');
  const certCount = await Certificate.countDocuments();
  check('Sertifikatlar', certCount, 1);
  const certWithCode = await Certificate.countDocuments({ certificateCode: { $exists: true, $ne: '' } });
  ok('Kod bor', certWithCode);

  // --- TEST RESULTS ---
  console.log('\n--- TEST NATIJALARI ---');
  const resultCount = await TestResult.countDocuments();
  check('Test natijalari', resultCount, 5);
  const avgScore = await TestResult.aggregate([{ $group: { _id: null, avg: { $avg: '$score' } } }]);
  if (avgScore.length) ok('O\'rtacha ball', avgScore[0].avg.toFixed(1));

  // --- BOOKS ---
  console.log('\n--- KITOBLAR ---');
  const bookCount = await Book.countDocuments();
  check('Jami kitoblar', bookCount, 15);
  const bookCategories = await Book.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  bookCategories.forEach(b => ok(`Kategoriya (${b._id})`, `${b.count} ta`));

  // --- DATA INTEGRITY ---
  console.log('\n--- MA\'LUMOT YAXLITLIGI ---');
  // Courses without teacher
  const orphanCourses = await Course.find({ teacherId: null }).countDocuments();
  orphanCourses === 0 ? ok('Teachersiz kurslar', 'YO\'Q (ok)') : warn('Teachersiz kurslar', orphanCourses, 0);

  // Enrollments with valid user+course
  const badEnrollments = await Enrollment.countDocuments({ $or: [{ userId: null }, { courseId: null }] });
  badEnrollments === 0 ? ok('Noto\'g\'ri enrollmentlar', 'YO\'Q (ok)') : warn('Noto\'g\'ri enrollmentlar', badEnrollments, 0);

  // Users without password
  const noPassUsers = await User.countDocuments({ password: { $exists: false } });
  noPassUsers === 0 ? ok('Parolsiz foydalanuvchilar', 'YO\'Q (ok)') : warn('Parolsiz foydalanuvchilar', noPassUsers, 0);

  // Unapproved users (should be all approved after seed)
  const unapproved = await User.countDocuments({ isApproved: false });
  ok('Tasdiqlanmagan userlar', unapproved === 0 ? '0 (hammasi tasdiqlangan)' : unapproved + ' ta');

  console.log('\n=== SEED TEST YAKUNLANDI ===\n');
  await mongoose.disconnect();
  process.exit(0);
}

testSeed().catch(e => {
  console.error('XATO:', e.message);
  process.exit(1);
});

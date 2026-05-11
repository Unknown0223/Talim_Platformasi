import PDFDocument from 'pdfkit';
import { getPrisma } from '../lib/prisma.js';

export async function completeCourse(req, res) {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ message: 'courseId talab qilinadi' });
    const prisma = getPrisma();
    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
    if (!enrollment) return res.status(404).json({ message: 'Yozilish topilmadi' });
    await prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { status: 'completed', completedAt: new Date() },
    });
    await prisma.certificate.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: {},
    });
    res.json({ message: 'Kurs tugatildi', enrollment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getMyCertificates(req, res) {
  try {
    const prisma = getPrisma();
    const certs = await prisma.certificate.findMany({
      where: { userId: req.user.id },
      include: { course: { include: { teacher: { select: { id: true, name: true } } } } },
      orderBy: { issuedAt: 'desc' },
    });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function downloadCertificate(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const prisma = getPrisma();
    const cert = await prisma.certificate.findUnique({
      where: { id },
      include: { user: true, course: { include: { teacher: true } } },
    });
    if (!cert || String(cert.userId) !== String(userId)) {
      return res.status(404).json({ message: 'Sertifikat topilmadi' });
    }
    const user = cert.userId;
    const course = cert.courseId;
    const teacherName = course.teacherId?.name || 'O\'qituvchi';
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${course.id}.pdf`);
    doc.pipe(res);
    doc.fontSize(24).text('SERTIFIKAT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Quyidagi shaxs quyidagi kursni muvaffaqiyatli tugatgani uchun ushbu sertifikat bilan taqdirlanadi.', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(18).text(cert.user.name, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Kurs: ${cert.course.title}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`O'qituvchi: ${cert.course.teacher?.name || teacherName}`, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(10).text(`Sana: ${cert.issuedAt.toLocaleDateString('uz-UZ')}`, { align: 'center' });
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

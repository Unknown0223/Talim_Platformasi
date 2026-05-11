import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getPrisma } from '../lib/prisma.js';

function logCreds() {
  console.log('Seed tugadi.');
  console.log('Admin: admin@talim.uz');
  console.log("O'qituvchi: teacher@talim.uz (va teacher2..teacher6)");
  console.log("O'quvchi: student@talim.uz (va student2..student30)");
  console.log("Ota-ona: parent@talim.uz (va parent2..parent3)");
  console.log("Kassir: cashier@talim.uz");
  console.log("Reception: reception@talim.uz");
  console.log('Barcha parol: password123');
}

async function upsertUser(prisma, { email, name, role, studentId, teacherDetails, avatar }) {
  const passwordHash = await bcrypt.hash('password123', 12);
  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      role,
      permissions: [],
      permissionsOverride: false,
      studentId: studentId || null,
      passwordHash,
      avatar: avatar || null,
      teacherDetails: teacherDetails
        ? {
            create: {
              specialization: teacherDetails.specialization || null,
              education: teacherDetails.education || null,
              experience: teacherDetails.experience || null,
              achievements: teacherDetails.achievements || [],
              bio: teacherDetails.bio || null,
            },
          }
        : undefined,
    },
    update: {
      name,
      role,
      permissions: [],
      permissionsOverride: false,
      studentId: studentId || null,
      passwordHash,
      avatar: avatar || null,
      teacherDetails: teacherDetails
        ? {
            upsert: {
              create: {
                specialization: teacherDetails.specialization || null,
                education: teacherDetails.education || null,
                experience: teacherDetails.experience || null,
                achievements: teacherDetails.achievements || [],
                bio: teacherDetails.bio || null,
              },
              update: {
                specialization: teacherDetails.specialization || null,
                education: teacherDetails.education || null,
                experience: teacherDetails.experience || null,
                achievements: teacherDetails.achievements || [],
                bio: teacherDetails.bio || null,
              },
            },
          }
        : undefined,
    },
  });
}

async function upsertCourse(prisma, data) {
  const existing = await prisma.course.findFirst({ where: { title: data.title } });
  if (!existing) return prisma.course.create({ data });
  return prisma.course.update({ where: { id: existing.id }, data });
}

async function upsertBook(prisma, data) {
  const existing = await prisma.book.findFirst({
    where: { title: data.title, author: data.author || null },
  });
  if (!existing) return prisma.book.create({ data });
  return prisma.book.update({ where: { id: existing.id }, data });
}

async function upsertLesson(prisma, data) {
  const existing = await prisma.lesson.findUnique({
    where: { courseId_title: { courseId: data.courseId, title: data.title } },
  });
  if (!existing) return prisma.lesson.create({ data });
  return prisma.lesson.update({ where: { id: existing.id }, data });
}

async function upsertPayment(prisma, data) {
  const existing = await prisma.payment.findFirst({
    where: {
      userId: data.userId || null,
      courseId: data.courseId || null,
      amount: data.amount,
      status: data.status || null,
    },
  });
  if (!existing) return prisma.payment.create({ data });
  return prisma.payment.update({ where: { id: existing.id }, data });
}

async function upsertAttendance(prisma, data) {
  const existing = await prisma.attendance.findFirst({
    where: {
      userId: data.userId,
      scheduleId: data.scheduleId || null,
      note: data.note || null,
    },
  });
  if (!existing) return prisma.attendance.create({ data });
  return prisma.attendance.update({ where: { id: existing.id }, data });
}

function forceSeed() {
  return process.argv.includes('--force');
}

async function seed() {
  const prisma = getPrisma();
  await prisma.$connect();

  const completedSeed = await prisma.setting.findUnique({ where: { key: 'demo_seed_completed' } });
  if (completedSeed && !forceSeed()) {
    console.log("Demo ma'lumotlar avval to'ldirilgan. Qayta to'ldirish kerak bo'lsa: npm run seed -- --force");
    await prisma.$disconnect();
    return;
  }

  const subjectsSeed = [
    { name: 'Matematika', description: 'Raqamlar, algebra va geometriya asoslari' },
    { name: 'Fizika', description: 'Mexanika, optika va elektr' },
    { name: 'Ingliz tili', description: "Grammatika, so'zlashuv va yozuv" },
    { name: 'Informatika', description: 'Dasturlash va kompyuter fanlari' },
    { name: 'Kimyo', description: 'Moddalar, reaksiyalar va elementlar' },
    { name: 'Biologiya', description: "Hayot, o'simliklar va inson anatomiyasi" },
    { name: 'Tarix', description: "Dunyo va O'zbekiston tarixi" },
    { name: 'Geografiya', description: 'Yer yuzasi, iqlim va xaritalar' },
    { name: 'Ona tili', description: "Grammatika va yozma nutq" },
  ];
  const subjects = await Promise.all(
    subjectsSeed.map((s) =>
      prisma.subject.upsert({
        where: { name: s.name },
        create: s,
        update: { description: s.description },
      })
    )
  );
  const subjectByName = Object.fromEntries(subjects.map((s) => [s.name, s]));

  const admin = await upsertUser(prisma, {
    email: 'admin@talim.uz',
    name: 'Admin',
    role: 'admin',
    avatar: 'https://i.pravatar.cc/150?img=68',
  });

  const cashier = await upsertUser(prisma, {
    email: 'cashier@talim.uz',
    name: 'Kassir Madina',
    role: 'cashier',
    avatar: 'https://i.pravatar.cc/150?img=47',
  });
  const reception = await upsertUser(prisma, {
    email: 'reception@talim.uz',
    name: 'Reception Shahnoza',
    role: 'receptionist',
    avatar: 'https://i.pravatar.cc/150?img=56',
  });

  const teachers = await Promise.all([
    upsertUser(prisma, {
      email: 'teacher@talim.uz',
      name: "Ali O'ralov",
      role: 'teacher',
      avatar: 'https://i.pravatar.cc/150?img=12',
      teacherDetails: {
        specialization: 'Matematika',
        education: "O'zMU",
        experience: '12 yil',
        achievements: ["Yil o'qituvchisi 2022"],
        bio: 'Matematika fanini sodda va tushunarli usulda o‘rgataman.',
      },
    }),
    upsertUser(prisma, {
      email: 'teacher2@talim.uz',
      name: 'Dilnoza Rahimova',
      role: 'teacher',
      avatar: 'https://i.pravatar.cc/150?img=44',
      teacherDetails: {
        specialization: 'Fizika',
        education: 'TDPU',
        experience: '8 yil',
        achievements: ['STEM trener'],
        bio: 'Fizikani amaliy tajribalar bilan tushuntiraman.',
      },
    }),
    upsertUser(prisma, {
      email: 'teacher3@talim.uz',
      name: 'Jasur Toshmatov',
      role: 'teacher',
      avatar: 'https://i.pravatar.cc/150?img=14',
      teacherDetails: {
        specialization: 'Ingliz tili',
        education: "O'zDJTU",
        experience: '10 yil',
        achievements: ['IELTS 8.0+'],
        bio: 'Speaking va Reading bo‘yicha intensiv darslar.',
      },
    }),
    upsertUser(prisma, {
      email: 'teacher4@talim.uz',
      name: 'Malika Karimova',
      role: 'teacher',
      avatar: 'https://i.pravatar.cc/150?img=32',
      teacherDetails: {
        specialization: 'Informatika',
        education: 'TATU',
        experience: '6 yil',
        achievements: ['Frontend mentor'],
        bio: 'Dasturlashni loyihalar orqali o‘rgataman.',
      },
    }),
    upsertUser(prisma, {
      email: 'teacher5@talim.uz',
      name: 'Rustam Ismoilov',
      role: 'teacher',
      avatar: 'https://i.pravatar.cc/150?img=15',
      teacherDetails: {
        specialization: 'Kimyo',
        education: "O'zMU",
        experience: '7 yil',
        achievements: ['Laboratoriya metodikasi'],
        bio: 'Kimyo — formulalar emas, jarayonlar!',
      },
    }),
    upsertUser(prisma, {
      email: 'teacher6@talim.uz',
      name: 'Nigora Yusupova',
      role: 'teacher',
      avatar: 'https://i.pravatar.cc/150?img=49',
      teacherDetails: {
        specialization: 'Tarix',
        education: "ToshDO'TAU",
        experience: '15 yil',
        achievements: ['Oliy toifa'],
        bio: 'Tarixni tushunib o‘rganamiz.',
      },
    }),
  ]);

  const students = await Promise.all(
    Array.from({ length: 30 }, (_, i) => {
      const n = i + 1;
      return upsertUser(prisma, {
        email: n === 1 ? 'student@talim.uz' : `student${n}@talim.uz`,
        name: n === 1 ? 'Vali Student' : `Student ${n}`,
        role: 'student',
        studentId: `STU-10${String(n).padStart(2, '0')}`,
        avatar: `https://i.pravatar.cc/150?img=${20 + n}`,
      });
    })
  );

  const parents = await Promise.all(
    Array.from({ length: 3 }, (_, i) => {
      const n = i + 1;
      return upsertUser(prisma, {
        email: n === 1 ? 'parent@talim.uz' : `parent${n}@talim.uz`,
        name: n === 1 ? 'Ota-ona 1' : `Ota-ona ${n}`,
        role: 'parent',
        avatar: `https://i.pravatar.cc/150?img=${70 + n}`,
      });
    })
  );

  const locations = await Promise.all(
    [
      { name: 'Talim markazi (Chilonzor)', address: 'Toshkent, Chilonzor-9, 3', lat: 41.2858, lng: 69.1911 },
      { name: 'Talim markazi (Yunusobod)', address: 'Toshkent, Yunusobod-4', lat: 41.3111, lng: 69.2889 },
      { name: 'IT Park (Toshkent)', address: 'Toshkent, Amir Temur ko‘chasi', lat: 41.2995, lng: 69.2401 },
      { name: 'Yoshlar markazi', address: 'Toshkent, Amir Temur 1', lat: 41.311081, lng: 69.240562 },
    ].map((l) =>
      prisma.location.upsert({
        where: { name: l.name },
        create: l,
        update: { address: l.address, lat: l.lat, lng: l.lng },
      })
    )
  );

  await prisma.room.upsert({
    where: { name_building: { name: '101-xona', building: 'Asosiy bino' } },
    create: { locationId: locations[0].id, name: '101-xona', building: 'Asosiy bino', capacity: 20 },
    update: { building: 'Asosiy bino', capacity: 20 },
  });
  await Promise.all([
    prisma.room.upsert({
      where: { name_building: { name: '202-xona', building: 'Asosiy bino' } },
      create: { locationId: locations[0].id, name: '202-xona', building: 'Asosiy bino', capacity: 24 },
      update: { locationId: locations[0].id, capacity: 24 },
    }),
    prisma.room.upsert({
      where: { name_building: { name: 'Lab-1', building: 'IT Park' } },
      create: { locationId: locations[2].id, name: 'Lab-1', building: 'IT Park', capacity: 18 },
      update: { locationId: locations[2].id, capacity: 18 },
    }),
    prisma.room.upsert({
      where: { name_building: { name: 'Auditoriya-3', building: 'Yunusobod filial' } },
      create: { locationId: locations[1].id, name: 'Auditoriya-3', building: 'Yunusobod filial', capacity: 16 },
      update: { locationId: locations[1].id, capacity: 16 },
    }),
  ]);

  const youtube = {
    math: [
      'https://www.youtube.com/watch?v=ZK3O402wf1c',
      'https://www.youtube.com/watch?v=Kp2bYWRQylk',
      'https://www.youtube.com/watch?v=3fW2tJkK0p0',
    ],
    physics: [
      'https://www.youtube.com/watch?v=ZihywtixUYo',
      'https://www.youtube.com/watch?v=lq6e7t1f5fY',
    ],
    english: [
      'https://www.youtube.com/watch?v=6ZfuNTqbHE8',
      'https://www.youtube.com/watch?v=JGwWNGJdvx8',
    ],
    it: [
      'https://www.youtube.com/watch?v=hdI2bqOjy3c',
      'https://www.youtube.com/watch?v=bMknfKXIFA8',
      'https://www.youtube.com/watch?v=Ke90Tje7VS0',
    ],
    chemistry: ['https://www.youtube.com/watch?v=FSyAehMdpyI'],
    biology: ['https://www.youtube.com/watch?v=QnQe0xW_JY4'],
    history: ['https://www.youtube.com/watch?v=Yocja_N5s1I'],
  };

  const courses = [];
  courses.push(
    await upsertCourse(prisma, {
      title: "Matematika — Boshlang'ich (Onlayn)",
      subjectId: subjectByName['Matematika'].id,
      teacherId: teachers[0].id,
      level: 'Beginner',
      type: 'online',
      price: 0,
      description: 'Raqamlar, arifmetik amallar va oddiy masalalar. 0 dan boshlaymiz.',
    })
  );
  courses.push(
    await upsertCourse(prisma, {
      title: "Matematika — Intermediate (DTM)",
      subjectId: subjectByName['Matematika'].id,
      teacherId: teachers[0].id,
      level: 'Intermediate',
      type: 'online',
      price: 299000,
      description: 'Algebra va geometriya: test strategiyalari, mashqlar, uy vazifalar.',
    })
  );
  courses.push(
    await upsertCourse(prisma, {
      title: 'Fizika — Boshlang‘ich (Onlayn)',
      subjectId: subjectByName['Fizika'].id,
      teacherId: teachers[1].id,
      level: 'Beginner',
      type: 'online',
      price: 0,
      description: 'Mexanika va harakat: asosiy formulalar va misollar.',
    })
  );
  courses.push(
    await upsertCourse(prisma, {
      title: 'Ingliz tili — A1/A2 (Onlayn)',
      subjectId: subjectByName['Ingliz tili'].id,
      teacherId: teachers[2].id,
      level: 'Beginner',
      type: 'online',
      price: 199000,
      description: 'Grammar + speaking + listening: har hafta test va amaliyot.',
    })
  );
  courses.push(
    await upsertCourse(prisma, {
      title: 'Informatika — Frontend (React)',
      subjectId: subjectByName['Informatika'].id,
      teacherId: teachers[3].id,
      level: 'Intermediate',
      type: 'online',
      price: 399000,
      description: 'React, state, routing, API integration. Loyihalar bilan.',
    })
  );
  courses.push(
    await upsertCourse(prisma, {
      title: 'Kimyo — Asoslar',
      subjectId: subjectByName['Kimyo'].id,
      teacherId: teachers[4].id,
      level: 'Beginner',
      type: 'online',
      price: 250000,
      description: 'Atom, molekula, elementlar jadvali va reaksiyalar.',
    })
  );
  courses.push(
    await upsertCourse(prisma, {
      title: "Tarix — O'zbekiston tarixi (Oflayn)",
      subjectId: subjectByName['Tarix'].id,
      teacherId: teachers[5].id,
      level: 'Beginner',
      type: 'offline',
      price: 180000,
      description: 'Qadimgi davrdan hozirgacha: asosiy mavzular va testlar.',
    })
  );

  courses.push(
    await upsertCourse(prisma, {
      title: 'Biologiya — Anatomiya (Onlayn)',
      subjectId: subjectByName['Biologiya'].id,
      teacherId: teachers[1].id,
      level: 'Intermediate',
      type: 'online',
      price: 249000,
      description: 'Inson anatomiyasi: tizimlar, testlar, vizual tushuntirishlar.',
    })
  );
  courses.push(
    await upsertCourse(prisma, {
      title: 'Geografiya — Xarita va iqlim (Onlayn)',
      subjectId: subjectByName['Geografiya'].id,
      teacherId: teachers[5].id,
      level: 'Beginner',
      type: 'online',
      price: 149000,
      description: 'Xarita o‘qish, iqlim zonalari, tabiiy resurslar.',
    })
  );
  courses.push(
    await upsertCourse(prisma, {
      title: 'Ona tili — Imlo va nutq (Onlayn)',
      subjectId: subjectByName['Ona tili'].id,
      teacherId: teachers[5].id,
      level: 'Beginner',
      type: 'online',
      price: 99000,
      description: 'Imlo qoidalari, diktant, matn tahlili.',
    })
  );

  const courseVisuals = [
    ['Matematika', '📐', 'from-emerald-500 via-teal-600 to-teal-700'],
    ['Fizika', '⚛️', 'from-amber-500 via-orange-600 to-orange-700'],
    ['Ingliz tili', '🌐', 'from-blue-600 via-indigo-600 to-indigo-700'],
    ['Informatika', '💻', 'from-fuchsia-600 via-pink-600 to-rose-600'],
    ['Kimyo', '🧪', 'from-rose-500 via-red-600 to-red-700'],
    ['Tarix', '🏛️', 'from-sky-500 via-cyan-600 to-cyan-700'],
    ['Biologiya', '🧬', 'from-lime-500 via-green-600 to-emerald-700'],
    ['Geografiya', '🗺️', 'from-cyan-500 via-blue-600 to-blue-700'],
    ['Ona tili', '📖', 'from-violet-500 via-purple-600 to-purple-700'],
  ];
  const visualsBySubjectId = Object.fromEntries(
    courseVisuals.map(([name, icon, color]) => [subjectByName[name]?.id, { icon, color }])
  );
  for (const c of courses) {
    const visual = visualsBySubjectId[c.subjectId] || { icon: '📘', color: 'from-primary-500 via-indigo-600 to-accent-600' };
    await prisma.course.update({ where: { id: c.id }, data: visual });
    c.icon = visual.icon;
    c.color = visual.color;
  }

  const lessonsSeed = [
    { courseTitle: courses[0].title, title: "Qo'shish va ayirish", url: youtube.math[0] },
    { courseTitle: courses[0].title, title: "Ko'paytirish jadvali", url: youtube.math[1] },
    { courseTitle: courses[1].title, title: 'Tenglamalar: kirish', url: youtube.math[2] },
    { courseTitle: courses[2].title, title: 'Tezlik va vaqt', url: youtube.physics[0] },
    { courseTitle: courses[2].title, title: 'Newton qonunlari', url: youtube.physics[1] },
    { courseTitle: courses[3].title, title: 'Present Simple', url: youtube.english[0] },
    { courseTitle: courses[3].title, title: 'Listening practice', url: youtube.english[1] },
    { courseTitle: courses[4].title, title: 'React useState/useEffect', url: youtube.it[2] },
    { courseTitle: courses[4].title, title: 'Build a Todo app', url: youtube.it[1] },
    { courseTitle: courses[5].title, title: 'Atom tuzilishi', url: youtube.chemistry[0] },
    { courseTitle: courses[6].title, title: 'Amir Temur davri', url: youtube.history[0] },
    { courseTitle: courses[7].title, title: 'Nerv tizimi', url: youtube.biology[0] },
    { courseTitle: courses[8].title, title: 'Iqlim zonalari', url: 'https://www.youtube.com/watch?v=OQ7kFQ4oQzI' },
    { courseTitle: courses[9].title, title: 'Imlo: asosiy qoidalar', url: 'https://www.youtube.com/watch?v=3p2q1Kk0G6o' },
  ];
  const courseByTitle = Object.fromEntries(courses.map((c) => [c.title, c]));
  for (const l of lessonsSeed) {
    const c = courseByTitle[l.courseTitle];
    await upsertLesson(prisma, {
      courseId: c.id,
      title: l.title,
      type: 'video',
      videoUrl: l.url,
      liveLink: '',
    });
  }

  const nextMon = new Date();
  nextMon.setDate(nextMon.getDate() + ((1 + 7 - nextMon.getDay()) % 7));
  await prisma.schedule.createMany({
    data: [
      { courseId: courses[6].id, teacherId: teachers[5].id, locationId: locations[0].id, date: nextMon, time: '10:00', topic: 'Tarix: 1-dars' },
      { courseId: courses[6].id, teacherId: teachers[5].id, locationId: locations[1].id, date: new Date(nextMon.getTime() + 2 * 86400000), time: '14:00', topic: 'Tarix: 2-dars' },
      { courseId: courses[1].id, teacherId: teachers[0].id, locationId: locations[0].id, date: new Date(nextMon.getTime() + 86400000), time: '09:00', topic: 'Matematika: Algebra' },
      { courseId: courses[4].id, teacherId: teachers[3].id, locationId: locations[2].id, date: new Date(nextMon.getTime() + 3 * 86400000), time: '16:00', topic: 'React: API bilan ishlash' },
      { courseId: courses[3].id, teacherId: teachers[2].id, locationId: locations[1].id, date: new Date(nextMon.getTime() + 4 * 86400000), time: '11:00', topic: 'Speaking club' },
    ],
    skipDuplicates: true,
  });

  // Enroll students into multiple courses
  const enrollPairs = [
    [students[0], courses[0]],
    [students[0], courses[3]],
    [students[1], courses[1]],
    [students[1], courses[4]],
    [students[2], courses[2]],
    [students[2], courses[5]],
    [students[3], courses[3]],
    [students[3], courses[4]],
    [students[4], courses[6]],
    [students[5], courses[0]],
    [students[6], courses[5]],
    [students[7], courses[2]],
    [students[8], courses[7]],
    [students[9], courses[8]],
    [students[10], courses[9]],
    [students[11], courses[4]],
    [students[12], courses[1]],
    [students[13], courses[6]],
    ...students.slice(0, 15).map((s) => [s, courses[1]]),
    ...students.slice(15, 30).map((s) => [s, courses[4]]),
  ];
  for (const [u, c] of enrollPairs) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: u.id, courseId: c.id } },
      create: { userId: u.id, courseId: c.id, status: 'active' },
      update: { status: 'active' },
    });
  }

  // =======================
  // Tests: 200 questions per subject
  // Requirement: each subject must have enough Beginner/Intermediate/Advanced questions.
  // We'll generate ~equal distribution across levels.
  // =======================
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const optionTemplates = {
    Matematika: ['Tenglama yechimi to‘g‘ri topilgan', 'Faqat sonlar yig‘indisi olingan', 'Belgilar almashtirib yuborilgan', 'Masala sharti noto‘g‘ri talqin qilingan'],
    Fizika: ['Formula birliklari bilan to‘g‘ri qo‘llangan', 'Tezlik va vaqt aralashtirilgan', 'Kuch massaga teng deb olingan', 'Natija o‘lchovsiz yozilgan'],
    'Ingliz tili': ['Gap grammatik jihatdan to‘g‘ri tuzilgan', 'Fe’l zamoni noto‘g‘ri tanlangan', 'Artikl ishlatilmagan', 'So‘z tartibi buzilgan'],
    Informatika: ['Algoritm shartni to‘g‘ri bajaradi', 'O‘zgaruvchi e’lon qilinmagan', 'Loop cheksiz aylanadi', 'Funksiya qiymat qaytarmaydi'],
    Kimyo: ['Reaksiya tenglamasi muvozanatlangan', 'Element valentligi noto‘g‘ri olingan', 'Molekula formulasi almashtirilgan', 'Modda massasi hisoblanmagan'],
    Tarix: ['Voqea davri va sababi to‘g‘ri ko‘rsatilgan', 'Sana boshqa davrga tegishli', 'Shaxs noto‘g‘ri tanlangan', 'Hudud nomi adashtirilgan'],
    Biologiya: ['Organ vazifasi biologik jihatdan to‘g‘ri', 'Hujayra qismi noto‘g‘ri atalgan', 'Tizimlar aralashtirilgan', 'Jarayon bosqichi tushirib qoldirilgan'],
    Geografiya: ['Xarita belgisi va hudud to‘g‘ri mos keladi', 'Iqlim zonasi noto‘g‘ri tanlangan', 'Materik nomi adashtirilgan', 'Koordinata yo‘nalishi almashtirilgan'],
    'Ona tili': ['Imlo va tinish belgisi to‘g‘ri qo‘llangan', 'Qo‘shimcha noto‘g‘ri yozilgan', 'Gap bo‘lagi adashtirilgan', 'Uslubiy xato mavjud'],
  };
  const makeOptions = (subjectName, level, index) => {
    const templates = optionTemplates[subjectName] || ['To‘g‘ri javob mantiqan asoslangan', 'Birinchi chalg‘ituvchi javob', 'Ikkinchi chalg‘ituvchi javob', 'Uchinchi chalg‘ituvchi javob'];
    const suffix = ` (${level}, ${index})`;
    const opts = templates.map((text) => `${text}${suffix}`);
    const correct = opts[0];
    const shift = index % opts.length;
    return {
      options: [...opts.slice(shift), ...opts.slice(0, shift)],
      correctAnswer: correct,
    };
  };

  const testRows = [];
  for (const s of subjects) {
    const perLevel = Math.floor(200 / 3); // 66
    const remainder = 200 - perLevel * 3; // 2
    const perLevelCounts = [perLevel + 1, perLevel + 1, perLevel]; // 67,67,66

    for (let li = 0; li < 3; li++) {
      const lvl = levels[li];
      const count = perLevelCounts[li];
      for (let i = 1; i <= count; i++) {
        const answerSet = makeOptions(s.name, lvl, i);
        const qText = `${s.name} (${lvl}) savol #${i}: Quyidagilardan qaysi biri to'g'ri?`;
        testRows.push({
          subjectId: s.id,
          question: qText,
          options: answerSet.options,
          correctAnswer: answerSet.correctAnswer,
          level: lvl,
        });
      }
    }
  }

  // Bulk insert, ignore duplicates (unique: subjectId+question)
  await prisma.test.createMany({ data: testRows, skipDuplicates: true });
  for (const row of testRows) {
    await prisma.test.update({
      where: { subjectId_question: { subjectId: row.subjectId, question: row.question } },
      data: { options: row.options, correctAnswer: row.correctAnswer, level: row.level },
    });
  }
  for (const demoCourse of [courses[1], courses[4]]) {
    const demoQuestions = testRows
      .filter((row) => row.subjectId === demoCourse.subjectId)
      .slice(0, 30)
      .map((row) => ({
        ...row,
        question: `${demoCourse.title}: ${row.question}`,
        courseId: demoCourse.id,
        teacherId: demoCourse.teacherId,
      }));
    for (const row of demoQuestions) {
      await prisma.test.upsert({
        where: { subjectId_question: { subjectId: row.subjectId, question: row.question } },
        create: row,
        update: {
          courseId: row.courseId,
          teacherId: row.teacherId,
          options: row.options,
          correctAnswer: row.correctAnswer,
          level: row.level,
        },
      });
    }
  }

  await prisma.battle.upsert({
    where: { id: 'demo-teacher-battle-room' },
    create: {
      id: 'demo-teacher-battle-room',
      teacherId: courses[1].teacherId,
      courseId: courses[1].id,
      subjectId: courses[1].subjectId,
      title: 'Demo Matematika Battle',
      status: 'open',
      mode: 'battle',
      meta: {
        roomCode: 'DEMO15',
        courseId: courses[1].id,
        subjectId: courses[1].subjectId,
        players: students.slice(0, 5).map((s, i) => ({ userId: s.id, name: s.name, score: i === 0 ? 92 : 70 + i * 4, submittedAt: new Date().toISOString() })),
      },
    },
    update: {
      teacherId: courses[1].teacherId,
      courseId: courses[1].id,
      subjectId: courses[1].subjectId,
      title: 'Demo Matematika Battle',
    },
  });

  // Seed some test results for a few students
  await prisma.testResult.upsert({
    where: { userId_subjectId: { userId: students[0].id, subjectId: subjectByName['Matematika'].id } },
    create: { userId: students[0].id, subjectId: subjectByName['Matematika'].id, score: 85, totalQuestions: 10, level: 'Beginner' },
    update: { score: 85, totalQuestions: 10, level: 'Beginner' },
  });
  await prisma.testResult.upsert({
    where: { userId_subjectId: { userId: students[0].id, subjectId: subjectByName['Ingliz tili'].id } },
    create: { userId: students[0].id, subjectId: subjectByName['Ingliz tili'].id, score: 72, totalQuestions: 10, level: 'Intermediate' },
    update: { score: 72, totalQuestions: 10, level: 'Intermediate' },
  });

  const demoDiscountCampaign = await prisma.discountCampaign.upsert({
    where: { id: 'demo-battle-discount-campaign' },
    create: {
      id: 'demo-battle-discount-campaign',
      title: 'Battle g‘oliblari uchun 20% chegirma',
      description: 'Matematika battle/test natijasida yuqori ball olgan talabalar uchun.',
      courseId: courses[1].id,
      subjectId: courses[1].subjectId,
      type: 'percent',
      value: 20,
      maxWinners: 5,
      rules: { minScore: 70 },
      status: 'active',
      createdById: admin.id,
    },
    update: {
      courseId: courses[1].id,
      subjectId: courses[1].subjectId,
      value: 20,
      status: 'active',
      rules: { minScore: 70 },
    },
  });
  const demoDiscountAwards = [];
  for (const [i, student] of students.slice(0, 5).entries()) {
    const discountAmount = Math.round(Number(courses[1].price || 0) * 0.2);
    const award = await prisma.discountAward.upsert({
      where: { campaignId_userId_courseId: { campaignId: demoDiscountCampaign.id, userId: student.id, courseId: courses[1].id } },
      create: {
        campaignId: demoDiscountCampaign.id,
        userId: student.id,
        courseId: courses[1].id,
        status: i === 0 ? 'approved' : 'eligible',
        source: i === 4 ? 'manual' : 'auto',
        reason: i === 4 ? 'Admin qo‘lda qo‘shdi' : 'Battle/test score bo‘yicha',
        score: i === 0 ? 92 : 70 + i * 4,
        discountAmount,
      },
      update: {
        status: i === 0 ? 'approved' : 'eligible',
        source: i === 4 ? 'manual' : 'auto',
        discountAmount,
      },
    });
    demoDiscountAwards.push(award);
  }

  // Books (library)
  const booksSeed = [
    { title: 'Cambridge IELTS 17', author: 'Cambridge', category: 'Ingliz tili', description: 'Mock testlar va javoblar', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { title: 'Algebra asoslari', author: 'M. Mirzaaxmedov', category: 'Matematika', description: 'Algebra darsligi', fileUrl: 'https://www.orimi.com/pdf-test.pdf' },
    { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', category: 'Informatika', description: 'JS kitob', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { title: 'Fizika masalalar', author: 'I. Irodov', category: 'Fizika', description: 'Mashqlar to‘plami', fileUrl: 'https://www.orimi.com/pdf-test.pdf' },
  ];
  for (const b of booksSeed) {
    await upsertBook(prisma, b);
  }

  // Payments: mix pending and confirmed rows across days for cashier/admin analytics.
  const daysAgo = (n) => new Date(Date.now() - n * 86400000);
  const demoPayments = [
    { userId: students[0].id, courseId: courses[3].id, amount: 199000, method: 'Click', status: 'pending', createdAt: daysAgo(0) },
    { userId: students[1].id, courseId: courses[4].id, amount: 399000, method: 'Payme', status: 'pending', createdAt: daysAgo(1) },
    { userId: students[2].id, courseId: courses[5].id, amount: 250000, method: 'Naqd', status: 'pending', createdAt: daysAgo(2) },
    { userId: students[3].id, courseId: courses[8].id, amount: 149000, method: 'Click', status: 'pending', createdAt: daysAgo(3) },
    { userId: students[4].id, courseId: courses[6].id, amount: 180000, method: 'Payme', status: 'pending', createdAt: daysAgo(4) },
    { userId: students[5].id, courseId: courses[0].id, amount: 99000, method: 'Demo', status: 'confirmed', createdAt: daysAgo(1) },
    { userId: students[6].id, courseId: courses[5].id, amount: 250000, method: 'Naqd', status: 'confirmed', createdAt: daysAgo(5) },
    { userId: students[7].id, courseId: courses[2].id, amount: 150000, method: 'Click', status: 'confirmed', createdAt: daysAgo(7) },
    { userId: students[8].id, courseId: courses[7].id, amount: 249000, method: 'Payme', status: 'confirmed', createdAt: daysAgo(9) },
    {
      userId: students[0].id,
      courseId: courses[1].id,
      amount: Math.max(0, Number(courses[1].price || 0) - Number(demoDiscountAwards[0]?.discountAmount || 0)),
      originalAmount: Number(courses[1].price || 0),
      discountAmount: Number(demoDiscountAwards[0]?.discountAmount || 0),
      discountAwardId: demoDiscountAwards[0]?.id,
      method: 'Chegirma',
      status: 'pending',
      createdAt: daysAgo(0),
    },
  ];
  for (const payment of demoPayments) {
    await upsertPayment(prisma, payment);
  }
  const teacherBalances = new Map();
  for (const p of demoPayments.filter((x) => x.status === 'confirmed')) {
    const course = courses.find((c) => c.id === p.courseId);
    if (!course?.teacherId) continue;
    teacherBalances.set(course.teacherId, (teacherBalances.get(course.teacherId) || 0) + Math.floor(p.amount * 0.7));
  }
  for (const [teacherId, balance] of teacherBalances.entries()) {
    await prisma.user.update({ where: { id: teacherId }, data: { balance } });
  }

  // Parent-child links
  const pcPairs = [
    [parents[0], students[0]],
    [parents[0], students[1]],
    [parents[1], students[2]],
    [parents[2], students[3]],
  ];
  for (const [p, ch] of pcPairs) {
    await prisma.parentChild.upsert({
      where: { parentId_childId: { parentId: p.id, childId: ch.id } },
      create: { parentId: p.id, childId: ch.id },
      update: {},
    });
  }

  // Attendance samples (last 7 days for some students)
  for (let d = 0; d < 7; d++) {
    const day = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    for (const u of students.slice(0, 6)) {
      const note = JSON.stringify({ date: day, courseId: courses[0].id, type: 'student', markedBy: teachers[0].id });
      await upsertAttendance(prisma, {
        userId: u.id,
        status: d % 5 === 0 ? 'absent' : 'present',
        note,
        scheduleId: null,
      });
    }
  }

  // Messages: create minimal chat history
  const existingMsg = await prisma.message.findFirst({
    where: { senderId: teachers[2].id, receiverId: students[0].id },
  });
  if (!existingMsg) {
    await prisma.message.createMany({
      data: [
        { senderId: teachers[2].id, receiverId: students[0].id, text: 'Salom! Bugun homework bor.' },
        { senderId: students[0].id, receiverId: teachers[2].id, text: 'Assalomu alaykum ustoz, bajaraman.' },
      ],
    });
  }

  const directChat = await prisma.conversation.findFirst({
    where: { type: 'direct', members: { every: { userId: { in: [teachers[2].id, students[0].id] } } } },
    include: { members: true },
  });
  const conversation =
    directChat ||
    (await prisma.conversation.create({
      data: {
        type: 'direct',
        createdById: teachers[2].id,
        members: { create: [{ userId: teachers[2].id }, { userId: students[0].id }] },
      },
    }));
  const fileMessage = await prisma.message.findFirst({
    where: { conversationId: conversation.id, text: 'Dars fayli biriktirildi.' },
  });
  if (!fileMessage) {
    await prisma.message.create({
      data: {
        senderId: teachers[2].id,
        receiverId: students[0].id,
        conversationId: conversation.id,
        text: 'Dars fayli biriktirildi.',
        attachments: {
          create: {
            name: 'ielts-homework.pdf',
            url: 'https://www.orimi.com/pdf-test.pdf',
            mimeType: 'application/pdf',
            size: 102400,
          },
        },
      },
    });
  }
  await prisma.conversationInvite.upsert({
    where: { id: 'demo-pending-chat-invite' },
    create: {
      id: 'demo-pending-chat-invite',
      requesterId: students[1].id,
      receiverId: teachers[0].id,
      status: 'pending',
      message: 'Matematika bo‘yicha maslahat kerak.',
    },
    update: { status: 'pending' },
  });
  const group = await prisma.conversation.upsert({
    where: { id: 'demo-group-conversation' },
    create: {
      id: 'demo-group-conversation',
      type: 'group',
      title: 'React Frontend Guruhi',
      createdById: teachers[3].id,
      members: {
        create: [
          { userId: teachers[3].id, role: 'owner' },
          { userId: students[0].id },
          { userId: students[3].id },
        ],
      },
    },
    update: { title: 'React Frontend Guruhi' },
  });
  const groupMsg = await prisma.message.findFirst({ where: { conversationId: group.id, text: 'Bugun group muhokama: routing va API.' } });
  if (!groupMsg) {
    await prisma.message.create({
      data: {
        senderId: teachers[3].id,
        receiverId: students[0].id,
        conversationId: group.id,
        text: 'Bugun group muhokama: routing va API.',
      },
    });
  }

  for (const [student, course] of [
    [students[0], courses[0]],
    [students[1], courses[4]],
  ]) {
    await prisma.certificate.upsert({
      where: { userId_courseId: { userId: student.id, courseId: course.id } },
      create: { userId: student.id, courseId: course.id },
      update: {},
    });
  }

  for (const review of [
    { teacherId: teachers[0].id, studentId: students[0].id, rating: 5, comment: "Darslar juda tushunarli va amaliy." },
    { teacherId: teachers[2].id, studentId: students[1].id, rating: 4, comment: "Speaking mashg'ulotlari foydali bo'ldi." },
    { teacherId: teachers[3].id, studentId: students[3].id, rating: 5, comment: 'React loyihalari orqali yaxshi tushundim.' },
  ]) {
    await prisma.teacherReview.upsert({
      where: { teacherId_studentId: { teacherId: review.teacherId, studentId: review.studentId } },
      create: review,
      update: { rating: review.rating, comment: review.comment },
    });
  }

  for (const user of [students[0], teachers[0], cashier, reception]) {
    const existingNotification = await prisma.notification.findFirst({
      where: { userId: user.id, title: "Talim platformasiga xush kelibsiz" },
    });
    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Talim platformasiga xush kelibsiz",
          body: "Demo ma'lumotlar tayyor. Kabinet, kurslar, to'lovlar va testlarni tekshirib ko'ring.",
        },
      });
    }
  }

  for (const attempt of [
    { userId: students[0].id, mode: 'placement', score: 82, meta: { subject: 'Matematika', level: 'Intermediate' } },
    { userId: students[1].id, mode: 'battle', score: 67, meta: { subject: 'Ingliz tili', opponent: students[2].name } },
  ]) {
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: { userId: attempt.userId, mode: attempt.mode },
    });
    if (!existingAttempt) await prisma.quizAttempt.create({ data: attempt });
    else await prisma.quizAttempt.update({ where: { id: existingAttempt.id }, data: attempt });
  }

  // Settings defaults (telegram optional)
  await prisma.setting.upsert({
    where: { key: 'site_name' },
    create: { key: 'site_name', value: 'Talim' },
    update: { value: 'Talim' },
  });
  await prisma.setting.upsert({
    where: { key: 'brand_settings' },
    create: {
      key: 'brand_settings',
      value: {
        name: 'Talim',
        subtitle: 'Learn Platform',
        logoText: 'T',
        primaryColor: '#5a8aff',
        accentColor: '#8b5cf6',
        textStyle: 'gradient',
        animationEffect: 'glow',
      },
    },
    update: {},
  });
  await prisma.newsItem.upsert({
    where: { id: 'demo-news-quiz-battle' },
    create: {
      id: 'demo-news-quiz-battle',
      title: 'Quiz Battle haftaligi',
      body: 'Bu hafta diagnostika testlarida yuqori ball olgan talabalar uchun sovrinli musobaqa ochiq.',
      type: 'event',
      icon: '🏆',
      color: 'from-amber-500 to-orange-600',
      priority: 10,
      isPublished: true,
      audienceRoles: [],
    },
    update: {
      title: 'Quiz Battle haftaligi',
      body: 'Bu hafta diagnostika testlarida yuqori ball olgan talabalar uchun sovrinli musobaqa ochiq.',
      isPublished: true,
    },
  });
  await prisma.setting.upsert({
    where: { key: 'demo_seed_completed' },
    create: { key: 'demo_seed_completed', value: { completedAt: new Date().toISOString(), version: 1 } },
    update: { value: { completedAt: new Date().toISOString(), version: 1 } },
  });

  logCreds();
  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error(e);
  try {
    const prisma = getPrisma();
    await prisma.$disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});

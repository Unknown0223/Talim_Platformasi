export type Role =
  | "talaba"
  | "ustoz"
  | "admin"
  | "kassir"
  | "qabulxona"
  | "ota-ona";

export type Course = {
  id: string;
  title: string;
  subject: string;
  mode: "Onlayn" | "Oflayn";
  level: "Boshlang'ich" | "O'rta" | "Yuqori";
  teacher: string;
  teacherImage: string;
  rating: number;
  students: number;
  duration: string;
  price: number;
  color: string;
  emoji: string;
  description: string;
  accentColor: string;
};

export const courses: Course[] = [
  {
    id: "c1",
    title: "Ingliz tili — IELTS 7.5+ Intensive",
    subject: "Ingliz tili",
    mode: "Onlayn",
    level: "Yuqori",
    teacher: "Ozoda Karimova",
    teacherImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    rating: 4.9,
    students: 1280,
    duration: "12 hafta",
    price: 1200000,
    color: "from-blue-600 via-indigo-600 to-indigo-700",
    emoji: "🌐",
    description: "IELTS imtihonini yuqori ballga topshirishni istaysizmi? Ushbu intensiv kursda har haftada 4 ta modul (Reading, Writing, Listening, Speaking) bo'yicha mukammal bilim beriladi.",
    accentColor: "#3b82f6",
  },
  {
    id: "c2",
    title: "Matematika — Milliy Sertifikat & DTM",
    subject: "Matematika",
    mode: "Oflayn",
    level: "O'rta",
    teacher: "Bekzod Rahimov",
    teacherImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
    rating: 4.8,
    students: 940,
    duration: "16 hafta",
    price: 950000,
    color: "from-emerald-500 via-teal-600 to-teal-700",
    emoji: "📐",
    description: "Abutiriyentlar uchun Milliy sertifikat va DTM imtihonlariga eng samarali tizim. Nazariya va super-formula uslublari bilan testlarni soniyada yechish.",
    accentColor: "#10b981",
  },
  {
    id: "c3",
    title: "Fullstack JavaScript Web Development",
    subject: "IT",
    mode: "Onlayn",
    level: "Boshlang'ich",
    teacher: "Sardor Yusupov",
    teacherImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    rating: 4.7,
    students: 2150,
    duration: "24 hafta",
    price: 1500000,
    color: "from-fuchsia-600 via-pink-600 to-rose-600",
    emoji: "💻",
    description: "Noldan professional darajagacha veb dasturlashni o'rganing. HTML, CSS, JavaScript, React va Node.js texnologiyalari bilan o'z loyihalaringizni yarating.",
    accentColor: "#ec4899",
  },
  {
    id: "c4",
    title: "Fizika — Olimpiada & DTM darajasi",
    subject: "Fizika",
    mode: "Oflayn",
    level: "Yuqori",
    teacher: "Dilshod Tursunov",
    teacherImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
    rating: 4.9,
    students: 420,
    duration: "24 hafta",
    price: 1350000,
    color: "from-amber-500 via-orange-600 to-orange-700",
    emoji: "⚛️",
    description: "Klassik mexanika, kvant fizikasi va elektrodinamika bo'yicha chuqur bilimlar. Olimpiadalarda g'olib bo'lishni xohlovchilar uchun maxsus darslik.",
    accentColor: "#f59e0b",
  },
  {
    id: "c5",
    title: "Organik va Anorganik Kimyo",
    subject: "Kimyo",
    mode: "Onlayn",
    level: "O'rta",
    teacher: "Madina Yo'ldosheva",
    teacherImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    rating: 4.6,
    students: 680,
    duration: "14 hafta",
    price: 880000,
    color: "from-rose-500 via-red-600 to-red-700",
    emoji: "🧪",
    description: "Kimyoviy elementlar, reaksiyalar va laboratoriya ishlari. Tibbiyot institutlariga tayyorlanayotgan abituriyentlar uchun ideal tanlov.",
    accentColor: "#ef4444",
  },
  {
    id: "c6",
    title: "Ona tili va Adabiyot",
    subject: "Ona tili",
    mode: "Oflayn",
    level: "Boshlang'ich",
    teacher: "Nilufar Ahmedova",
    teacherImage: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80",
    rating: 4.8,
    students: 510,
    duration: "10 hafta",
    price: 600000,
    color: "from-violet-500 via-purple-600 to-purple-700",
    emoji: "📖",
    description: "O'zbek tili grammatikasi, adabiy asarlar tahlili va insho yozish san'ati. Ijodiy fikrlashni rivojlantiruvchi mukammal darslik.",
    accentColor: "#8b5cf6",
  },
  {
    id: "c7",
    title: "Biologiya — Tibbiyot asoslari",
    subject: "Biologiya",
    mode: "Onlayn",
    level: "Boshlang'ich",
    teacher: "Kamola Umarova",
    teacherImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    rating: 4.7,
    students: 340,
    duration: "12 hafta",
    price: 750000,
    color: "from-lime-500 via-green-600 to-emerald-700",
    emoji: "🧬",
    description: "Inson anatomiyasi, genetika, zoologiya va botanika bo'yicha abituriyentlar uchun mukammal darslar.",
    accentColor: "#84cc16",
  },
  {
    id: "c8",
    title: "O'zbekiston va Jahon Tarixi",
    subject: "Tarix",
    mode: "Oflayn",
    level: "Boshlang'ich",
    teacher: "Farhod Karimov",
    teacherImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    rating: 4.5,
    students: 280,
    duration: "18 hafta",
    price: 700000,
    color: "from-sky-500 via-cyan-600 to-cyan-700",
    emoji: "🏛️",
    description: "Miloddan avvalgi davrdan to eng yangi tarixgacha bo'lgan voqealar, xaritalar va tarixiy shaxslar hayoti.",
    accentColor: "#0ea5e9",
  },
];

export type Teacher = {
  id: string;
  name: string;
  subject: string;
  rating: number;
  students: number;
  experience: string;
  initials: string;
  color: string;
  imageUrl: string;
};

export const teachers: Teacher[] = [
  { id: "t1", name: "Ozoda Karimova", subject: "Ingliz tili", rating: 4.9, students: 1280, experience: "8 yil", initials: "OK", color: "from-blue-600 via-indigo-600 to-indigo-700", imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" },
  { id: "t2", name: "Bekzod Rahimov", subject: "Matematika", rating: 4.8, students: 940, experience: "12 yil", initials: "BR", color: "from-emerald-500 via-teal-600 to-teal-700", imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80" },
  { id: "t3", name: "Sardor Yusupov", subject: "IT", rating: 4.7, students: 2150, experience: "6 yil", initials: "SY", color: "from-fuchsia-600 via-pink-600 to-rose-600", imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80" },
  { id: "t4", name: "Dilshod Tursunov", subject: "Fizika", rating: 4.9, students: 420, experience: "15 yil", initials: "DT", color: "from-amber-500 via-orange-600 to-orange-700", imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80" },
  { id: "t5", name: "Madina Yo'ldosheva", subject: "Kimyo", rating: 4.6, students: 680, experience: "9 yil", initials: "MY", color: "from-rose-500 via-red-600 to-red-700", imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80" },
  { id: "t6", name: "Nilufar Ahmedova", subject: "Ona tili", rating: 4.8, students: 510, experience: "11 yil", initials: "NA", color: "from-violet-500 via-purple-600 to-purple-700", imageUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80" },
];

export type Lesson = {
  id: string;
  title: string;
  course: string;
  date: string;
  time: string;
  status: "Bugun" | "Ertaga" | "O'tkazilgan";
};

export const studentLessons: Lesson[] = [
  { id: "l1", title: "IELTS Reading Practice — Mock Test 12", course: "IELTS 7.5+ Intensive", date: "Bugun", time: "14:00", status: "Bugun" },
  { id: "l2", title: "Trigonometriya — sinus va kosinus", course: "Matematika — Milliy Sertifikat", date: "Bugun", time: "16:30", status: "Bugun" },
  { id: "l3", title: "React useState & useEffect hooks", course: "Fullstack JS Dev", date: "Ertaga", time: "10:00", status: "Ertaga" },
  { id: "l4", title: "Mexanika va dinamika asoslari", course: "Fizika — Olimpiada", date: "21-noyabr", time: "09:00", status: "O'tkazilgan" },
];

export type Book = {
  id: string;
  title: string;
  author: string;
  pages: number;
  size: string;
  category: string;
  emoji: string;
};

export const books: Book[] = [
  { id: "b1", title: "Cambridge IELTS 17 Official Guides", author: "Cambridge Press", pages: 184, size: "12 MB", category: "Ingliz tili", emoji: "📕" },
  { id: "b2", title: "Algebra va analiz asoslari — To'liq darslik", author: "M. Mirzaaxmedov", pages: 320, size: "18 MB", category: "Matematika", emoji: "📘" },
  { id: "b3", title: "Eloquent JavaScript 4th Edition", author: "Marijn Haverbeke", pages: 472, size: "9 MB", category: "Dasturlash", emoji: "📗" },
  { id: "b4", title: "Fizika kursi — I-II qismlar", author: "I. Irodov", pages: 280, size: "22 MB", category: "Fizika", emoji: "📙" },
  { id: "b5", title: "Organik va Noorganik Kimyo", author: "G. Solomons", pages: 612, size: "31 MB", category: "Kimyo", emoji: "📕" },
  { id: "b6", title: "O'tkan kunlar (Adabiy asar)", author: "Abdulla Qodiriy", pages: 358, size: "6 MB", category: "Adabiyot", emoji: "📚" },
];

export type ChatItem = {
  id: string;
  name: string;
  message: string;
  time: string;
  unread: number;
  initials: string;
  online: boolean;
  avatarUrl?: string;
};

export const chats: ChatItem[] = [
  { id: "ch1", name: "Ozoda Karimova", message: "Vazifani topshirdingizmi?", time: "12:40", unread: 2, initials: "OK", online: true, avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80" },
  { id: "ch2", name: "Frontend guruh suhbati", message: "Ali: keyingi dars qachon?", time: "11:20", unread: 5, initials: "FG", online: true, avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80" },
  { id: "ch3", name: "Bekzod Rahimov", message: "Ajoyib dars, davom eting!", time: "Kecha", unread: 0, initials: "BR", online: false, avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80" },
  { id: "ch4", name: "Admin Boshqaruv", message: "Oylik to'lov tasdiqlandi ✓", time: "Kecha", unread: 0, initials: "AD", online: false, avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80" },
];

export const subjects = [
  "Barchasi",
  "Ingliz tili",
  "Matematika",
  "IT",
  "Fizika",
  "Kimyo",
  "Ona tili",
  "Biologiya",
  "Tarix",
];

export const modes: ("Barchasi" | "Onlayn" | "Oflayn")[] = [
  "Barchasi",
  "Onlayn",
  "Oflayn",
];

export type Centre = {
  id: string;
  name: string;
  address: string;
  students: number;
  x: number; // % within map
  y: number;
};

export const centres: Centre[] = [
  { id: "m1", name: "Talim — Toshkent", address: "Yunusobod, Amir Temur 12", students: 1240, x: 52, y: 38 },
  { id: "m2", name: "Talim — Samarqand", address: "Registon ko'chasi 5", students: 620, x: 36, y: 56 },
  { id: "m3", name: "Talim — Buxoro", address: "Mustaqillik 18", students: 410, x: 24, y: 60 },
  { id: "m4", name: "Talim — Andijon", address: "Bog'ishamol 7", students: 530, x: 78, y: 46 },
  { id: "m5", name: "Talim — Namangan", address: "Uychi tumani", students: 380, x: 70, y: 38 },
];

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("uz-UZ").format(n) + " so'm";

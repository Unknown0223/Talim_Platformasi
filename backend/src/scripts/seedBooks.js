import 'dotenv/config';
import mongoose from 'mongoose';
import Book from '../models/Book.js';

const books = [
  // Darslik
  { title: 'Matematika - 10-sinf', author: 'T.Jumayev', description: 'Umumta\'lim maktablarining 10-sinfi uchun darslik.', category: 'Darslik', fileUrl: '#' },
  { title: 'Fizika - 11-sinf', author: 'P.Habibullayev', description: '11-sinf o\'quvchilari uchun chuqurlashtirilgan fizika darsligi.', category: 'Darslik', fileUrl: '#' },
  { title: 'Kimyo - 9-sinf', author: 'I.Asqarov', description: 'Anorganik kimyo asoslari bo\'yicha darslik.', category: 'Darslik', fileUrl: '#' },
  { title: 'Biologiya - 7-sinf', author: 'A.Zikiryoyev', description: 'Zoologiya asoslari bo\'yicha darslik.', category: 'Darslik', fileUrl: '#' },
  
  // Badiiy
  { title: 'O\'tkan kunlar', author: 'Abdulla Qodiriy', description: 'O\'zbek adabiyotining durdonasi, ilk roman.', category: 'Badiiy', fileUrl: '#' },
  { title: 'Mehrobdan chayon', author: 'Abdulla Qodiriy', description: 'Tarixiy roman.', category: 'Badiiy', fileUrl: '#' },
  { title: 'Dunyoning ishlari', author: 'O\'tkir Hoshimov', description: 'Insoniy tuyg\'ular haqida hikoyalar to\'plami.', category: 'Badiiy', fileUrl: '#' },
  { title: 'Ikki eshik orasi', author: 'O\'tkir Hoshimov', description: 'Urush va undan keyingi hayot haqida asar.', category: 'Badiiy', fileUrl: '#' },
  { title: 'Yulduzli tunlar', author: 'Pirimqul Qodirov', description: 'Bobur hayoti haqida tarixiy roman.', category: 'Badiiy', fileUrl: '#' },
  { title: 'Kecha va kunduz', author: 'Cho\'lpon', description: 'O\'zbek adabiyotidagi eng muhim asarlardan biri.', category: 'Badiiy', fileUrl: '#' },

  // Lug'at
  { title: 'Inglizcha-O\'zbekcha Lug\'at', author: 'Sh.Butayev', description: '50 000 dan ortiq so\'z va iboralar to\'plami.', category: 'Lug\'at', fileUrl: '#' },
  { title: 'Ruscha-O\'zbekcha Lug\'at', author: 'Z.Ma\'rufov', description: 'Katta hajmli ruscha-o\'zbekcha lug\'at.', category: 'Lug\'at', fileUrl: '#' },
  { title: 'O\'zbek tilining izohli lug\'ati', author: 'A.Madvaliyev', description: 'O\'zbek so\'zlarining ma\'nosi va kelib chiqishi.', category: 'Lug\'at', fileUrl: '#' },

  // Qo'llanma
  { title: 'English Grammar in Use', author: 'Raymond Murphy', description: 'Intermediate darajadagi o\'quvchilar uchun grammatika qo\'llanmasi.', category: 'Qo\'llanma', fileUrl: '#' },
  { title: 'Matematikadan masalalar to\'plami', author: 'M.Skanavi', description: 'Oliy o\'quv yurtlariga tayyorgarlik uchun masalalar to\'plami.', category: 'Qo\'llanma', fileUrl: '#' },
  { title: 'IELTS Vocabulary 8.5', author: 'Cambridge', description: 'IELTS imtihoniga tayyorlanuvchilar uchun lug\'at boyligi qo\'llanmasi.', category: 'Qo\'llanma', fileUrl: '#' },
  { title: 'JavaScript Essentials', author: 'Modern JS Team', description: 'JS dasturlash tili bo\'yicha to\'liq qo\'llanma.', category: 'Qo\'llanma', fileUrl: '#' }
];

async function seed() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talim';
    await mongoose.connect(uri);
    console.log('MongoDB ulandi');

    await Book.deleteMany({});
    console.log('Eski kitoblar o\'chirildi');

    await Book.insertMany(books);
    console.log(`${books.length} ta yangi kitob qo'shildi`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();

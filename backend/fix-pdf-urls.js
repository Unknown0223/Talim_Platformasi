import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const BookSchema = new mongoose.Schema({
  fileUrl: String,
  title: String
});

const Book = mongoose.model('Book', BookSchema);

async function fixPaths() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talim');
    console.log('MongoDBga ulandi');

    // Stabill va ochiq PDF havolasi (Google Drive yoki ochiq CDN)
    const STABLE_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    
    const result = await Book.updateMany({}, {
      $set: { fileUrl: STABLE_PDF }
    });

    console.log(`${result.modifiedCount} ta kitob havolasi yangilandi.`);
    process.exit(0);
  } catch (err) {
    console.error('Xatolik:', err);
    process.exit(1);
  }
}

fixPaths();

import 'dotenv/config';
import { connectDB } from './src/config/db.js';
import Book from './src/models/Book.js';

async function updateCovers() {
  await connectDB();
  const books = await Book.find();
  const covers = [
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80'
  ];

  for (let i = 0; i < books.length; i++) {
    await Book.findByIdAndUpdate(books[i]._id, { coverImage: covers[i % covers.length] });
  }
  
  console.log('Book covers updated to premium images.');
  process.exit(0);
}
updateCovers();

import { getPrisma } from '../lib/prisma.js';

export async function listBooks(req, res) {
  try {
    const prisma = getPrisma();
    const books = await prisma.book.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function addBook(req, res) {
  try {
    const prisma = getPrisma();
    const book = await prisma.book.create({
      data: {
        title: req.body.title,
        author: req.body.author || null,
        description: req.body.description || null,
        category: req.body.category || null,
        fileUrl: req.body.fileUrl || null,
      },
    });
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function updateBook(req, res) {
  try {
    const prisma = getPrisma();
    const book = await prisma.book.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.title ? { title: req.body.title } : {}),
        ...(req.body.author !== undefined ? { author: req.body.author } : {}),
        ...(req.body.description !== undefined ? { description: req.body.description } : {}),
        ...(req.body.category !== undefined ? { category: req.body.category } : {}),
        ...(req.body.fileUrl !== undefined ? { fileUrl: req.body.fileUrl } : {}),
      },
    });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function deleteBook(req, res) {
  try {
    const prisma = getPrisma();
    await prisma.book.delete({ where: { id: req.params.id } });
    res.json({ message: 'Kitob o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function downloadBook(req, res) {
  try {
    const prisma = getPrisma();
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).json({ message: 'Kitob topilmadi' });

    res.json({ url: book.fileUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getProgress(req, res) {
  try {
    // ReadingProgress modeli hozir Postgres schema’da yo‘q (tezkor migratsiya uchun).
    res.json({ currentPage: 1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function saveProgress(req, res) {
  try {
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

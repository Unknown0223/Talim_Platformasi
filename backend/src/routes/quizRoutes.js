import express from 'express';
import { getRandomQuestion, submitAnswer } from '../controllers/quizController.js';

const router = express.Router();

// GET /api/quiz?subjectId=...  -> returns a random question (without correctAnswer)
router.get('/', getRandomQuestion);

// POST /api/quiz/submit -> submit answer
router.post('/submit', submitAnswer);

export default router;

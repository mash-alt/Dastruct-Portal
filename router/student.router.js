import express from 'express';
import { addSubjects } from '../controller/student.controller.js';
import { authenticate, requireStudent } from '../middleware/auth.js';

const router = express.Router();

// Route for students to add subjects
router.post('/student/subjects', authenticate, requireStudent, addSubjects);

export default router;
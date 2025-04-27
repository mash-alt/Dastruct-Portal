import express from 'express';
import { addGrade } from '../controller/teacher.controller.js';
import { authenticate, requireTeacher } from '../middleware/auth.js';

const router = express.Router();

// Route for teachers to add or update grades for students in a subject
router.post('/teacher/subjects/grades', authenticate, requireTeacher, addGrade);

export default router;
import express from 'express';
import { 
  addSubjects, 
  enrollStudent, 
  getStudyLoad,
  getRecommendedSubjectsForStudent 
} from '../controller/student.controller.js';
import { authenticate, requireStudent } from '../middleware/auth.js';

const router = express.Router();

// Route for students to add subjects (without full enrollment)
router.post('/student/subjects', authenticate, requireStudent, addSubjects);

// Route for student enrollment
router.post('/student/enroll', authenticate, requireStudent, enrollStudent);

// Route to get student study load
router.get('/student/:studentId/studyload', authenticate, requireStudent, getStudyLoad);

// Route to get recommended subjects for next semester
router.get('/student/:studentId/recommendations', authenticate, requireStudent, getRecommendedSubjectsForStudent);

export default router;


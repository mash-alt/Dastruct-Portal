import express from 'express';
import { 
  getAcademicProgress,
  recordGrades,
  simulateAcademicProgression 
} from '../controller/academic.controller.js';
import { authenticate, requireTeacher, requireAny } from '../middleware/auth.js';

const router = express.Router();

// Route to get a student's academic progress (accessible by both students and teachers)
router.get('/academic/:studentId/progress', authenticate, requireAny(['Student', 'Teacher']), getAcademicProgress);

// Route to record grades (for teachers only)
router.post('/academic/:studentId/grades', authenticate, requireTeacher, recordGrades);

// Route to simulate academic progression (for debugging/testing)
router.post('/academic/simulate-progression', authenticate, requireAny(['Admin', 'Teacher']), simulateAcademicProgression);

export default router;

//Sample postman request for getAcademicProgress
// GET http://localhost:5000/api/academic/12345/progress    
// {
//     "studentId": "12345",
//     "semester": 1,
//     "yearLevel": 2,
//     "subjectCode": "CS101",
//}


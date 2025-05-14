import express from 'express';
import { 
  addGrade,
  getEnrolledStudentsByTeacher,
  getStudentsBySubject
} from '../controller/teacher.controller.js';
import { authenticate, requireTeacher } from '../middleware/auth.js';

const router = express.Router();

// Route for teachers to add or update grades for students in a subject
router.post('/teacher/subjects/grades', authenticate, requireTeacher, addGrade);

// Route for teachers to get all students enrolled in their subjects
// Can be filtered by specific subject with query parameters: ?subjectId=xyz or ?edpCode=ABC123
router.get('/teacher/enrolled-students', authenticate, requireTeacher, getEnrolledStudentsByTeacher);

// Routes for teachers to get students for a specific subject
router.get('/teacher/subject/:subjectId/students', authenticate, requireTeacher, getStudentsBySubject);
router.get('/teacher/subject/edp/:edpCode/students', authenticate, requireTeacher, getStudentsBySubject);

export default router;
import express from 'express';
import { 
  addSubject, 
  updateSubject, 
  deleteSubject, 
  getAllTeachers, 
  getAllStudents, 
  getAllSubjects,
  getFilteredSubjects, 
  assignSubjectToTeacher, 
  assignSubjectsToTeacher,
  getDashboardData,
  getTeacherAssignedSubjects,
  adminEnrollStudent,
  updateSubjectsYearLevelAndSemester
} from '../controller/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin-only routes for managing subjects
router.post('/admin/subjects', authenticate, requireAdmin, addSubject); // Add a subject
router.put('/admin/subjects/:edpCode', authenticate, requireAdmin, updateSubject); // Update a subject using edpCode
router.delete('/admin/subjects/:edpCode', authenticate, requireAdmin, deleteSubject); // Delete a subject using edpCode
router.get('/admin/subjects', authenticate, requireAdmin, getFilteredSubjects); // Get filtered subjects with pagination
router.get('/admin/all-subjects', authenticate, requireAdmin, getAllSubjects); // Get all subjects without pagination

// Dashboard route for admin statistics
router.get('/admin/dashboard-stat', authenticate, requireAdmin, getDashboardData);

// Admin-only routes for viewing teachers and students
router.get('/admin/teachers', authenticate, requireAdmin, getAllTeachers);
router.get('/admin/students', authenticate, requireAdmin, getAllStudents);

// Admin-only route for assigning a subject to a teacher
router.post('/admin/assign-subject', authenticate, requireAdmin, assignSubjectToTeacher);

// Admin-only route for assigning multiple subjects to a teacher
router.post('/admin/assign-subjects', authenticate, requireAdmin, assignSubjectsToTeacher);

// Admin-only route for getting assigned subjects for a specific teacher
router.get('/admin/teachers/:teacherName/subjects', authenticate, requireAdmin, getTeacherAssignedSubjects);

// Admin-only route for enrolling a student
router.post('/admin/student/enroll', authenticate, requireAdmin, adminEnrollStudent);

// Admin-only route for batch updating subject year levels and semesters
router.post('/admin/subjects/update-metadata', authenticate, requireAdmin, updateSubjectsYearLevelAndSemester);

export default router;
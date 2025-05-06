import express from 'express';
import { addSubject, updateSubject, deleteSubject, getAllTeachers, getAllStudents, getAllSubjects, assignSubjectToTeacher, assignSubjectsToTeacher } from '../controller/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin-only routes for managing subjects
router.post('/admin/subjects', authenticate, requireAdmin, addSubject); // Add a suxbject
router.put('/admin/subjects/:id', authenticate, requireAdmin, updateSubject); // Update a subject
router.delete('/admin/subjects/:id', authenticate, requireAdmin, deleteSubject); // Delete a subject
router.get('/admin/subjects', authenticate, requireAdmin, getAllSubjects); // Get all subjects

// Admin-only routes for viewing teachers and students
router.get('/admin/teachers', authenticate, requireAdmin, getAllTeachers);
router.get('/admin/students', authenticate, requireAdmin, getAllStudents);

// Admin-only route for assigning a subject to a teacher
router.post('/admin/assign-subject', authenticate, requireAdmin, assignSubjectToTeacher);

// Admin-only route for assigning multiple subjects to a teacher
router.post('/admin/assign-subjects', authenticate, requireAdmin, assignSubjectsToTeacher);

export default router;
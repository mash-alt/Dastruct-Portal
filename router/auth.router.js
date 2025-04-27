import express from 'express';
import {
  adminSignup,
  adminLogin,
  studentSignup,
  studentLogin,
  teacherSignup,
  teacherLogin,
  getMe,
} from '../controller/auth.controller.js';
import { authenticate, requireAdmin, requireTeacher, requireStudent } from '../middleware/auth.js';

const router = express.Router();

// ======================
// Authentication Routes
// ======================
router.post('/auth/admin/signup', adminSignup);
router.post('/auth/admin/login', adminLogin);
router.post('/auth/student/signup', studentSignup);
router.post('/auth/student/login', studentLogin);
router.post('/auth/teacher/signup', teacherSignup);
router.post('/auth/teacher/login', teacherLogin);

// ======================
// Protected User Routes
// ======================
router.get('/auth/me', authenticate, getMe);

// ======================
// Admin-Only Routes
// ======================
router.get('/admin/dashboard', authenticate, requireAdmin, (req, res) => {
  res.json({ 
    message: 'Admin Dashboard',
    user: req.user 
  });
});

// ======================
// Teacher-Only Routes
// ======================
router.get('/teacher/dashboard', authenticate, requireTeacher, (req, res) => {
  res.json({ 
    message: 'Teacher Dashboard',
    user: req.user 
  });
});

// ======================
// Student-Only Routes
// ======================
router.get('/student/dashboard', authenticate, requireStudent, (req, res) => {
  res.json({ 
    message: 'Student Dashboard',
    user: req.user 
  });
});

// ======================
// Common Protected Routes
// ======================
router.get('/profile', authenticate, (req, res) => {
  res.json({
    message: 'User Profile',
    user: req.user
  });
});

export default router;
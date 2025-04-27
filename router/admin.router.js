import express from 'express';
import { addSubject, updateSubject, deleteSubject } from '../controller/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin-only routes for managing subjects
router.post('/admin/subjects', authenticate, requireAdmin, addSubject); // Add a subject
router.put('/admin/subjects/:id', authenticate, requireAdmin, updateSubject); // Update a subject
router.delete('/admin/subjects/:id', authenticate, requireAdmin, deleteSubject); // Delete a subject

export default router;
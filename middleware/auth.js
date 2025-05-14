import jwt from 'jsonwebtoken';
import Admin from '../schema/admin.js';
import Student from '../schema/student.js';
import Teacher from '../schema/teacher.js';

const JWT_SECRET = process.env.JWT_SECRET || 'roch_plando_the_great';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Authentication required');

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check all user types in parallel for better performance
    const [admin, student, teacher] = await Promise.all([
      Admin.findById(decoded._id),
      Student.findById(decoded._id),
      Teacher.findById(decoded._id)
    ]);

    const user = admin || student || teacher;
    if (!user) throw new Error('User not found');

    req.user = user;
    req.token = token;
    req.role = user.constructor.modelName; // 'Admin', 'Student', or 'Teacher'
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

// Dynamic role checking middleware
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.role !== role) {
      return res.status(403).json({ error: `${role} access required` });
    }
    next();
  };
};

// Specific role middlewares (using the dynamic version)
export const requireAdmin = requireRole('Admin');
export const requireTeacher = requireRole('Teacher');
export const requireStudent = requireRole('Student');
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../schema/admin.js';
import Student from '../schema/student.js';
import Teacher from '../schema/teacher.js';

const JWT_SECRET = process.env.JWT_SECRET || 'roch-plando-the-great';
const SALT_ROUNDS = 10;

// Utility functions
const generateToken = (user) => {
  return jwt.sign(
    { 
      _id: user._id, 
      role: user.constructor.modelName 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Main auth logic
const authHandler = (Model, generateExtraFields = () => ({})) => {
  return {
    signup: async (req, res) => {
      try {
        const { name, email, password, phoneNumber, course, bday, address } = req.body; // Added course, bday, and address
        
        if (await Model.findOne({ email })) {
          return res.status(400).json({ error: 'Email already in use' });
        }

        const user = new Model({
          name,
          email,
          password: await hashPassword(password),
          ...generateExtraFields(),          ...(Model === Student && { 
            studentId: `ucb-${Math.floor(10000000 + Math.random() * 90000000)}`, // 8-digit number
            phoneNumber, 
            course, 
            bday, 
            address // Include additional fields for Student
          })
        });

        await user.save();
        const token = generateToken(user);
        
        res.status(201).json({ 
          user: { ...user.toObject(), password: undefined }, 
          token 
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },    login: async (req, res) => {
      try {
        const { email, password, studentId, username } = req.body;
        
        // For students, allow login by studentId or email
        let user;
        let loginIdentifier = email || username || studentId; // Support for various field names
        
        if (!loginIdentifier) {
          return res.status(400).json({ error: 'Please provide email, username, or studentId' });
        }
        
        if (!password) {
          return res.status(400).json({ error: 'Please provide a password' });
        }
        
        // Determine what kind of identifier was used (for better error messages)
        let identifierType = "credentials";
        if (email) identifierType = "email";
        else if (studentId) identifierType = "student ID";
        else if (username) identifierType = "username";
        
        if (Model === Student) {
          // Try to find by studentId first, then by email if no user found
          user = await Model.findOne({ 
            $or: [
              { studentId: loginIdentifier },
              { email: loginIdentifier }
            ] 
          });
        } else {
          // For non-student users (admin, teacher), search by email only
          user = await Model.findOne({ email: loginIdentifier });
        }
        
        // Separate error messages for user not found vs password mismatch
        if (!user) {
          return res.status(401).json({ error: `Invalid ${identifierType}` });
        }
        
        if (!(await bcrypt.compare(password, user.password))) {
          return res.status(401).json({ error: 'Invalid password' });
        }

        const token = generateToken(user);
        res.json({ 
          user: { ...user.toObject(), password: undefined },
          token 
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  };
};

// Export specific auth handlers
export const { signup: adminSignup, login: adminLogin } = authHandler(Admin);
export const { signup: studentSignup, login: studentLogin } = authHandler(Student);
export const { signup: teacherSignup, login: teacherLogin } = authHandler(Teacher);

export const getMe = (req, res) => {
  const { password, ...userWithoutPassword } = req.user.toObject();
  res.json(userWithoutPassword);
};

// Logout function
export const logout = (req, res) => {
  try {
    // Invalidate the token on the client side (e.g., remove it from localStorage or cookies)
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during logout.' });
  }
};

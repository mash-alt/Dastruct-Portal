import mongoose from "mongoose";
import { programs } from "../constants/PROGRAMS.js";

// Extract program codes for enum validation
const programCodes = programs.map(program => program.code);

const subjectSchema = new mongoose.Schema({
  edpCode: String,
  subjectName: String,
  units: Number,
  prerequisites: [String], // Array of prerequisite subject codes
  studentsEnrolled: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  teacherAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  grades: { // Map of studentId to an object containing midterm and final grades
    type: Map,
    of: {
      midtermGrade: Number,
      finalGrade: Number
    }
  },
  semester: {
    type: String,
    enum: ['First', 'Second', 'Summer']
  },
  yearLevel: {
    type: Number,
    enum: [1, 2, 3, 4] 
  },
  department: {
    type: String,
    enum: programCodes
  },
}, { timestamps: true });

export default mongoose.model('Subject', subjectSchema);
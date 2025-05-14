import mongoose from "mongoose";
import { programs } from "../constants/PROGRAMS.js";

const programCodes = programs.map(program => program.code);

// models/Student.js
const studentSchema = new mongoose.Schema({  name: String,
  email: String,
  password: String,
  studentId: String,
  bday: Date,
  idNumber: String,
  course: String,
  section: String,
  address: String,
  phoneNumber: String,  yearLevel: {
    type: Number,
    enum: [1, 2, 3, 4] // Assuming a 4-year program
  }, 
  semester: {
    type: String,
    enum: ['First', 'Second', 'Summer']
  },
  isEnrolled: {
    type: Boolean,
    default: false
  },  department: {
    type: String,
    enum: programCodes
  }, // Added phone number field
  enrolledSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  academicHistory: [{
    academicYear: String,
    semester: {
      type: String,
      enum: ['First', 'Second', 'Summer']
    },
    subjects: [{
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      edpCode: String,
      subjectName: String,
      units: Number,
      midtermGrade: Number,
      finalGrade: Number,
      remarks: String
    }]
  }]
}, 
{ timestamps: true });

export default mongoose.model('Student', studentSchema);

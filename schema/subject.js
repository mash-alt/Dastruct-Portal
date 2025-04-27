import mongoose from "mongoose";

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
  }
}, { timestamps: true });

export default mongoose.model('Subject', subjectSchema);
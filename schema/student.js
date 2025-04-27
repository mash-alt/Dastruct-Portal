import mongoose from "mongoose";

// models/Student.js
const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  studentId: String,
  bday: Date,
  idNumber: String,
  course: String,
  address: String,
  phoneNumber: String, // Added phone number field
  enrolledSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }]
}, 
{ timestamps: true });

export default mongoose.model('Student', studentSchema);

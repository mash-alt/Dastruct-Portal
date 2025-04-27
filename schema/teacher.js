import mongoose from "mongoose";

// models/Teacher.js
const teacherSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    assignedSubjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    }]
  }, { timestamps: true });
  
  export default mongoose.model('Teacher', teacherSchema);
  
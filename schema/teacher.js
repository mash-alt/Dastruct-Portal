import mongoose from "mongoose";
import { programs } from "../constants/PROGRAMS.js";

const programCodes = programs.map(program => program.code);

// models/Teacher.js
const teacherSchema = new mongoose.Schema({
    name: String,
    email: String,
    phoneNumber: String,
    department: String,
    password: String,
    department: {
    type: String,
    enum: programCodes
  },
    assignedSubjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    }]
  }, { timestamps: true });
  
  export default mongoose.model('Teacher', teacherSchema);
  
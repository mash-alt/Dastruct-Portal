import mongoose from "mongoose";

// models/Admin.js
const adminSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
  }, { timestamps: true });
  
  export default mongoose.model('Admin', adminSchema);
  
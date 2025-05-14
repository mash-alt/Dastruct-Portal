import { expect } from 'chai';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRouter from '../router/auth.router.js';
import studentRouter from '../router/student.router.js';
import Student from '../schema/student.js';
import Subject from '../schema/subject.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api', authRouter);
app.use('/api', studentRouter);

// For mock authentication - we'll just use the token from login rather than generating our own

describe('Student Routes Tests', function() {
  this.timeout(10000);
  let studentToken;
  let testStudent;
  let testSubjects = [];

  // Helper function to create test student
  const createTestStudent = async (name, email, password, department) => {
    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      console.log('Using existing student:', existingStudent._id);
      return existingStudent;
    }
    
    // Hash password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create and return the student
    const student = new Student({
      name,
      email,
      password: hashedPassword,
      course: department,
      department,
      yearLevel: 1,
      isEnrolled: false,
      phoneNumber: '09123456789',
      bday: '2000-01-01',
      address: 'Test Address',
      studentId: `TEST-${Math.floor(10000 + Math.random() * 90000)}`
    });
    
    await student.save();
    console.log('Created new student:', student._id);
    return student;
  };

  // Helper function to create test subjects
  const createTestSubjects = async (subjects) => {
    const createdSubjects = [];
    
    for (const subjectData of subjects) {
      // Check if subject already exists
      const existingSubject = await Subject.findOne({ edpCode: subjectData.edpCode });
      if (existingSubject) {
        createdSubjects.push(existingSubject);
        continue;
      }

      // Create the subject
      const subject = new Subject({
        subjectName: subjectData.name,
        edpCode: subjectData.edpCode,
        units: subjectData.units,
        yearLevel: subjectData.yearLevel,
        semester: subjectData.semester,
        department: subjectData.department,
        prerequisites: subjectData.prerequisites || []
      });
      
      await subject.save();
      createdSubjects.push(subject);
    }
    
    return createdSubjects;
  };

  before(async function() {
    try {
      this.timeout(30000); // Longer timeout for setup
      await mongoose.connect(process.env.CONN_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      console.log('Connected to MongoDB');

      // Clean up any test data
      await Student.deleteMany({ email: 'teststudent@example.com' });
      await Subject.deleteMany({ edpCode: /TST\d{3}/ });
      
      // Create test student
      testStudent = await createTestStudent(
        'Test Student', 
        'teststudent@example.com', 
        'Password123!', 
        'BSCS'
      );
      
      // Create test subjects (First year, First semester)
      testSubjects = await createTestSubjects([
        { name: 'Test Subject 1', edpCode: 'TST101', units: 3, yearLevel: 1, semester: 'First', department: 'BSCS' },
        { name: 'Test Subject 2', edpCode: 'TST102', units: 3, yearLevel: 1, semester: 'First', department: 'BSCS' },
        { name: 'Test Subject 3', edpCode: 'TST103', units: 3, yearLevel: 1, semester: 'First', department: 'BSCS' }
      ]);
      
      console.log('Test subjects created:', testSubjects.map(s => s._id));
      // We'll get a token via login in the Authentication tests
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  after(async () => {
    try {
      // Clean up test data
      await Student.deleteMany({ email: 'teststudent@example.com' });
      await Subject.deleteMany({ edpCode: /TST\d{3}/ });
      await mongoose.connection.close();
      console.log('Cleaned up test data and closed MongoDB connection');
    } catch (error) {
      console.error('Teardown error:', error);
    }
  });

  describe('Authentication', () => {
    it('should login with test student credentials and verify token', async function() {
      this.timeout(5000); // Increase timeout for this test
      
      // Sleep function to ensure token propagation
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      const res = await request(app)
        .post('/api/auth/student/login')
        .send({
          email: 'teststudent@example.com',
          password: 'Password123!'
        });
      
      console.log('Login status:', res.status);
      console.log('Login response body has token:', !!res.body.token);
      
      expect([200, 201]).to.include(res.status);
      expect(res.body).to.have.property('token');
      
      // Update token with the one from login
      studentToken = res.body.token;
      console.log('Token received:', studentToken ? 'Yes' : 'No');
      
      // Wait a moment to ensure token propagation
      await sleep(1000);
      
      // Now test the token with a protected route
      const authCheckRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);
      
      console.log('Auth check status:', authCheckRes.status);
      console.log('Auth check body:', authCheckRes.body);
      
      // If token verification fails, log the error
      if (authCheckRes.status !== 200) {
        console.error('Token verification failed. Token might be invalid or auth system not working properly.');
        console.error('Trying to continue tests anyway...');
      } else {
        console.log('Token successfully verified!');
      }
      
      expect([200, 201]).to.include(authCheckRes.status);
    });
  });

  describe('Student Enrollment', () => {
    it('should fail enrollment without authentication', async () => {
      const res = await request(app)
        .post('/api/student/enroll')
        .send({
          studentId: testStudent._id,
          academicYear: '2025-2026',
          semester: 'First'
        });
      
      expect(res.status).to.equal(401);
    });

    it('should enroll first year student automatically', async function() {
      this.timeout(5000);
      // First make sure student is not enrolled
      await Student.findByIdAndUpdate(testStudent._id, { 
        isEnrolled: false,
        enrolledSubjects: [] 
      });

      const res = await request(app)
        .post('/api/student/enroll')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: testStudent._id.toString(),
          academicYear: '2025-2026',
          semester: 'First'
        });
      
      console.log('Enroll auto status:', res.status);
      console.log('Enroll auto response:', res.body);
      
      expect([200, 201, 404]).to.include(res.status);
      
      // If subjects exist for auto-enrollment
      if (res.status === 200 || res.status === 201) {
        expect(res.body).to.have.property('message');
        expect(res.body).to.have.property('student');
        expect(res.body.student.isEnrolled).to.be.true;
      }
    });

    it('should enroll with specific subjects', async function() {
      this.timeout(5000);
      // First make sure student is not enrolled
      await Student.findByIdAndUpdate(testStudent._id, { 
        isEnrolled: false, 
        enrolledSubjects: [] 
      });
      
      const res = await request(app)
        .post('/api/student/enroll')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: testStudent._id.toString(),
          subjectIds: testSubjects.map(subject => subject._id.toString()),
          academicYear: '2025-2026',
          semester: 'First'
        });
      
      console.log('Specific enroll status:', res.status);
      console.log('Specific enroll response:', res.body);
      
      expect([200, 201]).to.include(res.status);
      if (res.status === 200 || res.status === 201) {
        expect(res.body).to.have.property('student');
        expect(res.body.student.isEnrolled).to.be.true;
        expect(res.body).to.have.property('enrolledSubjects');
        expect(res.body.enrolledSubjects).to.be.an('array');
      }
    });
  });

  describe('Adding Subjects', () => {
    it('should add subjects to enrolled student', async function() {
      this.timeout(5000);
      // Create an additional subject
      const additionalSubjects = await createTestSubjects([
        { name: 'Test Subject 4', edpCode: 'TST104', units: 3, yearLevel: 1, semester: 'Second', department: 'BSCS' }
      ]);
      
      const res = await request(app)
        .post('/api/student/subjects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: testStudent._id.toString(),
          subjectIds: [additionalSubjects[0]._id.toString()]
        });
      
      console.log('Add subjects status:', res.status);
      console.log('Add subjects response:', res.body);
      
      expect([200, 201]).to.include(res.status);
    });
  });

  describe('Getting Study Load', () => {
    it('should get student study load', async () => {
      const res = await request(app)
        .get(`/api/student/${testStudent._id}/studyload`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      console.log('Study load status:', res.status);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('studyLoad');
    });
    
    it('should reject unauthorized access to study load', async () => {
      const res = await request(app)
        .get(`/api/student/${testStudent._id}/studyload`); // No token provided
      
      expect(res.status).to.equal(401);
    });
  });
});

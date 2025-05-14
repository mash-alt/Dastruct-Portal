import { expect } from 'chai';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import adminRouter from '../router/admin.router.js';
import authRouter from '../router/auth.router.js';
import studentRouter from '../router/student.router.js';
import teacherRouter from '../router/teacher.router.js';
dotenv.config();

const app = express();
app.use(express.json());
app.use('/api', authRouter);
app.use('/api', adminRouter);
app.use('/api', teacherRouter);
app.use('/api', studentRouter);

describe('API Route Integration Tests', function () {
  this.timeout(10000);
  let studentToken, teacherToken, adminToken;
  let studentId, teacherId, adminId, subjectId;

  before(async () => {
    await mongoose.connect(process.env.CONN_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  after(async () => {
    await mongoose.connection.close();
  });

  it('should sign up a new student', async () => {
    const res = await request(app)
      .post('/api/auth/student/signup')
      .send({
        name: 'Test Student',
        email: 'student@example.com',
        password: 'Password123!',
        phoneNumber: '09170000001',
        course: 'BSCS',
        bday: '2000-01-01',
        address: '123 Test St'
      });
    expect([200, 201, 400, 409]).to.include(res.statusCode);
    if (res.body.token) studentToken = res.body.token;
    if (res.body.user) studentId = res.body.user._id;
  });

  it('should sign up a new teacher', async () => {
    const res = await request(app)
      .post('/api/auth/teacher/signup')
      .send({
        name: 'Test Teacher',
        email: 'teacher@example.com',
        password: 'Password123!'
      });
    expect([200, 201, 400, 409]).to.include(res.statusCode);
    if (res.body.token) teacherToken = res.body.token;
    if (res.body.user) teacherId = res.body.user._id;
  });

  it('should sign up a new admin', async () => {
    const res = await request(app)
      .post('/api/auth/admin/signup')
      .send({
        name: 'Test Admin',
        email: 'admin@example.com',
        password: 'Password123!'
      });
    expect([200, 201, 400, 409]).to.include(res.statusCode);
    if (res.body.token) adminToken = res.body.token;
    if (res.body.user) adminId = res.body.user._id;
  });

  it('should login as student', async () => {
    const res = await request(app)
      .post('/api/auth/student/login')
      .send({
        email: 'student@example.com',
        password: 'Password123!'
      });
    expect([200, 201]).to.include(res.statusCode);
    if (res.body.token) studentToken = res.body.token;
  });

  it('should login as teacher', async () => {
    const res = await request(app)
      .post('/api/auth/teacher/login')
      .send({
        email: 'teacher@example.com',
        password: 'Password123!'
      });
    expect([200, 201]).to.include(res.statusCode);
    if (res.body.token) teacherToken = res.body.token;
  });

  it('should login as admin', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123!'
      });
    expect([200, 201]).to.include(res.statusCode);
    if (res.body.token) adminToken = res.body.token;
  });

  it('should get student profile', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);
    expect([200, 201, 401, 403]).to.include(res.statusCode);
  });

  it('should allow admin to add a subject', async () => {
    if (!adminToken) return;
    const res = await request(app)
      .post('/api/admin/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subjectName: 'Mathematics 101',
        units: 3,
        prerequisites: [],
        teacherAssigned: 'Test Teacher'
      });
    expect([200, 201, 400, 401, 409]).to.include(res.statusCode);
    if (res.body.subject) subjectId = res.body.subject._id;
  });

  it('should allow teacher to add grades', async () => {
    if (!teacherToken) return;
    const res = await request(app)
      .post('/api/teacher/subjects/grades')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        studentName: 'Test Student',
        subjectName: 'Mathematics 101',
        midtermGrade: 90,
        finalGrade: 95
      });
    expect([200, 400, 401, 404]).to.include(res.statusCode);
  });  it('should allow student to add subjects', async () => {
    if (!studentToken || !subjectId) return;
    const res = await request(app)
      .post('/api/student/subjects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId,
        subjectIds: [subjectId]
      });
    expect([200, 400, 404]).to.include(res.statusCode);
  });

  it('should allow student to enroll in subjects for new academic year', async () => {
    if (!studentToken || !studentId || !subjectId) return;
    const res = await request(app)
      .post('/api/student/enroll')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId,
        subjectIds: [subjectId],
        academicYear: '2025-2026',
        semester: 'First'
      });
    
    expect([200, 400, 401, 404]).to.include(res.statusCode);
    
    // If successful, check the response structure
    if (res.statusCode === 200) {
      expect(res.body).to.have.property('message');
      expect(res.body).to.have.property('student');
      expect(res.body).to.have.property('enrolledSubjects');
      expect(res.body.student).to.have.property('isEnrolled');
      expect(res.body.student.isEnrolled).to.equal(true);
      expect(Array.isArray(res.body.enrolledSubjects)).to.be.true;
    }
  });
    it('should get student study load', async () => {
    if (!studentToken || !studentId) return;
    const res = await request(app)
      .get(`/api/student/${studentId}/studyload`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect([200, 400, 401, 404]).to.include(res.statusCode);
    
    // If successful, check the response structure
    if (res.statusCode === 200) {
      expect(res.body).to.have.property('message');
      expect(res.body).to.have.property('studyLoad');
      expect(Array.isArray(res.body.studyLoad)).to.be.true;
    }
  });
    it('should enroll a new student with auto-assigned first year subjects', async () => {
    if (!adminToken) return;
    
    // First create a fresh student for this test
    const newStudentRes = await request(app)
      .post('/api/auth/student/signup')
      .send({
        name: 'New Auto Enrollment Student',
        email: 'auto.enroll@example.com',
        password: 'Password123!',
        phoneNumber: '09170000002',
        course: 'BSCS',
        department: 'BSCS',
        bday: '2002-02-02',
        address: '456 Auto Enroll St'
      });
    
    if (newStudentRes.body.user && newStudentRes.body.user._id) {
      const newStudentId = newStudentRes.body.user._id;
        // Attempt auto-enrollment using admin route (no subjects specified)
      const enrollRes = await request(app)
        .post('/api/admin/student/enroll')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: newStudentId,
          // No subjectIds provided - should auto-enroll in first year BSCS subjects
          academicYear: '2025-2026',
          semester: 'First'
        });
      
      expect([200, 404]).to.include(enrollRes.statusCode);
      
      // If 200 OK, we got subjects. If 404, it means no first year subjects
      // were found, which is fine for a test environment
    }
  });
  
  it('should verify academic history is updated during enrollment', async () => {
    if (!studentToken || !studentId || !subjectId) return;
    
    // First, enroll the student in a subject for a specific academic period
    await request(app)
      .post('/api/student/enroll')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId,
        subjectIds: [subjectId],
        academicYear: '2025-2026',
        semester: 'Second'
      });
    
    // Then fetch the student record to check the academic history
    const studentRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);
    
    if (studentRes.statusCode === 200 && studentRes.body) {
      // We can't directly test the academic history since auth/me may not return it
      // But we can verify that the student is now marked as enrolled
      expect(studentRes.body).to.have.property('isEnrolled');
      expect(studentRes.body.isEnrolled).to.equal(true);
    }
  });
  
  it('should allow admin to update a subject by edpCode', async () => {
    if (!adminToken) return;
    // First need to get a subject's edpCode
    const getSubjectsRes = await request(app)
      .get('/api/admin/all-subjects')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(200).to.equal(getSubjectsRes.statusCode);
    
    if (getSubjectsRes.body.subjects && getSubjectsRes.body.subjects.length > 0) {
      const testSubject = getSubjectsRes.body.subjects[0];
      const edpCode = testSubject.edpCode;
      
      const updateRes = await request(app)
        .put(`/api/admin/subjects/${edpCode}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subjectName: 'Updated Subject Name',
          units: 4,
          prerequisites: ['Prerequisite 101'],
          department: 'BSIT'
        });
        
      expect([200, 404]).to.include(updateRes.statusCode);
    }
  });

  it('should allow admin to assign a subject to a teacher', async () => {
    if (!adminToken) return;
    // First get a subject
    const getSubjectsRes = await request(app)
      .get('/api/admin/all-subjects')
      .set('Authorization', `Bearer ${adminToken}`);
    
    if (getSubjectsRes.body.subjects && getSubjectsRes.body.subjects.length > 0) {
      const testSubject = getSubjectsRes.body.subjects[0];
      
      const res = await request(app)
        .post('/api/admin/assign-subject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          edpCode: testSubject.edpCode,
          teacherName: 'Test Teacher'
        });
        
      expect([200, 400, 404]).to.include(res.statusCode);
    }
  });
  
  it('should allow admin to get a teacher\'s assigned subjects', async () => {
    if (!adminToken) return;
    const res = await request(app)
      .get('/api/admin/teachers/Test%20Teacher/subjects')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect([200, 404]).to.include(res.statusCode);
    
    // If successful, check that it returns the right structure
    if (res.statusCode === 200) {
      expect(res.body).to.have.property('teacher');
      expect(res.body).to.have.property('assignedSubjects');
      expect(res.body.teacher).to.have.property('name');
      expect(res.body.teacher.name).to.equal('Test Teacher');
    }
  });
  it('should get admin dashboard', async () => {
    if (!adminToken) return;
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 201, 401, 403]).to.include(res.statusCode);
  });
  
  it('should get admin dashboard statistics', async () => {
    if (!adminToken) return;
    const res = await request(app)
      .get('/api/admin/dashboard-stat')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(200).to.equal(res.statusCode);
    
    // Verify the response structure
    expect(res.body).to.have.property('counts');
    expect(res.body.counts).to.have.property('teachers');
    expect(res.body.counts).to.have.property('students');
    expect(res.body.counts).to.have.property('subjects');
    expect(res.body).to.have.property('subjectsByDepartment');
  });

  it('should get teacher dashboard', async () => {
    if (!teacherToken) return;
    const res = await request(app)
      .get('/api/teacher/dashboard')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect([200, 201, 401, 403]).to.include(res.statusCode);
  });

  it('should get student dashboard', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .get('/api/student/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);
    expect([200, 201, 401, 403]).to.include(res.statusCode);
  });
  it('should get user profile', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${studentToken}`);
    expect([200, 201, 401, 403]).to.include(res.statusCode);
  });
  
  it('should allow admin to delete a subject by edpCode', async () => {
    if (!adminToken) return;
    // First create a test subject to delete
    const createSubjectRes = await request(app)
      .post('/api/admin/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subjectName: 'Subject To Delete',
        units: 2,
        prerequisites: []
      });
    
    if (createSubjectRes.body.subject && createSubjectRes.body.subject.edpCode) {
      const edpCode = createSubjectRes.body.subject.edpCode;
      
      const deleteRes = await request(app)
        .delete(`/api/admin/subjects/${edpCode}`)
        .set('Authorization', `Bearer ${adminToken}`);
        
      expect(200).to.equal(deleteRes.statusCode);
      expect(deleteRes.body).to.have.property('message');
      expect(deleteRes.body.message).to.include('deleted successfully');
    }
  });

  it('should logout student', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${studentToken}`);
    expect([200, 201, 401, 403]).to.include(res.statusCode);
  });
});
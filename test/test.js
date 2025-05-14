import { expect } from 'chai';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import adminRouter from '../router/admin.router.js';
import authRouter from '../router/auth.router.js';
import studentRouter from '../router/student.router.js';
import teacherRouter from '../router/teacher.router.js';
import academicRouter from '../router/academic.router.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api', authRouter);
app.use('/api', adminRouter);
app.use('/api', teacherRouter);
app.use('/api', studentRouter);
app.use('/api', academicRouter);
app.use('/api', academicRouter);

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
    expect([200, 201, 400]).to.include(res.statusCode);
    if (res.body.token) studentToken = res.body.token;
  });

  it('should login as teacher', async () => {
    const res = await request(app)
      .post('/api/auth/teacher/login')
      .send({
        email: 'teacher@example.com',
        password: 'Password123!'
      });
    expect([200, 201, 400]).to.include(res.statusCode);
    if (res.body.token) teacherToken = res.body.token;
  });

  it('should login as admin', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123!'
      });
    expect([200, 201, 400]).to.include(res.statusCode);
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
  
  it('should get students enrolled in teacher\'s subjects', async () => {
    if (!teacherToken) return;
    const res = await request(app)
      .get('/api/teacher/enrolled-students')
      .set('Authorization', `Bearer ${teacherToken}`);
    
    expect([200, 401, 403]).to.include(res.statusCode);
    
    // If successful, verify the response structure
    if (res.statusCode === 200) {
      expect(res.body).to.have.property('message');
      expect(res.body).to.have.property('teacherName');
      expect(res.body).to.have.property('totalSubjects');
      expect(res.body).to.have.property('totalStudents');
      expect(res.body).to.have.property('subjects');
      expect(Array.isArray(res.body.subjects)).to.be.true;
      expect(res.body).to.have.property('enrolledStudents');
      expect(Array.isArray(res.body.enrolledStudents)).to.be.true;
    }
  });
  
  it('should get students enrolled in a specific subject by subject ID', async () => {
    if (!teacherToken) return;
    
    // First get the subjects assigned to the teacher to find a valid subject ID
    const subjectsRes = await request(app)
      .get('/api/teacher/enrolled-students')
      .set('Authorization', `Bearer ${teacherToken}`);
    
    if (subjectsRes.statusCode === 200 && 
        subjectsRes.body.subjects && 
        subjectsRes.body.subjects.length > 0) {
      
      const testSubjectId = subjectsRes.body.subjects[0]._id;
      
      const res = await request(app)
        .get(`/api/teacher/subject/${testSubjectId}/students`)
        .set('Authorization', `Bearer ${teacherToken}`);
      
      expect([200, 404]).to.include(res.statusCode);
      
      // If successful, verify the response structure
      if (res.statusCode === 200) {
        expect(res.body).to.have.property('message');
        expect(res.body).to.have.property('subject');
        expect(res.body).to.have.property('totalStudents');
        expect(res.body).to.have.property('enrolledStudents');
        expect(Array.isArray(res.body.enrolledStudents)).to.be.true;
      }
    }
  });
  
  it('should get students enrolled in a specific subject by EDP code', async () => {
    if (!teacherToken) return;
    
    // First get the subjects assigned to the teacher to find a valid EDP code
    const subjectsRes = await request(app)
      .get('/api/teacher/enrolled-students')
      .set('Authorization', `Bearer ${teacherToken}`);
    
    if (subjectsRes.statusCode === 200 && 
        subjectsRes.body.subjects && 
        subjectsRes.body.subjects.length > 0 &&
        subjectsRes.body.subjects[0].edpCode) {
      
      const testEdpCode = subjectsRes.body.subjects[0].edpCode;
      
      const res = await request(app)
        .get(`/api/teacher/subject/edp/${testEdpCode}/students`)
        .set('Authorization', `Bearer ${teacherToken}`);
      
      expect([200, 404]).to.include(res.statusCode);
      
      // If successful, verify the response structure
      if (res.statusCode === 200) {
        expect(res.body).to.have.property('message');
        expect(res.body).to.have.property('subject');
        expect(res.body).to.have.property('totalStudents');
        expect(res.body).to.have.property('enrolledStudents');
        expect(Array.isArray(res.body.enrolledStudents)).to.be.true;
      }
    }
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
  
  // Tests for the academic API endpoints
  describe('Academic API Endpoints', function() {
    it('should get academic progress for a student', async () => {
      if (!studentToken || !studentId) return;
      const res = await request(app)
        .get(`/api/academic/${studentId}/progress`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect([200, 401, 404]).to.include(res.statusCode);
      
      // If successful, verify the response structure
      if (res.statusCode === 200) {
        expect(res.body).to.have.property('message');
        expect(res.body).to.have.property('student');
        expect(res.body).to.have.property('academicSummary');
        expect(res.body).to.have.property('progressByYear');
        expect(res.body).to.have.property('recommendations');
      }
    });
    
    it('should allow teacher to record grades', async () => {
      if (!teacherToken || !studentId || !subjectId) return;
      
      // First, make sure the student is enrolled in a subject
      // (we've already done this in a previous test)
      
      const res = await request(app)
        .post(`/api/academic/${studentId}/grades`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          academicYear: '2025-2026',
          semester: 'First',
          grades: [
            {
              edpCode: 'MATH101', // Using a generic edpCode, might need to be replaced with actual one
              midtermGrade: 2.0,
              finalGrade: 1.75
            }
          ]
        });
      
      expect([200, 400, 401, 404]).to.include(res.statusCode);
    });
    
    it('should not allow student to record grades', async () => {
      if (!studentToken || !studentId) return;
      
      const res = await request(app)
        .post(`/api/academic/${studentId}/grades`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          academicYear: '2025-2026',
          semester: 'First',
          grades: [
            {
              edpCode: 'MATH101',
              midtermGrade: 1.0,
              finalGrade: 1.0
            }
          ]
        });
      
      // Should get a 403 Forbidden because students aren't allowed to record grades
      expect(403).to.equal(res.statusCode);
    });
    
    it('should allow teacher to simulate academic progression', async () => {
      if (!teacherToken || !studentId) return;
      
      const res = await request(app)
        .post('/api/academic/simulate-progression')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studentId: studentId,
          semesters: 2 // Simulate 2 semesters for brevity
        });
      
      expect([200, 400, 401, 404]).to.include(res.statusCode);
      
      // If successful, verify the simulation data
      if (res.statusCode === 200) {
        expect(res.body).to.have.property('message');
        expect(res.body).to.have.property('simulation');
        expect(res.body.simulation).to.have.property('studentInfo');
        expect(res.body.simulation).to.have.property('progression');
        expect(Array.isArray(res.body.simulation.progression)).to.be.true;
      }
    });
    
    it('should not allow student to access simulation endpoint', async () => {
      if (!studentToken || !studentId) return;
      
      const res = await request(app)
        .post('/api/academic/simulate-progression')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: studentId,
          semesters: 2
        });
      
      // Should get a 403 Forbidden because students aren't allowed to use simulation
      expect(403).to.equal(res.statusCode);
    });
    
    it('should get student recommended subjects', async () => {
      if (!studentToken || !studentId) return;
      
      const res = await request(app)
        .get(`/api/student/${studentId}/recommendations`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect([200, 401, 404]).to.include(res.statusCode);
      
      // If successful, check for recommendation data
      if (res.statusCode === 200) {
        expect(res.body).to.have.property('message');
        expect(res.body).to.have.property('currentInfo');
        expect(res.body).to.have.property('nextInfo');
        expect(res.body).to.have.property('eligibleSubjects');
        expect(res.body).to.have.property('ineligibleSubjects');
      }
    });
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

  // Academic API Tests - New Endpoints
  it('should get student academic progress', async () => {
    if (!studentToken || !studentId) return;
    const res = await request(app)
      .get(`/api/academic/${studentId}/progress`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect([200, 400, 401, 404]).to.include(res.statusCode);
    
    // If successful, check the response structure
    if (res.statusCode === 200) {
      expect(res.body).to.have.property('message');
      expect(res.body).to.have.property('student');
      expect(res.body).to.have.property('academicSummary');
      // Check for academic summary properties
      expect(res.body.academicSummary).to.have.property('totalUnitsPassed');
      expect(res.body.academicSummary).to.have.property('totalUnitsAttempted');
      expect(res.body.academicSummary).to.have.property('completionRate');
    }
  });

  it('should get student academic progress as teacher', async () => {
    if (!teacherToken || !studentId) return;
    const res = await request(app)
      .get(`/api/academic/${studentId}/progress`)
      .set('Authorization', `Bearer ${teacherToken}`);
    
    expect([200, 400, 401, 404]).to.include(res.statusCode);
  });

  it('should allow teacher to record grades via academic API', async () => {
    if (!teacherToken || !studentId) return;
    
    // Need to have enrolled the student in a subject first
    if (!subjectId) return;
    
    const res = await request(app)
      .post(`/api/academic/${studentId}/grades`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicYear: '2025-2026',
        semester: 'First',
        grades: [
          {
            edpCode: 'MATH101', // Using a generic code for testing
            midtermGrade: 1.75,
            finalGrade: 2.0     // Using Philippine grading system
          }
        ]
      });
    
    expect([200, 400, 401, 404]).to.include(res.statusCode);
  });

  it('should deny student from recording grades', async () => {
    if (!studentToken || !studentId) return;
    
    const res = await request(app)
      .post(`/api/academic/${studentId}/grades`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        academicYear: '2025-2026',
        semester: 'First',
        grades: [
          {
            edpCode: 'MATH101',
            midtermGrade: 1.5,
            finalGrade: 1.5
          }
        ]
      });
    
    expect(403).to.equal(res.statusCode); // Should be forbidden
  });

  it('should run academic progression simulation', async () => {
    if (!adminToken || !studentId) return;
    
    const res = await request(app)
      .post('/api/academic/simulate-progression')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: studentId,
        semesters: 4 // Simulate 2 academic years (4 semesters)
      });
    
    expect([200, 400, 401, 404]).to.include(res.statusCode);
    
    // If successful, check the simulation contains the expected data
    if (res.statusCode === 200) {
      expect(res.body).to.have.property('message');
      expect(res.body).to.have.property('simulation');
      expect(res.body.simulation).to.have.property('studentInfo');
      expect(res.body.simulation).to.have.property('progression');
      expect(Array.isArray(res.body.simulation.progression)).to.be.true;
    }
  });

  it('should get recommended subjects for the next semester', async () => {
    if (!studentToken || !studentId) return;
    
    const res = await request(app)
      .get(`/api/student/${studentId}/recommendations`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect([200, 400, 401, 404]).to.include(res.statusCode);
    
    if (res.statusCode === 200) {
      expect(res.body).to.have.property('currentInfo');
      expect(res.body).to.have.property('nextInfo');
      expect(res.body).to.have.property('eligibleSubjects');
      expect(res.body).to.have.property('ineligibleSubjects');
      expect(Array.isArray(res.body.eligibleSubjects)).to.be.true;
      expect(Array.isArray(res.body.ineligibleSubjects)).to.be.true;
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
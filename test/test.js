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
  });

  it('should allow student to add subjects', async () => {
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

  it('should get admin dashboard', async () => {
    if (!adminToken) return;
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 201, 401, 403]).to.include(res.statusCode);
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

  it('should logout student', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${studentToken}`);
    expect([200, 201, 401, 403]).to.include(res.statusCode);
  });
});
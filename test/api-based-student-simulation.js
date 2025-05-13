// Enhanced student-progression-simulation.js with API integration
// This script simulates and tests the API endpoints for student progression
import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
import Student from '../schema/student.js';
import Subject from '../schema/subject.js';
import { getRecommendedSubjects } from '../service/recommendation.service.js';
import { maxUnitsPerSemester } from '../constants/PROGRAMS.js';
import studentRouter from '../router/student.router.js';
import academicRouter from '../router/academic.router.js';
import authMiddleware from '../middleware/auth.js';

// Load environment variables
dotenv.config();

// Sample grades for random assignment
const passingGrades = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0];
const failingGrade = 5.0;

// Create a test Express app
const app = express();
app.use(express.json());

// Mount the routers for testing
app.use('/api', studentRouter);
app.use('/api', academicRouter);

// Setup test server
const PORT = 5151;
let server;

/**
 * Function to simulate API-based student progression through multiple semesters
 */
async function runAPIBasedSimulation() {
  try {
    console.log("Starting API-based Student Progression Simulation...");
    
    // Connect to the database
    await mongoose.connect(process.env.CONN_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    
    // Create a test user and token for authentication
    console.log("Creating test student...");
    const testStudent = await createTestStudent();
    const token = createTestToken(testStudent);
    
    // Now simulate API calls
    console.log("\n--- SIMULATING STUDENT ENROLLMENT AND PROGRESSION ---");
    
    // 1. Start with a clean first-year student
    console.log("\n--- YEAR 1, SEMESTER 1 ---");
    const firstYearSubjects = await getFirstYearFirstSemSubjects(testStudent.department);
    
    // 2. Enroll the student in first semester subjects
    console.log("\nEnrolling student in first semester subjects...");
    const enrollmentResult = await enrollStudentViaAPI(
      testStudent._id, 
      firstYearSubjects.map(s => s._id), 
      token
    );
    console.log(`Enrolled in ${enrollmentResult.enrolledSubjects.length} subjects`);
    
    // 3. Record grades for first semester
    console.log("\nRecording grades for first semester...");
    const firstSemGrades = generateRandomGrades(firstYearSubjects);
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    
    await recordGradesViaAPI(
      testStudent._id,
      {
        academicYear,
        semester: 'First',
        grades: firstSemGrades
      },
      token
    );
    
    // 4. Get academic progress
    console.log("\nRetrieving academic progress after first semester...");
    const progressAfterFirstSem = await getAcademicProgressViaAPI(testStudent._id, token);
    printAcademicSummary(progressAfterFirstSem);
    
    // 5. Get recommendations for second semester
    console.log("\nGetting recommendations for second semester...");
    const recommendationsForSecondSem = await getRecommendationsViaAPI(testStudent._id, token);
    printRecommendations(recommendationsForSecondSem);
    
    // Continue simulation for more semesters...
    console.log("\n--- YEAR 1, SEMESTER 2 ---");
    // Add code here for second semester enrollment and beyond
    
    // Run a full progression simulation
    console.log("\n--- RUNNING FULL ACADEMIC PROGRESSION SIMULATION ---");
    const simulationResult = await simulateProgressionViaAPI(
      { studentId: testStudent._id, semesters: 6 }, // Simulate 3 years (6 semesters)
      token
    );
    
    console.log(`\nSimulation completed with ${simulationResult.simulation.progression.length} semesters`);
    console.log("Final academic state:");
    console.log(`Year Level: ${simulationResult.simulation.progression[simulationResult.simulation.progression.length - 1].nextInfo.yearLevel}`);
    console.log(`Semester: ${simulationResult.simulation.progression[simulationResult.simulation.progression.length - 1].nextInfo.semester}`);
    
  } catch (error) {
    console.error("Error in API simulation:", error);
  } finally {
    // Close the connections
    console.log("\nClosing connections...");
    await mongoose.connection.close();
    if (server) server.close();
    console.log("Simulation completed");
  }
}

// API HELPER FUNCTIONS

/**
 * Make an enrollment API request
 */
async function enrollStudentViaAPI(studentId, subjectIds, token) {
  const response = await fetch(`http://localhost:${PORT}/api/student/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      studentId,
      subjectIds
    })
  });
  
  if (!response.ok) {
    throw new Error(`Enrollment failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Make a record grades API request
 */
async function recordGradesViaAPI(studentId, gradeData, token) {
  const response = await fetch(`http://localhost:${PORT}/api/academic/${studentId}/grades`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(gradeData)
  });
  
  if (!response.ok) {
    throw new Error(`Recording grades failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get academic progress via API
 */
async function getAcademicProgressViaAPI(studentId, token) {
  const response = await fetch(`http://localhost:${PORT}/api/academic/${studentId}/progress`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Getting academic progress failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get recommendations via API
 */
async function getRecommendationsViaAPI(studentId, token) {
  const response = await fetch(`http://localhost:${PORT}/api/student/${studentId}/recommendations`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Getting recommendations failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Run a simulation via API
 */
async function simulateProgressionViaAPI(simulationData, token) {
  const response = await fetch(`http://localhost:${PORT}/api/academic/simulate-progression`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(simulationData)
  });
  
  if (!response.ok) {
    throw new Error(`Simulation failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Create a test student for simulation
 */
async function createTestStudent() {
  // Delete existing test student if any
  await Student.deleteOne({ email: 'api-simulation@example.com' });
  
  // Create a new student
  const student = new Student({
    name: 'API Simulation Student',
    email: 'api-simulation@example.com',
    password: 'password123', // Would be hashed in a real scenario
    studentId: `api-${Math.floor(10000000 + Math.random() * 90000000)}`,
    yearLevel: 1,
    department: 'BSIT',
    phoneNumber: '09123456789',
    isEnrolled: false
  });
  
  await student.save();
  return student;
}

/**
 * Create a test JWT token
 */
function createTestToken(user) {
  // This is a simplified version - in a real app you'd use jwt.sign
  return `test_token_for_${user._id}`;
}

/**
 * Get first year subjects
 */
async function getFirstYearFirstSemSubjects(department) {
  return await Subject.find({
    department: department,
    yearLevel: 1,
    semester: 'First'
  });
}

/**
 * Generate random grades for subjects
 */
function generateRandomGrades(subjects, failRate = 0.2) {
  return subjects.map(subject => {
    const shouldFail = Math.random() < failRate;
    const finalGrade = shouldFail ? failingGrade : passingGrades[Math.floor(Math.random() * passingGrades.length)];
    
    return {
      edpCode: subject.edpCode,
      midtermGrade: finalGrade, // Using same grade for simplicity
      finalGrade: finalGrade
    };
  });
}

/**
 * Print academic summary
 */
function printAcademicSummary(progress) {
  console.log("\n--- ACADEMIC SUMMARY ---");
  console.log(`Student: ${progress.student.name}`);
  console.log(`Year Level: ${progress.student.yearLevel}`);
  console.log(`Department: ${progress.student.department}`);
  console.log("\nUnit Completion:");
  console.log(`- Passed: ${progress.academicSummary.totalUnitsPassed} units`);
  console.log(`- Failed: ${progress.academicSummary.totalUnitsFailed} units`);
  console.log(`- Attempted: ${progress.academicSummary.totalUnitsAttempted} units`);
  console.log(`- Completion Rate: ${progress.academicSummary.completionRate}`);
}

/**
 * Print recommendations
 */
function printRecommendations(recommendations) {
  console.log("\n--- SUBJECT RECOMMENDATIONS ---");
  console.log(`Current: Year ${recommendations.currentInfo.yearLevel}, ${recommendations.currentInfo.semester} semester`);
  console.log(`Next: Year ${recommendations.nextInfo.yearLevel}, ${recommendations.nextInfo.semester} semester`);
  console.log("\nEligible Subjects:");
  
  if (recommendations.eligibleSubjects.length === 0) {
    console.log("None");
  } else {
    recommendations.eligibleSubjects.forEach((item, index) => {
      console.log(`${index + 1}. ${item.subject.subjectName} (${item.subject.edpCode})`);
    });
  }
}

// Start the test server and run the simulation
server = app.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}`);
  await runAPIBasedSimulation();
});

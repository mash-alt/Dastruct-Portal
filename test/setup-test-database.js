<<<<<<< HEAD
=======
// setup-test-database.js
// Script to populate the test database with subjects for testing
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Subject from '../schema/subject.js';
import { programs } from '../constants/PROGRAMS.js';

// Load environment variables
dotenv.config();

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup test database with subjects
 */
async function setupTestDatabase() {
  try {
    console.log("Setting up test database...");
    
    // Connect to the database
    await mongoose.connect(process.env.CONN_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
    
    // Check if we already have subjects
    const subjectCount = await Subject.countDocuments();
    if (subjectCount > 0) {
      console.log(`Database already has ${subjectCount} subjects. Skipping population.`);
      console.log("If you want to reset the database, run with --force flag.");
      
      // Check if --force flag is provided
      if (process.argv.includes('--force')) {
        console.log("Force flag detected. Clearing existing subjects...");
        await Subject.deleteMany({});
        console.log("Subjects cleared.");
      } else {
        return;
      }
    }
    
    // Load JSON subjects data if available
    try {
      // Try to load from bsit_subjects.json
      const subjectsFilePath = path.join(__dirname, 'bsit_subjects.json');
      console.log(`Trying to load subjects from ${subjectsFilePath}...`);
      
      const data = await fs.readFile(subjectsFilePath, 'utf8');
      const subjects = JSON.parse(data);
      
      // Insert subjects
      console.log(`Inserting ${subjects.length} subjects from JSON file...`);
      await Subject.insertMany(subjects);
      console.log(`Successfully inserted ${subjects.length} subjects`);
      
      return;
    } catch (err) {
      console.log("Could not load subjects from JSON file:", err.message);
      console.log("Creating sample subjects instead...");
    }
    
    // Create sample subjects if JSON loading failed
    await createSampleSubjects();
    
  } catch (error) {
    console.error("Error setting up test database:", error);
  }
  // Don't close the connection here, let the test runner manage connections
  // This prevents MongoDB connection pool closing errors when multiple tests run
  console.log("Database setup completed");
}

/**
 * Create sample subjects for testing
 */
async function createSampleSubjects() {
  console.log("Creating sample subjects for BSIT curriculum...");
  
  // Find BSIT program
  const bsitProgram = programs.find(p => p.code === 'BSIT') || 
                     { code: 'BSIT', name: 'Bachelor of Science in Information Technology' };
  
  // First year subjects
  const firstYearFirstSem = [
    {
      edpCode: 'GE101',
      subjectName: 'Communication Skills 1',
      units: 3,
      department: 'BSIT',
      yearLevel: 1,
      semester: 'First',
      prerequisites: []
    },
    {
      edpCode: 'MATH101',
      subjectName: 'College Algebra',
      units: 3,
      department: 'BSIT',
      yearLevel: 1,
      semester: 'First',
      prerequisites: []
    },
    {
      edpCode: 'CS101',
      subjectName: 'Introduction to Computing',
      units: 3,
      department: 'BSIT',
      yearLevel: 1,
      semester: 'First',
      prerequisites: []
    },
    {
      edpCode: 'IT101',
      subjectName: 'Computer Hardware Fundamentals',
      units: 3,
      department: 'BSIT',
      yearLevel: 1,
      semester: 'First',
      prerequisites: []
    }
  ];
  
  const firstYearSecondSem = [
    {
      edpCode: 'GE102',
      subjectName: 'Communication Skills 2',
      units: 3,
      department: 'BSIT',
      yearLevel: 1,
      semester: 'Second',
      prerequisites: ['GE101']
    },
    {
      edpCode: 'MATH102',
      subjectName: 'Trigonometry',
      units: 3,
      department: 'BSIT',
      yearLevel: 1,
      semester: 'Second',
      prerequisites: ['MATH101']
    },
    {
      edpCode: 'CS102',
      subjectName: 'Programming 1',
      units: 3,
      department: 'BSIT',
      yearLevel: 1,
      semester: 'Second',
      prerequisites: ['CS101']
    },
    {
      edpCode: 'IT102',
      subjectName: 'Operating Systems',
      units: 3,
      department: 'BSIT',
      yearLevel: 1,
      semester: 'Second',
      prerequisites: ['IT101']
    }
  ];
  
  // Second year subjects
  const secondYearFirstSem = [
    {
      edpCode: 'CS201',
      subjectName: 'Data Structures and Algorithms',
      units: 3,
      department: 'BSIT',
      yearLevel: 2,
      semester: 'First',
      prerequisites: ['CS102']
    },
    {
      edpCode: 'IT201',
      subjectName: 'Database Management Systems',
      units: 3,
      department: 'BSIT',
      yearLevel: 2,
      semester: 'First',
      prerequisites: ['CS102']
    },
    {
      edpCode: 'IT202',
      subjectName: 'Web Development',
      units: 3,
      department: 'BSIT',
      yearLevel: 2,
      semester: 'First',
      prerequisites: ['CS102']
    },
    {
      edpCode: 'MATH201',
      subjectName: 'Discrete Mathematics',
      units: 3,
      department: 'BSIT',
      yearLevel: 2,
      semester: 'First',
      prerequisites: ['MATH102']
    }
  ];
  
  const secondYearSecondSem = [
    {
      edpCode: 'CS202',
      subjectName: 'Object-Oriented Programming',
      units: 3,
      department: 'BSIT',
      yearLevel: 2,
      semester: 'Second',
      prerequisites: ['CS201']
    },
    {
      edpCode: 'IT203',
      subjectName: 'Advanced Database Systems',
      units: 3,
      department: 'BSIT',
      yearLevel: 2,
      semester: 'Second',
      prerequisites: ['IT201']
    },
    {
      edpCode: 'NET201',
      subjectName: 'Computer Networks',
      units: 3,
      department: 'BSIT',
      yearLevel: 2,
      semester: 'Second',
      prerequisites: ['IT101']
    },
    {
      edpCode: 'SE201',
      subjectName: 'Software Engineering',
      units: 3,
      department: 'BSIT',
      yearLevel: 2,
      semester: 'Second',
      prerequisites: ['CS201']
    }
  ];
  
  // All subjects to insert
  const allSubjects = [
    ...firstYearFirstSem,
    ...firstYearSecondSem,
    ...secondYearFirstSem,
    ...secondYearSecondSem
  ];
  
  // Insert subjects
  await Subject.insertMany(allSubjects);
  console.log(`Successfully created ${allSubjects.length} sample subjects`);
}

// Run the setup function
setupTestDatabase();
>>>>>>> c4256c6ae5bb829affc20506b801983daac0aa01

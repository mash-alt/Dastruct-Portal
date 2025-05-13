// populate-subjects.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Subject from '../schema/subject.js';
import { addSubject } from '../controller/admin.controller.js';

dotenv.config();

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generateEdpCode function from admin.controller to maintain consistency
const generateEdpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Ensures a 6-digit number
};

// Function to parse subject name from code
function getSubjectNameFromCode(code) {
  // Map of subject codes to readable names
  const subjectNames = {
    'eng100': 'English Communication Skills 1',
    'eng101': 'English Communication Skills 2',
    'socio101': 'Introduction to Sociology',
    'socio102': 'Society and Culture',
    'math100': 'College Algebra',
    'math101': 'Trigonometry',
    'psych101': 'Introduction to Psychology',
    'hist101': 'Philippine History',
    'hum101': 'Introduction to Humanities',
    'rizal101': 'Life and Works of Rizal',
    'entrep101': 'Entrepreneurship',
    'sts101': 'Science, Technology and Society',
    'philo101': 'Introduction to Philosophy',
    'lit11': 'Literature',
    'pe101': 'Physical Education 1',
    'pe102': 'Physical Education 2',
    'pe103': 'Physical Education 3',
    'pe104': 'Physical Education 4',
    'nstp101': 'National Service Training Program 1',
    'nstp102': 'National Service Training Program 2',
    'cc-intcom11': 'Introduction to Computing',
    'cc-comprog11': 'Computer Programming 1',
    'cc-comprog12': 'Computer Programming 2',
    'cc-discret12': 'Discrete Mathematics',
    'cc-digilog21': 'Digital Logic Design',
    'cc-ooprog21': 'Object-Oriented Programming',
    'it-sad21': 'Systems Analysis and Design',
    'cc-acctg21': 'Accounting Principles',
    'cc-twrite21': 'Technical Writing',
    'cc-quameth22': 'Quantitative Methods',
    'it-platech22': 'Platform Technologies',
    'cc-appsdev22': 'Application Development',
    'cc-datastruc22': 'Data Structures and Algorithms',
    'cc-datacom22': 'Data Communications',
    'it-webdev11': 'Web Development',
    'it-imdbsys31': 'Information Management and Database Systems 1',
    'it-imdbsys32': 'Information Management and Database Systems 2',
    'it-network31': 'Networking 1',
    'it-testqua31': 'Software Testing and Quality Assurance',
    'cc-hci31': 'Human-Computer Interaction',
    'cc-rescom31': 'Research in Computing 1',
    'it-infosec32': 'Information Security',
    'it-sysarch32': 'Systems Architecture',
    'cc-techno32': 'Technopreneurship',
    'it-intprog32': 'Integrative Programming',
    'it-sysadmin32': 'Systems Administration',
    'it-cpstone40': 'Capstone Project',
    'cc-pract40': 'Practicum',
    'it-el1': 'IT Elective 1',
    'it-el2': 'IT Elective 2',
    'it-el3': 'IT Elective 3',
    'it-el4': 'IT Elective 4',
    'it-fre1': 'Free Elective 1',
    'it-fre2': 'Free Elective 2',
    'it-fre3': 'Free Elective 3',
    'it-fre4': 'Free Elective 4'
  };
  
  return subjectNames[code] || `Course ${code.toUpperCase()}`;
}

// Parse curriculum data from JSON
async function populateSubjects() {
  try {
    // Connect to MongoDB using the same approach as server.js
    const conn_string = process.env.CONN_STRING;
    
    if (!conn_string) {
      console.error('Error: CONN_STRING is not defined in .env file');
      console.log('Make sure you have a .env file with CONN_STRING defined');
      console.log('Example: CONN_STRING=mongodb://localhost:27017/PortalData');
      process.exit(1);
    }
    
    console.log(`Connecting to MongoDB at: ${conn_string}`);
    
    await mongoose.connect(conn_string, {
      useNewURLParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing subjects if needed
    await Subject.deleteMany({});
    console.log('Cleared existing subjects');
    
    // Load the JSON curriculum data
    const jsonFilePath = path.join(__dirname, 'bsit_subjects.json');
    console.log(`Loading curriculum data from ${jsonFilePath}`);
    
    // Read the JSON file
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    
    // Parse the JSON data (remove comments if present)
    const cleanJsonData = jsonData.replace(/^\s*\/\/.*$/gm, '');
    const curriculumData = JSON.parse(cleanJsonData);
    
    // Process curriculum data from JSON
    const subjects = {};
    
    // Map year levels from string to number
    const yearMap = {
      'firstYear': 1,
      'secondYear': 2,
      'thirdYear': 3,
      'fourthYear': 4
    };
    
    // Map semesters from string to proper format
    const semesterMap = {
      'firstSem': 'First',
      'secondSem': 'Second',
      'summerSem': 'Summer'
    };
    
    // Process each year level
    Object.entries(curriculumData.curriculum).forEach(([yearKey, yearData]) => {
      const yearLevel = yearMap[yearKey];
      
      // Process each semester within this year
      Object.entries(yearData).forEach(([semKey, semData]) => {
        const semester = semesterMap[semKey];
        
        // Process each subject within this semester
        semData.subjects.forEach(subject => {
          const subjectCode = subject.subjectCode;
          const units = subject.units;
          const isElective = subject.isElective;
          const isMajor = subject.isMajor;
          const prerequisites = subject.prerequisites || [];
          
          subjects[subjectCode] = {
            subjectCode,
            units,
            isElective,
            isMajor,
            prerequisites,
            yearLevel,
            semester
          };
        });
      });
    });    // Create subjects in the database - using approach similar to admin.controller.js
    const subjectsToCreate = Object.values(subjects).map(subject => {
      // Create the subject document
      const newSubject = {
        edpCode: subject.subjectCode, // Use the subject code as the EDP code for easier reference
        subjectName: getSubjectNameFromCode(subject.subjectCode),
        units: subject.units,
        prerequisites: subject.prerequisites || [],
        studentsEnrolled: [], // Empty array
        teacherAssigned: null, // No teacher assigned initially
        grades: new Map(), // Empty grades Map
        department: 'BSIT', // Set department to BSIT
        semester: subject.semester, // Include semester information
        yearLevel: subject.yearLevel // Include year level information
      };
      
      return newSubject;
    });

    const result = await Subject.insertMany(subjectsToCreate);
    console.log(`Successfully added ${result.length} subjects to the database`);
    
    // Print a sample of what was added
    console.log('Sample subjects:');
    for (let i = 0; i < Math.min(5, result.length); i++) {
      console.log(`${result[i].subjectName} (${result[i].edpCode}): ${result[i].units} units, Year ${result[i].yearLevel}, ${result[i].semester} Semester`);
    }
    
    console.log('...');
    console.log(`Total subjects created: ${result.length}`);
    
    // Print subject distribution by year and semester
    const distribution = result.reduce((acc, subject) => {
      const key = `Year ${subject.yearLevel}, ${subject.semester} Semester`;
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    }, {});
    
    console.log('\nSubject distribution by year and semester:');
    Object.entries(distribution).forEach(([key, count]) => {
      console.log(`${key}: ${count} subjects`);
    });
      // Output additional analytics about the curriculum
    const majorSubjects = result.filter(subject => subject.isMajor);
    const nonMajorSubjects = result.filter(subject => !subject.isMajor);
    const electiveSubjects = result.filter(subject => subject.isElective);
    
    console.log('\nCurriculum Analysis:');
    console.log(`Major Subjects: ${majorSubjects.length}`);
    console.log(`Non-Major Subjects: ${nonMajorSubjects.length}`);
    console.log(`Elective Subjects: ${electiveSubjects.length}`);
    
    const totalUnits = result.reduce((total, subject) => total + subject.units, 0);
    console.log(`Total Units in Curriculum: ${totalUnits}`);

  } catch (error) {
    console.error('Error populating subjects:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
console.log('Starting subject population script...');
console.log('Loading environment variables from .env file...');
populateSubjects()
  .then(() => {
    console.log('Subject population completed successfully');
  })
  .catch((error) => {
    console.error('Failed to populate subjects:', error);
    process.exit(1);
  });

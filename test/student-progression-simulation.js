// student-progression-simulation.js
// This script simulates a student's progression through their academic journey
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../schema/student.js';
import Subject from '../schema/subject.js';
import { getRecommendedSubjects } from '../service/recommendation.service.js';
import { maxUnitsPerSemester } from '../constants/PROGRAMS.js';

// Load environment variables
dotenv.config();

// Sample grades for random assignment
const passingGrades = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0];
const failingGrade = 5.0;

// Connect to the database
mongoose.connect(process.env.CONN_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

/**
 * Generates random grades for subjects with a specified fail rate
 * @param {Array} subjects - List of subjects to generate grades for
 * @param {Number} failRate - Probability of failing a subject (0-1)
 * @returns {Array} - Subjects with grades
 */
const generateGrades = (subjects, failRate = 0.15) => {
  return subjects.map(subject => {
    // Determine if this subject should be failed based on fail rate
    const shouldFail = Math.random() < failRate;
    
    // For passed subjects: 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0
    // For failed subjects: 5.0
    let finalGrade;
    if (shouldFail) {
      finalGrade = failingGrade; // Failing grade
    } else {
      // Generate a random passing grade
      finalGrade = passingGrades[Math.floor(Math.random() * passingGrades.length)];
    }
    
    return {
      subject: subject._id,
      edpCode: subject.edpCode,
      subjectName: subject.subjectName,
      units: subject.units,
      midtermGrade: finalGrade, // Same grade for midterm for simplicity
      finalGrade: finalGrade,
      remarks: finalGrade < 5.0 ? 'Passed' : 'Failed'
    };
  });
};

/**
 * Fetches subjects for a specific year level and semester
 */
const fetchSubjects = async (department, yearLevel, semester) => {
  const subjects = await Subject.find({
    department,
    yearLevel,
    semester
  });
  
  return subjects;
};

/**
 * Displays subject information
 */
const displaySubjects = (subjects, title) => {
  console.log(`\n${title} (${subjects.length} subjects):`);
  subjects.forEach((subject, index) => {
    const prereqs = subject.prerequisites && subject.prerequisites.length > 0 
      ? ` (Prerequisites: ${subject.prerequisites.join(', ')})` 
      : '';
    console.log(`${index + 1}. ${subject.subjectName} (${subject.edpCode})${prereqs}`);
  });
};

/**
 * Logs academic history information
 */
const logAcademicHistory = (history) => {
  console.log("\nAcademic History:");
  history.forEach((entry, index) => {
    console.log(`\nAcademic Entry ${index + 1}:`);
    console.log("Semester:", entry.semester);
    console.log("Academic Year:", entry.academicYear);
    
    const passedSubjects = entry.subjects.filter(s => s.remarks === 'Passed');
    const failedSubjects = entry.subjects.filter(s => s.remarks === 'Failed');
    
    console.log(`Passed ${passedSubjects.length} subjects:`);
    passedSubjects.forEach((subject, idx) => {
      console.log(`${idx + 1}. ${subject.subjectName} - Grade: ${subject.finalGrade}`);
    });
    
    console.log(`Failed ${failedSubjects.length} subjects:`);
    if (failedSubjects.length > 0) {
      failedSubjects.forEach((subject, idx) => {
        console.log(`${idx + 1}. ${subject.subjectName} - Grade: ${subject.finalGrade}`);
      });
    } else {
      console.log("None");
    }
  });
};

/**
 * Main simulation function
 */
async function simulateStudentProgression() {
  try {
    console.log("Starting Student Academic Progression Simulation...");
    
    // Clear previous test data
    console.log("Clearing previous test data...");
    await Student.deleteOne({ email: 'progression-test@example.com' });
    
    // Create a new student
    console.log("\nCreating new student...");
    const studentId = `student-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const student = new Student({
      name: 'Student Progression Test',
      email: 'progression-test@example.com',
      password: 'Password123!',
      phoneNumber: '09123456789',
      department: 'BSIT',
      yearLevel: 1,
      studentId: studentId,
      isEnrolled: true,
      academicHistory: []  // Start with empty academic history
    });
    
    await student.save();
    console.log("Created student with ID:", student._id);
    
    // Define the starting points
    let currentYearLevel = 1;
    let currentSemester = 'First';
    let currentYear = new Date().getFullYear();
    let academicYear = `${currentYear}-${currentYear + 1}`;
    let academicHistory = [];
    
    // Simulate the academic journey through all years and semesters
    while (currentYearLevel <= 4) {
      console.log(`\n=======================================`);
      console.log(`SIMULATING YEAR ${currentYearLevel}, ${currentSemester} SEMESTER`);
      console.log(`Academic Year: ${academicYear}`);
      console.log(`=======================================`);
      
      // 1. Get recommendations based on current status
      console.log("\nGetting subject recommendations...");
      let recommendations;
      
      // Skip recommendations for the very first semester (first year, first semester)
      if (academicHistory.length === 0) {
        console.log("First semester of first year - no recommendations needed yet.");
        
        // For first semester first year, just get all the subjects
        const firstYearFirstSemSubjects = await fetchSubjects('BSIT', 1, 'First');
        displaySubjects(firstYearFirstSemSubjects, "First Year, First Semester Subjects");
        
        // Enroll in these subjects and generate grades
        const subjectsWithGrades = generateGrades(firstYearFirstSemSubjects);
        
        // Add to academic history
        const academicEntry = {
          academicYear,
          semester: currentSemester,
          subjects: subjectsWithGrades
        };
        
        academicHistory.push(academicEntry);
        student.academicHistory = academicHistory;
        await student.save();
      } else {
        // Get recommendations for this semester
        recommendations = await getRecommendedSubjects(student._id);
        
        console.log("\nCurrent Status:");
        console.log("- Semester:", recommendations.currentInfo.semester);
        console.log("- Year Level:", recommendations.currentInfo.yearLevel);
        console.log("- Academic Year:", recommendations.currentInfo.academicYear);
        
        console.log("\nNext Semester:");
        console.log("- Semester:", recommendations.nextInfo.semester);
        console.log("- Year Level:", recommendations.nextInfo.yearLevel);
        console.log("- Academic Year:", recommendations.nextInfo.academicYear);
        
        // Display eligible and ineligible subjects
        console.log("\nEligible Subjects:");
        if (recommendations.eligibleSubjects.length > 0) {
          recommendations.eligibleSubjects.forEach((item, index) => {
            const prereqDisplay = item.subject.prerequisites && item.subject.prerequisites.length > 0 
              ? ` (Prerequisites: ${item.subject.prerequisites.join(', ')})` 
              : ' (No prerequisites)';
            console.log(`${index + 1}. ${item.subject.subjectName} (${item.subject.edpCode})${prereqDisplay}`);
          });
          
          // Determine max units for this year level and semester
          const yearKey = ['firstYear', 'secondYear', 'thirdYear', 'fourthYear'][currentYearLevel - 1];
          const semesterKey = ['First', 'Second', 'Summer'].indexOf(currentSemester) === 0 ? 'firstSemester' : 
                             ['First', 'Second', 'Summer'].indexOf(currentSemester) === 1 ? 'secondSemester' : 'summer';
          
          const maxUnits = maxUnitsPerSemester[yearKey][semesterKey];
          console.log(`\nMaximum allowed units for ${currentYearLevel} Year, ${currentSemester} Semester: ${maxUnits}`);
          
          // Select subjects to enroll in
          const selectedSubjects = [];
          let totalUnits = 0;
          
          // First, add all failed subjects from previous semesters that are eligible
          const failedSubjectCodes = [];
          academicHistory.forEach(entry => {
            entry.subjects
              .filter(s => s.remarks === 'Failed')
              .forEach(s => failedSubjectCodes.push(s.edpCode));
          });
          
          for (const item of recommendations.eligibleSubjects) {
            if (failedSubjectCodes.includes(item.subject.edpCode)) {
              selectedSubjects.push(item.subject);
              totalUnits += item.subject.units;
              console.log(`Selected (retake): ${item.subject.subjectName} (${item.subject.units} units)`);
            }
          }
          
          // Then add new subjects up to the max units
          for (const item of recommendations.eligibleSubjects) {
            if (!failedSubjectCodes.includes(item.subject.edpCode)) {
              if (totalUnits + item.subject.units <= maxUnits) {
                selectedSubjects.push(item.subject);
                totalUnits += item.subject.units;
                console.log(`Selected: ${item.subject.subjectName} (${item.subject.units} units)`);
              } else {
                console.log(`Skipped: ${item.subject.subjectName} (would exceed max units)`);
              }
            }
          }
          
          console.log(`\nSelected ${selectedSubjects.length} subjects with total ${totalUnits} units`);
          
          // Generate grades for selected subjects
          const subjectsWithGrades = generateGrades(selectedSubjects);
          
          // Add to academic history
          const academicEntry = {
            academicYear,
            semester: currentSemester,
            subjects: subjectsWithGrades
          };
          
          academicHistory.push(academicEntry);
          student.academicHistory = academicHistory;
          await student.save();
        } else {
          console.log("No eligible subjects found!");
        }
        
        console.log("\nIneligible Subjects:");
        if (recommendations.ineligibleSubjects && recommendations.ineligibleSubjects.length > 0) {
          recommendations.ineligibleSubjects.forEach((item, index) => {
            console.log(`${index + 1}. ${item.subject.subjectName} (${item.subject.edpCode})`);
            
            // Show detailed information about missing prerequisites
            console.log("   Missing prerequisites:");
            item.missingPrerequisites.forEach((prereq, idx) => {
              if (prereq.isFailed) {
                console.log(`     ${idx + 1}. ${prereq.subjectName} (${prereq.edpCode}) - FAILED with grade ${prereq.failedGrade}`);
              } else {
                console.log(`     ${idx + 1}. ${prereq.subjectName} (${prereq.edpCode}) - Not yet taken`);
              }
            });
          });
        } else {
          console.log("No ineligible subjects found");
        }
      }
      
      // Display updated academic history
      logAcademicHistory(academicHistory);
      
      // Update for next iteration
      if (currentSemester === 'First') {
        currentSemester = 'Second';
      } else {
        // Move to next year
        currentSemester = 'First';
        currentYearLevel++;
        currentYear++;
        academicYear = `${currentYear}-${currentYear + 1}`;
        
        // Update student's year level
        student.yearLevel = currentYearLevel;
        await student.save();
      }
      
      // If we've finished all years, break out
      if (currentYearLevel > 4) {
        break;
      }
      
      // Pause between iterations to separate the output better
      console.log("\nMoving to next semester...");
      console.log("----------------------------------");
    }
    
    console.log("\n=======================================");
    console.log("SIMULATION COMPLETE!");
    console.log("=======================================");
    console.log("Student has completed all four years of academic studies");
    
    // Final academic history display
    const finalStudent = await Student.findById(student._id);
    logAcademicHistory(finalStudent.academicHistory);
    
  } catch (error) {
    console.error("Error in student progression simulation:", error);
  } finally {
    // Close the database connection
    console.log("\nClosing database connection...");
    await mongoose.connection.close();
    console.log("Simulation completed");
  }
}

// Run the simulation
simulateStudentProgression();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../schema/student.js';
import Subject from '../schema/subject.js';
import { getRecommendedSubjects } from '../service/recommendation.service.js';

// Load environment variables
dotenv.config();

// Connect to the database
mongoose.connect(process.env.CONN_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Run the sample
async function runBSITExample() {
  try {
    console.log("Starting BSIT Student Recommendation Example with Real Subjects...");

    // Clear previous test data
    console.log("Clearing previous test data...");
    await Student.deleteOne({ email: 'bsit-test@example.com' });

    // 1. Get real subjects from database (try different departments)
    console.log("Fetching real subjects from the database...");
    
    // First check if we have BSIT subjects
    let firstYearFirstSemSubjects = await Subject.find({
      department: 'BSIT',
      yearLevel: 1,
      semester: 'First'
    });
    
    let department = 'BSIT';
    
    // If no BSIT subjects, try BSCS
    if (firstYearFirstSemSubjects.length === 0) {
      console.log("No BSIT subjects found, trying BSCS...");
      firstYearFirstSemSubjects = await Subject.find({
        department: 'BSCS',
        yearLevel: 1,
        semester: 'First'
      });
      department = 'BSCS';
    }
    
    // If still no subjects, try any department
    if (firstYearFirstSemSubjects.length === 0) {
      console.log("No BSCS subjects found, looking for any department...");
      
      // Get all available departments
      const availableDepartments = await Subject.distinct('department');
      console.log("Available departments:", availableDepartments);
      
      if (availableDepartments.length > 0) {
        department = availableDepartments[0];
        console.log(`Using ${department} department...`);
        
        firstYearFirstSemSubjects = await Subject.find({
          department: department,
          yearLevel: 1,
          semester: 'First'
        });
      }
    }
    
    console.log(`Found ${firstYearFirstSemSubjects.length} first year, first semester ${department} subjects`);
    
    // Log the found subjects
    firstYearFirstSemSubjects.forEach((subject, index) => {
      console.log(`${index + 1}. ${subject.subjectName} (${subject.edpCode})`);
    });
    
    if (firstYearFirstSemSubjects.length === 0) {
      console.error("No first year, first semester subjects found in database!");
      console.log("Please make sure you have subjects in your database with yearLevel=1, semester='First'");
      return;
    }
      // First year, second semester subjects
    const firstYearSecondSemSubjects = await Subject.find({
      department: department,
      yearLevel: 1,
      semester: 'Second'
    });
    
    console.log(`\nFound ${firstYearSecondSemSubjects.length} first year, second semester ${department} subjects`);
    firstYearSecondSemSubjects.forEach((subject, index) => {
      const prereqs = subject.prerequisites && subject.prerequisites.length > 0 
        ? ` (Prerequisites: ${subject.prerequisites.join(', ')})` 
        : '';
      console.log(`${index + 1}. ${subject.subjectName} (${subject.edpCode})${prereqs}`);
    });
    
    // Second year, first semester subjects (for comparison with recommendations)
    const secondYearFirstSemSubjects = await Subject.find({
      department: department,
      yearLevel: 2,
      semester: 'First'
    });
    
    console.log(`\nFound ${secondYearFirstSemSubjects.length} second year, first semester ${department} subjects`);
    secondYearFirstSemSubjects.forEach((subject, index) => {
      const prereqs = subject.prerequisites && subject.prerequisites.length > 0 
        ? ` (Prerequisites: ${subject.prerequisites.join(', ')})` 
        : '';
      console.log(`${index + 1}. ${subject.subjectName} (${subject.edpCode})${prereqs}`);
    });// 2. Create a BSIT student
    console.log("\nCreating BSIT test student...");
    const studentId = `bsit-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const student = new Student({
      name: 'BSIT Real Subjects Test Student',
      email: 'bsit-test@example.com',
      password: 'Password123!',
      phoneNumber: '09123456789',
      department: 'BSIT',
      yearLevel: 1,
      studentId: studentId,
      isEnrolled: true
    });
    await student.save();
    console.log("Created BSIT test student with ID:", student._id);    // 3. Set up academic history for both first and second semesters with some passed and failed subjects
    console.log("Setting up academic history with first year subjects (some passed, some failed)...");
    const currentYear = new Date().getFullYear() - 1; // Previous year for 1st year
    const firstYearAcademicYear = `${currentYear}-${currentYear + 1}`;
    const secondYearAcademicYear = `${currentYear + 1}-${currentYear + 2}`;
      
    // Function to generate grades for subjects (some passed, some failed)
    const generateGrades = (subjects, failRate = 0.25) => {
      return subjects.map((subject, index) => {
        // Determine if this subject should be failed based on fail rate
        const shouldFail = Math.random() < failRate;
        
        // For passed subjects: 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0
        // For failed subjects: 5.0
        let finalGrade;
        if (shouldFail) {
          finalGrade = 5.0; // Failing grade
        } else {
          // Generate a random passing grade (1.0 to 3.0)
          const gradeOptions = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0];
          finalGrade = gradeOptions[Math.floor(Math.random() * gradeOptions.length)];
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
    
    // Create academic history entries
    const firstSemAcademicEntry = {
      academicYear: firstYearAcademicYear,
      semester: 'First',
      subjects: generateGrades(firstYearFirstSemSubjects)
    };
    
    const secondSemAcademicEntry = {
      academicYear: firstYearAcademicYear,
      semester: 'Second',
      subjects: generateGrades(firstYearSecondSemSubjects)
    };
    
    // Set the student's academic history with both semesters
    student.academicHistory = [firstSemAcademicEntry, secondSemAcademicEntry];
    
    // Update student's year level to 2 (ready for second year recommendations)
    student.yearLevel = 2;
    
    await student.save();
    console.log("Academic history updated with first and second semester subjects");
    console.log("Student year level updated to 2 for second year recommendations");
      // Log information about passed and failed subjects
    const firstSemPassedSubjects = student.academicHistory[0].subjects.filter(s => s.remarks === 'Passed');
    const firstSemFailedSubjects = student.academicHistory[0].subjects.filter(s => s.remarks === 'Failed');
    const secondSemPassedSubjects = student.academicHistory[1].subjects.filter(s => s.remarks === 'Passed');
    const secondSemFailedSubjects = student.academicHistory[1].subjects.filter(s => s.remarks === 'Failed');
    
    console.log(`\n1st Year, 1st Semester - Passed ${firstSemPassedSubjects.length} subjects:`);
    firstSemPassedSubjects.forEach((subject, idx) => {
      console.log(`${idx + 1}. ${subject.subjectName} - Grade: ${subject.finalGrade}`);
    });
    
    console.log(`\n1st Year, 1st Semester - Failed ${firstSemFailedSubjects.length} subjects:`);
    firstSemFailedSubjects.forEach((subject, idx) => {
      console.log(`${idx + 1}. ${subject.subjectName} - Grade: ${subject.finalGrade}`);
    });

    console.log(`\n1st Year, 2nd Semester - Passed ${secondSemPassedSubjects.length} subjects:`);
    secondSemPassedSubjects.forEach((subject, idx) => {
      console.log(`${idx + 1}. ${subject.subjectName} - Grade: ${subject.finalGrade}`);
    });
    
    console.log(`\n1st Year, 2nd Semester - Failed ${secondSemFailedSubjects.length} subjects:`);
    secondSemFailedSubjects.forEach((subject, idx) => {
      console.log(`${idx + 1}. ${subject.subjectName} - Grade: ${subject.finalGrade}`);
    });

    // 4. Get recommendations for the next semester
    console.log("\n--- Getting Subject Recommendations ---");
    const recommendations = await getRecommendedSubjects(student._id);
    
    console.log("\nCurrent Info:");
    console.log("- Semester:", recommendations.currentInfo.semester);
    console.log("- Year Level:", recommendations.currentInfo.yearLevel);
    console.log("- Academic Year:", recommendations.currentInfo.academicYear);
    
    console.log("\nNext Info:");
    console.log("- Semester:", recommendations.nextInfo.semester);
    console.log("- Year Level:", recommendations.nextInfo.yearLevel);
    console.log("- Academic Year:", recommendations.nextInfo.academicYear);    console.log("\nEligible Subjects:");
    if (recommendations.eligibleSubjects.length > 0) {
      recommendations.eligibleSubjects.forEach((item, index) => {
        // Show prerequisites for eligible subjects
        const prereqDisplay = item.subject.prerequisites && item.subject.prerequisites.length > 0 
          ? ` (Prerequisites: ${item.subject.prerequisites.join(', ')})` 
          : ' (No prerequisites)';
        console.log(`${index + 1}. ${item.subject.subjectName} (${item.subject.edpCode})${prereqDisplay}`);
      });
    } else {
      console.log("No eligible subjects found");
    }
    console.log("\nIneligible Subjects:");
    if (recommendations.ineligibleSubjects.length > 0) {
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

    // Verify the database contents
    console.log("\n--- Database Verification ---");
    const verifyStudent = await Student.findById(student._id).populate('academicHistory.subjects.subject');
    console.log("Student department:", verifyStudent.department);
    console.log("Student year level:", verifyStudent.yearLevel);
    
    console.log("\nAcademic History:");
    verifyStudent.academicHistory.forEach((entry, index) => {
      console.log(`\nAcademic Entry ${index + 1}:`);
      console.log("Semester:", entry.semester);
      console.log("Academic Year:", entry.academicYear);
      console.log("Subjects:");
      entry.subjects.forEach((subject, i) => {
        console.log(`${i + 1}. ${subject.subjectName} - Grade: ${subject.finalGrade}, Remarks: ${subject.remarks}`);
      });
    });
  } catch (error) {
    console.error("Error in BSIT example:", error);
  } finally {
    // Close the database connection
    console.log("\nClosing database connection...");
    await mongoose.connection.close();
    console.log("Example completed");
  }
}

// Run the example
runBSITExample();

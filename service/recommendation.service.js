import Student from '../schema/student.js';
import Subject from '../schema/subject.js';

/**
 * Calculates the next semester and year level for a student
 * @param {String} currentSemester - The current semester ('First', 'Second', 'Summer')
 * @param {Number} currentYearLevel - The current year level (1-4)
 * @returns {Object} Next semester and year level
 */
export const calculateNextTerm = (currentSemester, currentYearLevel) => {
  let nextSemester;
  let nextYearLevel = currentYearLevel;

  // Progress to the next semester/year based on the current semester
  if (currentSemester === 'First') {
    nextSemester = 'Second';
  } else if (currentSemester === 'Second') {
    nextSemester = 'First';
    nextYearLevel = Math.min(currentYearLevel + 1, 4); // Cap at 4th year
  } else if (currentSemester === 'Summer') {
    nextSemester = 'First';
    nextYearLevel = Math.min(currentYearLevel + 1, 4); // Cap at 4th year
  } else {
    // Default case
    nextSemester = currentSemester;
  }

  return { nextSemester, nextYearLevel };
};

/**
 * Gets eligible subjects for a student to take next semester
 * @param {String} studentId - The ID of the student (can be MongoDB ObjectId or custom student ID)
 * @returns {Promise<Array>} List of recommended subjects
 */
export const getRecommendedSubjects = async (studentId) => {
  try {
    // Check if the studentId is a MongoDB ObjectId or a student ID (with ucb- prefix)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(studentId);
    
    // Find the student and populate their enrolled subjects and academic history
    let student;
    if (isObjectId) {
      student = await Student.findById(studentId).populate('enrolledSubjects');
    } else {
      student = await Student.findOne({ studentId }).populate('enrolledSubjects');
    }
    
    if (!student) {
      throw new Error(`Student with identifier "${studentId}" not found.`);
    }// Get the current semester and year level from the latest academic history entry
    const currentAcademicEntry = student.academicHistory.length > 0 
      ? student.academicHistory.sort((a, b) => {
          // Sort by academic year (descending)
          const yearA = parseInt(a.academicYear.split('-')[0]);
          const yearB = parseInt(b.academicYear.split('-')[0]);
          if (yearA !== yearB) return yearB - yearA;
          
          // If same year, sort by semester priority (First < Second)
          // Excluding Summer semester as per requirements
          const semPriority = { 'First': 0, 'Second': 1 };
          return semPriority[b.semester] - semPriority[a.semester];
        })[0]
      : null;
    
    if (!currentAcademicEntry) {
      throw new Error('No academic history found for this student.');
    }

    // Get the current semester and year level
    const currentSemester = currentAcademicEntry.semester;
    const currentYearLevel = student.yearLevel || 1;
      // Instead of calculating the next semester and year level, use the current values
    const nextSemester = student.semester;
    const nextYearLevel = student.yearLevel;
    
    // Get all completed subject IDs (from academic history)
    const completedSubjectIds = new Set();
    // Track subjects that need to be retaken (failed subjects)
    const failedSubjectIds = new Set();
    const allFailedSubjects = [];
    
    student.academicHistory.forEach(entry => {
      entry.subjects.forEach(subject => {
        // For Philippine grading system (1.0 - 5.0 where 5.0 is fail)
        // A subject is passed if grade is less than 5.0
        if (subject.finalGrade) {
          if (subject.finalGrade < 5.0) {
            // Subject is passed
            completedSubjectIds.add(subject.subject.toString());
          } else {
            // Subject is failed and needs retaking
            failedSubjectIds.add(subject.subject.toString());
            allFailedSubjects.push({
              subjectId: subject.subject.toString(),
              edpCode: subject.edpCode,
              subjectName: subject.subjectName,
              finalGrade: subject.finalGrade
            });
          }
        }
      });
    });

    // Get all subject IDs currently enrolled in
    const enrolledSubjectIds = new Set(
      student.enrolledSubjects.map(subject => subject._id.toString())
    );    // Find subjects for the next semester and year level in the same department
    const studentDepartment = student.department || 'BSIT';
    
    // Include failed subjects from any semester/year that need to be retaken
    const failedSubjectsToRetake = await Subject.find({
      _id: { $in: Array.from(failedSubjectIds) }
    });
    
    // Find regular next-semester subjects
    const nextSemesterSubjects = await Subject.find({
      department: studentDepartment,
      yearLevel: nextYearLevel,
      semester: nextSemester,
      _id: { 
        $nin: [...completedSubjectIds, ...enrolledSubjectIds] 
      }
    });
    
    // Combine both sets of subjects (failed subjects have priority)
    const recommendedSubjects = [...failedSubjectsToRetake, ...nextSemesterSubjects];// Check prerequisites for each recommended subject
    const eligibleSubjects = await Promise.all(
      recommendedSubjects.map(async subject => {
        const prerequisites = subject.prerequisites || [];
        
        // Skip prerequisite check if no prerequisites
        if (prerequisites.length === 0) {
          return {
            subject,
            eligible: true,
            missingPrerequisites: []
          };
        }
          // Check if all prerequisites are met
        const missingPrerequisites = [];
        for (const prereqCode of prerequisites) {
          // Find the prerequisite subject
          const prereqSubject = await Subject.findOne({ 
            edpCode: prereqCode
          });
          
          if (prereqSubject) {
            // Check if the prerequisite has been completed (passed)
            const prerequisiteMet = Array.from(completedSubjectIds).some(id => 
              id === prereqSubject._id.toString()
            );
            
            // Check if the prerequisite is failed
            const prerequisiteFailed = allFailedSubjects.some(failed => 
              failed.edpCode === prereqCode
            );
            
            if (!prerequisiteMet || prerequisiteFailed) {
              // Find detailed info about the prerequisite
              const failedPrereq = allFailedSubjects.find(failed => failed.edpCode === prereqCode);
              
              missingPrerequisites.push({
                edpCode: prereqCode,
                subjectName: prereqSubject ? prereqSubject.subjectName : 'Unknown Subject',
                isFailed: prerequisiteFailed,
                failedGrade: failedPrereq ? failedPrereq.finalGrade : null
              });
            }
          }
        }
        
        return {
          subject,
          eligible: missingPrerequisites.length === 0,
          missingPrerequisites
        };
      })
    );    const currentAcademicYear = currentAcademicEntry.academicYear;
    
    return {
      currentInfo: {
        semester: student.semester,
        yearLevel: student.yearLevel,
        academicYear: currentAcademicYear
      },
      nextInfo: {
        semester: nextSemester,
        yearLevel: nextYearLevel,
        academicYear: currentAcademicYear
      },
      eligibleSubjects: eligibleSubjects.filter(item => item.eligible),
      ineligibleSubjects: eligibleSubjects.filter(item => !item.eligible)
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Calculates the next academic year based on current academic year and semester progression
 * @param {String} currentAcademicYear - The current academic year (e.g., "2025-2026")
 * @param {String} currentSemester - The current semester
 * @param {String} nextSemester - The next semester
 * @returns {String} The next academic year
 */
const calculateNextAcademicYear = (currentAcademicYear, currentSemester, nextSemester) => {
  // If moving from Second to First or Summer to First, increment the academic year
  if ((currentSemester === 'Second' || currentSemester === 'Summer') && nextSemester === 'First') {
    const [startYear, endYear] = currentAcademicYear.split('-').map(Number);
    return `${startYear + 1}-${endYear + 1}`;
  }
  
  // Otherwise, keep the same academic year
  return currentAcademicYear;
};
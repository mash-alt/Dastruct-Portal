import Student from '../schema/student.js';
import { getRecommendedSubjects } from '../service/recommendation.service.js';

/**
 * Gets a student's complete academic progress report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAcademicProgress = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate input
    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required.' });
    }

    // Find the student by ID and populate the academic history
    const student = await Student.findById(studentId)
      .populate('academicHistory.subjects.subject');
    
    if (!student) {
      return res.status(404).json({ error: `Student with ID "${studentId}" not found.` });
    }

    // Group subjects by year level and semester
    const progressByYear = {};
    let totalUnitsPassed = 0;
    let totalUnitsFailed = 0;
    let totalUnitsAttempted = 0;
    
    student.academicHistory.forEach(entry => {
      const academicYear = entry.academicYear;
      const semester = entry.semester;
      
      if (!progressByYear[academicYear]) {
        progressByYear[academicYear] = {};
      }
      
      progressByYear[academicYear][semester] = {
        passed: [],
        failed: []
      };
      
      entry.subjects.forEach(subject => {
        // Using Philippine grading system (1.0-5.0 where 5.0 is fail)
        const isPassed = subject.finalGrade && subject.finalGrade < 5.0;
        const status = isPassed ? 'passed' : 'failed';
        
        progressByYear[academicYear][semester][status].push({
          edpCode: subject.edpCode,
          subjectName: subject.subjectName,
          units: subject.units,
          grade: subject.finalGrade,
          remarks: subject.remarks
        });
        
        // Update unit counts
        if (subject.units) {
          totalUnitsAttempted += subject.units;
          if (isPassed) {
            totalUnitsPassed += subject.units;
          } else if (subject.finalGrade === 5.0) {
            totalUnitsFailed += subject.units;
          }
        }
      });
    });
    
    // Get recommendations for next semester
    const recommendations = await getRecommendedSubjects(studentId);

    res.status(200).json({
      message: 'Academic progress retrieved successfully',
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        department: student.department,
        yearLevel: student.yearLevel
      },
      academicSummary: {
        totalUnitsPassed,
        totalUnitsFailed,
        totalUnitsAttempted,
        completionRate: totalUnitsAttempted > 0 
          ? ((totalUnitsPassed / totalUnitsAttempted) * 100).toFixed(2) + '%' 
          : '0%'
      },
      progressByYear,
      recommendations: {
        current: recommendations.currentInfo,
        next: recommendations.nextInfo,
        eligibleSubjects: recommendations.eligibleSubjects.map(item => ({
          edpCode: item.subject.edpCode,
          subjectName: item.subject.subjectName,
          units: item.subject.units,
          prerequisites: item.subject.prerequisites || []
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Records grades for a student's subjects
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const recordGrades = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, semester, grades } = req.body;
    
    // Validate input
    if (!studentId || !academicYear || !semester || !grades || !Array.isArray(grades)) {
      return res.status(400).json({ 
        error: 'studentId, academicYear, semester, and grades array are required.' 
      });
    }
    
    // Find the student by ID
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: `Student with ID "${studentId}" not found.` });
    }
    
    // Find the academic history entry for the specified academic year and semester
    const academicEntryIndex = student.academicHistory.findIndex(
      entry => entry.academicYear === academicYear && entry.semester === semester
    );
    
    if (academicEntryIndex === -1) {
      return res.status(404).json({ 
        error: `Academic entry for ${academicYear}, ${semester} semester not found.` 
      });
    }
    
    // Update grades for each subject
    const academicEntry = student.academicHistory[academicEntryIndex];
    
    grades.forEach(gradeInfo => {
      const { edpCode, midtermGrade, finalGrade } = gradeInfo;
      
      // Find the subject in the academic entry
      const subjectIndex = academicEntry.subjects.findIndex(
        subject => subject.edpCode === edpCode
      );
      
      if (subjectIndex !== -1) {
        // Update the grades
        if (midtermGrade !== undefined) {
          academicEntry.subjects[subjectIndex].midtermGrade = midtermGrade;
        }
        
        if (finalGrade !== undefined) {
          academicEntry.subjects[subjectIndex].finalGrade = finalGrade;
          // Update remarks (using Philippine grading system where 5.0 is fail)
          academicEntry.subjects[subjectIndex].remarks = finalGrade < 5.0 ? 'Passed' : 'Failed';
        }
      }
    });
    
    // Save the updated student record
    await student.save();
    
    res.status(200).json({ 
      message: 'Grades recorded successfully.',
      academicEntry: student.academicHistory[academicEntryIndex]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Provides a simulation of a student's academic progression
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const simulateAcademicProgression = async (req, res) => {
  try {
    const { studentId, semesters = 8 } = req.body; // Default to 8 semesters (4 years)
    
    // Validate input
    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required.' });
    }
    
    // Find the student by ID
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: `Student with ID "${studentId}" not found.` });
    }
    
    // Clone the student to avoid modifying the actual student record
    const simulationData = {
      studentInfo: {
        id: student._id,
        name: student.name,
        department: student.department,
        initialYearLevel: student.yearLevel
      },
      progression: []
    };
    
    // If the student already has academic history, use it as a starting point
    let currentStudent = {
      _id: student._id,
      yearLevel: student.yearLevel || 1,
      department: student.department,
      academicHistory: [...student.academicHistory] // Clone the academic history
    };
    
    // For each semester in the simulation
    for (let i = 0; i < semesters; i++) {
      // Get recommendations for the next semester
      const recommendations = await getRecommendedSubjects(studentId);
      
      // Record the current state
      const semesterData = {
        currentInfo: recommendations.currentInfo,
        nextInfo: recommendations.nextInfo,
        eligibleSubjects: recommendations.eligibleSubjects,
        ineligibleSubjects: recommendations.ineligibleSubjects
      };
      
      simulationData.progression.push(semesterData);
      
      // For a real simulation, we would update the student's academic history here
      // with simulated grades for the recommended subjects
    }
    
    res.status(200).json({
      message: 'Academic progression simulation completed',
      simulation: simulationData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

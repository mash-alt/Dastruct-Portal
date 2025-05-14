import Student from '../schema/student.js';
import Subject from '../schema/subject.js';
import { getRecommendedSubjects } from '../service/recommendation.service.js';

// Enroll a student in subjects for the current academic period
export const enrollStudent = async (req, res) => {
  try {
    const { 
      studentId, 
      subjectIds, 
      academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      semester = 'First' 
    } = req.body;

    // Validate input
    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required.' });
    }

    // Find the student by ID
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: `Student with ID "${studentId}" not found.` });
    }    let subjectsToEnroll = [];
    
    // If student is not yet enrolled, add default first year subjects
    // Otherwise, use the provided subject IDs
    if (!student.isEnrolled && (!subjectIds || subjectIds.length === 0)) {
      // Get first year subjects based on student's department/course and the yearLevel field
      const studentDepartment = student.department || 'BSIT';
      
      const firstYearSubjects = await Subject.find({
        department: studentDepartment,
        yearLevel: 1,
        semester: semester // Match the semester from the request body
      });
        if (firstYearSubjects.length === 0) {
        return res.status(404).json({ error: `No first year subjects found for ${studentDepartment} department for ${semester} semester.` });
      }
      
      subjectsToEnroll = firstYearSubjects.map(subject => subject._id);
    } else if (subjectIds && Array.isArray(subjectIds)) {
      // Validate each subject ID and ensure it exists and matches student's department
      const studentDepartment = student.department || 'BSIT';
      const invalidSubjects = [];
      
      for (const subjectId of subjectIds) {
        const subject = await Subject.findById(subjectId);
        if (!subject) {
          return res.status(404).json({ error: `Subject with ID "${subjectId}" not found.` });
        }
        
        // Check if the subject department matches the student's department
        if (subject.department === studentDepartment) {
          subjectsToEnroll.push(subjectId);
        } else {
          invalidSubjects.push({
            id: subjectId,
            name: subject.subjectName,
            department: subject.department
          });
        }
      }
      
      if (invalidSubjects.length > 0) {
        return res.status(400).json({ 
          error: 'Some subjects do not match the student\'s department.',
          studentDepartment,
          invalidSubjects
        });
      }
      
      if (subjectsToEnroll.length === 0) {
        return res.status(400).json({ error: 'No valid subjects to enroll. All subjects must be from the student\'s department.' });
      }
    } else {
      return res.status(400).json({ error: 'subjectIds (as an array) are required for existing students.' });
    }

    // Get full subject details for academic history
    const subjectDetails = await Subject.find({
      _id: { $in: subjectsToEnroll }
    });
    
    // Create academic history entry
    const academicEntry = {
      academicYear,
      semester,
      subjects: subjectDetails.map(subject => ({
        subject: subject._id,
        edpCode: subject.edpCode,
        subjectName: subject.subjectName,
        units: subject.units,
        midtermGrade: null,
        finalGrade: null,
        remarks: 'Enrolled'
      }))
    };
    
    // Clear previous enrolled subjects (if any) and set the new ones
    student.enrolledSubjects = subjectsToEnroll;
    
    // Check if the academic year and semester combination already exists
    const existingEntryIndex = student.academicHistory.findIndex(
      entry => entry.academicYear === academicYear && entry.semester === semester
    );
    
    if (existingEntryIndex >= 0) {
      // Update existing entry
      student.academicHistory[existingEntryIndex] = academicEntry;
    } else {
      // Add new entry
      student.academicHistory.push(academicEntry);
    }
    
    // Update enrollment status
    student.isEnrolled = true;
    
    await student.save();

    res.status(200).json({ 
      message: 'Student enrolled successfully.', 
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        department: student.department,
        yearLevel: student.yearLevel,
        section: student.section,
        isEnrolled: student.isEnrolled
      },
      enrolledSubjects: subjectDetails.map(subject => ({
        _id: subject._id,
        name: subject.subjectName,
        edpCode: subject.edpCode,
        units: subject.units,
        department: subject.department
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a student's study load (enrolled subjects)
export const getStudyLoad = async (req, res) => {
    try {
      const { studentId } = req.params;
  
      // Validate input
      if (!studentId) {
        return res.status(400).json({ error: 'studentId is required.' });
      }
  
      let student;
      
      // Check if the studentId is a MongoDB ObjectId or a student ID (with ucb- prefix)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(studentId);
      
      if (isObjectId) {
        // Find by MongoDB _id
        student = await Student.findById(studentId).populate('enrolledSubjects');
      } else {
        // Find by studentId field (e.g., ucb-12345678)
        student = await Student.findOne({ studentId }).populate('enrolledSubjects');
      }
      
      if (!student) {
        return res.status(404).json({ error: `Student with identifier "${studentId}" not found.` });
      }
  
      res.status(200).json({
        message: 'Study load retrieved successfully.',
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          department: student.department,
          yearLevel: student.yearLevel
        },
        studyLoad: student.enrolledSubjects, // Array of subject details
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};

// Add a single subject or multiple subjects to a student's enrolled subjects (without enrollment status change)
export const addSubjects = async (req, res) => {
  try {
    const { studentId, subjectIds } = req.body;

    // Validate input
    if (!studentId || !subjectIds || !Array.isArray(subjectIds)) {
      return res.status(400).json({ error: 'studentId and subjectIds (as an array) are required.' });
    }

    // Find the student by ID
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: `Student with ID "${studentId}" not found.` });
    }

    const studentDepartment = student.department || 'BSIT';
    
    // Validate each subject ID and ensure it exists and matches student's department
    const validSubjects = [];
    const invalidSubjects = [];
    
    for (const subjectId of subjectIds) {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ error: `Subject with ID "${subjectId}" not found.` });
      }
      
      // Check if the subject department matches the student's department
      if (subject.department === studentDepartment) {
        validSubjects.push(subjectId);
      } else {
        invalidSubjects.push({
          id: subjectId,
          name: subject.subjectName,
          department: subject.department
        });
      }
    }
    
    if (invalidSubjects.length > 0) {
      return res.status(400).json({ 
        error: 'Some subjects do not match the student\'s department.',
        studentDepartment,
        invalidSubjects
      });
    }

    // Add the valid subjects to the student's enrolledSubjects array
    student.enrolledSubjects = [...new Set([...student.enrolledSubjects, ...validSubjects])]; // Avoid duplicates
    await student.save();

    res.status(200).json({ message: 'Subjects added successfully.', student });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get recommended subjects for the next semester
export const getRecommendedSubjectsForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate input
    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required.' });
    }

    // Get recommendations from the service
    const recommendations = await getRecommendedSubjects(studentId);

    // Return the recommendations
    res.status(200).json({
      message: 'Subject recommendations retrieved successfully.',
      currentInfo: recommendations.currentInfo,
      nextInfo: recommendations.nextInfo,
      eligibleSubjects: recommendations.eligibleSubjects.map(item => ({
        _id: item.subject._id,
        edpCode: item.subject.edpCode,
        subjectName: item.subject.subjectName,
        units: item.subject.units,
        department: item.subject.department,
        yearLevel: item.subject.yearLevel,
        semester: item.subject.semester
      })),
      ineligibleSubjects: recommendations.ineligibleSubjects.map(item => ({
        _id: item.subject._id,
        edpCode: item.subject.edpCode,
        subjectName: item.subject.subjectName,
        units: item.subject.units,
        department: item.subject.department,
        yearLevel: item.subject.yearLevel,
        semester: item.subject.semester,
        missingPrerequisites: item.missingPrerequisites
      }))
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('No academic history')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// Sample Postman request body for enrolling a student
// {
//   "studentId": "student_id_here",
//   "subjectIds": ["subject_id_1", "subject_id_2"],
//   "academicYear": "2023-2024",  // Optional, defaults to current year
//   "semester": "First"           // Optional, defaults to "First"
// }

// Sample Postman request body for adding subjects without full enrollment
// {
//   "studentId": "student_id_here", 
//   "subjectIds": ["subject_id_1", "subject_id_2"]
// }

// Sample Postman request for getting study load
// GET /student/:studentId/studyload
// No request body needed, the studentId is in the URL

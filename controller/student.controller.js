import Student from '../schema/student.js';
import Subject from '../schema/subject.js';

// Add a single subject or multiple subjects to a student's enrolled subjects
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

    // Validate each subject ID and ensure it exists
    const validSubjects = [];
    for (const subjectId of subjectIds) {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ error: `Subject with ID "${subjectId}" not found.` });
      }
      validSubjects.push(subjectId);
    }

    // Add the valid subjects to the student's enrolledSubjects array
    student.enrolledSubjects = [...new Set([...student.enrolledSubjects, ...validSubjects])]; // Avoid duplicates
    await student.save();

    res.status(200).json({ message: 'Subjects added successfully.', student });
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
  
      // Find the student by ID and populate the enrolledSubjects field
      const student = await Student.findById(studentId).populate('enrolledSubjects');
      if (!student) {
        return res.status(404).json({ error: `Student with ID "${studentId}" not found.` });
      }
  
      res.status(200).json({
        message: 'Study load retrieved successfully.',
        studyLoad: student.enrolledSubjects, // Array of subject details
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }

};

//sample postman request body
// {
//   "studentId": "student_id_here", 
//   "subjectIds": ["subject_id_1", "subject_id_2"]
// }

//sample postman request body
// {
//   "studentId": "student_id_here"
// }

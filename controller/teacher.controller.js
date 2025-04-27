import Subject from '../schema/subject.js';
import Student from '../schema/student.js';

// Add or update midterm and final grades for a student in a subject
export const addGrade = async (req, res) => {
  try {
    const { studentName, subjectName, midtermGrade, finalGrade } = req.body;

    // Validate input
    if (!studentName || !subjectName || (midtermGrade === undefined && finalGrade === undefined)) {
      return res.status(400).json({ error: 'studentName, subjectName, and at least one grade (midterm or final) are required.' });
    }

    // Convert grades to numbers if they are strings
    const midterm = midtermGrade !== undefined ? Number(midtermGrade) : undefined;
    const final = finalGrade !== undefined ? Number(finalGrade) : undefined;

    if ((midterm !== undefined && isNaN(midterm)) || (final !== undefined && isNaN(final))) {
      return res.status(400).json({ error: 'midtermGrade and finalGrade must be valid numbers.' });
    }

    // Find the student by name
    const student = await Student.findOne({ name: studentName });
    if (!student) {
      return res.status(404).json({ error: `Student with name "${studentName}" not found.` });
    }

    // Find the subject by name
    const subject = await Subject.findOne({ subjectName });
    if (!subject) {
      return res.status(404).json({ error: `Subject with name "${subjectName}" not found.` });
    }

    // Check if the student is enrolled in the subject
    const isStudentEnrolled = subject.studentsEnrolled.some(
      (enrolledStudentId) => enrolledStudentId.toString() === student._id.toString()
    );
    if (!isStudentEnrolled) {
      return res.status(400).json({ error: `Student "${studentName}" is not enrolled in the subject "${subjectName}".` });
    }

    // Update the grades for the student
    if (!subject.grades) {
      subject.grades = {}; // Initialize grades if not already present
    }

    // Add or update midterm and final grades
    if (!subject.grades[student._id]) {
      subject.grades[student._id] = {}; // Initialize grades for the student if not present
    }
    if (midterm !== undefined) {
      subject.grades[student._id].midtermGrade = midterm;
    }
    if (final !== undefined) {
      subject.grades[student._id].finalGrade = final;
    }

    await subject.save();

    res.status(200).json({ message: 'Grades added/updated successfully.', subject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Sample Postman request body
// {
//   "studentName": "John Doe",
//   "subjectName": "Mathematics",
//   "midtermGrade": 85,
//   "finalGrade": 90
// }
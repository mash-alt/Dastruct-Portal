import Subject from '../schema/subject.js';
import Student from '../schema/student.js';
import Teacher from '../schema/teacher.js';

// Add or update midterm and final grades for a student in a subject
export const addGrade = async (req, res) => {
  try {
    const { studentName, subjectName, midtermGrade, finalGrade } = req.body;    // Validate input
    if (!studentName || !subjectName || (midtermGrade === undefined && finalGrade === undefined)) {
      return res.status(400).json({ error: 'studentName, subjectName, and at least one grade (midterm or final) are required.' });
    }

    // Convert grades to numbers if they are strings
    const midterm = midtermGrade !== undefined ? Number(midtermGrade) : undefined;
    const final = finalGrade !== undefined ? Number(finalGrade) : undefined;

    if ((midterm !== undefined && isNaN(midterm)) || (final !== undefined && isNaN(final))) {
      return res.status(400).json({ error: 'midtermGrade and finalGrade must be valid numbers.' });
    }
    
    // Validate grade range (Philippine standard grading system: 1.0-5.0)
    if (midterm !== undefined && (midterm < 1.0 || midterm > 5.0)) {
      return res.status(400).json({ error: 'midtermGrade must be between 1.0 and 5.0 (Philippine standard grading).' });
    }
    
    if (final !== undefined && (final < 1.0 || final > 5.0)) {
      return res.status(400).json({ error: 'finalGrade must be between 1.0 and 5.0 (Philippine standard grading).' });
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

// Get all students enrolled in subjects assigned to a teacher
export const getEnrolledStudentsByTeacher = async (req, res) => {
  try {
    const teacherId = req.user.id; // Assuming the teacher's ID is in the request from auth middleware
    const { subjectId, edpCode } = req.query; // Get specific subject filter from query parameters
    
    // Find the teacher with their assigned subjects
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    // Find subjects assigned to this teacher with optional subject filtering
    const subjectQuery = { teacherAssigned: teacherId };
    
    // Add subject-specific filters if provided
    if (subjectId) {
      subjectQuery._id = subjectId;
    } else if (edpCode) {
      subjectQuery.edpCode = edpCode;
    }
    
    const subjects = await Subject.find(subjectQuery).populate('studentsEnrolled');
    
    if (!subjects || subjects.length === 0) {
      return res.status(200).json({ 
        message: edpCode || subjectId ? 
          `No subject found with ${edpCode ? 'EDP code: ' + edpCode : 'ID: ' + subjectId} assigned to this teacher` :
          'No subjects assigned to this teacher or no students enrolled', 
        subjects: [], 
        enrolledStudents: [] 
      });
    }
    
    // Create a map to store unique students across all subjects
    const studentMap = new Map();
    
    // Iterate through each subject and its enrolled students
    for (const subject of subjects) {
      // Get detailed information for each student
      const studentIds = subject.studentsEnrolled;
      if (studentIds && studentIds.length > 0) {
        // Find all students enrolled in this subject
        const enrolledStudents = await Student.find({
          _id: { $in: studentIds }
        }).select('-password'); // Exclude password from the results
        
        // Add students to the map with subject information
        for (const student of enrolledStudents) {
          // If student already exists in the map, add this subject to their subjects array
          if (studentMap.has(student._id.toString())) {
            studentMap.get(student._id.toString()).subjects.push({
              _id: subject._id,
              subjectName: subject.subjectName,
              edpCode: subject.edpCode,
              // Include grade information if available
              grades: subject.grades && subject.grades.get(student._id.toString())
            });
          } else {            // Add new student to the map with their first subject
            studentMap.set(student._id.toString(), {
              studentId: student.studentId, // Student custom ID (like ucb-12345678)
              studentName: student.name,
              course: student.course,
              section: student.section,
              subjects: [{
                _id: subject._id,
                subjectName: subject.subjectName,
                edpCode: subject.edpCode,
                // Include grade information if available
                grades: subject.grades && subject.grades.get(student._id.toString())
              }]
            });
          }
        }
      }
    }
    
    // Convert the map values to an array for the response
    const enrolledStudents = Array.from(studentMap.values());
    
    res.status(200).json({
      message: 'Students enrolled in subjects assigned to the teacher retrieved successfully',
      teacherName: teacher.name,
      totalSubjects: subjects.length,
      totalStudents: enrolledStudents.length,
      subjects: subjects.map(subject => ({
        _id: subject._id,
        subjectName: subject.subjectName,
        edpCode: subject.edpCode,
        studentCount: subject.studentsEnrolled ? subject.studentsEnrolled.length : 0
      })),
      enrolledStudents
    });
  } catch (error) {
    console.error('Error getting enrolled students:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get students enrolled in a specific subject
export const getStudentsBySubject = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { subjectId, edpCode } = req.params; // Get subject identifier from URL parameters
    
    if (!subjectId && !edpCode) {
      return res.status(400).json({ error: 'Subject ID or EDP code is required' });
    }
    
    // Find the subject
    const subjectQuery = { teacherAssigned: teacherId };
    if (subjectId) {
      subjectQuery._id = subjectId;
    } else {
      subjectQuery.edpCode = edpCode;
    }
    
    const subject = await Subject.findOne(subjectQuery);
    
    if (!subject) {
      return res.status(404).json({ 
        error: `Subject ${subjectId ? 'with ID: ' + subjectId : 'with EDP code: ' + edpCode} not found or not assigned to you`
      });
    }
    
    // Get the students enrolled in this subject
    const studentIds = subject.studentsEnrolled;
    
    if (!studentIds || studentIds.length === 0) {
      return res.status(200).json({
        message: `No students enrolled in ${subject.subjectName}`,
        subject: {
          _id: subject._id,
          subjectName: subject.subjectName,
          edpCode: subject.edpCode,
          units: subject.units,
          semester: subject.semester,
          yearLevel: subject.yearLevel,
          department: subject.department
        },
        enrolledStudents: []
      });
    }
    
    // Find all students enrolled in this subject
    const enrolledStudents = await Student.find({
      _id: { $in: studentIds }
    }).select('-password'); // Exclude password from the results
      // Format student information with grades - limited to only required fields
    const studentsWithGrades = enrolledStudents.map(student => {
      const studentId = student._id.toString();
      return {
        studentId: student.studentId, // Student custom ID (like ucb-12345678)
        studentName: student.name,
        course: student.course,
        section: student.section,
        // Include grade information if available
        grades: subject.grades && subject.grades.get(studentId) ? subject.grades.get(studentId) : null
      };
    });
    
    res.status(200).json({
      message: `Students enrolled in ${subject.subjectName} retrieved successfully`,
      subject: {
        _id: subject._id,
        subjectName: subject.subjectName,
        edpCode: subject.edpCode,
        units: subject.units,
        semester: subject.semester,
        yearLevel: subject.yearLevel,
        department: subject.department
      },
      totalStudents: studentsWithGrades.length,
      enrolledStudents: studentsWithGrades
    });
  } catch (error) {
    console.error('Error getting students by subject:', error);
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
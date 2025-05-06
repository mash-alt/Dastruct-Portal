import subjectSchema from '../schema/subject.js';
import Teacher from '../schema/teacher.js'; // Import the Teacher model
import Student from '../schema/student.js'; // Import the Student model

const Subject = subjectSchema;

const generateEdpCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Ensures a 6-digit number
  };


// Add a new subject
export const addSubject = async (req, res) => {
  try {
    const { subjectName, units, prerequisites, teacherAssigned } = req.body;

    // Validate input
    if (!subjectName || !units) {
      return res.status(400).json({ error: 'edpCode, subjectName, and units are required.' });
    }

    let teacher = null;
    if (teacherAssigned) {
      teacher = await Teacher.findOne({ name: teacherAssigned });
      if (!teacher) {
        return res.status(404).json({ error: `Teacher with name "${teacherAssigned}" not found.` });
      }
    }

    const edpCode = generateEdpCode(); // Generate a unique edpCode

    const subject = new Subject({
      edpCode,
      subjectName,
      units,
      prerequisites: prerequisites || [], // Default to an empty array if not provided
      teacherAssigned: teacher ? teacher._id : null, // Assign the teacher's ObjectId // Default to null if not provided
    });

    await subject.save();

    res.status(201).json({ message: 'Subject added successfully.', subject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an existing subject
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { edpCode, subjectName, units, prerequisites, teacherAssigned } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      id,
      { edpCode, subjectName, units, prerequisites, teacherAssigned },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    res.status(200).json({ message: 'Subject updated successfully.', subject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a subject
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findByIdAndDelete(id);

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    res.status(200).json({ message: 'Subject deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all subjects
export const getAllSubjects = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10

    const subjects = await Subject.find()
      .skip((page - 1) * limit) // Skip documents for pagination
      .limit(Number(limit)); // Limit the number of documents returned

    const totalSubjects = await Subject.countDocuments(); // Total number of subjects

    res.status(200).json({
      message: 'Subjects retrieved successfully.',
      subjects,
      totalSubjects,
      totalPages: Math.ceil(totalSubjects / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all teachers
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.status(200).json({ message: 'Teachers retrieved successfully.', teachers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json({ message: 'Students retrieved successfully.', students });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Assign a subject to a teacher using edpCode and teacher name
export const assignSubjectToTeacher = async (req, res) => {
  try {
    const { edpCode, teacherName } = req.body;

    if (!edpCode || !teacherName) {
      return res.status(400).json({ error: 'edpCode and teacherName are required.' });
    }

    const subject = await Subject.findOne({ edpCode });
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    const teacher = await Teacher.findOne({ name: teacherName });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    // Assign the teacher to the subject
    subject.teacherAssigned = teacher._id;
    await subject.save();

    // Add the subject to the teacher's assignedSubjects if not already present
    if (!teacher.assignedSubjects.includes(subject._id)) {
      teacher.assignedSubjects.push(subject._id);
      await teacher.save();
    }

    res.status(200).json({ message: 'Subject assigned to teacher successfully.', subject, teacher });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Assign multiple subjects to a teacher using edpCodes and teacher name
export const assignSubjectsToTeacher = async (req, res) => {
  try {
    const { edpCodes, teacherName } = req.body;

    if (!Array.isArray(edpCodes) || !teacherName) {
      return res.status(400).json({ error: 'edpCodes (array) and teacherName are required.' });
    }

    const teacher = await Teacher.findOne({ name: teacherName });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    const updatedSubjects = [];

    for (const edpCode of edpCodes) {
      const subject = await Subject.findOne({ edpCode });
      if (!subject) {
        return res.status(404).json({ error: `Subject with edpCode ${edpCode} not found.` });
      }
      subject.teacherAssigned = teacher._id;
      await subject.save();

      if (!teacher.assignedSubjects.includes(subject._id)) {
        teacher.assignedSubjects.push(subject._id);
      }
      updatedSubjects.push(subject);
    }

    await teacher.save();

    res.status(200).json({ message: 'Subjects assigned to teacher successfully.', teacher, subjects: updatedSubjects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Sample Postman request body for adding a subject
// {
//   "subjectName": "Mathematics 101",
//   "units": 3,
//   "prerequisites": ["Math 100"], // Optional
//   "teacherAssigned": "John Doe" // Optional, if you want to assign a teacher
// }
// Sample Postman request body for updating a subject
// {
//   "subjectName": "Mathematics 102",
//   "units": 4,
//   "prerequisites": ["Math 101"], // Optional
//   "teacherAssigned": "Jane Smith" // Optional, if you want to assign a teacher
// }
// Sample Postman request body for deleting a subject
// {
//   "id": "subject_id_here" // The ID of the subject to delete
// }
// Sample Postman request body for getting all subjects
// {
//   "page": 1, // Optional, for pagination
//   "limit": 10 // Optional, for pagination
// }
// Sample Postman request body for getting all teachers
// {
//   // No request body needed, just send a GET request to /admin/teachers  
// }

// Sample Postman request body for getting all students
// {
//   // No request body needed, just send a GET request to /admin/students
// }
// Sample Postman request body for assigning a subject to a teacher
// {
//   "subjectId": "subject_id_here", // The ID of the subject to assign
//   "teacherId": "teacher_id_here" // The ID of the teacher to assign the subject to
// }
// Sample Postman request body for assigning multiple subjects to a teacher
// {
//   "subjectIds": ["subject_id_1", "subject_id_2"], // Array of subject IDs to assign
//   "teacherId": "teacher_id_here" // The ID of the teacher to assign the subjects to
// }


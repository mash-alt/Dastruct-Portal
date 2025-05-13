import subjectSchema from '../schema/subject.js';
import Teacher from '../schema/teacher.js'; // Import the Teacher model
import Student from '../schema/student.js'; // Import the Student model
import { programs } from '../constants/PROGRAMS.js'; // Import programs for department validation

const Subject = subjectSchema;
const programCodes = programs.map(program => program.code); // Extract program codes for validation

const generateEdpCode = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString(); // Ensures an 8-digit number
  };


// Add a new subject
export const addSubject = async (req, res) => {
  try {
    const { 
      subjectName, 
      units, 
      prerequisites, 
      teacherAssigned, 
      department, 
      yearLevel, 
      semester 
    } = req.body;    // Validate input
    
    if (!subjectName || !units) {
      return res.status(400).json({ error: 'subjectName and units are required.' });
    }
    
    // Validate department if provided
    if (department && !programCodes.includes(department)) {
      return res.status(400).json({ 
        error: `Invalid department code. Must be one of: ${programCodes.join(', ')}` 
      });
    }
    
    // Validate yearLevel if provided
    if (yearLevel && ![1, 2, 3, 4].includes(yearLevel)) {
      return res.status(400).json({ 
        error: 'Year level must be 1, 2, 3, or 4.' 
      });
    }
    
    // Validate semester if provided
    if (semester && !['First', 'Second', 'Summer'].includes(semester)) {
      return res.status(400).json({ 
        error: 'Semester must be First, Second, or Summer.' 
      });
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
      department: department || 'BSIT', // Set department with default to BSIT if not provided
      yearLevel: yearLevel || 1, // Default to 1st year if not provided
      semester: semester || 'First', // Default to First semester if not provided
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
    const { edpCode } = req.params;
    const { subjectName, units, prerequisites, department, yearLevel, semester } = req.body;
    
    // Validate department if provided
    if (department && !programCodes.includes(department)) {
      return res.status(400).json({ 
        error: `Invalid department code. Must be one of: ${programCodes.join(', ')}` 
      });
    }
    
    // Validate yearLevel if provided
    if (yearLevel && ![1, 2, 3, 4].includes(yearLevel)) {
      return res.status(400).json({ 
        error: 'Year level must be 1, 2, 3, or 4.' 
      });
    }
    
    // Validate semester if provided
    if (semester && !['First', 'Second', 'Summer'].includes(semester)) {
      return res.status(400).json({ 
        error: 'Semester must be First, Second, or Summer.' 
      });
    }

    // Find subject by edpCode and update only allowed fields
    const subject = await Subject.findOneAndUpdate(
      { edpCode },
      { subjectName, units, prerequisites, department, yearLevel, semester },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({ error: `Subject with edpCode ${edpCode} not found.` });
    }

    res.status(200).json({ message: 'Subject updated successfully.', subject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update year level and semester for subjects
export const updateSubjectsYearLevelAndSemester = async (req, res) => {
  try {
    const { subjects } = req.body;
    
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'A valid array of subjects is required.' });
    }
    
    const results = [];
    
    for (const subjectUpdate of subjects) {
      const { edpCode, yearLevel, semester } = subjectUpdate;
      
      // Validate required fields
      if (!edpCode) {
        results.push({ edpCode, status: 'error', message: 'edpCode is required' });
        continue;
      }
      
      // Validate yearLevel if provided
      if (yearLevel && ![1, 2, 3, 4].includes(yearLevel)) {
        results.push({ 
          edpCode, 
          status: 'error', 
          message: 'Year level must be 1, 2, 3, or 4.' 
        });
        continue;
      }
      
      // Validate semester if provided
      if (semester && !['First', 'Second', 'Summer'].includes(semester)) {
        results.push({ 
          edpCode, 
          status: 'error', 
          message: 'Semester must be First, Second, or Summer.' 
        });
        continue;
      }
      
      // Find and update the subject
      const subject = await Subject.findOne({ edpCode });
      if (!subject) {
        results.push({ edpCode, status: 'error', message: 'Subject not found' });
        continue;
      }
      
      // Update only if values are provided
      if (yearLevel) subject.yearLevel = yearLevel;
      if (semester) subject.semester = semester;
      
      await subject.save();
      results.push({ 
        edpCode, 
        status: 'success', 
        message: 'Subject updated successfully',
        subject: {
          subjectName: subject.subjectName,
          yearLevel: subject.yearLevel,
          semester: subject.semester
        }
      });
    }
    
    res.status(200).json({ 
      message: 'Subjects updated successfully.', 
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a subject
export const deleteSubject = async (req, res) => {
  try {
    const { edpCode } = req.params;

    const subject = await Subject.findOneAndDelete({ edpCode });

    if (!subject) {
      return res.status(404).json({ error: `Subject with edpCode ${edpCode} not found.` });
    }

    res.status(200).json({ message: 'Subject deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get paginated subjects with filters
export const getFilteredSubjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, department, searchTerm } = req.query; // Added department and searchTerm filters
    
    // Build filter object
    const filter = {};
    
    // Add department filter if provided
    if (department) {
      filter.department = department;
    }
    
    // Add search term filter if provided
    if (searchTerm) {
      filter.$or = [
        { subjectName: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive search in name
        { edpCode: { $regex: searchTerm, $options: 'i' } }     // Case-insensitive search in edpCode
      ];
    }

    const subjects = await Subject.find(filter)
      .skip((page - 1) * limit) // Skip documents for pagination
      .limit(Number(limit)); // Limit the number of documents returned

    const totalSubjects = await Subject.countDocuments(filter); // Total number of filtered subjects

    res.status(200).json({
      message: 'Subjects retrieved successfully.',
      subjects,
      totalSubjects,
      totalPages: Math.ceil(totalSubjects / limit),
      currentPage: Number(page),
      filters: {
        department,
        searchTerm
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all subjects without pagination
export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();
    const totalSubjects = subjects.length;

    res.status(200).json({
      message: 'All subjects retrieved successfully.',
      subjects,
      totalSubjects
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard data with counts and statistics
export const getDashboardData = async (req, res) => {
  try {
    // Get counts of entities
    const teacherCount = await Teacher.countDocuments();
    const studentCount = await Student.countDocuments();
    const subjectCount = await Subject.countDocuments();
    
    // Get subjects per department
    const subjects = await Subject.find();
    const subjectsByDepartment = {};
    
    // Initialize with all program codes (even those with zero subjects)
    programCodes.forEach(code => {
      subjectsByDepartment[code] = 0;
    });
    
    // Count subjects per department
    subjects.forEach(subject => {
      const dept = subject.department || 'BSIT'; // Default to BSIT if department is not set
      if (subjectsByDepartment[dept] !== undefined) {
        subjectsByDepartment[dept]++;
      } else {
        // Handle any departments not in programCodes
        subjectsByDepartment[dept] = 1;
      }
    });
    
    res.status(200).json({
      message: 'Dashboard data retrieved successfully.',
      counts: {
        teachers: teacherCount,
        students: studentCount,
        subjects: subjectCount
      },
      subjectsByDepartment
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

// Get assigned subjects for a specific teacher by name
export const getTeacherAssignedSubjects = async (req, res) => {
  try {
    const { teacherName } = req.params;
    
    if (!teacherName) {
      return res.status(400).json({ error: 'Teacher name is required.' });
    }

    // Find the teacher by name
    const teacher = await Teacher.findOne({ name: teacherName });
    
    if (!teacher) {
      return res.status(404).json({ error: `Teacher with name "${teacherName}" not found.` });
    }    // Populate the assignedSubjects field to get full subject details
    await teacher.populate('assignedSubjects');
    
    // Extract subject details: name, department, units, and edpCode
    const subjectsInfo = teacher.assignedSubjects.map(subject => ({
      name: subject.subjectName,
      department: subject.department,
      units: subject.units,
      edpCode: subject.edpCode
    }));
    
    res.status(200).json({
      message: 'Teacher assigned subjects retrieved successfully.',
      teacher: {
        name: teacher.name,
        email: teacher.email,
        department: teacher.department
      },
      assignedSubjects: subjectsInfo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin function to enroll a student in subjects
export const adminEnrollStudent = async (req, res) => {
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

// Sample Postman request body for adding a subject
// {
//   "subjectName": "Mathematics 101",
//   "units": 3,
//   "prerequisites": ["Math 100"], // Optional
//   "teacherAssigned": "John Doe", // Optional, if you want to assign a teacher
//   "department": "BSIT" // Optional, defaults to BSIT if not provided
// }
// Sample Postman request body for updating a subject (PUT /admin/subjects/:edpCode)
// {
//   "subjectName": "Mathematics 102",
//   "units": 4,
//   "prerequisites": ["Math 101"], // Optional
//   "department": "BSCS" // Optional, must be a valid program code
// }
// Sample Postman request for deleting a subject (DELETE /admin/subjects/:edpCode)
// No request body needed, the edpCode is in the URL
// Sample Postman request for filtered subjects
// GET /api/admin/subjects?page=1&limit=10&department=BSIT&searchTerm=Math
// {
//   // No request body needed, all parameters are sent as query parameters
//   // page: Optional, for pagination (default: 1)
//   // limit: Optional, for pagination (default: 10)
//   // department: Optional, filter by department code
//   // searchTerm: Optional, search in subject name and edpCode
// }
// Sample Postman request for getting all subjects
// GET /api/admin/all-subjects
// {
//   // No request body needed, returns all subjects without pagination
// }
// Sample Postman request for getting dashboard data
// GET /api/admin/dashboard
// {
//   // No request body needed, returns counts and statistics
//   // Response includes:
//   // - counts: { teachers, students, subjects }
//   // - subjectsByDepartment: Dictionary with program codes as keys and counts as values
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

// Sample Postman request for getting assigned subjects for a specific teacher
// GET /api/admin/teachers/:teacherName/subjects
// {
//   // No request body needed, the teacher name is in the URL
//   // Response includes:
//   // - teacher: Basic teacher info (name, email, department)
//   // - assignedSubjects: Array of subject objects assigned to this teacher
// }


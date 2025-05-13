// populate-students.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import Student from '../schema/student.js';
import { programs } from '../constants/PROGRAMS.js';

dotenv.config();

const SALT_ROUNDS = 10;

// Generate random 8-digit studentId with ucb- prefix
const generateStudentId = () => {
  return `ucb-${Math.floor(10000000 + Math.random() * 90000000)}`; // 8-digit number
};

// Generate a random birth date for a college student (18-24 years old)
const generateBirthDate = () => {
  const now = new Date();
  const yearMin = now.getFullYear() - 24; // 24 years ago
  const yearMax = now.getFullYear() - 18; // 18 years ago
  
  const year = Math.floor(Math.random() * (yearMax - yearMin + 1)) + yearMin;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1; // Avoiding edge cases with month lengths
  
  return new Date(year, month, day);
};

// Generate a random year level (1-4)
const generateYearLevel = () => {
  return Math.floor(Math.random() * 4) + 1;
};

// Generate a random section (A-F)
const generateSection = () => {
  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
  return sections[Math.floor(Math.random() * sections.length)];
};

// Generate a random Filipino address
const generateAddress = () => {
  const streets = [
    'Rizal Avenue', 'Mabini Street', 'Quezon Boulevard', 'Taft Avenue', 
    'EDSA', 'Ortigas Avenue', 'Marcos Highway', 'Roxas Boulevard', 
    'C5 Road', 'Aurora Boulevard', 'Commonwealth Avenue', 'Shaw Boulevard'
  ];
  
  const cities = [
    'Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 
    'Pasay', 'Caloocan', 'Mandaluyong', 'Marikina', 'Parañaque', 
    'Las Piñas', 'Muntinlupa'
  ];
  
  const streetNumber = Math.floor(Math.random() * 1000) + 1;
  const street = streets[Math.floor(Math.random() * streets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  
  return `${streetNumber} ${street}, ${city}, Metro Manila`;
};

// Generate a random Philippine phone number (09XX format)
const generatePhoneNumber = () => {
  const prefix = '09';
  let suffix = '';
  
  for (let i = 0; i < 9; i++) {
    suffix += Math.floor(Math.random() * 10);
  }
  
  return prefix + suffix;
};

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Generate a list of student data
const generateStudents = async (count) => {
  const students = [];
  const firstNames = [
    'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Sofia', 
    'Miguel', 'Lourdes', 'Eduardo', 'Teresa', 'Luis', 'Josephine', 'Antonio', 
    'Patricia', 'Marco', 'Angelica', 'Gabriel', 'Cristina', 'Angelo', 'Paula', 
    'Rafael', 'Maricel', 'Daniel', 'Victoria', 'Manuel', 'Andrea', 'Ricardo', 'Margarita'
  ];
  
  const lastNames = [
    'Santos', 'Reyes', 'Cruz', 'Bautista', 'Gonzales', 'Rodriguez', 'Aquino', 
    'Garcia', 'Mendoza', 'Martinez', 'Ramos', 'De la Cruz', 'Flores', 'Villanueva', 
    'Hernandez', 'De Guzman', 'Tan', 'Morales', 'Perez', 'Castillo', 'Torres', 
    'Lopez', 'Pascual', 'Espiritu', 'Diaz', 'Navarro', 'Aguilar', 'Castro', 
    'Domingo', 'Salazar'
  ];
  
  // Get program codes
  const programCodes = programs.map(program => program.code);
  
  const defaultPassword = await hashPassword('password123'); // Same password for all test accounts
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}@student.university.edu`;
    
    const randomProgramIndex = Math.floor(Math.random() * programCodes.length);
    const department = programCodes[randomProgramIndex];
    
    const yearLevel = generateYearLevel();
    const section = generateSection();
    const course = department; // Using department/program code as course
    
    students.push({
      name,
      email,
      password: defaultPassword, // Using the pre-hashed password
      studentId: generateStudentId(),
      bday: generateBirthDate(),
      course,
      yearLevel,
      section,
      address: generateAddress(),
      phoneNumber: generatePhoneNumber(),
      department
    });
  }
  
  return students;
};

// Main function to populate students
async function populateStudents() {
  try {
    // Connect to MongoDB
    const conn_string = process.env.CONN_STRING;
    
    if (!conn_string) {
      console.error('Error: CONN_STRING is not defined in .env file');
      console.log('Make sure you have a .env file with CONN_STRING defined');
      console.log('Example: CONN_STRING=mongodb://localhost:27017/PortalData');
      process.exit(1);
    }
    
    console.log(`Connecting to MongoDB at: ${conn_string}`);
    
    await mongoose.connect(conn_string, {
      useNewURLParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check if there are already students in the database
    const existingStudentCount = await Student.countDocuments();
    console.log(`Found ${existingStudentCount} existing students`);
    
    // Ask for confirmation if students already exist
    if (existingStudentCount > 0) {
      console.log('WARNING: This will add 50 new students to the existing database.');
      console.log('Proceeding...');
    }

    // Generate and insert 50 students
    const students = await generateStudents(50);
    const result = await Student.insertMany(students);
    
    console.log(`Successfully added ${result.length} students to the database!`);
    
    // Print sample of inserted students
    console.log('\nSample of inserted students:');
    for (let i = 0; i < Math.min(5, result.length); i++) {
      console.log(`${result[i].name} (${result[i].studentId}): ${result[i].department}, Year ${result[i].yearLevel}-${result[i].section}`);
    }

  } catch (error) {
    console.error('Error populating students:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script if this is the main module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  populateStudents().then(() => {
    console.log('Student population script completed.');
  });
}

// Export for potential programmatic usage
export { populateStudents };

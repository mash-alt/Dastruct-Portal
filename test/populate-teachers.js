// populate-teachers.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import Teacher from '../schema/teacher.js';
import { programs } from '../constants/PROGRAMS.js';

dotenv.config();

const SALT_ROUNDS = 10;

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
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

// Generate a list of teacher data
const generateTeachers = async (count) => {
  const teachers = [];
  const firstNames = [
    'Roberto', 'Elena', 'Francisco', 'Amelia', 'Fernando', 'Corazon', 
    'Rodrigo', 'Maribel', 'Alejandro', 'Carmela', 'Benjamin', 'Dalisay',
    'Rogelio', 'Maricar', 'Emmanuel', 'Pilar', 'Felipe', 'Josefina',
    'Ramon', 'Rosario', 'David', 'Milagros', 'Ernesto', 'Lorna'
  ];
  
  const lastNames = [
    'Santos', 'Reyes', 'Cruz', 'Bautista', 'Gonzales', 'Rodriguez', 
    'Aquino', 'Garcia', 'Mendoza', 'Martinez', 'Ramos', 'De la Cruz', 
    'Flores', 'Villanueva', 'Hernandez', 'De Guzman', 'Tan', 'Morales', 
    'Perez', 'Castillo', 'Torres', 'Lopez', 'Pascual', 'Espiritu'
  ];

  // Professional titles
  const titles = ['Dr.', 'Prof.', 'Engr.', 'Atty.', 'Dr.'];
  
  // Get program codes
  const programCodes = programs.map(program => program.code);
  
  const defaultPassword = await hashPassword('faculty123'); // Same password for all test accounts
  
  for (let i = 0; i < count; i++) {
    const title = titles[Math.floor(Math.random() * titles.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${title} ${firstName} ${lastName}`;
    
    // Email follows pattern firstname.lastname@faculty.university.edu
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@faculty.university.edu`;
    
    // Assign to a random department from program codes
    const randomProgramIndex = Math.floor(Math.random() * programCodes.length);
    const department = programCodes[randomProgramIndex];
    
    teachers.push({
      name,
      email,
      password: defaultPassword,
      phoneNumber: generatePhoneNumber(),
      department
    });
  }
  
  return teachers;
};

// Main function to populate teachers
async function populateTeachers() {
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

    // Check if there are already teachers in the database
    const existingTeacherCount = await Teacher.countDocuments();
    console.log(`Found ${existingTeacherCount} existing teachers`);
    
    // Ask for confirmation if teachers already exist
    if (existingTeacherCount > 0) {
      console.log('WARNING: This will add 15 new teachers to the existing database.');
      console.log('Proceeding...');
    }

    // Generate and insert 15 teachers
    const teachers = await generateTeachers(15);
    const result = await Teacher.insertMany(teachers);
    
    console.log(`Successfully added ${result.length} teachers to the database!`);
    
    // Print sample of inserted teachers
    console.log('\nSample of inserted teachers:');
    for (let i = 0; i < Math.min(5, result.length); i++) {
      console.log(`${result[i].name} (${result[i].email}): ${result[i].department}`);
    }

  } catch (error) {
    console.error('Error populating teachers:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script if this is the main module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  populateTeachers().then(() => {
    console.log('Teacher population script completed.');
  });
}

// Export for potential programmatic usage
export { populateTeachers };

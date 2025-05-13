# Dastruct Portal Backend - Student Recommendation System

This system provides academic course recommendations for students in a university portal, handling prerequisites, failed subjects, and academic progression.

## Features

- Philippine grading system support (1.0-5.0 where 1.0 is highest and 5.0 is fail)
- Prerequisite tracking and enforcement
- Academic history management
- Subject recommendations based on:
  - Failed subjects (prioritized for retaking)
  - Completed prerequisites
  - Maximum units per semester

## API Endpoints

### Student Endpoints

- **GET /api/student/:studentId/recommendations** - Get recommended subjects for next semester
- **GET /api/student/:studentId/studyload** - Get a student's current study load
- **POST /api/student/enroll** - Enroll a student in subjects
- **POST /api/student/subjects** - Add subjects to a student's enrolled subjects

### Academic Endpoints

- **GET /api/academic/:studentId/progress** - Get a student's complete academic progress
- **POST /api/academic/:studentId/grades** - Record grades for a student's subjects
- **POST /api/academic/simulate-progression** - Simulate a student's academic progression

## Schema

### Student Schema
- Basic information (name, email, etc.)
- Academic history (list of semesters with subjects and grades)
- Enrolled subjects
- Year level, department

### Subject Schema
- Basic information (code, name, units)
- Prerequisites (list of subject codes)
- Department, year level, semester

## Testing

The system includes several test files to validate functionality:

1. **bsit-recommendation-example.js** - Basic recommendation example using real subjects
2. **student-progression-simulation.js** - Simulates a student's progression across multiple semesters
3. **api-based-student-simulation.js** - Tests the API endpoints for student recommendations
4. **recommendation-test.js** - Unit tests for the recommendation algorithm
5. **setup-test-database.js** - Populates the test database with sample subjects

### Running Tests

1. Ensure MongoDB is running
2. Set up environment variables in a `.env` file
3. Install dependencies:
   ```
   npm install
   ```
4. Set up test database:
   ```
   node test/setup-test-database.js
   ```
5. Run tests:
   ```
   node test/bsit-recommendation-example.js
   node test/student-progression-simulation.js
   node test/api-based-student-simulation.js
   ```

## Example Usage

```javascript
// Get recommendations for a student
const recommendations = await getRecommendedSubjects(studentId);

// Extract eligible subjects
const eligibleSubjects = recommendations.eligibleSubjects;

// Check current and next semester information
const currentSemester = recommendations.currentInfo.semester;
const nextSemester = recommendations.nextInfo.semester;
const nextYearLevel = recommendations.nextInfo.yearLevel;
```

## Philippine Grading System

The system uses the Philippine grading system:
- 1.0: Excellent (97-100%)
- 1.25: Very Good (94-96%)
- 1.5: Very Good (91-93%)
- 1.75: Good (88-90%)
- 2.0: Good (85-87%)
- 2.25: Satisfactory (82-84%)
- 2.5: Satisfactory (79-81%)
- 2.75: Fair (76-78%)
- 3.0: Passed (75%)
- 5.0: Failed (Below 75%)

## Architecture

The system follows an MVC architecture:
- **Models**: Student and Subject schemas
- **Controllers**: Handle HTTP requests and responses
- **Services**: Core business logic for recommendations
- **Routes**: Define API endpoints

## Middleware

- Authentication middleware to protect API endpoints
- Role-based authorization (student, teacher, admin)

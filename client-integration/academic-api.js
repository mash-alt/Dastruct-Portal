/**
 * API integration for academic and recommendation features
 * 
 * This module provides a service class for interacting with the Academic API endpoints
 * including retrieving academic progress, recording grades, and running simulations.
 */
class AcademicService {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Set the authorization token for API requests
   * @param {string} token - JWT token
   */
  setAuthToken(token) {
    this.headers = {
      ...this.headers,
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Get subject recommendations for a student
   * @param {string} studentId - Student ID
   * @returns {Promise} - Promise resolving to recommendations data
   */
  async getRecommendedSubjects(studentId) {
    try {
      const response = await fetch(`${this.baseUrl}/student/${studentId}/recommendations`, {
        method: 'GET',
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw error;
    }
  }

  /**
   * Get a student's complete academic progress
   * @param {string} studentId - Student ID
   * @returns {Promise} - Promise resolving to academic progress data
   */
  async getAcademicProgress(studentId) {
    try {
      const response = await fetch(`${this.baseUrl}/academic/${studentId}/progress`, {
        method: 'GET',
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get academic progress:', error);
      throw error;
    }
  }

  /**
   * Record grades for a student's courses
   * @param {string} studentId - Student ID
   * @param {object} gradeData - Object containing academicYear, semester, and grades array
   * @returns {Promise} - Promise resolving to updated academic entry
   */
  async recordGrades(studentId, gradeData) {
    try {
      const response = await fetch(`${this.baseUrl}/academic/${studentId}/grades`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(gradeData)
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to record grades:', error);
      throw error;
    }
  }

  /**
   * Enroll a student in courses for the current semester
   * @param {object} enrollmentData - Object containing studentId, subjectIds, etc.
   * @returns {Promise} - Promise resolving to enrollment results
   */
  async enrollStudent(enrollmentData) {
    try {
      const response = await fetch(`${this.baseUrl}/student/enroll`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(enrollmentData)
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to enroll student:', error);
      throw error;
    }
  }

  /**
   * Get a student's current study load
   * @param {string} studentId - Student ID
   * @returns {Promise} - Promise resolving to study load data
   */
  async getStudyLoad(studentId) {
    try {
      const response = await fetch(`${this.baseUrl}/student/${studentId}/studyload`, {
        method: 'GET',
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get study load:', error);
      throw error;
    }
  }

  /**
   * Run a simulation of academic progression (admin/teacher only)
   * @param {object} simulationData - Object containing studentId and simulation parameters
   * @returns {Promise} - Promise resolving to simulation results
   */
  async simulateProgression(simulationData) {
    try {
      const response = await fetch(`${this.baseUrl}/academic/simulate-progression`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(simulationData)
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to run academic progression simulation:', error);
      throw error;
    }  }
  
  /**
   * Format grades for display using Philippine grading system
   * 
   * @param {number} grade - The numeric grade value (1.0-5.0)
   * @returns {Object} - Formatted grade with text, color and status
   */
  formatGrade(grade) {
    if (grade === null || grade === undefined) {
      return { text: 'N/A', color: 'gray' };
    }
    
    // Using Philippine grading system (1.0-5.0)
    if (grade === 5.0) {
      return { text: '5.0', color: 'red', status: 'Failed' };
    }
    
    let status = 'Passed';
    let color = 'green';
    let description = '';
    
    // Color codes and descriptions based on grade ranges
    if (grade === 1.0) {
      color = '#008000'; // Dark green
      description = 'Excellent (97-100%)';
    } else if (grade <= 1.5) {
      color = '#38b000'; // Green
      description = 'Very Good (91-96%)';
    } else if (grade <= 2.0) {
      color = '#70e000'; // Light green
      description = 'Good (85-90%)';
    } else if (grade <= 2.5) {
      color = '#9ef01a'; // Yellow-green
      description = 'Satisfactory (79-84%)';
    } else if (grade <= 3.0) {
      color = '#e9ff70'; // Light yellow
      description = 'Passing (75-78%)';
    }
    
    return { text: grade.toFixed(2), color, status, description };
  }
}

export default AcademicService;

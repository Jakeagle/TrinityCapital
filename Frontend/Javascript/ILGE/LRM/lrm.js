"use strict";

const lessonServerUrl = "https://tclessonserver-production.up.railway.app";

/**
 * Fetches the lessons assigned to a specific student.
 * @param {object} studentProfile - The profile of the currently logged-in student.
 * @returns {Promise<Array>} A promise that resolves to an array of lesson objects.
 */
async function fetchAssignedLessons(studentProfile) {
  if (!studentProfile || !studentProfile.memberName) {
    console.error("Student profile or memberName is missing.");
    return [];
  }
  const studentId = studentProfile.memberName;

  try {
    const response = await fetch(
      `${lessonServerUrl}/lessons?studentId=${studentId}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const lessons = await response.json();

    return lessons;
  } catch (error) {
    console.error("Could not fetch assigned lessons:", error);
    return []; // Return an empty array in case of an error
  }
}

export { fetchAssignedLessons };

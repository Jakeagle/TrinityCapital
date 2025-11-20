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

async function fetchLessonTimer(studentId, lessonId) {
  if (!studentId || !lessonId) {
    console.error(
      "Student ID and Lesson ID are required to fetch a lesson timer."
    );
    return null;
  }

  try {
    const response = await fetch(
      `${lessonServerUrl}/api/timers?studentId=${studentId}&lessonId=${lessonId}`
    );
    if (!response.ok) {
      if (response.status === 404) {
        console.log(
          `No existing timer found for lesson ${lessonId}. A new one will be created.`
        );
        return null; // It's not an error if the timer doesn't exist yet
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const timerData = await response.json();
    return timerData;
  } catch (error) {
    console.error("Could not fetch lesson timer:", error);
    return null; // Return null in case of an error
  }
}

export { fetchAssignedLessons, fetchLessonTimer };

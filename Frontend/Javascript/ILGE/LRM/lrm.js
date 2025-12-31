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

async function saveLessonTimer(studentId, lessonId, elapsedTime) {
  if (!studentId || !lessonId || elapsedTime === undefined) {
    console.error(
      "Student ID, Lesson ID, and elapsedTime are required to save a lesson timer."
    );
    return false;
  }

  try {
    const response = await fetch(`${lessonServerUrl}/api/timers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId,
        lessonId,
        elapsedTime,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    console.log("Timer saved successfully:", result);
    return true;
  } catch (error) {
    console.error("Could not save lesson timer:", error);
    return false;
  }
}

function saveLessonTimerSync(studentId, lessonId, elapsedTime) {
  if (!studentId || !lessonId || elapsedTime === undefined) {
    console.error(
      "Student ID, Lesson ID, and elapsedTime are required to save a lesson timer."
    );
    return false;
  }

  try {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${lessonServerUrl}/api/timers`, false); // synchronous
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(
      JSON.stringify({
        studentId,
        lessonId,
        elapsedTime,
      })
    );
    if (xhr.status >= 200 && xhr.status < 300) {
      console.log("Timer saved synchronously:", xhr.responseText);
      return true;
    } else {
      console.error(
        "Failed to save timer synchronously:",
        xhr.status,
        xhr.responseText
      );
      return false;
    }
  } catch (error) {
    console.error("Could not save lesson timer synchronously:", error);
    return false;
  }
}

export {
  fetchAssignedLessons,
  fetchLessonTimer,
  saveLessonTimer,
  saveLessonTimerSync,
};

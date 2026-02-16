/* Frontend SDSM sender module
 * Responsible for sending student session data (active lessons, timers, student name)
 * to the backend SDSM endpoint.
 *
 * Endpoint used: https://tclessonserver-production.up.railway.app/api/sdsm/session
 */

import { completedLessons } from "../lessonManager.js";

export async function sendStudentSessionData(payload) {
  try {
    console.log("SDSM: Sending session payload to server...", payload);

    const response = await fetch("https://tclessonserver-production.up.railway.app/api/sdsm/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        "SDSM: Server responded with non-OK status",
        response.status,
        text
      );
      return { ok: false, status: response.status, body: text };
    }

    const data = await response.json();
    console.log("SDSM: Server response OK", data);
    return { ok: true, data };
  } catch (err) {
    console.error("SDSM: Error sending session data", err);
    return { ok: false, error: err.message || err };
  }
}

/**
 * Sends a single completed lesson snapshot to the server immediately
 * @param {string} studentName - The name of the student
 * @param {object} completionData - The lesson completion data with snapshot
 */
export async function sendCompletedLessonSnapshot(studentName, completionData) {
  try {
    const payload = {
      studentName: studentName,
      completedLessons: [completionData],
      timestamp: Date.now(),
    };

    console.log(
      "SDSM: Sending completed lesson snapshot for:",
      completionData.lessonTitle
    );
    const result = await sendStudentSessionData(payload);

    if (result.ok) {
      console.log("SDSM: Completed lesson snapshot sent successfully");
    }
    return result;
  } catch (err) {
    console.error("SDSM: Error sending completed lesson snapshot", err);
    return { ok: false, error: err.message || err };
  }
}

/**
 * Monitors for newly completed lessons and sends them to the server in real-time.
 * With the new backend, this will send all completed lessons every interval,
 * and the backend will handle deduplication and updates.
 * @param {string} studentName - The name of the student
 */
export function initializeCompletionMonitor(studentName) {
  console.log("SDSM: Initializing completion monitor for", studentName);

  const monitorInterval = setInterval(async () => {
    // Get all completed lessons from lessonManager
    const completedLessonArray = Array.from(completedLessons.values());

    // Loop through all completed lessons and send their state to the server.
    // The backend will handle creating new records or updating existing ones.
    for (const completionData of completedLessonArray) {
      console.log(
        "SDSM: Sending state for completed lesson:",
        completionData.lessonTitle
      );

      // Send immediately to server
      const result = await sendCompletedLessonSnapshot(
        studentName,
        completionData
      );

      if (result.ok) {
        console.log(
          "SDSM: Completed lesson data persisted to server:",
          completionData.lessonTitle
        );
      }
    }
  }, 1000); // Check every second

  // Return function to stop monitoring
  return () => {
    clearInterval(monitorInterval);
    console.log("SDSM: Completion monitor stopped");
  };
}

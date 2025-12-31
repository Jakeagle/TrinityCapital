/* Frontend SDSM sender module
 * Responsible for sending student session data (active lessons, timers, student name)
 * to the backend SDSM endpoint.
 *
 * Endpoint used: http://localhost:4000/api/sdsm/session
 */

import { completedLessons } from "../lessonManager.js";

// Track which completed lessons have already been sent to the server
const sentCompletions = new Set();

export async function sendStudentSessionData(payload) {
  try {
    console.log("SDSM: Sending session payload to server...", payload);

    const response = await fetch("http://localhost:4000/api/sdsm/session", {
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
      sentCompletions.add(completionData.lessonId);
    }
    return result;
  } catch (err) {
    console.error("SDSM: Error sending completed lesson snapshot", err);
    return { ok: false, error: err.message || err };
  }
}

/**
 * Monitors for newly completed lessons and sends them to the server in real-time
 * @param {string} studentName - The name of the student
 */
export function initializeCompletionMonitor(studentName) {
  console.log("SDSM: Initializing completion monitor for", studentName);

  const monitorInterval = setInterval(async () => {
    // Get all completed lessons from lessonManager
    const completedLessonArray = Array.from(completedLessons.values());

    // Find lessons that haven't been sent yet
    for (const completionData of completedLessonArray) {
      if (!sentCompletions.has(completionData.lessonId)) {
        console.log(
          "SDSM: Detected new completed lesson:",
          completionData.lessonTitle
        );

        // Send immediately to server
        const result = await sendCompletedLessonSnapshot(
          studentName,
          completionData
        );

        if (result.ok) {
          sentCompletions.add(completionData.lessonId);
          console.log("SDSM: Completed lesson data persisted to server");
        }
      }
    }
  }, 1000); // Check every second

  // Return function to stop monitoring
  return () => {
    clearInterval(monitorInterval);
    console.log("SDSM: Completion monitor stopped");
  };
}

/**
 * Clears the sent completions tracking when needed (e.g., on logout)
 */
export function resetCompletionTracking() {
  sentCompletions.clear();
  console.log("SDSM: Completion tracking reset");
}

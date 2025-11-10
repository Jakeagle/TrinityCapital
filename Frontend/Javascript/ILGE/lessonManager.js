"use strict";

import { fetchAssignedLessons } from "./LRM/lrm.js";
import { actions } from "./CRM/condition-rendering-library.js";

// Use a Map to store active lessons, with lesson_id as the key.
export const activeLessons = new Map();

/**
 * Activates a lesson, adding it to the list of lessons to check for conditions.
 * @param {object} lesson - The lesson object to activate.
 */
export function activateLesson(lesson) {
  if (!lesson || !lesson._id) {
    console.error("Cannot activate lesson without a valid _id.", lesson);
    return;
  }
  console.log("Activating lesson:", lesson.lesson_title);
  activeLessons.set(lesson._id, lesson);
}

/**
 * Deactivates a lesson, removing it from the list of active lessons.
 * @param {string} lessonId - The ID of the lesson to deactivate.
 */
export function deactivateLesson(lessonId) {
  if (activeLessons.has(lessonId)) {
    console.log("Deactivating lesson:", lessonId);
    activeLessons.delete(lessonId);
  }
}

let timerInterval = null;

/**
 * Starts a timer for a given lesson.
 * @param {string} lessonId - The ID of the lesson to start the timer for.
 */
export function startLessonTimer(lessonId) {
  if (!lessonId) {
    console.error("Cannot start timer without a lesson ID.");
    return;
  }
  const timerKey = `lesson_timer_${lessonId}`;
  const startTime = Date.now();
  sessionStorage.setItem(timerKey, startTime);
  console.log(`Timer started for lesson ${lessonId} at ${startTime}.`);

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  // Check for time-based conditions every second
  timerInterval = setInterval(() => {
    const storedStartTime = sessionStorage.getItem(timerKey);
    if (storedStartTime) {
      const elapsedTime = Date.now() - storedStartTime;
      const elapsedSeconds = Math.floor(elapsedTime / 1000);
      console.log(
        `Elapsed time for lesson ${lessonId}: ${elapsedSeconds} seconds.`
      );

      // Check for time-based conditions
      const lesson = activeLessons.get(lessonId);
      if (lesson && lesson.completion_conditions) {
        const timeConditions = lesson.completion_conditions.filter(
          (cond) => cond.condition_type === "elapsed_time" && !cond.isMet
        );

        timeConditions.forEach((condition) => {
          if (elapsedSeconds >= condition.condition_value) {
            console.log(`Condition met for action: elapsed_time`);
            const actionToExecute = actions[condition.action_type];
            if (actionToExecute) {
              console.log(`Executing reaction: ${condition.action_type}`);
              actionToExecute(condition.action_details);
              condition.isMet = true; // Mark as met
            } else {
              console.warn(
                `Action to take "${condition.action_type}" not found in CRM library.`
              );
            }
          }
        });
      }
    }
  }, 1000);
}

/**
 * Processes an action, checks it against all active lessons' conditions,
 * and triggers the appropriate reactions from the CRM.
 * @param {string} actionType - The type of action that occurred.
 * @param {object} actionParams - The parameters associated with the action.
 */
export function processAction(actionType, actionParams) {
  console.log(`Processing action: ${actionType}`, actionParams);

  if (actionType === "begin_activities") {
    if (actionParams.lessonId) {
      startLessonTimer(actionParams.lessonId);
    } else {
      console.error(
        "Action 'begin_activities' requires a lessonId.",
        actionParams
      );
    }
  }

  if (activeLessons.size === 0) {
    console.log("No active lessons to check.");
    return;
  }

  // Iterate over all active lessons
  for (const [lessonId, lesson] of activeLessons.entries()) {
    if (!lesson.completion_conditions) continue;

    // --- DIAGNOSTIC LOG ---
    console.log(
      `Inspecting completion_conditions for lesson: ${lesson.lesson_title}`,
      lesson.completion_conditions
    );

    // Find all conditions in this lesson that match the action type
    const triggeredConditions = lesson.completion_conditions.filter(
      (cond) => cond.condition_type === actionType
    );

    if (triggeredConditions.length > 0) {
      console.log(`\n=== CONDITION CHECK RESULTS ===`);
      console.log(
        `Found ${triggeredConditions.length} matching condition(s) in lesson: ${lesson.lesson_title}`
      );
      console.log(`================================\n`);
      triggeredConditions.forEach((condition) => {
        let conditionMet = true; // Assume true if no condition_value is specified

        // If a condition_value exists, check if the action parameters meet the condition
        if (condition.condition_value) {
          // Check if all properties in condition_value match the actionParams
          conditionMet = Object.entries(condition.condition_value).every(
            ([key, value]) => {
              // For now, we are doing a simple equality check.
              // This can be expanded later to support operators like '>', '<', etc.
              console.log(
                `Checking condition: ${key} === ${value}. Actual value: ${actionParams[key]}`
              );
              return actionParams[key] === value;
            }
          );
        }

        if (conditionMet) {
          console.log(`\n=== CONDITION MATCHED! ===`);
          console.log(`Action type: ${actionType}`);
          console.log(`========================\n`);
          const actionToExecute = actions[condition.action_type];
          if (actionToExecute) {
            console.log(`Executing reaction: ${condition.action_type}`);
            actionToExecute(condition.action_details);
          } else {
            console.warn(
              `Action to take "${condition.action_type}" not found in CRM library.`
            );
          }
        } else {
          console.log(`Condition not met for action: ${actionType}`);
        }
      });
    } else {
      console.log(`\n=== NO MATCHING CONDITIONS ===`);
      console.log(
        `Action type '${actionType}' has no matching conditions in lesson: ${lesson.lesson_title}`
      );
      console.log(`============================\n`);
    }
  }
}

/**
 * Initializes the Interactive Lesson and Grading Engine.
 * @param {object} studentProfile - The profile of the currently logged-in student.
 */
export async function initializeLessonEngine(studentProfile) {
  console.log("Initializing Lesson Engine...");
  const lessons = await fetchAssignedLessons(studentProfile);
  console.log("Lesson Engine Initialized.");
}

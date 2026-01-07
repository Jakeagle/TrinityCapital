/**
 * Lesson Completion Manager - UITM Module
 *
 * This module handles checking lesson completion status and condition tracking
 * when a lesson is started. It prevents duplicate lesson starts and tracks which
 * conditions have already been met.
 */

import { completedLessons, activeLessons } from "../lessonManager.js";
import { createAndShowModal } from "../LRM/conditionRenderer.js";

/**
 * Checks the completion status of a lesson
 * @param {string} lessonId - The ID of the lesson to check
 * @returns {boolean} True if the lesson has been completed
 */
export function isLessonCompleted(lessonId) {
  return completedLessons.has(lessonId);
}

/**
 * Gets the number of conditions that have been completed in a lesson
 * @param {object} lesson - The lesson object
 * @returns {number} Number of met conditions
 */
export function getCompletedConditionsCount(lesson) {
  if (!lesson || !lesson.completion_conditions) {
    return 0;
  }

  return lesson.completion_conditions.filter(
    (condition) => condition.isMet === true
  ).length;
}

/**
 * Gets all met conditions for a lesson
 * @param {object} lesson - The lesson object
 * @returns {array} Array of met conditions
 */
export function getMetConditions(lesson) {
  if (!lesson || !lesson.completion_conditions) {
    return [];
  }

  return lesson.completion_conditions.filter(
    (condition) => condition.isMet === true
  );
}

/**
 * Gets all unmet conditions for a lesson
 * @param {object} lesson - The lesson object
 * @returns {array} Array of unmet conditions
 */
export function getUnmetConditions(lesson) {
  if (!lesson || !lesson.completion_conditions) {
    return [];
  }

  return lesson.completion_conditions.filter(
    (condition) => condition.isMet !== true
  );
}

/**
 * Checks if a lesson has been partially completed (some conditions met)
 * @param {object} lesson - The lesson object
 * @returns {boolean} True if at least one condition is met but not all
 */
export function isLessonPartiallyCompleted(lesson) {
  if (!lesson || !lesson.completion_conditions) {
    return false;
  }

  const completedCount = getCompletedConditionsCount(lesson);
  const totalCount = lesson.completion_conditions.length;

  return completedCount > 0 && completedCount < totalCount;
}

/**
 * Displays a modal indicating the lesson has already been completed
 * @param {object} lesson - The completed lesson object
 */
export function showLessonAlreadyCompletedModal(lesson) {
  console.log(
    `UITM_LCM: Lesson "${lesson.lesson_title}" has already been completed.`
  );

  createAndShowModal({
    title: "Lesson Complete",
    message: `You have already completed the lesson: "${lesson.lesson_title}". All conditions have been met.`,
  });
}

/**
 * Displays a modal indicating the lesson has partial completion with details
 * @param {object} lesson - The lesson object with partial completion
 */
export function showLessonPartialCompletionWarning(lesson) {
  const completedCount = getCompletedConditionsCount(lesson);
  const totalCount = lesson.completion_conditions.length;
  const metConditions = getMetConditions(lesson);

  console.log(
    `UITM_LCM: Lesson "${lesson.lesson_title}" has partial completion (${completedCount}/${totalCount} conditions met).`
  );

  // Build a message showing which conditions are met
  let conditionDetails = metConditions
    .map((cond) => `• ${cond.condition_type} (action: ${cond.action_type})`)
    .join("\n");

  createAndShowModal({
    title: "Lesson Partially Started",
    message: `The lesson "${lesson.lesson_title}" was previously started.\n\n${completedCount} out of ${totalCount} conditions have been completed:\n\n${conditionDetails}\n\nResuming from where you left off.`,
  });
}

/**
 * Main validation function - call this when a lesson is about to be started
 *
 * Returns an object with:
 * - shouldProceed: boolean indicating if the lesson should continue
 * - status: 'completed' | 'partial' | 'fresh' | 'error'
 * - message: description of what happened
 * @param {object} lesson - The lesson object being started
 * @returns {object} Validation result
 */
export function validateLessonStart(lesson) {
  if (!lesson || !lesson._id) {
    console.error("UITM_LCM: Invalid lesson object provided");
    return {
      shouldProceed: false,
      status: "error",
      message: "Invalid lesson object",
    };
  }

  const lessonId = lesson._id;
  const completedCount = getCompletedConditionsCount(lesson);
  const totalCount = lesson.completion_conditions
    ? lesson.completion_conditions.length
    : 0;

  // Check A: Is the lesson already fully completed?
  if (isLessonCompleted(lessonId)) {
    console.log(
      `UITM_LCM: Lesson "${lesson.lesson_title}" is already fully completed.`
    );

    showLessonAlreadyCompletedModal(lesson);

    return {
      shouldProceed: false,
      status: "completed",
      message: "Lesson has already been completed",
      completedCount,
      totalCount,
    };
  }

  // Check B: Are there some conditions already completed?
  if (completedCount > 0 && completedCount < totalCount) {
    console.log(
      `UITM_LCM: Lesson "${lesson.lesson_title}" has partial completion (${completedCount}/${totalCount}).`
    );

    showLessonPartialCompletionWarning(lesson);

    return {
      shouldProceed: true,
      status: "partial",
      message: "Lesson is being resumed with some conditions already met",
      completedCount,
      totalCount,
    };
  }

  // Fresh start - no conditions met
  console.log(
    `UITM_LCM: Lesson "${lesson.lesson_title}" is starting fresh with no conditions met yet.`
  );

  return {
    shouldProceed: true,
    status: "fresh",
    message: "Lesson is starting fresh",
    completedCount,
    totalCount,
  };
}

/**
 * Logs the current state of a lesson's conditions for debugging
 * @param {object} lesson - The lesson object
 */
export function logLessonConditionState(lesson) {
  if (!lesson || !lesson.completion_conditions) {
    console.log("UITM_LCM: Lesson has no conditions to log");
    return;
  }

  console.group(`📚 Lesson Condition State: "${lesson.lesson_title}"`);
  console.log(`Total Conditions: ${lesson.completion_conditions.length}`);

  lesson.completion_conditions.forEach((condition, index) => {
    const status = condition.isMet ? "✅ MET" : "❌ NOT MET";
    console.log(
      `${status} - Condition ${index + 1}: ${condition.condition_type} (action: ${condition.action_type})`
    );
  });

  console.groupEnd();
}

/**
 * Resets a lesson's condition state (use carefully - for testing/admin only)
 * @param {object} lesson - The lesson object
 */
export function resetLessonConditionState(lesson) {
  if (!lesson || !lesson.completion_conditions) {
    console.warn("UITM_LCM: Cannot reset - lesson has no conditions");
    return;
  }

  console.warn(
    `UITM_LCM: Resetting condition state for "${lesson.lesson_title}"`
  );

  lesson.completion_conditions.forEach((condition) => {
    condition.isMet = false;
  });

  lesson.firedActions = new Set();

  if (completedLessons.has(lesson._id)) {
    completedLessons.delete(lesson._id);
  }

  if (activeLessons.has(lesson._id)) {
    activeLessons.delete(lesson._id);
  }

  console.log(`UITM_LCM: Condition state reset for "${lesson.lesson_title}"`);
}

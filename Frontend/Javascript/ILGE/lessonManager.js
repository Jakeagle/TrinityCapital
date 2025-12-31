"use strict";

import { fetchAssignedLessons, fetchLessonTimer } from "./LRM/lrm.js";
import { actions } from "./CRM/condition-rendering-library.js";

let currentStudentProfile = null;

// Use a Map to store active lessons, with lesson_id as the key.
export const activeLessons = new Map();

// Use a Map to store completed lessons with snapshots
export const completedLessons = new Map();

/**
 * Collects a snapshot of the student's current in-app data for grading purposes.
 * @returns {object} Snapshot containing bills, balances, income/spending data, etc.
 */
function getStudentDataSnapshot() {
  const snapshot = {
    timestamp: new Date().toISOString(),
    bills: [],
    paychecks: [],
    checkingBalance: 0,
    savingsBalance: 0,
    incomeSpendingRatio: 0,
    monthlyBudget: 0,
    totalBalance: 0,
  };

  try {
    // Get checking balance
    const checkingBalanceEl = document.querySelector(
      '.checking-balance, .checkingBalance, [data-balance="checking"]'
    );
    if (checkingBalanceEl) {
      snapshot.checkingBalance =
        parseFloat(checkingBalanceEl.textContent.replace(/[^0-9.-]/g, "")) || 0;
    }

    // Get savings balance
    const savingsBalanceEl = document.querySelector(
      '.savings-balance, .savingsBalance, [data-balance="savings"]'
    );
    if (savingsBalanceEl) {
      snapshot.savingsBalance =
        parseFloat(savingsBalanceEl.textContent.replace(/[^0-9.-]/g, "")) || 0;
    }

    // Calculate total balance
    snapshot.totalBalance = snapshot.checkingBalance + snapshot.savingsBalance;

    // Get monthly budget
    const budgetEl = document.querySelector(
      ".monthly-budget, .budget-amount, [data-budget]"
    );
    if (budgetEl) {
      snapshot.monthlyBudget =
        parseFloat(budgetEl.textContent.replace(/[^0-9.-]/g, "")) || 0;
    }

    // Get income/spending ratio
    const ratioEl = document.querySelector(
      ".income-ratio, .spending-ratio, [data-ratio]"
    );
    if (ratioEl) {
      snapshot.incomeSpendingRatio =
        parseFloat(ratioEl.textContent.replace(/[^0-9.-]/g, "")) || 0;
    }

    // Get bills from current profile or DOM
    if (currentStudentProfile && currentStudentProfile.bills) {
      snapshot.bills = currentStudentProfile.bills;
    } else {
      // Try to collect from DOM
      const billElements = document.querySelectorAll(".bill-item, .bill-entry");
      billElements.forEach((bill) => {
        const name =
          bill.querySelector(".bill-name, .vendor")?.textContent || "Unknown";
        const amount =
          parseFloat(
            bill
              .querySelector(".bill-amount, .amount")
              ?.textContent.replace(/[^0-9.-]/g, "")
          ) || 0;
        const dueDate = bill.querySelector(".due-date")?.textContent || "";
        snapshot.bills.push({ name, amount, dueDate });
      });
    }

    // Get paychecks from current profile or DOM
    if (currentStudentProfile && currentStudentProfile.paychecks) {
      snapshot.paychecks = currentStudentProfile.paychecks;
    } else {
      // Try to collect from DOM
      const paycheckElements = document.querySelectorAll(
        ".paycheck-item, .income-entry"
      );
      paycheckElements.forEach((paycheck) => {
        const amount =
          parseFloat(
            paycheck
              .querySelector(".paycheck-amount, .amount")
              ?.textContent.replace(/[^0-9.-]/g, "")
          ) || 0;
        const date =
          paycheck.querySelector(".paycheck-date, .date")?.textContent || "";
        snapshot.paychecks.push({ amount, date });
      });
    }

    console.log("Collected student data snapshot:", snapshot);
  } catch (error) {
    console.error("Error collecting student data snapshot:", error);
  }

  return snapshot;
}

/**
 * Checks if a lesson is complete based on its completion conditions.
 * @param {object} lesson - The lesson object to check.
 * @returns {boolean} True if all conditions are met.
 */
function isLessonComplete(lesson) {
  if (!lesson || !lesson.completion_conditions) {
    return false;
  }

  return lesson.completion_conditions.every(
    (condition) => condition.isMet === true
  );
}

/**
 * Marks a lesson as complete and stores the completion data with snapshot.
 * @param {object} lesson - The completed lesson object.
 */
function markLessonComplete(lesson) {
  if (!lesson || !lesson._id) {
    console.error("Cannot mark lesson complete without valid lesson object");
    return;
  }

  const snapshot = getStudentDataSnapshot();
  const completionData = {
    lessonId: lesson._id,
    lessonTitle: lesson.lesson_title,
    completedAt: new Date().toISOString(),
    snapshot: snapshot,
  };

  completedLessons.set(lesson._id, completionData);
  console.log(
    `Lesson "${lesson.lesson_title}" marked as complete with snapshot`
  );

  // Optionally deactivate the lesson since it's complete
  deactivateLesson(lesson._id);
}

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
  lesson.firedActions = new Set();
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
let activeTimerLessonId = null;

/**
 * Starts a timer for a given lesson.
 * @param {string} lessonId - The ID of the lesson to start the timer for.
 */
export async function startLessonTimer(lessonId, initialElapsedTime = null) {
  if (timerInterval && activeTimerLessonId === lessonId) {
    console.log(`Timer for lesson ${lessonId} is already running.`);
    return;
  }

  if (!lessonId) {
    console.error("Cannot start timer without a lesson ID.");
    return;
  }

  const studentId = currentStudentProfile
    ? currentStudentProfile.memberName
    : null;
  if (!studentId) {
    console.error("Cannot start timer without a student ID.");
    return;
  }

  const timerKey = `lesson_timer_${lessonId}`;
  let existingElapsedTime = 0; // in seconds

  if (initialElapsedTime !== null && initialElapsedTime > 0) {
    existingElapsedTime = initialElapsedTime;
  } else {
    const timerData = await fetchLessonTimer(studentId, lessonId);
    if (timerData) {
      if (Array.isArray(timerData) && timerData.length > 0) {
        existingElapsedTime = timerData[0].elapsedTime || 0;
      } else if (timerData.elapsedTime) {
        existingElapsedTime = timerData.elapsedTime;
      }
    }
  }

  if (existingElapsedTime > 0) {
    console.log(
      `Resuming timer for lesson ${lessonId}. Fetched elapsed time: ${existingElapsedTime} seconds.`
    );
  } else {
    console.log(`Starting new timer for lesson ${lessonId}.`);
  }

  const timerData = {
    startTime: Date.now(),
    initialElapsedTime: existingElapsedTime, // in seconds
  };
  console.log(`Timer for lesson ${lessonId} set with data:`, timerData);

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  activeTimerLessonId = lessonId;

  timerInterval = setInterval(() => {
    const currentSessionTime = Date.now() - timerData.startTime; // in ms
    const totalElapsedTime =
      timerData.initialElapsedTime * 1000 + currentSessionTime; // in ms

    const elapsedSeconds = Math.floor(totalElapsedTime / 1000);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    const lesson = activeLessons.get(lessonId);
    if (lesson) {
      lesson.elapsedTime = elapsedSeconds; // Storing total elapsed seconds
      if (lesson.completion_conditions) {
        const timeConditions = lesson.completion_conditions.filter(
          (cond) => cond.condition_type === "elapsed_time" && !cond.isMet
        );

        timeConditions.forEach((condition) => {
          if (elapsedSeconds >= condition.condition_value) {
            const actionName = condition.action_type;
            if (lesson.firedActions.has(actionName)) {
              // Action has already fired for this lesson, so we just ensure the condition is marked as met.
              if (!condition.isMet) {
                console.log(
                  `Action '${actionName}' has already been fired for lesson '${lesson.lesson_title}'. Marking condition as met.`
                );
                condition.isMet = true;
              }
              return; // Skip to the next condition.
            }

            console.log(
              `Condition met for elapsed_time. Executing action: ${actionName}`
            );
            const actionToExecute = actions[actionName];
            if (actionToExecute) {
              actionToExecute(condition.action_details);
              lesson.firedActions.add(actionName); // Record that the action has been fired.
              condition.isMet = true; // Mark the condition as met.

              // After executing an action, check if the lesson is now complete.
              if (isLessonComplete(lesson)) {
                console.log(
                  `All conditions met for lesson: ${lesson.lesson_title}`
                );
                markLessonComplete(lesson);
              }
            } else {
              console.warn(
                `Action to take "${actionName}" not found in CRM library.`
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
export async function processAction(actionType, actionParams) {
  console.log(`Processing action: ${actionType}`, actionParams);

  if (actionType === "begin_activities") {
    if (actionParams.lessonId) {
      await startLessonTimer(actionParams.lessonId, actionParams.elapsedTime);
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

  for (const [lessonId, lesson] of activeLessons.entries()) {
    if (!lesson.completion_conditions) continue;

    const triggeredConditions = lesson.completion_conditions.filter(
      (cond) => cond.condition_type === actionType && !cond.isMet
    );

    triggeredConditions.forEach((condition) => {
      let conditionMet = true;

      if (condition.condition_value) {
        conditionMet = Object.entries(condition.condition_value).every(
          ([key, value]) => {
            console.log(
              `Checking condition: ${key} === ${value}. Actual value: ${actionParams[key]}`
            );
            return actionParams[key] === value;
          }
        );
      }

      if (conditionMet) {
        const actionName = condition.action_type;
        if (lesson.firedActions.has(actionName)) {
          console.log(
            `Action '${actionName}' has already fired for lesson '${lesson.lesson_title}'. Skipping.`
          );
          condition.isMet = true; // Still mark condition as met
          return; // Using return because it's in a forEach loop
        }

        const actionToExecute = actions[actionName];
        if (actionToExecute) {
          console.log(`Executing reaction: ${actionName}`);
          actionToExecute(condition.action_details);
          lesson.firedActions.add(actionName); // Record the action
          condition.isMet = true;

          if (isLessonComplete(lesson)) {
            console.log(
              `All conditions met for lesson: ${lesson.lesson_title}`
            );
            markLessonComplete(lesson);
          }
        } else {
          console.warn(
            `Action to take "${actionName}" not found in CRM library.`
          );
        }
      } else {
        console.log(`Condition not met for action: ${actionType}`);
      }
    });
  }
}

/**
 * Initializes the Interactive Lesson and Grading Engine.
 * @param {object} studentProfile - The profile of the currently logged-in student.
 */
export async function initializeLessonEngine(studentProfile) {
  console.log("Initializing Lesson Engine...");
  currentStudentProfile = studentProfile;
  const lessons = await fetchAssignedLessons(studentProfile);
  console.log("Lesson Engine Initialized.");

  // Initialize SDSM completion monitor
  try {
    const { initializeCompletionMonitor } = await import("./SDSM/sdsm.js");
    if (studentProfile && studentProfile.memberName) {
      initializeCompletionMonitor(studentProfile.memberName);
      console.log("SDSM completion monitor initialized");
    }
  } catch (err) {
    console.error("Failed to initialize SDSM completion monitor:", err);
  }
}

/**
 * Gets the current completed lessons map
 * @returns {Map} Map of completed lessons
 */
export function getCompletedLessons() {
  return completedLessons;
}

/**
 * Checks if a lesson has all its conditions met
 * @param {string} lessonId - The lesson ID to check
 * @returns {boolean} True if all conditions are met
 */
export function checkLessonCompletion(lessonId) {
  const lesson = activeLessons.get(lessonId);
  if (!lesson || !lesson.completion_conditions) {
    return false;
  }
  return isLessonComplete(lesson);
}

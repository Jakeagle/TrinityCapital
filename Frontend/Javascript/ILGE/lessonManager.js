'use strict';

import { fetchAssignedLessons } from './LRM/lrm.js';
import { actions } from './CRM/condition-rendering-library.js';

// Use a Map to store active lessons, with lesson_id as the key.
const activeLessons = new Map();

/**
 * Activates a lesson, adding it to the list of lessons to check for conditions.
 * @param {object} lesson - The lesson object to activate.
 */
export function activateLesson(lesson) {
  if (!lesson || !lesson._id) {
    console.error("Cannot activate lesson without a valid _id.", lesson);
    return;
  }
  console.log('Activating lesson:', lesson.lesson_title);
  activeLessons.set(lesson._id, lesson);
}

/**
 * Deactivates a lesson, removing it from the list of active lessons.
 * @param {string} lessonId - The ID of the lesson to deactivate.
 */
export function deactivateLesson(lessonId) {
    if (activeLessons.has(lessonId)) {
        console.log('Deactivating lesson:', lessonId);
        activeLessons.delete(lessonId);
    }
}


/**
 * Processes an action, checks it against all active lessons' conditions,
 * and triggers the appropriate reactions from the CRM.
 * @param {string} actionType - The type of action that occurred.
 * @param {object} actionParams - The parameters associated with the action.
 */
export function processAction(actionType, actionParams) {
  console.log(`Processing action: ${actionType}`, actionParams);

  if (activeLessons.size === 0) {
    console.log('No active lessons to check.');
    return;
  }

  // Iterate over all active lessons
  for (const [lessonId, lesson] of activeLessons.entries()) {
    if (!lesson.completion_conditions) continue;

    // --- DIAGNOSTIC LOG ---
    console.log(`Inspecting completion_conditions for lesson: ${lesson.lesson_title}`, lesson.completion_conditions);

    // Find all conditions in this lesson that match the action type
    const triggeredConditions = lesson.completion_conditions.filter(
      (cond) => cond.condition_type === actionType
    );

    if (triggeredConditions.length > 0) {
        console.log(`Found ${triggeredConditions.length} matching condition(s) in lesson: ${lesson.lesson_title}`);
        triggeredConditions.forEach(condition => {
            let conditionMet = true; // Assume true if no condition_value is specified

            // If a condition_value exists, check if the action parameters meet the condition
            if (condition.condition_value) {
                // Check if all properties in condition_value match the actionParams
                conditionMet = Object.entries(condition.condition_value).every(([key, value]) => {
                    // For now, we are doing a simple equality check.
                    // This can be expanded later to support operators like '>', '<', etc.
                    console.log(`Checking condition: ${key} === ${value}. Actual value: ${actionParams[key]}`);
                    return actionParams[key] === value;
                });
            }

            if (conditionMet) {
                console.log(`Condition met for action: ${actionType}`);
                const actionToExecute = actions[condition.action_type];
                if (actionToExecute) {
                    console.log(`Executing reaction: ${condition.action_type}`);
                    actionToExecute(condition.action_details);
                } else {
                    console.warn(`Action to take "${condition.action_type}" not found in CRM library.`);
                }
            } else {
                console.log(`Condition not met for action: ${actionType}`);
            }
        });
    } else {
        console.log(`No conditions of type '${actionType}' found in active lesson: ${lesson.lesson_title}`);
    }
  }
}


/**
 * Initializes the Interactive Lesson and Grading Engine.
 * @param {object} studentProfile - The profile of the currently logged-in student.
 */
export async function initializeLessonEngine(studentProfile) {
  console.log('Initializing Lesson Engine...');
  const lessons = await fetchAssignedLessons(studentProfile);
  console.log('Lesson Engine Initialized.');
}



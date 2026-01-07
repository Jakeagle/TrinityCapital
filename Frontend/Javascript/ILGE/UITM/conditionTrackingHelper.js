/**
 * Condition Tracking Helper - UITM Module
 *
 * Provides utilities for tracking, monitoring, and debugging lesson conditions.
 * Helps identify which conditions are met and what actions have been triggered.
 */

import { activeLessons, completedLessons } from "../lessonManager.js";

/**
 * Gets detailed information about a specific condition
 * @param {object} condition - The condition object
 * @returns {object} Detailed condition information
 */
export function getConditionDetails(condition) {
  return {
    type: condition.condition_type || "unknown",
    actionType: condition.action_type || "unknown",
    isMet: condition.isMet === true,
    actionDetails: condition.action_details || null,
    value: condition.condition_value || null,
    metadata: {
      createdAt: condition.createdAt || null,
      completedAt: condition.completedAt || null,
    },
  };
}

/**
 * Gets a summary of all conditions across all active lessons
 * @returns {array} Array of lesson condition summaries
 */
export function getAllActiveLessonConditionsSummary() {
  const summary = [];

  for (const [lessonId, lesson] of activeLessons.entries()) {
    const conditionsSummary = {
      lessonId,
      lessonTitle: lesson.lesson_title,
      totalConditions: lesson.completion_conditions
        ? lesson.completion_conditions.length
        : 0,
      metConditions: 0,
      unmetConditions: 0,
      conditions: [],
    };

    if (lesson.completion_conditions) {
      lesson.completion_conditions.forEach((condition, index) => {
        if (condition.isMet) {
          conditionsSummary.metConditions++;
        } else {
          conditionsSummary.unmetConditions++;
        }

        conditionsSummary.conditions.push({
          index: index + 1,
          ...getConditionDetails(condition),
        });
      });
    }

    summary.push(conditionsSummary);
  }

  return summary;
}

/**
 * Finds all lessons that have conditions in a specific state
 * @param {string} state - 'all-met', 'all-unmet', 'partial', or 'completed'
 * @returns {array} Array of matching lessons
 */
export function findLessonsByConditionState(state) {
  const matches = [];

  // Check completed lessons
  if (state === "completed") {
    for (const [lessonId, completionData] of completedLessons.entries()) {
      matches.push({
        lessonId,
        lessonTitle: completionData.lessonTitle,
        state: "completed",
        completedAt: completionData.completedAt,
      });
    }
    return matches;
  }

  // Check active lessons
  for (const [lessonId, lesson] of activeLessons.entries()) {
    if (!lesson.completion_conditions) continue;

    const totalCount = lesson.completion_conditions.length;
    const metCount = lesson.completion_conditions.filter(
      (c) => c.isMet === true
    ).length;

    let matches_state = null;

    if (metCount === totalCount && totalCount > 0) {
      matches_state = "all-met";
    } else if (metCount === 0) {
      matches_state = "all-unmet";
    } else {
      matches_state = "partial";
    }

    if (matches_state === state) {
      matches.push({
        lessonId,
        lessonTitle: lesson.lesson_title,
        state: matches_state,
        metCount,
        totalCount,
      });
    }
  }

  return matches;
}

/**
 * Gets condition history for a specific lesson
 * @param {string} lessonId - The ID of the lesson
 * @returns {object} Condition history and current state
 */
export function getLessonConditionHistory(lessonId) {
  const lesson = activeLessons.get(lessonId);

  if (!lesson) {
    return {
      found: false,
      message: "Lesson not found in active lessons",
    };
  }

  if (!lesson.completion_conditions) {
    return {
      found: true,
      lessonTitle: lesson.lesson_title,
      hasConditions: false,
      conditions: [],
    };
  }

  return {
    found: true,
    lessonTitle: lesson.lesson_title,
    hasConditions: true,
    conditions: lesson.completion_conditions.map((condition, index) => ({
      conditionIndex: index + 1,
      ...getConditionDetails(condition),
      firedAction:
        lesson.firedActions && lesson.firedActions.has(condition.action_type),
    })),
    firedActionsCount: lesson.firedActions ? lesson.firedActions.size : 0,
  };
}

/**
 * Compares condition state before and after an action
 * Useful for debugging condition transitions
 * @param {object} lesson - The lesson object
 * @param {string} actionType - The action that will be executed
 * @returns {object} Comparison of before/after states
 */
export function compareConditionStateBeforeAction(lesson, actionType) {
  if (!lesson || !lesson.completion_conditions) {
    return { error: "Invalid lesson object" };
  }

  const before = lesson.completion_conditions.map((condition) => ({
    type: condition.condition_type,
    isMet: condition.isMet,
    willTrigger: condition.action_type === actionType && !condition.isMet,
  }));

  return {
    actionType,
    beforeState: before,
    affectedConditions: before.filter((c) => c.willTrigger),
  };
}

/**
 * Gets a human-readable report of lesson condition tracking
 * @returns {string} Formatted report
 */
export function generateConditionTrackingReport() {
  let report = "\n========== CONDITION TRACKING REPORT ==========\n\n";

  // Active Lessons Report
  report += "ACTIVE LESSONS:\n";
  const activeSummary = getAllActiveLessonConditionsSummary();

  if (activeSummary.length === 0) {
    report += "  No active lessons.\n";
  } else {
    activeSummary.forEach((lesson) => {
      report += `\n  📚 ${lesson.lessonTitle}\n`;
      report += `     Total Conditions: ${lesson.totalConditions}\n`;
      report += `     Met: ${lesson.metConditions} | Unmet: ${lesson.unmetConditions}\n`;
      report += `     Progress: ${Math.round(
        (lesson.metConditions / lesson.totalConditions) * 100
      )}%\n`;
    });
  }

  // Completed Lessons Report
  report += "\n\nCOMPLETED LESSONS:\n";
  const completedArray = Array.from(completedLessons.values());

  if (completedArray.length === 0) {
    report += "  No completed lessons.\n";
  } else {
    completedArray.forEach((lesson) => {
      report += `\n  ✅ ${lesson.lessonTitle}\n`;
      report += `     Completed: ${new Date(lesson.completedAt).toLocaleString()}\n`;
    });
  }

  report += "\n============================================\n";

  return report;
}

/**
 * Exports condition tracking data to console
 * Useful for debugging and analysis
 */
export function exportConditionTrackingData() {
  return {
    timestamp: new Date().toISOString(),
    activeLessons: Array.from(activeLessons.entries()).map(
      ([lessonId, lesson]) => ({
        lessonId,
        lessonTitle: lesson.lesson_title,
        conditions: lesson.completion_conditions || [],
        firedActions: lesson.firedActions
          ? Array.from(lesson.firedActions)
          : [],
        elapsedTime: lesson.elapsedTime || 0,
      })
    ),
    completedLessons: Array.from(completedLessons.entries()).map(
      ([lessonId, data]) => ({
        lessonId,
        lessonTitle: data.lessonTitle,
        completedAt: data.completedAt,
        snapshot: data.snapshot,
      })
    ),
  };
}

/**
 * Monitors condition changes and logs them
 * Call this to enable detailed condition tracking
 * @returns {function} Function to stop monitoring
 */
export function enableConditionChangeMonitoring() {
  console.log("UITM_CTH: Condition change monitoring enabled");

  const originalActiveLessons = new Map(activeLessons);
  let monitoringInterval;

  monitoringInterval = setInterval(() => {
    // Check for new active lessons
    for (const [lessonId, lesson] of activeLessons.entries()) {
      if (!originalActiveLessons.has(lessonId)) {
        console.log(
          `UITM_CTH: 🆕 New lesson activated: "${lesson.lesson_title}"`
        );
      }

      // Check for condition changes
      const originalLesson = originalActiveLessons.get(lessonId);
      if (
        originalLesson &&
        originalLesson.completion_conditions &&
        lesson.completion_conditions
      ) {
        originalLesson.completion_conditions.forEach((origCond, idx) => {
          const currentCond = lesson.completion_conditions[idx];
          if (origCond.isMet !== currentCond.isMet && currentCond.isMet) {
            console.log(
              `UITM_CTH: ✅ Condition met in "${lesson.lesson_title}" (${currentCond.condition_type})`
            );
          }
        });
      }
    }

    // Update the original state
    originalActiveLessons.clear();
    for (const [lessonId, lesson] of activeLessons.entries()) {
      originalActiveLessons.set(lessonId, JSON.parse(JSON.stringify(lesson)));
    }
  }, 500);

  // Return stop function
  return () => {
    clearInterval(monitoringInterval);
    console.log("UITM_CTH: Condition change monitoring disabled");
  };
}

import { actions } from "./condition-rendering-library.js";
import { isLessonCompleted } from "../UITM/lessonCompletionManager.js";

const fireAction = (actionName, params) => {
  if (actions[actionName]) {
    actions[actionName](params);
  } else {
    console.warn(`Action "${actionName}" not found.`);
  }
};

export const handleLessonCompletion = (lesson) => {
  const alreadyCompleted = isLessonCompleted(lesson._id);

  if (alreadyCompleted) {
    // Event: Lesson already complete when a student starts it again.
    fireAction("notify_lesson_already_completed", { lesson });
    return;
  }

  // Event: Lesson being completed for the first time.
  const completionCondition = lesson.completion_conditions.find(
    (cond) => cond.condition_type === "lesson_completion_trigger"
  );

  if (completionCondition) {
    // If there is a lesson_complete condition, it fires its action.
    fireAction(completionCondition.action_type, completionCondition.action_params);
  } else {
    // If there is no lesson complete condition, but the student has completed all other conditions,
    // it fires a specific action for all conditions complete.
    fireAction("complete_lesson", { lesson });
  }
};

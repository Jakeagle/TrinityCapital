# UITM Lesson Completion & Condition Tracking System

## Overview

This system prevents duplicate lesson starts and tracks lesson completion status. It consists of two main modules:

1. **lessonCompletionManager.js** - Validates lesson start conditions
2. **conditionTrackingHelper.js** - Provides detailed condition tracking and debugging tools

## System Behavior

### When a Lesson is Started

The system performs two checks:

**Check A: Is the lesson already fully completed?**

- If YES → Show "Lesson Complete" modal and BLOCK lesson start
- If NO → Continue to Check B

**Check B: Have some conditions been completed?**

- If YES (partial completion) → Show warning modal with details and ALLOW resume
- If NO (fresh start) → ALLOW lesson start normally

## Components

### 1. Lesson Completion Manager

**File:** `Frontend/Javascript/ILGE/UITM/lessonCompletionManager.js`

#### Main Function: `validateLessonStart(lesson)`

```javascript
import { validateLessonStart } from "./lessonCompletionManager.js";

const result = validateLessonStart(lesson);

// Result object structure:
{
  shouldProceed: boolean,      // Can the lesson continue?
  status: 'completed' | 'partial' | 'fresh' | 'error',
  message: string,              // Description of what happened
  completedCount: number,       // Conditions that are met
  totalCount: number           // Total conditions in lesson
}
```

**Status Meanings:**

- `'completed'` - All conditions met, lesson is complete. Blocks start.
- `'partial'` - Some conditions met. Shows warning, allows resume.
- `'fresh'` - No conditions met. Normal start.
- `'error'` - Invalid lesson object.

#### Other Useful Functions

```javascript
// Check if a lesson is fully completed
isLessonCompleted(lessonId);

// Get count of met conditions
getCompletedConditionsCount(lesson);

// Get array of met conditions
getMetConditions(lesson);

// Get array of unmet conditions
getUnmetConditions(lesson);

// Check if partially completed
isLessonPartiallyCompleted(lesson);

// Log condition state for debugging
logLessonConditionState(lesson);

// Reset condition state (admin only)
resetLessonConditionState(lesson);
```

### 2. Condition Tracking Helper

**File:** `Frontend/Javascript/ILGE/UITM/conditionTrackingHelper.js`

#### Tracking Functions

```javascript
import {
  getAllActiveLessonConditionsSummary,
  getLessonConditionHistory,
  findLessonsByConditionState,
  generateConditionTrackingReport,
  exportConditionTrackingData,
  enableConditionChangeMonitoring,
} from "./conditionTrackingHelper.js";

// Get summary of all active lesson conditions
const summary = getAllActiveLessonConditionsSummary();

// Get condition history for a specific lesson
const history = getLessonConditionHistory(lessonId);

// Find lessons by state ('all-met', 'all-unmet', 'partial', 'completed')
const partialLessons = findLessonsByConditionState("partial");

// Generate human-readable report
console.log(generateConditionTrackingReport());

// Export all tracking data
const data = exportConditionTrackingData();

// Enable real-time monitoring (returns stop function)
const stopMonitoring = enableConditionChangeMonitoring();
// ... later:
stopMonitoring();
```

## Integration

The system is already integrated into the lesson start flow in `buttonTracker.js`:

```javascript
// When "Begin Activities" button is clicked:
1. validateLessonStart(lesson) is called
2. If status === 'completed', lesson start is blocked
3. logLessonConditionState(lesson) logs condition details
4. If shouldProceed === true, lesson continues normally
```

## Example Usage

### Basic Lesson Start Validation

```javascript
import { validateLessonStart } from "./UITM/lessonCompletionManager.js";

function handleLessonStart(lesson) {
  const validation = validateLessonStart(lesson);

  if (validation.status === "completed") {
    console.log("Lesson already finished");
    return; // Don't start
  }

  if (validation.status === "partial") {
    console.log(
      `${validation.completedCount} of ${validation.totalCount} conditions met`
    );
  }

  // Start lesson
  activateLesson(lesson);
}
```

### Debugging Condition State

```javascript
import {
  generateConditionTrackingReport,
  enableConditionChangeMonitoring,
} from "./UITM/conditionTrackingHelper.js";

// View full report in console
console.log(generateConditionTrackingReport());

// Enable live monitoring to see condition changes
const stop = enableConditionChangeMonitoring();
// ... do activities ...
stop(); // Stop monitoring
```

### Finding Lessons in Specific States

```javascript
import { findLessonsByConditionState } from "./UITM/conditionTrackingHelper.js";

// Find all lessons that are partially complete
const resumableLessons = findLessonsByConditionState("partial");
resumableLessons.forEach((lesson) => {
  console.log(
    `Resume: ${lesson.lessonTitle} (${lesson.metCount}/${lesson.totalCount})`
  );
});

// Find all completed lessons
const finished = findLessonsByConditionState("completed");
```

## Modal Messages

### Lesson Completed Modal

Shown when trying to start a lesson that's already fully completed.

```
Title: "Lesson Complete"
Message: "You have already completed the lesson: [lesson name]. All conditions have been met."
```

### Partial Completion Warning

Shown when resuming a lesson with some conditions already met.

```
Title: "Lesson Partially Started"
Message: Shows count and list of completed conditions
```

## Condition Object Structure

Each condition in a lesson has this structure:

```javascript
{
  condition_type: string,      // e.g., "elapsed_time", "user_action"
  action_type: string,         // e.g., "send_message", "show_tip"
  action_details: object,      // Parameters for the action
  condition_value: any,        // Value needed to trigger (e.g., seconds)
  isMet: boolean,              // Whether condition is satisfied
  createdAt?: string,          // When condition was created
  completedAt?: string         // When condition was met
}
```

## Testing & Debugging

### In Browser Console

```javascript
// View full condition report
console.log(LCM.generateConditionTrackingReport());

// Export all data to JSON
const data = LCM.exportConditionTrackingData();
console.table(data);

// Check if specific lesson is done
LCM.isLessonCompleted("lesson_id_123");

// Reset a lesson's condition state (CAREFUL!)
LCM.resetLessonConditionState(lesson);
```

### Browser Console Shortcuts (if exported globally)

Add to your main app setup:

```javascript
// Make utilities available in console
window.LCM = {
  validateLessonStart,
  getAllActiveLessonConditionsSummary,
  generateConditionTrackingReport,
  // ... other utilities
};
```

Then in console:

```javascript
LCM.generateConditionTrackingReport();
LCM.getAllActiveLessonConditionsSummary();
```

## Important Notes

1. **Modals are shown automatically** - No manual modal calls needed in lesson start code
2. **Conditions are tracked in memory** - They persist as long as the lesson is active
3. **Completion is recorded** - Finished lessons are stored in `completedLessons` Map
4. **No automatic reset** - Completed lessons stay completed; use `resetLessonConditionState()` to reset
5. **Partial resumption** - Students can resume lessons and continue from where they left off

## Troubleshooting

### Issue: Modal not showing when lesson is complete

- Check browser console for errors
- Verify `createAndShowModal()` is working in `conditionRenderer.js`
- Ensure lesson is in `completedLessons` Map

### Issue: Conditions not tracking properly

- Use `generateConditionTrackingReport()` to see current state
- Enable `enableConditionChangeMonitoring()` to watch for changes
- Check that `condition.isMet` is being set correctly

### Issue: Partial completion not detected

- Verify conditions have `isMet` property set
- Use `getCompletedConditionsCount(lesson)` to check met count
- Log condition state with `logLessonConditionState(lesson)`

## Architecture Diagram

```
buttonTracker.js (Lesson Start Button)
         ↓
   validateLessonStart()
         ↓
   ┌─────┴─────┐
   ↓           ↓
isLessonCompleted?  isLessonPartiallyCompleted?
   ↓           ↓
 YES → BLOCK   SOME MET → WARN (allow resume)
   ↓           ↓
  Modal      Modal + Continue
   ↓
  Return shouldProceed
   ↓
activateLesson() + processAction()
   ↓
Lesson continues or starts
```

## API Reference

### lessonCompletionManager.js

- `validateLessonStart(lesson)` → Returns validation result
- `isLessonCompleted(lessonId)` → Boolean
- `getCompletedConditionsCount(lesson)` → Number
- `getMetConditions(lesson)` → Array
- `getUnmetConditions(lesson)` → Array
- `isLessonPartiallyCompleted(lesson)` → Boolean
- `showLessonAlreadyCompletedModal(lesson)` → Void
- `showLessonPartialCompletionWarning(lesson)` → Void
- `logLessonConditionState(lesson)` → Void
- `resetLessonConditionState(lesson)` → Void

### conditionTrackingHelper.js

- `getConditionDetails(condition)` → Object
- `getAllActiveLessonConditionsSummary()` → Array
- `findLessonsByConditionState(state)` → Array
- `getLessonConditionHistory(lessonId)` → Object
- `compareConditionStateBeforeAction(lesson, actionType)` → Object
- `generateConditionTrackingReport()` → String
- `exportConditionTrackingData()` → Object
- `enableConditionChangeMonitoring()` → Function (stop function)

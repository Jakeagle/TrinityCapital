# Lesson Completion System - Logic Explanation

## Core Logic

### The Main Validation Function

**File:** `lessonCompletionManager.js`

```javascript
export function validateLessonStart(lesson) {
  // Step 1: Validate input
  if (!lesson || !lesson._id) {
    return { shouldProceed: false, status: "error" };
  }

  // Step 2: COUNT CONDITIONS
  const completedCount = getCompletedConditionsCount(lesson);
  const totalCount = lesson.completion_conditions?.length || 0;

  // Step 3: CHECK A - Is lesson fully completed?
  if (isLessonCompleted(lessonId)) {
    showLessonAlreadyCompletedModal(lesson); // Show modal
    return {
      shouldProceed: false, // ❌ BLOCK START
      status: "completed",
      completedCount,
      totalCount,
    };
  }

  // Step 4: CHECK B - Is lesson partially completed?
  if (completedCount > 0 && completedCount < totalCount) {
    showLessonPartialCompletionWarning(lesson); // Show modal
    return {
      shouldProceed: true, // ✅ ALLOW RESUME
      status: "partial",
      completedCount,
      totalCount,
    };
  }

  // Step 5: Fresh start (no conditions met)
  return {
    shouldProceed: true, // ✅ ALLOW START
    status: "fresh",
    completedCount,
    totalCount,
  };
}
```

### Where It's Called

**File:** `buttonTracker.js` (Updated)

```javascript
beginActivitiesBtn.addEventListener("click", async () => {
  // 1. VALIDATE LESSON START
  const validationResult = validateLessonStart(lesson);

  // 2. CHECK RESULT
  if (
    !validationResult.shouldProceed &&
    validationResult.status === "completed"
  ) {
    // Lesson is already done - don't proceed
    console.log("UITM: Lesson start blocked - already fully completed");
    return; // ❌ EXIT EARLY - Lesson doesn't start
  }

  // 3. LOG CONDITION STATE (for debugging)
  logLessonConditionState(lesson);

  // 4. Continue with normal lesson start
  const studentId = studentProfile.memberName;
  let elapsedTime = 0;

  // ... fetch timer data ...

  // 5. Activate and start lesson
  activateLesson(lesson);
  processAction("begin_activities", {
    lessonTitle: lesson.lesson_title,
    lessonId: lesson._id,
    elapsedTime: elapsedTime,
  });

  modal.close();
});
```

## The Three Checks Explained

### Check A: isLessonCompleted()

```javascript
export function isLessonCompleted(lessonId) {
  // Does completedLessons Map have this lesson?
  return completedLessons.has(lessonId);
}

// Example:
completedLessons = {
  'lesson_123': { lessonTitle: "Financial Basics", completedAt: "2026-01-06..." },
  'lesson_456': { lessonTitle: "Budgeting", completedAt: "2026-01-05..." }
}

isLessonCompleted('lesson_123') → TRUE  ✅ Lesson found
isLessonCompleted('lesson_789') → FALSE ❌ Lesson not found
```

### Check B: getCompletedConditionsCount()

```javascript
export function getCompletedConditionsCount(lesson) {
  if (!lesson || !lesson.completion_conditions) {
    return 0;
  }

  return lesson.completion_conditions.filter(
    (condition) => condition.isMet === true
  ).length;
}

// Example:
lesson.completion_conditions = [
  { condition_type: "elapsed_time", isMet: true },     // ✅ Met
  { condition_type: "user_action", isMet: true },      // ✅ Met
  { condition_type: "transfer_money", isMet: false },  // ❌ Not met
  { condition_type: "deposit_money", isMet: false },   // ❌ Not met
  { condition_type: "bill_creation", isMet: false }    // ❌ Not met
]

getCompletedConditionsCount(lesson) → 2  (2 met out of 5)
```

### Check C: isLessonPartiallyCompleted()

```javascript
export function isLessonPartiallyCompleted(lesson) {
  const completedCount = getCompletedConditionsCount(lesson);
  const totalCount = lesson.completion_conditions?.length || 0;

  // Partially done = some but not all conditions met
  return completedCount > 0 && completedCount < totalCount;
}

// Examples:
// 0/5 met → FALSE (fresh)
// 2/5 met → TRUE  (partial)
// 5/5 met → FALSE (complete)
```

## Decision Tree

```
Is lessonId in completedLessons Map?
  │
  YES ──→ Show "Lesson Complete" Modal
  │      Return shouldProceed = FALSE
  │
  NO
  │
  └──→ Count how many conditions have isMet = true
       │
       Count > 0 AND Count < Total?
         │
         YES ──→ Show "Partially Started" Modal
         │      Return shouldProceed = TRUE
         │
         NO ──→ Count = 0 or Count = Total
                │
                Count = 0 ──→ Fresh start
                │             Return shouldProceed = TRUE
                │
                Count = Total ──→ This should have triggered
                                  isLessonCompleted() above
                                  (shouldn't reach here)
```

## Data Structure Details

### Condition Object

Inside each lesson, in the `completion_conditions` array:

```javascript
{
  _id: ObjectId,                    // Database ID
  condition_type: string,           // "elapsed_time", "user_action", etc
  action_type: string,              // What to do when met
  action_details: {                 // Parameters for action
    message: string,
    // ... other params
  },
  condition_value: number,          // For time: seconds, etc
  isMet: boolean                    // ✅ THIS IS THE KEY PROPERTY
}
```

### Tracking When Conditions Are Met

**In lessonManager.js** - When a condition is satisfied:

```javascript
// This happens inside startLessonTimer():
if (elapsedSeconds >= condition.condition_value) {
  // Execute the action
  const actionToExecute = actions[actionName];
  actionToExecute(condition.action_details);

  // ⭐ MARK CONDITION AS MET
  condition.isMet = true; // ← This is what we check later

  // Check if ALL conditions are now met
  if (isLessonComplete(lesson)) {
    markLessonComplete(lesson); // Adds to completedLessons Map
  }
}
```

## What Gets Checked and When

### When Lesson Starts

```javascript
validateLessonStart(lesson) checks:
  1. completedLessons.has(lessonId)  → Check A
  2. Count isMet conditions         → Check B
  3. Return decision
```

### When Conditions Change

```javascript
During lesson execution:
  1. Student does activity
  2. Action is processed
  3. condition.isMet = true  ← Manually set by action handler
  4. isLessonComplete() checked again
  5. If all met, added to completedLessons Map
```

### On Next Lesson Start

```javascript
validateLessonStart(lesson) will:
  1. Find it in completedLessons Map
  2. Block the start
  3. Show completion modal
```

## Example: Student Journey

### Session 1: Start Lesson

```javascript
Student clicks "Begin Activities"
  ↓
validateLessonStart(lesson)
  ├─ completedLessons.has('lesson_123')? NO
  ├─ Count isMet? 0 out of 5
  └─ Return { shouldProceed: true, status: 'fresh' }
  ↓
activateLesson(lesson)
startLessonTimer(lesson)
  ↓
Timer starts counting
```

### During Session 1: Conditions Being Met

```javascript
After 30 seconds:
  Condition 1 triggers (elapsed_time)
  condition.isMet = true  ← SET BY ACTION HANDLER

Student transfers money:
  Condition 3 triggers (transfer_money)
  condition.isMet = true  ← SET BY ACTION HANDLER

Check: Are all conditions met? NO (still 2/5)
```

### End of Session 1: Lesson Continues

```javascript
Student completes all activities:
  condition.isMet = true (for all 5)
  ↓
Check: Are all conditions met? YES (5/5)
  ↓
markLessonComplete(lesson)
  completedLessons.set('lesson_123', {
    lessonId: 'lesson_123',
    lessonTitle: 'Financial Basics',
    completedAt: '2026-01-06T14:23:45Z',
    snapshot: { ... student data ... }
  })
```

### Session 2: Try to Start Same Lesson

```javascript
Student clicks "Begin Activities" on same lesson
  ↓
validateLessonStart(lesson)
  ├─ completedLessons.has('lesson_123')? YES ✅
  ├─ Show "Lesson Complete" modal
  └─ Return { shouldProceed: false, status: 'completed' }
  ↓
Check result in buttonTracker:
  if (!shouldProceed && status === 'completed') {
    return;  // EXIT - Don't start lesson
  }
  ↓
Lesson does NOT start
Modal is shown to student
```

## Modal Display Logic

### Complete Modal

```javascript
export function showLessonAlreadyCompletedModal(lesson) {
  createAndShowModal({
    title: "Lesson Complete",
    message: `You have already completed the lesson: "${lesson.lesson_title}". 
              All conditions have been met.`,
  });
}
```

### Partial Modal

```javascript
export function showLessonPartialCompletionWarning(lesson) {
  const completedCount = getCompletedConditionsCount(lesson);
  const totalCount = lesson.completion_conditions.length;
  const metConditions = getMetConditions(lesson);

  let conditionDetails = metConditions
    .map((cond) => `• ${cond.condition_type} (action: ${cond.action_type})`)
    .join("\n");

  createAndShowModal({
    title: "Lesson Partially Started",
    message: `The lesson "${lesson.lesson_title}" was previously started.

${completedCount} out of ${totalCount} conditions have been completed:

${conditionDetails}

Resuming from where you left off.`,
  });
}
```

## Key Insight

The system works because:

1. **Conditions track state** - `isMet` boolean in each condition object
2. **Maps track completion** - `completedLessons` Map stores finished lessons
3. **Validation on start** - Always checks these two things before allowing start
4. **Modals inform student** - Shows appropriate message based on status
5. **No backend needed** - Everything works in browser memory

The student can never:

- Start a completed lesson twice
- See confusing "restart" options
- Lose progress on partial lessons

The student can:

- Start a fresh lesson normally
- Resume a partial lesson from checkpoint
- Understand their progress via modal messages

# UITM Lesson Completion System - Visual Architecture

## High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│                   (HTML Button: Begin Activities)                   │
└───────────────────────────┬──────────────────────────────────────┘
                            │ Click Event
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│              BUTTON TRACKER (buttonTracker.js)                      │
│  - Listens for lesson start button click                            │
│  - Calls validateLessonStart()                                      │
│  - Checks result and decides: proceed or block                      │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                ┌───────────┴──────────┐
                ▼                      ▼
    ┌─────────────────────┐  ┌──────────────────────────┐
    │ LESSON COMPLETION   │  │ CONDITION TRACKING       │
    │ MANAGER             │  │ HELPER (optional)        │
    │ (Main Validation)   │  │ (Debugging & Reporting)  │
    └─────────────────────┘  └──────────────────────────┘
            │                           │
            │ Uses                      │ Uses
            ▼                           ▼
    ┌──────────────────────────────────────────────────┐
    │        LESSON MANAGER (lessonManager.js)          │
    │  Maps:                                            │
    │  - activeLessons: Active lessons in progress      │
    │  - completedLessons: Finished lessons             │
    └──────────────────────────────────────────────────┘
            │
            │ Stores condition state
            ▼
    ┌──────────────────────────────────────────────────┐
    │      LESSON DATA (Browser Memory)                 │
    │  - lesson.completion_conditions[]                 │
    │  - condition.isMet = true/false                   │
    │  - condition.condition_type, action_type, etc     │
    └──────────────────────────────────────────────────┘
```

## Decision Flow Chart

```
                         LESSON START CLICK
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ validateLessonStart()    │
                 └────────┬────────────────┘
                          │
                ┌─────────┴──────────┐
                ▼                    ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ CHECK A:         │  │ If A is NO:      │
        │ Is lesson in     │  │ CHECK B:         │
        │ completedLessons?│  │ Count isMet=true │
        └────────┬─────────┘  │ conditions       │
                 │            └────────┬─────────┘
         ┌───────┴────────┐            │
        YES              NO        ┌───┴──────────────┐
         │                │       YES   PARTIAL      NO
         │                │        │                  │
         ▼                │        ▼                  ▼
    ┌─────────┐           │   ┌─────────┐      ┌──────────┐
    │  SHOW   │           │   │  SHOW   │      │ ALL      │
    │ COMPLETE│           │   │ PARTIAL │      │ UNMET    │
    │ MODAL   │           │   │ WARNING │      │ (FRESH)  │
    │         │           │   │ MODAL   │      │          │
    └────┬────┘           │   └────┬────┘      └────┬─────┘
         │                │        │                │
         │ RESULT:        │        │ RESULT:        │ RESULT:
         ▼                ▼        ▼                ▼
    ┌─────────────────┐   │   ┌─────────────────┐
    │ shouldProceed   │   │   │ shouldProceed   │
    │    = FALSE      │   │   │    = TRUE       │
    │ status=complete │   │   │ status=partial  │
    │                 │   │   │ OR status=fresh │
    │ → BLOCK START   │   │   │                 │
    │ → RETURN EARLY  │   │   │ → ALLOW START   │
    │                 │   │   │ → CONTINUE      │
    └────────┬────────┘   │   └────────┬────────┘
             │            │            │
             └────────┬───┴────────────┘
                      ▼
            ┌──────────────────────┐
            │ Back to buttonTracker │
            └──────────┬───────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
        BLOCKED              CONTINUE
        (return)         (activateLesson)
                         (startTimer)
                         (processAction)
```

## State Machine Diagram

```
                    ┌─────────────────┐
                    │   NOT STARTED   │
                    │  (No conditions │
                    │  have isMet)    │
                    └────────┬────────┘
                             │ Student starts lesson
                             ▼
                    ┌─────────────────┐
                    │   ACTIVE LESSON │
                    │  (Conditions    │
                    │  being tracked) │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    Time passes         Student acts       Some conditions
    Activity done       on lesson          get isMet=true
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────────────────────────────────────────────┐
    │         PARTIAL COMPLETION STATE                │
    │  (Some conditions isMet=true, but not all)      │
    │                                                  │
    │  Example: 2 out of 5 conditions met             │
    └────┬──────────────────────────────┬──────────┘
         │                              │
         │ All remaining conditions     │ Student restarts lesson
         │ are completed (isMet=true)   │ (will show partial warning)
         │                              ▼
         │                    ┌──────────────────┐
         │                    │ Resume from where│
         │                    │ student left off │
         │                    │ (conditions      │
         │                    │  already met)    │
         │                    └────────┬─────────┘
         │                             │
         ▼                             │
    ┌──────────────────┐              │
    │ ALL CONDITIONS   │◄─────────────┘
    │ MET              │
    │ (isMet=true for  │
    │  all)            │
    └────────┬─────────┘
             │ Lesson marked complete
             │ Added to completedLessons Map
             ▼
    ┌──────────────────────┐
    │  COMPLETED LESSON    │
    │  (In completedLessons│
    │   Map)               │
    │                      │
    │  If student tries to │
    │  start again:        │
    │  → Show completion   │
    │     modal            │
    │  → Block start       │
    └──────────────────────┘
```

## Data Flow During Lesson

```
STUDENT ACTIVITY → CONDITION CHECK → STATE UPDATE → COMPLETION CHECK

Example Timeline:
─────────────────────────────────────────────────────────────────

T=0s  Student clicks "Begin Activities"
      validateLessonStart() → status='fresh'
      activateLesson(lesson)
      startLessonTimer()

T=5s  Timer running
      Conditions: [F, F, F, F, F] (5 unmet)

T=30s Timer reaches 30 seconds
      Condition "elapsed_time >= 30" triggers
      Execute action (e.g., send message)
      condition[0].isMet = true
      Conditions: [T, F, F, F, F]
      Check: All met? NO → Continue

T=45s Student initiates transfer
      Action handler detects transfer
      Looks for matching condition
      Condition "transfer_money" found
      condition[2].isMet = true
      Execute action
      Conditions: [T, F, T, F, F]
      Check: All met? NO → Continue

T=60s Student creates bill
      Condition "bill_creation" found
      condition[4].isMet = true
      Conditions: [T, F, T, F, T]
      Check: All met? NO → Continue

T=120s All remaining activities done
       condition[1].isMet = true
       condition[3].isMet = true
       Conditions: [T, T, T, T, T]
       Check: All met? YES
       ↓
       markLessonComplete(lesson)
       completedLessons.set(lessonId, {
         lessonTitle: 'Financial Basics',
         completedAt: '2026-01-06T...',
         snapshot: { /* student data */ }
       })

T=?   Student closes lesson

NEXT SESSION:
─────────────────────────────────────────────────────────────────

Student clicks "Begin Activities" on same lesson
validateLessonStart()
├─ Check: completedLessons.has(lessonId)? YES ✅
├─ Show "Lesson Complete" modal
└─ Return shouldProceed=FALSE, status='completed'

Button handler checks: shouldProceed && status='completed'?
→ YES → return early → LESSON DOES NOT START
```

## Module Dependencies

```
buttonTracker.js
    │
    ├─→ imports lessonCompletionManager.js
    │       │
    │       └─→ imports from lessonManager.js (activeLessons, completedLessons)
    │       └─→ imports from conditionRenderer.js (createAndShowModal)
    │       └─→ uses: validateLessonStart()
    │
    ├─→ imports from lessonManager.js
    │       └─→ uses: activateLesson(), processAction()
    │
    └─→ imports from LRM/lrm.js
            └─→ uses: timer functions


conditionTrackingHelper.js (Optional - for debugging)
    │
    └─→ imports from lessonManager.js (activeLessons, completedLessons)
            └─→ uses: getAllActiveLessonConditionsSummary(), etc.


lessonManager.js (Existing - not modified for core logic)
    │
    ├─→ exports completedLessons Map
    ├─→ exports activeLessons Map
    ├─→ exports isLessonComplete() [internal]
    ├─→ exports markLessonComplete() [called on completion]
    └─→ implements condition tracking via timer interval
```

## Component Interaction Sequence

```
Sequence: Student Starts Lesson for First Time
───────────────────────────────────────────────

1. HTML Button
   └─→ onclick event fires

2. buttonTracker.js
   └─→ Click handler executes
       └─→ Calls: validateLessonStart(lesson)

3. lessonCompletionManager.js
   ├─→ Check: isLessonCompleted(lessonId)?
   │   └─→ Query: completedLessons.has(lessonId)?
   │       └─→ Result: NO
   │
   └─→ Check: isLessonPartiallyCompleted(lesson)?
       ├─→ Count: getCompletedConditionsCount()
       │   └─→ Filter: condition.isMet === true
       │       └─→ Result: 0 conditions met
       │
       └─→ Result: NO (0 out of 5)

4. lessonCompletionManager.js
   └─→ Return: {
         shouldProceed: true,
         status: 'fresh',
         completedCount: 0,
         totalCount: 5
       }

5. buttonTracker.js
   ├─→ Receive result
   ├─→ Check: shouldProceed && status='completed'?
   │   └─→ Result: NO
   │
   └─→ Continue execution
       ├─→ logLessonConditionState(lesson)
       ├─→ activateLesson(lesson)
       ├─→ startLessonTimer(lesson)
       └─→ processAction('begin_activities', {...})

6. Lesson UI
   └─→ Displays lesson content
```

## Condition Object Lifecycle

```
CREATION (In Database/JSON)
──────────────────────────
{
  condition_type: "elapsed_time",
  action_type: "send_message",
  action_details: { message: "Good job so far!" },
  condition_value: 30,  // seconds
  isMet: false          // ← Initially FALSE
}

↓ After Lesson Starts ↓

TRACKING (In Memory During Lesson)
─────────────────────────────────
lesson.completion_conditions = [
  {
    condition_type: "elapsed_time",
    action_type: "send_message",
    action_details: { message: "Good job so far!" },
    condition_value: 30,
    isMet: false  ← Still false (30 seconds not reached)
  }
]

Timer: [5s] [10s] [15s] [20s] [25s] → [30s] REACHED!

↓ When Condition Triggers ↓

CONDITION MET
──────────
lesson.completion_conditions[0] = {
  condition_type: "elapsed_time",
  action_type: "send_message",
  action_details: { message: "Good job so far!" },
  condition_value: 30,
  isMet: true   ← ✅ SET TO TRUE
}

Action executed: displayModalMessage({ message: "Good job so far!" })

↓ Check Completion ↓

isLessonComplete(lesson)?
├─ Check: Do ALL conditions have isMet = true?
├─ Current: [T, F, F, F, F]
└─ Result: NO → Continue lesson

↓ Student Completes All Activities ↓

LESSON COMPLETION
─────────────────
lesson.completion_conditions = [
  { ..., isMet: true },   // ✅
  { ..., isMet: true },   // ✅
  { ..., isMet: true },   // ✅
  { ..., isMet: true },   // ✅
  { ..., isMet: true }    // ✅
]

isLessonComplete(lesson)?
├─ Check: Do ALL conditions have isMet = true?
├─ Current: [T, T, T, T, T]
└─ Result: YES!

markLessonComplete(lesson) called:
  completedLessons.set(lessonId, {
    lessonId: 'lesson_123',
    lessonTitle: 'Financial Basics',
    completedAt: '2026-01-06T14:23:45Z',
    snapshot: { /* student data snapshot */ }
  })
```

## Memory Layout

```
Browser Memory During Lesson
─────────────────────────────

activeLessons Map:
  'lesson_123' → {
    _id: 'lesson_123',
    lesson_title: 'Financial Basics',
    completion_conditions: [
      { condition_type: 'elapsed_time', isMet: true },
      { condition_type: 'user_action', isMet: false },
      { condition_type: 'transfer_money', isMet: true },
      ...
    ],
    firedActions: Set { 'send_message', 'show_tip' },
    elapsedTime: 123 (seconds)
  }
  'lesson_456' → { ... }

completedLessons Map:
  'lesson_000' → {
    lessonId: 'lesson_000',
    lessonTitle: 'Introduction to Banking',
    completedAt: '2026-01-05T10:30:00Z',
    snapshot: {
      checkingBalance: 1500,
      savingsBalance: 2000,
      totalBalance: 3500,
      ...
    }
  }
```

## Visual: Check A vs Check B

```
CHECK A: Fully Completed?
──────────────────────────

completedLessons Map:
┌───────────────────────────────┐
│ 'lesson_123': {               │ ← Search here
│   lessonTitle: 'Fin Basics',  │
│   completedAt: '2026-01-06'   │
│ }                             │
│ 'lesson_456': { ... }         │
└───────────────────────────────┘

         │
         ▼
   Found? YES ──→ BLOCK
            NO  ──→ Continue to Check B


CHECK B: Partially Completed?
──────────────────────────────

lesson.completion_conditions:
┌──────────────────────────────────────┐
│ Condition 1: { isMet: true }  ✅     │
│ Condition 2: { isMet: false } ❌     │
│ Condition 3: { isMet: true }  ✅     │
│ Condition 4: { isMet: false } ❌     │
│ Condition 5: { isMet: false } ❌     │
└──────────────────────────────────────┘

         │
         ▼
   Count: 2 out of 5
   Some but not all? YES ──→ WARN + ALLOW
                        NO  ──→ ALLOW (FRESH)
```

## Summary Box

```
┌─────────────────────────────────────────────────────────────┐
│        LESSON COMPLETION SYSTEM - ONE PAGE VIEW            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INPUT: Student clicks "Begin Activities" button            │
│                                                              │
│  PROCESSING:                                                │
│    1. Call validateLessonStart(lesson)                      │
│    2. Check A: Is lesson in completedLessons Map?           │
│    3. Check B: How many conditions have isMet=true?         │
│    4. Make decision based on checks                         │
│    5. Display appropriate modal if needed                   │
│    6. Return shouldProceed boolean                          │
│                                                              │
│  OUTPUT:                                                     │
│    • shouldProceed=false, status='completed' → BLOCK       │
│    • shouldProceed=true, status='partial'   → WARN + ALLOW │
│    • shouldProceed=true, status='fresh'     → ALLOW         │
│                                                              │
│  RESULT:                                                     │
│    • Completed lessons can't be restarted                   │
│    • Partial lessons can be resumed                         │
│    • Fresh lessons start normally                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

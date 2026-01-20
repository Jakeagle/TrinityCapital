# Gemini Agent Brief: Backend Data Structure Changes

This document outlines recent changes to the backend data handling for completed lessons. The goal was to eliminate data redundancy and create a single, unified source of truth for each lesson a student completes.

## 1. Summary of Changes

Previously, when a lesson was completed and its associated data (like `conditionStates` or game `snapshot`) was updated, the system would push new, separate objects into the user's `completedLessons` array in MongoDB. This resulted in multiple, fragmented records for the same lesson.

The backend logic has been updated to ensure that **only one record exists per completed lesson**. Subsequent updates to a lesson's state will now modify the existing record instead of creating a new one.

## 2. Affected Endpoint

The primary endpoint that was modified is responsible for marking a lesson as complete and saving its state.

-   **Endpoint:** `POST /lessons/complete`
-   **File Location:** `server.js`

This is the only endpoint that was changed. Any frontend logic that posts to this endpoint should be aware of the new consolidated data structure, but the request body it sends can remain the same. The backend now handles the consolidation.

## 3. Data Structure Evolution

The structure of the objects within the `completedLessons` array has been consolidated.

### Before

The `completedLessons` array could contain multiple objects for the same `lessonId`, each with different pieces of information.

```json
"completedLessons": [
  {
    "lessonId": 1754331337919,
    "lessonTitle": "Money Personality",
    "completedAt": "2026-01-16T15:18:52.773Z",
    "snapshot": { "...": "..." },
    "conditionStates": { "...": "..." }
  },
  {
    "lessonId": 1754331337919,
    "lessonTitle": "Money Personality",
    "completedAt": "2026-01-16T15:21:43.094Z",
    "snapshot": {
        "bills": [ "... " ],
        "paychecks": [],
        "...": "..."
    }
  }
]
```

### After

Now, the `completedLessons` array will only contain **one object per unique `lessonId`**. This object will be a complete and consolidated record of the lesson's state.

```json
"completedLessons": [
  {
    "lessonId": 1754331337919,
    "lessonTitle": "Money Personality",
    "completedAt": "2026-01-16T15:21:43.094Z",
    "snapshot": {
        "timestamp": "2026-01-16T15:21:43.093Z",
        "bills": [ "..." ],
        "paychecks": [],
        "checkingBalance": 0,
        "savingsBalance": 0,
        "incomeSpendingRatio": 0,
        "monthlyBudget": 0,
        "totalBalance": 0,
        "sessionTimestamp": "2026-01-16T15:21:43.583Z"
    },
    "conditionStates": {
        "1754331337919": [
            {
                "condition_type": "elapsed_time",
                "isMet": true,
                "...": "..."
            },
            {
                "condition_type": "payment_created",
                "isMet": true,
                "...": "..."
            }
        ]
    },
    "savedAt": "2026-01-16T15:21:43.144Z",
    "lastConditionUpdate": "2026-01-16T15:21:43.144Z"
  }
]
```

## 4. New Backend Logic

On receiving a `POST` request to `/lessons/complete`, the server now performs the following steps:
1.  It searches the user's `completedLessons` array for an object with a matching `lessonId`.
2.  **If a match is found:** It uses MongoDB's `$set` operator to update the fields within that existing object. This includes updating `completedAt`, `snapshot`, and `conditionStates`.
3.  **If no match is found:** It creates a new, complete object for the lesson and adds it to the `completedLessons` array, preventing future duplicates.

## 5. Required Frontend Adjustments

1.  **Data Fetching and Display:** When fetching and displaying a user's completed lessons, the frontend no longer needs to merge or filter multiple entries for the same lesson. You can now assume that each object in the `completedLessons` array is the definitive, complete record for that lesson.
2.  **State Updates:** No changes are required for how the frontend *sends* data to `/lessons/complete`. The backend now handles the logic of merging the data correctly. The frontend can continue to post lesson completion events as it did before.

The primary change is in how the frontend should *interpret* the `completedLessons` data it receives from the server. It is now cleaner and de-duplicated.

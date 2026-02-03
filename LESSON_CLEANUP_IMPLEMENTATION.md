# Lesson Cleanup Implementation for Sample Teachers

## Overview

Implemented aggressive lesson deletion strategy to ensure sample teacher lessons are completely cleared when they logout, refresh, or close the page.

---

## Changes Made

### 1. Lesson Server (Port 4000) - New Cleanup Endpoints

**File:** `TrinCap Lessons local/server.js`

Added two new endpoints that directly manipulate MongoDB collections:

#### DELETE `/api/sample-teacher-cleanup/:teacherName`

```javascript
app.delete("/api/sample-teacher-cleanup/:teacherName", async (req, res) => {
  // Step 1: Clear the units array for this teacher
  // $set: { units: [], students: [], messages: [] }
  // Step 2: Delete ALL lessons where teacher field matches teacherName
  // deleteMany({ teacher: teacherName })
});
```

#### POST `/api/sample-teacher-cleanup/:teacherName`

- Alternative POST endpoint for compatibility with `navigator.sendBeacon()`
- sendBeacon may not support DELETE method, so POST is used
- Performs identical cleanup as DELETE endpoint

**What These Endpoints Do:**

1. Clear the `units` array in the Teachers collection
2. Clear the `students` array in the Teachers collection
3. Clear the `messages` array in the Teachers collection
4. Delete ALL documents in the Lessons collection where `teacher` field matches the teacher's name
5. Emit Socket.IO event to notify other clients
6. Return success/failure with counts of what was deleted

---

### 2. Teacher Dashboard Updates

**File:** `TrinCapTeacher Dash/script.js`

Updated the cleanup handlers to call BOTH servers:

#### Before Unload Handler

```javascript
window.addEventListener("beforeunload", (e) => {
  if (window.activeTeacherName && window.activeTeacherName.toLowerCase().includes("sample")) {
    // Call main server (port 3000)
    navigator.sendBeacon(`${API_BASE_URL}/sample/reset-data`, ...)

    // Call lesson server (port 4000)
    navigator.sendBeacon(`http://localhost:4000/api/sample-teacher-cleanup/...`, ...)
  }
})
```

#### Visibility Change Handler

```javascript
document.addEventListener("visibilitychange", () => {
  if (document.hidden && window.activeTeacherName && ...) {
    // Same dual-server cleanup calls
  }
})
```

**Why Two Servers?**

- **Main Server (port 3000):** Resets sample user profile data
- **Lesson Server (port 4000):** Deletes lessons and clears units array

---

## Data Flow on Sample Teacher Logout/Close

```
Sample Teacher closes page
         ↓
beforeunload event fires
         ↓
┌─────────┴─────────┐
│                   │
v                   v
Port 3000           Port 4000
/sample/reset-data  /api/sample-teacher-cleanup/:teacherName
│                   │
├→ Clears profile   ├→ Deletes ALL lessons with teacher name
│  data             ├→ Clears units array
│                   ├→ Clears students array
│                   └→ Clears messages array
│
Sample data completely wiped ✅
```

---

## Test Case: Complete Sample Teacher Cleanup

### Setup

1. Login as "Sample Teacher" (teacherName: "Sample Teacher")
2. Create a lesson in a unit

### Action

- Close the page/browser tab

### Expected Results

**In Port 3000 (Main Server)**

- Console: `✅ [SampleTeacherCleanup] Sent cleanup requests to both servers for: Sample Teacher`

**In Port 4000 (Lesson Server)**

- Console: `✅ [SampleTeacherCleanup-POST] Cleared units for Sample Teacher: matched=1, modified=1`
- Console: `✅ [SampleTeacherCleanup-POST] Deleted X lessons for Sample Teacher`

**In MongoDB - Teachers Collection**

```javascript
db.Teachers.findOne({ name: "Sample Teacher" })
// Result:
{
  name: "Sample Teacher",
  username: "STeach01",
  units: [],        // ← EMPTY
  students: [],     // ← EMPTY
  messages: [],     // ← EMPTY
  // ... other fields preserved
}
```

**In MongoDB - Lessons Collection**

```javascript
db.Lessons.find({ teacher: "Sample Teacher" }).count();
// Result: 0  (all deleted)
```

### Verify After Re-login

1. Login again as "Sample Teacher"
2. Verify all units are empty
3. Verify no lessons exist
4. Verify you start fresh

---

## Technical Details

### Endpoint Parameters

- **:teacherName** - URI parameter, use `encodeURIComponent()` when constructing URL
- Example: `/api/sample-teacher-cleanup/Sample%20Teacher`

### Request/Response Format

**POST Request:**

```javascript
POST /api/sample-teacher-cleanup/Sample%20Teacher
Content-Type: application/json

{ "teacherName": "Sample Teacher" }
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Sample teacher data cleaned for Sample Teacher",
  "unitsCleared": true,
  "lessonsDeleted": 5
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "Failed to cleanup sample teacher data: [error message]"
}
```

---

## Files Modified

| File                              | Changes                                 | Lines                                   |
| --------------------------------- | --------------------------------------- | --------------------------------------- |
| `TrinCap Lessons local/server.js` | Added DELETE and POST cleanup endpoints | ~130 lines added before server.listen() |
| `TrinCapTeacher Dash/script.js`   | Updated beforeunload handler            | Modified lines 6339-6366                |
| `TrinCapTeacher Dash/script.js`   | Updated visibilitychange handler        | Modified lines 6368-6400                |

---

## Key Features

✅ **Complete Deletion** - All lessons deleted, units array cleared  
✅ **Dual Server Cleanup** - Both main and lesson servers notified  
✅ **Reliable Delivery** - Uses `navigator.sendBeacon()` for guaranteed delivery  
✅ **Error Handling** - Comprehensive error logging and response codes  
✅ **Socket.IO Events** - Other clients notified of cleanup via Socket.IO  
✅ **Flexible** - Works with any sample teacher regardless of name

---

## Debugging

Enable verbose logging by checking browser console and server console on both ports:

**Browser Console (Student's browser):**

- `[SampleTeacherCleanup] Page unload detected...`
- `✅ [SampleTeacherCleanup] Sent cleanup requests...`

**Server Console (Port 3000):**

- Standard sample data reset logging

**Server Console (Port 4000):**

- `🗑️  [SampleTeacherCleanup-POST] Starting cleanup...`
- `✅ [SampleTeacherCleanup-POST] Cleared units for...`
- `✅ [SampleTeacherCleanup-POST] Deleted X lessons for...`

---

## Future Enhancements

- Add cleanup endpoint to student server (port 3001) if needed
- Add admin dashboard endpoint to manually trigger cleanup
- Add retention policy for non-sample teachers (optional)
- Monitor cleanup success via metrics/analytics

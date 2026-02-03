# Sample Teacher Cleanup - Moved to Login

## Change Summary

The sample teacher lesson cleanup has been **moved from page unload to LOGIN** for better reliability.

### Why?

- Page unload events can be blocked or interrupted
- Requests sent during `beforeunload` may not complete
- **Login happens while the page is fully interactive**, so the cleanup request completes successfully

---

## How It Works Now

### 1. Sample Teacher Logs In

When a teacher with "sample" in their display name logs in:

```
Login Handler (teacher dashboard script.js, line 407)
    ↓
Detects: teacherName.toLowerCase().includes("sample")
    ↓
Calls Port 4000 Cleanup Endpoint
    ↓
DELETE from Lessons collection (all lessons for this teacher)
DELETE units array (set to empty)
DELETE students array (set to empty)
DELETE messages array (set to empty)
    ↓
Fresh Start! ✅
    ↓
Create/Verify Sample Student
```

### 2. Code Location

**File:** `TrinCapTeacher Dash/script.js`

**Lines 407-445:** Login handler with cleanup

```javascript
if (teacherName.toLowerCase().includes("sample")) {
  console.log(`🔧 [TeacherDash] Sample teacher logged in: ${teacherName}`);

  // Clean up old data from previous session
  const cleanupResponse = await fetch(
    `http://localhost:4000/api/sample-teacher-cleanup/${encodeURIComponent(teacherName)}`,
    { method: "POST", ... }
  );

  if (cleanupResponse.ok) {
    console.log(`✅ [SampleTeacherLogin] Cleanup complete - deleted ${cleanupResult.lessonsDeleted} lessons`);
  }

  // Then create/verify sample student
}
```

---

## Test It

### 1. Start Servers

```bash
# Port 3000 - Main server
cd "Trinity Capital Prod Local"
npm start

# Port 4000 - Lesson server
cd "TrinCap Lessons local"
npm start
```

### 2. Login as Sample Teacher

- Username: `STeach01`
- Name: `Sample Teacher`

### 3. Check Console

Should see:

```
🔧 [TeacherDash] Sample teacher logged in: Sample Teacher
🗑️  [SampleTeacherLogin] Cleaning up previous session data for: Sample Teacher
✅ [SampleTeacherLogin] Cleanup complete - deleted 5 lessons
✅ [TeacherDash] Sample student verified for: Sample Teacher
```

### 4. Verify MongoDB

```javascript
db.Teachers.findOne({ name: "Sample Teacher" });
// Should show: units: [], students: [], messages: []

db.Lessons.find({ teacher: "Sample Teacher" }).count();
// Should show: 0
```

### 5. Create Lesson

- Create a new lesson in Unit 1
- Verify it shows up

### 6. Logout & Login Again

- Logout
- Login again as Sample Teacher
- Console should show cleanup running again
- Lesson should be deleted
- Fresh start! ✅

---

## What Changed

### Removed

- `beforeunload` event listener
- `visibilitychange` event listener
- `setupSampleTeacherCleanupHandlers()` function

### Added

- Cleanup logic in login handler (lines 414-438)
- `fetch()` call to port 4000 cleanup endpoint
- Error handling for cleanup failures

---

## Console Messages

### On Successful Login

```
🔧 [TeacherDash] Sample teacher logged in: Sample Teacher
🗑️  [SampleTeacherLogin] Cleaning up previous session data for: Sample Teacher
✅ [SampleTeacherLogin] Cleanup complete - deleted 5 lessons
✅ [TeacherDash] Sample student verified for: Sample Teacher
```

### On Cleanup Error

```
⚠️  [SampleTeacherLogin] Error cleaning up sample data: [error details]
```

But login will continue even if cleanup fails (graceful degradation).

---

## Advantages of Login-Based Cleanup

✅ **Guaranteed Execution** - Runs while page is interactive  
✅ **Reliable Response** - Can read and log cleanup results  
✅ **No Race Conditions** - Page won't unload during cleanup  
✅ **Error Handling** - Can handle failures gracefully  
✅ **Fresh Start** - Every login gets a blank slate

---

## Files Modified

| File                            | Change                                          |
| ------------------------------- | ----------------------------------------------- |
| `TrinCapTeacher Dash/script.js` | Added cleanup to login handler (lines 414-438)  |
| `TrinCapTeacher Dash/script.js` | Removed beforeunload/visibilitychange handlers  |
| `TrinCapTeacher Dash/script.js` | Added comment explaining cleanup moved to login |

---

## Fallback if Cleanup Fails

If the cleanup request fails for any reason:

1. Login continues normally
2. Warning logged to console
3. Sample student is still verified
4. Teacher can continue working
5. Data won't persist between sessions anyway

Next login will try cleanup again and should succeed.

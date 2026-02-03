# Sample Teacher Lesson Cleanup - Quick Reference

## What Was Implemented

When a **Sample Teacher** (any teacher with "sample" in their display name) closes their browser tab or logs out:

### On Port 3000 (Main Server)

- Resets the teacher's profile data structure
- Called via `/sample/reset-data` endpoint

### On Port 4000 (Lesson Server)

- **Deletes ALL lessons** created by that teacher
- **Clears the entire units array**
- **Clears students array**
- **Clears messages array**

---

## The Cleanup Process

```
Sample Teacher closes page
          ↓
   beforeunload fires
          ↓
     Dual cleanup sent:

   ┌──────────┬──────────┐
   v          v
Port 3000  Port 4000
   │          │
   ├─Reset    ├─Delete lessons
   │ profile  │ Clear units
   │ data     │ Clear students
   │          │ Clear messages
   │          │
   └──────────┴──────────┘
           ↓
  ✅ Lessons completely gone
  ✅ Units array empty
  ✅ Fresh start on next login

```

---

## Test It

### 1. Start Both Servers

```bash
# Terminal 1 - Port 3000 (Main)
cd "Trinity Capital Prod Local"
npm start

# Terminal 2 - Port 4000 (Lessons)
cd "TrinCap Lessons local"
npm start
```

### 2. Login as Sample Teacher

- Username: `STeach01` (or any with login credential)
- Name: `Sample Teacher` (or any name with "sample")

### 3. Create a Lesson

- Go to lesson builder
- Create a lesson in a unit
- Verify it appears in the units array

### 4. Close the Tab

- Close the teacher dashboard tab
- Watch console for cleanup messages

### 5. Check MongoDB

Open MongoDB and verify:

```javascript
// In TrinityCapital database

// 1. Check Teachers collection
db.Teachers.findOne({ name: "Sample Teacher" });
// units array should be: []

// 2. Check Lessons collection
db.Lessons.countDocuments({ teacher: "Sample Teacher" });
// Should return: 0
```

### 6. Login Again

- Login as Sample Teacher again
- Verify units are empty
- Verify no lessons exist
- Fresh start! ✅

---

## Console Messages to Look For

### Browser Console

```
[SampleTeacherCleanup] Page unload detected for sample teacher: Sample Teacher
✅ [SampleTeacherCleanup] Sent cleanup requests to both servers for: Sample Teacher
```

### Server Console (Port 4000)

```
🗑️  [SampleTeacherCleanup-POST] Starting cleanup for teacher: Sample Teacher
✅ [SampleTeacherCleanup-POST] Cleared units for Sample Teacher: matched=1, modified=1
✅ [SampleTeacherCleanup-POST] Deleted 5 lessons for Sample Teacher
```

---

## Files Modified

| File                              | What Changed                                                             |
| --------------------------------- | ------------------------------------------------------------------------ |
| `TrinCap Lessons local/server.js` | Added DELETE & POST `/api/sample-teacher-cleanup/:teacherName` endpoints |
| `TrinCapTeacher Dash/script.js`   | Updated cleanup handlers to call lesson server on page close             |

---

## How It Works (Technical)

### Lesson Server Cleanup Endpoint

Receives `teacherName` and performs:

1. **MongoDB Update:**

   ```javascript
   teachersCollection.updateOne(
     { name: teacherName },
     {
       $set: {
         units: [], // Clear ALL units
         students: [], // Clear ALL students
         messages: [], // Clear ALL messages
       },
     },
   );
   ```

2. **MongoDB Delete:**

   ```javascript
   lessonsCollection.deleteMany({
     teacher: teacherName, // Delete all lessons with this teacher
   });
   ```

3. **Emit Socket.IO Event:**
   - Notifies other connected clients that data was cleaned

---

## Why Two Requests?

- **Main Server (3000):** Handles general sample user profile reset
- **Lesson Server (4000):** Specifically deletes lessons (which live in separate collections/server)

Both are called via `navigator.sendBeacon()` for guaranteed delivery even if page closes immediately.

---

## Troubleshooting

### Lessons Still There After Logout?

1. Check browser console - do you see the cleanup messages?
2. Check server console on port 4000 - do you see the cleanup logs?
3. Verify MongoDB URI is correct on lesson server
4. Verify both servers are running

### Console Shows Message But MongoDB Not Updated?

1. Check MongoDB connection string on lesson server
2. Verify teacher name matches exactly (case-sensitive)
3. Check MongoDB logs for errors
4. Try manual cleanup via MongoDB shell

### Lessons Deleted But Units Still Exist?

1. Check the $set operation in the cleanup endpoint
2. Verify MongoDB write permissions
3. Try running cleanup endpoint manually via Postman

---

## Manual Cleanup (If Needed)

If automatic cleanup doesn't work, you can manually clean via MongoDB:

```javascript
// Manual cleanup in MongoDB

// 1. Clear units for Sample Teacher
db.Teachers.updateOne(
  { name: "Sample Teacher" },
  {
    $set: {
      units: [],
      students: [],
      messages: [],
    },
  },
);

// 2. Delete all lessons for Sample Teacher
db.Lessons.deleteMany({
  teacher: "Sample Teacher",
});
```

---

## Success Indicators ✅

- Console shows both "sent cleanup requests" and "deleted X lessons"
- MongoDB shows units: [] and no lessons with teacher name
- Next login is clean slate
- No errors in server console

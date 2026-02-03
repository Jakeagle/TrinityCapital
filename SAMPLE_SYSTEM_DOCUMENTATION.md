# Sample User Data Reset System Documentation

## Overview

This system provides a **sample data management solution** for Trinity Capital's student frontend and teacher dashboard. Sample users (those with "sample" in their username) get a **blank slate every time they log in**, automatically resetting all their MongoDB data while preserving the user account itself.

### Key Features

✅ **Automatic Detection** - Any user with "sample" in their username is treated as a sample user  
✅ **Complete Data Reset** - All account data, lessons, messages, and activities are cleared  
✅ **Preserved User Records** - User documents remain in the database (userName, pin, name, etc.)  
✅ **Automatic Membership** - Sample students are automatically made members of sample teachers' classes  
✅ **Multiple Cleanup Triggers** - Data resets on logout, page refresh, page close, or when leaving the tab  
✅ **Zero Configuration** - Works automatically without additional setup on either frontend

---

## Architecture

### Backend Components

#### 1. **SampleDataManager** (`sampleDataManager.js`)

The core service that handles all sample user data management.

**Key Methods:**

- `isSampleUser(username)` - Checks if username contains "sample"
- `resetSampleUserData(username, userType)` - Main reset function
  - `userType`: "student" or "teacher"
  - Preserves user document, resets all data
- `resetStudentData(studentName)` - Resets student accounts and lessons
- `resetTeacherData(teacherName)` - Resets teacher class and unit data
- `setupSampleStudent(studentName, teacherName)` - Adds student to teacher's class
- `verifySampleStudent(studentName, teacherName)` - Creates student if needed

**Features:**

- Cleans up related data in threads, messages, and session_data collections
- Creates default starting values (empty checking/savings accounts with 0 balance)
- Logs all operations with emojis for easy debugging

---

### API Endpoints

All endpoints are accessed via **POST** requests to the main server (port 3000).

#### 1. **POST /sample/reset-data**

Resets all MongoDB data for a sample user.

**Request Body:**

```json
{
  "username": "Sample Student",
  "userType": "student"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Student data reset for Sample Student"
}
```

**Use Case:** Called on logout, page unload, or visibility change

---

#### 2. **POST /sample/setup-student**

Manually adds a sample student to a sample teacher's class.

**Request Body:**

```json
{
  "studentName": "Sample Student",
  "teacherName": "Sample Teacher"
}
```

**Response:**

```json
{
  "success": true
}
```

**Use Case:** Setup or synchronization

---

#### 3. **POST /sample/verify-student**

Creates sample student if doesn't exist, ensures class membership.

**Request Body:**

```json
{
  "studentName": "Sample Student",
  "teacherName": "Sample Teacher"
}
```

**Response:**

```json
{
  "success": true
}
```

**Use Case:** Called when sample teacher logs in

---

## Frontend Integration

### Student Frontend (Student App)

**File:** `Frontend/Javascript/script.js`

#### Integration Points:

1. **Logout Handler** (Lines ~100-160)

   - Detects if username contains "sample"
   - Calls `/sample/reset-data` endpoint
   - Uses standard fetch (blocking logout)

2. **Page Unload Handler** (End of file)

   - Listens to `beforeunload` event
   - Calls `/sample/reset-data` via `navigator.sendBeacon()`
   - Ensures data resets even if user closes tab

3. **Page Visibility Handler** (End of file)
   - Listens to `visibilitychange` event
   - Triggers when tab is switched away
   - Uses `navigator.sendBeacon()` for reliability

#### Example Integration:

```javascript
// In logout button click handler
if (currentProfile?.memberName?.toLowerCase().includes("sample")) {
  await fetch(`${API_BASE_URL}/sample/reset-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: currentProfile.memberName,
      userType: "student",
    }),
  });
}
```

---

### Teacher Dashboard

**File:** `TrinCapTeacher Dash/script.js`

#### Integration Points:

1. **Login Handler** (Lines ~380-420)

   - Detects if username contains "sample"
   - Automatically calls `/sample/verify-student`
   - Creates "Sample Student" if needed
   - Adds student to sample teacher's class

2. **Page Unload Handler** (End of file)

   - Listens to `beforeunload` event
   - Calls `/sample/reset-data` via `navigator.sendBeacon()`

3. **Page Visibility Handler** (End of file)
   - Listens to `visibilitychange` event
   - Triggers when tab is switched away

#### Example Integration:

```javascript
// In login handler after successful auth
if (username.toLowerCase().includes("sample")) {
  await fetch(`${API_BASE_URL}/sample/verify-student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Sample Student",
      teacherName: teacherName,
    }),
  });
}
```

---

## MongoDB Data Management

### Collections Affected

When a sample user's data is reset, the following collections are modified:

#### Student Reset:

- **User Profiles** - Reset to default state (new checking/savings accounts, empty lessons)
- **threads** - Deleted (all messages from/to student)
- **messages** - Deleted (student message history)
- **session_data** - Deleted (session tracking)

#### Teacher Reset:

- **Teachers** - Reset to default state (empty students, empty messages)
- **threads** - Deleted (all messages from/to teacher)
- **messages** - Deleted (teacher message history)
- **session_data** - Deleted (session tracking)

### What Gets Preserved

For both students and teachers, these fields are **never deleted**:

**Student:**

- `memberName`
- `userName`
- `pin`
- `userType`
- `school`
- `teacher`
- `locale`

**Teacher:**

- `name`
- `email`
- `pin`
- `school`
- `className`
- `classCode`

---

## Data Reset Sequence

### When Student Logs Out

1. User clicks "Log Out" button
2. System checks if `currentProfile.memberName` contains "sample"
3. If yes, calls `POST /sample/reset-data` with `userType: "student"`
4. Backend resets all student data
5. Frontend reloads page

### When Student Leaves/Refreshes Page

1. `beforeunload` event fires
2. System checks if logged-in user is sample user
3. Calls `navigator.sendBeacon()` to `/sample/reset-data`
4. Page unloads (data reset happens asynchronously)

### When Sample Teacher Logs In

1. User logs in with username containing "sample"
2. System calls `POST /sample/verify-student`
3. Backend creates "Sample Student" if needed
4. Backend adds "Sample Student" to teacher's class
5. Dashboard loads with sample student ready

---

## Configuration

### Username Requirements

Sample users are identified by the presence of "sample" in their username (case-insensitive):

✅ Valid sample usernames:

- `Sample Student`
- `sample-john-01`
- `SAMPLE_TEACHER_01`
- `My Sample Class`

❌ Non-sample usernames:

- `Student One`
- `Teacher Smith`
- `example@school.com` (must contain "sample" specifically)

### Default Values

When data is reset, students receive:

- **Checking Account:** `XXXX-1001` with 0 balance
- **Savings Account:** `XXXX-2001` with 0 balance
- **Assigned Units:** Empty array (no lessons assigned)
- **Grade:** 0
- **Locale:** en-US (English)

Teachers receive:

- **Class:** "Sample Class"
- **Class Code:** "SAMPLE001"
- **Students:** Empty array (populated with "Sample Student" on login)
- **Units:** Preserved from original (but no student assignment data)

---

## Debugging

### Console Logs

The system provides detailed console logging with emoji prefixes:

- 🗑️ **[SampleDataManager]** - Backend data reset operations
- ✅ **[SampleDataManager]** - Successful operations
- ❌ **[SampleDataManager]** - Errors
- 📡 **[SampleUserCleanup]** - Frontend sendBeacon calls
- 🔧 **[TeacherDash]** - Teacher dashboard setup
- ⚠️ - Warnings

**Example Output:**

```
🗑️ [SampleDataManager] Resetting sample user data for: Sample Student
✅ [SampleDataManager] Reset student data for: Sample Student
📡 [SampleUserCleanup] Sent reset request via sendBeacon for: Sample Student
```

### Testing Sample System

1. **Create test users with "sample" in username:**

   - Student: `Sample Student` (PIN: 1234)
   - Teacher: `Sample Teacher` (PIN: 1234)

2. **Monitor console during login:**

   - Watch for "✅ [SampleDataManager]" messages
   - Check that "Sample Student" appears in teacher's class

3. **Test data reset:**

   - Make changes to student account (deposits, transfers)
   - Log out and back in
   - Verify all data is reset to zero balance

4. **Test unload reset:**
   - Log in as sample user
   - Open browser dev tools
   - Refresh page (F5)
   - Watch for sendBeacon call in Network tab

---

## Best Practices

### For Development

1. **Use consistent sample usernames:**

   - Student: `Sample Student`
   - Teacher: `Sample Teacher`
   - Prevents conflicts with real users

2. **Always test with both frontends:**

   - Student app logout/unload
   - Teacher dashboard logout/unload
   - Verify data cleanup in both directions

3. **Monitor MongoDB:**
   - Check User Profiles collection after reset
   - Verify threads/messages are deleted
   - Ensure core user fields are preserved

### For Production

1. **Sample accounts should:**

   - Never be used by actual users
   - Be separate from real class data
   - Be clearly labeled in the system

2. **Avoid:**
   - Using "sample" in real usernames
   - Assigning real students to sample teachers
   - Storing important data in sample accounts

---

## Troubleshooting

### Issue: Sample data not resetting

**Cause:** Username doesn't contain "sample" (case-sensitive check)  
**Solution:** Verify username contains exactly "sample" (case-insensitive)

### Issue: Sample student not appearing in teacher's class

**Cause:** Teacher logged in before `/sample/verify-student` was called  
**Solution:** Log out and log back in, or manually call `/sample/setup-student`

### Issue: sendBeacon calls failing

**Cause:** Browser blocks sendBeacon during fast unload  
**Solution:** System retries with standard fetch if sendBeacon unavailable

### Issue: Data persisting after logout

**Cause:** Network request failed silently  
**Solution:** Check browser Network tab, verify API endpoint is reachable

---

## File Locations

| Component               | File                                              | Size                |
| ----------------------- | ------------------------------------------------- | ------------------- |
| Backend Manager         | `Trinity Capital Prod Local/sampleDataManager.js` | ~450 lines          |
| Backend Endpoints       | `Trinity Capital Prod Local/server.js`            | Added ~120 lines    |
| Student Frontend Helper | `Frontend/Javascript/sampleUserResetHelper.js`    | ~180 lines          |
| Student Integration     | `Frontend/Javascript/script.js`                   | Modified ~100 lines |
| Teacher Helper          | `TrinCapTeacher Dash/sampleTeacherResetHelper.js` | ~180 lines          |
| Teacher Integration     | `TrinCapTeacher Dash/script.js`                   | Modified ~100 lines |

---

## API Response Examples

### Successful Reset

```json
{
  "success": true,
  "message": "Student data reset for Sample Student"
}
```

### Sample User Not Found

```json
{
  "success": false,
  "reason": "profile_not_found",
  "message": "No profile found for student"
}
```

### Not a Sample User

```json
{
  "success": false,
  "reason": "not_sample_user"
}
```

### Server Error

```json
{
  "success": false,
  "reason": "error",
  "error": "Error message details"
}
```

---

## Future Enhancements

Potential improvements to the sample system:

1. **Admin Reset API** - Endpoint to reset sample data on demand
2. **Sample Class Templates** - Pre-configured sample classes with lessons
3. **Data Isolation** - Optional database partitioning for sample users
4. **Reset Scheduling** - Automatic reset on a schedule (e.g., daily)
5. **Sample Data Snapshots** - Preset data states for testing different scenarios
6. **Reset Notifications** - Toast message confirming data reset to user

---

## Questions & Support

For issues or questions about the sample data system:

1. Check console logs for error messages
2. Review MongoDB collections directly
3. Verify all endpoints are accessible
4. Ensure "sample" is in username (case-insensitive)
5. Check that API_BASE_URL points to correct server

---

**Last Updated:** February 2, 2026  
**System Status:** ✅ Production Ready

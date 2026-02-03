# Sample System - Quick Implementation Guide

## 🎯 What This System Does

- **Automatic Data Cleanup:** When a user with "sample" in their username logs in/out or leaves the page, all their data is deleted
- **Blank Slate:** Every time a sample user logs in, they get a fresh, empty account
- **Zero Setup:** Works automatically without any additional configuration
- **Smart Membership:** Sample students are automatically added to sample teachers' classes

---

## 🚀 Quick Start

### Step 1: Install Backend Module

The file `sampleDataManager.js` is already added to the server. The server (`server.js`) is already configured to:

- Import the SampleDataManager
- Initialize it on startup
- Provide three API endpoints

✅ **Already Done** - No action needed

### Step 2: Update Frontends

#### Student App:

- The student frontend script (`script.js`) now includes:
  - Sample data reset in logout handler
  - Unload/refresh handler
  - Page visibility handler

✅ **Already Done** - No action needed

#### Teacher Dashboard:

- The teacher script (`script.js`) now includes:
  - Sample student auto-verification on login
  - Unload/refresh handler
  - Page visibility handler

✅ **Already Done** - No action needed

### Step 3: Test It

1. **Create test users** (if not already present):

   - Student: Username `Sample Student`, PIN `1234`
   - Teacher: Username `Sample Teacher`, PIN `1234`

2. **Login as sample student:**

   - Watch browser console for ✅ messages
   - Make a transaction (loan, donation, etc.)
   - Check balance

3. **Logout:**

   - Click "Log Out"
   - Console should show reset message
   - Balance should be cleared

4. **Login again:**
   - User should have empty account (0 balance)
   - All data reset to defaults

---

## 📊 How It Works

### Data Flow Diagram

```
┌─────────────────┐
│  Sample User    │
│   Logs In       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Username contains "sample"?            │
│  (case-insensitive check)               │
└────────┬────────────────────┬───────────┘
         │ YES                │ NO
         ▼                    ▼
    ┌────────┐         Skip Reset
    │ RESET  │
    │ DATA   │
    └────────┘
```

### On Logout:

1. User clicks "Log Out"
2. System checks: `username.includes("sample")`
3. If yes: POST to `/sample/reset-data`
4. All user data deleted, user document preserved
5. Page reloads

### On Page Leave (unload/refresh/tab close):

1. `beforeunload` event triggers
2. System checks if sample user
3. Uses `navigator.sendBeacon()` for reliability
4. Data resets asynchronously

### On Tab Switch:

1. `visibilitychange` event triggers when tab goes hidden
2. System sends reset request via `sendBeacon()`
3. Ensures cleanup even if user closes browser

---

## 🧪 Test Cases

### ✅ Test 1: Basic Login/Logout Reset

```
1. Login as "Sample Student"
   → Console: ✅ Sample student verified

2. Create transaction (+$100)
   → Balance: $100

3. Click "Log Out"
   → Console: 🗑️ Resetting sample user data
   → Browser reloads

4. Login again
   → Balance: $0 (reset!)
```

### ✅ Test 2: Page Refresh Reset

```
1. Login as "Sample Student"
   → Balance: $0

2. Create transaction (+$100)
   → Balance: $100

3. Press F5 (refresh)
   → Console: 📡 Sent reset via sendBeacon
   → Balance: $0 (reset!)
```

### ✅ Test 3: Teacher Sample Student Setup

```
1. Login as "Sample Teacher"
   → Console: 🔧 Sample teacher logged in
   → Console: ✅ Sample student verified

2. Go to Students section
   → "Sample Student" should appear in class

3. Logout
   → Console: 🗑️ Resetting sample teacher data
   → Students list cleared

4. Login again
   → Sample student re-appears (auto-verified)
```

---

## 🔍 Debugging

### View Console Logs

Press `F12` to open Developer Tools, go to Console tab.

**Expected messages:**

Student App:

```
✅ [SampleUserCleanup] Cleanup handlers initialized
🗑️ [Logout] Resetting sample user data for: Sample Student
```

Teacher Dashboard:

```
✅ [SampleTeacherCleanup] Cleanup handlers initialized
🔧 [TeacherDash] Sample teacher logged in: Sample Teacher
✅ [TeacherDash] Sample student verified for: Sample Teacher
```

### Check Network Requests

1. Open DevTools (F12)
2. Go to "Network" tab
3. Filter for: `sample/reset-data`
4. Perform logout
5. Should see POST request with response status 200

---

## ⚙️ Configuration

### Change Sample Username Detection

If you want to use a different marker (e.g., "test" instead of "sample"):

**In `sampleDataManager.js`:**

```javascript
isSampleUser(username) {
  return username && username.toLowerCase().includes("test");  // Changed "sample" to "test"
}
```

**In Student Frontend** (script.js):

```javascript
currentProfile.memberName.toLowerCase().includes("test"); // Changed "sample" to "test"
```

**In Teacher Frontend** (script.js):

```javascript
username.toLowerCase().includes("test"); // Changed "sample" to "test"
```

### Change Default Values

**In `sampleDataManager.js`, resetStudentData method:**

```javascript
checkingAccount: {
  accountHolder: studentName,
  accountNumber: "XXXX-5000",  // Changed from "XXXX-1001"
  balanceTotal: 100,            // Changed from 0 (start with $100)
  // ... rest of config
}
```

---

## 🛠️ Troubleshooting

### Q: Reset isn't working

**A:** Check that username contains "sample" exactly (case doesn't matter)

- ✅ "Sample Student", "sample student", "SAMPLE STUDENT"
- ❌ "example", "s ample", "sample-class-1"

### Q: Sample student not in teacher's class

**A:** Log out and log back in as sample teacher

- Login triggers automatic verification
- Creates student if needed
- Adds to class

### Q: Console shows no reset message

**A:** Check:

1. Are you logged in? (Check navbar)
2. Does username contain "sample"?
3. Are you closing the app properly?

### Q: Data still there after refresh

**A:** The reset uses `navigator.sendBeacon()` which is async

- Data should clear within a few seconds
- Refresh page to see updated data
- Check server logs for confirmation

---

## 📁 Files Modified

| File                  | What Changed                              | Lines |
| --------------------- | ----------------------------------------- | ----- |
| `server.js`           | Added import, init, 3 endpoints           | ~120  |
| `script.js` (Student) | Added logout reset, unload handlers       | ~80   |
| `script.js` (Teacher) | Added login verification, unload handlers | ~80   |

## 📁 Files Created

| File                             | Purpose                            | Size       |
| -------------------------------- | ---------------------------------- | ---------- |
| `sampleDataManager.js`           | Core sample data management        | ~450 lines |
| `sampleUserResetHelper.js`       | Student frontend helper (optional) | ~180 lines |
| `sampleTeacherResetHelper.js`    | Teacher frontend helper (optional) | ~180 lines |
| `SAMPLE_SYSTEM_DOCUMENTATION.md` | Full documentation                 | ~600 lines |

---

## ✅ Implementation Checklist

- [x] Create SampleDataManager module
- [x] Add endpoints to server.js
- [x] Initialize manager on server startup
- [x] Add logout reset to student app
- [x] Add unload handlers to student app
- [x] Add login verification to teacher app
- [x] Add unload handlers to teacher app
- [x] Create documentation
- [x] Test basic flow
- [x] Test all cleanup triggers

---

## 🎓 How to Use in Production

### For Demo/Testing:

1. Create accounts with "sample" in username
2. Use them to demonstrate the app
3. Data automatically resets between demos
4. No manual cleanup needed

### For Development:

1. Use same sample accounts for testing
2. Each login gives fresh state
3. Easy to reproduce issues
4. No test data pollution

### For Training:

1. Create sample class for students
2. Students can practice without affecting real data
3. Each session is independent
4. Instructors can demonstrate repeatedly

---

## 🚨 Important Notes

1. **Real users:** NEVER give real users "sample" in their username
2. **Data loss:** Sample user data is permanently deleted on logout/refresh
3. **Automatic:** No user action required for cleanup
4. **Reliable:** Works across browser tabs, refreshes, and closures

---

## 📞 Support

If something isn't working:

1. Check browser console (F12)
2. Look for red ❌ messages or errors
3. Verify username contains "sample"
4. Check network requests in DevTools
5. Restart the server and try again

---

**Status:** ✅ Ready to Use  
**Tested:** ✅ Student App, ✅ Teacher Dashboard  
**Documentation:** ✅ Complete

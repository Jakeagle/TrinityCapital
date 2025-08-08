# API Endpoint Analysis: What Each Request is Looking For

## Summary of Failing Requests

Based on the 404 errors you're seeing, here's exactly what each API endpoint is looking for in the database:

---

## 1. `/api/student-current-lesson/Jake%20Ferguson` ✅ WORKING

**Database Query:**

- **Collection**: `TrinityCapital.User Profiles`
- **Field**: `memberName: "Jake Ferguson"`
- **Status**: ✅ **WORKING** (Returns 200 OK, null response means no current lesson assigned)

**What it looks for:**

```javascript
const studentProfile = await userProfilesCollection.findOne({
  memberName: 'Jake Ferguson', // Actual student name
});
```

**Expected Data Structure:**

```json
{
  "memberName": "Jake Ferguson",
  "currentLessonId": "lesson_id_here",
  "lessonIds": ["lesson1", "lesson2"],
  "completedLessons": [],
  "lockedLessons": []
}
```

---

## 2. `/getBillInfo/Jake%20Ferguson` ❌ FAILING (404)

**Database Query:**

- **Collection**: `TrinityCapital.Profiles` ⚠️ **Different Collection!**
- **Field**: `memberName: "Jake Ferguson"`
- **Status**: ❌ **404 Error** - Student not found in `Profiles` collection

**What it looks for:**

```javascript
const studentProfile = await client
  .db('TrinityCapital')
  .collection('Profiles') // Note: Different collection than lesson endpoints
  .findOne({ memberName: 'Jake Ferguson' });
```

**Expected Data Structure:**

```json
{
  "memberName": "Jake Ferguson",
  "bills": [
    {
      "description": "Rent",
      "amount": 1200,
      "dueDate": "2025-08-01"
    }
  ],
  "income": [
    {
      "source": "Job",
      "amount": 3000
    }
  ]
}
```

---

## 3. `/classmates/Jake%20Ferguson` ❌ FAILING (404)

**Database Query:**

- **Collection**: `TrinityCapital.Profiles` ⚠️ **Same collection as getBillInfo**
- **Field**: `memberName: "Jake Ferguson"`
- **Status**: ❌ **404 Error** - Student not found in `Profiles` collection

**What it looks for:**

```javascript
const studentProfile = await client
  .db('TrinityCapital')
  .collection('Profiles') // Same collection as getBillInfo
  .findOne({ memberName: 'Jake Ferguson' });
```

**Expected Data Structure:**

```json
{
  "memberName": "Jake Ferguson",
  "teacherName": "Mr. Smith",
  "className": "Financial Literacy 101",
  "classmates": ["Student A", "Student B", "Student C"]
}
```

---

## 🔍 **ROOT CAUSE ANALYSIS**

### The Issue: **Two Different Collections**

1. **`User Profiles` Collection** ✅ Working

   - Contains: Jake Ferguson's lesson engine data
   - Used by: Lesson engine API endpoints
   - Status: **Student exists here**

2. **`Profiles` Collection** ❌ Missing Data
   - Contains: Bill information and classmate data
   - Used by: getBillInfo and classmates endpoints
   - Status: **Jake Ferguson does NOT exist here**

### Why This Happens:

The Trinity Capital system has **two separate collections** for different purposes:

- **`User Profiles`**: For lesson management, progress tracking, educational data
- **`Profiles`**: For financial simulation data (bills, income, classmates)

**Jake Ferguson exists in `User Profiles` but NOT in `Profiles`.**

---

## 🛠️ **SOLUTIONS**

### Option 1: Create Jake Ferguson in Profiles Collection

Add Jake Ferguson's record to the `Profiles` collection with bill and classmate data.

### Option 2: Modify Endpoints to Use User Profiles Collection

Update `/getBillInfo` and `/classmates` endpoints to look in `User Profiles` collection instead.

### Option 3: Data Synchronization

Create a system to sync student data between both collections.

### Option 4: Collection Consolidation

Merge both collections into a single `User Profiles` collection with all data.

---

## 📋 **RECOMMENDED ACTION**

**Immediate Fix**: Check if Jake Ferguson should exist in the `Profiles` collection, and if so, create the missing record with appropriate bill and classmate data.

**Long-term**: Consider consolidating the collections or implementing automatic data synchronization to prevent this issue in the future.

---

## 🧪 **Current Test Results**

```bash
✅ /api/student-current-lesson/Jake%20Ferguson → 200 OK (null - no lesson assigned)
❌ /getBillInfo/Jake%20Ferguson → 404 Not Found
❌ /classmates/Jake%20Ferguson → 404 Not Found
```

The lesson engine is working correctly, but the financial simulation features are broken due to missing data in the `Profiles` collection.

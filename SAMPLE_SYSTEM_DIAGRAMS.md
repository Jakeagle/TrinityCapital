# Sample System - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TRINITY CAPITAL APP                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │   Student Frontend   │    │  Teacher Dashboard   │          │
│  │                      │    │                      │          │
│  │ • Login/Logout       │    │ • Login/Logout       │          │
│  │ • Unload Handlers    │    │ • Unload Handlers    │          │
│  │ • Visibility Track   │    │ • Visibility Track   │          │
│  └──────────┬───────────┘    └──────────┬───────────┘          │
│             │                            │                      │
│             │ POST /sample/reset-data    │                      │
│             │ POST /sample/verify-student│                      │
│             │                            │                      │
│             └────────────┬───────────────┘                      │
│                          ▼                                       │
│              ┌────────────────────────┐                         │
│              │   Express Server       │                         │
│              │   (port 3000)          │                         │
│              │                        │                         │
│              │  API Endpoints:        │                         │
│              │  • /sample/reset-data  │                         │
│              │  • /sample/setup-stud  │                         │
│              │  • /sample/verify-stud │                         │
│              └────────────┬───────────┘                         │
│                           │                                      │
│          SampleDataManager│                                      │
│          (sampleDataManager.js)                                 │
│          • isSampleUser() │                                      │
│          • resetStudentData()                                    │
│          • resetTeacherData()                                    │
│          • setupSampleStudent()                                 │
│          • verifySampleStudent()                                │
│                           │                                      │
│                           ▼                                      │
│              ┌────────────────────────┐                         │
│              │   MongoDB Database     │                         │
│              │   (TrinityCapital DB)  │                         │
│              │                        │                         │
│              │  Collections:          │                         │
│              │  • User Profiles       │                         │
│              │  • Teachers            │                         │
│              │  • threads             │                         │
│              │  • messages            │                         │
│              │  • session_data        │                         │
│              └────────────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Student Login & Logout

```
╔═══════════════════════════════════════════════════════════════╗
║              STUDENT LOGIN SEQUENCE                           ║
╚═══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│ 1. User enters username & PIN                               │
│    Example: "Sample Student" / "1234"                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend sends login request                             │
│    GET /profiles                                            │
│    Fetches all user data from server                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Check username for "sample"                              │
│    ✓ currentProfile.memberName.includes("sample")           │
└────────────────┬────────────────────────────────────────────┘
                 │ YES
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Login successful - show dashboard                        │
│    User has clean slate (0 balance, no data)                │
│    Because previous session data was reset                  │
└─────────────────────────────────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════╗
║              STUDENT LOGOUT SEQUENCE                          ║
╚═══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Log Out" button                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Logout handler checks: is this a sample user?            │
│    ✓ currentProfile.memberName.includes("sample")           │
└────────────────┬────────────────────────────────────────────┘
                 │ YES
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Send POST /sample/reset-data                             │
│    {                                                        │
│      "username": "Sample Student",                          │
│      "userType": "student"                                  │
│    }                                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend: SampleDataManager.resetStudentData()            │
│    • Delete transactions                                    │
│    • Reset balance to 0                                     │
│    • Delete lesson progress                                 │
│    • Delete messages                                        │
│    • Clear loans, donations, bills                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. MongoDB updated: User Profile reset                      │
│    User document preserved, data cleared                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend: Page reload                                    │
│    window.location.reload()                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. User returned to login screen                            │
│    Data is clean for next login                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Page Unload (Refresh/Close)

```
╔═══════════════════════════════════════════════════════════════╗
║              PAGE UNLOAD RESET SEQUENCE                       ║
╚═══════════════════════════════════════════════════════════════╝

USER ACTION: Press F5, Close Tab, Navigate Away, etc.
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. beforeunload event fires                                 │
│    Browser: "Are you sure you want to leave?"               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Check: Is current user a sample user?                    │
│    ✓ currentProfile.memberName.includes("sample")           │
└────────────────┬────────────────────────────────────────────┘
                 │ YES
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Send reset request via sendBeacon()                      │
│    (More reliable than fetch() during unload)               │
│                                                             │
│    navigator.sendBeacon(                                    │
│      '/sample/reset-data',                                  │
│      JSON.stringify({...})                                  │
│    )                                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Browser queues request for delivery                      │
│    (Even if page unloads immediately)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend receives and processes reset                     │
│    (Asynchronous - doesn't block user)                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Data deleted from MongoDB                                │
│    User ready for clean login next session                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Page continues unloading                                 │
│    User may already be navigated away                       │
│    Reset happens in background                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Tab Visibility Change

```
╔═══════════════════════════════════════════════════════════════╗
║         VISIBILITY CHANGE RESET SEQUENCE                      ║
╚═══════════════════════════════════════════════════════════════╝

USER ACTION: Switch to another tab, Minimize window, etc.
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. visibilitychange event fires                             │
│    document.hidden = true                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Check: Is current user a sample user?                    │
│    ✓ currentProfile.memberName.includes("sample")           │
└────────────────┬────────────────────────────────────────────┘
                 │ YES
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Send reset request via sendBeacon()                      │
│    (Non-blocking, doesn't interfere with navigation)        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Browser delivers request to server                       │
│    (Reliable delivery even if tab stays hidden)             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend processes reset                                  │
│    Data cleared from MongoDB                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. User returns to tab                                      │
│    Refreshes if needed                                      │
│    Gets clean data on next interaction                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Teacher Sample Student Verification Flow

```
╔═══════════════════════════════════════════════════════════════╗
║         TEACHER LOGIN & SAMPLE SETUP SEQUENCE                 ║
╚═══════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────┐
│ 1. Teacher enters username & PIN                            │
│    Example: "Sample Teacher" / "1234"                       │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. POST /findTeacher (authentication)                        │
│    Server verifies credentials                              │
└────────────────┬─────────────────────────────────────────────┘
                 │ ✓ Valid
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Check: Is this a sample teacher?                          │
│    ✓ username.includes("sample")                             │
└────────────────┬─────────────────────────────────────────────┘
                 │ YES
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. POST /sample/verify-student                               │
│    {                                                         │
│      "studentName": "Sample Student",                        │
│      "teacherName": "Sample Teacher"                         │
│    }                                                         │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Backend: Check if "Sample Student" exists                 │
│    • If NO: Create with default values                       │
│    • If YES: Update to ensure correct teacher               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Add student to teacher's students list                    │
│    MongoDB Teachers collection updated                       │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. Dashboard loads                                           │
│    "Sample Student" appears in class                         │
└──────────────────────────────────────────────────────────────┘
```

---

## MongoDB Data Structure - Before & After Reset

```
╔═══════════════════════════════════════════════════════════════╗
║        USER PROFILES COLLECTION - DATA BEFORE RESET           ║
╚═══════════════════════════════════════════════════════════════╝

{
  _id: ObjectId("..."),
  memberName: "Sample Student",           ✓ PRESERVED
  userName: "sample.student",             ✓ PRESERVED
  pin: "HASHED_PIN",                      ✓ PRESERVED
  userType: "student",                    ✓ PRESERVED
  school: "Trinity Academy",              ✓ PRESERVED
  teacher: "Sample Teacher",              ✓ PRESERVED

  checkingAccount: {
    accountHolder: "Sample Student",      ✗ RESET
    balanceTotal: 2350.75,                ✗ RESET
    transactions: [                       ✗ RESET
      { amount: 500, name: "Deposit" },
      { amount: -50, name: "Withdrawal" },
      ...more transactions...
    ],
    movementsDates: ["2026-02-01T..."],   ✗ RESET
  },

  savingsAccount: {                       ✗ RESET
    accountHolder: "Sample Student",
    balanceTotal: 1000.00,
    transactions: [
      { amount: 1000, name: "Initial" }
    ],
  },

  assignedUnitIds: [                      ✗ RESET
    { unitName: "Unit 1", lessonIds: [...] },
    { unitName: "Unit 2", lessonIds: [...] }
  ],

  completedLessons: [                     ✗ RESET
    { lessonId: "...", completedDate: "2026-01-15T..." },
    ...
  ],

  loans: [                                ✗ RESET
    { amount: 500, date: "2026-01-20T..." }
  ],

  messages: [                             ✗ RESET
    { from: "...", content: "...", date: "..." }
  ]
}


╔═══════════════════════════════════════════════════════════════╗
║        USER PROFILES COLLECTION - DATA AFTER RESET            ║
╚═══════════════════════════════════════════════════════════════╝

{
  _id: ObjectId("..."),
  memberName: "Sample Student",           ✓ PRESERVED
  userName: "sample.student",             ✓ PRESERVED
  pin: "HASHED_PIN",                      ✓ PRESERVED
  userType: "student",                    ✓ PRESERVED
  school: "Trinity Academy",              ✓ PRESERVED
  teacher: "Sample Teacher",              ✓ PRESERVED

  // RESET - Default starting values
  checkingAccount: {
    accountHolder: "Sample Student",
    accountType: "Checking",
    accountNumber: "XXXX-1001",
    balanceTotal: 0,
    transactions: [
      { amount: 0, interval: "once", Name: "Starting Balance", Category: "Initial" }
    ],
    movementsDates: ["2026-02-02T14:30:00Z"],
  },

  savingsAccount: {
    accountHolder: "Sample Student",
    accountType: "Savings",
    accountNumber: "XXXX-2001",
    balanceTotal: 0,
    transactions: [
      { amount: 0, interval: "once", Name: "Starting Balance", Category: "Initial" }
    ],
    movementsDates: ["2026-02-02T14:30:00Z"],
  },

  assignedUnitIds: [],                    // Empty array
  completedLessons: [],                   // Empty array
  activeLessons: [],                      // Empty array
  lessonTimers: {},                       // Empty object
  bills: [],                              // Empty array
  loans: [],                              // Empty array
  donations: [],                          // Empty array
  messages: [],                           // Empty array

  lastLogin: "2026-02-02T14:30:00Z"       // Updated to current time
}


↓ RELATED DATA CLEANUP ↓

threads collection:
- All documents with senderId: "Sample Student" → DELETED
- All documents with participants: "Sample Student" → DELETED

messages collection:
- All documents from "Sample Student" → DELETED

session_data collection:
- All documents for "Sample Student" → DELETED
```

---

## API Request/Response Examples

```
╔═══════════════════════════════════════════════════════════════╗
║              RESET DATA ENDPOINT EXAMPLES                     ║
╚═══════════════════════════════════════════════════════════════╝

REQUEST: POST /sample/reset-data
{
  "username": "Sample Student",
  "userType": "student"
}

RESPONSE (200 OK):
{
  "success": true,
  "message": "Student data reset for Sample Student"
}


REQUEST: POST /sample/verify-student
{
  "studentName": "Sample Student",
  "teacherName": "Sample Teacher"
}

RESPONSE (200 OK):
{
  "success": true
}

Optional if student created:
{
  "success": true,
  "created": true,
  "message": "Created and verified"
}


REQUEST: POST /sample/setup-student
{
  "studentName": "Sample Student",
  "teacherName": "Sample Teacher"
}

RESPONSE (200 OK):
{
  "success": true
}


ERROR RESPONSES:

400 Bad Request (Missing parameters):
{
  "error": "Missing username or userType"
}

404 Not Found (User doesn't exist):
{
  "success": false,
  "reason": "profile_not_found",
  "message": "No profile found for student: Sample Student"
}

Not Sample User (won't reset):
{
  "success": false,
  "reason": "not_sample_user"
}

500 Server Error:
{
  "success": false,
  "reason": "error",
  "error": "Connection timeout or database error"
}
```

---

## Decision Tree: Is This a Sample User?

```
                    Start
                      │
                      ▼
         Does username exist?
         /                \
       YES                 NO
        │                  │
        ▼                  ▼
    Check for         Return: false
    "sample" in       (not sample user)
    username
    (lowercase)
        │
    /────┴────\
   │          │
  YES        NO
   │          │
   ▼          ▼
Return:   Return: false
true      (not sample user)
(sample
user)
```

---

## Complete Event Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE USER SESSION                        │
└─────────────────────────────────────────────────────────────────┘

TIME    EVENT                          SYSTEM ACTION
───────────────────────────────────────────────────────────────────
T+0min  User opens app
        Sees login screen

T+5min  User logs in as
        "Sample Student"              Check: "sample" in name? YES
                                      Load user data (already reset
                                      from last session)

T+5m+   User makes transactions        Add to checkingAccount.transactions
5sec    (+$100)                        Update balanceTotal: +100

T+15min User makes donation            Add to donations array
        ($50)                          Update balanceTotal: +50

T+30min User clicks Log Out            Handler: Is sample user? YES
                                      POST /sample/reset-data
                                      ↓
                                      Backend: resetStudentData()
                                      - Clear transactions
                                      - Set balance to 0
                                      - Delete messages
                                      - Clear donations/loans
                                      ↓
                                      MongoDB: Profile updated
                                      ↓
                                      Frontend: Reload page

T+30m+  Page reloads                   User sees login screen
5sec    User sees login screen         All data is reset

T+35min User logs in again             Frontend: Check "sample" in name
        as "Sample Student"            YES → Data already reset
                                      Shows fresh account (balance $0)

        User sees blank slate!         ✓ System working correctly
```

---

## Error Handling Flow

```
┌──────────────────────────────────────┐
│   Reset Data Request Received        │
└────────────┬─────────────────────────┘
             │
             ▼
      ┌──────────────────┐
      │ Validate Input   │
      │ • username OK?   │
      │ • userType OK?   │
      └──┬──────────┬────┘
         │          │
      VALID      INVALID
         │          │
         ▼          ▼
      Check for    Return 400
      "sample"     Bad Request
         │
      /──┴──\
    YES    NO
     │      │
     ▼      ▼
   Reset  Return
   Data   {success:false}
     │
     ▼
  Connect to
  MongoDB
     │
  /──┴──\
OK   ERROR
 │      │
 ▼      ▼
Reset  Log Error
Data   Return 500

 │
 ▼
Success
 │
 ▼
Return 200
{success:true}
```

---

**These diagrams provide a visual reference for understanding how the sample system works at every level.**

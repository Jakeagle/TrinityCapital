# Quick Time Mode - System Architecture

## Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  index.html                        script.js                    │
│  ├─ Bills Modal                    ├─ Socket connection        │
│  │  ├─ amount input                ├─ Login handler            │
│  │  ├─ frequency select            ├─ "identify" emit          │
│  │  └─ Submit buttons              ├─ "checkingAccountUpdate"  │
│  │     ├─ .form__btn--bills        │   listener                │
│  │     └─ .form__btn--payments     ├─ displayBalance()        │
│  │                                 ├─ displayTransactions()    │
│  │ billsAndPayments.js             └─ displayBillList()       │
│  │ ├─ Validate form inputs                                     │
│  │ ├─ Collect bill/payment data     quickTimeMode.js          │
│  │ └─ POST to /bills endpoint       ├─ Check sample user      │
│  │    (via sendBillData())          ├─ Create UI indicator    │
│  │                                  └─ "⏱️ Quick Time" badge   │
│  │ buttonTracker.js                                            │
│  │ └─ Secondary listener (UITM tracking)                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
           ↓ HTTP POST + Socket.io Events
┌──────────────────────────────────────────────────────────────────┐
│                      TRANSPORT LAYER                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ HTTP POST /bills                   Socket.io Events             │
│ ├─ Request: {parcel:[...]}         ├─ "identify" → server     │
│ └─ Response: JSON                  ├─ "checkingAccountUpdate" ←│
│                                    └─ (real-time updates)      │
│ WebSocket (Socket.io)                                          │
│ ├─ Persistent connection                                       │
│ ├─ userSockets Map on backend                                  │
│ └─ Enables server → client events                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
           ↓ Express Routes + Socket Handlers
┌──────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ server.js                                                       │
│ ├─ Express App                  QuickTimeManager.js             │
│ ├─ Socket.io Server             ├─ isSampleUser(username)      │
│ ├─ userSockets Map              ├─ initializeQuickTimeMode()   │
│ │  (username → socket)          ├─ startQuickTimeInterval()    │
│ │                               ├─ checkAndProcessTransactions()│
│ ├─ Route: POST /bills           ├─ processQuickTimeTransaction()│
│ │  ├─ Extract parcel data       └─ Socket emission (FIXED)     │
│ │  ├─ Detect sample user                                       │
│ │  ├─ Init quick time           SchedulerManager.js            │
│ │  └─ Call addScheduledTrans()   ├─ For regular students       │
│ │                               └─ Uses node-cron              │
│ ├─ Handler: socket.on("identify")                              │
│ │  ├─ Store in userSockets                                     │
│ │  └─ Init quick time if sample                                │
│ │                                                              │
│ ├─ Connection pooling (MongoClient)                            │
│ └─ Socket management (io.sockets)                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
           ↓ Database Operations
┌──────────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ MongoDB (TrinityCapital database)                               │
│                                                                  │
│ ┌─ User Profiles Collection ────────────────────────────┐      │
│ │  ├─ memberName (username)                            │      │
│ │  ├─ checkingAccount                                  │      │
│ │  │  ├─ balance                                       │      │
│ │  │  ├─ bills [{ Name, Amount, frequency, ... }]     │      │
│ │  │  ├─ paychecks [{ Name, Amount, frequency, ... }] │      │
│ │  │  └─ transactions [{ ... }]                        │      │
│ │  └─ savingsAccount                                   │      │
│ └────────────────────────────────────────────────────────┘      │
│                                                                  │
│ ┌─ Transaction History Collection ─────────────────────┐       │
│ │  ├─ username                                         │       │
│ │  ├─ type ("bill" | "paycheck")                       │       │
│ │  ├─ name                                             │       │
│ │  ├─ amount                                           │       │
│ │  ├─ newBalance                                       │       │
│ │  ├─ timestamp                                        │       │
│ │  └─ quickTimeMode: true/false                        │       │
│ └────────────────────────────────────────────────────────┘      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

```

---

## Data Flow: Sample Student Bill Processing

```
STEP 1: User Interface
─────────────────────
Student fills form:
  amount: 100
  name: "Rent"
  frequency: "weekly"
  category: "Housing"
       ↓
[Submit Button Clicked]
  (.form__btn--bills)
       ↓

STEP 2: Form Validation
───────────────────────
billsAndPayments.js:
  ✓ Amount: 0.01 - 50,000
  ✓ Name: 2-50 chars
  ✓ Frequency: selected
  ✓ Category: selected
       ↓

STEP 3: Data Transmission
──────────────────────────
POST http://localhost:3000/bills
{
  parcel: [
    currentProfile,    // Full user object
    "bill",           // Type
    100,              // Amount
    "weekly",         // Interval
    "Rent",           // Name
    "Housing",        // Category
    "2026-02-03T..."  // Date
  ]
}
       ↓

STEP 4: Server Processing
──────────────────────────
server.js /bills endpoint:
  1. Extract parcel data
  2. Get prfName = "Sample Student 1"
  3. Check: isSampleUser("Sample Student 1") → TRUE
  4. Create newTrans object
  5. Call quickTimeManager.initializeQuickTimeMode("Sample Student 1")
  6. Call schedulerManager.addScheduledTransaction()
  7. Fetch updated profile from DB
  8. Get userSocket from userSockets.get("Sample Student 1")
  9. Emit "checkingAccountUpdate" event
       ↓

STEP 5: Quick Time Initialization
──────────────────────────────────
quickTimeManager.initializeQuickTimeMode():
  1. Verify sample user
  2. Set this.quickTimeUsers.set(username, true)
  3. Set this.simulatedTime.set(username, now)
  4. Process pending transactions
  5. Start interval: setInterval(checkAndProcessTransactions, 500ms)
       ↓

STEP 6: Transaction Processing Loop (Every 500ms)
──────────────────────────────────────────────────
checkAndProcessTransactions():
  1. Fetch user profile from DB
  2. Get currentSimulatedTime (incremented by 1 sec = 1 day)
  3. Check bills array:
     - For each bill:
       - Get nextExecution date
       - IF currentSimulatedTime >= nextExecution:
         - PROCESS TRANSACTION

TIME PASSED: 7 seconds (for weekly)
            = 7 "days" in quick time
            = Transaction is due!
       ↓

STEP 7: Transaction Execution
──────────────────────────────
processQuickTimeTransaction():
  1. Fetch current user profile
  2. Calculate: newBalance = balance - amount
  3. Update DB:
     - Update checkingAccount.balance
     - Update bill.nextExecution to next week
     - Add to transactions array
     - Insert to Transaction History collection
  4. Fetch updated profile
  5. Get socket: userSocket = this.userSockets.get(username)
  6. IF socket found:
     - Emit "checkingAccountUpdate" with updated account
     - Log: "✅ Emitting to socket"
  7. ELSE:
     - Log: "⚠️ Socket not found"
       ↓

STEP 8: Frontend Socket Reception
──────────────────────────────────
script.js listener:
socket.on("checkingAccountUpdate", (updatedChecking) => {
  1. Display balance update
  2. Display new transactions
  3. Display updated bill list
  4. Update global currentProfile
})
       ↓

STEP 9: UI Update
─────────────────
Three functions execute:

  displayBalance(updatedChecking):
    • Balance display: "$1900" → "$1800"
    • Account total update

  displayTransactions(updatedChecking):
    • Add to transaction list:
      "Rent: -$100 on Feb 3"
    • Show running balance

  displayBillList(updatedChecking):
    • Update "Rent" next execution date
    • Show upcoming bills
       ↓

STEP 10: Visual Feedback Complete
──────────────────────────────────
Student sees:
  ✓ Balance decreased by $100
  ✓ New transaction in history
  ✓ Bill marked as paid
  ✓ Next execution updated
  ✓ "⏱️ Quick Time" indicator active
```

---

## Key Design Decisions

### 1. Sample User Detection

```
isSampleUser(username) {
  return username.toLowerCase().includes("sample");
}
```

**Rationale:** Simple, flexible, allows multiple sample accounts
**Alternative considered:** Database flag (more complex)

### 2. 500ms Interval Check (Not 1000ms)

```javascript
setInterval(() => checkAndProcessTransactions(username), 500);
```

**Rationale:** Double frequency ensures we don't miss transactions due to timing
**Benefit:** More granular updates without overwhelming server

### 3. userSockets Map Instead of Socket.io Internal API

```javascript
// ✅ CORRECT
const userSocket = this.userSockets.get(username);

// ❌ WRONG (internal Socket.io implementation)
const userSocket = this.io.sockets.sockets.get(username);
```

**Rationale:** Direct username-to-socket mapping is cleaner and faster
**Benefit:** Explicit, type-safe, no reliance on Socket.io internals

### 4. Socket Emission After DB Update

```javascript
1. Update database
2. Fetch complete updated profile
3. Emit to socket with full data
```

**Rationale:** Ensures UI always has latest data from source of truth (DB)
**Benefit:** No race conditions, consistent state

### 5. Separate from SchedulerManager

```javascript
class QuickTimeManager {
  // ← Separate class
  // Quick time logic
}

class SchedulerManager {
  // ← Separate class
  // Regular scheduling logic
}
```

**Rationale:** Clean separation of concerns
**Benefit:** No interference between sample and regular students

---

## Critical Data Structures

### userSockets Map (Backend)

```javascript
Map: {
  "Sample Student 1" → Socket object,
  "Sample Student 2" → Socket object,
  "Regular Student" → Socket object
}
```

**Purpose:** Map usernames to their active Socket.io connections
**Populated by:** socket.on("identify") handler
**Used by:** QuickTimeManager for emitting events

### quickTimeManager Internal State

```javascript
{
  quickTimeUsers: Map {
    "Sample Student 1" → true,
    "Sample Student 2" → true
  },

  simulatedTime: Map {
    "Sample Student 1" → Date(2026-02-03T12:00:00Z),
    "Sample Student 2" → Date(2026-02-03T12:00:05Z)  // +5 seconds
  },

  quickTimeIntervals: Map {
    "Sample Student 1" → interval ID,
    "Sample Student 2" → interval ID
  }
}
```

### Transaction Object (Database)

```javascript
{
  amount: 100,
  interval: "weekly",
  Name: "Rent",
  Category: "Housing",
  Date: "2026-02-03T12:00:00Z",
  nextExecution: "2026-02-10T12:00:00Z"  // +7 days
}
```

---

## Error Handling

### Socket Not Found

```javascript
const userSocket = this.userSockets.get(username);
if (!userSocket) {
  console.log("⚠️ Socket not found for:", username);
  console.log("Available:", Array.from(this.userSockets.keys()));
  // Transaction still processed in DB, but not sent to client
  // Frontend won't update UI
}
```

### Database Error

```javascript
try {
  await updateDatabase(...);
} catch (error) {
  console.error("❌ Database error:", error);
  // Transaction fails, no socket emission
  // User won't see update
}
```

### Sample User Not Detected

```javascript
if (!quickTimeManager.isSampleUser(username)) {
  console.log("ℹ️ Not a sample user - using regular scheduler");
  // Uses cron-based scheduler instead
}
```

---

## Performance Characteristics

### Memory Usage (Per Sample Student)

- quickTimeUsers entry: ~50 bytes
- simulatedTime entry: ~100 bytes
- quickTimeIntervals entry: ~50 bytes
- **Total per student:** ~200 bytes
- **For 100 sample students:** ~20 KB

### CPU Usage

- Database query: ~10-50ms per check
- Socket emission: ~1-5ms
- JavaScript execution: <1ms
- **Total per transaction:** ~50-60ms
- **With 500ms interval and no transactions:** <2% CPU

### Network Usage (Per Transaction)

- Socket.io event: ~500-1000 bytes
- Database update: ~500 bytes
- **Total per transaction:** ~1-2 KB

---

## Scalability

### Can handle:

- ✅ 100+ sample students running simultaneously
- ✅ 1000+ bills/paychecks across all students
- ✅ Multiple transactions per student per second
- ✅ Real-time updates without blocking

### Would need optimization for:

- ❌ 10,000+ simultaneous connections (consider Redis)
- ❌ 100,000+ daily transactions (consider batch processing)
- ❌ Geographic distribution (consider clustering)

# Quick Time Mode - Complete Flow Diagram

## System Overview

Quick Time Mode is an accelerated time system **ONLY for sample student accounts** where `1 second = 1 simulated day`. Regular students use the standard cron-based scheduler.

---

## Complete Flow: Button Click to Transaction Processing

### 1. **USER CLICKS BUTTON**

```
Frontend UI (index.html)
  ↓
  Buttons with classes:
  - .form__btn--bills (for bills)
  - .form__btn--payments (for payments)
```

**Button Listeners:**

- **billsAndPayments.js** (lines 220-275): Main listener that sends data
- **buttonTracker.js** (lines 116, 163): UITM tracking listener (secondary, for lesson tracking only)

---

### 2. **VALIDATION & DATA COLLECTION**

**File:** `Frontend/Javascript/billsAndPayments.js`

```javascript
billsBTN.addEventListener("click", async function (event) {
  // Validates form inputs:
  - Amount (0.01 - 50,000)
  - Name (2-50 chars)
  - Frequency (weekly, bi-weekly, monthly, yearly)
  - Category (bill type / payment type)

  // Collects data
  await sendBillData(
    type,              // "bill" or "payment"
    amount,            // User entered amount
    interval,          // Frequency selected
    name,              // Bill/payment name
    cat,               // Category
    date               // Current date
  );
});
```

---

### 3. **SEND TO SERVER**

**File:** `Frontend/Javascript/billsAndPayments.js` (line 34-96)

```javascript
fetch("http://localhost:3000/bills", {
  method: "POST",
  body: JSON.stringify({
    parcel: [currentProfile, type, amount, interval, name, cat, date],
  }),
});
```

**Transmitted Data Structure:**

```
parcel: [
  parcel[0] → currentProfile (full user profile object)
  parcel[1] → type ("bill" or "payment")
  parcel[2] → amount (number)
  parcel[3] → interval ("weekly", "bi-weekly", "monthly", "yearly")
  parcel[4] → name (string)
  parcel[5] → cat (category string)
  parcel[6] → date (ISO timestamp)
]
```

---

### 4. **SERVER RECEIVES & PROCESSES**

**File:** `server.js` (lines 1082-1145)

```javascript
app.post("/bills", async (req, res) => {
  // Extract parcel data
  const profile = parcel[0];
  const type = parcel[1];
  const prfName = profile.memberName;

  // Create newTrans object
  const newTrans = {
    amount,
    interval,
    Name,
    Category,
    Date,
  };

  // CRITICAL: Check if sample user
  if (quickTimeManager && quickTimeManager.isSampleUser(prfName)) {
    console.log(
      "⏱️ [Bills] Sample user detected - Quick Time mode will be used",
    );
    await quickTimeManager.initializeQuickTimeMode(prfName);
  }

  // Add to scheduler
  if (schedulerManager) {
    await schedulerManager.addScheduledTransaction(prfName, newTrans, type);
  }

  // Send immediate UI update
  const userSocket = userSockets.get(prfName);
  if (userSocket) {
    userSocket.emit("checkingAccountUpdate", updatedChecking);
  }
});
```

---

### 5a. **PATH A: SAMPLE STUDENT → QUICK TIME MODE**

**File:** `quickTimeManager.js`

#### Step 1: Initialize Quick Time

```javascript
await quickTimeManager.initializeQuickTimeMode(username)
  ↓
  // Checks if sample user (username contains "sample")
  ↓
  // Sets up tracking:
  this.quickTimeUsers.set(username, true)
  this.simulatedTime.set(username, new Date())

  // Processes any pending transactions
  await this.processPendingTransactions(username)

  // Starts interval
  this.startQuickTimeInterval(username)
```

#### Step 2: Start 500ms Interval

```javascript
startQuickTimeInterval(username) {
  const interval = setInterval(() => {
    this.checkAndProcessTransactions(username)
  }, 500);  // Check every 500ms = check "daily"
}
```

#### Step 3: Check for Due Transactions

```javascript
async checkAndProcessTransactions(username) {
  // Every 500ms:

  1. Fetch user profile from database
  2. Get currentSimulatedTime (incremented by 1 second = 1 day)
  3. Loop through bills array
  4. Loop through paychecks array
  5. For each transaction:
     - Get nextExecution date
     - If currentSimulatedTime >= nextExecution:
       → PROCESS IT
}
```

#### Step 4: Process Transaction & Emit to Socket

```javascript
async processQuickTimeTransaction(username, transaction, type) {
  // 1. Fetch current user profile
  // 2. Calculate new balance (bill: subtract, paycheck: add)
  // 3. Update database:
  //    - Update checkingAccount.balance
  //    - Update transaction list (bills or paychecks)
  //    - Update nextExecution date
  //    - Insert into Transaction History collection

  // 4. EMIT TO SOCKET (CRITICAL FIX)
  const userSocket = this.userSockets.get(username);  // ✅ CORRECT
  if (userSocket && updatedProfile) {
    userSocket.emit("checkingAccountUpdate", updatedProfile.checkingAccount);
  } else {
    console.log("⚠️ Socket not found for:", username);
  }
}
```

---

### 5b. **PATH B: REGULAR STUDENT → STANDARD SCHEDULER**

**File:** `SchedulerManager` (existing system)

```javascript
// For non-sample users, transactions go through node-cron scheduler
// Bills/paychecks process on their actual schedule
// No socket emission (uses regular page refresh or polling)
```

---

### 6. **FRONTEND RECEIVES SOCKET EVENT**

**File:** `Frontend/Javascript/script.js` (lines 1019-1036)

```javascript
socket.on("checkingAccountUpdate", (updatedChecking) => {
  // Updates UI immediately with new account data
  displayBalance(updatedChecking);
  displayTransactions(updatedChecking);
  displayBillList(updatedChecking);

  // Updates global state
  if (currentAccount && currentAccount.accountType === "Checking") {
    currentAccount = updatedChecking;
  }
  if (currentProfile) {
    currentProfile.checkingAccount = updatedChecking;
  }
});
```

---

### 7. **DISPLAY UPDATES**

The socket event triggers three UI updates:

#### A. `displayBalance(updatedChecking)`

- Updates balance display
- Updates savings balance
- Updates account total

#### B. `displayTransactions(updatedChecking)`

- Displays transaction history
- Shows all recent transactions
- Updates running balance

#### C. `displayBillList(updatedChecking)`

- Shows upcoming bills
- Shows upcoming paychecks
- Updates next execution dates

---

### 8. **QUICK TIME INDICATOR**

**File:** `Frontend/Javascript/quickTimeMode.js`

If the student is a sample user:

- A **"⏱️ Quick Time"** indicator appears in the top-right corner
- Shows **"1 second = 1 day"** information
- Displays: Weekly (7 sec), Bi-weekly (14 sec), Monthly (30 sec)

On student login:

```javascript
// In script.js login handler (line 1677)
await quickTimeMode.initialize(userId);

// This creates the visual indicator for sample students
```

---

## Key Decision Points

### How does the system know if a student is a sample user?

**Method:** Username contains the word **"sample"** (case-insensitive)

```javascript
isSampleUser(username) {
  return username && username.toLowerCase().includes("sample");
}
```

**Examples of sample usernames:**

- "Sample Student 1"
- "test sample"
- "student_sample_01"
- "Jane Sample"

---

## Timing Schedule: Quick Time Mode

| Frequency | Real Time           | Simulated Days |
| --------- | ------------------- | -------------- |
| Weekly    | 7 seconds           | 7 days         |
| Bi-weekly | 14 seconds          | 14 days        |
| Monthly   | 30 seconds          | 30 days        |
| Yearly    | 365 seconds (6 min) | 365 days       |

---

## Critical Components Check

### ✅ Backend (server.js)

- [x] Line 585: QuickTimeManager initialized with `userSockets` parameter
- [x] Line 173-189: Socket `identify` handler initializes quick time for sample users
- [x] Line 1112: `/bills` endpoint detects sample users and initializes quick time

### ✅ QuickTimeManager (quickTimeManager.js)

- [x] Line 16: Constructor accepts `userSockets` parameter
- [x] Line 20: Stores `this.userSockets = userSockets`
- [x] Line 260: **FIXED** Socket lookup uses `this.userSockets.get(username)` (not `this.io.sockets.sockets.get()`)
- [x] Line 267: Logs when socket is found
- [x] Line 273: Logs warning if socket not found with available usernames

### ✅ Frontend (billsAndPayments.js)

- [x] Line 20-21: Button selectors for `.form__btn--bills` and `.form__btn--payments`
- [x] Line 220-275: Click handlers that call `sendBillData()`
- [x] Line 34: Posts to `/bills` endpoint

### ✅ Frontend Socket Listener (script.js)

- [x] Line 1019: Listener for `checkingAccountUpdate` event
- [x] Line 1022-1024: Calls `displayBalance()`, `displayTransactions()`, `displayBillList()`
- [x] Line 1677: Calls `quickTimeMode.initialize(userId)` on login

### ✅ Quick Time Indicator (quickTimeMode.js)

- [x] Module created and exported
- [x] Only initializes for sample users
- [x] Shows visual indicator in UI

---

## Debugging Checklist

If transactions aren't appearing:

1. **Check Server Logs:**

   - Do you see `⏱️ [Bills] Sample user detected`?
   - Do you see `⏱️ [QuickTime] Processing bill...`?
   - Do you see `✅ [QuickTime] Emitting to socket` or `⚠️ Socket not found`?

2. **Check Frontend Console:**

   - Is the bill button click being registered?
   - Is `sendBillData()` being called?
   - Is the POST request successful (200 response)?
   - Is the `checkingAccountUpdate` socket event being received?

3. **Check Student Account:**

   - Is the username a sample user (contains "sample")?
   - Is the socket connection established (check `🆔 User identified` log)?
   - Are bills/paychecks actually in the database?

4. **Check Timing:**
   - Has enough real time passed? (Weekly = 7 seconds)
   - Is the nextExecution date in the past relative to simulated time?

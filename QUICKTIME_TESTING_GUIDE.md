# Quick Time Mode - Testing Guide

## Setup Before Testing

### 1. Ensure you have a SAMPLE STUDENT account

Create a test account with a username containing the word **"sample"** (case-insensitive)

**Examples:**

- "Sample Student 1"
- "test sample"
- "student_sample_01"
- "Jane Sample"

### 2. Start the server

```bash
cd "Trinity Capital Prod Local"
npm start
```

Watch the server console - you should see connection logs.

---

## Test Procedure

### Step 1: Login as Sample Student

1. Log in with a sample student account
2. Check the browser console (F12)
3. You should see: `🆔 User identified: [username] (Socket ID: [id])`
4. You should see: `⏱️ [Socket.Identify] Sample student detected: [username]`
5. Check top-right corner of page - you should see **"⏱️ Quick Time"** indicator

### Step 2: Create a Bill

1. Click **Bills & Payments** button
2. Fill in the form:
   - **Amount:** 100
   - **Name:** Test Bill
   - **Category:** Utilities (or any category)
   - **Frequency:** Weekly
3. Click **Submit** button

### Step 3: Watch the Server Console

You should see these logs **immediately** (within 1-2 seconds):

```
Processing bill/payment: {
  type: 'bill',
  amount: 100,
  ...
}

⏱️ [Bills] Sample user detected: [username] - Quick Time mode will be used

⏱️ [QuickTime] Initializing quick time mode for: [username]
⏱️ [QuickTime] Simulated time initialized to: [ISO date]
⏱️ [QuickTime] Starting quick time interval for: [username]
```

Then, every 500ms you'll see:

```
🔍 [QuickTime] Checking 1 bills for [username]
```

After 7 seconds (for weekly), you should see:

```
⏱️ [QuickTime] Bill due for [username]: Test Bill (weekly)
💰 [QuickTime] Processing bill: Test Bill for [username]
✅ [QuickTime] Emitting to socket for [username]
```

### Step 4: Watch the Frontend

After the transaction processes (7 seconds):

1. The **balance should update** (decrease by 100)
2. The **transaction should appear** in the transaction list
3. The bill's **next execution date should change**

### Step 5: Watch the Browser Console

You should see:

```
Checking account update received: {
  balanceTotal: [new balance],
  transactions: [...],
  bills: [...],
  paychecks: [...]
}
```

---

## Common Issues & Solutions

### Issue 1: "⏱️ Quick Time" indicator is NOT showing

**Problem:** Student is not being recognized as a sample user
**Solution:**

- Check username contains "sample" (case-insensitive)
- Logout and login again
- Check browser console for: `"is not a sample user - Quick Time mode disabled"`

### Issue 2: Bill is submitted but nothing happens

**Problem:** Quick time mode didn't initialize or socket emission failed
**Solution:**

- Check server console for: `⏱️ [Bills] Sample user detected`
- If not present: Student is not a sample user
- If present but no "Emitting to socket": Socket lookup failed

### Issue 3: Server shows "⚠️ Socket not found"

**Problem:** `userSockets.get(username)` returned null
**Solution:**

- The socket was not properly registered in the identify handler
- Check if `socket.on("identify", ...)` was called
- Check if username in identify matches username in bill submission
- Socket might have disconnected - refresh page and try again

### Issue 4: Transaction appears but balance doesn't update

**Problem:** Socket event was received but UI functions failed
**Solution:**

- Check browser console for JavaScript errors
- Verify `displayBalance()`, `displayTransactions()`, `displayBillList()` exist
- Check that `currentProfile` and `currentAccount` are properly set

---

## Debug Mode: Enable Verbose Logging

### Backend (server.js)

The system already has extensive logging. Watch for:

- 🆔 User identified
- ⏱️ Sample student detected
- 💰 Processing transaction
- ✅ Emitting to socket
- ⚠️ Socket not found

### Frontend (browser console)

Watch for:

- `Checking account update received:`
- `Bill button clicked`
- `sendBillData()` calls
- Socket connection messages

---

## Performance Expectations

### Response Times:

- **Form submission → Server:** < 100ms (instant)
- **Bill creation → Quick time init:** < 500ms
- **First transaction:** 7 seconds (for weekly)
- **Transaction → Socket emit:** < 100ms
- **Socket event → UI update:** < 50ms

### Total time for weekly bill to process and display:

**~7 seconds**

---

## Multi-Transaction Testing

### Test with Multiple Bills:

1. Create a **daily** bill (processes in 1 second)
2. Create a **weekly** bill (processes in 7 seconds)
3. Create a **bi-weekly** bill (processes in 14 seconds)
4. Watch the staggered processing

**Expected output:**

```
After 1 second: Daily bill processes
After 7 seconds: Weekly bill processes
After 14 seconds: Bi-weekly bill processes
```

---

## Real-World Scenario

### Simulate a "Month" of Transactions:

1. Create a monthly bill ($300)
2. Create a bi-weekly paycheck ($1000)
3. Create a weekly bill ($50)

In **30 seconds**, the student should experience:

- 4 weekly bills ($50 × 4 = $200)
- 2 bi-weekly paychecks ($1000 × 2 = $2000)
- 1 monthly bill ($300)

**Net change in balance:** +$2000 - $200 - $300 = +$1500

---

## Regression Testing

### For Regular (Non-Sample) Students:

1. Create a non-sample user (username WITHOUT "sample")
2. Add a bill/payment
3. Quick time should NOT activate
4. Use standard cron-based scheduler
5. No "⏱️ Quick Time" indicator should appear
6. No Socket.io transaction emissions should occur

---

## If Everything Works:

You should see:

- ✅ Sample students get instant bill/paycheck processing
- ✅ Regular students use standard scheduler
- ✅ Transactions appear in real-time on socket events
- ✅ UI updates balance, transactions, and bill list
- ✅ No interference with other student accounts
- ✅ Multiple students can run quick time simultaneously

# Quick Time Mode - Quick Start Guide

## What is Quick Time Mode?

Quick Time Mode accelerates the passage of time for sample student accounts only. Instead of waiting real-time for bills and paychecks to process, sample students experience:

- **1 second = 1 day**
- Weekly bills process in 7 seconds
- Bi-weekly bills process in 14 seconds
- Monthly bills process in 30 seconds

## For Instructors/Teachers

### How to Use in Class

1. **Create Sample Student Account**

   - Username: "Sample Student" (must contain "sample")
   - PIN: Any 4-digit number
   - This account resets on each login for fresh demonstrations

2. **Have Students Experience the System Quickly**

   - Students login as "Sample Student"
   - Top-right corner shows "⏱️ Quick Time ENABLED"
   - Create bills and paychecks
   - See them process in seconds instead of days/weeks

3. **Compare Real vs Quick Time**
   - Regular accounts follow real-time scheduling
   - Sample accounts show accelerated results
   - Great for showing cause-and-effect in one lesson

### Educational Benefits

✅ Demonstrate financial concepts without waiting  
✅ Show multiple scenarios in one class period  
✅ Let students experiment with different frequencies  
✅ Immediate feedback on account changes  
✅ No interference with production accounts

---

## For Developers/Testing

### Verify Installation

1. **Server-side**

   - Check that `quickTimeManager.js` exists in project root
   - Verify `server.js` imports QuickTimeManager
   - Verify `/quicktime/status/:username` endpoint works

2. **Client-side**
   - Check that `Frontend/Javascript/quickTimeMode.js` exists
   - Verify it's imported in `script.js`
   - Check browser console for initialization messages

### Test Flow

```
1. Login as "Sample Student"
   ↓
2. See "⏱️ Quick Time ENABLED" badge (top-right)
   ↓
3. Add monthly bill: "Rent" for $1000
   ↓
4. Wait 30 seconds (= 1 simulated month)
   ↓
5. Account balance decreases by $1000
   ↓
6. Green notification: "Bill Paid"
```

---

## Monitoring

### Console Messages

Watch the browser console for:

```
⏱️  [Socket.Identify] Sample student detected: Sample Student - Initializing Quick Time mode
✅ [QuickTimeMode] Quick Time mode is ACTIVE for Sample Student
```

Watch the server console for:

```
⏱️  [QuickTime] Initializing quick time mode for: Sample Student
⏱️  [QuickTime] Bill due for Sample Student: Rent (monthly)
💰 [QuickTime] Processing bill: Rent for Sample Student
✅ [QuickTime] Bill processed: Rent | New Balance: $5000
```

### Visual Feedback

- **Badge**: "⏱️ Quick Time ENABLED" in top-right corner
- **Notifications**: Green/red slide-in when transactions process
- **Real-time**: Updates happen live as time advances

---

## Common Scenarios

### Scenario 1: Teaching Weekly vs Monthly Bills

```
1. Create a weekly bill: "$50/week"
2. Wait 7 seconds → Bill processes
3. Create a monthly bill: "$200/month"
4. Wait 30 seconds → Bill processes
5. Show how frequency affects account balance over time
```

### Scenario 2: Testing Paycheck Impact

```
1. Create monthly paycheck: "$2000"
2. Wait 30 seconds → Paycheck deposits
3. Create monthly bill: "$1500"
4. Wait 30 seconds → Bill deducts
5. Net monthly result: +$500
```

### Scenario 3: Demonstrating Debt Accumulation

```
1. Start with $1000 balance
2. Create weekly bill: "$200"
3. Create bi-weekly paycheck: "$300"
4. Watch balance fluctuate over simulated weeks
5. Clear visual of income vs expenses
```

---

## Troubleshooting

### Problem: Badge Not Showing

**Check:**

- Username contains "sample" (case-insensitive)
- Browser console for errors
- Network tab shows Socket.io connected
- Page fully loaded before actions

**Solution:**

- Logout and login again
- Check browser console: `console.log(quickTimeMode)`
- Verify account name matches exactly

### Problem: Transactions Not Processing

**Check:**

- Wait appropriate time (30 sec for monthly, etc.)
- Check server console for processing messages
- Verify account has sufficient balance for bills
- Check that bill/paycheck was created AFTER quick time activated

**Solution:**

- Create new bill/paycheck after quick time initializes
- If already created, logout and login to re-initialize
- Check next execution date in database

### Problem: Slow Processing

**Expected behavior:**

- Checks happen every 500ms
- Small delays are normal
- All transactions should process within 1 second of time passage

**Optimizations:**

- Reduce check interval in quickTimeManager.js
- Run server on local machine (lower latency)
- Use wired network connection

---

## For Regular (Non-Sample) Accounts

### No Changes

- Regular accounts use existing node-cron scheduler
- No visual indicators appear
- Time passes normally
- All existing functionality unchanged

### Verification

- Create bill with regular account
- Verify NO quick time badge appears
- Bill processes on real schedule (next occurrence)
- Regular cron system logs appear in server console

---

## Tips & Tricks

### Quick Demo (2 minutes)

1. Login as Sample Student
2. Create weekly bill: "$50"
3. Create weekly paycheck: "$100"
4. Wait 7 seconds
5. Show the result: +$50 weekly net income

### Extended Demo (10 minutes)

1. Show account starting at $5000
2. Create multiple bills (weekly, bi-weekly, monthly)
3. Create paychecks (weekly, monthly)
4. Fast-forward 90 simulated days (90 seconds)
5. Calculate real impact over 3 months

### Visual Comparison

- Have two browsers open
- One with Sample Student (quick time)
- One with regular account (real time)
- Show the difference side-by-side

---

## Settings to Customize

### Change Time Scale

In `quickTimeManager.js`, method `simulatedDaysToMs()`:

```javascript
// Current: 1 second = 1 day
return days * 1000;

// Change to: 1 second = 1 hour
return (days * 1000) / 24;

// Change to: 1 second = 10 days (faster)
return days * 100;
```

### Change Check Frequency

In `quickTimeManager.js`, method `startQuickTimeInterval()`:

```javascript
// Current: checks every 500ms
const interval = setInterval(..., 500);

// Change to: checks every 100ms (faster response)
const interval = setInterval(..., 100);
```

### Change Sample User Detection

In `quickTimeManager.js`, method `isSampleUser()`:

```javascript
// Current: any username with "sample"
return username && username.toLowerCase().includes("sample");

// Change to: specific usernames
const sampleUsers = ["Sample Student", "Demo Student", "Test Student"];
return sampleUsers.includes(username);
```

---

## API Reference

### Get Quick Time Status

```bash
GET /quicktime/status/Sample%20Student

Response:
{
  "isEnabled": true,
  "username": "Sample Student",
  "simulatedTime": "2026-02-03T10:30:00.000Z",
  "isSampleUser": true
}
```

### Create Bill in Quick Time

```bash
POST /bills

Body:
{
  "parcel": [
    currentProfile,      // Profile object
    "bill",              // Type
    1000,                // Amount
    "monthly",           // Frequency (weekly/bi-weekly/monthly)
    "Rent",              // Name
    "Housing",           // Category
    "2026-02-03"        // Date
  ]
}

Response includes: "quickTimeMode": true
```

---

## Performance Metrics

- **Interval**: 500ms per user (minimal CPU)
- **Database**: One update per transaction
- **Socket.io**: Lightweight emit messages
- **Overhead**: ~2-5% additional server load per sample user

---

## Support & Documentation

For more details, see: [QUICK_TIME_MODE_DOCUMENTATION.md](QUICK_TIME_MODE_DOCUMENTATION.md)

For implementation details, see:

- `quickTimeManager.js` (backend)
- `Frontend/Javascript/quickTimeMode.js` (frontend)

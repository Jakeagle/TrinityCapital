# Button Flow: Bills & Payments Modal

## Button Locations

### HTML Buttons (index.html)

```html
<!-- BILLS BUTTON -->
<button class="form__btn form__btn--transfer form__btn--bills">
  <i class="fa-solid fa-arrow-right"></i>
</button>

<!-- PAYMENTS BUTTON -->
<button class="form__btn form__btn--transfer form__btn--payments">
  <i class="fa-solid fa-arrow-right"></i>
</button>
```

**Modal:** `.billsAndPaymentsModal`

---

## Click Handler Chain

### PRIMARY HANDLER (billsAndPayments.js)

#### Bills Button (Line 220)

```javascript
billsBTN.addEventListener("click", async function (event) {
  // 1. Log Lesson Manager event
  processAction("bill_added", {
    amount: parseInt(-Math.abs(billInput.value)),
    name: billName.value.trim(),
    category: billType,
  });

  // 2. Prevent default form submission
  event.preventDefault();

  // 3. Show loading state on button
  const originalText = billsBTN.textContent;
  setButtonLoading(billsBTN, true, originalText);

  try {
    // 4. Validate form inputs
    const errors = validateForm("bill");
    if (errors.length > 0) {
      showNotification(errors.join(", "), "error");
      return;
    }

    const newDate = new Date().toISOString();

    // 5. SEND TO SERVER
    await sendBillData(
      "bill",
      parseInt(-Math.abs(billInput.value)), // Negative for bills
      billInterval,
      billName.value.trim(),
      billType,
      newDate,
    );

    // 6. Update local profile for lesson tracking
    if (!currentProfile.bills) {
      currentProfile.bills = [];
    }
    currentProfile.bills.push({
      name: billName.value.trim(),
      amount: parseInt(-Math.abs(billInput.value)),
      category: billType,
      interval: billInterval,
      date: newDate,
    });
  } catch (error) {
    console.error("Error processing bill:", error);
  } finally {
    // 7. Reset button state
    setTimeout(() => {
      setButtonLoading(billsBTN, false, originalText);
    }, 1000);
  }
});
```

#### Payments Button (Line 278)

```javascript
paymentsBTN.addEventListener("click", async function (event) {
  // Same flow as bills button, but:
  // - Amounts are POSITIVE (not negative)
  // - Processes to paychecks array
  // - Calls processAction("payment_added", ...)
  // REST OF FLOW IS IDENTICAL
});
```

---

### SECONDARY HANDLER (buttonTracker.js - UITM)

**File:** Frontend/Javascript/ILGE/UITM/buttonTracker.js

#### Bills Button Handler (Line 116)

```javascript
const billsSubmitButton = billsModal.querySelector(".form__btn--bills");
if (billsSubmitButton) {
  if (!billsSubmitButton.dataset.uitmListener) {
    billsSubmitButton.dataset.uitmListener = "true";

    billsSubmitButton.addEventListener("click", () => {
      // Extract form values
      const billType = billTypeSelect.value;
      const billName = billNameInput.value;
      const billAmount = billAmountInput.value;
      const billFrequency = billFrequencySelect.value;

      // Log to console
      console.log("--- UITM: Bills Form Submitted ---");
      console.log(`Bill Type: ${billType}`);
      console.log(`Bill Name: ${billName}`);
      console.log(`Bill Amount: ${billAmount}`);
      console.log(`Bill Frequency: ${billFrequency}`);

      // Send to lesson manager for condition tracking
      processAction("bill_created", {
        billType,
        billName,
        billAmount,
        billFrequency,
      });
    });
  }
}
```

#### Payments Button Handler (Line 163)

```javascript
const paymentsSubmitButton = billsModal.querySelector(".form__btn--payments");
if (paymentsSubmitButton) {
  if (!paymentsSubmitButton.dataset.uitmListener) {
    paymentsSubmitButton.dataset.uitmListener = "true";

    paymentsSubmitButton.addEventListener("click", () => {
      // Extract form values
      const paymentType = paymentTypeSelect.value;
      const paymentName = paymentNameInput.value;
      const paymentAmount = paymentAmountInput.value;
      const paymentFrequency = paymentFrequencySelect.value;

      // Log to console
      console.log("--- UITM: Payments Form Submitted ---");
      console.log(`Payment Type: ${paymentType}`);
      console.log(`Payment Name: ${paymentName}`);
      console.log(`Payment Amount: ${paymentAmount}`);
      console.log(`Payment Frequency: ${paymentFrequency}`);

      // Send to lesson manager for condition tracking
      processAction("payment_created", {
        paymentType,
        paymentName,
        paymentAmount,
        paymentFrequency,
      });
    });
  }
}
```

---

## sendBillData() Function

**File:** Frontend/Javascript/billsAndPayments.js (Line 34)

```javascript
async function sendBillData(type, amount, interval, name, cat, date) {
  try {
    // 1. VALIDATION
    if (!currentProfile) {
      throw new Error("No user profile loaded");
    }
    if (!amount || amount === 0) {
      throw new Error("Amount must be greater than 0");
    }
    if (!interval) {
      throw new Error("Please select a frequency");
    }
    if (!name || name.trim() === "") {
      throw new Error("Please enter a name");
    }
    if (!cat) {
      throw new Error("Please select a category");
    }

    console.log(`Sending ${type} data:`, {
      type,
      amount,
      interval,
      name,
      cat,
      date,
    });

    // 2. POST REQUEST
    const response = await fetch(billURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parcel: [currentProfile, type, amount, interval, name, cat, date],
      }),
    });

    // 3. PARSE RESPONSE
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Server error: ${response.status}`);
    }

    console.log(`${type} scheduled successfully:`, result);

    // 4. SHOW SUCCESS NOTIFICATION
    showNotification(
      `${type.charAt(0).toUpperCase() + type.slice(1)} scheduled successfully!`,
      "success",
    );

    // 5. CLEAR FORM
    clearForm(type);

    // 6. UPDATE SCHEDULER STATUS
    await updateSchedulerStatus();

    // 7. RETURN RESPONSE
    return result;
  } catch (error) {
    console.error(`Error sending ${type} data:`, error);
    showNotification(`Error: ${error.message}`, "error");
    throw error;
  }
}
```

---

## Server Processing (/bills Endpoint)

**File:** server.js (Line 1082)

```javascript
app.post("/bills", async (req, res) => {
  try {
    const { parcel } = req.body;

    // 1. EXTRACT DATA FROM PARCEL
    const profile = parcel[0]; // User profile
    const type = parcel[1]; // "bill" or "payment"
    const amount = parcel[2]; // Amount
    const interval = parcel[3]; // Frequency
    const billName = parcel[4]; // Name
    const cat = parcel[5]; // Category
    const date = parcel[6]; // Date

    console.log("Processing bill/payment:", {
      type,
      amount,
      interval,
      billName,
      cat,
      date,
    });

    const prfName = profile.memberName;

    // 2. CREATE TRANSACTION OBJECT
    const newTrans = {
      amount: amount,
      interval: interval,
      Name: billName,
      Category: cat,
      Date: date,
    };

    // 3. CHECK IF SAMPLE USER & INIT QUICK TIME
    if (quickTimeManager && quickTimeManager.isSampleUser(prfName)) {
      console.log(
        `⏱️  [Bills] Sample user detected: ${prfName} - Quick Time mode will be used`,
      );
      await quickTimeManager.initializeQuickTimeMode(prfName);
    }

    // 4. ADD TO SCHEDULER
    if (schedulerManager) {
      await schedulerManager.addScheduledTransaction(prfName, newTrans, type);

      // 5. FETCH UPDATED PROFILE
      const updatedUserProfile = await client
        .db("TrinityCapital")
        .collection("User Profiles")
        .findOne({ "checkingAccount.accountHolder": prfName });

      const updatedChecking = updatedUserProfile.checkingAccount;

      // 6. SEND SOCKET UPDATE
      const userSocket = userSockets.get(prfName);
      if (userSocket) {
        userSocket.emit("checkingAccountUpdate", updatedChecking);
      }

      // 7. RETURN SUCCESS
      res.status(200).json({
        success: true,
        message: `${type} scheduled successfully`,
        schedulerStatus: schedulerManager.getSchedulerStatus(),
        quickTimeMode: quickTimeManager?.isSampleUser(prfName) || false,
      });
    } else {
      res.status(500).json({ error: "Scheduler not initialized" });
    }
  } catch (error) {
    console.error("Error in /bills endpoint:", error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## Event Emitter Chain

```
EVENT 1: Bill button clicked
  ↓
billsBTN click listener fires (billsAndPayments.js line 220)
  ↓
EVENT 2: processAction("bill_added") emitted
  ↓
Lesson manager receives and processes
  ↓
EVENT 3: billsBTN UITM click listener fires (buttonTracker.js)
  ↓
processAction("bill_created") emitted to lesson manager
  ↓
EVENT 4: sendBillData() called
  ↓
Validates form and sends HTTP POST
  ↓
SERVER /bills endpoint receives
  ↓
EVENT 5: quickTimeManager.initializeQuickTimeMode() called
  ↓
EVENT 6: 500ms interval started checking for due transactions
  ↓
(7 seconds later for weekly transaction)
  ↓
EVENT 7: Socket.emit("checkingAccountUpdate") sent
  ↓
FRONTEND: socket.on("checkingAccountUpdate") fires
  ↓
EVENT 8: UI functions called:
  - displayBalance()
  - displayTransactions()
  - displayBillList()
  ↓
COMPLETE: UI updated with transaction
```

---

## Response Flow

### Server Response to Frontend (after /bills POST)

```json
{
  "success": true,
  "message": "bill scheduled successfully",
  "schedulerStatus": {
    "totalScheduledJobs": 42,
    "isRunning": true
  },
  "quickTimeMode": true // ← Indicates if sample user
}
```

### Frontend Handling Response

```javascript
const result = await response.json();

if (!response.ok) {
  showNotification("Error: " + result.error, "error");
  throw error;
}

// Success
showNotification("Bill scheduled successfully!", "success");
clearForm("bill");
updateSchedulerStatus();
```

---

## State Variables Used

### Form State (billsAndPayments.js)

```javascript
export let billInterval; // "weekly", "bi-weekly", "monthly", "yearly"
export let payInterval; // Same as above
let billType; // Category from dropdown
let paymentType; // Category from dropdown
```

### Updated During Input Changes

```javascript
billFrequency.addEventListener("change", (e) => {
  billInterval = e.target.selectedOptions[0].value;
});

billTypeSelect.addEventListener("change", (e) => {
  billType = e.target.selectedOptions[0].value;
});
```

---

## Clear Form Function

After successful submission, form is cleared:

```javascript
function clearForm(type) {
  if (type === "bill") {
    billInput.value = "";
    billName.value = "";
    billFrequency.selectedIndex = 0;
    billTypeSelect.selectedIndex = 0;
    billInterval = "";
    billType = "";
  } else if (type === "payment") {
    paymentInput.value = "";
    paymentName.value = "";
    paymentFrequency.selectedIndex = 0;
    paymentTypeSelect.selectedIndex = 0;
    payInterval = "";
    paymentType = "";
  }
}
```

---

## Summary

**Click Path:**

1. User clicks `.form__btn--bills` or `.form__btn--payments`
2. Primary handler (billsAndPayments.js) validates and sends data
3. Secondary handler (buttonTracker.js) logs for lesson tracking
4. POST to /bills endpoint
5. Server detects sample user and initializes QuickTimeManager
6. Transaction processes on accelerated schedule
7. Socket.io emits update to frontend
8. Frontend updates UI with new transaction

**For Sample Students:** Transactions process in seconds (Quick Time)
**For Regular Students:** Transactions process in real time (Standard Scheduler)

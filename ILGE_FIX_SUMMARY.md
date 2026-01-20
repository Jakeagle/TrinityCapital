# ILGE Condition Rendering Issue - Fix Summary

## Problem Description

When users submit a bill or paycheck, the conditions assigned to those actions were not being properly checked and matched by the CRM (Condition Rendering Module). The expected behavior was:

1. **UITM** (User Interface Tracking Module) captures bill/paycheck form data
2. **UITM** sends data to **CRM** via `processAction()`
3. **CRM** checks if the submitted data matches any lesson conditions
4. If matched, **CRM** fires the associated action

**The system was failing at step 3 - the condition matching logic was flawed.**

---

## Root Cause Analysis

### Issue 1: String vs. Numeric Comparison (PRIMARY BUG)

**File:** [`lessonManager.js`](lessonManager.js#L390-L398)

The original condition checking logic used **strict equality (`===`)** for all comparisons:

```javascript
conditionMet = Object.entries(condition.condition_value).every(
  ([key, value]) => {
    return actionParams[key] === value; // ❌ Fails for type mismatches
  }
);
```

**Problem:**

- Form inputs (`<input>` elements) always return **strings**
- Lesson conditions might define values as **numbers**, **strings**, or other types
- `"250" === 250` evaluates to `false` ❌
- `"250" === "250"` works, but only if both are strings

**Examples of failures:**

```javascript
// UITM sends:
{
  billAmount: "250";
} // string from <input>.value

// Lesson condition expects:
{
  billAmount: 250;
} // number in the lesson definition

// Result: "250" === 250 → false ❌ Condition fails!
```

### Issue 2: Case Sensitivity

Dropdown values like `"Electricity"` vs `"electricity"` would not match due to case-sensitive comparison.

### Issue 3: String Whitespace

If the form had extra spaces (e.g., `" electricity "` from the DOM), it wouldn't match `"electricity"`.

### Issue 4: Insufficient Logging

The original log message didn't show the condition values being checked, making debugging difficult:

```javascript
console.log(
  `Checking condition: ${key} === ${value}. Actual value: ${actionParams[key]}`
);
// Output: "Checking condition: billType === undefined. Actual value: undefined"
// Didn't show what the actual condition value was!
```

---

## The Fix

### Fix 1: Enhanced Condition Matching Logic

**File:** [`lessonManager.js`](lessonManager.js#L386-L418)

Updated the condition checking to handle multiple data types intelligently:

```javascript
if (condition.condition_value) {
  console.log(
    `Comparing condition values for ${actionType}:`,
    condition.condition_value,
    "against action params:",
    actionParams
  );

  conditionMet = Object.entries(condition.condition_value).every(
    ([key, value]) => {
      const actionValue = actionParams[key];

      // 1. Normalize string comparisons (case-insensitive, trim whitespace)
      if (typeof value === "string" && typeof actionValue === "string") {
        const normalizedValue = String(value).toLowerCase().trim();
        const normalizedAction = String(actionValue).toLowerCase().trim();
        console.log(
          `Checking string condition: "${normalizedValue}" === "${normalizedAction}". Result: ${normalizedValue === normalizedAction}`
        );
        return normalizedValue === normalizedAction;
      }

      // 2. For numeric comparisons, normalize to numbers
      if (!isNaN(value) && !isNaN(actionValue)) {
        const numValue = parseFloat(value);
        const numAction = parseFloat(actionValue);
        console.log(
          `Checking numeric condition: ${numValue} === ${numAction}. Result: ${numValue === numAction}`
        );
        return numValue === numAction;
      }

      // 3. Default strict equality check
      console.log(
        `Checking condition: ${key} === ${value}. Actual value: ${actionValue}. Result: ${actionValue === value}`
      );
      return actionValue === value;
    }
  );
}
```

**What it does:**

1. ✅ **Handles string values:** Normalizes to lowercase and trims whitespace
2. ✅ **Handles numeric values:** Converts both strings and numbers to floats for comparison
3. ✅ **Better logging:** Shows exactly what's being compared and the result

### Fix 2: Enhanced UITM Logging

**Files:**

- [`buttonTracker.js` - Bill submission](UITM/buttonTracker.js#L116-L133)
- [`buttonTracker.js` - Payment submission](UITM/buttonTracker.js#L160-L189)

Added type information logging so you can see if UITM is sending the right data:

```javascript
console.log(`Bill Type: ${billType} (type: ${typeof billType})`);
console.log(`Bill Amount: ${billAmount} (type: ${typeof billAmount})`);

const billData = {
  billType: billType,
  billName: billName,
  billAmount: billAmount,
  billFrequency: billFrequency,
};

console.log("UITM: Sending bill data to CRM:", billData);
processAction("bill_submitted", billData);
```

---

## Testing & Debugging

### How to verify the fix works:

1. **Open Browser Console** (F12 → Console tab)

2. **Submit a bill/paycheck with these details:**

   - Bill Type: `electricity`
   - Bill Name: `Electric Bill`
   - Bill Amount: `250`
   - Bill Frequency: `monthly`

3. **Look for these console logs:**

   ```
   UITM: Bills Form Submitted
   Bill Type: electricity (type: string)
   Bill Amount: 250 (type: string)
   UITM: Sending bill data to CRM: {billType: 'electricity', billName: 'Electric Bill', billAmount: '250', billFrequency: 'monthly'}
   Processing action: bill_submitted {billType: 'electricity', ...}
   Comparing condition values for bill_submitted: {billType: 'electricity'} against action params: {billType: 'electricity', ...}
   Checking string condition: "electricity" === "electricity". Result: true
   Executing reaction: [ACTION_NAME]
   ```

4. **If the condition is not triggering:**
   - Check the console logs to see what condition values were expected
   - Verify your lesson definition matches the UITM field names exactly
   - Check for case sensitivity or whitespace issues

---

## Lesson Definition Requirements

When creating lessons with bill/paycheck conditions, ensure:

```javascript
{
  condition_type: "bill_submitted",  // or "payment_submitted"
  condition_value: {
    billType: "electricity",         // Will now match "Electricity", "ELECTRICITY", etc.
    billAmount: "250"                // Will now match 250 (numeric) or "250" (string)
  },
  action_type: "send_message",
  action_details: {
    message: "Great job creating a bill!"
  }
}
```

---

## Summary of Changes

| File                                                  | Changes                                                           | Purpose                              |
| ----------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------ |
| [`lessonManager.js`](lessonManager.js#L386-L418)      | Enhanced condition matching with type handling and better logging | Fix string/numeric comparison issues |
| [`buttonTracker.js`](UITM/buttonTracker.js#L116-L133) | Added type logging for bills                                      | Improve debugging visibility         |
| [`buttonTracker.js`](UITM/buttonTracker.js#L160-L189) | Added type logging for payments                                   | Improve debugging visibility         |

---

## Next Steps

If conditions are still not triggering after this fix:

1. **Check lesson definitions** - Ensure conditions exist for `bill_submitted` or `payment_submitted`
2. **Verify condition syntax** - Check that `condition_value` object keys match UITM field names
3. **Review console logs** - The enhanced logging will show exactly what's being compared
4. **Check active lessons** - Ensure `activeLessons` has the lesson you're testing (check with `activeLessons.size` in console)

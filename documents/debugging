# ILGE Debugging Guide - Bill/Paycheck Condition Not Firing

## Updated Diagnostic Logging

I've enhanced the console logging in `lessonManager.js` to give you detailed visibility into exactly what's happening when you submit a bill or paycheck. This will help identify where the issue is.

## What to Look for in Console

When you submit a bill or paycheck, you should now see:

### 1. **UITM Submission** (from buttonTracker.js)

```
--- UITM: Bills Form Submitted ---
Bill Type: electricity (type: string)
Bill Name: Electric Bill (type: string)
Bill Amount: 250 (type: string)
Bill Frequency: monthly (type: string)
Checking for matching conditions in active lesson...
----------------------------------
UITM: Sending bill data to CRM: {billType: 'electricity', billName: 'Electric Bill', billAmount: '250', billFrequency: 'monthly'}
```

### 2. **CRM Action Processing Starts** (from lessonManager.js)

```
=== Processing action: bill_submitted ===
{billType: 'electricity', billName: 'Electric Bill', billAmount: '250', billFrequency: 'monthly'}
Total active lessons: 1
```

**If you see `Total active lessons: 0`**, this is your problem! The lesson hasn't been activated yet.

### 3. **Active Lessons Status**

```
📚 Active Lesson: "Money Personality" (ID: 6570c1234...)
   - Has completion_conditions: true
   - Number of conditions: 3
     Condition 1: type="bill_submitted", action="send_message", met=false
     Condition 2: type="payment_submitted", action="send_message", met=false
     Condition 3: type="elapsed_time", action="send_message", met=false
```

**If you see `Has completion_conditions: false`**, the lesson definition is missing conditions.
**If you see no conditions**, the lesson wasn't loaded with condition data.

### 4. **Condition Matching**

```
   → Found 1 matching condition(s) for action type "bill_submitted"

   🔍 Checking condition 1:
      - Expected values: {billType: 'electricity'}
      - Action params: {billType: 'electricity', billName: 'Electric Bill', billAmount: '250', billFrequency: 'monthly'}

      Checking string condition: "electricity" === "electricity". Result: true
      ✅ CONDITION MET! Now executing action: "send_message"
      🚀 Executing reaction: send_message
```

### 5. **End of Processing**

```
=== End of action processing for: bill_submitted ===
```

---

## Diagnostic Flowchart

Use this to identify where things are failing:

### Problem: "No Active Lessons"

```
❌ NO ACTIVE LESSONS! Conditions cannot be checked.
   The lesson may not have been activated yet.
```

**Solution:**

- Make sure you clicked "Begin Activities" on the lesson modal
- Check that `activateLesson()` was called with the lesson data
- Verify the lesson has an `_id` field

**Test:** In console, type:

```javascript
activeLessons.size; // Should be > 0
Array.from(activeLessons.values()).map((l) => l.lesson_title); // Should show your lesson
```

---

### Problem: "No completion_conditions"

```
❌ Lesson "Money Personality" has no completion_conditions!
```

**Solution:**

- The lesson data returned from the server doesn't include `completion_conditions`
- Check your lesson definition in the database
- Verify the endpoint is returning the full lesson object with conditions

**Causes:**

1. Lesson was created without conditions
2. The `/lessons` endpoint isn't returning conditions
3. The conditions are stored in a different field name

**Test:** In console, type:

```javascript
Array.from(activeLessons.values()).map((l) => ({
  title: l.lesson_title,
  hasConditions: !!l.completion_conditions,
  condition_count: l.completion_conditions?.length || 0,
}));
```

---

### Problem: "No Matching Conditions"

```
→ No conditions matching action type "bill_submitted" in lesson "Money Personality"
```

**Solution:**

- The lesson doesn't have any conditions with `condition_type: "bill_submitted"`
- Check your lesson definition - does it have bill_submitted conditions?

**Expected condition structure:**

```javascript
{
  condition_type: "bill_submitted",
  condition_value: {
    billType: "electricity"
    // OR other matching criteria
  },
  action_type: "send_message",
  action_details: { message: "..." }
}
```

**Test:** In console, type:

```javascript
Array.from(activeLessons.values())[0].completion_conditions.forEach((c) =>
  console.log(c.condition_type)
);
```

---

### Problem: "Condition NOT Met"

```
Expected values: {billType: 'electricity'}
Action params: {billType: 'Electricity', ...}

❌ Condition NOT met for action: bill_submitted
```

**Solution:**

- The values don't match exactly (case sensitivity, type mismatch, etc.)
- Your enhanced condition matching should handle case-insensitive comparisons now
- Check the actual values vs expected

**Debug:**
The condition checking now logs both values being compared, so you can see the exact mismatch.

---

## Data Flow Checklist

Before submitting a bill, verify:

- [ ] ✅ Lesson "Money Personality" is in the system
- [ ] ✅ You clicked "Begin Activities" button (lesson should be activated)
- [ ] ✅ Lesson has `completion_conditions` array with at least one condition
- [ ] ✅ At least one condition has `condition_type: "bill_submitted"`
- [ ] ✅ That condition has `condition_value` matching what you'll submit
- [ ] ✅ The action_type for that condition is in the CRM actions library

## Quick Console Commands

```javascript
// Check active lessons
activeLessons.size;

// View all active lesson details
Array.from(activeLessons.values()).forEach((lesson) => {
  console.log(`Lesson: ${lesson.lesson_title}`);
  console.log(`Conditions: ${lesson.completion_conditions?.length || 0}`);
});

// Check if an action is defined in CRM
Object.keys(actions).filter((a) => a.includes("send"));

// Manually fire an action (for testing)
processAction("bill_submitted", {
  billType: "electricity",
  billName: "Test Bill",
  billAmount: "100",
  billFrequency: "monthly",
});
```

---

## Next Steps After Diagnosis

Once you see the console logs:

1. **If "No Active Lessons"** → Make sure the lesson is properly activated when you click "Begin Activities"
2. **If "No Conditions"** → Update your lesson definition to include conditions
3. **If "No Matching Conditions"** → Add bill_submitted conditions to your lesson
4. **If "Condition Not Met"** → Verify the condition values match what you're submitting
5. **If Action Not Found** → Check that the action exists in the CRM actions library

---

## Common Lesson Definition Example

Here's what a properly configured lesson should have:

```javascript
{
  _id: "lesson_123",
  lesson_title: "Money Personality",
  completion_conditions: [
    {
      condition_type: "bill_submitted",
      condition_value: {
        // Optional: specify which bills trigger this
        // billType: "utilities" // or leave empty to match any bill
      },
      action_type: "send_message",
      action_details: {
        message: "Great job creating a bill!"
      },
      isMet: false
    },
    {
      condition_type: "payment_submitted",
      condition_value: {},
      action_type: "send_message",
      action_details: {
        message: "Nice! You added income."
      },
      isMet: false
    }
  ]
}
```

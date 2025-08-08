# Trinity Capital Lesson Engine - Architecture Plan

This document provides a high-level yet actionable plan for building the Trinity Capital Lesson Engine. It is intended to guide GitHub Copilot and developers by outlining system behavior, expected data flows, and integration rules.

---

## 🔗 Dependencies (Interconnected Systems)

1. **Student App**

   - Uses: `server.js`, `Frontend/Javascript/*`, `index.html`
   - Purpose: Delivers interactive UI and app features (transfers, budgets, bills, etc.)

2. **Lesson Server**

   - Uses: `server.js`
   - Purpose: Hosts, evaluates, and tracks active lesson sessions.

3. **Teacher Dashboard**

   - Uses: `script.js`
   - Purpose: Sends lesson conditions; receives performance and health data.

4. **Lesson Renderer**
   - Uses: `lessonRenderer.js`
   - Purpose: Pulls and renders lesson content from MongoDB Atlas DB.

---

## 👣 Student Flow Summary

### 1. Lesson Access

- Student logs in to the app.
- Unit 1 is always visible by default.
  - **If teacher has custom Unit 1**, it takes precedence unless reverted to default.

### 2. Lesson Gating

- Students must complete the current lesson before accessing the next.
  - Attempting to skip triggers a friendly prompt guiding them to the next required lesson.

### 3. Lesson Content Rendering

- Headers + text blocks are grouped.
- Multiple text blocks with no header appear standalone.
- Consecutive headers render independently.

### 4. Instruction Generation

- Upon reaching the instruction page, the engine interprets the lesson's conditions.
- It generates personalized in-app instructions (e.g., "Use the Bills section to set up a recurring $300 rent payment").

---

## 🧠 Core System Responsibilities

The engine is activated by **a single function call** from the frontend after any financial action. This function performs:

1. **Action Type Identification**

   - Recognizes student behaviors (e.g., deposit, bill creation, transfer).

2. **Active Lesson Tracking**

   - Determines which lesson is in progress.

3. **Condition Evaluation**

   - Matches actions against conditions from teacher-created lessons.

4. **Instruction & Challenge Generation**

   - Uses instruction templates mapped to lesson conditions.
   - Adapts dynamically based on goal and context.

5. **Completion Validation**

   - Checks whether all required conditions have been met.
   - Locks lesson if complete and unlocks the next one.

6. **Grading & Reporting**
   - Uses grading rules (see below).
   - Updates DB with:
     - Grade
     - Lesson status
     - Student health
   - Notifies teacher dashboard.

---

## 🧱 Architecture Principles

- **Simple**: Keep the lesson engine modular and maintainable.
- **Dynamic**: Avoid hard-coded logic; work off data schemas.
- **Non-Invasive**: No changes to HTML, CSS, or unrelated systems.
- **Template-Driven**: Reuse smart condition → action templates.
- **Passive Checkpoints**: Some conditions are evaluated at login, action events, or every 5–10 minutes.

---

## 📊 Grading & Lesson Completion

- **100%** = All conditions met + no mistakes
- Use Texas public high school grading equivalency for partial completion
- Grading logic is modular and triggered _only when lesson is complete_

---

## 📦 Recommended Functional Breakdown

```ts
// Pseudocode (not actual implementation)
function onAppAction(actionType, payload) {
  const lesson = getCurrentLessonForStudent();
  const conditions = lesson.conditions;

  matchConditions(actionType, payload, conditions);
  updateStudentState(payload);
  if (allConditionsMet(lesson)) {
    gradeLesson(lesson);
    lockLesson();
    unlockNextLesson();
    syncWithTeacherDashboard();
  }
}
```

---

## 🧪 Example Use Case

> **Condition**: If student creates a bill  
> **Action/Challenge**: Save $500 into savings

### What happens:

1. Student creates a bill
2. Engine detects `bill_created` condition
3. Engine issues `challenge_save_amount`
4. Student saves $500
5. Lesson is marked complete
6. Score submitted, dashboard updated

---

## 📌 Developer Requests

1. Keep logic minimal & clean
2. Ensure perfect compatibility with lesson builder schema
3. Avoid hard-coded examples
4. Use reusable instruction/action templates
5. Reference all condition/action types from `LESSON_BUILDER_ENHANCEMENTS.md`
6. Promote action-based grading (not reading/memorizing)
7. Don't modify existing HTML/styling
8. Don't alter unrelated systems
9. Do **not restart servers** — use `curl` or live reload where possible
10. Stop processing and report clearly if a structural system change is required

---

## 🧱 Related Docs

- [Lesson Builder Enhancements](./LESSON_BUILDER_ENHANCEMENTS.md)

# Trinity Capital Lesson Engine - Architecture Plan

This document provides a high-level yet actionable plan for building the Trinity Capital Lesson Engine. It is intended to guide GitHub Copilot and developers by outlining system behavior, expected data flows, and integration rules.

_Last Updated: 2025-08-08_

---

## 🔄 New Requirements

### 🔧 1. Update Lesson Builder Schema Integration

Update the Teacher Dashboard lesson builder to use the **new JSON schema** now implemented in premade lessons. This ensures consistency across lessons and allows both premade and teacher-generated content to follow the same structure.

### 📦 2. New JSON Schema

```json
{
  "_id": 1754331337919,
  "lesson": {
    "lesson_title": "Money Personality",
    "lesson_description": "Differentiate between needs and wants; investigate money personality",
    "unit": "Unit 1: Earning and Spending"
  },
  "content": [
    { "type": "header", "content": "Money Personality" },
    {
      "type": "text",
      "content": "Differentiate between needs and wants; investigate money personality"
    },
    { "type": "header", "content": "Learning Standards (TEKS)" },
    {
      "type": "text",
      "content": "This lesson addresses Texas Essential Knowledge and Skills: 1(A), 1(B)"
    },
    { "type": "header", "content": "Understanding Your Money Personality" },
    {
      "type": "text",
      "content": "Are you a spender or a saver? Understanding your money personality hel…"
    },
    { "type": "header", "content": "Needs vs Wants" },
    {
      "type": "text",
      "content": "NEEDS are things you must have to survive (housing, food, basic clothi…"
    },
    { "type": "header", "content": "Analyzing Your Spending" },
    {
      "type": "text",
      "content": "Look at your recent transactions and categorize them as needs or wants…"
    },
    { "type": "header", "content": "Practice Time!" },
    {
      "type": "text",
      "content": "Now use the Trinity Capital app to practice what you've learned. Compl…"
    }
  ],
  "lesson_conditions": [
    {
      "condition_type": "lesson_content_viewed",
      "condition_value": {
        "slidesViewed": 6,
        "totalSlides": 8
      },
      "action_type": "unlock_spending_analysis",
      "action_details": {
        "message": "Great! Now analyze your spending patterns using the app",
        "highlight_element": ".bankingTools",
        "priority": "high",
        "auto_trigger": true,
        "feedback_enabled": true,
        "difficulty_adjusted": true
      }
    },
    {
      "condition_type": "account_checked",
      "condition_value": {
        "accountType": "checking",
        "transactions_reviewed": true
      },
      "action_type": "personality_insight",
      "action_details": {
        "message": "Based on your account activity, identify whether you're a spender or s…",
        "unlock_next_step": "needs_vs_wants_exercise",
        "priority": "medium",
        "auto_trigger": true,
        "feedback_enabled": true,
        "difficulty_adjusted": true
      }
    },
    {
      "condition_type": "spending_analyzed",
      "condition_value": {
        "categories_identified": 3
      },
      "action_type": "complete_lesson",
      "action_details": {
        "score_bonus": 15,
        "message": "Excellent understanding of spending patterns!",
        "priority": "critical",
        "auto_trigger": true,
        "feedback_enabled": true,
        "difficulty_adjusted": true
      }
    }
  ],
  "required_actions": [
    "account_checked",
    "spending_analyzed",
    "lesson_content_viewed"
  ],
  "learning_objectives": [
    "Demonstrate understanding of lesson concepts through content review",
    "Analyze account information to understand financial position"
  ],
  "success_metrics": {
    "minimum_content_viewed": 0.75,
    "minimum_app_usage_score": 60,
    "required_actions_completed": 3,
    "time_limit_minutes": 45
  },
  "creator_email": "admin@trinity-capital.net",
  "creator_username": "adminTC",
  "teacher": "admin@trinity-capital.net",
  "createdAt": "2025-08-04T18:15:37.919+00:00",
  "dallas_fed_aligned": true,
  "teks_standards": ["1(A)", "1(B)"],
  "day": 1,
  "status": "active",
  "difficulty_level": "beginner",
  "estimated_duration": 59
}
```

### ✅ 3. Schema Usage Instructions

- When teachers create or edit a lesson, the lesson data must be saved using this structure.
- When teachers view or manage lessons, their dashboard should **search for all units/lessons under this schema**.

---

_The remainder of this document provides architectural guidance for the engine itself. Scroll down to "Dependencies" and "Student Flow" for system behavior._

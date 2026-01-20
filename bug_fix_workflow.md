# Trinity Capital - Bug Fix Priority Workflow

**Generated:** January 19, 2026  
**Status:** Pre-Demo Bug Fixes

---

## TIER 1: DEMO BLOCKERS 🚨

**Must fix before ANY customer outreach. Cannot demo without these.**

### 1. Chat Filter Implementation (CRITICAL) ✅ COMPLETED

**Apps Affected:** Student App, Teacher Dashboard  
**Issue:** Profanity/explicit content filter not implemented  
**Status:** IMPLEMENTED - Using Purgomalum API for profanity filtering

**Implementation:**

- Integrated Purgomalum API into message sending function
- Filters messages before they're sent to server
- Applied to both student and teacher messaging systems
- Shows user-friendly error message when profanity detected

**Completion Date:** January 20, 2026

---

### 2. Student Registration Code Generation (CRITICAL)

**App Affected:** Teacher Dashboard - Register Students  
**Issue:** Generated codes show `US-NMHS-00000000-01` instead of `US-NMHS-B9CE9894-01`  
**Root Cause:** Teacher code not being inserted into generated string

**Steps to Fix:**

1. Locate code generation function in teacher dashboard
2. Verify teacher code is being pulled from logged-in teacher's account
3. Check variable naming (teacherCode vs teacher.code)
4. Test with actual teacher account
5. Verify student can register with corrected code

**Estimated Time:** 1-2 hours

---

### 3. Teacher Messaging System (CRITICAL)

**App Affected:** Teacher Dashboard - Messages  
**Issues:**

- Messages do not send
- Missing message history
- Overlapping threads

**Fix Priority:**

1. Fix message sending (highest priority)
2. Fix thread display/history
3. Fix thread overlap issue

**Estimated Time:** 3-5 hours (depending on root cause)

---

### 4. Student Messaging Issues (CRITICAL)

**App Affected:** Student App - Messages  
**Issues:**

- New conversation only shows teacher, not classmates
- Can't add teacher thread (shows "failed to create thread" error)

**Root Cause (Likely):** Database query filtering incorrectly or not pulling correct user list

**Steps to Fix:**

1. Check query that populates classmate list
2. Verify it's filtering by correct class/period
3. Fix teacher thread creation error
4. Test message flow: student → classmate, student → teacher

**Estimated Time:** 2-3 hours

---

## TIER 2: PILOT BLOCKERS ⚠️

**Can demo without these, but must fix before pilot starts.**

### 5. Class Financial Health Calculations (HIGH PRIORITY)

**App Affected:** Teacher Dashboard  
**Issue:** Math and algorithm producing incorrect reporting and calculations  
**Why Important:** This is your main teacher value proposition

**Fix Approach:**

1. Review health calculation algorithm
2. Test with known student data
3. Verify each metric calculates correctly:
   - Account balances
   - Spending/income ratio
   - Emergency fund coverage
   - Bill payment success
4. Test with multiple students
5. Verify percentages and distributions display correctly

**Estimated Time:** 4-6 hours

---

### 6. Lesson System Issues (MEDIUM PRIORITY)

**App Affected:** Teacher Dashboard - Create Lesson  
**Issues:**

- Edit existing lesson dropdown only shows legacy admin lessons until reopened
- Unable to fetch admin lessons (works for custom lessons)
- Assign to class button throws server error
- Save lesson button: lesson saves but doesn't appear in list

**Fix Priority:**

1. Fix "assign to class" server error (blocks lesson deployment)
2. Fix saved lessons not appearing (usability issue)
3. Fix edit dropdown refresh issue
4. Fix admin lesson fetching

**Estimated Time:** 3-5 hours total

---

### 7. Send Class Message Issues (MEDIUM PRIORITY)

**App Affected:** Teacher Dashboard  
**Issue:** Message sends but thread doesn't show messages. Mismatched threads.

**Fix Approach:**

1. Verify message is saving to database correctly
2. Check thread ID assignment
3. Fix thread display logic
4. Test with multiple students

**Estimated Time:** 2-3 hours

---

## TIER 3: IMPORTANT (Fix During Pilot) 📋

**Annoying but workable. Fix these based on pilot feedback.**

### 8. Bills Block Scrolling

**App Affected:** Student App  
**Issue:** No scrolling in bills display  
**Impact:** Students with many bills can't see all of them

**Estimated Time:** 30 minutes - 1 hour

---

### 9. Send Money - User in Recipient List

**App Affected:** Student App  
**Issue:** User appears in their own recipient list (can't send to self)

**Fix:** Filter out current user from recipient query

**Estimated Time:** 30 minutes

---

### 10. Email Validation

**App Affected:** Teacher Dashboard - Register Students  
**Issue:** Doesn't check for valid email format

**Fix:** Add email regex validation

**Estimated Time:** 30 minutes

---

### 11. Export Health Report Options

**App Affected:** Teacher Dashboard  
**Issue:** Only exports JSON, need CSV and Excel options

**Estimated Time:** 2-3 hours

---

### 12. PTOF Dropdown Timer Issue

**App Affected:** Student App - Deposits  
**Issue:** Login timer exists for deposit options

**Estimated Time:** 1-2 hours

---

### 13. Feedback System

**App Affected:** Teacher Dashboard  
**Issues:**

- General feedback fails to send email or save to MongoDB
- Bug report fails to send email

**Fix:** Debug email sending and database save operations

**Estimated Time:** 1-2 hours

---

## TIER 4: MINOR/POLISH 🎨

**Low priority. Fix if time permits or based on user feedback.**

### 14. YouTube Shorts iFrame Issue

**App Affected:** Teacher Dashboard - Create Lesson  
**Issue:** YT shorts don't populate in iFrame

**Estimated Time:** 1-2 hours

---

### 15. Condition Value Field

**App Affected:** Teacher Dashboard - Create Lesson  
**Issue:** No code to remove value field from non-number conditions

**Estimated Time:** 1 hour

---

### 16. Deposits Balance Check

**App Affected:** Student App  
**Issue:** Deposits don't check account balance (may be intentional)

**Decision Needed:** Is this a bug or feature?

**Estimated Time:** 30 minutes if needed

---

### 17. Health Message Template

**App Affected:** Teacher Dashboard  
**Issue:** Send class health message needs pre-built template (currently custom)

**Estimated Time:** 1-2 hours

---

## CANNOT TEST / MONITOR IN PILOT 🔍

### Catch-Up System

**App Affected:** Student App - Bills and Paychecks  
**Status:** Needs specialized testing (time manipulation or real downtime)  
**Action:** Monitor during pilot. Set up alerts for bill firing failures.

---

## SUMMARY

### Critical Path to Demo-Ready

**Must complete before customer outreach:**

1. Chat filter implementation (4-6 hours)
2. Registration code generation (1-2 hours)
3. Teacher messaging system (3-5 hours)
4. Student messaging fixes (2-3 hours)

**Total Tier 1:** 10-16 hours

### Critical Path to Pilot-Ready

**Must complete before pilot starts:** 5. Class financial health (4-6 hours) 6. Lesson system issues (3-5 hours) 7. Send class message (2-3 hours)

**Total Tier 2:** 9-14 hours

### Grand Total to Pilot-Ready

**19-30 hours of focused debugging**

---

## RECOMMENDED SCHEDULE

### Week 1 (Jan 20-24)

**Monday:**

- Morning: Fix comptroller issue (MUST DO FIRST)
- Afternoon: Start chat filter implementation

**Tuesday-Wednesday:**

- Finish chat filter
- Fix registration code generation
- Fix teacher messaging system

**Thursday-Friday:**

- Fix student messaging issues
- Test all Tier 1 fixes
- Demo rehearsal

### Week 2 (Jan 27-31)

**Monday-Tuesday:**

- Fix class financial health calculations
- Fix lesson system issues

**Wednesday:**

- Fix send class message
- Test all Tier 2 fixes

**Thursday-Friday:**

- Fix Tier 3 bugs if time permits
- Final integration testing
- Prepare for outreach

### Week 3 (Feb 3+)

- Contact Mesquite CTE director
- Demo and pilot discussions

---

## NOTES

**What's Working Well:**

- ~90% of student app features work correctly
- Core financial simulation (bills, paychecks, transfers) works
- OAuth authentication works
- Registration portal works (when given correct codes)
- Lesson creation UI works
- Teacher dashboard loads correctly

**Areas of Concern:**

- Messaging systems need significant work (both apps)
- Chat filter is completely missing (non-negotiable for schools)
- Several features save data but don't display results correctly

**Testing Gaps:**

- Catch-up system needs real-world observation
- Lesson grading needs student completion data
- Some complex features can't be fully tested until pilot

**Recommendation:**
Focus exclusively on Tier 1 bugs this week. Without those fixed, you cannot demo. Everything else can be refined during or after pilot based on real teacher/student feedback.

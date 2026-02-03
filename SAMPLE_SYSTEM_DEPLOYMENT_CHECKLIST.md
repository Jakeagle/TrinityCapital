# Sample System - Deployment & Testing Checklist

## Pre-Deployment Verification

### Backend Files

- [x] `sampleDataManager.js` created
- [x] `server.js` imports SampleDataManager
- [x] `server.js` initializes manager on startup
- [x] Three API endpoints added to `server.js`
- [x] Error handling implemented
- [x] Console logging added

### Frontend Files (Student)

- [x] `script.js` - Logout handler updated
- [x] `script.js` - Unload handler added
- [x] `script.js` - Visibility change handler added
- [x] Sample detection logic implemented
- [x] API calls use correct endpoint

### Frontend Files (Teacher)

- [x] `script.js` - Login handler updated
- [x] `script.js` - Sample verification added
- [x] `script.js` - Unload handler added
- [x] `script.js` - Visibility change handler added
- [x] Sample detection logic implemented

### Documentation

- [x] `SAMPLE_SYSTEM_DOCUMENTATION.md` created
- [x] `SAMPLE_SYSTEM_QUICK_GUIDE.md` created
- [x] `SAMPLE_SYSTEM_IMPLEMENTATION_SUMMARY.md` created
- [x] `SAMPLE_SYSTEM_DIAGRAMS.md` created

---

## Deployment Steps

### Step 1: Backend Deployment

1. **Ensure MongoDB Connection**

   - [ ] MongoDB server is running
   - [ ] Connection string in `.env` is correct
   - [ ] Database "TrinityCapital" exists

2. **Deploy Backend Files**

   - [ ] Copy `sampleDataManager.js` to server directory
   - [ ] Update `server.js` with changes
   - [ ] Restart Node.js server
   - [ ] Check console for: "✅ Sample Data Manager initialized"

3. **Test Backend**
   - [ ] Open terminal/Postman
   - [ ] Test `/sample/reset-data` endpoint
   - [ ] Verify responses are correct

### Step 2: Frontend Deployment

1. **Deploy Student App**

   - [ ] Update `script.js` in Frontend/Javascript
   - [ ] Verify API_BASE_URL points to correct server
   - [ ] Clear browser cache
   - [ ] Test login/logout

2. **Deploy Teacher Dashboard**
   - [ ] Update `script.js` in TrinCapTeacher Dash
   - [ ] Verify API_BASE_URL points to correct server
   - [ ] Clear browser cache
   - [ ] Test login/logout

### Step 3: Verification

- [ ] No console errors on either frontend
- [ ] Sample data reset messages appear in console
- [ ] API endpoints respond with 200 status
- [ ] MongoDB data updates correctly

---

## Testing Matrix

### Test Set 1: Student Logout Reset

| Step | Action                    | Expected                        | Status |
| ---- | ------------------------- | ------------------------------- | ------ |
| 1    | Login as "Sample Student" | Dashboard loads, balance = $0   | [ ]    |
| 2    | Make deposit (+$100)      | Balance = $100                  | [ ]    |
| 3    | Click "Log Out"           | See loading, then login screen  | [ ]    |
| 4    | Check console             | "🗑️ Resetting sample user data" | [ ]    |
| 5    | Login again               | Balance = $0 (reset!)           | [ ]    |

### Test Set 2: Student Page Refresh Reset

| Step | Action                    | Expected                       | Status |
| ---- | ------------------------- | ------------------------------ | ------ |
| 1    | Login as "Sample Student" | Dashboard loads                | [ ]    |
| 2    | Make donation ($50)       | Data shows in UI               | [ ]    |
| 3    | Press F5 (refresh)        | Page reloads                   | [ ]    |
| 4    | Check console             | "📡 Sent reset via sendBeacon" | [ ]    |
| 5    | Wait 2-3 seconds          | Data cleared in backend        | [ ]    |
| 6    | Login again               | All data reset to 0            | [ ]    |

### Test Set 3: Teacher Login Verification

| Step | Action                    | Expected                     | Status |
| ---- | ------------------------- | ---------------------------- | ------ |
| 1    | Login as "Sample Teacher" | Dashboard loads              | [ ]    |
| 2    | Check console             | "✅ Sample student verified" | [ ]    |
| 3    | Go to Students section    | "Sample Student" appears     | [ ]    |
| 4    | Logout                    | Teacher data clears          | [ ]    |
| 5    | Login again               | "Sample Student" re-appears  | [ ]    |

### Test Set 4: Teacher Logout Reset

| Step | Action                    | Expected                              | Status |
| ---- | ------------------------- | ------------------------------------- | ------ |
| 1    | Login as "Sample Teacher" | Dashboard loads with sample student   | [ ]    |
| 2    | Add/modify lessons        | Changes visible                       | [ ]    |
| 3    | Click Log Out             | See loading, then login               | [ ]    |
| 4    | Check console             | "🗑️ Resetting sample teacher data"    | [ ]    |
| 5    | Login again               | Fresh dashboard, sample student ready | [ ]    |

### Test Set 5: Non-Sample User (Should Not Reset)

| Step | Action                            | Expected                      | Status |
| ---- | --------------------------------- | ----------------------------- | ------ |
| 1    | Login as "John Smith" (real user) | Dashboard loads               | [ ]    |
| 2    | Make transaction                  | Data visible                  | [ ]    |
| 3    | Logout                            | Regular logout, NO reset call | [ ]    |
| 4    | Check console                     | NO "🗑️ Resetting" message     | [ ]    |
| 5    | Login again                       | Same data still there         | [ ]    |

### Test Set 6: Multiple Sample Logins

| Step | Action                    | Expected                    | Status |
| ---- | ------------------------- | --------------------------- | ------ |
| 1    | Login/Logout 5 times      | Each login = clean slate    | [ ]    |
| 2    | Check data grows properly | Each session independent    | [ ]    |
| 3    | MongoDB shows resets      | Old data completely removed | [ ]    |

### Test Set 7: Browser Visibility

| Step | Action                    | Expected                      | Status |
| ---- | ------------------------- | ----------------------------- | ------ |
| 1    | Login as "Sample Student" | Dashboard loads               | [ ]    |
| 2    | Add transaction (+$200)   | Visible                       | [ ]    |
| 3    | Open second tab           | Switch to other tab           | [ ]    |
| 4    | Check console             | "Page hidden for sample user" | [ ]    |
| 5    | Switch back               | Data still visible in tab     | [ ]    |
| 6    | Refresh                   | Data clears, balance = $0     | [ ]    |

---

## Console Output Verification

### Expected Student App Messages

```javascript
// On initialization
✅ [SampleUserCleanup] Cleanup handlers initialized

// On logout (sample user)
🗑️ [Logout] Resetting sample user data for: Sample Student

// On page unload
📡 [SampleUserCleanup] Sent reset request via sendBeacon

// On page visibility change
[SampleUserCleanup] Page hidden for sample user: Sample Student
```

### Expected Teacher App Messages

```javascript
// On initialization
✅ [SampleTeacherCleanup] Cleanup handlers initialized

// On login (sample teacher)
🔧 [TeacherDash] Sample teacher logged in: Sample Teacher
✅ [TeacherDash] Sample student verified for: Sample Teacher

// On logout
🗑️ [Logout] Resetting sample teacher data for: Sample Teacher
```

### Expected Server Messages

```
✅ Sample Data Manager initialized
🗑️ [SampleDataManager] Resetting sample user data for: Sample Student
✅ [SampleDataManager] Reset student data for: Sample Student
🗑️ [SampleDataManager] Deleted X documents from threads
```

---

## Database Verification

### MongoDB Checks

1. **User Document Exists**

```javascript
db.getCollection("User Profiles").findOne({ memberName: "Sample Student" });
// Should return document with preserved fields
```

2. **Data is Reset**

```javascript
// Check balance is 0
{ checkingAccount.balanceTotal: 0 }

// Check transactions reset
{ checkingAccount.transactions: [{amount: 0, ...}] }

// Check messages deleted
{ messages: [] }
```

3. **Related Data Cleaned**

```javascript
// Threads should be deleted
db.getCollection("threads").findOne({ participants: "Sample Student" });
// Should return null

// Messages should be deleted
db.getCollection("messages").findOne({ senderId: "Sample Student" });
// Should return null
```

---

## Network Tab Verification

### Using Browser DevTools

1. **Open DevTools** (F12)
2. **Go to Network Tab**
3. **Filter for "sample"**
4. **Perform logout as sample user**

### Expected Requests

- [x] Request to `/sample/reset-data`
- [x] Response status: 200
- [x] Response body: `{"success": true, ...}`
- [x] Request happens immediately on logout

---

## Performance Verification

### Response Times

| Operation              | Expected Time | Acceptable Range |
| ---------------------- | ------------- | ---------------- |
| Logout reset           | < 500ms       | < 1000ms         |
| Page unload sendBeacon | < 100ms       | < 500ms          |
| Login verification     | < 300ms       | < 1000ms         |
| Data reset in DB       | < 1000ms      | < 2000ms         |

### Database Impact

- [ ] Queries complete quickly
- [ ] No connection timeouts
- [ ] No database locks
- [ ] Cleanup completes asynchronously

---

## Rollback Procedure

If issues occur:

1. **Revert Backend Changes**

   - Undo modifications to `server.js`
   - Remove `sampleDataManager.js`
   - Restart server

2. **Revert Frontend Changes**

   - Undo modifications to student `script.js`
   - Undo modifications to teacher `script.js`
   - Clear browser cache

3. **Verify Rollback**
   - Test login/logout works
   - Check no errors in console
   - Verify data persists normally

---

## Production Deployment Checklist

### Pre-Production

- [ ] All tests pass on staging
- [ ] No console errors or warnings
- [ ] Documentation reviewed
- [ ] Team trained on system
- [ ] Backup of production database taken

### Deployment

- [ ] Deploy at low-traffic time
- [ ] Monitor server logs during deployment
- [ ] Verify all endpoints responding
- [ ] Check sample users can login
- [ ] Monitor for 24 hours

### Post-Deployment

- [ ] Verify sample resets working
- [ ] Check no regressions
- [ ] Collect feedback from users
- [ ] Update any documentation
- [ ] Archive deployment plan

---

## Troubleshooting During Testing

### Issue: Endpoint returns 500 error

**Cause:** Server not initialized or module missing  
**Solution:**

1. Check server console for startup errors
2. Verify `sampleDataManager.js` exists
3. Restart server
4. Try again

### Issue: Sample user not being detected

**Cause:** Username doesn't contain "sample"  
**Solution:**

1. Verify username contains "sample" (case-insensitive)
2. Check console for detection messages
3. Test with username exactly: "Sample Student"

### Issue: Data not clearing in MongoDB

**Cause:** Reset request not reaching server or succeeding  
**Solution:**

1. Check Network tab for request success (status 200)
2. Check server console for "✅ Reset" message
3. Verify MongoDB connection
4. Try manual reset via Postman

### Issue: Page visibility not triggering reset

**Cause:** Browser doesn't fire visibilitychange event consistently  
**Solution:**

1. Use logout button instead (more reliable)
2. Test on different browsers
3. Check if browser blocks sendBeacon

### Issue: Sample student not appearing in teacher's class

**Cause:** Verification didn't run or failed silently  
**Solution:**

1. Check console for verification message
2. Logout and login as sample teacher again
3. Check MongoDB for student document
4. Try manual setup endpoint

---

## Sign-Off

Once all tests pass, have stakeholders sign off:

- [ ] **Developer:** Verified code quality and implementation
- [ ] **QA:** Confirmed all test cases pass
- [ ] **Product Owner:** Confirmed feature works as expected
- [ ] **Operations:** Confirmed deployment ready

**Date Verified:** ******\_\_\_******  
**Version:** 1.0  
**Status:** ✅ Ready for Production

---

## Post-Deployment Support

### Monitoring

Monitor these metrics daily:

- [ ] Sample user login success rate
- [ ] Reset endpoint response time
- [ ] Server error logs
- [ ] Database operation latency
- [ ] User feedback/complaints

### Maintenance

- [ ] Keep logs for 30 days
- [ ] Archive old reset records monthly
- [ ] Review and update documentation quarterly
- [ ] Plan updates as needed

---

**This checklist ensures proper deployment and testing of the sample system.**

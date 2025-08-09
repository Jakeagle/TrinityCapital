# Trinity Capital Test Suite

This folder contains test files for the Trinity Capital application.

## Test Files

### Core System Tests

- `test-lesson-system.js` - Comprehensive lesson system testing
- `systemIntegrationTest.js` - Full system integration tests

### Component Tests

- `catchupSystemTest.js` - Catch-up system functionality tests
- `comprehensiveSchedulerTest.js` - Scheduler system tests
- `directCatchupTest.js` - Direct catch-up mechanism tests
- `missedExecutionTest.js` - Missed execution handling tests
- `offlineSchedulerTest.js` - Offline scheduler functionality tests

### Communication Tests

- `test-oauth2-email.js` - OAuth2 email system testing (for teacher notifications)

## Running Tests

Most test files can be run with Node.js:

```bash
node Tests/test-filename.js
```

For OAuth email testing, ensure your `.env` file has the proper configuration:

```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
```

## Test Data

Tests use the production MongoDB database for realistic testing scenarios. Ensure your database connection is properly configured in the main server.js file.

## Generated on: ${new Date().toLocaleDateString()}

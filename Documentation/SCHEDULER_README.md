# Persistent Scheduler System for Bills and Payments

## Overview

The persistent scheduler system ensures that recurring bills and payments continue to execute correctly even when the server restarts. This system replaces the previous cron-based scheduling that would lose its state on server restarts.

## Key Features

- **Persistent Scheduling**: Bills and payments are stored in the database with their next execution dates
- **Server Restart Recovery**: On server startup, all scheduled transactions are automatically reloaded
- **Accurate Date Calculations**: Uses proper date math instead of fixed cron patterns
- **Better Error Handling**: Comprehensive error handling and validation
- **Status Monitoring**: Real-time status display and monitoring endpoints

## Architecture

### Components

1. **SchedulerManager** (`schedulerManager.js`): Core scheduling logic with database persistence
2. **Enhanced Frontend** (`billsAndPayments.js`): Improved UI with validation and notifications
3. **Status Display** (`schedulerStatus.js`): Real-time scheduler status monitoring
4. **Migration Tool** (`migrationScheduler.js`): Converts existing data to new format
5. **Test Suite** (`testScheduler.js`): Verification and testing tools

### Database Changes

The system adds new fields to bills and payments:

- `_id`: Unique identifier for each scheduled transaction
- `Date`: Creation/last execution date
- `nextExecution`: Calculated next execution date

## How It Works

### 1. Date Calculation Logic

The system calculates next execution dates based on the original creation date and interval:

- **Weekly**: Same day of week as creation
- **Bi-weekly**: Every 14 days from creation date
- **Monthly**: Same day of each month
- **Yearly**: Same date each year

### 2. Persistent Storage

Each bill/payment stores:

```javascript
{
  _id: ObjectId,
  amount: Number,
  interval: String,
  Name: String,
  Category: String,
  Date: ISO String,
  nextExecution: ISO String
}
```

### 3. Server Startup Recovery

On server start:

1. Load all bills/payments from database
2. Calculate next execution dates if missing
3. Schedule cron jobs for future executions
4. Skip past-due executions (could be enhanced to catch up)

## Usage

### Installation

1. **No additional dependencies needed** - uses existing MongoDB and node-cron
2. **Run migration** (one-time):
   ```bash
   npm run migrate-scheduler
   ```

### Testing

```bash
# Test the scheduler endpoints
npm run test-scheduler

# Check server logs for scheduler initialization
```

### Monitoring

The system provides several monitoring tools:

1. **Status Endpoint**: `GET /scheduler/status`
2. **User Transactions**: `GET /scheduler/user/:memberName`
3. **Frontend Status Display**: Automatic on pages with bills/payments

### API Endpoints

#### Get Scheduler Status

```
GET /scheduler/status
```

Returns: `{ totalScheduledJobs: number, jobs: array }`

#### Get User's Scheduled Transactions

```
GET /scheduler/user/:memberName
```

Returns: `{ memberName, bills: array, payments: array }`

#### Remove Scheduled Transaction

```
POST /scheduler/remove
Body: { memberName, transactionId, type }
```

#### Process Existing Bills/Payments (Testing)

```
POST /processExistingBillsPayments
Body: { memberName }
```

## Frontend Improvements

### Enhanced billsAndPayments.js

- ✅ Input validation before submission
- ✅ Success/error notifications
- ✅ Form clearing after successful submission
- ✅ Better error handling and user feedback
- ✅ Real-time scheduler status updates

### Status Display Component

- Real-time job count display
- Click to toggle detailed view
- Automatic updates every 30 seconds
- Visual indicators for status (green/orange/red)

## Migration Guide

### Before Migration

1. **Backup your database**
2. **Stop the server** to prevent conflicts
3. **Run the migration script**:
   ```bash
   npm run migrate-scheduler
   ```

### Migration Process

The migration script:

1. Adds `_id` to all existing bills/payments
2. Adds `Date` field if missing
3. Calculates and adds `nextExecution` dates
4. Verifies the migration completed successfully

### After Migration

1. **Start the server** - scheduler will initialize automatically
2. **Check logs** for scheduler initialization messages
3. **Test the system** with the test script
4. **Monitor status** using the frontend display

## Troubleshooting

### Common Issues

1. **Scheduler not initializing**

   - Check MongoDB connection
   - Verify migration completed successfully
   - Check server logs for errors

2. **Jobs not executing**

   - Verify system timezone settings
   - Check if dates are in the future
   - Review cron job creation logs

3. **Status display not working**
   - Ensure frontend files are loaded
   - Check for JavaScript errors in browser console
   - Verify API endpoints are accessible

### Debugging

Enable detailed logging by checking server console output:

- Scheduler initialization logs
- Job scheduling confirmations
- Transaction processing logs
- Error messages with stack traces

### Recovery Options

If the scheduler gets into a bad state:

1. **Restart the server** - will reinitialize from database
2. **Run migration again** - safe to run multiple times
3. **Clear and recreate** problematic transactions
4. **Use the test script** to verify functionality

## Performance Considerations

- **Memory Usage**: Each scheduled job uses minimal memory
- **Database Impact**: One query per user on startup, minimal ongoing queries
- **CPU Impact**: Cron jobs are lightweight, execute quickly
- **Scalability**: Designed to handle hundreds of users with thousands of scheduled transactions

## Future Enhancements

### Potential Improvements

1. **Catch-up Processing**: Execute missed transactions for offline periods
2. **Time Zone Support**: Per-user timezone settings
3. **Advanced Scheduling**: Custom date patterns, holidays, business days
4. **Batch Processing**: Group multiple transactions for efficiency
5. **Analytics**: Historical execution data and reporting
6. **Notification System**: Alerts for failed executions

### Extension Points

The system is designed to be extensible:

- Add new interval types in `calculateNextExecutionDate()`
- Implement custom scheduling logic in `scheduleTransaction()`
- Add monitoring hooks in `processTransaction()`
- Extend status reporting in `getSchedulerStatus()`

## Best Practices

1. **Always test** changes with the test script
2. **Monitor status** regularly using the display component
3. **Backup data** before making changes
4. **Run migration** after system updates
5. **Check logs** for any error messages
6. **Validate inputs** on both frontend and backend

## Support

For issues or questions:

1. Check server logs for error messages
2. Run the test script to verify functionality
3. Use the status endpoints to check system state
4. Review this documentation for configuration options

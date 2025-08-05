/**
 * Test Script to Demonstrate Server Offline Behavior
 * This test shows what happens when the server is offline during scheduled execution times
 */

const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
const TEST_USER = 'OfflineTestUser';

class OfflineSchedulerTester {
  constructor() {
    this.client = null;
  }

  async initialize() {
    this.client = new MongoClient(
      process.env.MONGODB_URI || 'mongodb://localhost:27017',
    );
    await this.client.connect();
    console.log('📊 Connected to MongoDB for offline testing');
    await this.ensureTestUser();
  }

  async ensureTestUser() {
    const db = this.client.db('TrinityCapital');
    const collection = db.collection('User Profiles');

    const existingUser = await collection.findOne({
      'checkingAccount.accountHolder': TEST_USER,
    });

    if (!existingUser) {
      console.log(`👤 Creating test user: ${TEST_USER}`);
      await collection.insertOne({
        checkingAccount: {
          accountHolder: TEST_USER,
          balance: 1000,
          bills: [],
          payments: [],
          checkingHistory: [],
          transactions: [],
        },
      });
    } else {
      console.log(`👤 Test user already exists: ${TEST_USER}`);
    }
  }

  async testOfflineBehavior() {
    console.log('🧪 Testing Offline Server Behavior...\n');
    console.log('='.repeat(60));

    try {
      await this.initialize();

      // Step 1: Add a bill that should execute in the past (simulating missed execution)
      console.log('📝 Step 1: Creating a bill with past execution time...');

      // Create a date 2 days ago to simulate a missed execution
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);

      const billData = {
        amount: -50,
        interval: 'weekly',
        Name: 'Test Offline Bill',
        Category: 'Test Category',
        Date: pastDate.toISOString(),
      };

      // Manually insert into database to simulate a bill that was created before server went offline
      const db = this.client.db('TrinityCapital');
      const collection = db.collection('User Profiles');

      await collection.updateOne(
        { 'checkingAccount.accountHolder': TEST_USER },
        {
          $push: {
            'checkingAccount.bills': {
              ...billData,
              _id: new (require('mongodb').ObjectId)(),
              nextExecution: new Date(
                pastDate.getTime() + 7 * 24 * 60 * 60 * 1000,
              ).toISOString(), // 7 days from creation
            },
          },
        },
      );

      console.log(
        `  ✅ Created bill with execution time: ${new Date(pastDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleString()}`,
      );
      console.log(
        `  📅 That execution time was: ${new Date(pastDate.getTime() + 7 * 24 * 60 * 60 * 1000) < new Date() ? 'IN THE PAST' : 'IN THE FUTURE'}`,
      );

      // Step 2: Check current transaction count
      const beforeProfile = await collection.findOne({
        'checkingAccount.accountHolder': TEST_USER,
      });

      const beforeTransactionCount =
        beforeProfile.checkingAccount.transactions?.length || 0;
      console.log(`\n📊 Current transaction count: ${beforeTransactionCount}`);

      // Step 3: Check scheduler status
      try {
        const response = await fetch(`${BASE_URL}/scheduler/status`);
        const data = await response.json();
        console.log(`📊 Current scheduled jobs: ${data.totalScheduledJobs}`);
      } catch (error) {
        console.log(
          '❌ Server appears to be offline - cannot check scheduler status',
        );
      }

      // Step 4: Wait and check if missed transactions are processed
      console.log(
        '\n⏳ Waiting 10 seconds to see if missed transactions are processed...',
      );
      await this.sleep(10000);

      const afterProfile = await collection.findOne({
        'checkingAccount.accountHolder': TEST_USER,
      });

      const afterTransactionCount =
        afterProfile.checkingAccount.transactions?.length || 0;
      console.log(
        `📊 Transaction count after waiting: ${afterTransactionCount}`,
      );

      if (afterTransactionCount > beforeTransactionCount) {
        console.log(
          '✅ Missed transaction was processed (catch-up mechanism working)',
        );
      } else {
        console.log(
          '❌ Missed transaction was NOT processed (no catch-up mechanism)',
        );
      }

      // Step 5: Show what's in the database
      console.log('\n💾 Database content:');
      console.log(
        'Bills:',
        JSON.stringify(afterProfile.checkingAccount.bills, null, 2),
      );
      console.log(
        'Transactions:',
        JSON.stringify(afterProfile.checkingAccount.transactions, null, 2),
      );

      await this.cleanup();
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');

    try {
      const db = this.client.db('TrinityCapital');
      const collection = db.collection('User Profiles');

      await collection.updateOne(
        { 'checkingAccount.accountHolder': TEST_USER },
        {
          $set: {
            'checkingAccount.bills': [],
            'checkingAccount.payments': [],
            'checkingAccount.transactions': [],
          },
        },
      );

      if (this.client) {
        await this.client.close();
        console.log('  ✅ Database connection closed');
      }
    } catch (error) {
      console.log('  ⚠️  Cleanup error:', error.message);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new OfflineSchedulerTester();
  tester.testOfflineBehavior();
}

module.exports = OfflineSchedulerTester;

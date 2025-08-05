/**
 * Critical Test: What happens when server is offline during scheduled execution times?
 * This demonstrates the current limitation and proposes a solution
 */

const fetch = require('node-fetch');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
const TEST_USER = 'MissedExecutionTest';

class MissedExecutionTester {
  constructor() {
    this.client = null;
  }

  async initialize() {
    this.client = new MongoClient(
      process.env.MONGODB_URI || 'mongodb://localhost:27017',
    );
    await this.client.connect();
    console.log('📊 Connected to MongoDB for missed execution testing');
    await this.ensureTestUser();
  }

  async ensureTestUser() {
    const db = this.client.db('TrinityCapital');
    const collection = db.collection('User Profiles');

    // Clean up any existing test user
    await collection.deleteOne({ 'checkingAccount.accountHolder': TEST_USER });

    console.log(`👤 Creating fresh test user: ${TEST_USER}`);
    await collection.insertOne({
      checkingAccount: {
        accountHolder: TEST_USER,
        balance: 1000,
        balanceTotal: 1000,
        bills: [],
        payments: [],
        transactions: [],
        movementsDates: [],
      },
    });
  }

  async testMissedExecution() {
    console.log('🧪 Testing What Happens With Missed Executions...\n');
    console.log('='.repeat(70));

    try {
      await this.initialize();

      // Step 1: Create a bill with nextExecution in the past (simulating server was offline)
      console.log(
        '📝 Step 1: Simulating a bill that should have executed while server was offline...',
      );

      const pastExecutionTime = new Date();
      pastExecutionTime.setHours(pastExecutionTime.getHours() - 2); // 2 hours ago

      const creationTime = new Date();
      creationTime.setDate(creationTime.getDate() - 7); // Created 7 days ago

      const billData = {
        _id: new ObjectId(),
        amount: -100,
        interval: 'weekly',
        Name: 'Weekly Rent Payment',
        Category: 'Housing',
        Date: creationTime.toISOString(),
        nextExecution: pastExecutionTime.toISOString(), // This is in the past!
      };

      const db = this.client.db('TrinityCapital');
      const collection = db.collection('User Profiles');

      await collection.updateOne(
        { 'checkingAccount.accountHolder': TEST_USER },
        { $push: { 'checkingAccount.bills': billData } },
      );

      console.log(
        `  📅 Bill created: ${new Date(creationTime).toLocaleString()}`,
      );
      console.log(
        `  ⏰ Should have executed: ${pastExecutionTime.toLocaleString()}`,
      );
      console.log(
        `  🔴 Execution time is: ${pastExecutionTime < new Date() ? 'IN THE PAST' : 'IN THE FUTURE'}`,
      );

      // Step 2: Check current state
      const beforeProfile = await collection.findOne({
        'checkingAccount.accountHolder': TEST_USER,
      });

      console.log(`\n📊 Before server processing:`);
      console.log(`  💰 Balance: $${beforeProfile.checkingAccount.balance}`);
      console.log(
        `  📋 Transactions: ${beforeProfile.checkingAccount.transactions?.length || 0}`,
      );
      console.log(
        `  🧾 Bills: ${beforeProfile.checkingAccount.bills?.length || 0}`,
      );

      // Step 3: Check if scheduler picks up the missed execution
      console.log(
        '\n🔍 Checking if scheduler detects and processes missed execution...',
      );

      try {
        const response = await fetch(`${BASE_URL}/scheduler/user/${TEST_USER}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`  📊 Scheduled bills: ${data.bills?.length || 0}`);
          data.bills?.forEach((bill, index) => {
            const nextExec = new Date(bill.nextExecution);
            const isPast = nextExec < new Date();
            console.log(
              `    ${index + 1}. ${bill.Name} - Next: ${nextExec.toLocaleString()} ${isPast ? '(PAST)' : '(FUTURE)'}`,
            );
          });
        }
      } catch (error) {
        console.log('  ❌ Could not check scheduler status');
      }

      // Step 4: Wait to see if anything happens
      console.log(
        '\n⏳ Waiting 15 seconds to see if missed execution is processed...',
      );
      await this.sleep(15000);

      const afterProfile = await collection.findOne({
        'checkingAccount.accountHolder': TEST_USER,
      });

      console.log(`\n📊 After waiting:`);
      console.log(`  💰 Balance: $${afterProfile.checkingAccount.balance}`);
      console.log(
        `  📋 Transactions: ${afterProfile.checkingAccount.transactions?.length || 0}`,
      );

      if (afterProfile.checkingAccount.transactions?.length > 0) {
        console.log('  ✅ MISSED EXECUTION WAS PROCESSED!');
        afterProfile.checkingAccount.transactions.forEach((trans, index) => {
          console.log(`    ${index + 1}. ${trans.Name}: $${trans.amount}`);
        });
      } else {
        console.log('  ❌ MISSED EXECUTION WAS NOT PROCESSED!');
      }

      // Step 5: Show the critical issue
      console.log('\n🚨 CRITICAL ISSUE IDENTIFIED:');
      if (afterProfile.checkingAccount.transactions?.length === 0) {
        console.log(
          '  ❌ The current system does NOT catch up on missed executions',
        );
        console.log(
          '  ❌ If server is offline during execution time, transactions are skipped',
        );
        console.log(
          '  ❌ Students would miss their scheduled bills/payments permanently',
        );
        console.log('  ❌ This breaks the educational simulation integrity');
      }

      await this.demonstrateSolution();
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  async demonstrateSolution() {
    console.log('\n💡 PROPOSED SOLUTION - Catch-up Mechanism:');
    console.log('='.repeat(50));

    console.log('When server starts, it should:');
    console.log('1. ✅ Load all scheduled transactions (current behavior)');
    console.log('2. 🆕 Check if any nextExecution dates are in the past');
    console.log('3. 🆕 Process all missed executions immediately');
    console.log('4. 🆕 Update nextExecution to next future date');
    console.log('5. ✅ Schedule future executions normally');

    console.log(
      '\nThis would ensure students never miss their scheduled transactions,',
    );
    console.log(
      'maintaining the educational integrity even during server downtime.',
    );
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');

    try {
      const db = this.client.db('TrinityCapital');
      const collection = db.collection('User Profiles');

      await collection.deleteOne({
        'checkingAccount.accountHolder': TEST_USER,
      });

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
  const tester = new MissedExecutionTester();
  tester.testMissedExecution();
}

module.exports = MissedExecutionTester;

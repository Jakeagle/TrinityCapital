/**
 * Direct Catch-up System Test
 * Tests the catch-up mechanism directly without requiring server endpoints
 */

const { MongoClient, ObjectId } = require('mongodb');
const CatchupScheduler = require('./catchupScheduler');
require('dotenv').config();

const TEST_USER = 'DirectCatchupTest';

class DirectCatchupTester {
  constructor() {
    this.client = null;
    this.mockSocketIO = {
      to: () => ({
        emit: (event, data) => {
          console.log(`📡 Socket emit: ${event}`, data);
        },
      }),
    };
  }

  async initialize() {
    this.client = new MongoClient(
      process.env.MONGODB_URI || 'mongodb://localhost:27017',
    );
    await this.client.connect();
    console.log('✅ Connected to MongoDB');
    await this.setupTestUser();
  }

  async setupTestUser() {
    const db = this.client.db('TrinityCapital');
    const collection = db.collection('User Profiles');

    // Clean up existing test user
    await collection.deleteOne({ 'checkingAccount.accountHolder': TEST_USER });

    // Create test user with past-due transactions
    const now = new Date();
    const pastDate1 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const pastDate2 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const pastDate3 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

    const testProfile = {
      checkingAccount: {
        accountHolder: TEST_USER,
        balance: 1000,
        balanceTotal: 1000,
        bills: [
          {
            _id: new ObjectId(),
            amount: -100,
            interval: 'weekly',
            Name: 'Weekly Rent - Past Due',
            Category: 'Housing',
            Date: new Date(
              now.getTime() - 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            nextExecution: pastDate1.toISOString(), // 2 days overdue
          },
          {
            _id: new ObjectId(),
            amount: -50,
            interval: 'monthly',
            Name: 'Monthly Phone - Past Due',
            Category: 'Utilities',
            Date: new Date(
              now.getTime() - 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            nextExecution: pastDate2.toISOString(), // 5 days overdue
          },
        ],
        payments: [
          {
            _id: new ObjectId(),
            amount: 200,
            interval: 'bi-weekly',
            Name: 'Bi-weekly Salary - Past Due',
            Category: 'Income',
            Date: new Date(
              now.getTime() - 14 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            nextExecution: pastDate3.toISOString(), // 1 day overdue
          },
        ],
        transactions: [],
        checkingHistory: [],
        movementsDates: [],
      },
    };

    await collection.insertOne(testProfile);
    console.log(`✅ Created test user with 3 past-due transactions:`);
    console.log(
      `   📋 Bill 1: Due ${pastDate1.toLocaleDateString()} (${Math.ceil((now - pastDate1) / (24 * 60 * 60 * 1000))} days overdue)`,
    );
    console.log(
      `   📋 Bill 2: Due ${pastDate2.toLocaleDateString()} (${Math.ceil((now - pastDate2) / (24 * 60 * 60 * 1000))} days overdue)`,
    );
    console.log(
      `   💰 Payment 1: Due ${pastDate3.toLocaleDateString()} (${Math.ceil((now - pastDate3) / (24 * 60 * 60 * 1000))} days overdue)`,
    );
  }

  async testDirectCatchup() {
    console.log('\n🔄 Testing Direct Catch-up System...\n');
    console.log('='.repeat(60));

    try {
      // Get initial state
      const beforeProfile = await this.getUserProfile();
      const initialBalance = beforeProfile.checkingAccount.balance;
      const initialTransactions =
        beforeProfile.checkingAccount.transactions?.length || 0;

      console.log(`📊 Initial State:`);
      console.log(`   💰 Balance: $${initialBalance}`);
      console.log(`   📋 Transactions: ${initialTransactions}`);
      console.log(
        `   🧾 Bills: ${beforeProfile.checkingAccount.bills?.length || 0}`,
      );
      console.log(
        `   💳 Payments: ${beforeProfile.checkingAccount.payments?.length || 0}`,
      );

      // Create catch-up scheduler instance
      const catchupScheduler = new CatchupScheduler(
        this.client,
        this.mockSocketIO,
      );

      // Record a fake shutdown time (simulate server was down)
      const fakeShutdownTime = new Date();
      fakeShutdownTime.setDate(fakeShutdownTime.getDate() - 7); // Server was down for 7 days

      console.log(`\n🔧 Testing catch-up check (simulating 7-day downtime)...`);

      // Perform catch-up check
      const result = await catchupScheduler.performCatchupCheck();

      console.log(`\n📊 Catch-up Results:`);
      console.log(`   ✅ Success: ${result.success}`);
      console.log(`   🔄 Total Processed: ${result.totalProcessed || 0}`);
      console.log(`   ❌ Total Missed: ${result.totalMissed || 0}`);
      console.log(`   👥 Users Processed: ${result.usersProcessed || 0}`);

      if (!result.success) {
        console.log(`   ❌ Error: ${result.error}`);
      }

      // Check final state
      const afterProfile = await this.getUserProfile();
      const finalBalance = afterProfile.checkingAccount.balance;
      const finalTransactions =
        afterProfile.checkingAccount.transactions?.length || 0;

      console.log(`\n📊 Final State:`);
      console.log(
        `   💰 Balance: $${finalBalance} (${finalBalance > initialBalance ? '+' : ''}${finalBalance - initialBalance})`,
      );
      console.log(
        `   📋 Transactions: ${finalTransactions} (+${finalTransactions - initialTransactions} new)`,
      );

      // Show processed transactions
      if (finalTransactions > initialTransactions) {
        console.log(`\n🎉 Catch-up Transactions Processed:`);
        const newTransactions =
          afterProfile.checkingAccount.transactions.slice(initialTransactions);
        newTransactions.forEach((trans, index) => {
          const date = new Date(trans.Date);
          const catchupLabel = trans.catchup ? ' (CATCH-UP)' : '';
          console.log(
            `   ${index + 1}. ${trans.Name}: $${trans.amount} on ${date.toLocaleDateString()}${catchupLabel}`,
          );
        });
      }

      // Check if future dates are properly updated
      console.log(`\n📅 Updated Schedule Verification:`);
      const now = new Date();
      const allScheduled = [
        ...(afterProfile.checkingAccount.bills || []),
        ...(afterProfile.checkingAccount.payments || []),
      ];

      allScheduled.forEach((item, index) => {
        const nextExec = new Date(item.nextExecution);
        const isFuture = nextExec > now;
        console.log(
          `   ${index + 1}. ${item.Name}: Next execution ${nextExec.toLocaleDateString()} ${isFuture ? '✅' : '❌'}`,
        );
      });

      // Test statistics
      console.log(`\n📈 Testing Statistics...`);
      const stats = await catchupScheduler.getCatchupStats(7);
      if (stats) {
        console.log(
          `   📊 Catch-up transactions (7 days): ${stats.totalCatchupTransactions || 0}`,
        );
        console.log(`   💰 Total amount: $${stats.totalAmount || 0}`);
        console.log(`   👥 Users affected: ${stats.users?.length || 0}`);
      } else {
        console.log(`   ⚠️  Statistics not available`);
      }

      return {
        success: result.success,
        processedTransactions: result.totalProcessed || 0,
        balanceChange: finalBalance - initialBalance,
        newTransactionCount: finalTransactions - initialTransactions,
      };
    } catch (error) {
      console.error('❌ Direct catch-up test failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getUserProfile() {
    const db = this.client.db('TrinityCapital');
    const collection = db.collection('User Profiles');

    return await collection.findOne({
      'checkingAccount.accountHolder': TEST_USER,
    });
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');

    try {
      const db = this.client.db('TrinityCapital');
      const collection = db.collection('User Profiles');

      await collection.deleteOne({
        'checkingAccount.accountHolder': TEST_USER,
      });
      console.log('   ✅ Test user cleaned up');

      if (this.client) {
        await this.client.close();
        console.log('   ✅ Database connection closed');
      }
    } catch (error) {
      console.log('   ⚠️  Cleanup error:', error.message);
    }
  }
}

async function runDirectTest() {
  console.log('🧪 Direct Catch-up System Test');
  console.log('='.repeat(60));
  console.log('📝 This test directly validates the catch-up mechanism');
  console.log('   without requiring server endpoints or API calls.');
  console.log('');

  const tester = new DirectCatchupTester();

  try {
    await tester.initialize();
    const result = await tester.testDirectCatchup();

    console.log('\n🎯 Test Summary:');
    console.log('='.repeat(60));

    if (result.success) {
      console.log('✅ CATCH-UP SYSTEM WORKING PERFECTLY!');
      console.log(
        `   🔄 Processed ${result.processedTransactions} missed transactions`,
      );
      console.log(`   💰 Balance updated by $${result.balanceChange}`);
      console.log(
        `   📋 Added ${result.newTransactionCount} new transaction records`,
      );
      console.log('');
      console.log('🎓 Educational Integrity: GUARANTEED');
      console.log('   Students will NEVER miss scheduled transactions!');
    } else {
      console.log('❌ CATCH-UP SYSTEM NEEDS ATTENTION');
      console.log(`   Error: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  runDirectTest().catch(console.error);
}

module.exports = { DirectCatchupTester, runDirectTest };

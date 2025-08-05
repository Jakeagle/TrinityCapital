/**
 * Test script for the persistent scheduler system
 * Run this to verify the scheduler is working correctly
 */

const fetch = require('node-fetch'); // You may need to install: npm install node-fetch

const BASE_URL = 'http://localhost:3000';

class SchedulerTester {
  constructor() {
    this.testResults = [];
  }

  async runTests() {
    console.log('🧪 Starting Scheduler Tests...\n');

    try {
      await this.testSchedulerStatus();
      await this.testUserScheduledTransactions();
      await this.displayResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testSchedulerStatus() {
    console.log('📊 Testing scheduler status endpoint...');

    try {
      const response = await fetch(`${BASE_URL}/scheduler/status`);
      const data = await response.json();

      if (response.ok) {
        console.log('✅ Scheduler status endpoint working');
        console.log(`   Active Jobs: ${data.totalScheduledJobs}`);
        this.testResults.push({
          test: 'Scheduler Status',
          result: 'PASS',
          data,
        });
      } else {
        console.log('❌ Scheduler status endpoint failed');
        this.testResults.push({
          test: 'Scheduler Status',
          result: 'FAIL',
          error: data,
        });
      }
    } catch (error) {
      console.log('❌ Scheduler status endpoint error:', error.message);
      this.testResults.push({
        test: 'Scheduler Status',
        result: 'ERROR',
        error: error.message,
      });
    }
  }

  async testUserScheduledTransactions() {
    console.log('\n👤 Testing user scheduled transactions...');

    // This would require a real user - adjust the memberName as needed
    const testUser = 'TestUser'; // Change this to an actual user in your system

    try {
      const response = await fetch(`${BASE_URL}/scheduler/user/${testUser}`);
      const data = await response.json();

      if (response.ok) {
        console.log('✅ User scheduled transactions endpoint working');
        console.log(`   Bills: ${data.bills?.length || 0}`);
        console.log(`   Payments: ${data.payments?.length || 0}`);
        this.testResults.push({
          test: 'User Transactions',
          result: 'PASS',
          data,
        });
      } else if (response.status === 404) {
        console.log('⚠️  User not found (expected for test user)');
        this.testResults.push({
          test: 'User Transactions',
          result: 'SKIP',
          reason: 'Test user not found',
        });
      } else {
        console.log('❌ User scheduled transactions endpoint failed');
        this.testResults.push({
          test: 'User Transactions',
          result: 'FAIL',
          error: data,
        });
      }
    } catch (error) {
      console.log(
        '❌ User scheduled transactions endpoint error:',
        error.message,
      );
      this.testResults.push({
        test: 'User Transactions',
        result: 'ERROR',
        error: error.message,
      });
    }
  }

  async displayResults() {
    console.log('\n📋 Test Results Summary:');
    console.log('='.repeat(50));

    this.testResults.forEach((result, index) => {
      const icon =
        result.result === 'PASS'
          ? '✅'
          : result.result === 'SKIP'
            ? '⏭️'
            : '❌';
      console.log(`${icon} ${result.test}: ${result.result}`);

      if (result.reason) {
        console.log(`   Reason: ${result.reason}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    const passed = this.testResults.filter(r => r.result === 'PASS').length;
    const total = this.testResults.length;
    console.log(`\n🎯 Tests passed: ${passed}/${total}`);
  }

  // Manual test method for adding a bill/payment
  async testAddTransaction(memberName, type = 'bill') {
    console.log(`\n🧾 Testing add ${type} for user: ${memberName}`);

    const testTransaction = {
      amount: type === 'bill' ? -50 : 100,
      interval: 'weekly',
      Name: `Test ${type}`,
      Category: 'Test Category',
      Date: new Date().toISOString(),
    };

    const mockProfile = { memberName };

    try {
      const response = await fetch(`${BASE_URL}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcel: [
            mockProfile,
            type,
            testTransaction.amount,
            testTransaction.interval,
            testTransaction.Name,
            testTransaction.Category,
            testTransaction.Date,
          ],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Successfully added test ${type}`);
        console.log('   Response:', data);
        return data;
      } else {
        console.log(`❌ Failed to add test ${type}`);
        console.log('   Error:', data);
        return null;
      }
    } catch (error) {
      console.log(`❌ Error adding test ${type}:`, error.message);
      return null;
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SchedulerTester();
  tester.runTests();
}

module.exports = SchedulerTester;

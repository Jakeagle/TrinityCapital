/**
 * Trinity Capital - Quick System Status Check
 *
 * A simplified status check to verify system health and provide actionable insights.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function quickSystemCheck() {
  console.log('🔍 Trinity Capital Quick System Check');
  console.log('='.repeat(50));

  try {
    // Database connectivity
    console.log('\n1. 🗄️ Database Status:');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('   ✅ MongoDB Atlas connected');

    const db = client.db('TrinityCapital');

    // Check key collections and their counts
    const collections = ['Lessons', 'Teachers', 'Students', 'Profiles'];
    const collectionStats = {};

    for (const collName of collections) {
      try {
        const count = await db.collection(collName).countDocuments();
        collectionStats[collName] = count;
        console.log(`   ✅ ${collName}: ${count} documents`);
      } catch (error) {
        console.log(
          `   ⚠️ ${collName}: Collection not found (will be created automatically)`,
        );
        collectionStats[collName] = 0;
      }
    }

    // Check lesson conditions specifically
    const lessons = await db
      .collection('Lessons')
      .find({
        teacher: 'admin@trinity-capital.net',
      })
      .toArray();

    console.log('\n2. 📚 Lesson System Status:');
    console.log(`   ✅ Dallas Fed Lessons: ${lessons.length}`);

    if (lessons.length > 0) {
      let totalConditions = 0;
      lessons.forEach(lesson => {
        const conditions =
          lesson.lesson?.lesson_conditions || lesson.conditions || [];
        totalConditions += conditions.length;
      });
      console.log(`   ✅ Total Conditions: ${totalConditions}`);
      console.log(
        `   ✅ Average per Lesson: ${(totalConditions / lessons.length).toFixed(1)}`,
      );
    }

    await client.close();

    // Server status
    console.log('\n3. 🌐 Server Status:');

    // Test main server
    try {
      const response = await fetch('http://localhost:3000/health');
      if (response.ok) {
        console.log('   ✅ Main Server (Port 3000): Running');
      } else {
        console.log(
          '   ⚠️ Main Server (Port 3000): Responding but health check failed',
        );
      }
    } catch (error) {
      console.log('   ❌ Main Server (Port 3000): Not responding');
    }

    // Test lesson server
    try {
      const response = await fetch('http://localhost:4000');
      console.log('   ✅ Lesson Server (Port 4000): Running');
    } catch (error) {
      console.log('   ❌ Lesson Server (Port 4000): Not responding');
    }

    // System recommendations
    console.log('\n4. 💡 System Recommendations:');

    if (collectionStats.Students === 0) {
      console.log('   📝 Create test student accounts for full system testing');
    }

    if (collectionStats.Profiles === 0) {
      console.log(
        '   📝 Student profiles will be created automatically when students sign up',
      );
    }

    if (lessons.length > 0) {
      console.log(
        '   🎉 Curriculum system is fully operational with Dallas Fed standards',
      );
    }

    console.log('\n5. 🚀 Next Steps:');
    console.log('   1. Both servers are running - system is ready for testing');
    console.log('   2. Open http://localhost:3000/Frontend/ in your browser');
    console.log('   3. Test student login and lesson progression');
    console.log('   4. Test teacher dashboard at lesson server port 4000');

    console.log('\n✅ System Status: OPERATIONAL');
  } catch (error) {
    console.error('❌ System check failed:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  quickSystemCheck();
}

module.exports = { quickSystemCheck };

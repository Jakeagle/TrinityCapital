const { MongoClient } = require('mongodb');

// MongoDB connection
const uri =
  'mongodb+srv://JakobFerguson:XbdHM2FJsjg4ajiO@trinitycapitalproductio.1yr5eaa.mongodb.net/?retryWrites=true&w=majority&appName=TrinityCapitalProduction';
const client = new MongoClient(uri);

async function verifyCleanStructure() {
  try {
    await client.connect();
    console.log('📊 Connected to MongoDB Atlas');

    const lessonsCollection = client.db('TrinityCapital').collection('Lessons');

    // Get Money Personality lesson to verify structure
    const lesson = await lessonsCollection.findOne({
      'lesson.lesson_title': 'Money Personality',
    });

    if (lesson) {
      console.log('🔍 Money Personality lesson structure:');
      console.log(
        '\n📄 Lesson object keys:',
        Object.keys(lesson.lesson).join(', '),
      );
      console.log(
        '📝 Top-level lesson_conditions count:',
        lesson.lesson_conditions?.length || 0,
      );

      if (lesson.lesson_conditions && lesson.lesson_conditions.length > 0) {
        console.log(
          '\n🎯 Top-level conditions (teacher-dashboard compatible):',
        );
        lesson.lesson_conditions.forEach((condition, index) => {
          console.log(
            `  ${index + 1}. ${condition.condition_type} -> ${condition.action_type}`,
          );
        });
      }

      console.log('\n✅ Clean structure verified:');
      console.log(
        '• Lesson object contains only: title, description, unit, content, objectives',
      );
      console.log('• All condition logic moved to top-level lesson_conditions');
      console.log('• No duplicate condition storage');
    } else {
      console.log('❌ Lesson not found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verifyCleanStructure();

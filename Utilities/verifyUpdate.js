const { MongoClient } = require('mongodb');

// MongoDB connection
const uri =
  'mongodb+srv://JakobFerguson:XbdHM2FJsjg4ajiO@trinitycapitalproductio.1yr5eaa.mongodb.net/?retryWrites=true&w=majority&appName=TrinityCapitalProduction';
const client = new MongoClient(uri);

async function verifyUpdate() {
  try {
    await client.connect();
    console.log('📊 Connected to MongoDB Atlas');

    const lessonsCollection = client.db('TrinityCapital').collection('Lessons');

    // Get Money Personality lesson to check conditions
    const moneyPersonalityLesson = await lessonsCollection.findOne({
      'lesson.lesson_title': 'Money Personality',
    });

    if (moneyPersonalityLesson) {
      console.log('🔍 Money Personality lesson found');
      console.log(
        '📝 Top-level lesson_conditions count:',
        moneyPersonalityLesson.lesson_conditions?.length || 0,
      );
      console.log(
        '📝 Nested lesson.lesson_conditions count:',
        moneyPersonalityLesson.lesson?.lesson_conditions?.length || 0,
      );

      if (
        moneyPersonalityLesson.lesson_conditions &&
        moneyPersonalityLesson.lesson_conditions.length > 0
      ) {
        console.log('\n🎯 Top-level conditions:');
        moneyPersonalityLesson.lesson_conditions.forEach((condition, index) => {
          console.log(
            `  ${index + 1}. ${condition.condition_type} -> ${condition.action_type}`,
          );
        });
      }

      if (
        moneyPersonalityLesson.lesson?.lesson_conditions &&
        moneyPersonalityLesson.lesson.lesson_conditions.length > 0
      ) {
        console.log('\n🎯 Nested conditions:');
        moneyPersonalityLesson.lesson.lesson_conditions.forEach(
          (condition, index) => {
            console.log(
              `  ${index + 1}. ${condition.condition_type} -> ${condition.action_type}`,
            );
          },
        );
      }
    } else {
      console.log('❌ Money Personality lesson not found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verifyUpdate();

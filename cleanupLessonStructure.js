/**
 * Clean up lesson database structure:
 * - Remove nested lesson.lesson_conditions (redundant)
 * - Keep only lesson_conditions at top level
 * - Lesson object should only contain text content
 */

const { MongoClient } = require('mongodb');

// MongoDB connection
const uri =
  'mongodb+srv://JakobFerguson:XbdHM2FJsjg4ajiO@trinitycapitalproductio.1yr5eaa.mongodb.net/?retryWrites=true&w=majority&appName=TrinityCapitalProduction';
const client = new MongoClient(uri);

async function cleanupLessonStructure() {
  try {
    await client.connect();
    console.log('📊 Connected to MongoDB Atlas');

    const lessonsCollection = client.db('TrinityCapital').collection('Lessons');

    // Get all lessons
    const lessons = await lessonsCollection.find({}).toArray();
    console.log(`📚 Found ${lessons.length} lessons to clean up`);

    for (const lesson of lessons) {
      const lessonTitle = lesson.lesson?.lesson_title || 'Unknown Lesson';
      console.log(`\n🧹 Cleaning: ${lessonTitle}`);

      // Clean up the lesson object - keep only text content
      if (lesson.lesson) {
        const cleanLesson = {
          lesson_title: lesson.lesson.lesson_title,
          lesson_description: lesson.lesson.lesson_description,
          unit: lesson.lesson.unit,
          content: lesson.lesson.content,
          learning_objectives: lesson.lesson.learning_objectives,
        };

        // Remove condition-related fields from nested lesson object
        lesson.lesson = cleanLesson;

        console.log(
          `  ✅ Cleaned nested lesson object (kept only text content)`,
        );
      }

      // Ensure we have the correct top-level lesson_conditions
      // (These should already be updated from previous script)
      if (!lesson.lesson_conditions || lesson.lesson_conditions.length === 0) {
        console.log(`  ⚠️  No top-level conditions found, adding default`);
        lesson.lesson_conditions = [
          {
            condition_type: 'elapsed_time',
            condition_value: 60,
            action_type: 'show_tip',
            action_details: {
              message:
                'Take time to explore the app features related to this lesson topic.',
              priority: 'medium',
            },
          },
          {
            condition_type: 'account_switched',
            condition_value: 1,
            action_type: 'send_message',
            action_details: {
              message:
                'Good! Exploring your accounts helps you understand your financial position.',
              priority: 'medium',
            },
          },
          {
            condition_type: 'total_transactions_above',
            condition_value: 2,
            action_type: 'complete_lesson',
            action_details: {
              message:
                "Well done! You've engaged with the lesson material and practiced using the app.",
              score_bonus: 5,
              priority: 'critical',
            },
          },
        ];
      }

      // Update metadata
      lesson.updated_at = new Date().toISOString();
      lesson.structure_cleaned = true;

      // Update in database
      await lessonsCollection.replaceOne({ _id: lesson._id }, lesson);

      console.log(`  ✅ Updated ${lessonTitle} with clean structure`);
      console.log(
        `  📝 Top-level conditions: ${lesson.lesson_conditions.length}`,
      );
      console.log(
        `  📄 Lesson content only: title, description, unit, content, objectives`,
      );
    }

    console.log('\n🎉 Database structure cleaned successfully!');
    console.log('\nStructure changes:');
    console.log('• Removed nested lesson.lesson_conditions');
    console.log('• Kept only text content in lesson object');
    console.log('• All condition logic in top-level lesson_conditions');
    console.log('• Clean separation of content vs. behavior');
  } catch (error) {
    console.error('❌ Error cleaning structure:', error);
  } finally {
    await client.close();
    console.log('📊 Database connection closed');
  }
}

// Run the cleanup
cleanupLessonStructure();

const { MongoClient } = require('mongodb');

// MongoDB connection
const uri =
  'mongodb+srv://JakobFerguson:XbdHM2FJsjg4ajiO@trinitycapitalproductio.1yr5eaa.mongodb.net/?retryWrites=true&w=majority&appName=TrinityCapitalProduction';
const client = new MongoClient(uri);

async function debugLessons() {
  try {
    await client.connect();
    console.log('📊 Connected to MongoDB Atlas');

    const lessonsCollection = client.db('TrinityCapital').collection('Lessons');

    // Get all lessons and examine their structure
    const lessons = await lessonsCollection.find({}).toArray();
    console.log(`📚 Found ${lessons.length} lessons\n`);

    lessons.forEach((lesson, index) => {
      console.log(`Lesson ${index + 1}:`);
      console.log(`  _id: ${lesson._id}`);
      console.log(`  lesson field type: ${typeof lesson.lesson}`);
      if (lesson.lesson && typeof lesson.lesson === 'object') {
        console.log(`  lesson keys: ${Object.keys(lesson.lesson).join(', ')}`);
        console.log(`  lesson.lesson_title: ${lesson.lesson.lesson_title}`);
        console.log(`  lesson.title: ${lesson.lesson.title}`);
      } else {
        console.log(`  lesson value: ${lesson.lesson}`);
      }
      console.log(
        `  Current conditions count: ${lesson.lesson_conditions ? lesson.lesson_conditions.length : 0}`,
      );
      console.log('---');
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugLessons();

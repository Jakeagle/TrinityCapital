require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');

// Load the JSON file
const lessonsJson = JSON.parse(
  fs.readFileSync('./dallas_fed_aligned_lessons.json', 'utf8'),
);

// Find the lesson conditions for "Money Personality"
const moneyPersonality = lessonsJson.lessons.find(
  l => l.lesson_title === 'Money Personality',
);

if (!moneyPersonality) {
  console.error('Money Personality lesson not found in JSON');
  process.exit(1);
}

const newConditions = moneyPersonality.lesson_conditions;

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function updateLessonConditions() {
  try {
    await client.connect();
    const db = client.db('TrinityCapital');
    const lessons = db.collection('Lessons');

    // Update the lesson_conditions field
    const result = await lessons.updateOne(
      { _id: 1754331337919 },
      { $set: { lesson_conditions: newConditions } },
    );

    if (result.modifiedCount === 1) {
      console.log('Lesson conditions updated successfully.');
    } else {
      console.log('No document updated. Check if the _id is correct.');
    }
  } catch (err) {
    console.error('Error updating lesson:', err);
  } finally {
    await client.close();
  }
}

updateLessonConditions();

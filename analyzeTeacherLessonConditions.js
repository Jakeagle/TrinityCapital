/**
 * Trinity Capital - Teacher Lesson Conditions Analyzer
 *
 * This script analyzes all lesson conditions assigned to lessons created by admin@trinity-capital.net
 * It provides insights into the conditional logic and requirements set up for student lessons.
 *
 * Usage: node analyzeTeacherLessonConditions.js
 */

const { MongoClient } = require('mongodb');

// MongoDB connection configuration
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function analyzeTeacherLessonConditions() {
  try {
    console.log('🔍 Connecting to Trinity Capital database...');
    await client.connect();

    const db = client.db('TrinityCapital');
    const lessonsCollection = db.collection('Lessons');

    console.log(
      '📚 Analyzing lesson conditions for admin@trinity-capital.net...\n',
    );

    // Find all lessons created by admin@trinity-capital.net
    const lessons = await lessonsCollection
      .find({
        $or: [
          { creator_email: 'admin@trinity-capital.net' },
          { creator_username: 'adminTC' },
          { 'lesson.creator_email': 'admin@trinity-capital.net' },
          { teacher: 'admin@trinity-capital.net' },
        ],
      })
      .toArray();

    if (lessons.length === 0) {
      console.log('❌ No lessons found for admin@trinity-capital.net');
      console.log(
        '💡 Make sure lessons have been created with the correct creator email/username',
      );
      return;
    }

    console.log(
      `✅ Found ${lessons.length} lessons created by admin@trinity-capital.net\n`,
    );

    // Analysis variables
    let totalConditions = 0;
    let conditionTypes = new Map();
    let conditionActions = new Map();
    let lessonConditionStats = [];

    // Analyze each lesson
    lessons.forEach((lessonDoc, index) => {
      const lesson = lessonDoc.lesson || lessonDoc;
      const lessonTitle =
        lesson.lesson_title || lesson.title || `Lesson ${index + 1}`;
      const conditions = lesson.lesson_conditions || lesson.conditions || [];

      console.log(`📖 Lesson ${index + 1}: "${lessonTitle}"`);
      console.log(
        `   Created: ${lessonDoc.createdAt ? new Date(lessonDoc.createdAt).toLocaleDateString() : 'Unknown'}`,
      );
      console.log(`   Lesson ID: ${lessonDoc._id}`);
      console.log(`   Conditions: ${conditions.length}`);

      if (conditions.length === 0) {
        console.log('   ⚠️  No conditions defined\n');
        lessonConditionStats.push({
          title: lessonTitle,
          conditionCount: 0,
          conditions: [],
        });
        return;
      }

      // Analyze conditions for this lesson
      const lessonConditions = [];
      conditions.forEach((condition, condIndex) => {
        totalConditions++;

        const conditionType =
          condition.condition_type || condition.type || 'unknown';
        const actionType =
          condition.action_type || condition.action || 'unknown';

        // Track condition types
        if (conditionTypes.has(conditionType)) {
          conditionTypes.set(
            conditionType,
            conditionTypes.get(conditionType) + 1,
          );
        } else {
          conditionTypes.set(conditionType, 1);
        }

        // Track action types
        if (conditionActions.has(actionType)) {
          conditionActions.set(
            actionType,
            conditionActions.get(actionType) + 1,
          );
        } else {
          conditionActions.set(actionType, 1);
        }

        console.log(
          `     ${condIndex + 1}. Type: "${conditionType}" → Action: "${actionType}"`,
        );

        // Show additional details if available
        if (condition.condition_value || condition.value) {
          console.log(
            `        Value: ${condition.condition_value || condition.value}`,
          );
        }
        if (condition.action_details || condition.details) {
          const details = condition.action_details || condition.details;
          console.log(
            `        Details: ${typeof details === 'object' ? JSON.stringify(details) : details}`,
          );
        }

        lessonConditions.push({
          type: conditionType,
          action: actionType,
          value: condition.condition_value || condition.value,
          details: condition.action_details || condition.details,
        });
      });

      lessonConditionStats.push({
        title: lessonTitle,
        conditionCount: conditions.length,
        conditions: lessonConditions,
      });

      console.log(''); // Empty line for readability
    });

    // Generate summary report
    console.log('═'.repeat(80));
    console.log('📊 LESSON CONDITIONS ANALYSIS SUMMARY');
    console.log('═'.repeat(80));

    console.log(`\n🎯 Overview:`);
    console.log(`   • Total Lessons: ${lessons.length}`);
    console.log(`   • Total Conditions: ${totalConditions}`);
    console.log(
      `   • Average Conditions per Lesson: ${(totalConditions / lessons.length).toFixed(2)}`,
    );

    // Lessons without conditions
    const lessonsWithoutConditions = lessonConditionStats.filter(
      l => l.conditionCount === 0,
    );
    if (lessonsWithoutConditions.length > 0) {
      console.log(
        `   • Lessons without conditions: ${lessonsWithoutConditions.length}`,
      );
      lessonsWithoutConditions.forEach(lesson => {
        console.log(`     - "${lesson.title}"`);
      });
    }

    // Most complex lessons
    const sortedByComplexity = [...lessonConditionStats].sort(
      (a, b) => b.conditionCount - a.conditionCount,
    );
    console.log(`\n🏆 Most Complex Lessons (by condition count):`);
    sortedByComplexity.slice(0, 5).forEach((lesson, index) => {
      console.log(
        `   ${index + 1}. "${lesson.title}" - ${lesson.conditionCount} conditions`,
      );
    });

    // Condition types breakdown
    console.log(`\n📋 Condition Types Used:`);
    const sortedConditionTypes = [...conditionTypes.entries()].sort(
      (a, b) => b[1] - a[1],
    );
    sortedConditionTypes.forEach(([type, count]) => {
      const percentage = ((count / totalConditions) * 100).toFixed(1);
      console.log(`   • ${type}: ${count} (${percentage}%)`);
    });

    // Action types breakdown
    console.log(`\n⚡ Action Types Used:`);
    const sortedActionTypes = [...conditionActions.entries()].sort(
      (a, b) => b[1] - a[1],
    );
    sortedActionTypes.forEach(([action, count]) => {
      const percentage = ((count / totalConditions) * 100).toFixed(1);
      console.log(`   • ${action}: ${count} (${percentage}%)`);
    });

    // Generate detailed JSON report
    const report = {
      analysis_date: new Date().toISOString(),
      teacher: 'admin@trinity-capital.net',
      summary: {
        total_lessons: lessons.length,
        total_conditions: totalConditions,
        average_conditions_per_lesson: parseFloat(
          (totalConditions / lessons.length).toFixed(2),
        ),
        lessons_without_conditions: lessonsWithoutConditions.length,
      },
      condition_types: Object.fromEntries(sortedConditionTypes),
      action_types: Object.fromEntries(sortedActionTypes),
      lessons: lessonConditionStats,
      raw_lessons: lessons.map(l => ({
        _id: l._id,
        title: l.lesson?.lesson_title || l.title,
        created_at: l.createdAt,
        creator: l.creator_email || l.creator_username || l.teacher,
        conditions_count: (l.lesson?.lesson_conditions || l.conditions || [])
          .length,
      })),
    };

    // Save report to file
    const fs = require('fs');
    const reportPath = './teacher_lesson_conditions_report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    console.log(`\n✅ Analysis complete!`);
  } catch (error) {
    console.error('❌ Error analyzing lesson conditions:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Additional utility functions
async function findLessonsWithSpecificCondition(conditionType) {
  try {
    await client.connect();
    const db = client.db('TrinityCapital');
    const lessonsCollection = db.collection('Lessons');

    const lessons = await lessonsCollection
      .find({
        $and: [
          {
            $or: [
              { creator_email: 'admin@trinity-capital.net' },
              { creator_username: 'adminTC' },
              { teacher: 'admin@trinity-capital.net' },
            ],
          },
          {
            $or: [
              { 'lesson.lesson_conditions.condition_type': conditionType },
              { 'lesson.conditions.condition_type': conditionType },
              { 'lesson_conditions.condition_type': conditionType },
              { 'conditions.condition_type': conditionType },
            ],
          },
        ],
      })
      .toArray();

    return lessons;
  } catch (error) {
    console.error('Error finding lessons with specific condition:', error);
    return [];
  }
}

async function getConditionUsageStats() {
  try {
    await client.connect();
    const db = client.db('TrinityCapital');
    const lessonsCollection = db.collection('Lessons');

    const pipeline = [
      {
        $match: {
          $or: [
            { creator_email: 'admin@trinity-capital.net' },
            { creator_username: 'adminTC' },
            { teacher: 'admin@trinity-capital.net' },
          ],
        },
      },
      {
        $project: {
          conditions: {
            $ifNull: [
              '$lesson.lesson_conditions',
              { $ifNull: ['$lesson.conditions', '$conditions'] },
            ],
          },
        },
      },
      { $unwind: '$conditions' },
      {
        $group: {
          _id: '$conditions.condition_type',
          count: { $sum: 1 },
          actions: { $addToSet: '$conditions.action_type' },
        },
      },
      { $sort: { count: -1 } },
    ];

    const stats = await lessonsCollection.aggregate(pipeline).toArray();
    return stats;
  } catch (error) {
    console.error('Error getting condition usage stats:', error);
    return [];
  }
}

// Export functions for potential use in other scripts
module.exports = {
  analyzeTeacherLessonConditions,
  findLessonsWithSpecificCondition,
  getConditionUsageStats,
};

// Run the analysis if this script is executed directly
if (require.main === module) {
  analyzeTeacherLessonConditions();
}

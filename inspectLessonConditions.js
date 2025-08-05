/**
 * Trinity Capital - Advanced Lesson Conditions Inspector
 *
 * This script provides advanced inspection tools for lesson conditions
 * and can be used alongside the main analyzer for deeper insights.
 *
 * Usage Examples:
 * - node inspectLessonConditions.js --teacher admin@trinity-capital.net
 * - node inspectLessonConditions.js --condition-type "quiz_score"
 * - node inspectLessonConditions.js --lesson-id "65f4b2c8e1234567890abcde"
 */

const { MongoClient } = require('mongodb');

// MongoDB connection configuration
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

class LessonConditionsInspector {
  constructor() {
    this.db = null;
  }

  async connect() {
    try {
      await client.connect();
      this.db = client.db('TrinityCapital');
      console.log('✅ Connected to Trinity Capital database');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    await client.close();
    console.log('🔌 Database connection closed');
  }

  /**
   * Get detailed condition analysis for a specific teacher
   */
  async getTeacherConditionDetails(teacherEmail = 'admin@trinity-capital.net') {
    const lessonsCollection = this.db.collection('Lessons');

    console.log(`🔍 Analyzing conditions for teacher: ${teacherEmail}\n`);

    const lessons = await lessonsCollection
      .find({
        $or: [
          { creator_email: teacherEmail },
          { creator_username: 'adminTC' },
          { teacher: teacherEmail },
          { 'lesson.creator_email': teacherEmail },
        ],
      })
      .toArray();

    const conditionDetails = {
      teacher: teacherEmail,
      total_lessons: lessons.length,
      conditions_breakdown: {},
      complex_conditions: [],
      simple_lessons: [],
      condition_patterns: new Map(),
    };

    lessons.forEach(lessonDoc => {
      const lesson = lessonDoc.lesson || lessonDoc;
      const conditions = lesson.lesson_conditions || lesson.conditions || [];
      const lessonTitle = lesson.lesson_title || lesson.title || 'Untitled';

      if (conditions.length === 0) {
        conditionDetails.simple_lessons.push({
          title: lessonTitle,
          id: lessonDoc._id,
          reason: 'No conditions defined',
        });
        return;
      }

      if (conditions.length >= 3) {
        conditionDetails.complex_conditions.push({
          title: lessonTitle,
          id: lessonDoc._id,
          condition_count: conditions.length,
          conditions: conditions.map(c => ({
            type: c.condition_type || c.type,
            action: c.action_type || c.action,
            value: c.condition_value || c.value,
          })),
        });
      }

      // Analyze condition patterns
      conditions.forEach(condition => {
        const type = condition.condition_type || condition.type || 'unknown';
        const action = condition.action_type || condition.action || 'unknown';
        const pattern = `${type} → ${action}`;

        if (!conditionDetails.conditions_breakdown[type]) {
          conditionDetails.conditions_breakdown[type] = {
            count: 0,
            actions: new Set(),
            examples: [],
          };
        }

        conditionDetails.conditions_breakdown[type].count++;
        conditionDetails.conditions_breakdown[type].actions.add(action);

        if (conditionDetails.conditions_breakdown[type].examples.length < 3) {
          conditionDetails.conditions_breakdown[type].examples.push({
            lesson: lessonTitle,
            value: condition.condition_value || condition.value,
            details: condition.action_details || condition.details,
          });
        }

        // Track patterns
        const currentCount =
          conditionDetails.condition_patterns.get(pattern) || 0;
        conditionDetails.condition_patterns.set(pattern, currentCount + 1);
      });
    });

    // Convert Sets to Arrays for JSON serialization
    Object.keys(conditionDetails.conditions_breakdown).forEach(type => {
      conditionDetails.conditions_breakdown[type].actions = Array.from(
        conditionDetails.conditions_breakdown[type].actions,
      );
    });

    return conditionDetails;
  }

  /**
   * Find lessons with specific condition criteria
   */
  async findLessonsByCriteria(criteria) {
    const lessonsCollection = this.db.collection('Lessons');

    let query = {
      $or: [
        { creator_email: 'admin@trinity-capital.net' },
        { creator_username: 'adminTC' },
        { teacher: 'admin@trinity-capital.net' },
      ],
    };

    if (criteria.condition_type) {
      query['$and'] = [
        {
          $or: [
            {
              'lesson.lesson_conditions.condition_type':
                criteria.condition_type,
            },
            { 'conditions.condition_type': criteria.condition_type },
          ],
        },
      ];
    }

    if (criteria.action_type) {
      if (!query['$and']) query['$and'] = [];
      query['$and'].push({
        $or: [
          { 'lesson.lesson_conditions.action_type': criteria.action_type },
          { 'conditions.action_type': criteria.action_type },
        ],
      });
    }

    const lessons = await lessonsCollection.find(query).toArray();
    return lessons.map(l => ({
      id: l._id,
      title: l.lesson?.lesson_title || l.title,
      conditions: l.lesson?.lesson_conditions || l.conditions || [],
      created: l.createdAt,
    }));
  }

  /**
   * Analyze condition effectiveness (if completion data is available)
   */
  async analyzeConditionEffectiveness() {
    const lessonsCollection = this.db.collection('Lessons');
    const userProfilesCollection = this.db.collection('UserProfiles');

    console.log('📈 Analyzing condition effectiveness...\n');

    // Get lessons with conditions
    const lessonsWithConditions = await lessonsCollection
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
              { 'lesson.lesson_conditions.0': { $exists: true } },
              { 'conditions.0': { $exists: true } },
            ],
          },
        ],
      })
      .toArray();

    const effectiveness = {
      total_lessons_with_conditions: lessonsWithConditions.length,
      lessons_analysis: [],
    };

    for (const lessonDoc of lessonsWithConditions) {
      const lesson = lessonDoc.lesson || lessonDoc;
      const conditions = lesson.lesson_conditions || lesson.conditions || [];

      // Try to find student progress for this lesson
      const studentProgress = await userProfilesCollection
        .find({
          $or: [
            { [`lessonProgress.${lessonDoc._id}`]: { $exists: true } },
            { [`lessons.${lessonDoc._id}`]: { $exists: true } },
          ],
        })
        .toArray();

      effectiveness.lessons_analysis.push({
        lesson_title: lesson.lesson_title || lesson.title,
        lesson_id: lessonDoc._id,
        conditions_count: conditions.length,
        condition_types: conditions.map(c => c.condition_type || c.type),
        students_attempted: studentProgress.length,
        // Note: Detailed completion analysis would require more specific progress tracking
      });
    }

    return effectiveness;
  }

  /**
   * Generate a condition usage heatmap data
   */
  async generateConditionHeatmap() {
    const details = await this.getTeacherConditionDetails();

    const heatmapData = {
      condition_types: Object.keys(details.conditions_breakdown),
      usage_matrix: {},
    };

    Object.entries(details.conditions_breakdown).forEach(([type, data]) => {
      heatmapData.usage_matrix[type] = {
        total_usage: data.count,
        action_variety: data.actions.length,
        complexity_score: data.count * data.actions.length,
      };
    });

    return heatmapData;
  }

  /**
   * Export detailed report
   */
  async exportDetailedReport(outputPath = './detailed_conditions_report.json') {
    console.log('📊 Generating detailed conditions report...\n');

    const teacherDetails = await this.getTeacherConditionDetails();
    const effectiveness = await this.analyzeConditionEffectiveness();
    const heatmap = await this.generateConditionHeatmap();

    const report = {
      generated_at: new Date().toISOString(),
      report_type: 'detailed_lesson_conditions_analysis',
      teacher_analysis: teacherDetails,
      effectiveness_analysis: effectiveness,
      heatmap_data: heatmap,
      condition_patterns: Object.fromEntries(teacherDetails.condition_patterns),
      recommendations: this.generateRecommendations(teacherDetails),
    };

    const fs = require('fs');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log(`✅ Detailed report exported to: ${outputPath}`);
    return report;
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // Check for unused condition types
    const conditionTypes = Object.keys(analysis.conditions_breakdown);
    if (conditionTypes.length < 5) {
      recommendations.push({
        type: 'feature_usage',
        priority: 'medium',
        message:
          'Consider exploring more condition types to create diverse learning experiences',
      });
    }

    // Check for lessons without conditions
    if (analysis.simple_lessons.length > 0) {
      recommendations.push({
        type: 'engagement',
        priority: 'high',
        message: `${analysis.simple_lessons.length} lessons have no conditions. Adding conditions can improve student engagement and personalized learning paths.`,
      });
    }

    // Check for complex lessons
    if (analysis.complex_conditions.length > analysis.total_lessons * 0.3) {
      recommendations.push({
        type: 'complexity',
        priority: 'low',
        message:
          'Many lessons have complex condition sets. Consider if simpler conditions might achieve similar outcomes.',
      });
    }

    return recommendations;
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const inspector = new LessonConditionsInspector();

  try {
    await inspector.connect();

    if (args.includes('--help') || args.length === 0) {
      console.log(`
Trinity Capital Lesson Conditions Inspector

Available commands:
  --detailed-report    Generate comprehensive analysis report
  --teacher <email>    Analyze specific teacher's conditions
  --condition-type <type>  Find lessons with specific condition type
  --effectiveness      Analyze condition effectiveness
  --heatmap           Generate condition usage heatmap
  --help              Show this help message

Examples:
  node inspectLessonConditions.js --detailed-report
  node inspectLessonConditions.js --teacher admin@trinity-capital.net
  node inspectLessonConditions.js --condition-type "quiz_score"
      `);
      return;
    }

    if (args.includes('--detailed-report')) {
      await inspector.exportDetailedReport();
    }

    if (args.includes('--teacher')) {
      const teacherIndex = args.indexOf('--teacher') + 1;
      const teacher = args[teacherIndex] || 'admin@trinity-capital.net';
      const details = await inspector.getTeacherConditionDetails(teacher);
      console.log(JSON.stringify(details, null, 2));
    }

    if (args.includes('--condition-type')) {
      const typeIndex = args.indexOf('--condition-type') + 1;
      const conditionType = args[typeIndex];
      if (conditionType) {
        const lessons = await inspector.findLessonsByCriteria({
          condition_type: conditionType,
        });
        console.log(
          `Found ${lessons.length} lessons with condition type "${conditionType}"`,
        );
        lessons.forEach(lesson => {
          console.log(
            `- ${lesson.title} (${lesson.conditions.length} conditions)`,
          );
        });
      }
    }

    if (args.includes('--effectiveness')) {
      const effectiveness = await inspector.analyzeConditionEffectiveness();
      console.log(JSON.stringify(effectiveness, null, 2));
    }

    if (args.includes('--heatmap')) {
      const heatmap = await inspector.generateConditionHeatmap();
      console.log(JSON.stringify(heatmap, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await inspector.disconnect();
  }
}

// Export the class for use in other modules
module.exports = LessonConditionsInspector;

// Run if executed directly
if (require.main === module) {
  main();
}

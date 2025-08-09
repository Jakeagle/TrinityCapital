/**
 * Trinity Capital - Quick Lesson Conditions Analysis
 *
 * This script provides a quick way to run the lesson conditions analysis
 * for admin@trinity-capital.net and display the results in a readable format.
 *
 * Usage: node quickAnalysis.js
 */

const fs = require('fs');
const path = require('path');

async function runQuickAnalysis() {
  console.log('🚀 Trinity Capital - Quick Lesson Conditions Analysis');
  console.log('='.repeat(60));
  console.log('Analyzing lessons created by admin@trinity-capital.net\n');

  try {
    // Import the main analyzer
    const {
      analyzeTeacherLessonConditions,
    } = require('./analyzeTeacherLessonConditions.js');

    // Run the analysis
    console.log('Starting analysis...\n');
    await analyzeTeacherLessonConditions();

    // Check if report file was created
    const reportPath = './teacher_lesson_conditions_report.json';
    if (fs.existsSync(reportPath)) {
      console.log('\n📋 Quick Summary from Generated Report:');
      console.log('-'.repeat(50));

      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

      console.log(`📚 Total Lessons: ${report.summary.total_lessons}`);
      console.log(`🎯 Total Conditions: ${report.summary.total_conditions}`);
      console.log(
        `📊 Average Conditions per Lesson: ${report.summary.average_conditions_per_lesson}`,
      );

      if (report.summary.lessons_without_conditions > 0) {
        console.log(
          `⚠️  Lessons without conditions: ${report.summary.lessons_without_conditions}`,
        );
      }

      console.log('\n🏆 Top Condition Types:');
      const topConditions = Object.entries(report.condition_types).slice(0, 5);
      topConditions.forEach(([type, count], index) => {
        console.log(`   ${index + 1}. ${type}: ${count} uses`);
      });

      console.log('\n⚡ Top Action Types:');
      const topActions = Object.entries(report.action_types).slice(0, 5);
      topActions.forEach(([action, count], index) => {
        console.log(`   ${index + 1}. ${action}: ${count} uses`);
      });

      // Find most complex lesson
      const mostComplex = report.lessons.reduce((max, lesson) =>
        lesson.conditionCount > max.conditionCount ? lesson : max,
      );

      if (mostComplex.conditionCount > 0) {
        console.log(
          `\n🧩 Most Complex Lesson: "${mostComplex.title}" with ${mostComplex.conditionCount} conditions`,
        );
      }
    }
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Make sure MongoDB is running on localhost:27017');
    console.log('2. Verify the TrinityCapital database exists');
    console.log(
      '3. Check that lessons are properly stored with creator information',
    );
    console.log(
      '4. Ensure Node.js mongodb package is installed: npm install mongodb',
    );
  }
}

// Additional utility: Check system requirements
function checkRequirements() {
  console.log('🔍 Checking system requirements...\n');

  // Check if MongoDB package is available
  try {
    require('mongodb');
    console.log('✅ MongoDB package is available');
  } catch (error) {
    console.log('❌ MongoDB package not found');
    console.log('   Run: npm install mongodb');
    return false;
  }

  // Check if analysis scripts exist
  const requiredFiles = [
    './analyzeTeacherLessonConditions.js',
    './inspectLessonConditions.js',
  ];

  let allFilesExist = true;
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} found`);
    } else {
      console.log(`❌ ${file} not found`);
      allFilesExist = false;
    }
  });

  console.log('');
  return allFilesExist;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--check') || args.includes('--requirements')) {
    const requirementsMet = checkRequirements();
    if (!requirementsMet) {
      console.log(
        '❌ Requirements not met. Please install missing dependencies.',
      );
      process.exit(1);
    }
    console.log('✅ All requirements met!');
    return;
  }

  if (args.includes('--help')) {
    console.log(`
Trinity Capital Quick Analysis Tool

Commands:
  node quickAnalysis.js              Run complete analysis
  node quickAnalysis.js --check      Check system requirements
  node quickAnalysis.js --help       Show this help
  
For more detailed analysis, use:
  node analyzeTeacherLessonConditions.js
  node inspectLessonConditions.js --detailed-report
    `);
    return;
  }

  // Run the quick analysis
  await runQuickAnalysis();
}

// Export for potential use in other scripts
module.exports = {
  runQuickAnalysis,
  checkRequirements,
};

// Run if executed directly
if (require.main === module) {
  main();
}

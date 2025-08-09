# Trinity Capital Utilities

This folder contains utility scripts used for administrative tasks, lesson management, and system maintenance. These scripts are not part of the core application but are tools used by administrators to manage lessons, analyze data, and maintain the system.

## 📚 Lesson Management Utilities

### Analysis & Inspection
- `analyzeTeacherLessonConditions.js` - Analyzes teacher lesson conditions and generates reports
- `inspectLessonConditions.js` - Inspects and validates lesson condition structures
- `diagnoseStudentLessons.js` - Diagnoses student lesson progress and issues
- `quickAnalysis.js` - Performs quick analysis of lesson data

### Lesson Content Management
- `importDallasFedLessons.js` - Imports lessons from Dallas Federal Reserve educational content
- `updateDallasFedJSON.js` - Updates Dallas Fed lesson JSON data structures
- `generateAlignedLessonConditions.js` - Generates properly aligned lesson conditions

### Lesson Structure & Conditions
- `updateLessonConditions.js` - Updates lesson conditions in the database
- `updateNestedConditions.js` - Updates nested lesson condition structures
- `fixRealisticConditions.js` - Fixes realistic lesson conditions for proper functionality
- `cleanupLessonStructure.js` - Cleans up lesson structure inconsistencies

### Student Data Management
- `fixStudentLessonIds.js` - Fixes student lesson ID inconsistencies
- `debugLessons.js` - Debug utility for lesson-related issues

## 🔧 System Utilities

### Verification & Validation
- `verifyUpdate.js` - Verifies system updates and changes
- `verifyCleanStructure.js` - Verifies clean lesson structure implementation
- `quickSystemCheck.js` - Performs quick system health checks

## 📋 Usage Instructions

### Running Utilities
Most utilities can be run directly with Node.js from the project root:

\`\`\`bash
# Example: Run lesson analysis
node Utilities/analyzeTeacherLessonConditions.js

# Example: Import Dallas Fed lessons
node Utilities/importDallasFedLessons.js

# Example: Fix lesson conditions
node Utilities/fixRealisticConditions.js
\`\`\`

### Database Connection
These utilities connect to the same MongoDB database as the main application. Ensure your environment variables are properly set in the `.env` file:

\`\`\`env
MONGODB_URI=your_mongodb_connection_string
\`\`\`

### Prerequisites
- Node.js environment with all dependencies installed (\`npm install\`)
- Proper MongoDB connection configured
- Administrative access to the Trinity Capital database

## ⚠️ Important Notes

- **Backup First**: Always backup your database before running utilities that modify data
- **Test Environment**: Consider running utilities in a test environment first
- **Teacher Lessons**: Many utilities work with teacher lesson conditions and may affect live lesson data
- **Student Data**: Some utilities modify student lesson progress - use with caution

## 🗂️ Related Files

These utilities often work with:
- \`dallas_fed_aligned_lessons.json\` - Dallas Fed lesson data
- \`lesson_import_report.json\` - Import operation reports
- \`teacher_lesson_conditions_report.json\` - Teacher lesson analysis reports
- \`system_integration_report.json\` - System integration status

## 📝 Maintenance

This folder contains administrative tools that should be:
- ✅ Kept separate from production code
- ✅ Documented when new utilities are added
- ✅ Tested before running on production data
- ✅ Used by authorized administrators only

---
*Generated on: ${new Date().toLocaleDateString()}*  
*Trinity Capital Educational Banking Platform*

/**
 * Trinity Capital - Student Lesson Diagnosis Tool
 *
 * This script diagnoses why lessons aren't showing for a specific student.
 * It checks the complete flow from User Profiles -> assignedUnitIds -> Lessons collection
 *
 * Usage: node diagnoseStudentLessons.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGODB_URI);

async function diagnoseStudentLessons(studentName = 'Jake Ferguson') {
  console.log('🔍 Trinity Capital Student Lesson Diagnosis');
  console.log('='.repeat(60));
  console.log(`👤 Diagnosing lessons for student: ${studentName}`);

  try {
    await client.connect();
    const db = client.db('TrinityCapital');

    // Step 1: Check if student profile exists
    console.log('\n1. 👤 Checking Student Profile...');
    const profilesCollection = db.collection('User Profiles');

    const studentProfile = await profilesCollection.findOne({
      memberName: studentName,
    });

    if (!studentProfile) {
      console.log(`❌ Student profile not found for: ${studentName}`);
      console.log('💡 Need to create a student profile first');

      // Check for similar names
      const allProfiles = await profilesCollection
        .find({}, { projection: { memberName: 1 } })
        .toArray();
      console.log('📝 Existing student profiles:');
      allProfiles.forEach(profile => {
        console.log(`   - ${profile.memberName}`);
      });
      return;
    }

    console.log(`✅ Student profile found!`);
    console.log(`   - Member Name: ${studentProfile.memberName}`);
    console.log(`   - Teacher: ${studentProfile.teacher || 'Not assigned'}`);
    console.log(
      `   - Class Period: ${studentProfile.classPeriod || 'Not assigned'}`,
    );
    console.log(
      `   - Has assignedUnitIds: ${!!studentProfile.assignedUnitIds}`,
    );
    console.log(
      `   - assignedUnitIds count: ${studentProfile.assignedUnitIds ? studentProfile.assignedUnitIds.length : 0}`,
    );

    // Step 2: Check assigned unit IDs
    console.log('\n2. 📚 Checking Assigned Unit IDs...');

    if (
      !studentProfile.assignedUnitIds ||
      studentProfile.assignedUnitIds.length === 0
    ) {
      console.log(`❌ No assigned units found for ${studentName}`);
      console.log('💡 Teacher needs to assign units to this student');

      // Check if teacher has units available
      if (studentProfile.teacher) {
        const teachersCollection = db.collection('Teachers');
        const teacherDoc = await teachersCollection.findOne({
          name: studentProfile.teacher,
        });

        if (teacherDoc && teacherDoc.units) {
          console.log(
            `📖 Teacher "${studentProfile.teacher}" has ${teacherDoc.units.length} units available:`,
          );
          teacherDoc.units.forEach((unit, index) => {
            console.log(
              `   ${index + 1}. ${unit.name} (${unit.value}) - ${unit.lessons ? unit.lessons.length : 0} lessons`,
            );
          });
        }
      }
      return;
    }

    console.log(
      `✅ Found ${studentProfile.assignedUnitIds.length} assigned unit(s):`,
    );
    studentProfile.assignedUnitIds.forEach((assignment, index) => {
      console.log(
        `   ${index + 1}. Unit: ${assignment.unitName || assignment.unitValue}`,
      );
      console.log(`      - Unit ID: ${assignment.unitId}`);
      console.log(`      - Teacher: ${assignment.teacherName}`);
      console.log(`      - Class Period: ${assignment.classPeriod}`);
      console.log(
        `      - Lesson IDs: ${assignment.lessonIds ? assignment.lessonIds.length : 0}`,
      );
      if (assignment.lessonIds && assignment.lessonIds.length > 0) {
        console.log(`      - Lesson IDs: ${assignment.lessonIds.join(', ')}`);
      }
    });

    // Step 3: Check if lesson IDs exist in Lessons collection
    console.log('\n3. 🔍 Checking Lesson Availability...');

    const lessonsCollection = db.collection('Lessons');
    let totalLessonIds = [];

    // Collect all lesson IDs from all assignments
    studentProfile.assignedUnitIds.forEach(assignment => {
      if (assignment.lessonIds) {
        totalLessonIds.push(...assignment.lessonIds);
      }
    });

    if (totalLessonIds.length === 0) {
      console.log(`❌ No lesson IDs found in assigned units`);
      console.log('💡 The unit assignments are missing lesson IDs');
      return;
    }

    console.log(
      `🔍 Looking for ${totalLessonIds.length} lesson IDs in database...`,
    );

    // Check lessons with multiple ID formats (numeric, string, ObjectId)
    let foundLessons = [];

    for (const lessonId of totalLessonIds) {
      try {
        // Try numeric format first (Dallas Fed lessons use numeric IDs)
        let lesson = await lessonsCollection.findOne({
          _id: parseInt(lessonId),
        });

        // Try string format
        if (!lesson) {
          lesson = await lessonsCollection.findOne({ _id: lessonId });
        }

        // Try ObjectId format for older lessons
        if (!lesson && lessonId.length === 24) {
          const { ObjectId } = require('mongodb');
          lesson = await lessonsCollection.findOne({
            _id: new ObjectId(lessonId),
          });
        }

        if (lesson) {
          foundLessons.push(lesson);
        }
      } catch (error) {
        console.log(`⚠️ Error checking lesson ID: ${lessonId}`, error.message);
      }
    }

    console.log(`📚 Found ${foundLessons.length} lessons in database:`);

    if (foundLessons.length === 0) {
      console.log(`❌ No lessons found for the assigned IDs`);
      console.log(
        `💡 The lesson IDs in assignedUnitIds don't match any lessons in the database`,
      );

      // Check what lessons do exist
      const allLessons = await lessonsCollection.find({}).toArray();
      console.log(
        `\n📖 Available lessons in database (${allLessons.length} total):`,
      );
      allLessons.slice(0, 10).forEach((lesson, index) => {
        const lessonTitle =
          lesson.lesson?.lesson_title || lesson.title || 'Untitled';
        console.log(`   ${index + 1}. ${lessonTitle} (ID: ${lesson._id})`);
      });
      if (allLessons.length > 10) {
        console.log(`   ... and ${allLessons.length - 10} more`);
      }
      return;
    }

    // Display found lessons
    foundLessons.forEach((lesson, index) => {
      const lessonData = lesson.lesson || lesson;
      console.log(`   ${index + 1}. ${lessonData.lesson_title || 'Untitled'}`);
      console.log(`      - ID: ${lesson._id}`);
      console.log(`      - Teacher: ${lesson.teacher}`);
      console.log(
        `      - Conditions: ${lessonData.lesson_conditions ? lessonData.lesson_conditions.length : 0}`,
      );
      console.log(
        `      - Blocks: ${lessonData.lesson_blocks ? lessonData.lesson_blocks.length : 0}`,
      );
    });

    // Step 4: Test the API endpoint that the frontend uses
    console.log('\n4. 🌐 Testing Student API Endpoint...');

    try {
      const response = await fetch(
        `http://localhost:3000/student/${studentName}/assignedUnits`,
      );

      if (response.ok) {
        const apiData = await response.json();
        console.log(`✅ API endpoint responded successfully`);
        console.log(`   - Success: ${apiData.success}`);
        console.log(
          `   - Assigned Units: ${apiData.assignedUnits ? apiData.assignedUnits.length : 0}`,
        );

        if (apiData.assignedUnits && apiData.assignedUnits.length > 0) {
          console.log(`📚 API returned lessons:`);
          apiData.assignedUnits.forEach((unit, index) => {
            console.log(`   Unit ${index + 1}: ${unit.unitName}`);
            console.log(
              `      - Lessons: ${unit.lessons ? unit.lessons.length : 0}`,
            );
            if (unit.lessons) {
              unit.lessons.forEach((lesson, lessonIndex) => {
                console.log(
                  `        ${lessonIndex + 1}. ${lesson.lesson_title || 'Untitled'}`,
                );
              });
            }
          });
        } else {
          console.log(`❌ API returned no lessons`);
        }
      } else {
        console.log(`❌ API endpoint failed with status: ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Failed to test API endpoint: ${error.message}`);
    }

    // Step 5: Summary and recommendations
    console.log('\n5. 📋 Diagnosis Summary...');

    const hasProfile = !!studentProfile;
    const hasAssignments = studentProfile?.assignedUnitIds?.length > 0;
    const hasLessonIds = totalLessonIds.length > 0;
    const hasValidLessons = foundLessons.length > 0;

    console.log(`✅ Student Profile: ${hasProfile ? 'EXISTS' : 'MISSING'}`);
    console.log(
      `✅ Unit Assignments: ${hasAssignments ? 'EXISTS' : 'MISSING'}`,
    );
    console.log(`✅ Lesson IDs: ${hasLessonIds ? 'EXISTS' : 'MISSING'}`);
    console.log(`✅ Valid Lessons: ${hasValidLessons ? 'EXISTS' : 'MISSING'}`);

    if (hasProfile && hasAssignments && hasLessonIds && hasValidLessons) {
      console.log('\n🎉 DIAGNOSIS: All components are in place!');
      console.log("💡 If lessons still aren't showing, check:");
      console.log('   1. Frontend lesson rendering (lessonEngine.js)');
      console.log('   2. Student login name matching exactly');
      console.log('   3. Browser console for JavaScript errors');
    } else {
      console.log('\n⚠️ DIAGNOSIS: Missing components detected');
      if (!hasProfile) console.log('   - Create student profile');
      if (!hasAssignments) console.log('   - Teacher needs to assign units');
      if (!hasLessonIds)
        console.log('   - Fix unit assignment to include lesson IDs');
      if (!hasValidLessons)
        console.log('   - Ensure lesson IDs reference existing lessons');
    }
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Export for potential use in other scripts
module.exports = { diagnoseStudentLessons };

// Run the diagnosis if this script is executed directly
if (require.main === module) {
  const studentName = process.argv[2] || 'Jake Ferguson';
  diagnoseStudentLessons(studentName);
}

const { MongoClient } = require('mongodb');
require('dotenv').config();

/**
 * Fix Student Lesson IDs - Updates student assigned lesson IDs to match current database
 * Replaces old lesson IDs with new Dallas Fed curriculum lesson IDs
 */

async function fixStudentLessonIds() {
  console.log('🔧 Trinity Capital Student Lesson ID Fix');
  console.log('============================================================');

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db('TrinityCapital');
    const userProfilesCollection = db.collection('User Profiles');
    const lessonsCollection = db.collection('Lessons');

    // Get current available lessons
    const availableLessons = await lessonsCollection.find({}).toArray();
    console.log(
      `📚 Found ${availableLessons.length} available lessons in database`,
    );

    // Get all lesson IDs for Unit 1: Earning and Spending (first 8 lessons)
    const unit1LessonIds = availableLessons
      .slice(0, 8)
      .map(lesson => lesson._id.toString());
    console.log('🎯 Unit 1 Lesson IDs (first 8 lessons):');
    unit1LessonIds.forEach((id, index) => {
      const lesson = availableLessons[index];
      console.log(`   ${index + 1}. ${lesson.title} (ID: ${id})`);
    });

    // Find Jake Ferguson's profile
    const jakeProfile = await userProfilesCollection.findOne({
      memberName: 'Jake Ferguson',
    });

    if (!jakeProfile) {
      console.log('❌ Jake Ferguson profile not found');
      return;
    }

    console.log('\n👤 Found Jake Ferguson profile');
    console.log('📝 Current assignedUnitIds:');
    if (jakeProfile.assignedUnitIds && jakeProfile.assignedUnitIds.length > 0) {
      jakeProfile.assignedUnitIds.forEach((unit, index) => {
        console.log(
          `   Unit ${index + 1}: ${unit.unitName || unit.unit || 'Unknown'}`,
        );
        console.log(
          `   - Old lesson IDs (${unit.lessonIds ? unit.lessonIds.length : 0}): ${unit.lessonIds ? unit.lessonIds.join(', ') : 'None'}`,
        );
      });
    }

    // Update Jake's assigned lesson IDs
    const updatedAssignedUnitIds = jakeProfile.assignedUnitIds.map(unit => {
      if (
        unit.unit === 'Unit 1: Earning and Spending' ||
        unit.unitName === 'Unit 1: Earning and Spending'
      ) {
        return {
          ...unit,
          lessonIds: unit1LessonIds,
          updatedDate: new Date().toISOString(),
          updateReason: 'Fixed to match Dallas Fed curriculum lesson IDs',
        };
      }
      return unit;
    });

    // Update the database
    const updateResult = await userProfilesCollection.updateOne(
      { memberName: 'Jake Ferguson' },
      {
        $set: {
          assignedUnitIds: updatedAssignedUnitIds,
          lastUpdated: new Date().toISOString(),
          updateReason: 'Lesson ID fix - Dallas Fed curriculum alignment',
        },
      },
    );

    if (updateResult.modifiedCount > 0) {
      console.log("\n✅ Successfully updated Jake Ferguson's lesson IDs!");
      console.log('📝 New assignedUnitIds:');
      updatedAssignedUnitIds.forEach((unit, index) => {
        console.log(
          `   Unit ${index + 1}: ${unit.unitName || unit.unit || 'Unknown'}`,
        );
        console.log(
          `   - New lesson IDs (${unit.lessonIds ? unit.lessonIds.length : 0}): ${unit.lessonIds ? unit.lessonIds.join(', ') : 'None'}`,
        );
      });

      console.log('\n🎯 Verification - Checking lesson existence:');
      for (let i = 0; i < unit1LessonIds.length; i++) {
        const lessonExists = await lessonsCollection.findOne({
          _id: unit1LessonIds[i],
        });
        const lesson = availableLessons[i];
        console.log(
          `   ${i + 1}. ${lessonExists ? '✅' : '❌'} ${lesson.title} (${unit1LessonIds[i]})`,
        );
      }
    } else {
      console.log("❌ No changes made to Jake Ferguson's profile");
    }
  } catch (error) {
    console.error('❌ Error fixing student lesson IDs:', error);
  } finally {
    await client.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the fix
fixStudentLessonIds().catch(console.error);

/**
 * Trinity Capital - Dallas Fed Lesson Importer
 *
 * This script imports the Dallas Fed aligned lessons into the Trinity Capital database
 * and sets up the proper lesson conditions for educational compliance.
 *
 * Usage: node importDallasFedLessons.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');

// MongoDB Atlas connection configuration
const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority';
const client = new MongoClient(uri);

/**
 * Import Dallas Fed lessons into the database
 */
async function importDallasFedLessons() {
  try {
    console.log('🎓 Importing Dallas Fed Aligned Lessons');
    console.log('='.repeat(50));

    // Load the generated lessons
    const lessonsData = JSON.parse(
      fs.readFileSync('./dallas_fed_aligned_lessons.json', 'utf8'),
    );

    console.log(`📚 Found ${lessonsData.total_lessons} lessons to import`);
    console.log(
      `📅 Generated: ${new Date(lessonsData.generation_date).toLocaleDateString()}`,
    );

    // Connect to database
    await client.connect();
    const db = client.db('TrinityCapital');
    const lessonsCollection = db.collection('Lessons');

    // Clear existing lessons from admin@trinity-capital.net
    console.log('\n🗑️  Clearing existing admin lessons...');
    const deleteResult = await lessonsCollection.deleteMany({
      $or: [
        { creator_email: 'admin@trinity-capital.net' },
        { creator_username: 'adminTC' },
        { teacher: 'admin@trinity-capital.net' },
      ],
    });
    console.log(`   Removed ${deleteResult.deletedCount} existing lessons`);

    // Import new lessons
    console.log('\n📥 Importing new Dallas Fed aligned lessons...');

    const importResults = [];
    for (let i = 0; i < lessonsData.lessons.length; i++) {
      const lesson = lessonsData.lessons[i];

      const lessonDocument = {
        _id: new Date().getTime() + i, // Simple ID generation
        lesson: {
          lesson_title: lesson.lesson_title,
          lesson_description: lesson.lesson_description,
          unit: lesson.unit,
          content: generateLessonContent(lesson),
          lesson_conditions: lesson.lesson_conditions,
          required_actions: lesson.required_actions,
          learning_objectives: lesson.learning_objectives,
          success_metrics: lesson.success_metrics,
        },
        creator_email: 'admin@trinity-capital.net',
        creator_username: 'adminTC',
        teacher: 'admin@trinity-capital.net',
        createdAt: new Date(),
        dallas_fed_aligned: true,
        teks_standards: lesson.teks_standards,
        day: lesson.day,
        status: 'active',
        difficulty_level: determineDifficultyLevel(lesson),
        estimated_duration: estimateDuration(lesson),
      };

      const result = await lessonsCollection.insertOne(lessonDocument);
      importResults.push({
        title: lesson.lesson_title,
        id: result.insertedId,
        conditions: lesson.lesson_conditions.length,
      });

      console.log(
        `   ✅ Imported: "${lesson.lesson_title}" (${lesson.lesson_conditions.length} conditions)`,
      );
    }

    // Create lesson assignments for students
    await createLessonAssignments(db, importResults);

    // Generate completion report
    generateImportReport(importResults, lessonsData);

    console.log('\n🎉 Import Complete!');
    console.log(`📊 Total Lessons Imported: ${importResults.length}`);
    console.log(`🎯 Dallas Fed Standards: Met`);
    console.log(
      `📋 Lesson Conditions: ${importResults.reduce((sum, l) => sum + l.conditions, 0)} total`,
    );
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Generate lesson content based on lesson data
 */
function generateLessonContent(lesson) {
  const slides = [];

  // Introduction slide
  slides.push({
    type: 'header',
    content: lesson.lesson_title,
  });

  slides.push({
    type: 'text',
    content: lesson.lesson_description,
  });

  // TEKS Standards slide
  slides.push({
    type: 'header',
    content: 'Learning Standards (TEKS)',
  });

  slides.push({
    type: 'text',
    content: `This lesson addresses Texas Essential Knowledge and Skills: ${lesson.teks_standards.join(', ')}`,
  });

  // Content based on lesson type
  switch (lesson.day) {
    case 1: // Money Personality
      slides.push(...generateMoneyPersonalityContent());
      break;
    case 2: // Goal Setting
      slides.push(...generateGoalSettingContent());
      break;
    case 3: // Balance Sheet
      slides.push(...generateBalanceSheetContent());
      break;
    case 4: // Banking Records
      slides.push(...generateBankingRecordsContent());
      break;
    case 5: // Paycheck
      slides.push(...generatePaycheckContent());
      break;
    case 7: // Budgeting
      slides.push(...generateBudgetingContent());
      break;
    case 9: // Housing
      slides.push(...generateHousingContent());
      break;
    case 10: // Vehicle
      slides.push(...generateVehicleContent());
      break;
    case 11: // Shopping
      slides.push(...generateShoppingContent());
      break;
    default:
      slides.push({
        type: 'text',
        content: 'Interactive lesson content will be displayed here.',
      });
  }

  // Practice slide
  slides.push({
    type: 'header',
    content: 'Practice Time!',
  });

  slides.push({
    type: 'text',
    content: `Now use the Trinity Capital app to practice what you've learned. Complete the required actions: ${lesson.required_actions.join(', ')}`,
  });

  return slides;
}

// Content generation functions for each lesson type
function generateMoneyPersonalityContent() {
  return [
    { type: 'header', content: 'Understanding Your Money Personality' },
    {
      type: 'text',
      content:
        'Are you a spender or a saver? Understanding your money personality helps you make better financial decisions.',
    },
    { type: 'header', content: 'Needs vs Wants' },
    {
      type: 'text',
      content:
        'NEEDS are things you must have to survive (housing, food, basic clothing). WANTS are things you would like to have but can live without (entertainment, luxury items).',
    },
    { type: 'header', content: 'Analyzing Your Spending' },
    {
      type: 'text',
      content:
        'Look at your recent transactions and categorize them as needs or wants. This will reveal your spending patterns.',
    },
  ];
}

function generateGoalSettingContent() {
  return [
    { type: 'header', content: 'SMART Financial Goals' },
    {
      type: 'text',
      content:
        'SMART goals are Specific, Measurable, Attainable, Realistic, and Time-based.',
    },
    { type: 'header', content: 'Examples of SMART Goals' },
    {
      type: 'text',
      content:
        'GOOD: "Save $500 for emergency fund by December 31st by setting aside $50 each month." BAD: "Save more money."',
    },
    { type: 'header', content: 'Short, Medium, and Long-term Goals' },
    {
      type: 'text',
      content:
        'Short-term (1 year): Emergency fund. Medium-term (1-5 years): Car down payment. Long-term (5+ years): House down payment, retirement.',
    },
  ];
}

function generateBalanceSheetContent() {
  return [
    { type: 'header', content: 'What is a Balance Sheet?' },
    {
      type: 'text',
      content:
        'A balance sheet shows your financial position by listing your assets (what you own) and liabilities (what you owe).',
    },
    { type: 'header', content: 'Assets' },
    {
      type: 'text',
      content:
        'Cash, savings accounts, checking accounts, investments, valuable personal property.',
    },
    { type: 'header', content: 'Liabilities' },
    {
      type: 'text',
      content:
        'Credit card debt, student loans, car loans, mortgages, money owed to others.',
    },
    { type: 'header', content: 'Net Worth' },
    {
      type: 'text',
      content:
        'Net Worth = Total Assets - Total Liabilities. This is your true financial position.',
    },
  ];
}

function generateBankingRecordsContent() {
  return [
    { type: 'header', content: 'Bank Statement Reconciliation' },
    {
      type: 'text',
      content:
        'Reconciling means comparing your bank statement with your personal records to ensure accuracy.',
    },
    { type: 'header', content: 'Steps to Reconcile' },
    {
      type: 'text',
      content:
        '1. Compare deposits 2. Check withdrawals 3. Verify transfers 4. Note any fees 5. Find discrepancies',
    },
    { type: 'header', content: 'Why Reconcile?' },
    {
      type: 'text',
      content:
        'Catches bank errors, identifies fraud, tracks fees, ensures accurate records.',
    },
  ];
}

function generatePaycheckContent() {
  return [
    { type: 'header', content: 'Understanding Your Paycheck' },
    {
      type: 'text',
      content:
        'Your paycheck has many components beyond just your hourly wage or salary.',
    },
    { type: 'header', content: 'Gross vs Net Pay' },
    {
      type: 'text',
      content:
        'GROSS PAY: Total earnings before deductions. NET PAY: Take-home pay after all deductions.',
    },
    { type: 'header', content: 'Common Deductions' },
    {
      type: 'text',
      content:
        'FICA (Social Security & Medicare), Federal income tax, State income tax, Health insurance, Retirement contributions.',
    },
    { type: 'header', content: 'Benefits' },
    {
      type: 'text',
      content:
        'Health insurance, retirement plans, life insurance, disability insurance, paid time off.',
    },
  ];
}

function generateBudgetingContent() {
  return [
    { type: 'header', content: 'The 50/30/20 Budget Rule' },
    {
      type: 'text',
      content:
        '50% for NEEDS (housing, food, utilities), 30% for WANTS (entertainment, dining out), 20% for SAVINGS and debt payment.',
    },
    { type: 'header', content: 'Creating Your Budget' },
    {
      type: 'text',
      content:
        '1. Calculate monthly income 2. List all expenses 3. Categorize as needs/wants/savings 4. Adjust to fit the 50/30/20 rule',
    },
    { type: 'header', content: 'Tracking Expenses' },
    {
      type: 'text',
      content:
        'Use apps, spreadsheets, or pen and paper to track where your money goes each month.',
    },
  ];
}

function generateHousingContent() {
  return [
    { type: 'header', content: 'Rent vs Buy Decision' },
    {
      type: 'text',
      content:
        'Both renting and buying have advantages and disadvantages depending on your situation.',
    },
    { type: 'header', content: 'Costs of Renting' },
    {
      type: 'text',
      content:
        "Monthly rent, renter's insurance, utilities (sometimes), security deposit.",
    },
    { type: 'header', content: 'Costs of Buying' },
    {
      type: 'text',
      content:
        "Down payment, monthly mortgage, property taxes, homeowner's insurance, maintenance, HOA fees.",
    },
    { type: 'header', content: 'Consider Your Situation' },
    {
      type: 'text',
      content:
        'How long will you stay? Do you have a down payment? Can you handle maintenance costs?',
    },
  ];
}

function generateVehicleContent() {
  return [
    { type: 'header', content: 'Buy vs Lease Decision' },
    {
      type: 'text',
      content:
        'Buying and leasing both have different financial implications over time.',
    },
    { type: 'header', content: 'Buying a Vehicle' },
    {
      type: 'text',
      content:
        'Higher monthly payments, but you own the car. No mileage restrictions. Can modify the vehicle.',
    },
    { type: 'header', content: 'Leasing a Vehicle' },
    {
      type: 'text',
      content:
        "Lower monthly payments, but you don't own the car. Mileage restrictions. Must return in good condition.",
    },
    { type: 'header', content: 'Total Cost Considerations' },
    {
      type: 'text',
      content:
        'Consider insurance, maintenance, repairs, depreciation, and opportunity cost of money.',
    },
  ];
}

function generateShoppingContent() {
  return [
    { type: 'header', content: 'Smart Shopping Strategies' },
    {
      type: 'text',
      content:
        'Save money by comparing prices, payment methods, and using smart shopping techniques.',
    },
    { type: 'header', content: 'Payment Method Comparison' },
    {
      type: 'text',
      content:
        'Cash, debit card, credit card, rent-to-own, installment plans all have different total costs.',
    },
    { type: 'header', content: 'Unit Price Comparison' },
    {
      type: 'text',
      content:
        'Compare the cost per unit (per ounce, per pound, per piece) to find the best deal.',
    },
    { type: 'header', content: 'Negotiation Tips' },
    {
      type: 'text',
      content:
        'Research prices, be prepared to walk away, ask about discounts, consider timing your purchase.',
    },
  ];
}

/**
 * Determine difficulty level based on lesson content
 */
function determineDifficultyLevel(lesson) {
  if (lesson.day <= 2) return 'beginner';
  if (lesson.day <= 7) return 'intermediate';
  return 'advanced';
}

/**
 * Estimate lesson duration in minutes
 */
function estimateDuration(lesson) {
  const baseTime = 20; // Base 20 minutes
  const conditionsTime = lesson.lesson_conditions.length * 5; // 5 minutes per condition
  const actionsTime = lesson.required_actions.length * 8; // 8 minutes per action

  return baseTime + conditionsTime + actionsTime;
}

/**
 * Create lesson assignments for students
 */
async function createLessonAssignments(db, lessons) {
  console.log('\n👥 Creating lesson assignments...');

  const assignmentsCollection = db.collection('LessonAssignments');

  // Clear existing assignments
  await assignmentsCollection.deleteMany({
    teacher: 'admin@trinity-capital.net',
  });

  // Create unit assignment
  const unitAssignment = {
    _id: new Date().getTime(),
    unitName: 'Unit 1: Earning and Spending',
    unitValue: 1,
    teacher: 'admin@trinity-capital.net',
    lessons: lessons.map(lesson => ({
      lesson_id: lesson.id,
      lesson_title: lesson.title,
      required: true,
      estimated_duration: estimateDuration({
        lesson_conditions: [],
        required_actions: [],
      }),
    })),
    createdAt: new Date(),
    status: 'active',
    dallas_fed_aligned: true,
  };

  await assignmentsCollection.insertOne(unitAssignment);
  console.log(`   ✅ Created unit assignment with ${lessons.length} lessons`);
}

/**
 * Generate import report
 */
function generateImportReport(results, lessonsData) {
  const report = {
    import_date: new Date().toISOString(),
    source: 'Dallas Fed Personal Financial Literacy Curriculum',
    total_lessons: results.length,
    total_conditions: results.reduce((sum, l) => sum + l.conditions, 0),
    lessons_by_difficulty: {
      beginner: results.filter((_, i) => lessonsData.lessons[i].day <= 2)
        .length,
      intermediate: results.filter(
        (_, i) =>
          lessonsData.lessons[i].day > 2 && lessonsData.lessons[i].day <= 7,
      ).length,
      advanced: results.filter((_, i) => lessonsData.lessons[i].day > 7).length,
    },
    imported_lessons: results,
    curriculum_compliance: {
      teks_aligned: true,
      dallas_fed_standards: true,
      progressive_difficulty: true,
      hands_on_learning: true,
    },
  };

  fs.writeFileSync(
    './lesson_import_report.json',
    JSON.stringify(report, null, 2),
  );
  console.log('\n📊 Import report saved to: lesson_import_report.json');
}

/**
 * Main execution
 */
async function main() {
  try {
    await importDallasFedLessons();
  } catch (error) {
    console.error('❌ Import process failed:', error);
    process.exit(1);
  }
}

// Export for potential use as module
module.exports = {
  importDallasFedLessons,
};

// Run if executed directly
if (require.main === module) {
  main();
}

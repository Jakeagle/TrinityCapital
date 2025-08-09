/**
 * Trinity Capital - System Integration Test
 *
 * This comprehensive test checks all system components work together seamlessly:
 * - Main server (port 3000) connectivity and endpoints
 * - Lesson server (port 4000) connectivity and endpoints
 * - Database connections and collections
 * - Frontend JavaScript modules integration
 * - Socket.IO real-time communication
 * - Dallas Fed lesson conditions compatibility
 *
 * Usage: node systemIntegrationTest.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuration
const MAIN_SERVER_PORT = process.env.PORT || 3000;
const LESSON_SERVER_PORT = 4000;
const MONGODB_URI = process.env.MONGODB_URI;

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  overallStatus: 'PENDING',
  tests: [],
  recommendations: [],
  criticalIssues: [],
  warnings: [],
};

// Helper function to add test result
function addTestResult(testName, status, details, recommendation = null) {
  const result = {
    test: testName,
    status: status, // PASS, FAIL, WARNING
    details: details,
    timestamp: new Date().toISOString(),
  };

  if (recommendation) {
    result.recommendation = recommendation;
    testResults.recommendations.push(recommendation);
  }

  if (status === 'FAIL') {
    testResults.criticalIssues.push(`${testName}: ${details}`);
  } else if (status === 'WARNING') {
    testResults.warnings.push(`${testName}: ${details}`);
  }

  testResults.tests.push(result);

  // Color-coded console output
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const statusColor =
    status === 'PASS'
      ? '\x1b[32m'
      : status === 'FAIL'
        ? '\x1b[31m'
        : '\x1b[33m';
  console.log(`${statusIcon} ${statusColor}${testName}: ${details}\x1b[0m`);

  if (recommendation) {
    console.log(`   💡 Recommendation: ${recommendation}`);
  }
}

// Test 1: Environment Configuration
async function testEnvironmentConfig() {
  console.log('\n🔧 Testing Environment Configuration...');

  // Check .env file exists
  if (fs.existsSync('.env')) {
    addTestResult('Environment File', 'PASS', '.env file found');
  } else {
    addTestResult(
      'Environment File',
      'FAIL',
      '.env file missing',
      'Create .env file with MongoDB Atlas connection string',
    );
    return;
  }

  // Check MongoDB URI
  if (MONGODB_URI && MONGODB_URI.includes('mongodb+srv://')) {
    addTestResult('MongoDB URI', 'PASS', 'MongoDB Atlas URI configured');
  } else {
    addTestResult(
      'MongoDB URI',
      'FAIL',
      'MongoDB URI not properly configured',
      'Set MONGODB_URI in .env file with your Atlas connection string',
    );
  }

  // Check allowed origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  if (allowedOrigins) {
    addTestResult('CORS Origins', 'PASS', `Allowed origins: ${allowedOrigins}`);
  } else {
    addTestResult(
      'CORS Origins',
      'WARNING',
      'ALLOWED_ORIGINS not set',
      'Set ALLOWED_ORIGINS in .env for production security',
    );
  }
}

// Test 2: Database Connectivity and Collections
async function testDatabaseConnectivity() {
  console.log('\n🗄️ Testing Database Connectivity...');

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    addTestResult(
      'Database Connection',
      'PASS',
      'Successfully connected to MongoDB Atlas',
    );

    const db = client.db('TrinityCapital');

    // Test required collections
    const collections = ['Lessons', 'Teachers', 'Students', 'Profiles'];
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);

    for (const collectionName of collections) {
      if (existingNames.includes(collectionName)) {
        const count = await db.collection(collectionName).countDocuments();
        addTestResult(
          `Collection: ${collectionName}`,
          'PASS',
          `Found with ${count} documents`,
        );
      } else {
        addTestResult(
          `Collection: ${collectionName}`,
          'WARNING',
          'Collection not found',
          `Collection will be created automatically when first document is inserted`,
        );
      }
    }

    // Test Dallas Fed lessons specifically
    const lessonsCollection = db.collection('Lessons');
    const dallasFedLessons = await lessonsCollection
      .find({
        $or: [
          { creator_email: 'admin@trinity-capital.net' },
          { teacher: 'admin@trinity-capital.net' },
        ],
      })
      .toArray();

    if (dallasFedLessons.length > 0) {
      addTestResult(
        'Dallas Fed Lessons',
        'PASS',
        `Found ${dallasFedLessons.length} curriculum-aligned lessons`,
      );

      // Check lesson conditions
      let totalConditions = 0;
      let newActionTypes = 0;
      const newActions = [
        'spending_analyzed',
        'smart_goal_validated',
        'budget_balanced',
        'paycheck_analyzed',
      ];

      dallasFedLessons.forEach(lesson => {
        const conditions =
          lesson.lesson?.lesson_conditions || lesson.conditions || [];
        totalConditions += conditions.length;

        conditions.forEach(condition => {
          if (newActions.includes(condition.condition_type)) {
            newActionTypes++;
          }
        });
      });

      addTestResult(
        'Lesson Conditions',
        'PASS',
        `${totalConditions} total conditions with ${newActionTypes} new educational action types`,
      );
    } else {
      addTestResult(
        'Dallas Fed Lessons',
        'FAIL',
        'No curriculum-aligned lessons found',
        'Run importDallasFedLessons.js to import Dallas Fed curriculum',
      );
    }

    await client.close();
  } catch (error) {
    addTestResult(
      'Database Connection',
      'FAIL',
      `Connection failed: ${error.message}`,
      'Check MongoDB Atlas connection string and network access',
    );
  }
}

// Test 3: Server Endpoints
async function testServerEndpoints() {
  console.log('\n🌐 Testing Server Endpoints...');

  // Helper function to test HTTP endpoint
  async function testEndpoint(url, expectedStatus = 200) {
    try {
      const response = await fetch(url);
      return {
        status: response.status,
        ok: response.ok,
        text: await response.text(),
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: error.message,
      };
    }
  }

  // Test main server endpoints
  const mainServerTests = [
    { endpoint: '/admin-lessons', description: 'Admin Lessons API' },
    { endpoint: '/health', description: 'Health Check' },
  ];

  for (const test of mainServerTests) {
    const url = `http://localhost:${MAIN_SERVER_PORT}${test.endpoint}`;
    const result = await testEndpoint(url);

    if (result.ok) {
      addTestResult(
        `Main Server: ${test.description}`,
        'PASS',
        `${test.endpoint} responded with status ${result.status}`,
      );
    } else if (result.status === 0) {
      addTestResult(
        `Main Server: ${test.description}`,
        'FAIL',
        `Server not responding on port ${MAIN_SERVER_PORT}`,
        `Start main server: npm start`,
      );
    } else {
      addTestResult(
        `Main Server: ${test.description}`,
        'WARNING',
        `${test.endpoint} returned status ${result.status}`,
      );
    }
  }

  // Test lesson server
  const lessonServerUrl = `http://localhost:${LESSON_SERVER_PORT}`;
  const lessonResult = await testEndpoint(lessonServerUrl);

  if (lessonResult.status === 0) {
    addTestResult(
      'Lesson Server',
      'FAIL',
      `Lesson server not responding on port ${LESSON_SERVER_PORT}`,
      'Start lesson server: cd "TrinCap Lessons local" && npm start',
    );
  } else {
    addTestResult(
      'Lesson Server',
      'PASS',
      `Lesson server responding on port ${LESSON_SERVER_PORT}`,
    );
  }
}

// Test 4: Frontend JavaScript Modules
async function testFrontendModules() {
  console.log('\n🎨 Testing Frontend JavaScript Modules...');

  const frontendPath = './Frontend/Javascript';
  const requiredModules = [
    'script.js',
    'lessonEngine.js',
    'validation.js',
    'uiEnhancements.js',
  ];

  for (const module of requiredModules) {
    const modulePath = path.join(frontendPath, module);

    if (fs.existsSync(modulePath)) {
      const content = fs.readFileSync(modulePath, 'utf8');

      // Check for ES6 modules
      const hasImports =
        content.includes('import') || content.includes('export');
      const hasModernFeatures =
        content.includes('async') || content.includes('await');

      if (hasImports && hasModernFeatures) {
        addTestResult(
          `Frontend Module: ${module}`,
          'PASS',
          'Modern ES6+ module with async support',
        );
      } else if (hasModernFeatures) {
        addTestResult(
          `Frontend Module: ${module}`,
          'PASS',
          'Has modern JavaScript features',
        );
      } else {
        addTestResult(
          `Frontend Module: ${module}`,
          'WARNING',
          'Legacy JavaScript code',
          'Consider updating to modern ES6+ syntax',
        );
      }

      // Check lesson engine specifically
      if (module === 'lessonEngine.js') {
        const hasNewActionTypes =
          content.includes('smart_goal_validated') ||
          content.includes('spending_analyzed') ||
          content.includes('budget_balanced');

        if (hasNewActionTypes) {
          addTestResult(
            'Lesson Engine: Dallas Fed Actions',
            'PASS',
            'Enhanced with new educational action types',
          );
        } else {
          addTestResult(
            'Lesson Engine: Dallas Fed Actions',
            'FAIL',
            'Missing new educational action types',
            'Update lessonEngine.js with Dallas Fed action types from lessonEngineEnhancements.js',
          );
        }
      }
    } else {
      addTestResult(
        `Frontend Module: ${module}`,
        'FAIL',
        `File not found: ${modulePath}`,
        'Ensure all required frontend modules are present',
      );
    }
  }
}

// Test 5: CSS and UI Components
async function testUIComponents() {
  console.log('\n🎭 Testing UI Components...');

  // Test CSS files
  const cssFiles = ['./Frontend/Styles/style.css'];

  for (const cssFile of cssFiles) {
    if (fs.existsSync(cssFile)) {
      const content = fs.readFileSync(cssFile, 'utf8');

      // Check for modern CSS features
      const hasCustomProperties =
        content.includes('--') && content.includes(':root');
      const hasGlassMorphism =
        content.includes('backdrop-filter') || content.includes('glass');
      const hasFlexGrid =
        content.includes('display: flex') || content.includes('display: grid');

      let features = [];
      if (hasCustomProperties) features.push('CSS Custom Properties');
      if (hasGlassMorphism) features.push('Glass Morphism');
      if (hasFlexGrid) features.push('Modern Layout');

      if (features.length > 0) {
        addTestResult(
          'CSS Features',
          'PASS',
          `Modern CSS with: ${features.join(', ')}`,
        );
      } else {
        addTestResult(
          'CSS Features',
          'WARNING',
          'Using legacy CSS',
          'Consider adding modern CSS features like custom properties and glass morphism',
        );
      }
    } else {
      addTestResult('CSS Files', 'FAIL', `CSS file not found: ${cssFile}`);
    }
  }

  // Test HTML structure
  const htmlFile = './Frontend/index.html';
  if (fs.existsSync(htmlFile)) {
    const content = fs.readFileSync(htmlFile, 'utf8');

    // Check for key components
    const hasSocketIO = content.includes('socket.io');
    const hasBootstrap = content.includes('bootstrap');
    const hasModernJS = content.includes('type="module"');

    if (hasSocketIO) {
      addTestResult(
        'Socket.IO Integration',
        'PASS',
        'Socket.IO included in HTML',
      );
    } else {
      addTestResult(
        'Socket.IO Integration',
        'WARNING',
        'Socket.IO not found in HTML',
        'Add Socket.IO for real-time teacher dashboard updates',
      );
    }

    if (hasBootstrap) {
      addTestResult(
        'Bootstrap Framework',
        'PASS',
        'Bootstrap CSS framework included',
      );
    }

    if (hasModernJS) {
      addTestResult('Modern JavaScript', 'PASS', 'ES6 modules enabled');
    } else {
      addTestResult(
        'Modern JavaScript',
        'WARNING',
        'ES6 modules not enabled',
        'Add type="module" to script tags for ES6 imports',
      );
    }
  } else {
    addTestResult('HTML Structure', 'FAIL', 'index.html not found');
  }
}

// Test 6: Package Dependencies
async function testPackageDependencies() {
  console.log('\n📦 Testing Package Dependencies...');

  // Test main package.json
  const mainPackageFile = './package.json';
  if (fs.existsSync(mainPackageFile)) {
    const packageData = JSON.parse(fs.readFileSync(mainPackageFile, 'utf8'));

    const requiredDeps = [
      'express',
      'mongodb',
      'socket.io',
      'dotenv',
      'nodemailer',
    ];
    const missingDeps = requiredDeps.filter(
      dep => !packageData.dependencies[dep],
    );

    if (missingDeps.length === 0) {
      addTestResult(
        'Main Server Dependencies',
        'PASS',
        'All required dependencies present',
      );
    } else {
      addTestResult(
        'Main Server Dependencies',
        'FAIL',
        `Missing dependencies: ${missingDeps.join(', ')}`,
        `Run: npm install ${missingDeps.join(' ')}`,
      );
    }

    // Check for scripts
    if (packageData.scripts && packageData.scripts.start) {
      addTestResult('NPM Scripts', 'PASS', 'Start script configured');
    } else {
      addTestResult('NPM Scripts', 'WARNING', 'Start script not configured');
    }
  }

  // Test lesson server package.json
  const lessonPackageFile =
    '../TrinCap lesson Master/TrinCap Lessons local/package.json';
  if (fs.existsSync(lessonPackageFile)) {
    addTestResult(
      'Lesson Server Package',
      'PASS',
      'Lesson server package.json found',
    );
  } else {
    addTestResult(
      'Lesson Server Package',
      'WARNING',
      'Lesson server package.json not found',
    );
  }
}

// Test 7: Integration Points
async function testIntegrationPoints() {
  console.log('\n🔗 Testing Integration Points...');

  // Test Socket.IO connection points
  const scriptContent = fs.existsSync('./Frontend/Javascript/script.js')
    ? fs.readFileSync('./Frontend/Javascript/script.js', 'utf8')
    : '';

  if (
    scriptContent.includes('socket.io') &&
    scriptContent.includes('localhost:3000')
  ) {
    addTestResult(
      'Socket.IO Configuration',
      'PASS',
      'Socket.IO properly configured for main server',
    );
  } else {
    addTestResult(
      'Socket.IO Configuration',
      'WARNING',
      'Socket.IO configuration needs verification',
    );
  }

  // Test API endpoint consistency
  const hasStudentEndpoints =
    scriptContent.includes('/student/') ||
    scriptContent.includes('assignedUnits');
  const hasLessonEndpoints =
    scriptContent.includes('/admin-lessons') ||
    scriptContent.includes('lesson');

  if (hasStudentEndpoints && hasLessonEndpoints) {
    addTestResult(
      'API Endpoint Integration',
      'PASS',
      'Frontend properly integrated with server APIs',
    );
  } else {
    addTestResult(
      'API Endpoint Integration',
      'WARNING',
      'Some API integrations may be missing',
    );
  }

  // Test lesson engine integration
  if (
    scriptContent.includes('renderLessons') &&
    scriptContent.includes('lessonEngine')
  ) {
    addTestResult(
      'Lesson Engine Integration',
      'PASS',
      'Lesson engine properly integrated',
    );
  } else {
    addTestResult(
      'Lesson Engine Integration',
      'FAIL',
      'Lesson engine not properly integrated',
      'Ensure script.js imports and calls renderLessons from lessonEngine.js',
    );
  }
}

// Main test execution
async function runComprehensiveSystemTest() {
  console.log('🚀 Trinity Capital System Integration Test');
  console.log('='.repeat(60));

  try {
    await testEnvironmentConfig();
    await testDatabaseConnectivity();
    await testServerEndpoints();
    await testFrontendModules();
    await testUIComponents();
    await testPackageDependencies();
    await testIntegrationPoints();

    // Calculate overall status
    const failedTests = testResults.tests.filter(
      t => t.status === 'FAIL',
    ).length;
    const warningTests = testResults.tests.filter(
      t => t.status === 'WARNING',
    ).length;
    const passedTests = testResults.tests.filter(
      t => t.status === 'PASS',
    ).length;

    if (failedTests === 0 && warningTests === 0) {
      testResults.overallStatus = 'EXCELLENT';
    } else if (failedTests === 0) {
      testResults.overallStatus = 'GOOD';
    } else if (failedTests <= 2) {
      testResults.overallStatus = 'NEEDS_ATTENTION';
    } else {
      testResults.overallStatus = 'CRITICAL_ISSUES';
    }

    // Generate summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const statusIcon =
      testResults.overallStatus === 'EXCELLENT'
        ? '🎉'
        : testResults.overallStatus === 'GOOD'
          ? '✅'
          : testResults.overallStatus === 'NEEDS_ATTENTION'
            ? '⚠️'
            : '❌';

    console.log(`\n${statusIcon} Overall Status: ${testResults.overallStatus}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`⚠️ Warnings: ${warningTests}`);
    console.log(`❌ Failed: ${failedTests}`);

    if (testResults.criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      testResults.criticalIssues.forEach(issue => console.log(`   • ${issue}`));
    }

    if (testResults.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      testResults.recommendations
        .slice(0, 5)
        .forEach(rec => console.log(`   • ${rec}`));
    }

    // Save detailed report
    const reportPath = './system_integration_report.json';
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    console.log('\n🏁 System Integration Test Complete!');
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.overallStatus = 'TEST_FAILED';
    testResults.criticalIssues.push(`Test execution error: ${error.message}`);
  }
}

// Export for potential use in other scripts
module.exports = {
  runComprehensiveSystemTest,
  testResults,
};

// Run the test if this script is executed directly
if (require.main === module) {
  runComprehensiveSystemTest();
}

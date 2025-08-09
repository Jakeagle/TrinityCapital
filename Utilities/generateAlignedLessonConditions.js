/**
 * Trinity Capital - Dallas Fed Aligned Lesson Conditions Generator
 *
 * This script creates lesson conditions that align with the Dallas Fed Personal Financial Literacy
 * curriculum standards and provide clear learning paths for students using the Trinity Capital app.
 *
 * Based on: https://www.dallasfed.org/educate/pfl#tab1
 *
 * Usage: node generateAlignedLessonConditions.js
 */

// Dallas Fed PFL Curriculum Mapping
const dallasFedCurriculum = {
  unit1_earning_spending: {
    title: 'Unit 1: Earning and Spending',
    days: 13,
    lessons: [
      {
        day: 1,
        title: 'Money Personality',
        teks: ['1(A)', '1(B)'],
        description:
          'Differentiate between needs and wants; investigate money personality',
        trinity_actions: [
          'account_checked',
          'spending_analyzed',
          'lesson_content_viewed',
        ],
        conditions: [
          {
            condition_type: 'lesson_content_viewed',
            condition_value: { slidesViewed: 6, totalSlides: 8 },
            action_type: 'unlock_spending_analysis',
            action_details: {
              message:
                'Great! Now analyze your spending patterns using the app',
              highlight_element: '.bankingTools',
            },
          },
          {
            condition_type: 'account_checked',
            condition_value: {
              accountType: 'checking',
              transactions_reviewed: true,
            },
            action_type: 'personality_insight',
            action_details: {
              message:
                "Based on your account activity, identify whether you're a spender or saver",
              unlock_next_step: 'needs_vs_wants_exercise',
            },
          },
          {
            condition_type: 'spending_analyzed',
            condition_value: { categories_identified: 3 },
            action_type: 'complete_lesson',
            action_details: {
              score_bonus: 15,
              message: 'Excellent understanding of spending patterns!',
            },
          },
        ],
      },
      {
        day: 2,
        title: 'Financial Goal Setting',
        teks: ['1(C)'],
        description:
          'Develop SMART financial goals (specific, measurable, attainable, realistic, time-based)',
        trinity_actions: [
          'goal_set',
          'lesson_content_viewed',
          'smart_goal_validated',
        ],
        conditions: [
          {
            condition_type: 'lesson_content_viewed',
            condition_value: { slidesViewed: 5, totalSlides: 6 },
            action_type: 'unlock_goal_setter',
            action_details: {
              message:
                'Now practice setting SMART financial goals using the app',
              highlight_element: '.goalSection',
            },
          },
          {
            condition_type: 'goal_set',
            condition_value: { smartScore: 0.7, category: 'financial' },
            action_type: 'validate_smart_criteria',
            action_details: {
              message: "Let's check if your goal meets all SMART criteria",
              require_validation: true,
            },
          },
          {
            condition_type: 'smart_goal_validated',
            condition_value: { all_criteria_met: true },
            action_type: 'complete_lesson',
            action_details: {
              score_bonus: 20,
              message: "Outstanding! You've mastered SMART goal setting!",
            },
          },
        ],
      },
      {
        day: 3,
        title: 'Developing a Balance Sheet',
        teks: ['2(D)', '2(E)'],
        description:
          'Identify assets and liabilities; construct a balance sheet',
        trinity_actions: [
          'account_checked',
          'balance_sheet_created',
          'assets_liabilities_identified',
        ],
        conditions: [
          {
            condition_type: 'lesson_content_viewed',
            condition_value: { slidesViewed: 4, totalSlides: 5 },
            action_type: 'unlock_account_analysis',
            action_details: {
              message:
                'Review your accounts to identify assets and liabilities',
              highlight_element: '.accountSummary',
            },
          },
          {
            condition_type: 'account_checked',
            condition_value: {
              accountType: 'all_accounts',
              analysis_complete: true,
            },
            action_type: 'guide_balance_sheet',
            action_details: {
              message:
                'Now create your personal balance sheet using the app tools',
              provide_template: true,
            },
          },
          {
            condition_type: 'balance_sheet_created',
            condition_value: { assets_count: 2, liabilities_identified: true },
            action_type: 'complete_lesson',
            action_details: {
              score_bonus: 18,
              message: 'Excellent work on your balance sheet!',
            },
          },
        ],
      },
      {
        day: 4,
        title: 'Banking Records',
        teks: ['2(A)'],
        description: 'Reconcile bank statement with personal records',
        trinity_actions: [
          'account_checked',
          'transactions_reconciled',
          'deposit_verified',
        ],
        conditions: [
          {
            condition_type: 'lesson_content_viewed',
            condition_value: { slidesViewed: 3, totalSlides: 4 },
            action_type: 'unlock_reconciliation',
            action_details: {
              message:
                'Practice reconciling your account using the banking tools',
              highlight_element: '.transactionHistory',
            },
          },
          {
            condition_type: 'account_checked',
            condition_value: { transactions_reviewed: 5 },
            action_type: 'guide_reconciliation',
            action_details: {
              message: 'Compare these transactions with your records',
              provide_checklist: true,
            },
          },
          {
            condition_type: 'transactions_reconciled',
            condition_value: { accuracy_rate: 0.9 },
            action_type: 'complete_lesson',
            action_details: {
              score_bonus: 16,
              message: 'Great job reconciling your banking records!',
            },
          },
        ],
      },
      {
        day: 5,
        title: 'Understanding Your Paycheck',
        teks: ['3(A)', '3(B)', '3(C)'],
        description:
          'Calculate gross and net pay; identify benefits and deductions',
        trinity_actions: [
          'paycheck_analyzed',
          'deductions_calculated',
          'net_pay_computed',
        ],
        conditions: [
          {
            condition_type: 'lesson_content_viewed',
            condition_value: { slidesViewed: 6, totalSlides: 7 },
            action_type: 'unlock_paycheck_tool',
            action_details: {
              message: 'Use the paycheck calculator to understand deductions',
              highlight_element: '.paycheckCalculator',
            },
          },
          {
            condition_type: 'paycheck_analyzed',
            condition_value: {
              gross_pay_identified: true,
              benefits_reviewed: true,
            },
            action_type: 'calculate_deductions',
            action_details: {
              message:
                'Now calculate FICA, federal taxes, and other deductions',
              provide_calculator: true,
            },
          },
          {
            condition_type: 'net_pay_computed',
            condition_value: { calculation_accurate: true },
            action_type: 'complete_lesson',
            action_details: {
              score_bonus: 17,
              message: 'Perfect! You understand paycheck components!',
            },
          },
        ],
      },
      {
        day: 7,
        title: 'Developing a Budget',
        teks: ['2(B)', '2(C)', '2(F)'],
        description:
          'Track income and expenses; develop budget with financial goals',
        trinity_actions: [
          'budget_created',
          'income_tracked',
          'expenses_categorized',
          'budget_balanced',
        ],
        conditions: [
          {
            condition_type: 'lesson_content_viewed',
            condition_value: { slidesViewed: 7, totalSlides: 8 },
            action_type: 'unlock_budget_tool',
            action_details: {
              message: 'Create your first budget using the 50/30/20 rule',
              highlight_element: '.budgetTool',
            },
          },
          {
            condition_type: 'income_tracked',
            condition_value: { sources_identified: 1 },
            action_type: 'categorize_expenses',
            action_details: {
              message:
                'Now categorize your expenses into needs, wants, and savings',
              provide_categories: [
                'housing',
                'food',
                'transportation',
                'entertainment',
                'savings',
              ],
            },
          },
          {
            condition_type: 'expenses_categorized',
            condition_value: { categories_count: 5 },
            action_type: 'balance_budget',
            action_details: {
              message: "Ensure your expenses don't exceed your income",
              show_balance_indicator: true,
            },
          },
          {
            condition_type: 'budget_balanced',
            condition_value: { balanced: true, savings_included: true },
            action_type: 'complete_lesson',
            action_details: {
              score_bonus: 22,
              message:
                "Outstanding budget creation! You've mastered the 50/30/20 rule!",
            },
          },
        ],
      },
      {
        day: 9,
        title: 'Owning vs. Renting Housing',
        teks: ['4(A)'],
        description:
          'Analyze costs and benefits of owning versus renting housing',
        trinity_actions: [
          'cost_comparison_completed',
          'housing_calculator_used',
          'decision_justified',
        ],
        conditions: [
          {
            condition_type: 'lesson_content_viewed',
            condition_value: { slidesViewed: 5, totalSlides: 6 },
            action_type: 'unlock_housing_calculator',
            action_details: {
              message: 'Compare the total costs of renting vs buying',
              highlight_element: '.housingCalculator',
            },
          },
          {
            condition_type: 'housing_calculator_used',
            condition_value: {
              rent_calculated: true,
              mortgage_calculated: true,
            },
            action_type: 'analyze_long_term_costs',
            action_details: {
              message:
                'Consider long-term financial implications of each choice',
              show_comparison_chart: true,
            },
          },
          {
            condition_type: 'cost_comparison_completed',
            condition_value: { factors_considered: 4 },
            action_type: 'complete_lesson',
            action_details: {
              score_bonus: 19,
              message: 'Excellent analysis of housing costs!',
            },
          },
        ],
      },
      {
        day: 10,
        title: 'Owning vs. Leasing a Vehicle',
        teks: ['4(B)'],
        description:
          'Analyze costs and benefits of owning versus leasing a vehicle',
        trinity_actions: [
          'vehicle_calculator_used',
          'total_cost_compared',
          'financing_options_reviewed',
        ],
        conditions: [
          {
            condition_type: 'lesson_content_viewed',
            condition_value: { slidesViewed: 4, totalSlides: 5 },
            action_type: 'unlock_vehicle_calculator',
            action_details: {
              message: 'Calculate the true cost of buying vs leasing a car',
              highlight_element: '.vehicleCalculator',
            },
          },
          {
            condition_type: 'vehicle_calculator_used',
            condition_value: {
              purchase_calculated: true,
              lease_calculated: true,
            },
            action_type: 'review_financing',
            action_details: {
              message: 'Explore different financing options and their impact',
              show_loan_terms: true,
            },
          },
          {
            condition_type: 'total_cost_compared',
            condition_value: { comprehensive_analysis: true },
            action_type: 'complete_lesson',
            action_details: {
              score_bonus: 18,
              message: 'Great work analyzing vehicle financing options!',
            },
          },
        ],
      },
      {
        day: 11,
        title: 'Smart Shopping Strategies',
        teks: ['4(C)', '4(D)'],
        description:
          'Compare payment methods and apply smart shopping strategies',
        trinity_actions: [
          'payment_methods_compared',
          'unit_price_calculated',
          'savings_found',
        ],
        conditions: [
          {
            condition_type: 'lesson_content_viewed',
            condition_value: { slidesViewed: 6, totalSlides: 7 },
            action_type: 'unlock_shopping_tools',
            action_details: {
              message: 'Practice comparing prices and payment methods',
              highlight_element: '.shoppingTools',
            },
          },
          {
            condition_type: 'payment_methods_compared',
            condition_value: {
              methods_analyzed: 3,
              total_cost_calculated: true,
            },
            action_type: 'find_best_deals',
            action_details: {
              message: 'Use unit pricing and comparison tools to find savings',
              provide_comparison_tool: true,
            },
          },
          {
            condition_type: 'savings_found',
            condition_value: {
              amount_saved: 50,
              strategy_used: 'unit_pricing',
            },
            action_type: 'complete_lesson',
            action_details: {
              score_bonus: 20,
              message: "Excellent! You're now a savvy shopper!",
            },
          },
        ],
      },
    ],
  },
};

/**
 * Current Trinity Capital App Action Types
 * Based on lessonEngine.js analysis
 */
const trinityCapitalActions = {
  positive_actions: [
    'lesson_content_viewed',
    'deposit_made',
    'transfer_completed',
    'bill_paid',
    'investment_made',
    'budget_created',
    'goal_set',
    'account_checked',
    'help_used',
    'efficiency_bonus',
    'exploration_bonus',
    'creative_solution',
  ],
  negative_actions: [
    'financial_mistake',
    'incorrect_answer',
    'timeout_occurred',
    'multiple_attempts_failed',
  ],
  // New actions needed for Dallas Fed alignment
  required_new_actions: [
    'spending_analyzed',
    'smart_goal_validated',
    'balance_sheet_created',
    'assets_liabilities_identified',
    'transactions_reconciled',
    'paycheck_analyzed',
    'deductions_calculated',
    'net_pay_computed',
    'income_tracked',
    'expenses_categorized',
    'budget_balanced',
    'cost_comparison_completed',
    'housing_calculator_used',
    'vehicle_calculator_used',
    'payment_methods_compared',
    'unit_price_calculated',
    'savings_found',
  ],
};

/**
 * Generate optimized lesson conditions for each Dallas Fed lesson
 */
function generateOptimizedConditions() {
  console.log('🎓 Generating Dallas Fed Aligned Lesson Conditions');
  console.log('='.repeat(60));

  const optimizedLessons = [];

  dallasFedCurriculum.unit1_earning_spending.lessons.forEach(
    (lesson, index) => {
      console.log(`\n📚 Lesson ${lesson.day}: ${lesson.title}`);
      console.log(`TEKS: ${lesson.teks.join(', ')}`);
      console.log(`Description: ${lesson.description}`);

      const lessonData = {
        lesson_title: lesson.title,
        lesson_description: lesson.description,
        unit: 'Unit 1: Earning and Spending',
        day: lesson.day,
        teks_standards: lesson.teks,
        dallas_fed_aligned: true,
        creator_email: 'admin@trinity-capital.net',
        created_date: new Date().toISOString(),
        lesson_conditions: lesson.conditions.map(condition => ({
          ...condition,
          priority:
            condition.condition_type === 'lesson_content_viewed'
              ? 'high'
              : condition.action_type === 'complete_lesson'
                ? 'critical'
                : 'medium',
          auto_trigger: true,
          feedback_enabled: true,
          difficulty_adjusted: true,
        })),
        required_actions: lesson.trinity_actions,
        learning_objectives: generateLearningObjectives(lesson),
        assessment_criteria: generateAssessmentCriteria(lesson),
        success_metrics: {
          minimum_content_viewed: 0.75,
          minimum_app_usage_score: 60,
          required_actions_completed: lesson.trinity_actions.length,
          time_limit_minutes: 45,
        },
      };

      optimizedLessons.push(lessonData);

      // Display conditions analysis
      console.log(`\n  📋 Optimized Conditions (${lesson.conditions.length}):`);
      lesson.conditions.forEach((condition, condIndex) => {
        console.log(
          `    ${condIndex + 1}. ${condition.condition_type} → ${condition.action_type}`,
        );
        console.log(
          `       Value: ${JSON.stringify(condition.condition_value)}`,
        );
        console.log(`       Action: ${condition.action_details.message}`);
      });
    },
  );

  return optimizedLessons;
}

/**
 * Generate learning objectives based on lesson content
 */
function generateLearningObjectives(lesson) {
  const objectives = [];

  // Always include content understanding
  objectives.push(
    'Demonstrate understanding of lesson concepts through content review',
  );

  // Add specific objectives based on actions
  if (lesson.trinity_actions.includes('budget_created')) {
    objectives.push(
      'Create a balanced personal budget using the 50/30/20 rule',
    );
  }
  if (lesson.trinity_actions.includes('goal_set')) {
    objectives.push('Set SMART financial goals with specific criteria');
  }
  if (lesson.trinity_actions.includes('account_checked')) {
    objectives.push(
      'Analyze account information to understand financial position',
    );
  }
  if (
    lesson.trinity_actions.includes('deposit_made') ||
    lesson.trinity_actions.includes('transfer_completed')
  ) {
    objectives.push('Execute banking transactions safely and accurately');
  }

  return objectives;
}

/**
 * Generate assessment criteria
 */
function generateAssessmentCriteria(lesson) {
  return {
    content_mastery: 'Students must view at least 75% of lesson content',
    practical_application:
      'Students must complete hands-on activities using the app',
    concept_demonstration:
      'Students must demonstrate understanding through app usage',
    quality_standards: 'All actions must meet minimum quality thresholds',
    time_management: 'Lesson should be completed within allocated time frame',
  };
}

/**
 * Validate conditions against Trinity Capital capabilities
 */
function validateConditions(lessons) {
  console.log('\n🔍 Validating Conditions Against Trinity Capital App...');

  const validation_results = {
    supported_actions: [],
    new_actions_needed: [],
    potential_issues: [],
  };

  lessons.forEach(lesson => {
    lesson.required_actions.forEach(action => {
      if (trinityCapitalActions.positive_actions.includes(action)) {
        if (!validation_results.supported_actions.includes(action)) {
          validation_results.supported_actions.push(action);
        }
      } else if (trinityCapitalActions.required_new_actions.includes(action)) {
        if (!validation_results.new_actions_needed.includes(action)) {
          validation_results.new_actions_needed.push(action);
        }
      } else {
        validation_results.potential_issues.push({
          lesson: lesson.lesson_title,
          action: action,
          issue: 'Action type not defined in Trinity Capital system',
        });
      }
    });
  });

  console.log(
    `\n✅ Supported Actions (${validation_results.supported_actions.length}):`,
  );
  validation_results.supported_actions.forEach(action =>
    console.log(`   • ${action}`),
  );

  console.log(
    `\n🔨 New Actions Needed (${validation_results.new_actions_needed.length}):`,
  );
  validation_results.new_actions_needed.forEach(action =>
    console.log(`   • ${action}`),
  );

  if (validation_results.potential_issues.length > 0) {
    console.log(
      `\n⚠️  Potential Issues (${validation_results.potential_issues.length}):`,
    );
    validation_results.potential_issues.forEach(issue => {
      console.log(`   • ${issue.lesson}: ${issue.action} - ${issue.issue}`);
    });
  }

  return validation_results;
}

/**
 * Generate implementation recommendations
 */
function generateImplementationPlan(lessons, validation) {
  console.log('\n📋 Implementation Plan');
  console.log('='.repeat(40));

  console.log('\n1. Immediate Implementation (Existing Actions):');
  console.log(
    '   These lessons can be implemented immediately using current app features:',
  );

  lessons.forEach(lesson => {
    const supportedActions = lesson.required_actions.filter(action =>
      trinityCapitalActions.positive_actions.includes(action),
    );

    if (supportedActions.length > 0) {
      console.log(
        `   📚 ${lesson.lesson_title}: ${supportedActions.join(', ')}`,
      );
    }
  });

  console.log('\n2. Development Required (New Actions):');
  console.log('   These features need to be added to the Trinity Capital app:');

  const newActionsByPriority = {
    high: ['spending_analyzed', 'budget_balanced', 'smart_goal_validated'],
    medium: [
      'balance_sheet_created',
      'transactions_reconciled',
      'paycheck_analyzed',
    ],
    low: [
      'cost_comparison_completed',
      'housing_calculator_used',
      'vehicle_calculator_used',
    ],
  };

  Object.entries(newActionsByPriority).forEach(([priority, actions]) => {
    console.log(`\n   ${priority.toUpperCase()} Priority:`);
    actions.forEach(action => console.log(`     • ${action}`));
  });

  console.log('\n3. Recommended Implementation Order:');
  console.log('   Phase 1: Money Personality & Goal Setting (Days 1-2)');
  console.log('   Phase 2: Balance Sheet & Banking Records (Days 3-4)');
  console.log('   Phase 3: Paycheck & Budgeting (Days 5-7)');
  console.log('   Phase 4: Major Purchase Decisions (Days 9-11)');
}

/**
 * Export lessons for database insertion
 */
function exportLessons(lessons) {
  const fs = require('fs');
  const exportPath = './dallas_fed_aligned_lessons.json';

  const exportData = {
    curriculum_source: 'Dallas Fed Personal Financial Literacy',
    curriculum_url: 'https://www.dallasfed.org/educate/pfl#tab1',
    generation_date: new Date().toISOString(),
    total_lessons: lessons.length,
    lessons: lessons,
    implementation_notes: [
      'All lessons include progressive condition tracking',
      'Conditions are designed to guide students through hands-on learning',
      'Each lesson builds on previous knowledge and skills',
      'Success metrics align with educational standards',
      'Feedback is provided at each step to encourage learning',
    ],
  };

  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
  console.log(`\n💾 Lessons exported to: ${exportPath}`);
  console.log(`   Ready for import into Trinity Capital database`);

  return exportPath;
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🎯 Trinity Capital × Dallas Fed Curriculum Alignment');
    console.log('📅 Generated on:', new Date().toLocaleDateString());
    console.log(
      '📚 Source: Dallas Fed Personal Financial Literacy Standards\n',
    );

    // Generate optimized conditions
    const optimizedLessons = generateOptimizedConditions();

    // Validate against Trinity Capital capabilities
    const validation = validateConditions(optimizedLessons);

    // Generate implementation plan
    generateImplementationPlan(optimizedLessons, validation);

    // Export for database insertion
    const exportPath = exportLessons(optimizedLessons);

    console.log('\n🎉 Generation Complete!');
    console.log(`📊 Total Lessons: ${optimizedLessons.length}`);
    console.log(`✅ Ready Actions: ${validation.supported_actions.length}`);
    console.log(
      `🔨 New Actions Needed: ${validation.new_actions_needed.length}`,
    );

    return {
      lessons: optimizedLessons,
      validation: validation,
      exportPath: exportPath,
    };
  } catch (error) {
    console.error('❌ Error generating lesson conditions:', error);
    throw error;
  }
}

// Export for use in other modules
module.exports = {
  dallasFedCurriculum,
  trinityCapitalActions,
  generateOptimizedConditions,
  validateConditions,
  main,
};

// Run if executed directly
if (require.main === module) {
  main();
}

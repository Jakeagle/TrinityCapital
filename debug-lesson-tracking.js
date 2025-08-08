// Quick debug script to check lesson tracking state
// Run this in the browser console when a lesson is active

function debugLessonTracking() {
  console.log('=== LESSON TRACKING DEBUG ===');

  if (window.lessonTracker && window.lessonTracker.currentLesson) {
    console.log('✅ Current Lesson:', window.lessonTracker.currentLesson);
    console.log(
      '📋 Required Conditions:',
      window.lessonTracker.requiredConditions,
    );
    console.log(
      '✅ Positive Conditions Met:',
      window.lessonTracker.positiveConditionsMet,
    );
    console.log(
      '❌ Negative Conditions:',
      window.lessonTracker.negativeConditionsTriggered,
    );

    const metConditionTypes = window.lessonTracker.positiveConditionsMet.map(
      record => record.type,
    );
    console.log('🎯 Met Condition Types:', metConditionTypes);

    // Check if all required conditions are met
    if (window.lessonTracker.requiredConditions.length > 0) {
      const allRequiredMet = window.lessonTracker.requiredConditions.every(
        required => metConditionTypes.includes(required),
      );
      console.log('🏁 All Required Conditions Met:', allRequiredMet);

      // Show which conditions are missing
      const missingConditions = window.lessonTracker.requiredConditions.filter(
        required => !metConditionTypes.includes(required),
      );
      console.log('❓ Missing Conditions:', missingConditions);
    } else {
      console.log(
        'ℹ️ No specific required conditions - using default auto-completion logic',
      );

      // Check default completion logic
      const hasViewedContent = metConditionTypes.includes(
        'lesson_content_viewed',
      );
      const appActionTypes = metConditionTypes.filter(type =>
        [
          'deposit_made',
          'transfer_completed',
          'bill_paid',
          'investment_made',
          'budget_created',
          'goal_set',
          // Dallas Fed Aligned Actions
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
        ].includes(type),
      );

      console.log('📚 Has Viewed Content:', hasViewedContent);
      console.log('🔧 App Actions:', appActionTypes.length, appActionTypes);

      const isTestScenario = String(
        window.lessonTracker.currentLesson.id || '',
      ).startsWith('test_');
      const requiredWithContent = isTestScenario ? 3 : 2;
      const requiredWithoutContent = isTestScenario ? 4 : 3;

      console.log('🧪 Is Test Scenario:', isTestScenario);
      console.log('📊 Required Actions (with content):', requiredWithContent);
      console.log(
        '📊 Required Actions (without content):',
        requiredWithoutContent,
      );

      const shouldComplete =
        (hasViewedContent && appActionTypes.length >= requiredWithContent) ||
        appActionTypes.length >= requiredWithoutContent;

      console.log('🎯 Should Auto-Complete:', shouldComplete);
    }

    // Check lesson progress
    const progress = window.lessonTracker.getLessonProgress();
    console.log('📈 Current Progress:', progress);
  } else {
    console.log('❌ No active lesson found');
  }

  console.log('=== END DEBUG ===');
}

// Auto-run the debug function
debugLessonTracking();

// Also make it available for manual testing
window.debugLessonTracking = debugLessonTracking;

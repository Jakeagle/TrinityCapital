/**
 * Fix Money Personality lesson conditions to be realistic for students starting with $0
 * Students need to build up their accounts before we can check balances or do transfers
 */

const fs = require('fs');
const path = require('path');

// Updated Money Personality conditions that make sense for $0 starting balance
const REALISTIC_MONEY_PERSONALITY_CONDITIONS = [
  {
    condition_type: 'elapsed_time',
    condition_value: 30,
    action_type: 'show_tip',
    action_details: {
      message:
        "Welcome! First, let's set up your financial foundation. Start by adding an income source (like a paycheck) so you have money to work with.",
      priority: 'high',
    },
  },
  {
    condition_type: 'payment_created',
    condition_value: 1,
    action_type: 'praise_good_habit',
    action_details: {
      message:
        "Great! You've added income. Now add a bill or expense to see how you manage money. This reveals your spending personality.",
      priority: 'medium',
    },
  },
  {
    condition_type: 'bill_created',
    condition_value: 1,
    action_type: 'suggest_action',
    action_details: {
      message:
        'Perfect! Now you have both income and expenses. Try switching between your checking and savings accounts to explore your options.',
      priority: 'medium',
    },
  },
  {
    condition_type: 'account_switched',
    condition_value: 2,
    action_type: 'send_message',
    action_details: {
      message:
        'Good exploration! Notice how your income flows into checking first. Do you prefer to keep money easily accessible (spender) or move it to savings (saver)?',
      priority: 'medium',
    },
  },
  {
    condition_type: 'transfer_completed',
    condition_value: 1,
    action_type: 'complete_lesson',
    action_details: {
      message:
        "Excellent! You've demonstrated your money personality by managing income, expenses, and savings. You understand the flow of money!",
      score_bonus: 15,
      priority: 'critical',
    },
  },
];

// Also update other lessons that might have similar issues
const LESSON_UPDATES = {
  'Money Personality': REALISTIC_MONEY_PERSONALITY_CONDITIONS,

  'Financial Goal Setting': [
    {
      condition_type: 'elapsed_time',
      condition_value: 30,
      action_type: 'suggest_action',
      action_details: {
        message:
          'Goal setting works best when you know your financial situation. Start by adding income and expenses to understand what you can realistically achieve.',
        priority: 'medium',
      },
    },
    {
      condition_type: 'payment_created',
      condition_value: 1,
      action_type: 'send_message',
      action_details: {
        message:
          'Good! Now that you have income, you can set realistic financial goals. What would you like to save for?',
        priority: 'medium',
      },
    },
    {
      condition_type: 'goal_set_specific',
      condition_value: 1,
      action_type: 'validate_smart_goal',
      action_details: {
        message:
          "Great start! Let's make sure your goal is SMART: Specific, Measurable, Achievable, Relevant, and Time-bound.",
        priority: 'high',
      },
    },
    {
      condition_type: 'goal_has_deadline',
      condition_value: 1,
      action_type: 'challenge_save_amount',
      action_details: {
        message:
          'Perfect! Time-bound goals are more achievable. Now try making a small transfer to savings to start working toward your goal.',
        priority: 'high',
      },
    },
    {
      condition_type: 'transfer_completed',
      condition_value: 1,
      action_type: 'complete_lesson',
      action_details: {
        message:
          "Outstanding! You've set a SMART goal and taken action toward it. This is how successful financial planning works!",
        score_bonus: 18,
        priority: 'critical',
      },
    },
  ],

  'Developing a Budget': [
    {
      condition_type: 'elapsed_time',
      condition_value: 45,
      action_type: 'suggest_action',
      action_details: {
        message:
          'Budgeting starts with knowing your income and expenses. Add at least one income source first.',
        priority: 'medium',
      },
    },
    {
      condition_type: 'payment_created',
      condition_value: 1,
      action_type: 'challenge_create_bill',
      action_details: {
        message:
          'Excellent! Now add your monthly expenses like rent, utilities, food, or transportation.',
        priority: 'high',
      },
    },
    {
      condition_type: 'bill_created',
      condition_value: 1,
      action_type: 'show_calculation',
      action_details: {
        message:
          'Great! You can see your income minus expenses. If positive, you have money to save. If negative, you need to adjust.',
        priority: 'high',
      },
    },
    {
      condition_type: 'budget_positive_above',
      condition_value: 50,
      action_type: 'praise_good_habit',
      action_details: {
        message:
          'Excellent budgeting! You have surplus money. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.',
        priority: 'high',
      },
    },
    {
      condition_type: 'transfer_completed',
      condition_value: 1,
      action_type: 'complete_lesson',
      action_details: {
        message:
          "Perfect! You've created a balanced budget and started saving. This is smart financial management!",
        score_bonus: 20,
        priority: 'critical',
      },
    },
  ],
};

function updateRealisticConditions() {
  try {
    const filePath = path.join(__dirname, 'dallas_fed_aligned_lessons.json');

    // Read current file
    const currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(
      `📄 Updating lesson conditions for realistic $0 starting balance...`,
    );

    // Update specific lessons with realistic conditions
    currentData.lessons.forEach((lesson, index) => {
      const lessonTitle = lesson.lesson_title;
      const updatedConditions = LESSON_UPDATES[lessonTitle];

      if (updatedConditions) {
        lesson.lesson_conditions = updatedConditions;
        console.log(
          `✅ Updated ${lessonTitle} with realistic progression (${updatedConditions.length} conditions)`,
        );

        // Show the progression for Money Personality as example
        if (lessonTitle === 'Money Personality') {
          console.log(
            '   Progression: Income → Expenses → Account exploration → Transfer → Complete',
          );
        }
      }
    });

    // Update metadata
    currentData.last_updated = new Date().toISOString();
    currentData.update_description =
      'Updated conditions for realistic $0 starting balance - students build up accounts progressively';

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));

    console.log('\n🎉 Lesson conditions updated for realistic progression!');
    console.log('\nKey improvements:');
    console.log('• Students start by adding income (not checking balances)');
    console.log(
      '• Progressive building: Income → Expenses → Exploration → Goals',
    );
    console.log('• No impossible tasks (transfers with $0 balance)');
    console.log('• Logical flow that teaches financial fundamentals');
    console.log('• All conditions achievable from zero starting point');
  } catch (error) {
    console.error('❌ Error updating conditions:', error);
  }
}

// Run the update
updateRealisticConditions();

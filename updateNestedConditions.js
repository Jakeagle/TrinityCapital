/**
 * Update NESTED lesson conditions to match teacher dashboard capabilities
 */

const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection
const uri =
  'mongodb+srv://JakobFerguson:XbdHM2FJsjg4ajiO@trinitycapitalproductio.1yr5eaa.mongodb.net/?retryWrites=true&w=majority&appName=TrinityCapitalProduction';
const client = new MongoClient(uri);

// Progressive lesson condition templates based on lesson topics
const LESSON_CONDITION_TEMPLATES = {
  'Money Personality': [
    {
      condition_type: 'elapsed_time',
      condition_value: 60,
      action_type: 'show_tip',
      action_details: {
        message:
          'Take your time to reflect on your spending habits. Look at your account balance and recent transactions.',
        priority: 'low',
      },
    },
    {
      condition_type: 'account_switched',
      condition_value: 1,
      action_type: 'praise_good_habit',
      action_details: {
        message:
          'Great! Exploring both your checking and savings accounts helps you understand your financial picture.',
        priority: 'medium',
      },
    },
    {
      condition_type: 'checking_balance_above',
      condition_value: 1000,
      action_type: 'send_message',
      action_details: {
        message:
          'You seem to keep a good amount in checking. Are you more of a spender who likes quick access to money?',
        priority: 'medium',
      },
    },
    {
      condition_type: 'savings_balance_above',
      condition_value: 500,
      action_type: 'send_message',
      action_details: {
        message:
          'Nice savings balance! This suggests you might be more of a saver personality type.',
        priority: 'medium',
      },
    },
    {
      condition_type: 'total_transactions_above',
      condition_value: 3,
      action_type: 'complete_lesson',
      action_details: {
        message:
          "Excellent exploration of your financial activity! You've demonstrated understanding of your money personality.",
        score_bonus: 10,
        priority: 'critical',
      },
    },
  ],

  'Financial Goal Setting': [
    {
      condition_type: 'elapsed_time',
      condition_value: 45,
      action_type: 'highlight_feature',
      action_details: {
        message: 'Try setting a financial goal using the app features.',
        feature: 'goal_setting',
        priority: 'medium',
      },
    },
    {
      condition_type: 'goal_set_specific',
      condition_value: 1,
      action_type: 'validate_smart_goal',
      action_details: {
        message:
          "Good start! Now let's make sure your goal meets all SMART criteria.",
        priority: 'high',
      },
    },
    {
      condition_type: 'goal_has_deadline',
      condition_value: 1,
      action_type: 'praise_good_habit',
      action_details: {
        message:
          'Excellent! Setting a deadline makes your goal time-bound and achievable.',
        priority: 'medium',
      },
    },
    {
      condition_type: 'savings_balance_above',
      condition_value: 200,
      action_type: 'challenge_save_amount',
      action_details: {
        message: 'Challenge: Try to save an additional $100 toward your goal!',
        amount: 100,
        priority: 'high',
      },
    },
    {
      condition_type: 'smart_goal_completed',
      condition_value: 1,
      action_type: 'complete_lesson',
      action_details: {
        message: "Outstanding! You've mastered SMART goal setting!",
        score_bonus: 15,
        priority: 'critical',
      },
    },
  ],

  'Developing a Balance Sheet': [
    {
      condition_type: 'elapsed_time',
      condition_value: 30,
      action_type: 'suggest_action',
      action_details: {
        message:
          'Start by reviewing both your checking and savings accounts to identify your assets.',
        priority: 'medium',
      },
    },
    {
      condition_type: 'account_switched',
      condition_value: 2,
      action_type: 'send_message',
      action_details: {
        message:
          "Good! You're reviewing both accounts. Your account balances are assets on your balance sheet.",
        priority: 'medium',
      },
    },
    {
      condition_type: 'total_bills_above',
      condition_value: 1,
      action_type: 'explain_consequence',
      action_details: {
        message:
          'Your bills represent liabilities (money you owe). Add them to identify your total liabilities.',
        priority: 'high',
      },
    },
    {
      condition_type: 'budget_positive_above',
      condition_value: 100,
      action_type: 'show_calculation',
      action_details: {
        message:
          'Great! A positive budget means your assets exceed your liabilities.',
        priority: 'high',
      },
    },
    {
      condition_type: 'budget_negative',
      condition_value: 1,
      action_type: 'warn_poor_choice',
      action_details: {
        message:
          'Warning: A negative budget means your liabilities exceed your income. Consider reducing bills or increasing income.',
        priority: 'critical',
      },
    },
    {
      condition_type: 'income_count_above',
      condition_value: 1,
      action_type: 'complete_lesson',
      action_details: {
        message:
          'Excellent work creating your balance sheet! You understand assets, liabilities, and net worth.',
        score_bonus: 12,
        priority: 'critical',
      },
    },
  ],

  'Banking Records': [
    {
      condition_type: 'elapsed_time',
      condition_value: 30,
      action_type: 'highlight_feature',
      action_details: {
        message:
          'Use the transaction history feature to review your recent banking activity.',
        feature: 'transaction_history',
        priority: 'medium',
      },
    },
    {
      condition_type: 'total_transactions_above',
      condition_value: 5,
      action_type: 'send_message',
      action_details: {
        message:
          "Good! You're actively reviewing your transaction history. This is key to reconciling records.",
        priority: 'medium',
      },
    },
    {
      condition_type: 'transfer_completed',
      condition_value: 1,
      action_type: 'show_tip',
      action_details: {
        message:
          'Each transfer creates a record in both accounts. Make sure to track both sides of the transaction.',
        priority: 'high',
      },
    },
    {
      condition_type: 'deposit_completed',
      condition_value: 1,
      action_type: 'explain_consequence',
      action_details: {
        message:
          'Deposits increase your account balance. Record the date, amount, and source for accurate reconciliation.',
        priority: 'high',
      },
    },
    {
      condition_type: 'account_switched',
      condition_value: 3,
      action_type: 'complete_lesson',
      action_details: {
        message:
          "Excellent! You've thoroughly reviewed your banking records across multiple accounts.",
        score_bonus: 8,
        priority: 'critical',
      },
    },
  ],

  'Understanding Your Paycheck': [
    {
      condition_type: 'elapsed_time',
      condition_value: 45,
      action_type: 'show_tip',
      action_details: {
        message:
          'Think about the difference between gross pay (before deductions) and net pay (take-home).',
        priority: 'medium',
      },
    },
    {
      condition_type: 'payment_created',
      condition_value: 1,
      action_type: 'send_message',
      action_details: {
        message:
          'Good! Adding income sources helps you understand where your paycheck money comes from.',
        priority: 'medium',
      },
    },
    {
      condition_type: 'total_income_above',
      condition_value: 2000,
      action_type: 'show_calculation',
      action_details: {
        message:
          "With $2000+ income, let's calculate: if taxes are 15%, your net pay would be about $1700.",
        priority: 'high',
      },
    },
    {
      condition_type: 'bill_created',
      condition_value: 1,
      action_type: 'explain_consequence',
      action_details: {
        message:
          'Bills are like paycheck deductions - they reduce your take-home money for necessities.',
        priority: 'medium',
      },
    },
    {
      condition_type: 'budget_positive_above',
      condition_value: 200,
      action_type: 'complete_lesson',
      action_details: {
        message:
          'Perfect! You understand how gross pay, deductions, and net pay work together.',
        score_bonus: 10,
        priority: 'critical',
      },
    },
  ],

  'Developing a Budget': [
    {
      condition_type: 'elapsed_time',
      condition_value: 60,
      action_type: 'suggest_action',
      action_details: {
        message:
          'Start by adding your income sources, then add your monthly bills and expenses.',
        priority: 'medium',
      },
    },
    {
      condition_type: 'payment_created',
      condition_value: 1,
      action_type: 'challenge_create_bill',
      action_details: {
        message:
          'Great start on income! Now add some bills like rent, utilities, or phone service.',
        priority: 'high',
      },
    },
    {
      condition_type: 'bills_count_above',
      condition_value: 2,
      action_type: 'show_calculation',
      action_details: {
        message:
          'Good! With multiple bills, you can see how expenses add up. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.',
        priority: 'high',
      },
    },
    {
      condition_type: 'budget_negative',
      condition_value: 1,
      action_type: 'warn_poor_choice',
      action_details: {
        message:
          'Warning: Your expenses exceed income! Try reducing bills or finding additional income sources.',
        priority: 'critical',
      },
    },
    {
      condition_type: 'savings_balance_above',
      condition_value: 300,
      action_type: 'praise_good_habit',
      action_details: {
        message:
          "Excellent! You're building savings as part of your budget. This follows the 20% savings rule.",
        priority: 'high',
      },
    },
    {
      condition_type: 'budget_positive_above',
      condition_value: 100,
      action_type: 'complete_lesson',
      action_details: {
        message:
          "Outstanding! You've created a balanced budget with surplus for savings!",
        score_bonus: 15,
        priority: 'critical',
      },
    },
  ],

  'Owning vs. Renting Housing': [
    {
      condition_type: 'elapsed_time',
      condition_value: 45,
      action_type: 'suggest_action',
      action_details: {
        message:
          'Consider your current financial situation. Review your budget to understand what you can afford.',
        priority: 'medium',
      },
    },
    {
      condition_type: 'budget_positive_above',
      condition_value: 500,
      action_type: 'challenge_save_amount',
      action_details: {
        message:
          'Challenge: Save money for a down payment! Even $50 is a good start.',
        amount: 50,
        priority: 'high',
      },
    },
    {
      condition_type: 'savings_balance_above',
      condition_value: 1000,
      action_type: 'send_message',
      action_details: {
        message:
          'Great savings! With $1000+, you could consider a down payment fund for buying.',
        priority: 'high',
      },
    },
    {
      condition_type: 'total_bills_above',
      condition_value: 3,
      action_type: 'explain_consequence',
      action_details: {
        message:
          'With multiple bills, renting might offer more flexibility. Buying adds property taxes and maintenance costs.',
        priority: 'high',
      },
    },
    {
      condition_type: 'goal_set_specific',
      condition_value: 1,
      action_type: 'complete_lesson',
      action_details: {
        message:
          "Excellent! You've set housing goals and understand the financial implications.",
        score_bonus: 12,
        priority: 'critical',
      },
    },
  ],

  'Owning vs. Leasing a Vehicle': [
    {
      condition_type: 'elapsed_time',
      condition_value: 30,
      action_type: 'highlight_feature',
      action_details: {
        message:
          'Look at your transportation costs in your budget. How much can you afford monthly?',
        feature: 'budget_analysis',
        priority: 'medium',
      },
    },
    {
      condition_type: 'budget_positive_above',
      condition_value: 200,
      action_type: 'show_calculation',
      action_details: {
        message:
          'With $200+ surplus, you could afford $150-200/month for vehicle payments.',
        priority: 'medium',
      },
    },
    {
      condition_type: 'loan_taken',
      condition_value: 1,
      action_type: 'explain_consequence',
      action_details: {
        message:
          "Taking a loan means you'll pay interest. Leasing often has lower monthly payments but no ownership.",
        priority: 'high',
      },
    },
    {
      condition_type: 'savings_balance_above',
      condition_value: 2000,
      action_type: 'praise_good_habit',
      action_details: {
        message:
          'Excellent emergency fund! This gives you flexibility to buy with a larger down payment.',
        priority: 'high',
      },
    },
    {
      condition_type: 'multiple_goals_active',
      condition_value: 1,
      action_type: 'complete_lesson',
      action_details: {
        message:
          'Outstanding! You understand how vehicle financing fits into your overall financial goals.',
        score_bonus: 10,
        priority: 'critical',
      },
    },
  ],

  'Smart Shopping Strategies': [
    {
      condition_type: 'elapsed_time',
      condition_value: 45,
      action_type: 'suggest_action',
      action_details: {
        message:
          'Review your recent purchases in your transaction history. Look for patterns in your spending.',
        priority: 'medium',
      },
    },
    {
      condition_type: 'total_transactions_above',
      condition_value: 3,
      action_type: 'send_message',
      action_details: {
        message:
          "Good! You're reviewing your spending patterns. Can you identify needs vs. wants?",
        priority: 'medium',
      },
    },
    {
      condition_type: 'budget_negative',
      condition_value: 1,
      action_type: 'warn_poor_choice',
      action_details: {
        message:
          'Warning: Your spending exceeds income. Smart shopping means staying within budget!',
        priority: 'critical',
      },
    },
    {
      condition_type: 'savings_balance_above',
      condition_value: 100,
      action_type: 'praise_good_habit',
      action_details: {
        message:
          "Excellent! You're saving money through smart shopping choices.",
        priority: 'high',
      },
    },
    {
      condition_type: 'goal_set_specific',
      condition_value: 1,
      action_type: 'complete_lesson',
      action_details: {
        message:
          "Outstanding! You've set savings goals and understand smart shopping strategies.",
        score_bonus: 11,
        priority: 'critical',
      },
    },
  ],
};

async function updateNestedLessonConditions() {
  try {
    await client.connect();
    console.log('📊 Connected to MongoDB Atlas');

    const lessonsCollection = client.db('TrinityCapital').collection('Lessons');

    // Get all lessons
    const lessons = await lessonsCollection.find({}).toArray();
    console.log(`📚 Found ${lessons.length} lessons to update`);

    for (const lesson of lessons) {
      const lessonTitle = lesson.lesson?.lesson_title || 'Unknown Lesson';
      console.log(`\n🔄 Processing: ${lessonTitle}`);

      // Get template conditions for this lesson
      let newConditions = LESSON_CONDITION_TEMPLATES[lessonTitle];

      if (!newConditions) {
        console.log(
          `  ⚠️  No specific template found for "${lessonTitle}", using progressive default conditions`,
        );
        // Default progressive conditions for unknown lessons
        newConditions = [
          {
            condition_type: 'elapsed_time',
            condition_value: 60,
            action_type: 'show_tip',
            action_details: {
              message:
                'Take time to explore the app features related to this lesson topic.',
              priority: 'medium',
            },
          },
          {
            condition_type: 'account_switched',
            condition_value: 1,
            action_type: 'send_message',
            action_details: {
              message:
                'Good! Exploring your accounts helps you understand your financial position.',
              priority: 'medium',
            },
          },
          {
            condition_type: 'total_transactions_above',
            condition_value: 2,
            action_type: 'complete_lesson',
            action_details: {
              message:
                "Well done! You've engaged with the lesson material and practiced using the app.",
              score_bonus: 5,
              priority: 'critical',
            },
          },
        ];
      } else {
        console.log(
          `  ✨ Applied specialized template with ${newConditions.length} progressive conditions`,
        );
      }

      // Update the NESTED lesson conditions in lesson.lesson_conditions
      if (lesson.lesson) {
        lesson.lesson.lesson_conditions = newConditions;
        lesson.lesson.required_actions = newConditions.map(
          c => c.condition_type,
        );
        lesson.lesson.success_metrics = {
          minimum_conditions_met: Math.max(
            2,
            Math.floor(newConditions.length * 0.7),
          ),
          time_limit_minutes: 30,
          engagement_score_minimum: 60,
        };
      }

      // Also update top-level for consistency
      lesson.lesson_conditions = newConditions;
      lesson.required_actions = newConditions.map(c => c.condition_type);
      lesson.success_metrics = {
        minimum_conditions_met: Math.max(
          2,
          Math.floor(newConditions.length * 0.7),
        ),
        time_limit_minutes: 30,
        engagement_score_minimum: 60,
      };

      lesson.updated_at = new Date().toISOString();
      lesson.condition_alignment = 'teacher_dashboard_compatible';

      // Update in database
      await lessonsCollection.replaceOne({ _id: lesson._id }, lesson);

      console.log(
        `✅ Updated both nested and top-level conditions for ${lessonTitle}`,
      );
    }

    console.log('\n🎉 All lesson conditions updated successfully!');
    console.log('\nUpdated features:');
    console.log('• Progressive condition sequences');
    console.log('• Engagement-focused actions');
    console.log('• Positive and negative feedback');
    console.log('• Research and experimentation requirements');
    console.log('• Teacher dashboard compatibility');
    console.log('• Both nested and top-level conditions aligned');
  } catch (error) {
    console.error('❌ Error updating lessons:', error);
  } finally {
    await client.close();
    console.log('📊 Database connection closed');
  }
}

// Run the update
updateNestedLessonConditions();

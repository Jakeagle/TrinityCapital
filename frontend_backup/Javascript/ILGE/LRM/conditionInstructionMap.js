export const conditionInstructionMap = {
  "Account Balance Conditions": {
    "bank_balance_above": {
      "instruction": "Try to get your total balance above [value]. You can do this by depositing money or transferring money from other accounts."
    },
    "bank_balance_below": {
      "instruction": "Your total balance is below [value]. Try to increase your savings to get above this threshold."
    },
    "checking_balance_above": {
      "instruction": "Get your checking balance is above [value]. You can deposit or transfer money into your checking account."
    },
    "checking_balance_below": {
      "instruction": "Your checking balance is below [value]. Let's work on increasing it by depositing or transferring money."
    },
    "savings_balance_above": {
      "instruction": "Get your savings are above [value]. You're on the right track."
    },
    "savings_balance_below": {
      "instruction": "Your savings are below [value]. Aim to save more to get above this threshold."
    },
    "balance_ratio_savings_above": {
      "instruction": "Get your savings to checking ratio is above [value]. This is a good sign of financial health."
    }
  },
  "Transaction Activity": {
    "transfer_completed": {
      "instruction": "Click on the Transfer button to complete a transfer. Be sure you have enough money in the from account."
    },
    "transfer_amount_above": {
      "instruction": "Transfer over [value] in a single transaction."
    },
    "deposit_completed": {
      "instruction": "Make a deposit of any amount."
    },
    "deposit_amount_above": {
      "instruction": "Deposit more than [value] in a single transaction."
    },
    "money_sent": {
      "instruction": "Send money to a peer."
    },
    "money_received": {
      "instruction": "Receive money from a peer."
    },
    "total_transactions_above": {
      "instruction": "Make over [value] total transactions. This can include transfers, deposits, and sending money."
    }
  },
  "Bills & Budget Management": {
    "bill_created": {
      "instruction": "Create a bill to track your expenses."
    },
    "payment_created": {
      "instruction": "Add a payment or income source."
    },
    "total_bills_above": {
      "instruction": "Your total monthly bills are over [value]. Make sure to budget accordingly."
    },
    "total_income_above": {
      "instruction": "Get your total monthly income is over [value]."
    },
    "budget_negative": {
      "instruction": "Your budget is negative, meaning you're spending more than you earn. Let's adjust your budget to be positive."
    },
    "budget_positive_above": {
      "instruction": "Get your budget surplus is over [value]. You're doing a great job of managing your money."
    },
    "bills_count_above": {
      "instruction": "Create more than [value] bills. Keep track of them to stay on top of your finances."
    },
    "income_count_above": {
      "instruction": "Add more than [value] income sources. Diversifying your income is a smart move."
    }
  },
  "Account Usage Patterns": {
    "account_switched": {
      "instruction": "Switch between accounts. This is a useful feature for managing your finances."
    },
    "checking_used_more": {
      "instruction": "Use your checking account more than your savings account."
    },
    "savings_used_more": {
      "instruction": "Use your savings account more than your checking account."
    },
    "account_type_active": {
      "instruction": "View the [value] account. Explore all the features available to you."
    }
  },
  "Time & Engagement": {
    "elapsed_time": {
      "instruction": "Spend over [value] seconds on this lesson. Keep up the great work!"
    },
    "lesson_revisited": {
      "instruction": "Revisit a lesson to reinforce your learning."
    },
    "lesson_completion_trigger": {
      "instruction": "Meet the condition to complete the lesson."
    }
  },
  "SMART Goals & Planning": {
    "goal_set_specific": {
      "instruction": "Set a specific goal."
    },
    "goal_set_measurable": {
      "instruction": "Set a measurable goal."
    },
    "goal_has_deadline": {
      "instruction": "Set a goal with a deadline."
    },
    "goal_progress_tracked": {
      "instruction": "Track your goal progress."
    },
    "smart_goal_completed": {
      "instruction": "Complete a SMART goal."
    },
    "goal_savings_amount_set": {
      "instruction": "Set a savings goal with a specific amount."
    },
    "goal_timeline_realistic": {
      "instruction": "Set a goal with a realistic timeline."
    },
    "multiple_goals_active": {
      "instruction": "Manage multiple goals at the same time."
    }
  },
  "Social & Communication": {
    "message_sent": {
      "instruction": "Send a message."
    },
    "message_received": {
      "instruction": "Receive a message."
    },
    "classmate_interaction": {
      "instruction": "Interact with a classmate."
    }
  },
  "Financial Literacy Behaviors": {
    "loan_taken": {
      "instruction": "Take a loan."
    },
    "loan_amount_above": {
      "instruction": "Take a loan for over [value]."
    },
    "savings_goal_met": {
      "instruction": "Meet a savings goal."
    },
    "emergency_fund_built": {
      "instruction": "Build an emergency fund."
    },
    "debt_to_income_high": {
      "instruction": "Your debt-to-income ratio is high. Let's work on reducing your debt."
    }
  }
};
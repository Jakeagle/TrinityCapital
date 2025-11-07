// c:\Users\New User\Documents\VScodeFiles\Trinity Capital Files\TrinCap Main app folder\Trinity Capital Prod Local\Frontend\Javascript\ILGE\CRM\condition-rendering-library.js

import {
  displayModalMessage,
  handleChallenge,
  renderTextBlock,
  comingSoon,
} from "./actionHandlers.js";

export const actions = {
  send_message: displayModalMessage,
  show_tip: displayModalMessage,
  suggest_action: displayModalMessage,
  praise_good_habit: displayModalMessage,
  warn_poor_choice: displayModalMessage,
  explain_consequence: displayModalMessage,
  validate_smart_goal: displayModalMessage,
  guide_goal_improvement: displayModalMessage,
  congratulate_smart_goal: displayModalMessage,

  add_text_block: renderTextBlock,

  challenge_transfer: handleChallenge,
  challenge_deposit: handleChallenge,
  challenge_create_bill: handleChallenge,
  challenge_create_income: handleChallenge,
  challenge_save_amount: handleChallenge,
  challenge_send_money: handleChallenge,
  challenge_budget_balance: handleChallenge,

  add_virtual_transaction: comingSoon,
  advance_to_section: comingSoon,
  require_completion: comingSoon,
  unlock_feature: comingSoon,

  highlight_feature: (params) => {
    console.log("Action: highlight_feature", params);
  },
  force_account_switch: (params) => {
    console.log("Action: force_account_switch", params);
  },
  add_sample_bill: (params) => {
    console.log("Action: add_sample_bill", params);
  },
  add_sample_income: (params) => {
    console.log("Action: add_sample_income", params);
  },
  show_calculation: (params) => {
    console.log("Action: show_calculation", params);
  },
  compare_to_peers: (params) => {
    console.log("Action: compare_to_peers", params);
  },
  restart_student: (params) => {
    console.log("Action: restart_student", params);
  },
  complete_lesson: (params) => {
    console.log("Action: complete_lesson", params);
  },
};
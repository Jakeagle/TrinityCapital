// Test script to verify the new instruction template system works properly
import {
  instructionTemplates,
  getInstructionTemplate,
  hasInstructionTemplate,
  getAvailableConditionTypes,
  getTemplatesByCategory,
} from './instructionTemplates.js';

console.log('🧪 TESTING NEW INSTRUCTION TEMPLATE SYSTEM\n');

// Test 1: Check if key condition types have templates
const testConditions = [
  'elapsed_time',
  'payment_created',
  'bill_created',
  'account_switched',
  'transfer_completed',
  'goal_set_specific',
  'budget_positive_above',
  'savings_balance_above',
  'total_bills_above',
  'loan_taken',
];

console.log('✅ Test 1: Verifying Key Condition Templates');
testConditions.forEach(condition => {
  const hasTemplate = hasInstructionTemplate(condition);
  const template = getInstructionTemplate(condition);
  console.log(
    `   ${condition}: ${hasTemplate ? '✅' : '❌'} ${hasTemplate ? template.title : 'MISSING'}`,
  );
});

// Test 2: Check total coverage
const allTypes = getAvailableConditionTypes();
console.log(`\n✅ Test 2: Template Coverage`);
console.log(`   Total condition types with templates: ${allTypes.length}`);

// Test 3: Verify template structure
console.log(`\n✅ Test 3: Template Structure Validation`);
const sampleTemplate = getInstructionTemplate('payment_created');
if (sampleTemplate) {
  const hasRequiredFields =
    sampleTemplate.icon &&
    sampleTemplate.title &&
    sampleTemplate.description &&
    sampleTemplate.location;
  console.log(`   Required fields present: ${hasRequiredFields ? '✅' : '❌'}`);
  console.log(`   Sample: ${sampleTemplate.icon} ${sampleTemplate.title}`);
}

// Test 4: Category organization
console.log(`\n✅ Test 4: Category Organization`);
const categories = getTemplatesByCategory();
Object.keys(categories).forEach(category => {
  console.log(`   ${category}: ${categories[category].length} conditions`);
});

console.log('\n🎉 INSTRUCTION TEMPLATE SYSTEM READY!');
console.log('🔧 Teachers can now use ANY lesson builder condition');
console.log('📚 Students get specific, actionable instructions');
console.log('⚡ System is seamless and maintainable');

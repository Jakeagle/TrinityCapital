'use strict';

import { getInfoProfiles } from './script.js';
import { currentProfile } from './script.js';
import {
  showNotification,
  validateAmount,
  validateText,
  validateDate,
  validateSignature,
  setButtonLoading,
  validateForm,
} from './validation.js';

console.log(currentProfile);

/**************************************************Variables ***********************************************/

const name = $('.nameInput');

const dest = document.querySelector('.destInput');

const amount = $('.amountInput');

const date = $('.dateInput');

const signature = $('.sigInput');

const submit = $('.submitBtn');

const mainApp = $('.mainApp');

const backBTN = $('.backBtn');

const loginBTN = document.querySelector('.login__btn');

const depositLink = 'https://tcstudentserver-production.up.railway.app/deposits';

mainApp.css('display', 'none');

/******************************************************Event listeners **************************************/
backBTN.click(function () {
  location.replace('index.html');
});

submit.click(function (e) {
  e.preventDefault();

  const originalText = submit.text();
  setButtonLoading(submit[0], true, originalText);

  try {
    validateAndProcessDeposit();
  } finally {
    setTimeout(() => {
      setButtonLoading(submit[0], false, originalText);
    }, 1500);
  }
});

// Expose function to global scope to be called after login
window.initializeDeposit = initializeDeposit;

function initializeDeposit() {
  // Check if user is logged in
  if (!currentProfile || !currentProfile.memberName) {
    console.warn('User not logged in or member name not found');
    return;
  }

  console.log(currentProfile.memberName);
}

/********************************************************Functions *****************************************/

/**
 * Generate expected signature for current user
 */
function generateExpectedSignature() {
  if (!currentProfile || !currentProfile.memberName) {
    return '';
  }

  return currentProfile.memberName
    .toLowerCase()
    .split(' ')
    .map(name => name[0])
    .join('');
}

/**
 * Validate and process deposit with comprehensive validation
 */
const validateAndProcessDeposit = function () {
  const nameValue = name.val();
  const amountValue = amount.val();
  const dateValue = date.val();
  const signatureValue = signature.val();
  const destValue = dest.value;

  const expectedSignature = generateExpectedSignature();

  // Define validation rules
  const validationRules = [
    {
      field: name[0],
      value: nameValue,
      validations: [
        value =>
          validateText(value, {
            fieldName: 'Name',
            allowNumbers: false,
            allowSpecialChars: false,
          }),
        value => {
          if (value && value.trim() !== currentProfile.memberName) {
            return ['Name must match the account holder name'];
          }
          return [];
        },
      ],
      fieldName: 'Name',
    },
    {
      field: amount[0],
      value: amountValue,
      validations: [
        value =>
          validateAmount(value, {
            min: 0.01,
            max: 10000,
            fieldName: 'Deposit Amount',
          }),
      ],
      fieldName: 'Amount',
    },
    {
      field: date[0],
      value: dateValue,
      validations: [
        value =>
          validateDate(value, {
            allowFuture: false,
            fieldName: 'Date',
            maxPastDays: 30,
          }),
      ],
      fieldName: 'Date',
    },
    {
      field: signature[0],
      value: signatureValue,
      validations: [
        value => validateSignature(value, expectedSignature, 'Signature'),
      ],
      fieldName: 'Signature',
    },
  ];

  // Validate destination account
  if (!destValue || destValue === 'default') {
    showNotification('Please select a destination account', 'error');
    return;
  }

  // Run validation
  const validation = validateForm(validationRules);

  if (!validation.isValid) {
    showNotification(validation.errors.join(', '), 'error');
    return;
  }

  // If validation passes, process the deposit
  processDeposit();
};

const processDeposit = function () {
  console.log('Processing deposit...');

  let userDeposit = parseFloat(amount.val());
  let member = currentProfile.memberName;
  let destination = dest.value;

  sendDeposit(userDeposit, destination, member);
};

// Legacy function - keeping for backward compatibility but with validation
const checkAll = function () {
  validateAndProcessDeposit();
};
export async function sendDeposit(loan, destination, member) {
  try {
    showNotification('Processing deposit...', 'info');

    const res = await fetch(depositLink, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parcel: [loan, destination, member],
      }),
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const result = await res.json();

    showNotification(
      `Deposit of $${loan.toFixed(2)} completed successfully!`,
      'success',
    );

    // Clear form
    name.val('');
    amount.val('');
    date.val('');
    signature.val('');
    dest.selectedIndex = 0;

    return result;
  } catch (error) {
    console.error('Deposit failed:', error);
    showNotification(`Deposit failed: ${error.message}`, 'error');
    throw error;
  }
}

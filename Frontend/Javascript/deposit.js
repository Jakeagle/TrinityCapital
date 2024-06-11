'use strict';

import { getInfoProfiles } from './script.js';
import { currentProfile } from './script.js';

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

const depositLink = 'https://trinitycapitaltestserver-2.azurewebsites.net/deposits';

mainApp.css('display', 'none');

/******************************************************Event listeners **************************************/
backBTN.click(function () {
  location.replace('index.html');
});

submit.click(function (e) {
  e.preventDefault();
  checkAll();
});

loginBTN.addEventListener('click', function () {
  console.log(currentProfile.memberName);
});

/********************************************************Functions *****************************************/

const checkAll = function () {
  let dateComplete = false;
  const userDate = new Date(date.val());
  const currentDate = new Date();
  let nameComplete = false;
  let prfUser = name.val();
  let userSig = signature.val();
  let sigComplete = false;
  let amountComplete = false;
  let userAmount = amount.val();

  console.log(userDate);
  console.log(currentDate);

  if (userDate > currentDate) {
    alert('Cannot use a date in the future. Please Try Again');
  } else if (userDate <= currentDate) {
    dateComplete = true;
  }

  if (prfUser !== currentProfile.memberName) {
    alert('You must enter the name on your account');
  } else if (prfUser === currentProfile.memberName) {
    nameComplete = true;
  }

  currentProfile.sig = currentProfile.memberName
    .toLowerCase()
    .split(' ')
    .map(name => name[0])
    .join('');

  console.log(currentProfile.sig);

  if (userSig !== currentProfile.sig) {
    alert(
      'Your signature is the first and last initial of the name on your account. Initial must be lowercased'
    );
  } else if (userSig === currentProfile.sig) {
    sigComplete = true;
  }
  if (userAmount > 1000000) {
    alert('The Maximum deposit amount per day is $10000');
  } else if (userAmount <= 1000000) {
    amountComplete = true;
  }

  if (nameComplete && sigComplete && dateComplete && amountComplete) {
    loanAdd();
  }
};

const loanAdd = function () {
  console.log('Ran');

  let userLoan = parseInt(amount.val());

  let member = currentProfile.memberName;

  sendDeposit(userLoan, dest.value, member);
};

export async function sendDeposit(loan, destination, member) {
  const res = await fetch(depositLink, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parcel: [loan, destination, member],
    }),
  });
}

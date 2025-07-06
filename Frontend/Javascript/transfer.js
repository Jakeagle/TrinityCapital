'use strict';

//import profiles object from App.js
import { currentProfile } from './script.js';
import { initialBalance } from './script.js';

/************************************************Variables*************************************************/

const inputPIN = document.querySelector('.login__input--pin--transfer');

const btnPIN = document.querySelector('.login__btn--transfer');

const accountListFrom = document.querySelector('.accountsListFrom');

const accountListToo = document.querySelector('.accountsListTo');

const loginButton = document.querySelector('.login__btn');

const amountInput = document.querySelector('.form__input--amount--transfer');

const btnAmount = document.querySelector('.form__btn--transfer');

const mainApp = document.querySelector('.mainSection');

const backBTN = document.querySelector('.backBtn');

let accountSend;

let accountRecieve;

let amount;

const transferLink = `https://tcstudentserver-production.up.railway.app/transfer`;

/************************************************Functions*************************************************/

console.log(currentProfile);

loginButton.addEventListener('click', function () {
  accountSetup();
});

const accountSetup = function () {
  let accounts = [
    currentProfile.checkingAccount,
    currentProfile.savingsAccount,
  ];

  accounts.forEach(account => {
    let option = document.createElement('option');

    option.value = account.accountNumber;

    option.textContent = `${
      account.accountType
    }----------${account.accountNumber.slice(-4)}`;
    accountListFrom.appendChild(option);
  });

  accounts.forEach(account => {
    let option = document.createElement('option');

    option.value = account.accountNumber;

    option.textContent = `${
      account.accountType
    }----------${account.accountNumber.slice(-4)}`;
    accountListToo.appendChild(option);
  });
};
//Handles math for transfer

const transPush = function (from, to) {
  if (from === to) {
    alert('You cannot use the same account in both fields');
  } else {
    let accountFrom;
    let accountTo;
    let amount;

    let accounts = [
      currentProfile.checkingAccount,
      currentProfile.savingsAccount,
    ];

    accounts.forEach(account => {
      if (from === account.accountNumber) {
        accountFrom = account;
        console.log(accountFrom, 'from');
      }
      if (to === account.accountNumber) {
        accountTo = account;
        console.log(accountTo, 'to');
      }
    });

    const memberName = currentProfile.memberName;
    console.log(memberName);

    amount = parseInt(amountInput.value);
    console.log(amount);
    sendTransferData(
      currentProfile,
      accountFrom,
      accountTo,
      amount,
      memberName
    );
  }
};

const sendTransferData = async function (
  profile,
  from,
  to,
  amount,
  memberName
) {
  const res = await fetch(transferLink, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parcel: [profile, from, to, amount, memberName],
    }),
  });
  initialBalance();
};

/************************************************Event Listeners*************************************************/

//Handles selecting the from account
accountListFrom.addEventListener('change', function (event) {
  // Get the selected option element
  const selectedOption = event.target.selectedOptions[0];
  // Get the account number from the value property of the selected option
  accountSend = selectedOption.value;
  console.log(accountSend);
});

//handles selecting too account
accountListToo.addEventListener('change', function (event) {
  // Get the selected option element
  const selectedOption = event.target.selectedOptions[0];
  // Get the account number from the value property of the selected option
  accountRecieve = selectedOption.value;
  console.log(accountRecieve);
});

//handles getting amount
btnAmount.addEventListener('click', function () {
  transPush(accountSend, accountRecieve);

  amountInput.textContent = '';
});

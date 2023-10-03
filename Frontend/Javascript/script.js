'use strict';

const mainApp = document.querySelector('.mainApp');
const loginBox = document.querySelector('.signOnBox');

loginBox.showModal();
if (mainApp) mainApp.style.display = 'none';

/***********************************************************Server Listeners**********************************************/

const getBTN = document.getElementById('get');
const getPrfBTN = document.getElementById('getProfiles');
const postBTN = document.getElementById('post');
const input = document.getElementById('input');

export const socket = io('http://localhost:3000');

console.log('User connected:' + socket.id);
socket.on('checkingAccountUpdate', updatedChecking => {
  // Access the checkingAccount data from updatedUserProfile
  const checkingAccount = updatedChecking;
  console.log(checkingAccount, 'This is working');

  // Call your existing updateUI function with the updated checking account data
  displayBalance(checkingAccount);
  displayTransactions(checkingAccount);
});

socket.on('donationChecking', updatedDonCheck => {
  const checkingAccount = updatedDonCheck;
  console.log(checkingAccount, 'This is working');

  // Call your existing updateUI function with the updated checking account data
  displayBalance(checkingAccount);
  displayTransactions(checkingAccount);
});

socket.on('donationSaving', updatedDonSav => {
  const savingsAccount = updatedDonSav;
  console.log(savingsAccount, 'This is working');

  // Call your existing updateUI function with the updated checking account data
  displayBalance(savingsAccount);
  displayTransactions(savingsAccount);
});

/***********************************************************Server Functions**********************************************/
const testServerProfiles = 'http://localhost:3000/profiles';

const loanURL = 'http://localhost:3000/loans';

const donationURL = 'http://localhost:3000/donations';

const donationSavingsURL = 'http://localhost:3000/donationsSavings';

// Store the received profiles in a global variable or a state variable if you're using a front-end framework
let Profiles = [];

export async function getInfoProfiles() {
  try {
    const res = await fetch(testServerProfiles, {
      method: 'GET',
    });

    if (res.ok) {
      Profiles = await res.json();

      // Log the initial profiles
      console.log(Profiles);

      // Now, listen for updates from the Socket.IO server
      socket.on('profiles', updatedProfiles => {
        // Update your UI with the updated profiles
        console.log('Received updated profiles:', updatedProfiles);

        // For example, you can update a list of profiles
        // Assuming you have a function to update the UI
      });
      return Profiles;
    } else {
      console.error('Failed to fetch profiles:', res.statusText);
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function loanPush() {
  const res = await fetch(loanURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parcel: [currentProfile, parseInt(loanAmount.value)],
    }),
  });
  console.log(currentProfile);
}

async function donationPush() {
  const res = await fetch(donationURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parcel: [currentAccount, parseInt(donateAmount.value)],
    }),
  });
}

async function donationPushSavings() {
  const res = await fetch(donationSavingsURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parcel: [currentAccount, parseInt(donateAmount.value)],
    }),
  });
}

export let profiles = await getInfoProfiles();
console.log(profiles);

/******************************************Variables ***************************************************/

let currentAccount;
let currentProfile;
let currentTime;
let accPIN;
let accUser;
//Currency codes for formatting
const currencyCodeMap = {
  840: 'USD',
  978: 'EUR',
  // add more currency codes here as needed
};

const closeT1 = document.querySelector('.closeBtn');
const signOnForm = document.querySelector('signOnForm');
const signOnText = document.querySelector('.signOntext');
const loginButton = document.querySelector('.login__btn');
const loginText = document.querySelector('.login__input--user');
const formDiv = document.querySelector('.formDiv');
export let balance;

const lastUpdated = document.querySelector('.updateDate');
const transActionsDate = document.querySelector('.transactions__date');
const balanceValue = document.querySelector('.balance__value');
const balanceLabel = document.querySelector('.balance__label');
const accNumSwitch = document.querySelector('.form__input--user--switch');
const accPinSwitch = document.querySelector('.form__input--pin--switch');
const accBtnSwitch = document.querySelector('.form__btn--switch');
const btnClose = document.querySelector('.form__btn--close');
const userClose = document.querySelector('.form__input--user--close');
const userClosePin = document.querySelector('.form__input--pin--close');
const transactionContainer = document.querySelector('.transactions');
const requestLoanbtn = document.querySelector('.form__btn--loan');
const loanAmount = document.querySelector('.form__input--loan-amount');
const donateBtn = document.querySelector('.form__btn--donate');
const donateAmount = document.querySelector('.form__input--donate--amount');
const donatePin = document.querySelector('.form__input--pin--donate');
const accNumHTML = document.querySelector('.accountNumber');
const balanceDate = document.querySelector(`.balance__date`);
const now = new Date();

//Used for formatting dates
const options = {
  hour: 'numeric',
  minute: 'numeric',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  // weekday: 'long',
};

/*****************************************Event Listeners ******************************************/

//login event listener (used to login to the app)
if (loginButton) {
  loginButton.addEventListener('click', function (event) {
    event.preventDefault();

    // Get the value of the input field
    const loginPIN = document.querySelector('.login__input--pin');
    const pin = parseInt(loginPIN.value);

    for (let i = 0; i < profiles.length; i++) {
      console.log(profiles[i].userName);
      if (loginText.value === profiles[i].userName && pin === profiles[i].pin) {
        currentProfile = profiles[i];
      } else if (
        loginText.value === profiles[i].userName &&
        pin !== profiles[i].pin
      ) {
        alert('incorrect PIN');
      } else if (
        loginText.value !== profiles[i].userName &&
        pin === profiles[i].pin
      ) {
        alert('incorrect Username');
      }
    }

    if (currentProfile) {
      // Retrieve saved transactions for current account

      loginBox.close();

      const signOnSection = document.querySelector('.signOnSection');

      signOnSection.style.display = 'none';
      console.log(currentProfile);

      // Display welcome message
      const signOnText = document.querySelector('.signOnText');
      signOnText.textContent = currentProfile.memberName.split(' ')[0];

      // Hide login form and display main app
      const formDiv = document.querySelector('.formDiv');
      const mainApp = document.querySelector('.mainApp');

      mainApp.style.display = 'flex';
      mainApp.style.opacity = 100;

      currentAccount = currentProfile.checkingAccount;
      if (currentAccount) {
        console.log(currentAccount);
        //Add currentAccount here
        // Update the UI with the first account's information
        updateUI(currentAccount);
        //Starts loop function that displays the current Accounts bills

        //Displays the "Current Balanace for "x" string
        balanceLabel.textContent = `Current balance for: #${currentAccount.accountNumber.slice(
          -4
        )}`;

        //Displays the "As of" portion with the current date
        updateTime();
        balanceDate.textContent = `As of ${new Intl.DateTimeFormat(
          currentProfile.locale,
          options
        ).format(currentTime)}`;
        //Display saved transactions for current account
        displayTransactions(currentAccount);
      } else {
        alert('No checking account found. Please contact customer service.');
      }
    }
  });
}

//Switch accounts
if (accBtnSwitch) {
  accBtnSwitch.addEventListener('click', function (e) {
    e.preventDefault();
    console.log(currentAccount);
    //The value for the account you want to switch too
    let targetAccount = accNumSwitch.value;
    accPIN = parseInt(accPinSwitch.value);
    //Variable that matches the above with the matching account number
    let accountToSwitch;

    if (accPIN === currentProfile.pin) {
      if (
        targetAccount === currentProfile.checkingAccount.accountNumber.slice(-4)
      ) {
        currentAccount = currentProfile.checkingAccount;
        balanceLabel.textContent = `Current Balance for: #${currentAccount.accountNumber.slice(
          -4
        )}`;
        updateUI(currentAccount);
      } else if (
        targetAccount === currentProfile.savingsAccount.accountNumber.slice(-4)
      ) {
        currentAccount = currentProfile.savingsAccount;
        balanceLabel.textContent = `Current Balance for: #${currentAccount.accountNumber.slice(
          -4
        )}`;
        updateUI(currentAccount);
      }
    } else {
      alert('Incorrect PIN');
    }

    //Variable for the loan section
    const loanBox = document.querySelector('.operation--loan');
    //checks for savings accounr

    if (currentAccount.accountType === 'Savings') {
      loanBox.style.display = 'none';
    }
    //takes away loans if savings
    else if (currentAccount.accountType === 'Checking') {
      loanBox.style.display = 'inline';
    }

    accNumSwitch.value = '';
    accPinSwitch.value = '';
  });
}

//requesting loans

//checks if button exists
if (requestLoanbtn) {
  requestLoanbtn.addEventListener('click', function (e) {
    //prevents default action
    e.preventDefault();

    loanPush();

    loanAmount.value = '';

    //Declares the amount as the user entered amount.
  });
}

//Donating money
if (donateBtn) {
  donateBtn.addEventListener('click', function (e) {
    e.preventDefault();
    //How much a user donates

    if (currentAccount.accountType === 'Checking') {
      donationPush();
    } else if (currentAccount.accountType === 'Savings') {
      donationPushSavings();
    }

    donatePin.value = '';
    donateAmount.value = '';
  });
}

/********************************************Functions *********************************************/
if (mainApp) {
  mainApp.style.opacity = 0;
}

const createUsername = function (prfs) {
  for (let i = 0; i < prfs.length; i++) {
    console.log(prfs[i].memberName);
    prfs[i].userName = prfs[i].memberName
      .toLowerCase()
      .split(' ')
      .map(name => name[0])
      .join('');
  }
};
createUsername(profiles);

//createUsername(profiles);
//updates current time
const updateTime = function () {
  currentTime = new Date();
};

//This function updates local storage with any new data (Mainly transactions)

//Displays Currently Logged in profile's accounts sorted in order of checking first, then in order of most recently created.
const displayAccounts = function (currentAccount) {
  const accountContainer = document.querySelector('.accountContainer');
  accountContainer.innerHTML = '';

  //Shows no accounts if there are no accounts int the current profile

  //Sort the accounts by type (checking first) and creation date

  let balance = formatCur(
    currentProfile.locale,

    currentProfile.currency
  );

  let lastTransactionDate = new Date(
    currentProfile.checkingAccount.movementsDates[
      currentProfile.checkingAccount.movementsDates.length - 1
    ]
  ).toLocaleDateString(currentProfile.locale);

  let lastTransactionDateSavings = new Date(
    currentProfile.savingsAccount.movementsDates[
      currentProfile.savingsAccount.movementsDates.length - 1
    ]
  ).toLocaleDateString(currentProfile.locale);

  const html = [
    `
        <div class="row accountsRow">
          <div class="col accountType">${
            currentProfile.checkingAccount.accountType
          }</div>
          <div class="col accountNumber">${currentProfile.checkingAccount.accountNumber.slice(
            -4
          )}</div>
          <div class="col updateDate">${lastTransactionDate}</div>
        </div>
      
      <div class="row accountsRow">
        <div class="col accountType">${
          currentProfile.savingsAccount.accountType
        }</div>
        <div class="col accountNumber">${currentProfile.savingsAccount.accountNumber.slice(
          -4
        )}</div>
        <div class="col updateDate">${lastTransactionDateSavings}</div>
      </div>
      `,
  ];

  accountContainer.insertAdjacentHTML('beforeEnd', html);
};

//Display Transactions
export const displayTransactions = function (currentAccount) {
  let movs;

  //selects the transactions HTML element
  const transactionContainer = document.querySelector('.transactionsColumn');
  transactionContainer.innerHTML = '';

  //Variable set for the transactions themselves

  movs = currentAccount.transactions;

  //A loop that runs through each transaction in the current account object
  movs.forEach(function (mov, i) {
    //ternerary to determine whether a transaction is a deposit or withdrawal
    const type = mov > 0 ? 'deposit' : 'withdrawal';
    let date;

    //Sets the date for each transaction according to the date set in the current Account object

    //Sets up the date variable for the transactions
    date = new Date(currentAccount.movementsDates[i]);

    //displays date next to transactions
    const displayDate = formatMovementDate(date, currentAccount.locale);
    //Formats transactions for user locale
    const formattedMov = formatCur(
      mov,
      currentAccount.locale,
      currentAccount.currency
    );
    //HTML for transactions
    const html = `<div class="transaction row">
                    <div class="transIcon col-4">
                      <i class="fa-solid fa-house transImg"></i>
                    </div>
                    <div class="transNameAndDate col">
                      <p class="transName">Rent</p>
                      <p class="transDate">${displayDate}</p>
                    </div>
                    <div class="transAmount col">
                      <p class="transAmountText ${
                        formattedMov >= 0 ? `negTrans` : `posTrans`
                      }">${formattedMov}</p>
                    </div>
                  </div>`;
    //Inserts HTML with required data
    transactionContainer.insertAdjacentHTML('afterbegin', html);
  });
};

//formats the transactions dates to the users locale
export const formatMovementDate = function (date, locale) {
  //international time format based on the date given in this fuction
  return new Intl.DateTimeFormat(locale).format(date);
};
//formats currency based on user locale
function formatCur(value, currency, locale) {
  //Sets currency based on locale currency code. (Defaults to USD if no locale can be found)
  const currencyCode = currencyCodeMap[currency] || 'USD';
  //Sets style and code, and formats the transaction
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(value);
}

//Displays the current balance based on the transactions array
export const displayBalance = function (acc) {
  //calculates the balance based on the transaction array

  //displays balance
  balanceValue.textContent = formatCur(
    acc.balanceTotal,
    acc.locale,
    acc.currency
  );
};

//Updates the webpage UI with all of the needed data
export const updateUI = function (acc) {
  //Displays the Transactions data
  displayTransactions(acc);
  //Displays the balance with correct data
  displayBalance(acc);
  //Displays the users accounts
};

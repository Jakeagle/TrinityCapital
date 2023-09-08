'use strict';

const mainApp = document.querySelector('.app');

if (mainApp) mainApp.style.display = 'none';

/***********************************************************Server Listeners**********************************************/

const getBTN = document.getElementById('get');
const getPrfBTN = document.getElementById('getProfiles');
const postBTN = document.getElementById('post');
const input = document.getElementById('input');

const socket = io('https://trinitycapital.azurewebsites.net');

console.log('User connected:' + socket.id);
socket.on('checkingAccountUpdate', updatedChecking => {
  // Access the checkingAccount data from updatedUserProfile
  const checkingAccount = updatedChecking;
  console.log(checkingAccount, 'This is working');

  // Call your existing updateUI function with the updated checking account data
  displayBalance(checkingAccount);
  displayTransactions(checkingAccount);
});

/***********************************************************Server Functions**********************************************/
const testServerProfiles = 'https://trinitycapital.azurewebsites.net/profiles';
const currentAccountURL =
  'https://trinitycapital.azurewebsites.net/currentProfile';
const loanURL = 'https://trinitycapital.azurewebsites.net/loans';
const balanceURL = 'https://trinitycapital.azurewebsites.net/balance';

// Store the received profiles in a global variable or a state variable if you're using a front-end framework
let Profiles = [];

async function getInfoProfiles() {
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

      console.log(currentProfile);

      // Display welcome message
      const signOnText = document.querySelector('.signOntext');
      signOnText.textContent = `Welcome Back ${
        currentProfile.memberName.split(' ')[0]
      }`;

      // Hide login form and display main app
      const formDiv = document.querySelector('.formDiv');
      const mainApp = document.querySelector('.app');
      formDiv.style.display = 'none';
      mainApp.style.display = 'block';
      mainApp.style.opacity = 100;

      currentAccount = currentProfile.checkingAccount;
      if (currentAccount) {
        console.log(currentAccount);
        //Add currentAccount here
        // Update the UI with the first account's information
        updateUI(currentAccount);
        //Starts loop function that displays the current Accounts bills
        displayBills();
        //Starts loop function that displays the current Accounts paychecks
        displayPayments();

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
    //The value for the account you want to switch too
    let targetAccount = accNumSwitch.value;
    //Variable that matches the above with the matching account number
    let accountToSwitch = currentProfile.accounts.find(
      //Matches the last for of the account with the targetAccount entry
      account => account.accountNumber.slice(-4) === targetAccount
    );

    accPIN = parseInt(accPinSwitch.value);
    if (!accountToSwitch) {
      alert('Incorrect account number');
    } else {
      if (accPIN === currentProfile.pin) {
        //Updates UI for current balance with switched account
        balanceLabel.textContent = `Current balance for: #${accountToSwitch.accountNumber.slice(
          -4
        )}`;
        //sets current account to the switched account
        currentAccount = accountToSwitch;
        //empties text field
        accNumSwitch.value = '';
        //empties text field
        accPinSwitch.value = '';
        //Updates main site with switched account
        updateUI(accountToSwitch);
        currAcc(currentAccount);

        //Updates to the current time
        updateTime();
        //Updates the as of field
        balanceDate.textContent = `As of ${new Intl.DateTimeFormat(
          currentProfile.locale,
          options
        ).format(currentTime)}`;

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
        //checks for Checking

        //Shows loan box
      } else {
        alert('Incorrect PIN');
      }
    }
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
    let donationAmount = Number(donateAmount.value);
    //User Pin
    const pin = parseInt(donatePin.value);
    //Checks account and pushes donation
    if (pin === currentProfile.pin) {
      currentAccount.transactions.push(-donationAmount);

      // Add loan date

      currentAccount.movementsDates.push(new Date().toISOString());

      //Updates local storage

      //Update UI
      updateUI(currentAccount);

      donatePin.value = '';
      donateAmount.value = '';
    }
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
  const transactionContainer = document.querySelector('.transactions');
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
    const html = `
      <div class="transactions__row">
        <div class="transactions__type transactions__type--${type} col-4">
        <div class="transactionsTypeText"> 
        ${i + 1} ${type}</div>
    </div>
        <div class="transactions__date col-4">${displayDate}</div>
        <div class="transactions__value col-4">${formattedMov}</div>
      </div>
    `;
    //Inserts HTML with required data
    transactionContainer.insertAdjacentHTML('afterbegin', html);
  });
};

//Displays all of the bills a user has set up
export const displayBills = function () {
  console.log(currentAccount.accountType);
  //Simulated time for bills to appear
  let interval;
  //How much the bill actually is
  let amount;
  const transactionContainer = document.querySelector('.transactions');
  if (transactionContainer) {
    transactionContainer.innerHTML = '';
  }

  //Runs through each bill object in the bills array

  for (let i = 0; i < currentAccount.bills.length; i++) {
    //Sets interval to the value set in the current bill object
    interval = currentAccount.bills[i].frequency;
    //Sets amount to the value set in the current bill object
    amount = currentAccount.bills[i].amount;

    //Displays the bills using the amount, every interval set above

    setInterval(function () {
      //Pushes amount to the transactions array
      console.log(currentAccount.bills[i]);
      currentProfile.accounts[0].transactions.push(amount);
      //creates a new date for the transaction above
      currentProfile.accounts[0].movementsDates.push(new Date().toISOString());

      //Updates Local Storage with new data

      //Displays new data on the webpage
      updateUI(currentAccount);
    }, interval);
  }
};

//Displays all of the payments a user has set up
export const displayPayments = function () {
  console.log(currentAccount.accountType);
  //Simulated time for bills to appear
  let interval;
  //How much the bill actually is
  let amount;
  const transactionContainer = document.querySelector('.transactions');
  if (transactionContainer) {
    transactionContainer.innerHTML = '';
  }

  //Runs through each bill object in the bills array

  for (let i = 0; i < currentAccount.payments.length; i++) {
    //Sets interval to the value set in the current bill object
    interval = currentAccount.payments[i].frequency;
    //Sets amount to the value set in the current bill object
    amount = currentAccount.payments[i].amount;

    //Displays the bills using the amount, every interval set above

    setInterval(function () {
      console.log(currentAccount.payments[i]);
      //Pushes amount to the transactions array
      currentProfile.accounts[0].transactions.push(amount);
      //creates a new date for the transaction above
      currentProfile.accounts[0].movementsDates.push(new Date().toISOString());

      //Updates Local Storage with new data

      //Displays new data on the webpage
      updateUI(currentAccount);
    }, interval);
  }
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
  displayAccounts(acc);
};

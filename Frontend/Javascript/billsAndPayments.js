'use strict';
import { profiles } from './script.js';

/**********************************************Variables***********************************************/

const billFrequency = document.querySelector('.frequencyListBills');
const paymentFrequency = document.querySelector('.frequencyListPayments');
const billInput = document.querySelector('.form__input--amount--bills');
const paymentInput = document.querySelector('.form__input--amount--payments');
const mainApp = document.querySelector('.mainApp');
const inputPin = document.querySelector('.login__input--pin--bp');
const loginBTN = document.querySelector('.login__btn--bp');
const signOnSection = document.querySelector('.signOnSection');
const billsBTN = document.querySelector('.form__btn--bills');
const paymentsBTN = document.querySelector('.form__btn--payments');
const backBTN = document.querySelector('.backBtn');

export let billInterval;
export let payInterval;
let chosenSelect;
let billAmount;
let paymentAmount;
let currentProfile;
let pin;
let currentAccount;

console.log(profiles);

const socket = io('https://trinitycapitaltestserver-2.azurewebsites.net');
mainApp.style.display = 'none';

/**********************************************Functions***********************************************/

//Handles login
const login = function () {
  //Get pin from user input
  pin = parseInt(inputPin.value);
  //Matches pin to profiles and logs in.
  currentProfile = profiles.find(profile => profile.pin === pin);

  //These two turn off the login and turn on the main page
  signOnSection.style.display = 'none';
  mainApp.style.display = 'block';
};

const billURL = `https://trinitycapitaltestserver-2.azurewebsites.net/bills`;

async function sendBillData(type, amount, interval) {
  const res = await fetch(billURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parcel: [currentProfile, amount, interval, type],
    }),
  });
}

//Function that sets time interval based on user input

//Sets the bill array and objects up for use

/**********************************************Event Listeners***********************************************/
backBTN.addEventListener('click', function () {
  location.replace('index.html');
});
//Handles login
loginBTN.addEventListener('click', function () {
  login();
});

//handles bill frequency
billFrequency.addEventListener('change', function (event) {
  //Declares option as user selected item
  const selectedOption = event.target.selectedOptions[0];
  //sets interval to selected option
  billInterval = selectedOption.value;
  //Sets the chosen select box as the bill box
  chosenSelect = billFrequency;
});
//sets amount for bills
billsBTN.addEventListener('click', function () {
  sendBillData('bill', parseInt(billInput.value), billInterval);
  billInput.value = '';
});

//Same code as bills
paymentFrequency.addEventListener('change', function (event) {
  const selectedOption = event.target.selectedOptions[0];
  payInterval = selectedOption.value;
  //console.log(payInterval);
  chosenSelect = paymentFrequency;
});
paymentsBTN.addEventListener('click', function () {
  sendBillData('payment', parseInt(paymentInput.value), payInterval);
  paymentInput.value = '';
});

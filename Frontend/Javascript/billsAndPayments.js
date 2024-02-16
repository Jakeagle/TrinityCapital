'use strict';
import { currentProfile } from './script.js';

/**********************************************Variables***********************************************/

const billFrequency = document.querySelector('.billFrequency');
const paymentFrequency = document.querySelector('.paymentFrequency');
const billInput = document.querySelector('.form__input--amount--bills');
const paymentInput = document.querySelector('.form__input--amount--payments');
const billName = document.querySelector('.billInputName');
const paymentName = document.querySelector('.paymentName');
const billsBTN = document.querySelector('.form__btn--bills');
const paymentsBTN = document.querySelector('.form__btn--payments');
const billTypeSelect = document.querySelector('.billType');
const paymentTypeSelect = document.querySelector('.paymentType');

export let billInterval;
export let payInterval;
let billType;
let paymentType;
let chosenSelect;

const socket = io('trinitycapitaltestserver-2.azurewebsites.net');

/**********************************************Functions***********************************************/

//Handles login

const billURL = `trinitycapitaltestserver-2.azurewebsites.net/bills`;

async function sendBillData(type, amount, interval, name, cat, date) {
  const res = await fetch(billURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parcel: [currentProfile, type, amount, interval, name, cat, date],
    }),
  });
}

/**********************************************Event Listeners***********************************************/

//handles bill frequency
billFrequency.addEventListener('change', function (event) {
  //Declares option as user selected item
  const selectedOption = event.target.selectedOptions[0];
  //sets interval to selected option
  billInterval = selectedOption.value;
  //Sets the chosen select box as the bill box
  chosenSelect = billFrequency;
});

billTypeSelect.addEventListener('change', function (event) {
  //Declares option as user selected item
  const selectedOption = event.target.selectedOptions[0];
  //sets interval to selected option
  billType = selectedOption.value;
  //Sets the chosen select box as the bill box
});

paymentTypeSelect.addEventListener('change', function (event) {
  //Declares option as user selected item
  const selectedOption = event.target.selectedOptions[0];
  //sets interval to selected option
  paymentType = selectedOption.value;
  //Sets the chosen select box as the bill box
});

//sets amount for bills
billsBTN.addEventListener('click', function () {
  console.log('clicked', currentProfile);
  let newDate = new Date();
  console.log(newDate);
  sendBillData(
    'bill',
    parseInt(-billInput.value),
    billInterval,
    billName.value,
    billType,
    newDate
  );
  console.log('complete');
});

//Same code as bills
paymentFrequency.addEventListener('change', function (event) {
  const selectedOption = event.target.selectedOptions[0];
  payInterval = selectedOption.value;
  //console.log(payInterval);
});
paymentsBTN.addEventListener('click', function () {
  let newDate = new Date();
  console.log(newDate);
  sendBillData(
    'payment',
    parseInt(paymentInput.value),
    payInterval,
    paymentName.value,
    paymentType,
    newDate
  );
});

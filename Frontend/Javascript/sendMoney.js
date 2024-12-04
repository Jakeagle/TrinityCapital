import { currentProfile } from './script.js';
import { getInfoProfiles } from './script.js';

/**********************************************Variables****************************************/

let profiles = await getInfoProfiles();
let targetProfile;
let profileSend;

const mainApp = document.querySelector('.mainApp');
const loginBTN = document.querySelector('.login__btn');
const inputAmount = document.querySelector('.form__input--amount--sendMoney');
const recipient = document.querySelector('.recipients');
const inputBTN = document.querySelector('.sendBtn');
const backBTN = document.querySelector('.backBtn');

const sendMoneyURL = `https://trinitycapitaltestserver-2.azurewebsites.net/sendFunds`;
let theRecipient;

mainApp.style.display = 'none';

/***********************************************Event LIsteners ********************************/

loginBTN.addEventListener('click', function () {
  console.log(currentProfile, profiles);
  accountSetup();
});

recipient.addEventListener('change', function (event) {
  // Get the selected option element
  const selectedOption = event.target.selectedOptions[0];
  // Get the account number from the value property of the selected option
  theRecipient = selectedOption.value;
  console.log(theRecipient);
});

inputBTN.addEventListener('click', function () {
  let amount = parseInt(inputAmount.value);
  let sender = currentProfile.memberName;

  if (amount <= 0) {
    alert('You must send a positive amount');
  } else {
    sendFunds(theRecipient, sender, amount);
  }

  inputAmount.textContent = '';
});
/**************************************************Functions*****************************************/
const accountSetup = function () {
  profiles.forEach(profile => {
    let option = document.createElement('option');

    option.value = profile.memberName;

    option.textContent = `${profile.memberName}`;
    recipient.appendChild(option);
  });
};
const sendFunds = async function (recip, sendr, amnt) {
  if (recip === sendr) {
    alert('You cannot send funds to yourself');
  } else {
    console.log(recip, amnt);
    const res = await fetch(sendMoneyURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parcel: [recip, sendr, amnt],
      }),
    });
  }
};

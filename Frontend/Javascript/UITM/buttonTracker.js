function handleTransferModal() {
    // This function is for TRACKING, not for performing the transfer.
    const transferModal = document.querySelector('.transferModal');
    if (!transferModal) {
        console.log('UITM_INFO: Transfer modal not found.');
        return;
    }

    const submitButton = transferModal.querySelector('.form__btn--transfer');
    if (!submitButton) {
        console.log('UITM_INFO: Transfer submit button not found.');
        return;
    }

    // Prevent adding listener multiple times
    if (submitButton.dataset.uitmListener) {
        return;
    }
    submitButton.dataset.uitmListener = 'true';

    submitButton.addEventListener('click', () => {
        const fromAccountSelect = transferModal.querySelector('.accountsListFrom');
        const toAccountSelect = transferModal.querySelector('.accountsListTo');
        const amountInput = transferModal.querySelector('.form__input--amount--transfer');

        const fromAccount = fromAccountSelect ? fromAccountSelect.value : 'not found';
        const toAccount = toAccountSelect ? toAccountSelect.value : 'not found';
        const amount = amountInput ? amountInput.value : 'not found';

        console.log('--- UITM: Transfer Modal Submitted ---');
        console.log(`From Account Value: ${fromAccount}`);
        console.log(`To Account Value: ${toAccount}`);
        console.log(`Amount Value: ${amount}`);
        console.log('------------------------------------');
    });
}

function handleBillsModal() {
    const billsModal = document.querySelector('.billsAndPaymentsModal');
    if (!billsModal) {
        console.log('UITM_INFO: Bills and Payments modal not found.');
        return;
    }

    // Handle Bills Section
    const billsSubmitButton = billsModal.querySelector('.form__btn--bills');
    if (billsSubmitButton) {
        if (!billsSubmitButton.dataset.uitmListener) {
            billsSubmitButton.dataset.uitmListener = 'true';
            billsSubmitButton.addEventListener('click', () => {
                const billTypeSelect = billsModal.querySelector('.billType');
                const billNameInput = billsModal.querySelector('.billInputName');
                const billAmountInput = billsModal.querySelector('.form__input--amount--bills');
                const billFrequencySelect = billsModal.querySelector('.billFrequency');

                const billType = billTypeSelect ? billTypeSelect.value : 'not found';
                const billName = billNameInput ? billNameInput.value : 'not found';
                const billAmount = billAmountInput ? billAmountInput.value : 'not found';
                const billFrequency = billFrequencySelect ? billFrequencySelect.value : 'not found';

                console.log('--- UITM: Bills Form Submitted ---');
                console.log(`Bill Type: ${billType}`);
                console.log(`Bill Name: ${billName}`);
                console.log(`Bill Amount: ${billAmount}`);
                console.log(`Bill Frequency: ${billFrequency}`);
                console.log('----------------------------------');
            });
        }
    } else {
        console.log('UITM_INFO: Bills submit button not found.');
    }

    // Handle Payments Section
    const paymentsSubmitButton = billsModal.querySelector('.form__btn--payments');
    if (paymentsSubmitButton) {
        if (!paymentsSubmitButton.dataset.uitmListener) {
            paymentsSubmitButton.dataset.uitmListener = 'true';
            paymentsSubmitButton.addEventListener('click', () => {
                const paymentTypeSelect = billsModal.querySelector('.paymentType');
                const paymentNameInput = billsModal.querySelector('.paymentName');
                const paymentAmountInput = billsModal.querySelector('.form__input--amount--payments');
                const paymentFrequencySelect = billsModal.querySelector('.paymentFrequency');

                const paymentType = paymentTypeSelect ? paymentTypeSelect.value : 'not found';
                const paymentName = paymentNameInput ? paymentNameInput.value : 'not found';
                const paymentAmount = paymentAmountInput ? paymentAmountInput.value : 'not found';
                const paymentFrequency = paymentFrequencySelect ? paymentFrequencySelect.value : 'not found';

                console.log('--- UITM: Payments Form Submitted ---');
                console.log(`Payment Type: ${paymentType}`);
                console.log(`Payment Name: ${paymentName}`);
                console.log(`Payment Amount: ${paymentAmount}`);
                console.log(`Payment Frequency: ${paymentFrequency}`);
                console.log('-------------------------------------');
            });
        }
    } else {
        console.log('UITM_INFO: Payments submit button not found.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('UITM: buttonTracker.js loaded and running.');

    const buttonHandlers = {
        'transferBTN': () => {
            console.log('UITM: transferBTN clicked.');
            handleTransferModal();
        },
        'billsModalBTN': () => {
            console.log('UITM: billsModalBTN clicked.');
            handleBillsModal();
        },
        'depositsBTN': () => console.log('UITM: depositsBTN clicked.'),
        'sendMoneyBTN': () => console.log('UITM: sendMoneyBTN clicked.'),
        'messagesBTN': () => console.log('UITM: messagesBTN clicked.'),
        'accountSwitchBTN': () => console.log('UITM: accountSwitchBTN clicked.'),
        'logOutBTN': () => console.log('UITM: logOutBTN clicked.')
    };

    for (const className in buttonHandlers) {
        const elements = document.querySelectorAll(`.${className}`);
        if (elements.length === 0) {
            console.log(`UITM_WARN: No elements found with class '${className}'`);
        }
        elements.forEach(element => {
            element.addEventListener('click', buttonHandlers[className]);
        });
    }
});

import {
  activateLesson,
  processAction,
  activeLessons,
} from "../lessonManager.js";
import { sendStudentSessionData } from "../SDSM/sdsm.js";

function handleAccountSwitchModal() {
  const accountSwitchModal = document.querySelector(".accountSwitchModal");
  if (!accountSwitchModal) {
    console.log("UITM_INFO: Account Switch modal not found.");
    return;
  }

  // Prevent adding listener multiple times
  if (accountSwitchModal.dataset.uitmListener) {
    return;
  }
  accountSwitchModal.dataset.uitmListener = "true";

  accountSwitchModal.addEventListener("click", (e) => {
    if (e.target.classList.contains("form__btn--accountSwitch")) {
      const button = e.target;
      // The account type is the class that is not one of the generic button classes.
      const accountType = Array.from(button.classList).find(
        (cls) =>
          cls !== "form__btn" &&
          cls !== "form__btn--transfer" &&
          cls !== "form__btn--accountSwitch"
      );

      console.log("--- UITM: Account Switch Submitted ---");
      if (accountType) {
        console.log(`Switched to account: ${accountType}`);
        console.log("Checking for matching conditions in active lesson...");
        processAction("account_switched", { accountType: accountType });
      } else {
        console.log("Switched to account: type not found");
      }
      console.log("------------------------------------");
    }
  });
}

function handleTransferModal() {
  // This function is for TRACKING, not for performing the transfer.
  const transferModal = document.querySelector(".transferModal");
  if (!transferModal) {
    console.log("UITM_INFO: Transfer modal not found.");
    return;
  }

  const submitButton = transferModal.querySelector(".form__btn--transfer");
  if (!submitButton) {
    console.log("UITM_INFO: Transfer submit button not found.");
    return;
  }

  // Prevent adding listener multiple times
  if (submitButton.dataset.uitmListener) {
    return;
  }
  submitButton.dataset.uitmListener = "true";

  submitButton.addEventListener("click", () => {
    const fromAccountSelect = transferModal.querySelector(".accountsListFrom");
    const toAccountSelect = transferModal.querySelector(".accountsListTo");
    const amountInput = transferModal.querySelector(
      ".form__input--amount--transfer"
    );

    const fromAccount = fromAccountSelect
      ? fromAccountSelect.value
      : "not found";
    const toAccount = toAccountSelect ? toAccountSelect.value : "not found";
    const amount = amountInput ? amountInput.value : "not found";

    console.log("--- UITM: Transfer Modal Submitted ---");
    console.log(`From Account Value: ${fromAccount}`);
    console.log(`To Account Value: ${toAccount}`);
    console.log(`Amount Value: ${amount}`);
    console.log("------------------------------------");

    processAction("transfer_money", {
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: amount,
    });

    processAction("transfer_money", {
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: amount,
    });
  });
}

function handleBillsModal() {
  const billsModal = document.querySelector(".billsAndPaymentsModal");
  if (!billsModal) {
    console.log("UITM_INFO: Bills and Payments modal not found.");
    return;
  }

  // Handle Bills Section
  const billsSubmitButton = billsModal.querySelector(".form__btn--bills");
  if (billsSubmitButton) {
    if (!billsSubmitButton.dataset.uitmListener) {
      billsSubmitButton.dataset.uitmListener = "true";
      billsSubmitButton.addEventListener("click", () => {
        const billTypeSelect = billsModal.querySelector(".billType");
        const billNameInput = billsModal.querySelector(".billInputName");
        const billAmountInput = billsModal.querySelector(
          ".form__input--amount--bills"
        );
        const billFrequencySelect = billsModal.querySelector(".billFrequency");

        const billType = billTypeSelect ? billTypeSelect.value : "not found";
        const billName = billNameInput ? billNameInput.value : "not found";
        const billAmount = billAmountInput
          ? billAmountInput.value
          : "not found";
        const billFrequency = billFrequencySelect
          ? billFrequencySelect.value
          : "not found";

        console.log("--- UITM: Bills Form Submitted ---");
        console.log(`Bill Type: ${billType}`);
        console.log(`Bill Name: ${billName}`);
        console.log(`Bill Amount: ${billAmount}`);
        console.log(`Bill Frequency: ${billFrequency}`);
        console.log("Checking for matching conditions in active lesson...");
        console.log("----------------------------------");

        processAction("bill_submitted", {
          billType: billType,
          billName: billName,
          billAmount: billAmount,
          billFrequency: billFrequency,
        });
      });
    }
  } else {
    console.log("UITM_INFO: Bills submit button not found.");
  }

  // Handle Payments Section
  const paymentsSubmitButton = billsModal.querySelector(".form__btn--payments");
  if (paymentsSubmitButton) {
    if (!paymentsSubmitButton.dataset.uitmListener) {
      paymentsSubmitButton.dataset.uitmListener = "true";
      paymentsSubmitButton.addEventListener("click", () => {
        const paymentTypeSelect = billsModal.querySelector(".paymentType");
        const paymentNameInput = billsModal.querySelector(".paymentName");
        const paymentAmountInput = billsModal.querySelector(
          ".form__input--amount--payments"
        );
        const paymentFrequencySelect =
          billsModal.querySelector(".paymentFrequency");

        const paymentType = paymentTypeSelect
          ? paymentTypeSelect.value
          : "not found";
        const paymentName = paymentNameInput
          ? paymentNameInput.value
          : "not found";
        const paymentAmount = paymentAmountInput
          ? paymentAmountInput.value
          : "not found";
        const paymentFrequency = paymentFrequencySelect
          ? paymentFrequencySelect.value
          : "not found";

        console.log("--- UITM: Payments Form Submitted ---");
        console.log(`Payment Type: ${paymentType}`);
        console.log(`Payment Name: ${paymentName}`);
        console.log(`Payment Amount: ${paymentAmount}`);
        console.log(`Payment Frequency: ${paymentFrequency}`);
        console.log("Checking for matching conditions in active lesson...");
        console.log("-------------------------------------");

        processAction("payment_submitted", {
          paymentType: paymentType,
          paymentName: paymentName,
          paymentAmount: paymentAmount,
          paymentFrequency: paymentFrequency,
        });
      });
    }
  } else {
    console.log("UITM_INFO: Payments submit button not found.");
  }
}

function handleDepositModal() {
  // This function is for TRACKING, not for performing the deposit.
  const depositModal = document.querySelector(".check-container");
  if (!depositModal) {
    console.log(
      "UITM_INFO: Deposit modal not found. The .check-container element is missing."
    );
    return;
  }

  // The deposit submit button is currently not inside the .check-container element.
  // For this reason, we are selecting it from the document root.
  // This is not ideal. For a more robust solution, the submit button should be moved inside the .check-container in the HTML.
  // Also, the button has conflicting classes 'form__btn--transfer' and 'form__btn--payments' which should be removed.
  const submitButton = document.querySelector(".submitBtn");
  if (!submitButton) {
    console.log(
      "UITM_INFO: Deposit submit button with class .submitBtn not found in the document."
    );
    return;
  }

  // Prevent adding listener multiple times
  if (submitButton.dataset.uitmListener) {
    return;
  }
  submitButton.dataset.uitmListener = "true";

  submitButton.addEventListener("click", () => {
    const nameInput = document.getElementById("name-input");
    const addressInput = document.getElementById("address-input");
    const dateInput = document.getElementById("date-input");
    const payToSelect = document.getElementById("name-payto");
    const amountInput = document.getElementById("dollar");
    const memoInput = document.getElementById("memo");
    const signatureInput = document.getElementById("signature");

    const name = nameInput ? nameInput.value : "not found";
    const address = addressInput ? addressInput.value : "not found";
    const date = dateInput ? dateInput.value : "not found";
    const payTo = payToSelect ? payToSelect.value : "not found";
    const amount = amountInput ? amountInput.value : "not found";
    const memo = memoInput ? memoInput.value : "not found";
    const signature = signatureInput ? signatureInput.value : "not found";

    console.log("--- UITM: Deposit Modal Submitted ---");
    console.log(`Name: ${name}`);
    console.log(`Address: ${address}`);
    console.log(`Date: ${date}`);
    console.log(`Pay To: ${payTo}`);
    console.log(`Amount: ${amount}`);
    console.log(`Memo: ${memo}`);
    console.log(`Signature: ${signature}`);
    console.log("Checking for matching conditions in active lesson...");
    console.log("------------------------------------");

    processAction("deposit_submitted", {
      name: name,
      address: address,
      date: date,
      payTo: payTo,
      amount: amount,
      memo: memo,
      signature: signature,
    });
  });
}

function handleSendMoneyModal() {
  // This function is for TRACKING, not for performing the action.
  const sendMoneyModal = document.querySelector(".sendMoneyModal"); // Assuming this is the modal class
  if (!sendMoneyModal) {
    console.log("UITM_INFO: Send Money modal not found.");
    return;
  }

  const submitButton = sendMoneyModal.querySelector(".sendBtn");
  if (!submitButton) {
    console.log("UITM_INFO: Send Money submit button not found.");
    return;
  }

  // Prevent adding listener multiple times
  if (submitButton.dataset.uitmListener) {
    return;
  }
  submitButton.dataset.uitmListener = "true";

  submitButton.addEventListener("click", () => {
    const recipientSelect = sendMoneyModal.querySelector(".recipients");
    const amountInput = sendMoneyModal.querySelector(
      ".form__input--amount--sendMoney"
    );

    const recipient = recipientSelect ? recipientSelect.value : "not found";
    const amount = amountInput ? amountInput.value : "not found";

    console.log("--- UITM: Send Money Modal Submitted ---");
    console.log(`Recipient: ${recipient}`);
    console.log(`Amount: ${amount}`);
    console.log("Checking for matching conditions in active lesson...");
    console.log("------------------------------------");

    processAction("send_money", {
      recipient: recipient,
      amount: amount,
    });
  });
}

function handleMessagesModal() {
  const messagesContainer = document.querySelector(".messages-container");
  if (!messagesContainer) {
    console.log("UITM_INFO: Messages container not found.");
    return;
  }

  // Function to set up send button listener
  function initializeSendButton() {
    const sendButton = messagesContainer.querySelector(".reply-send-btn");
    if (!sendButton) {
      console.log("UITM_INFO: Messages send button not found for this thread.");
      return;
    }

    if (sendButton.dataset.uitmListener) {
      return;
    }
    sendButton.dataset.uitmListener = "true";

    sendButton.addEventListener("click", () => {
      const activeThreadElement = messagesContainer.querySelector(
        ".thread-item.active-thread"
      );

      // Get the active thread ID and details
      const activeThreadId = activeThreadElement
        ? activeThreadElement.dataset.threadId
        : "not found";
      const messageDateTime = new Date().toISOString();

      // Parse the thread ID to get sender and recipient
      let sender = "not found";
      let recipient = "not found";

      if (activeThreadId !== "not found") {
        const participants = activeThreadId.split("_");

        // Handle special case for class announcements
        if (activeThreadId === "class-message-admin@trinity-capital.net") {
          sender = "Student";
          recipient = "Class Announcements";
        } else {
          // For normal threads, parse the participants
          const threadName =
            activeThreadElement.querySelector(".thread-name")?.textContent ||
            "";
          sender = participants[0];
          // The recipient is the thread name (which shows who we're talking to)
          recipient = threadName;
        }
      }

      console.log("--- UITM: Message Sent ---");
      console.log(`Active Thread ID: ${activeThreadId}`);
      console.log(`Sender: ${sender}`);
      console.log(`Recipient: ${recipient}`);
      console.log(`Date/Time: ${messageDateTime}`);
      console.log("Checking for matching conditions in active lesson...");
      console.log("------------------------------------");

      processAction("message_sent", {
        threadId: activeThreadId,
        sender: sender,
        recipient: recipient,
        timestamp: messageDateTime,
      });
    });
  }

  // Add click listeners to all thread items
  const threadList = messagesContainer.querySelector(".thread-list");
  if (threadList) {
    const threadItems = threadList.querySelectorAll(".thread-item");
    threadItems.forEach((thread) => {
      if (!thread.dataset.uitmListener) {
        thread.dataset.uitmListener = "true";
        thread.addEventListener("click", () => {
          console.log("--- UITM: Thread Selected ---");
          console.log(`Thread ID: ${thread.dataset.threadId}`);
          const threadName =
            thread.querySelector(".thread-name")?.textContent || "not found";
          console.log(`Thread Name: ${threadName}`);
          console.log("--------------------------");

          processAction("thread_selected", {
            threadId: thread.dataset.threadId,
            threadName: threadName,
          });

          // Initialize send button after thread selection
          setTimeout(() => {
            initializeSendButton();
          }, 100); // Small delay to ensure DOM is updated
        });
      }
    });
  }

  // Get student name from the DOM (assuming there's an element with student's name)
  const studentNameElement = document.querySelector(".signOnText"); // Update selector as needed
  const studentName = studentNameElement
    ? studentNameElement.textContent
    : "Unknown Student";

  console.log("=== Student Session Data ===");
  console.log(`Student Name: ${studentName}`);
  console.log("\nActive Lessons:");
  activeLessonDetails.forEach((lesson) => {
    console.log(`- ${lesson.title}`);
    console.log(`  ID: ${lesson.id}`);
    console.log(`  Time Spent: ${lesson.elapsedTime} minutes`);
  });
  console.log("==========================");

  // Prepare payload for SDSM (student data storage module)
  const payload = {
    studentName,
    activeLessons: activeLessonDetails,
    lessonTimers,
    timestamp: Date.now(),
  };

  // Send to backend SDSM endpoint (http://localhost:4000) and log result
  try {
    sendStudentSessionData(payload)
      .then((result) => {
        if (result && result.ok) {
          console.log("SDSM: session data stored successfully", result.data);
        } else {
          console.warn("SDSM: failed to store session data", result);
        }
      })
      .catch((err) => {
        console.error("SDSM: unexpected error while sending session data", err);
      });
  } catch (err) {
    console.error("SDSM: error invoking sendStudentSessionData", err);
  }
}

// Build the same payload for use with sendBeacon on unload
export function buildSessionPayload(currentProfile) {
  // Get lesson timers from sessionStorage
  const lessonTimers = {};
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key.startsWith("lesson_timer_")) {
      const lessonId = key.replace("lesson_timer_", "");
      const startTime = parseInt(sessionStorage.getItem(key));
      const elapsedTime = Date.now() - startTime;
      lessonTimers[lessonId] = {
        startTime: startTime,
        elapsedTime: Math.floor(elapsedTime / 1000),
        elapsedMinutes: Math.floor(elapsedTime / 60000),
      };
    }
  }

  const activeLessonDetails = Array.from(activeLessons.values()).map(
    (lesson) => ({
      id: lesson._id,
      title: lesson.lesson_title,
      elapsedTime: lessonTimers[lesson._id]
        ? lessonTimers[lesson._id].elapsedMinutes
        : 0,
    })
  );

  const studentName = currentProfile
    ? currentProfile.memberName
    : "Unknown Student";

  return {
    studentName,
    activeLessons: activeLessonDetails,
    lessonTimers,
    timestamp: Date.now(),
  };
}

// Use navigator.sendBeacon during unload to reliably send a small payload
function sendSessionWithBeacon(payload) {
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const url = "http://localhost:4000/api/sdsm/session";
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      const ok = navigator.sendBeacon(url, blob);
      console.log("SDSM: sendBeacon invoked, queued:", ok, payload);
      return ok;
    } else {
      // Fallback: attempt a synchronous XHR (not ideal) — try best-effort
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:4000/api/sdsm/session", false); // synchronous
      xhr.setRequestHeader("Content-Type", "application/json");
      try {
        xhr.send(JSON.stringify(payload));
        console.log("SDSM: synchronous XHR send on unload, status", xhr.status);
        return xhr.status >= 200 && xhr.status < 300;
      } catch (err) {
        console.warn("SDSM: synchronous XHR failed on unload", err);
        return false;
      }
    }
  } catch (err) {
    console.error("SDSM: error in sendSessionWithBeacon", err);
    return false;
  }
}

export function handleLessonModal(lesson) {
  const modal = document.querySelector(".new-lesson-modal");
  if (!modal) {
    console.error("New lesson modal not found.");
    return;
  }

  const beginActivitiesBtn = modal.querySelector(".begin-activities-btn");
  if (beginActivitiesBtn) {
    // Prevent adding listener multiple times
    if (beginActivitiesBtn.dataset.uitmListener) {
      return;
    }
    beginActivitiesBtn.dataset.uitmListener = "true";

    beginActivitiesBtn.addEventListener("click", () => {
      console.log(`${lesson.lesson_title} active`);

      // Set the active lesson
      activateLesson(lesson);

      // Process the 'begin_activities' action
      processAction("begin_activities", {
        lessonTitle: lesson.lesson_title,
        lessonId: lesson._id,
      });

      modal.close();
    });
  }
}

// Handle page refresh and close — use sendBeacon for reliable background send
window.addEventListener("beforeunload", (event) => {
  // This is a best-effort attempt for page refresh/close.
  // We can't get currentProfile reliably here without async, which is not allowed.
  // The primary path for saving session data is the explicit logout button.
  // We pass `null` for currentProfile, so it will log as "Unknown Student".
  const payload = buildSessionPayload(null);
  sendSessionWithBeacon(payload);
});

document.addEventListener("DOMContentLoaded", () => {
  console.log("UITM: buttonTracker.js loaded and running.");

  const buttonHandlers = {
    transferBTN: () => {
      console.log(
        "--- UITM: Checking for transfer conditions in active lesson ---"
      );
      processAction("transfer_button_clicked", {});
      handleTransferModal();
    },
    billsModalBTN: () => {
      console.log(
        "--- UITM: Checking for bills/payments conditions in active lesson ---"
      );
      processAction("bills_button_clicked", {});
      handleBillsModal();
    },
    depositsBTN: () => {
      console.log(
        "--- UITM: Checking for deposit conditions in active lesson ---"
      );
      processAction("deposit_button_clicked", {});
      handleDepositModal();
    },
    sendMoneyBTN: () => {
      console.log(
        "--- UITM: Checking for send money conditions in active lesson ---"
      );
      processAction("send_money_button_clicked", {});
      handleSendMoneyModal();
    },
    messagesBTN: () => {
      console.log(
        "--- UITM: Checking for message conditions in active lesson ---"
      );
      processAction("messages_button_clicked", {});
      handleMessagesModal();
    },
    accountSwitchBTN: () => {
      console.log("UITM: accountSwitchBTN clicked.");
      handleAccountSwitchModal();
    },
    logOutBTN: (e) => {
      console.log("UITM: logOutBTN clicked. Reloading page to log out.");
      location.reload();
    },
  };

  for (const className in buttonHandlers) {
    const elements = document.querySelectorAll(`.${className}`);
    if (elements.length === 0) {
      console.log(`UITM_WARN: No elements found with class '${className}'`);
    }
    elements.forEach((element) => {
      element.addEventListener("click", buttonHandlers[className]);
    });
  }
});

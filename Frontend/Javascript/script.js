'use strict';

import { renderLessons } from './lessonEngine.js';
const socket = io('https://tcstudentserver-production.up.railway.app');

if (
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|OperaMini/i.test(
    navigator.userAgent,
  )
) {
  window.location.replace('https://trinitycapitalmobile.netlify.app');
} else {
  console.log('Were on MOBILE!');
}

/********************************************Modal control*************************************/

//Modals
const mainApp = document.querySelector('.mainApp');
const loginBox = document.querySelector('.signOnBox');
const mobileLoginBox = document.querySelector('.mobileSignOnBox');
const billsModal = document.querySelector('.billsAndPaymentsModal');
const transferModal = document.querySelector('.transferModal');
const accountSwitchModal = document.querySelector('.accountSwitchModal');
const depositModal = document.querySelector('.depositModal');
const sendMoneyModal = document.querySelector('.sendMoneyModal');
const messagesModal = document.querySelector('.messagesModal');

//Modal Buttons
const accountSwitchBTN = document.querySelector('.accountSwitchBTN');
const transferModalBTN = document.querySelector('.transferBTN');
const billsModalBTN = document.querySelector('.billsModalBTN');
const depositModalBTN = document.querySelector('.depositsBTN');
const sendMoneyBTN = document.querySelector('.sendMoneyBTN');
const messagesBTN = document.querySelector('.messagesBTN');

//close Modals
const closeTransferModal = document.querySelector('.transferExitButton');
const closeBillModal = document.querySelector('.closeBills');
const closeAccountModal = document.querySelector('.closeAccounts');
const closeDepositModal = document.querySelector('.closeDeposits');
const closeSendMoneyModal = document.querySelector('.closeSendMoney');
const logOutBTN = document.querySelector('.logOutBTN');

logOutBTN.addEventListener('click', function () {
  location.reload();
});

billsModalBTN.addEventListener('click', function () {
  billsModal.showModal();
});

closeBillModal.addEventListener('click', function () {
  billsModal.close();
});

transferModalBTN.addEventListener('click', function () {
  transferModal.showModal();
});

closeTransferModal.addEventListener('click', function () {
  transferModal.close();
});

accountSwitchBTN.addEventListener('click', function () {
  accountSwitchModal.showModal();
});

closeAccountModal.addEventListener('click', function () {
  accountSwitchModal.close();
});

depositModalBTN.addEventListener('click', function () {
  depositModal.showModal();
});

closeDepositModal.addEventListener('click', function () {
  depositModal.close();
});

sendMoneyBTN.addEventListener('click', function () {
  sendMoneyModal.showModal();
});

closeSendMoneyModal.addEventListener('click', function () {
  sendMoneyModal.close();
});

messagesBTN.addEventListener('click', openMessageCenter);

/********************************************Functions *********************************************/
if (mainApp) {
  mainApp.style.opacity = 0;
}

/**
 * Fetches all messages for the student and processes them into threads.
 * This is called once after login.
 * @param {string} studentName - The full name of the currently logged-in student.
 */
async function initializeStudentMessaging(studentName) {
  console.log('Inside initializeStudentMessaging for:', studentName);
  try {
    console.log(
      'Attempting to fetch messages from:',
      `https://tcstudentserver-production.up.railway.app/messages/${studentName}`,
    );
    const response = await fetch(
      `https://tcstudentserver-production.up.railway.app/messages/${studentName}`,
    );

    if (!response.ok) {
      console.error(
        `Fetch response not OK. Status: ${response.status}, StatusText: ${response.statusText}`,
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Fetch response OK. Parsing JSON...');
    let { threads } = await response.json(); // Expect { threads: [...] }
    console.log(
      'All threads fetched from DB for this student on login:',
      threads,
    ); // Log messages here

    if (!threads || !Array.isArray(threads)) {
      console.log('No threads found for student or invalid format.');
      threads = []; // Ensure it's an array to prevent errors
    }

    // Store the processed threads globally as a Map for easier lookup by threadId
    currentMessageThreads = new Map(threads.map(t => [t.threadId, t]));
    console.log(
      'Student message threads initialized on login:',
      currentMessageThreads,
    );
  } catch (error) {
    console.error('Failed to initialize student messaging:', error);
    console.error('Error details:', error.message, error.stack); // Log full error details
    // On failure, ensure at least a fallback class thread exists
    const fallbackThreads = new Map();
    fallbackThreads.set(`class-message-${studentName}`, {
      threadId: `class-message-${studentName}`,
      type: 'class',
      messages: [],
      lastMessageTimestamp: new Date().toISOString(),
    });
    currentMessageThreads = fallbackThreads;
  }
}
let currentMessageThreads = new Map(); // This will now store processed threads as a Map

/**
 * Opens the message center, fetches threads, and displays them.
 */
async function openMessageCenter() {
  if (!currentProfile) {
    alert('Please log in to view messages.');
    return;
  }

  messagesModal.showModal();

  const closeBtn = messagesModal.querySelector('.close-messages-modal');
  if (closeBtn) {
    closeBtn.onclick = () => messagesModal.close();
  }

  // Get the new thread button and attach listener
  const newThreadButton = messagesModal.querySelector('.new-thread-button');
  // Ensure the listener is only added once
  if (newThreadButton && !newThreadButton.dataset.listenerAdded) {
    newThreadButton.addEventListener('click', async () => {
      try {
        // Fetch classmates from the server
        const response = await fetch(
          `https://tcstudentserver-production.up.railway.app/classmates/${currentProfile.memberName}`,
        );
        if (!response.ok) {
          throw new Error('Failed to fetch classmates');
        }
        const classmates = await response.json();

        if (!classmates || classmates.length === 0) {
          alert(
            'You are the only student in your class or no classmates found.',
          );
          return;
        }

        // Display classmates for selection using a simple prompt
        const classmateList = classmates
          .map((classmate, index) => `${index + 1}. ${classmate}`)
          .join('\n');
        const selectionInput = prompt(
          `Select a classmate to start a new conversation (enter number or name):\n${classmateList}`,
        );

        if (selectionInput === null) {
          // User cancelled the prompt
          return;
        }

        let selectedClassmate = null;
        const selectionIndex = parseInt(selectionInput) - 1;

        if (
          !isNaN(selectionIndex) &&
          selectionIndex >= 0 &&
          selectionIndex < classmates.length
        ) {
          selectedClassmate = classmates[selectionIndex];
        } else if (classmates.includes(selectionInput)) {
          selectedClassmate = selectionInput;
        } else {
          alert('Invalid selection. Please enter a valid number or name.');
          return;
        }

        // Create a new thread with the selected classmate
        await createNewThread(selectedClassmate);

        // Update the UI with the new thread by re-opening the message center
        await openMessageCenter();
      } catch (error) {
        console.error('Error creating a new thread:', error);
        alert('Failed to create a new thread. Please try again.');
      }
    });
    newThreadButton.dataset.listenerAdded = 'true'; // Mark listener as added
  }

  // Check if messages are already loaded from login
  if (currentMessageThreads.size > 0) {
    console.log('Messages already loaded, displaying cached threads.');
    displayMessageThreads(currentMessageThreads, null, {
      autoSelectFirst: true,
    });
    return; // Exit early, no need to refetch
  }
  try {
    const response = await fetch(
      `https://tcstudentserver-production.up.railway.app/messages/${currentProfile.memberName}`,
    );
    if (!response.ok) throw new Error('Failed to fetch threads');
    const { threads } = await response.json(); // Expect { threads: [...] }

    // Convert array of thread objects to a Map for easier lookup by threadId
    currentMessageThreads = new Map(threads.map(t => [t.threadId, t]));
    displayMessageThreads(currentMessageThreads, null, {
      autoSelectFirst: true,
    });
  } catch (error) {
    console.error('Error opening message center:', error);
    const threadList = messagesModal.querySelector('.thread-list');
    threadList.innerHTML = '<li>Error loading messages.</li>';
  }
}

/**
 * Renders the list of message threads on the left pane of the modal.
 * @param {object} threads - An object containing message threads.
 * @param {string|null} activeThreadId - The ID of the thread to mark as active.
 * @param {object} options - Options for rendering (e.g., autoSelectFirst).
 */
function displayMessageThreads(
  threadsMap,
  activeThreadId = null,
  options = {},
) {
  const { autoSelectFirst = true } = options;
  const threadList = messagesModal.querySelector('.thread-list');
  const conversationBody = messagesModal.querySelector('.conversation-body');
  const conversationHeader = messagesModal.querySelector('.conversation-with');

  // Before clearing, find out which thread is currently active
  const previouslyActiveThread = threadList.querySelector(
    '.thread-item.active-thread',
  );
  const currentActiveThreadId =
    previouslyActiveThread?.dataset.threadId || activeThreadId;

  threadList.innerHTML = '';
  conversationBody.innerHTML = '';
  conversationHeader.textContent = 'Select a conversation';

  // Ensure Class Announcements thread is always present at the top
  const classThreadId = `class-message-${currentProfile.teacher}`;
  if (!threadsMap.has(classThreadId)) {
    threadsMap.set(classThreadId, {
      threadId: classThreadId,
      type: 'class',
      messages: [],
      lastMessageTimestamp: new Date(0).toISOString(), // Epoch for sorting to bottom if no messages
    });
  }
  const threads = Array.from(threadsMap.values());

  // Sort threads by the last message timestamp (most recent first)
  threads.sort((a, b) => {
    return new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp);
  });

  // Separate class thread to always put it at the top
  const classThread = threads.find(t => t.threadId === classThreadId);
  const otherThreads = threads.filter(t => t.threadId !== classThreadId);

  if (classThread) {
    threadList.appendChild(createThreadElement(classThread));
  }
  threads.forEach(thread => {
    if (thread.threadId === classThreadId) return; // Skip if already added
    const li = createThreadElement(thread);
    if (thread.threadId === currentActiveThreadId) {
      li.classList.add('active-thread');
    }
    if (thread.hasUnread) {
      // Assuming hasUnread is a frontend-only flag
      li.classList.add('has-unread');
    }
    threadList.appendChild(li);
  });

  let threadToActivate = threadList.querySelector(
    `[data-thread-id="${CSS.escape(currentActiveThreadId)}"]`,
  );

  // If no thread is specifically active, but we should auto-select, pick the first one.
  if (!threadToActivate && autoSelectFirst && threadList.firstChild) {
    threadToActivate = threadList.firstChild;
  }

  if (threadToActivate) {
    threadToActivate.click();
  } else {
    // Only show this if there are truly no threads to display
    conversationBody.innerHTML = '<p>You have no messages.</p>';
    conversationHeader.textContent = 'Select a conversation';
  }
}

/**
 * Creates a single thread item (<li>) for the list.
 * @param {object} threadData - The thread object from the Map.
 * @returns {HTMLLIElement} The created list item element.
 */
function createThreadElement(threadData) {
  const li = document.createElement('li');
  li.className = 'thread-item';
  li.dataset.threadId = threadData.threadId;

  // Determine display name for the thread
  let displayName;
  if (threadData.type === 'class') {
    displayName = 'Class Announcements'; // Consistent name for students
  } else {
    // For private messages, find the other participant's name
    const otherParticipant = threadData.participants?.find(
      p => p !== currentProfile.memberName,
    );
    displayName = otherParticipant || threadData.threadId; // Fallback to threadId
  }

  // Get last message content for preview
  const lastMessage =
    threadData.messages.length > 0
      ? threadData.messages[threadData.messages.length - 1]
      : { message: 'No messages yet.' };

  const lastMessageContent = lastMessage.messageContent || lastMessage.message; // Handle old and new message structure

  li.innerHTML = `
    <h3 class="thread-name">${displayName}</h3>
    <p class="thread-preview">${lastMessageContent.substring(0, 25)}...</p>
  `;

  li.addEventListener('click', () => {
    document
      .querySelectorAll('.thread-item')
      .forEach(item => item.classList.remove('active-thread'));
    li.classList.add('active-thread');
    displayConversation(threadData.threadId, threadData.messages);
  });

  return li;
}

/**
 * Displays the messages for a selected conversation.
 * @param {string} threadId - The ID of the conversation thread.
 * @param {Array} messages - An array of message objects.
 */
function displayConversation(threadId, messages) {
  const conversationView = messagesModal.querySelector('.conversation-view');
  const conversationBody = messagesModal.querySelector('.conversation-body');
  const conversationHeader = messagesModal.querySelector('.conversation-with');

  const threadData = currentMessageThreads.get(threadId);
  let conversationPartnerName = threadId; // Default
  if (threadData) {
    if (threadData.type === 'class') {
      conversationPartnerName = 'Class Announcements';
    } else {
      conversationPartnerName =
        threadData.participants?.find(p => p !== currentProfile.memberName) ||
        threadId;
    }
  }
  conversationHeader.textContent = `Conversation with ${conversationPartnerName}`;
  conversationBody.innerHTML = '';

  messages.forEach(msg => {
    const wrapperElement = document.createElement('div');
    wrapperElement.classList.add('message-wrapper');
    wrapperElement.classList.add(
      msg.senderId === currentProfile.memberName ? 'sent' : 'received',
    );

    const senderTag =
      msg.isClassMessage && msg.senderId !== currentProfile.memberName
        ? `<strong class="message-sender-name">${msg.senderId}</strong>`
        : '';
    const formattedTimestamp = new Date(msg.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    wrapperElement.innerHTML = `
      <div class="message-item">
        ${senderTag}
        <p class="message-content">${msg.messageContent}</p>
      </div>
      <span class="message-timestamp">${formattedTimestamp}</span>
    `;
    conversationBody.appendChild(wrapperElement);
  });

  // The reply functionality depends on the .conversation-view element.
  // If it doesn't exist, we skip this part to prevent errors.
  if (conversationView) {
    // Handle reply form
    let conversationFooter = conversationView.querySelector(
      '.conversation-footer',
    );
    if (conversationFooter) {
      conversationFooter.remove(); // Clean up old one to prevent multiple listeners
    }

    // Add reply box, but not for "Class Announcements"
    if (threadData.type !== 'class') {
      conversationFooter = document.createElement('div');
      conversationFooter.className = 'conversation-footer';
      conversationFooter.innerHTML = `
        <div class="reply-form">
          <input type="text" class="reply-input" placeholder="Type your reply..." aria-label="Reply message">
          <button class="reply-send-btn" aria-label="Send reply"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      `;
      // Append footer to the main conversation view, not inside the scrollable body
      conversationView.appendChild(conversationFooter);

      const sendBtn = conversationFooter.querySelector('.reply-send-btn');
      const replyInput = conversationFooter.querySelector('.reply-input');

      const handleSend = () => {
        const messageText = replyInput.value.trim();
        if (messageText) {
          // For private messages, extract the actual recipient name from the threadId
          let actualRecipientId = threadId;
          if (threadData.type === 'private') {
            const participants = threadId.split('_');
            actualRecipientId = participants.find(
              p => p !== currentProfile.memberName,
            );
          } else if (threadData.type === 'class') {
            // Class messages are sent to a specific class thread ID
            actualRecipientId = `class-message-${currentProfile.teacher}`; // Assuming student has a teacher property
          }
          sendMessage(actualRecipientId, messageText);
          replyInput.value = ''; // Clear input after sending
        }
      };

      sendBtn.addEventListener('click', handleSend);
      replyInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSend();
        }
      });
      replyInput.focus();
    }
  } else {
    // If it's a class message, remove any existing reply form
    const existingFooter = conversationView.querySelector(
      '.conversation-footer',
    );
    if (existingFooter) existingFooter.remove();
    // No reply form for class messages for students
  }

  conversationBody.scrollTop = conversationBody.scrollHeight;
}

/**
 * Creates a new thread in the database with the specified recipient.
 * @param {string} recipientId - The ID of the recipient (classmate).
 */
async function createNewThread(recipientId) {
  try {
    const response = await fetch('https://tcstudentserver-production.up.railway.app/newThread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participants: [currentProfile.memberName, recipientId],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to create new thread in the database: ${errorData.error || response.statusText}`,
      );
    }
    const responseData = await response.json();
    console.log(responseData.message); // Log success message or "Thread already exists"
  } catch (error) {
    console.error('Error creating new thread:', error);
    throw error; // Re-throw to be caught by the caller
  }
}

/**
 * Sends a message from the student to the recipient.
 * @param {string} recipientName - The name of the recipient.
 * @param {string} messageText - The content of the message.
 */
function sendMessage(recipientIdForServer, messageContent) {
  // Determine if it's a class message based on the recipient ID
  const isClassMessage = recipientIdForServer.startsWith('class-message-');
  const teacherNameForClassMessage = currentProfile.teacher; // Get teacher's name for class messages
  const payload = {
    senderId: currentProfile.memberName,
    recipientId: recipientIdForServer, // This is the actual recipient for the server
    messageContent: messageContent,
  };

  // 1. Emit the message to the server
  socket.emit('sendMessage', payload);

  // --- OPTIMISTIC UPDATE ---
  // Determine the threadId for the frontend's internal Map.
  let threadId;
  if (isClassMessage) {
    threadId = `class-message-${teacherNameForClassMessage}`; // Canonical threadId for class messages
  } else {
    // For private messages, create a canonical threadId by sorting participants
    const sortedParticipants = [
      currentProfile.memberName,
      recipientIdForServer,
    ].sort();
    threadId = sortedParticipants.join('_');
  }

  // Ensure thread object exists in our local Map
  if (!currentMessageThreads.has(threadId)) {
    console.log(`Optimistically creating new thread for ${threadId}`);
    currentMessageThreads.set(threadId, {
      threadId: threadId,
      type: isClassMessage ? 'class' : 'private',
      participants: isClassMessage
        ? [currentProfile.memberName, teacherNameForClassMessage] // Participants for class message
        : [currentProfile.memberName, recipientIdForServer],
      messages: [], // Actual messages will be pushed by 'newMessage' handler
      lastMessageTimestamp: new Date().toISOString(),
      hasUnread: false,
    });
  }

  // Add the optimistic message to the thread's messages array
  const threadData = currentMessageThreads.get(threadId);
  const optimisticMessage = {
    senderId: payload.senderId,
    recipientId: payload.recipientId,
    messageContent: payload.messageContent,
    timestamp: new Date().toISOString(),
    isClassMessage: isClassMessage,
    read: false,
    isOptimistic: true, // Flag for deduplication on server echo
  };
  threadData.messages.push(optimisticMessage);
  threadData.lastMessageTimestamp = optimisticMessage.timestamp;

  // Re-render the conversation to show the optimistic message
  displayConversation(threadId, threadData.messages);
}

/**
 * Handles an incoming new message from the socket.
 * @param {object} data - The message data from the socket.
 */
function handleNewMessage(message) {
  const { senderId, recipientId, messageContent, isClassMessage, timestamp } =
    message;
  const currentStudent = currentProfile.memberName;

  // Determine the thread ID for the incoming message
  let threadId;
  if (isClassMessage) {
    threadId = `class-message-${currentProfile.teacher}`; // Canonical threadId for class messages
  } else {
    const sortedParticipants = [senderId, recipientId].sort();
    threadId = sortedParticipants.join('_');
  }

  // Find or create the thread in our data map
  if (!currentMessageThreads.has(threadId)) {
    console.log(
      `newMessage received for new threadId: ${threadId}. Creating it.`,
    );
    currentMessageThreads.set(threadId, {
      threadId: threadId,
      type: isClassMessage ? 'class' : 'private',
      participants: isClassMessage // For class messages, participants should include the teacher
        ? [senderId, currentProfile.teacher]
        : [senderId, recipientId],
      messages: [],
      lastMessageTimestamp: timestamp,
    });
  }
  const threadData = currentMessageThreads.get(threadId);

  // --- DEDUPLICATION LOGIC ---
  // If the incoming message is from the current user, it might be an echo of an optimistic update.
  if (senderId === currentStudent) {
    const lastMessage = threadData.messages[threadData.messages.length - 1];
    // Check if the last message is an optimistic one that matches the incoming one.
    if (
      lastMessage &&
      lastMessage.isOptimistic &&
      lastMessage.messageContent === messageContent
    ) {
      // It's a match. Replace the optimistic message with the confirmed one from the server.
      threadData.messages.pop(); // Remove optimistic one
      threadData.messages.push(message); // Add server-confirmed one
      threadData.lastMessageTimestamp = timestamp;

      if (messagesModal.open) {
        displayMessageThreads(currentMessageThreads, threadId, {
          autoSelectFirst: false,
        });
      }
      return; // Stop here to prevent adding a duplicate message.
    }
  }

  // Add the new message and update the preview info
  threadData.messages.push(message);
  threadData.lastMessageTimestamp = timestamp;

  // If the message modal is open, update the UI
  if (messagesModal.open) {
    // Re-render the threads panel to update previews and sorting
    // We set autoSelectFirst to false to prevent it from re-triggering a click event,
    // which would cause the message to be rendered twice.
    displayMessageThreads(currentMessageThreads, threadId, {
      autoSelectFirst: false,
    });

    // The call to displayMessageThreads above will handle re-rendering the active conversation.
    // Manually appending the message here would cause duplicates.
  } else {
    // If the dialog is closed, mark the thread as unread (if you implement this feature)
    threadData.hasUnread = true; // You'll need to add CSS for this
  }
}

// Listen for new threads created in real time
socket.on('threadCreated', thread => {
  if (!thread || !thread.threadId) return;
  // Add the new thread to the currentMessageThreads map if not present
  if (!currentMessageThreads.has(thread.threadId)) {
    currentMessageThreads.set(thread.threadId, thread);
    // Re-render the thread list and auto-select the new thread
    displayMessageThreads(currentMessageThreads, thread.threadId, {
      autoSelectFirst: false,
    });
  }
});

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

    currentProfile.currency,
  );

  let lastTransactionDate = new Date(
    currentProfile.checkingAccount.movementsDates[
      currentProfile.checkingAccount.movementsDates.length - 1
    ],
  ).toLocaleDateString(currentProfile.locale);

  let lastTransactionDateSavings = new Date(
    currentProfile.savingsAccount.movementsDates[
      currentProfile.savingsAccount.movementsDates.length - 1
    ],
  ).toLocaleDateString(currentProfile.locale);

  const html = [
    `
        <div class="row accountsRow">
          <div class="col accountType">${
            currentProfile.checkingAccount.accountType
          }</div>
          <div class="col accountNumber">${currentProfile.checkingAccount.accountNumber.slice(
            -4,
          )}</div>
          <div class="col updateDate">${lastTransactionDate}</div>
        </div>
      
      <div class="row accountsRow">
        <div class="col accountType">${
          currentProfile.savingsAccount.accountType
        }</div>
        <div class="col accountNumber">${currentProfile.savingsAccount.accountNumber.slice(
          -4,
        )}</div>
        <div class="col updateDate">${lastTransactionDateSavings}</div>
      </div>
      `,
  ];

  accountContainer.insertAdjacentHTML('beforeEnd', html);
};

if ((mobileLoginBox, loginBox)) {
  window.screen.width <= 1300
    ? mobileLoginBox.showModal()
    : loginBox.showModal();
}

if (mainApp) mainApp.style.display = 'none';

/***********************************************************Server Listeners**********************************************/

// Emit 'identify' event to associate the client with a user ID
socket.on('connect', () => {
  console.log('User connected:', socket.id);

  // Emit the 'identify' event with the user ID (replace 'userId' with actual logic)
});

// Listen for checking account updates
socket.on('checkingAccountUpdate', updatedChecking => {
  console.log('Checking account update received:', updatedChecking);

  // Update the UI with the received checking account data
  displayBalance(updatedChecking);
  displayTransactions(updatedChecking);
});

// Listen for donation updates for checking accounts
socket.on('donationChecking', updatedDonCheck => {
  console.log('Donation to checking account update received:', updatedDonCheck);

  // Update the UI with the received donation data
  displayBalance(updatedDonCheck);
  displayTransactions(updatedDonCheck);
});

// Listen for donation updates for savings accounts
socket.on('donationSaving', updatedDonSav => {
  console.log('Donation to savings account update received:', updatedDonSav);

  // Update the UI with the received donation data
  displayBalance(updatedDonSav);
  displayTransactions(updatedDonSav);
});

// Handle potential timer modal logic (if used elsewhere)
const timerModal = document.querySelector('.timerModal');
if (timerModal) {
  timerModal.addEventListener('cancel', event => {
    event.preventDefault();
  });

  socket.on('timer', active => {
    console.log('Timer event received:', active);
    if (active) {
      timerModal.showModal();
    } else {
      timerModal.close();
    }
  });
}

// Listen for new messages (private or class-wide) from the modern messaging system
socket.on('newMessage', data => {
  console.log('New message received:', data);
  handleNewMessage(data);
});

// Listen for legacy class messages which sends raw HTML
socket.on('classMessage', dialogHtml => {
  console.log('Legacy class message received');
  const messageContainer = document.createElement('div');
  messageContainer.innerHTML = dialogHtml;
  document.body.appendChild(messageContainer.firstChild);
});
/***********************************************************Server Functions**********************************************/
const testServerProfiles = 'https://tcstudentserver-production.up.railway.app/profiles';

const loanURL = 'https://tcstudentserver-production.up.railway.app/loans';

const donationURL = 'https://tcstudentserver-production.up.railway.app/donations';

const donationSavingsURL = 'https://tcstudentserver-production.up.railway.app/donationsSavings';

const balanceURL = 'https://tcstudentserver-production.up.railway.app/initialBalance';



// Store the received profiles in a global variable or a state variable if you're using a front-end framework
let Profiles = [];

export async function getInfoProfiles() {
  try {
    console.log(
      'Step 1: Starting the process to fetch profiles from the server.',
    );

    const res = await fetch(testServerProfiles, {
      method: 'GET',
    });

    console.log('Step 2: Received a response from the server.');

    if (res.ok) {
      console.log(
        `Step 3: Server responded successfully with status ${res.status}. Attempting to parse the JSON response.`,
      );
      try {
        const Profiles = await res.json();
        console.log('Step 4: Successfully parsed JSON response:', Profiles);

        // Log the initialization of Socket.IO listener
        console.log(
          'Step 5: Setting up Socket.IO listener for profile updates.',
        );
        socket.on('profiles', updatedProfiles => {
          console.log(
            'Step 6: Received updated profiles from the server:',
            updatedProfiles,
          );
          // Update the UI or perform any necessary actions with updated profiles
        });

        console.log('Step 7: Returning the fetched and parsed profiles.');
        return Profiles;
      } catch (jsonError) {
        console.error(
          'Step 4 Error: Failed to parse JSON response:',
          jsonError.message,
        );
        console.error('The server response may not be in the correct format.');
        throw new Error('Invalid JSON response from server');
      }
    } else {
      console.error(
        `Step 3 Error: Server responded with status ${res.status} (${res.statusText}).`,
      );
      const errorDetails = await res.text(); // Attempt to read error details
      console.error(
        'Additional details from the server response:',
        errorDetails,
      );
      throw new Error(`HTTP error: ${res.status} ${res.statusText}`);
    }
  } catch (error) {
    console.error(
      'Final Step Error: An unexpected error occurred during the process.',
    );
    console.error('Error message:', error.message);

    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }

    // Optionally rethrow the error or return a fallback value
    throw error;
  }
}

export async function initialBalance() {
  const res = await fetch(balanceURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parcel: currentProfile,
    }),
  });
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

/******************************************Variables ***************************************************/

export let currentAccount;
export let currentProfile;
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
const mobileLoginButton = document.querySelector('.mobileLoginBtn');

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
const balanceDate = document.querySelector(`.dateText`);
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
    const loginPIN = document.querySelector('.login__input--pin');
    const loginText = document.querySelector('.login__input--user');
    loginFunc(loginPIN, loginText, loginBox);
    // Get the value of the input field
  });
}

if (mobileLoginButton) {
  mobileLoginButton.addEventListener('click', function (event) {
    event.preventDefault();
    const mobileLoginPIN = document.querySelector('.mobile_login__input--pin');
    const mobileLoginText = document.querySelector(
      '.mobile_login__input--user',
    );
    loginFunc(mobileLoginPIN, mobileLoginText, mobileLoginBox);
    console.log('running');
  });
}

const loginFunc = function (PIN, user, screen) {
  const pin = parseInt(PIN.value);

  for (let i = 0; i < profiles.length; i++) {
    if (user.value === profiles[i].userName && pin === profiles[i].pin) {
      currentProfile = profiles[i];
    } else if (user.value === profiles[i].userName && pin !== profiles[i].pin) {
      alert('Incorrect PIN');
    } else if (user.value !== profiles[i].userName && pin === profiles[i].pin) {
      alert('Incorrect Username');
    }
  }

  // Mock data for demonstration. In a real app, this would come from the database.
  if (currentProfile && !currentProfile.currentUnit) {
    console.log('Assigning default unit to profile for demo.');
    currentProfile.currentUnit = 'Unit 1: Introduction to Banking';
  }

  if (currentProfile) {
    // Emit the identify event with the logged-in user's memberName
    const userId = currentProfile.memberName;
    console.log(`Emitting identify event for user: ${userId}`);
    socket.emit('identify', userId);

    // Call initial balance
    initialBalance();

    // Close the login modal
    screen.close();

    // Hide login section
    const signOnSection = document.querySelector('.signOnSection');
    signOnSection.style.display = 'none';

    // Display welcome message
    const signOnText = document.querySelector('.signOnText');
    signOnText.textContent = currentProfile.memberName.split(' ')[0];

    // Show the main app
    const mainApp = document.querySelector('.mainApp');
    mainApp.style.display = 'flex';
    mainApp.style.opacity = 100;

    // Update the UI
    currentAccount = currentProfile.checkingAccount;
    if (currentAccount) {
      console.log('User logged in successfully:', currentAccount);
      updateUI(currentAccount);
      // Fetch and render lessons based on the student's teacher
      if (currentProfile) {
        renderLessons(currentProfile);
      } else {
        console.error('Student profile does not have a teacher assigned.');
        // Optionally, display a message in the lesson block
        const lessonHeader = document.querySelector('.lessonHeaderText');
        const lessonContainer = document.querySelector('.lessonRow');
        lessonHeader.textContent = 'Lessons';
        lessonContainer.innerHTML =
          '<p>No teacher assigned. Cannot load lessons.</p>';
      }

      // Update the displayed time
      updateTime();
      balanceDate.textContent = `As of ${new Intl.DateTimeFormat(
        currentProfile.locale,
        options,
      ).format(currentTime)}`;

      // Initialize student messaging system
      initializeStudentMessaging(currentProfile.memberName);
    } else {
      alert('No checking account found. Please contact customer service.');
    }
  }
};

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
          -4,
        )}`;
        updateUI(currentAccount);
      } else if (
        targetAccount === currentProfile.savingsAccount.accountNumber.slice(-4)
      ) {
        currentAccount = currentProfile.savingsAccount;
        balanceLabel.textContent = `Current Balance for: #${currentAccount.accountNumber.slice(
          -4,
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

    let date;

    //Sets the date for each transaction according to the date set in the current Account object

    //Sets up the date variable for the transactions
    date = new Date(currentAccount.movementsDates[i]);

    //displays date next to transactions
    const displayDate = formatMovementDate(date, currentAccount.locale);
    //Formats transactions for user locale
    const formattedMov = formatCur(
      mov.amount,
      currentAccount.locale,
      currentAccount.currency,
    );
    let transType;
    let transName = mov.Name;

    let movIcon;

    if (mov.Category === 'Money Deposit') {
      movIcon = `<i class="fa-solid fa-dollar-sign transImg sndMon"></i>`;
    }
    if (mov.Category === 'Transfer') {
      movIcon = `<i class="fa-solid fa-money-bill-transfer transImg"></i>`;
    }

    if (mov.Category === 'car-note') {
      movIcon = `<i class="fa-solid fa-car transImg"></i>`;
    }
    if (mov.Category === 'rent') {
      movIcon = `<i class="fa-solid fa-house transImg"></i>`;
    }
    if (mov.Category === 'car-insurance') {
      movIcon = `<i class="fa-solid fa-car-burst transImg"></i>`;
    }
    if (mov.Category === 'home-insurance') {
      movIcon = `<i class="fa-solid fa-house-crack transImg"></i>`;
    }
    if (mov.Category === 'food') {
      movIcon = `<i class="fa-solid fa-utensils transImg"></i>`;
    }
    if (mov.Category === 'electric') {
      movIcon = `<i class="fa-solid fa-bolt transImg"></i>`;
    }

    if (mov.Category === 'gas') {
      movIcon = `<i class="fa-solid fa-fire-flame-simple transImg"></i>`;
    }

    if (mov.Category === 'water') {
      movIcon = `<i class="fa-solid fa-droplet transImg"></i>`;
    }

    if (mov.Category === 'trash-collection') {
      movIcon = `<i class="fa-solid fa-dumpster transImg"></i>`;
    }

    if (mov.Category === 'phone-bill') {
      movIcon = `<i class="fa-solid fa-phone transImg"></i>`;
    }

    if (mov.Category === 'internet') {
      movIcon = `<i class="fa-solid fa-wifi transImg"></i>`;
    }

    if (mov.Category === 'custom-expense') {
      movIcon = `<i class="fa-solid fa-screwdriver-wrench transImg"></i>`;
    }

    if (mov.Category === 'paycheck') {
      movIcon = `<i class="fa-solid fa-dollar-sign transImg dollarSignImg"></i>`;
    }
    if (mov.Category === 'Check Deposit') {
      movIcon = `<i class="fa-solid fa-money-check transImg"></i>`;
    }
    //HTML for transactions
    if (mov.amount < 0) {
      transType = 'negTrans';
    } else if (mov.amount > 0) {
      transType = 'posTrans';
    }
    const html = `<div class="transaction row">
                          <div class="transIcon col-4">
                            ${movIcon}
                          </div>
                          <div class="transNameAndDate col">
                            <p class="transName">${transName} (${mov.Category})</p>
                            <p class="transDate">${displayDate}</p>
                          </div>
                          <div class="transAmount col">
                            <p class="transAmountText ${transType}">${formattedMov}</p>
                          </div>
                        </div>`;
    //Inserts HTML with required data
    transactionContainer.insertAdjacentHTML('afterbegin', html);
    displayBillList(currentAccount);
  });
};
export const displayBillList = function (currentAccount) {
  let bills;

  //selects the transactions HTML element
  const billListContainer = document.querySelector('.bills');
  billListContainer.innerHTML = '';

  //Variable set for the transactions themselves

  bills = currentAccount.bills;

  //Sets the date for each transaction according to the date set in the current Account object

  //Sets up the date variable for the transactions

  //A loop that runs through each transaction in the current account object
  if (currentAccount.accountType != 'Savings') {
    bills.forEach(function (bill, i) {
      //ternerary to determine whether a transaction is a deposit or withdrawal

      let currentDate;
      let advancedDate;

      //Sets the date for each transaction according to the date set in the current Account object

      //Sets up the date variable for the transactions
      currentDate = new Date(bill.Date);

      //currentDate = new Date();

      if (bill.interval === 'weekly') {
        advancedDate = currentDate.setUTCDate(currentDate.getUTCDate() + 7);
      }

      if (bill.interval === 'bi-weekly') {
        advancedDate = currentDate.setUTCDate(currentDate.getUTCDate() + 14);
      }

      if (bill.interval === 'monthly') {
        advancedDate = currentDate.setUTCDate(currentDate.getUTCDate() + 30);
      }

      if (bill.interval === 'yearly') {
        advancedDate = currentDate.setUTCDate(currentDate.getUTCDate() + 365);
      }

      //displays date next to transactions
      const displayDate = formatMovementDate(
        advancedDate,
        currentAccount.locale,
      );

      //Formats transactions for user locale
      const formattedMov = formatCur(
        bill.amount,
        currentAccount.locale,
        currentAccount.currency,
      );
      let transType;
      let transName = bill.Name;

      let billIcon;

      if (bill.Category === 'car-note') {
        billIcon = `<i class="fa-solid fa-car "></i>`;
      }
      if (bill.Category === 'rent') {
        billIcon = `<i class="fa-solid fa-house rentIcon"></i>`;
      }
      if (bill.Category === 'car-insurance') {
        billIcon = `<i class="fa-solid fa-car-burst "></i>`;
      }
      if (bill.Category === 'home-insurance') {
        billIcon = `<i class="fa-solid fa-house-crack "></i>`;
      }
      if (bill.Category === 'food') {
        billIcon = `<i class="fa-solid fa-utensils "></i>`;
      }
      if (bill.Category === 'electric') {
        billIcon = `<i class="fa-solid fa-bolt "></i>`;
      }

      if (bill.Category === 'gas') {
        billIcon = `<i class="fa-solid fa-fire-flame-simple "></i>`;
      }

      if (bill.Category === 'water') {
        billIcon = `<i class="fa-solid fa-droplet "></i>`;
      }

      if (bill.Category === 'trash-collection') {
        billIcon = `<i class="fa-solid fa-dumpster "></i>`;
      }

      if (bill.Category === 'phone-bill') {
        billIcon = `<i class="fa-solid fa-phone "></i>`;
      }

      if (bill.Category === 'internet') {
        billIcon = `<i class="fa-solid fa-wifi wifiIcon "></i>`;
      }

      if (bill.Category === 'custom-expense') {
        billIcon = `<i class="fa-solid fa-screwdriver-wrench billListCustom "></i>`;
      }

      if (bill.Category === 'paycheck') {
        billIcon = `<i class="fa-solid fa-dollar-sign  "></i>`;
      }
      //HTML for transactions

      const html = `<div class="billsRow row">
      <div class="icon col-4">
        ${billIcon}
      </div>
      <div class="billName col">
        <p class="billText">${bill.Name}($${bill.amount})</p>
      </div>
      <div class="col billDate">
        <p>Reoccurs: ${displayDate}</p>
      </div>
    </div>`;
      //Inserts HTML with required data
      billListContainer.insertAdjacentHTML('afterbegin', html);
    });
  }
};

export const formatMovementDate = function (date, locale) {
  //international time format based on the date given in this function
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
    acc.currency,
  );
};

export const updateUI = function (acc) {
  //Displays the Transactions data
  displayTransactions(acc);
  //Displays the balance with correct data
  displayBalance(acc);
  //Displays the users bill list
  displayBillList(acc);
};

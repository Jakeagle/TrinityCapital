export const createAndShowModal = (params) => {
  console.log('Creating and showing modal with params:', params);

  // Deactivate any active modals
  document.querySelectorAll('.baseModal').forEach(modal => {
    if (modal.open) {
      modal.close();
    }
  });

  const messageModal = document.querySelector('.messageModal');
  if (!messageModal) {
    console.error('Message modal not found!');
    return;
  }

  const messageText = messageModal.querySelector('.message-modal-text');
  if (messageText) {
    messageText.textContent = params.message;
  }

  const closeButton = messageModal.querySelector('.message-modal-close-btn');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      messageModal.close();
    });
  }

  messageModal.showModal();
};

export const createAndShowChallenge = (params) => {
  // Logic to create and display the challenge will go here
  console.log('Creating and showing challenge with params:', params);

  // 1. Create modal element
  const modal = document.createElement('div');
  modal.className = 'baseModal challengeModal'; // Or a more specific class

  // 2. Add content to the modal
  modal.innerHTML = `
    <h1>${params.title || 'Challenge'}</h1>
    <p>${params.message || 'No content.'}</p>
    <button class="close-modal">Close</button>
  `;

  // 3. Add to the DOM
  document.body.appendChild(modal);

  // 4. Add event listener to close button
  modal.querySelector('.close-modal').addEventListener('click', () => {
    modal.remove();
  });
};

export const appendLessonSlide = (params) => {
  console.log('Appending lesson slide with params:', params);
  // 1. Find the active lesson container
  // const lessonContainer = document.querySelector('.active-lesson .slides');

  // 2. Create a new slide element
  const slide = document.createElement('div');
  slide.className = 'slide';
  slide.innerHTML = `<h2>${params.title || 'New Slide'}</h2><p>${params.message || 'No content.'}</p>`;

  // 3. Append the new slide
  // if (lessonContainer) {
  //   lessonContainer.appendChild(slide);
  // } else {
  //   console.error('Active lesson container not found!');
  // }
};
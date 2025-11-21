'use strict';

import { conditionInstructionMap } from './conditionInstructionMap.js';
import { handleLessonModal } from '../UITM/buttonTracker.js';

/**
 * Renders the unit header with the unit number and name.
 * @param {object} profile - The student's profile containing assigned units.
 */
export function renderUnitHeader(profile) {
  const headerElement = document.querySelector(".lessonHeaderText");
  if (!headerElement) {
    console.error("lessonHeaderText element not found.");
    return;
  }

  if (profile && profile.assignedUnitIds && profile.assignedUnitIds.length > 0) {
    // Assuming the last assigned unit is the current one
    const currentUnit = profile.assignedUnitIds[profile.assignedUnitIds.length - 1];
    const unitName = currentUnit.unitName;

    if (unitName) {
      headerElement.textContent = unitName;
    } else {
      headerElement.textContent = "Lessons"; // Fallback
      console.warn("Unit name not found in the latest assigned unit.");
    }
  } else {
    headerElement.textContent = "No Units Assigned"; // Fallback
  }
}

/**
 * Maps lesson names to Font Awesome icons.
 * @param {string} lessonName - The name of the lesson.
 * @returns {string} The corresponding Font Awesome icon class.
 */
function getIconForLesson(lessonName) {
  // Defensive check for lessonName
  if (typeof lessonName !== 'string' || !lessonName) {
    return "fas fa-book"; // Default icon
  }
  const name = lessonName.toLowerCase();
  if (name.includes("banking")) {
    return "fas fa-university";
  } else if (name.includes("budgeting")) {
    return "fas fa-calculator";
  } else if (name.includes("saving") || name.includes("investing")) {
    return "fas fa-piggy-bank";
  } else if (name.includes("credit")) {
    return "fas fa-credit-card";
  } else if (name.includes("debt")) {
    return "fas fa-bomb";
  } else {
    return "fas fa-book";
  }
}

/**
 * Renders the lesson buttons in the lesson row.
 * @param {Array} lessons - An array of lesson objects.
 */
export function renderLessonButtons(lessons, studentProfile) {
  const lessonRow = document.querySelector(".lessonRow");
  if (!lessonRow) {
    console.error("lessonRow element not found.");
    return;
  }

  lessonRow.innerHTML = ""; // Clear existing buttons

  lessons.forEach(lesson => {
    const wrapper = document.createElement("div");
    wrapper.className = "lesson-item-wrapper";

    const button = document.createElement("div");
    button.className = "lessonDiv";

    const icon = document.createElement("i");
    // It seems 'lessonName' was incorrect. Trying 'lesson.lesson_title' and adding a fallback.
    const nameForIcon = lesson.lesson_title || "";
    icon.className = `${getIconForLesson(nameForIcon)} lessonIcon`;

    const title = document.createElement("p");
    title.className = "lessonName";
    // Display the name, fallback to 'Unnamed Lesson'
    title.textContent = lesson.lesson_title || 'Unnamed Lesson';

    wrapper.addEventListener('click', () => openLessonModal(lesson, studentProfile));

    button.appendChild(icon);
    wrapper.appendChild(button);
    wrapper.appendChild(title);
    lessonRow.appendChild(wrapper);
  });

  initializeLessonScroll();
}

/**
 * Generates the HTML for the lesson instructions.
 * @param {Array} conditions - The array of conditions for the lesson.
 * @returns {string} The HTML string for the instructions.
 */
function generateInstructionsHtml(conditions) {
  if (!conditions || conditions.length === 0) {
    return '<p>No specific instructions for this lesson.</p>';
  }

  let instructionsHtml = '<ul>';
  for (const conditionObj of conditions) {
    const condition = conditionObj.condition_type;
    const value = conditionObj.condition_value;
    let found = false;
    for (const category in conditionInstructionMap) {
      if (conditionInstructionMap[category][condition]) {
        let instructionText = conditionInstructionMap[category][condition].instruction;
        if (instructionText.includes('[value]')) {
          instructionText = instructionText.replace('[value]', value);
        }
        instructionsHtml += `<li>${instructionText}</li>`;
        found = true;
        break;
      }
    }
    if (!found) {
      instructionsHtml += `<li>Instruction for "${condition}" not found.</li>`;
    }
  }
  instructionsHtml += '</ul>';
  return instructionsHtml;
}

/**
 * Generates the HTML for the lesson slides based on the lesson content.
 * @param {object} lesson - The lesson object.
 * @returns {string} The HTML string for the slides.
 */
function generateLessonSlides(lesson) {
  if (!lesson || !lesson.content) {
    console.log('Lesson or lesson.content is missing', lesson);
    return '';
  }

  console.log('Generating slides for lesson content:', lesson.content);

  let slidesHtml = '';
  let i = 0;
  const content = lesson.content;

  while (i < content.length) {
    const currentItem = content[i];
    console.log('Processing item:', currentItem);

    if (currentItem.type === 'header') {
      if (i + 1 < content.length && content[i + 1].type === 'text') {
        // Header followed by text
        console.log('Header with text:', currentItem.content, content[i + 1].content);
        slidesHtml += `<div class="new-lesson-slide"><h1>${currentItem.content}</h1><p>${content[i + 1].content}</p></div>`;
        i += 2;
      } else {
        // Header by itself
        console.log('Header by itself:', currentItem.content);
        slidesHtml += `<div class="new-lesson-slide"><h1>${currentItem.content}</h1></div>`;
        i += 1;
      }
    } else if (currentItem.type === 'text') {
      // Text by itself
      console.log('Text by itself:', currentItem.content);
      slidesHtml += `<div class="new-lesson-slide"><p>${currentItem.content}</p></div>`;
      i += 1;
    }
  }

  return slidesHtml;
}


/**
 * Opens and populates the new lesson modal.
 * @param {object} lesson - The lesson object to display.
 */
function openLessonModal(lesson, studentProfile) {
  console.log('lesson object:', lesson);
  console.log('Opening lesson modal for:', lesson);
  const modal = document.querySelector('.new-lesson-modal');
  if (!modal) {
    console.error('New lesson modal not found.');
    return;
  }

  const modalTitle = modal.querySelector('.new-lesson-modal-title');
  if (modalTitle) {
    modalTitle.textContent = lesson.lesson_title || 'Lesson';
  }

  const modalContent = modal.querySelector('.new-lesson-modal-content');
  const lessonSlidesHtml = generateLessonSlides(lesson);
  const instructionsHtml = generateInstructionsHtml(lesson.completion_conditions);
  const instructionsSlideHtml = `
    <div class="new-lesson-slide instructions-slide">
      <h1>Instructions</h1>
      ${instructionsHtml}
      <button class="begin-activities-btn">Begin Activities</button>
    </div>
  `;
  modalContent.innerHTML = lessonSlidesHtml + instructionsSlideHtml;

  const closeBtn = modal.querySelector('.new-lesson-modal-close-btn');
  const backBtn = modal.querySelector('.new-lesson-modal-back-btn');
  const forwardBtn = modal.querySelector('.new-lesson-modal-forward-btn');
  const beginActivitiesBtn = modal.querySelector('.begin-activities-btn');
  handleLessonModal(lesson, studentProfile);
  const slides = modal.querySelectorAll('.new-lesson-slide');
  let currentSlide = 0;

  const showSlide = (index) => {
    slides.forEach((slide, i) => {
      slide.classList.remove('active', 'slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');
      if (i === index) {
        slide.classList.add('active');
      }
    });
    backBtn.style.display = index === 0 ? 'none' : 'inline-block';
    forwardBtn.style.display = index === slides.length - 1 ? 'none' : 'inline-block';
  };

  const changeSlide = (newIndex) => {
    const oldIndex = currentSlide;
    if (newIndex === oldIndex) return;

    const direction = newIndex > oldIndex ? 'forward' : 'backward';
    const current = slides[oldIndex];
    const next = slides[newIndex];

    // Add animation classes
    if (direction === 'forward') {
      current.classList.add('slide-out-left');
      next.classList.add('slide-in-right', 'active');
    } else {
      current.classList.add('slide-out-right');
      next.classList.add('slide-in-left', 'active');
    }

    // Remove animation classes after they finish
    current.addEventListener('animationend', () => {
      current.classList.remove('active', 'slide-out-left', 'slide-out-right');
    }, { once: true });
    
    next.addEventListener('animationend', () => {
        next.classList.remove('slide-in-left', 'slide-in-right');
    }, { once: true });

    currentSlide = newIndex;
    backBtn.style.display = currentSlide === 0 ? 'none' : 'inline-block';
    forwardBtn.style.display = currentSlide === slides.length - 1 ? 'none' : 'inline-block';
  };

  closeBtn.onclick = () => modal.close();
  backBtn.onclick = () => {
    if (currentSlide > 0) {
      changeSlide(currentSlide - 1);
    }
  };
  forwardBtn.onclick = () => {
    if (currentSlide < slides.length - 1) {
      changeSlide(currentSlide + 1);
    }
  };

  modal.showModal();
  showSlide(currentSlide);
}

function initializeLessonScroll() {
  const lessonsBlock = document.querySelector('.lessonsBlock');
  const lessonRow = document.querySelector('.lessonRow');
  if (!lessonsBlock || !lessonRow) return;

  let scrollInterval = null;

  lessonsBlock.addEventListener('mousemove', (e) => {
    const rect = lessonsBlock.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element.
    const scrollZone = 60; // 60px from the edge

    if (x < scrollZone) {
      // Scroll left
      if (!scrollInterval) {
        scrollInterval = setInterval(() => {
          lessonRow.scrollLeft -= 10;
        }, 24);
      }
    } else if (x > rect.width - scrollZone) {
      // Scroll right
      if (!scrollInterval) {
        scrollInterval = setInterval(() => {
          lessonRow.scrollLeft += 10;
        }, 24);
      }
    } else {
      // In the middle, stop scrolling
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    }
  });

  lessonsBlock.addEventListener('mouseleave', () => {
    if (scrollInterval) {
      clearInterval(scrollInterval);
      scrollInterval = null;
    }
  });
}
/****************Variables****************/
const lessonHeader = document.querySelector('.lessonHeaderText');
const lessonContainer = document.querySelector('.lessonRow');

/****************Lesson Creation****************/

/**
 * Selects a Font Awesome icon class based on keywords in the lesson title.
 * This provides a more relevant visual cue when a specific icon isn't
 * provided in the lesson data from the database.
 * @param {string} title The title of the lesson.
 * @returns {string} A Font Awesome icon class string.
 */
const getIconForLesson = function (title) {
  const lowerCaseTitle = title.toLowerCase();

  if (lowerCaseTitle.includes('test')) return 'fa-solid fa-screwdriver-wrench';

  if (lowerCaseTitle.includes('transfer'))
    return 'fa-solid fa-money-bill-transfer';
  if (lowerCaseTitle.includes('bill') || lowerCaseTitle.includes('paycheck'))
    return 'fa-solid fa-file-invoice-dollar';
  if (lowerCaseTitle.includes('deposit'))
    return 'fa-solid fa-money-check-dollar';
  if (lowerCaseTitle.includes('send')) return 'fa-solid fa-paper-plane';
  if (lowerCaseTitle.includes('credit')) return 'fa-regular fa-credit-card';
  if (lowerCaseTitle.includes('invest')) return 'fa-solid fa-chart-line';
  if (
    lowerCaseTitle.includes('saving') ||
    lowerCaseTitle.includes('retirement')
  )
    return 'fa-solid fa-piggy-bank';
  if (lowerCaseTitle.includes('loan')) return 'fa-solid fa-hand-holding-dollar';
  if (lowerCaseTitle.includes('budget')) return 'fa-solid fa-calculator';
  if (lowerCaseTitle.includes('bank')) return 'fa-solid fa-building-columns';
  if (
    lowerCaseTitle.includes('tutorial') ||
    lowerCaseTitle.includes('introduction')
  )
    return 'fa-solid fa-rocket';

  // Default icon if no keywords match
  return 'fa-solid fa-book';
};

/****************Lesson Rendering****************/

// The main exported function that script.js will call
export const renderLessons = function (studentProfile) {
  if (!studentProfile) {
    console.error('Student profile is required to render lessons.');
    lessonHeader.textContent = 'Lessons';
    lessonContainer.innerHTML =
      '<p>Could not identify student to load lessons.</p>';
    return;
  }

  // The new field is `assignedUnits`, which is an array.
  const assignedUnits = studentProfile.assignedUnits;

  // Check if assignedUnits exists, is an array, and is not empty.
  if (
    assignedUnits &&
    Array.isArray(assignedUnits) &&
    assignedUnits.length > 0
  ) {
    // Get the first unit from the array to render.
    const unitToRender = assignedUnits[0];

    // Set the header to the unit's name. Fallback if name is missing.
    lessonHeader.textContent = unitToRender.name || 'Assigned Lessons';
    lessonContainer.innerHTML = ''; // Clear the container once

    // Render lessons only from the first unit, if it has any.
    if (
      unitToRender.lessons &&
      Array.isArray(unitToRender.lessons) &&
      unitToRender.lessons.length > 0
    ) {
      unitToRender.lessons.forEach(lesson => {
        const iconClass =
          lesson.icon_class || getIconForLesson(lesson.lesson_title);
        const lessonHtml = `
            <div class="col-1 lesson-item-wrapper">
              <div class="lessonDiv">
                <i class="${iconClass} lessonIcon"></i>
              </div>
              <h5 class="lessonName">${lesson.lesson_title}</h5>
            </div>
          `;
        lessonContainer.insertAdjacentHTML('beforeend', lessonHtml);
      });
    } else {
      // This handles if the first unit has no lessons.
      lessonContainer.innerHTML = '<p>No lessons available in this unit.</p>';
    }
  } else {
    console.log(
      `No assigned units found in profile for student '${studentProfile.memberName}'.`,
    );
    lessonHeader.textContent = 'Lessons';
    lessonContainer.innerHTML = '<p>No lessons assigned yet.</p>';
  }
};

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
      unitToRender.lessons.forEach((lesson, index) => {
        const iconClass =
          lesson.icon_class || getIconForLesson(lesson.lesson_title);
        const lessonHtml = `
            <div class="col-1 lesson-item-wrapper" onclick="openLessonCarousel(${index})" style="cursor: pointer;">
              <div class="lessonDiv">
                <i class="${iconClass} lessonIcon"></i>
              </div>
              <h5 class="lessonName">${lesson.lesson_title}</h5>
            </div>
          `;
        lessonContainer.insertAdjacentHTML('beforeend', lessonHtml);
      });

      // Store lessons data globally for carousel access
      window.currentLessonsData = unitToRender.lessons;
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

/****************Lesson Carousel Dialog System****************/

/**
 * Global carousel state
 */
let carouselState = {
  currentLessonIndex: 0,
  currentSlideIndex: 0,
  lessonData: null,
  slides: [],
};

/**
 * Open the lesson carousel dialog
 * @param {number} lessonIndex - Index of the lesson to display
 */
window.openLessonCarousel = function (lessonIndex) {
  if (!window.currentLessonsData || !window.currentLessonsData[lessonIndex]) {
    console.error('Lesson data not found for index:', lessonIndex);
    return;
  }

  const lesson = window.currentLessonsData[lessonIndex];
  carouselState.currentLessonIndex = lessonIndex;
  carouselState.lessonData = lesson;
  carouselState.currentSlideIndex = 0;

  // Parse lesson content into slides
  carouselState.slides = parseLessonContent(lesson);

  // Create and show the carousel dialog
  createCarouselDialog();
  showCurrentSlide();
};

/**
 * Parse lesson content into carousel slides following the specified rules:
 * 1. Headers followed by text are displayed together
 * 2. Text preceded by text are shown without a header
 * 3. Header preceded by another header is shown by itself
 * @param {Object} lesson - Lesson object containing content
 * @returns {Array} Array of slide objects
 */
const parseLessonContent = function (lesson) {
  const slides = [];

  // Extract content from lesson object
  // Assuming lesson content might be in various fields like 'content', 'text', 'description', etc.
  let contentText =
    lesson.content ||
    lesson.text ||
    lesson.description ||
    lesson.lesson_content ||
    '';

  if (!contentText) {
    // If no content found, create a default slide with the lesson title
    slides.push({
      type: 'header-only',
      content: lesson.lesson_title || 'Lesson Content',
      isHeader: true,
    });
    return slides;
  }

  // Split content by common delimiters (new lines, etc.)
  const lines = contentText.split(/\n+/).filter(line => line.trim() !== '');

  // Identify headers and text blocks
  const contentBlocks = lines.map(line => {
    const trimmed = line.trim();

    // Identify headers - could be markdown-style (#), all caps, or other patterns
    const isHeader =
      trimmed.startsWith('#') ||
      trimmed.match(/^[A-Z\s]{3,}:?\s*$/) ||
      trimmed.endsWith(':') ||
      trimmed.match(/^\d+\.\s*[A-Z]/) ||
      (trimmed.length < 50 &&
        trimmed === trimmed.toUpperCase() &&
        trimmed.length > 5);

    return {
      content: trimmed.replace(/^#+\s*/, ''), // Remove markdown headers
      isHeader: isHeader,
    };
  });

  // Process blocks according to the rules
  let currentSlide = null;

  for (let i = 0; i < contentBlocks.length; i++) {
    const current = contentBlocks[i];
    const next = contentBlocks[i + 1];
    const previous = contentBlocks[i - 1];

    if (current.isHeader) {
      if (next && !next.isHeader) {
        // Rule 1: Header followed by text - combine them
        currentSlide = {
          type: 'header-with-text',
          header: current.content,
          text: next.content,
        };
        slides.push(currentSlide);
        i++; // Skip the next item since we've processed it
      } else {
        // Rule 3: Header preceded by another header or standalone header
        slides.push({
          type: 'header-only',
          content: current.content,
          isHeader: true,
        });
      }
    } else {
      // Current is text
      if (previous && !previous.isHeader) {
        // Rule 2: Text preceded by text - show without header
        slides.push({
          type: 'text-only',
          content: current.content,
          isHeader: false,
        });
      }
      // If text is preceded by header, it's already handled in Rule 1
    }
  }

  // If no slides were created, create a default slide
  if (slides.length === 0) {
    slides.push({
      type: 'text-only',
      content: contentText,
      isHeader: false,
    });
  }

  return slides;
};

/**
 * Create the carousel dialog HTML structure
 */
const createCarouselDialog = function () {
  // Remove existing dialog if present
  const existingDialog = document.getElementById('lessonCarouselDialog');
  if (existingDialog) {
    existingDialog.remove();
  }

  const dialog = document.createElement('dialog');
  dialog.id = 'lessonCarouselDialog';
  dialog.className = 'lesson-carousel-dialog';

  dialog.innerHTML = `
    <div class="carousel-container">
      <div class="carousel-header">
        <h2 class="lesson-title">${carouselState.lessonData.lesson_title || 'Lesson'}</h2>
        <button class="close-btn" onclick="closeLessonCarousel()">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      
      <div class="carousel-content">
        <div class="carousel-slide-container">
          <div id="carouselSlideContent" class="slide-content">
            <!-- Slide content will be inserted here -->
          </div>
        </div>
        
        <div class="carousel-navigation">
          <button id="prevSlideBtn" class="nav-btn prev-btn" onclick="previousSlide()">
            <i class="fa-solid fa-chevron-left"></i>
            Previous
          </button>
          
          <div class="slide-indicator">
            <span id="slideCounter">1 / 1</span>
          </div>
          
          <button id="nextSlideBtn" class="nav-btn next-btn" onclick="nextSlide()">
            Next
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
      
      <div class="carousel-actions">
        <button class="action-btn complete-btn" onclick="completeLessonFromCarousel()">
          <i class="fa-solid fa-check"></i>
          Complete Lesson
        </button>
      </div>
    </div>
  `;

  // Add carousel styles
  const style = document.createElement('style');
  style.textContent = `
    .lesson-carousel-dialog {
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      border: none;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      padding: 0;
      background: white;
      overflow: hidden;
    }

    .lesson-carousel-dialog::backdrop {
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
    }

    .carousel-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 500px;
    }

    .carousel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #00ffcc, #00b3a6);
      color: white;
      border-bottom: 1px solid #e0e0e0;
    }

    .lesson-title {
      margin: 0;
      font-size: 1.5em;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 1.2em;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .carousel-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .carousel-slide-container {
      flex: 1;
      padding: 32px 24px;
      overflow-y: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .slide-content {
      width: 100%;
      max-width: 600px;
      text-align: center;
    }

    .slide-header {
      font-size: 2em;
      font-weight: 700;
      color: #333;
      margin-bottom: 24px;
      line-height: 1.2;
    }

    .slide-text {
      font-size: 1.1em;
      line-height: 1.6;
      color: #555;
      margin-bottom: 16px;
    }

    .slide-header-only {
      font-size: 2.5em;
      font-weight: 700;
      color: #00b3a6;
      margin: 40px 0;
      line-height: 1.2;
    }

    .slide-text-only {
      font-size: 1.2em;
      line-height: 1.7;
      color: #333;
      text-align: left;
      margin: 20px 0;
    }

    .carousel-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #00b3a6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .nav-btn:hover:not(:disabled) {
      background: #00998a;
    }

    .nav-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .slide-indicator {
      font-weight: 500;
      color: #666;
    }

    .carousel-actions {
      padding: 16px 24px;
      background: white;
      border-top: 1px solid #e0e0e0;
      text-align: center;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1em;
      transition: background-color 0.2s;
    }

    .action-btn:hover {
      background: #218838;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(dialog);
  dialog.showModal();
};

/**
 * Show the current slide content
 */
const showCurrentSlide = function () {
  const slideContent = document.getElementById('carouselSlideContent');
  const slideCounter = document.getElementById('slideCounter');
  const prevBtn = document.getElementById('prevSlideBtn');
  const nextBtn = document.getElementById('nextSlideBtn');

  if (!slideContent || carouselState.slides.length === 0) return;

  const currentSlide = carouselState.slides[carouselState.currentSlideIndex];
  let contentHtml = '';

  switch (currentSlide.type) {
    case 'header-with-text':
      contentHtml = `
        <div class="slide-header">${currentSlide.header}</div>
        <div class="slide-text">${currentSlide.text}</div>
      `;
      break;
    case 'header-only':
      contentHtml = `
        <div class="slide-header-only">${currentSlide.content}</div>
      `;
      break;
    case 'text-only':
      contentHtml = `
        <div class="slide-text-only">${currentSlide.content}</div>
      `;
      break;
    default:
      contentHtml = `
        <div class="slide-text-only">${currentSlide.content || 'No content available'}</div>
      `;
  }

  slideContent.innerHTML = contentHtml;

  // Update navigation
  slideCounter.textContent = `${carouselState.currentSlideIndex + 1} / ${carouselState.slides.length}`;
  prevBtn.disabled = carouselState.currentSlideIndex === 0;
  nextBtn.disabled =
    carouselState.currentSlideIndex === carouselState.slides.length - 1;
};

/**
 * Navigate to previous slide
 */
window.previousSlide = function () {
  if (carouselState.currentSlideIndex > 0) {
    carouselState.currentSlideIndex--;
    showCurrentSlide();
  }
};

/**
 * Navigate to next slide
 */
window.nextSlide = function () {
  if (carouselState.currentSlideIndex < carouselState.slides.length - 1) {
    carouselState.currentSlideIndex++;
    showCurrentSlide();
  }
};

/**
 * Close the lesson carousel dialog
 */
window.closeLessonCarousel = function () {
  const dialog = document.getElementById('lessonCarouselDialog');
  if (dialog) {
    dialog.close();
    dialog.remove();
  }

  // Clean up carousel state
  carouselState = {
    currentLessonIndex: 0,
    currentSlideIndex: 0,
    lessonData: null,
    slides: [],
  };
};

/****************Lesson Progress & Auto-Completion Helpers****************/

/**
 * Initialize a lesson with specific completion requirements
 * This should be called from other parts of the app when a lesson starts
 * @param {string|number} lessonId - Unique lesson identifier
 * @param {string} lessonTitle - Display title of the lesson
 * @param {Array} requiredConditions - Array of condition types required for auto-completion
 * @returns {Object} Lesson progress object
 */
export const initializeLessonWithRequirements = function (
  lessonId,
  lessonTitle,
  requiredConditions = [],
) {
  lessonTracker.initializeLesson(lessonId, lessonTitle, requiredConditions);

  // Show lesson started notification
  showLessonStartedNotification(lessonTitle, requiredConditions);

  return lessonTracker.getLessonProgress();
};

/**
 * Record a student action that contributes to lesson completion
 * This should be called from other JavaScript files when students perform actions
 * @param {string} actionType - Type of action performed
 * @param {Object} details - Additional details about the action
 * @returns {Object|null} Current lesson progress or null if no active lesson
 */
export const recordLessonAction = function (actionType, details = {}) {
  if (!lessonTracker.currentLesson) {
    console.log('No active lesson to record action for:', actionType);
    return null;
  }

  // Record the action
  lessonTracker.recordPositiveCondition(actionType, details);

  // Get current progress
  const progress = lessonTracker.getLessonProgress();

  // Show progress update if lesson is still active and progress is available
  if (progress && !progress.isComplete && progress.progress < 100) {
    showLessonProgressUpdate(progress);
  }

  return progress;
};

/**
 * Record a mistake or negative action
 * @param {string} actionType - Type of negative action
 * @param {Object} details - Additional details about the action
 * @returns {Object|null} Current lesson progress or null if no active lesson
 */
export const recordLessonMistake = function (actionType, details = {}) {
  if (!lessonTracker.currentLesson) {
    return null;
  }

  lessonTracker.recordNegativeCondition(actionType, details);
  return lessonTracker.getLessonProgress();
};

/**
 * Show lesson started notification
 * @param {string} lessonTitle - Title of the lesson
 * @param {Array} requiredConditions - Required conditions for completion
 */
const showLessonStartedNotification = function (
  lessonTitle,
  requiredConditions,
) {
  // Create a subtle notification that doesn't interrupt the user
  const notification = document.createElement('div');
  notification.className = 'lesson-start-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-header">
        <i class="fa-solid fa-play-circle"></i>
        <span>Lesson Started</span>
      </div>
      <div class="notification-body">
        <strong>${lessonTitle}</strong>
        <p>Complete the activities to earn your grade!</p>
      </div>
    </div>
  `;

  // Add notification styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #00ffcc, #00b3a6);
    color: white;
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    max-width: 300px;
    animation: slideInFromRight 0.5s ease-out;
  `;

  // Add animation styles if not already present
  if (!document.getElementById('lessonNotificationStyles')) {
    const style = document.createElement('style');
    style.id = 'lessonNotificationStyles';
    style.textContent = `
      @keyframes slideInFromRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutToRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .lesson-start-notification .notification-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .lesson-start-notification .notification-body p {
        margin: 4px 0 0 0;
        font-size: 0.9em;
        opacity: 0.9;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutToRight 0.5s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 500);
  }, 4000);
};

/**
 * Show lesson progress update
 * @param {Object} progress - Current lesson progress
 */
const showLessonProgressUpdate = function (progress) {
  // Only show progress updates occasionally to avoid spam
  if (progress.conditionsMet % 2 !== 0 && progress.conditionsMet > 1) return;

  const notification = document.createElement('div');
  notification.className = 'lesson-progress-notification';
  notification.innerHTML = `
    <div class="progress-content">
      <div class="progress-header">
        <i class="fa-solid fa-chart-line"></i>
        <span>Great Progress!</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress.progress}%"></div>
      </div>
      <div class="progress-text">
        ${progress.conditionsMet}/${progress.conditionsRequired} activities completed
      </div>
    </div>
  `;

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 2px solid #00b3a6;
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    max-width: 280px;
    animation: slideInFromRight 0.3s ease-out;
  `;

  // Add progress-specific styles
  const progressStyle = `
    .lesson-progress-notification .progress-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #00b3a6;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .lesson-progress-notification .progress-bar {
      width: 100%;
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    
    .lesson-progress-notification .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #00ffcc, #00b3a6);
      transition: width 0.5s ease;
    }
    
    .lesson-progress-notification .progress-text {
      font-size: 0.85em;
      color: #666;
      text-align: center;
    }
  `;

  // Add styles if not present
  if (!document.getElementById('progressNotificationStyles')) {
    const style = document.createElement('style');
    style.id = 'progressNotificationStyles';
    style.textContent = progressStyle;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutToRight 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
};

/**
 * Complete lesson from carousel (manual completion - kept for fallback)
 */
window.completeLessonFromCarousel = function () {
  // Initialize lesson tracking if not already done
  if (!lessonTracker.currentLesson) {
    lessonTracker.initializeLesson(
      carouselState.currentLessonIndex,
      carouselState.lessonData.lesson_title,
    );
  }

  // Record that the lesson was viewed completely
  lessonTracker.recordPositiveCondition('lesson_content_viewed', {
    slidesViewed: carouselState.slides.length, // All slides viewed
    totalSlides: carouselState.slides.length,
    completionMethod: 'manual',
  });

  // Determine if this is a slider-only lesson (no app requirements, no quiz)
  const isSliderOnly =
    !lessonTracker.requiredConditions ||
    lessonTracker.requiredConditions.length === 0;

  let baseScore = 85; // Default base score
  let message = `Great job completing "${carouselState.lessonData.lesson_title}"!`;

  // If slider only and no quiz, award 100%
  if (isSliderOnly) {
    baseScore = 100;
    message = `Perfect! You completed "${carouselState.lessonData.lesson_title}" by viewing all content!`;
    console.log('Slider-only lesson completed - awarding 100%');
  }

  // Complete the lesson manually
  completeLesson({
    message: message,
    baseScore: baseScore,
    completionType: 'manual',
  });

  // Close the carousel
  closeLessonCarousel();
};

/****************TESTING & DEBUGGING UTILITIES****************/

/**
 * Quick test functions for trying different action combinations
 * These functions make it easy to test varied outcomes during development
 */
export const testLessonActions = {
  // Test a single action and see its impact
  testSingleAction: function (actionType, details = {}, isPositive = true) {
    if (!lessonTracker.currentLesson) {
      lessonTracker.initializeLesson('quick_test', 'Quick Test Lesson', []);
    }

    const scoreBefore = lessonTracker.appUsageScore;
    console.log(
      `\n🧪 Testing ${actionType} (${isPositive ? 'positive' : 'negative'})`,
    );
    console.log(`Score before: ${scoreBefore}`);

    if (isPositive) {
      lessonTracker.recordPositiveCondition(actionType, details);
    } else {
      lessonTracker.recordNegativeCondition(actionType, details);
    }

    const scoreAfter = lessonTracker.appUsageScore;
    const change = scoreAfter - scoreBefore;
    console.log(
      `Score after: ${scoreAfter} (change: ${change > 0 ? '+' : ''}${change})`,
    );

    return { before: scoreBefore, after: scoreAfter, change: change };
  },

  // Test excellent student actions
  testExcellentPath: function () {
    lessonTracker.initializeLesson(
      'test_excellent',
      'Excellent Student Test',
      [],
    );
    console.log('\n🌟 Testing Excellent Student Path');

    this.testSingleAction('lesson_content_viewed', {
      slidesViewed: 10,
      totalSlides: 10,
    });
    this.testSingleAction('deposit_made', { amount: 1000, successful: true });
    this.testSingleAction('efficiency_bonus', { timeSeconds: 30 });
    this.testSingleAction('creative_solution', { approach: 'automation' });

    return lessonTracker.getLessonProgress();
  },

  // Test struggling student actions
  testStrugglingPath: function () {
    lessonTracker.initializeLesson(
      'test_struggling',
      'Struggling Student Test',
      [],
    );
    console.log('\n😰 Testing Struggling Student Path');

    this.testSingleAction('lesson_content_viewed', {
      slidesViewed: 2,
      totalSlides: 10,
    });
    this.testSingleAction('financial_mistake', { severity: 'critical' }, false);
    this.testSingleAction('incorrect_answer', { attemptNumber: 3 }, false);
    this.testSingleAction(
      'timeout_occurred',
      { progressPercentage: 20 },
      false,
    );
    this.testSingleAction('multiple_attempts_failed', { attempts: 4 }, false);

    return lessonTracker.getLessonProgress();
  },

  // Test mixed performance
  testMixedPath: function () {
    lessonTracker.initializeLesson('test_mixed', 'Mixed Performance Test', []);
    console.log('\n🎭 Testing Mixed Performance Path');

    this.testSingleAction('lesson_content_viewed', {
      slidesViewed: 6,
      totalSlides: 10,
    });
    this.testSingleAction('deposit_made', { amount: 100 });
    this.testSingleAction('incorrect_answer', { attemptNumber: 1 }, false);
    this.testSingleAction('help_used', { helpType: 'tutorial' });
    this.testSingleAction('transfer_completed', { transferType: 'internal' });
    this.testSingleAction('financial_mistake', { severity: 'minor' }, false);

    return lessonTracker.getLessonProgress();
  },

  // Test different lesson scenarios
  testDifferentScenarios: function () {
    console.log('\n🎯 Testing Different Lesson Scenarios');

    const scenarios = [
      { title: 'Intro to Banking Tutorial', id: 1 },
      { title: 'Advanced Investment Mastery', id: 2 },
      { title: 'Practical Budget Application', id: 3 },
      { title: 'Basic Savings Lesson', id: 4 },
      { title: 'Expert Financial Planning', id: 5 },
    ];

    scenarios.forEach(lesson => {
      lessonTracker.initializeLesson(lesson.id, lesson.title, []);
      console.log(`\nLesson: ${lesson.title}`);
      console.log(`Scenario: ${lessonTracker.currentLesson.scenario.name}`);
      console.log(`Starting score: ${lessonTracker.appUsageScore}`);
      console.log(`Difficulty: ${lessonTracker.difficultyLevel}`);
      console.log(
        `Multipliers: +${lessonTracker.scoreMultipliers.positive.toFixed(2)}, -${lessonTracker.scoreMultipliers.negative.toFixed(2)}`,
      );
    });
  },

  // Complete current test lesson
  completeCurrentTest: function () {
    if (!lessonTracker.currentLesson) {
      console.log('No active lesson to complete');
      return null;
    }

    const result = completeLesson({
      message: 'Test lesson completed',
      completionType: 'test',
    });

    console.log('\n✅ Test Lesson Completed');
    console.log(
      `Final Score: ${result.score.finalScore}% (${result.score.grade})`,
    );

    return result;
  },
};

/****************SMART Goal Validation System****************/

/**
 * Validates if a financial goal meets SMART criteria
 * @param {Object} goal - The goal object to validate
 * @param {string} goal.title - The goal title/description
 * @param {number} goal.amount - The target amount (if applicable)
 * @param {Date} goal.deadline - The target completion date
 * @param {string} goal.description - Detailed description of the goal
 * @returns {Object} Validation result with scores for each SMART criteria
 */
export const validateSMARTGoal = function (goal) {
  if (!goal || typeof goal !== 'object') {
    return {
      isValid: false,
      error: 'Goal object is required',
      scores: {
        specific: 0,
        measurable: 0,
        achievable: 0,
        relevant: 0,
        timebound: 0,
      },
    };
  }

  const validation = {
    specific: validateSpecific(goal),
    measurable: validateMeasurable(goal),
    achievable: validateAchievable(goal),
    relevant: validateRelevant(goal),
    timebound: validateTimebound(goal),
  };

  const totalScore = Object.values(validation).reduce(
    (sum, score) => sum + score,
    0,
  );
  const averageScore = totalScore / 5;

  return {
    isValid: averageScore >= 0.7, // 70% threshold for SMART goal
    averageScore: averageScore,
    scores: validation,
    feedback: generateSMARTFeedback(validation),
    recommendations: generateSMARTRecommendations(validation),
  };
};

/**
 * Validates if a goal is Specific
 */
const validateSpecific = function (goal) {
  let score = 0;
  const title = goal.title || '';
  const description = goal.description || '';
  const combined = (title + ' ' + description).toLowerCase();

  // Check for specific action words
  const actionWords = [
    'save',
    'pay',
    'invest',
    'reduce',
    'increase',
    'build',
    'create',
    'establish',
  ];
  if (actionWords.some(word => combined.includes(word))) score += 0.3;

  // Check for specific amounts or percentages
  if (goal.amount && goal.amount > 0) score += 0.3;
  if (combined.match(/\d+%|\d+\s*(percent|percentage)/)) score += 0.2;

  // Check for specific purpose or reason
  const purposeWords = ['for', 'to', 'because', 'so that', 'in order to'];
  if (purposeWords.some(word => combined.includes(word))) score += 0.2;

  return Math.min(score, 1.0);
};

/**
 * Validates if a goal is Measurable
 */
const validateMeasurable = function (goal) {
  let score = 0;
  const title = goal.title || '';
  const description = goal.description || '';
  const combined = (title + ' ' + description).toLowerCase();

  // Check for numeric values
  if (goal.amount && goal.amount > 0) score += 0.4;
  if (combined.match(/\$\d+|\d+\s*dollars?/)) score += 0.3;
  if (combined.match(/\d+%|\d+\s*(percent|percentage)/)) score += 0.3;

  return Math.min(score, 1.0);
};

/**
 * Validates if a goal is Achievable
 */
const validateAchievable = function (goal) {
  let score = 0.5; // Base score assuming reasonable goal

  // Check if amount seems reasonable for a student
  if (goal.amount) {
    if (goal.amount <= 0) score = 0;
    else if (goal.amount <= 50)
      score = 1.0; // Very achievable
    else if (goal.amount <= 500)
      score = 0.8; // Achievable
    else if (goal.amount <= 2000)
      score = 0.6; // Challenging but achievable
    else if (goal.amount <= 10000)
      score = 0.4; // Very challenging
    else score = 0.2; // Potentially unrealistic
  }

  return score;
};

/**
 * Validates if a goal is Relevant to financial literacy
 */
const validateRelevant = function (goal) {
  let score = 0;
  const title = goal.title || '';
  const description = goal.description || '';
  const combined = (title + ' ' + description).toLowerCase();

  // Financial keywords that indicate relevance
  const financialKeywords = [
    'save',
    'saving',
    'savings',
    'money',
    'dollar',
    'budget',
    'budgeting',
    'invest',
    'investment',
    'debt',
    'loan',
    'credit',
    'bank',
    'account',
    'emergency',
    'fund',
    'retirement',
    'income',
    'expense',
    'spending',
    'financial',
    'finance',
    'economy',
    'economic',
    'purchase',
    'buy',
  ];

  const keywordMatches = financialKeywords.filter(keyword =>
    combined.includes(keyword),
  );
  score = Math.min(keywordMatches.length * 0.2, 1.0);

  return score;
};

/**
 * Validates if a goal is Time-bound
 */
const validateTimebound = function (goal) {
  let score = 0;
  const title = goal.title || '';
  const description = goal.description || '';
  const combined = (title + ' ' + description).toLowerCase();

  // Check for deadline
  if (goal.deadline && goal.deadline instanceof Date) {
    const now = new Date();
    const timeDiff = goal.deadline.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (daysDiff > 0 && daysDiff <= 365)
      score += 0.5; // Reasonable timeframe
    else if (daysDiff > 365) score += 0.3; // Long-term but still bounded
  }

  // Check for time expressions in text
  const timeWords = [
    'by',
    'within',
    'before',
    'after',
    'during',
    'week',
    'month',
    'year',
    'day',
    'semester',
    'quarter',
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];

  if (timeWords.some(word => combined.includes(word))) score += 0.5;

  return Math.min(score, 1.0);
};

/**
 * Generates feedback based on SMART validation scores
 */
const generateSMARTFeedback = function (scores) {
  const feedback = [];

  if (scores.specific < 0.7) {
    feedback.push(
      'Make your goal more specific by clearly stating what you want to accomplish and why.',
    );
  }
  if (scores.measurable < 0.7) {
    feedback.push(
      'Add a specific amount or percentage to make your goal measurable.',
    );
  }
  if (scores.achievable < 0.7) {
    feedback.push(
      'Consider if this goal is realistic given your current situation and resources.',
    );
  }
  if (scores.relevant < 0.7) {
    feedback.push(
      'Ensure your goal is relevant to your financial well-being and learning objectives.',
    );
  }
  if (scores.timebound < 0.7) {
    feedback.push(
      'Set a specific deadline or timeframe for achieving your goal.',
    );
  }

  if (feedback.length === 0) {
    feedback.push('Great job! Your goal meets all SMART criteria.');
  }

  return feedback;
};

/**
 * Generates specific recommendations for improving SMART goals
 */
const generateSMARTRecommendations = function (scores) {
  const recommendations = {};

  if (scores.specific < 0.7) {
    recommendations.specific = [
      "Use action words like 'save', 'pay off', or 'invest'",
      'Specify the exact purpose of your goal',
      'Include details about what exactly you want to achieve',
    ];
  }

  if (scores.measurable < 0.7) {
    recommendations.measurable = [
      "Add a specific dollar amount (e.g., '$500')",
      "Include a percentage (e.g., '10% of income')",
      'Define what success looks like in numbers',
    ];
  }

  if (scores.achievable < 0.7) {
    recommendations.achievable = [
      'Consider your current income and expenses',
      'Break large goals into smaller, manageable steps',
      'Start with smaller amounts and increase over time',
    ];
  }

  if (scores.relevant < 0.7) {
    recommendations.relevant = [
      'Connect your goal to your financial future',
      'Explain how this goal will improve your financial situation',
      'Consider if this goal aligns with your values and priorities',
    ];
  }

  if (scores.timebound < 0.7) {
    recommendations.timebound = [
      "Set a specific date (e.g., 'by December 31st')",
      "Use time periods (e.g., 'within 6 months')",
      'Create milestones with intermediate deadlines',
    ];
  }

  return recommendations;
};

/**
 * Helper function to check if a goal meets a specific SMART criteria
 * This can be used by the lesson conditional system
 */
export const checkSMARTCriteria = function (goal, criteria) {
  const validation = validateSMARTGoal(goal);

  switch (criteria) {
    case 'specific':
      return validation.scores.specific >= 0.7;
    case 'measurable':
      return validation.scores.measurable >= 0.7;
    case 'achievable':
      return validation.scores.achievable >= 0.7;
    case 'relevant':
      return validation.scores.relevant >= 0.7;
    case 'timebound':
      return validation.scores.timebound >= 0.7;
    case 'all_criteria':
      return validation.isValid;
    default:
      return false;
  }
};

/****************TEST SCENARIO GENERATOR****************/

/**
 * Generate different test scenarios for varied lesson outcomes
 * This creates different combinations of user actions to test scoring
 */
export const generateTestScenarios = function () {
  return {
    excellent_student: {
      name: 'Excellent Student Path',
      description: 'Perfect execution with exploration and efficiency',
      actions: [
        {
          type: 'lesson_content_viewed',
          details: { slidesViewed: 10, totalSlides: 10 },
        },
        { type: 'deposit_made', details: { amount: 500, successful: true } },
        {
          type: 'transfer_completed',
          details: { transferType: 'external', successful: true },
        },
        {
          type: 'budget_created',
          details: {
            categories: [
              'housing',
              'food',
              'transport',
              'savings',
              'entertainment',
            ],
            successful: true,
          },
        },
        { type: 'goal_set', details: { smartScore: 0.9, successful: true } },
        {
          type: 'efficiency_bonus',
          details: { timeSeconds: 45, featuresUsed: 5 },
        },
        { type: 'exploration_bonus', details: { featuresExplored: 4 } },
      ],
    },

    struggling_student: {
      name: 'Struggling Student Path',
      description: 'Multiple mistakes and failed attempts',
      actions: [
        {
          type: 'lesson_content_viewed',
          details: { slidesViewed: 3, totalSlides: 10 },
        },
        {
          type: 'financial_mistake',
          details: { severity: 'critical', type: 'overdraft' },
        },
        { type: 'incorrect_answer', details: { attemptNumber: 3 } },
        { type: 'deposit_made', details: { amount: 5, successful: false } },
        { type: 'help_used', details: { helpType: 'hint', successful: false } },
        { type: 'timeout_occurred', details: { progressPercentage: 25 } },
        { type: 'multiple_attempts_failed', details: { attempts: 4 } },
        {
          type: 'budget_created',
          details: { categories: ['other'], successful: false },
        },
      ],
    },

    average_student: {
      name: 'Average Student Path',
      description: 'Mix of successes and minor mistakes',
      actions: [
        {
          type: 'lesson_content_viewed',
          details: { slidesViewed: 7, totalSlides: 10 },
        },
        { type: 'deposit_made', details: { amount: 100, successful: true } },
        { type: 'incorrect_answer', details: { attemptNumber: 1 } },
        {
          type: 'transfer_completed',
          details: { transferType: 'internal', successful: true },
        },
        {
          type: 'help_used',
          details: { helpType: 'tutorial', successful: true },
        },
        { type: 'goal_set', details: { smartScore: 0.6, successful: true } },
        {
          type: 'account_checked',
          details: { accountType: 'checking', successful: true },
        },
      ],
    },

    explorer_student: {
      name: 'Explorer Student Path',
      description: 'Tries many features but makes some mistakes',
      actions: [
        {
          type: 'lesson_content_viewed',
          details: { slidesViewed: 5, totalSlides: 10 },
        },
        { type: 'exploration_bonus', details: { featuresExplored: 6 } },
        { type: 'deposit_made', details: { amount: 250, successful: true } },
        {
          type: 'investment_made',
          details: { riskLevel: 'high_risk', successful: false },
        },
        {
          type: 'transfer_completed',
          details: { transferType: 'external', successful: true },
        },
        {
          type: 'financial_mistake',
          details: { severity: 'minor', type: 'small_fee' },
        },
        {
          type: 'bill_paid',
          details: { billType: 'credit_card', onTime: true, successful: true },
        },
        {
          type: 'creative_solution',
          details: { approach: 'automated_savings', successful: true },
        },
      ],
    },

    efficient_student: {
      name: 'Efficient Student Path',
      description: 'Fast completion with good results',
      actions: [
        {
          type: 'lesson_content_viewed',
          details: { slidesViewed: 8, totalSlides: 10 },
        },
        {
          type: 'efficiency_bonus',
          details: { timeSeconds: 30, featuresUsed: 3 },
        },
        { type: 'deposit_made', details: { amount: 1000, successful: true } },
        {
          type: 'efficiency_bonus',
          details: { timeSeconds: 45, featuresUsed: 2 },
        },
        {
          type: 'budget_created',
          details: {
            categories: ['housing', 'food', 'savings'],
            successful: true,
          },
        },
        { type: 'goal_set', details: { smartScore: 0.8, successful: true } },
      ],
    },
  };
};

/**
 * Run a specific test scenario to demonstrate varied outcomes
 * @param {string} scenarioName - Name of the scenario to run
 * @param {string} lessonTitle - Title of the lesson to test with
 * @returns {Object} Test result with final score and breakdown
 */
export const runTestScenario = function (
  scenarioName,
  lessonTitle = 'Test Lesson',
) {
  const scenarios = generateTestScenarios();
  const scenario = scenarios[scenarioName];

  if (!scenario) {
    console.error('Unknown test scenario:', scenarioName);
    return null;
  }

  // Initialize a new lesson for testing
  lessonTracker.initializeLesson(`test_${Date.now()}`, lessonTitle, []);

  console.log(`\n=== Running Test Scenario: ${scenario.name} ===`);
  console.log(`Description: ${scenario.description}`);
  console.log(
    `Starting with scenario: ${lessonTracker.currentLesson.scenario.name}`,
  );
  console.log(`Base app score: ${lessonTracker.appUsageScore}`);

  let completionResult = null;

  // Execute all actions in the scenario
  scenario.actions.forEach((action, index) => {
    // Check if lesson is already completed
    if (
      lessonTracker.currentLesson &&
      lessonTracker.currentLesson.status === 'completed'
    ) {
      console.log(
        `\nAction ${index + 1}: ${action.type} (skipped - lesson already completed)`,
      );
      return;
    }

    console.log(`\nAction ${index + 1}: ${action.type}`);
    if (action.details.successful !== false) {
      lessonTracker.recordPositiveCondition(action.type, action.details);
    } else {
      lessonTracker.recordNegativeCondition(action.type, action.details);
    }
  });

  // Check if lesson was auto-completed during actions
  if (
    !lessonTracker.currentLesson ||
    lessonTracker.currentLesson.status === 'completed'
  ) {
    console.log('Lesson was auto-completed during scenario execution');
    // Create a mock completion result for display purposes
    completionResult = {
      score: {
        finalScore: lessonTracker.calculateCombinedScore(),
        grade: getLetterGrade(lessonTracker.calculateCombinedScore()),
        breakdown: {
          contentScore: lessonTracker.contentScore,
          appUsageScore: lessonTracker.appUsageScore,
          positiveConditions: lessonTracker.positiveConditionsMet.length,
          negativeConditions: lessonTracker.negativeConditionsTriggered.length,
        },
      },
      message: `Auto-completed using ${scenario.name} approach`,
    };
  } else {
    // Complete the lesson manually if it wasn't auto-completed
    completionResult = completeLesson({
      message: `Test completed using ${scenario.name} approach`,
      completionType: 'test',
      autoCompleted: false,
    });
  }

  // Ensure completionResult is not null before accessing its properties
  if (!completionResult) {
    console.error('Failed to get completion result');
    return null;
  }

  console.log(`\n=== Test Results for ${scenario.name} ===`);
  console.log(`Final Score: ${completionResult.score.finalScore}%`);
  console.log(`Letter Grade: ${completionResult.score.grade}`);
  console.log(
    `Content Score: ${completionResult.score.breakdown.contentScore}/30`,
  );
  console.log(
    `App Usage Score: ${completionResult.score.breakdown.appUsageScore}/70`,
  );
  console.log(
    `Positive Conditions: ${completionResult.score.breakdown.positiveConditions}`,
  );
  console.log(
    `Negative Conditions: ${completionResult.score.breakdown.negativeConditions}`,
  );

  return completionResult;
};

/**
 * Run all test scenarios to compare outcomes
 * @param {string} lessonTitle - Title of lesson to test with
 * @returns {Object} Comparison of all test results
 */
export const runAllTestScenarios = function (
  lessonTitle = 'Comprehensive Test Lesson',
) {
  const scenarios = generateTestScenarios();
  const results = {};

  console.log('\n🧪 === RUNNING ALL TEST SCENARIOS ===');

  Object.keys(scenarios).forEach(scenarioName => {
    results[scenarioName] = runTestScenario(scenarioName, lessonTitle);
  });

  // Summary comparison
  console.log('\n📊 === TEST SCENARIO COMPARISON ===');
  Object.keys(results).forEach(scenarioName => {
    const result = results[scenarioName];
    console.log(
      `${scenarioName}: ${result.score.finalScore}% (${result.score.grade}) - ${result.message}`,
    );
  });

  return results;
};

/****************LESSON COMPLETION & SCORING SYSTEM****************/

/**
 * Global lesson tracking object to monitor student progress
 * This tracks conditions met, penalties incurred, and quiz scores
 */
export const lessonTracker = {
  currentLesson: null,
  positiveConditionsMet: [],
  negativeConditionsTriggered: [],
  quizScores: [],
  startTime: null,
  endTime: null,
  requiredConditions: [], // Conditions that must be met for auto-completion
  contentScore: 0, // Score from viewing lesson content
  appUsageScore: 0, // Score from using the app features

  // Initialize tracking for a new lesson
  initializeLesson: function (lessonId, lessonTitle, requiredConditions = []) {
    // Determine lesson type and difficulty to create varied scenarios
    const lessonScenario = this.determineLessonScenario(lessonTitle, lessonId);

    this.currentLesson = {
      id: lessonId,
      title: lessonTitle,
      status: 'in-progress',
      scenario: lessonScenario,
    };
    this.positiveConditionsMet = [];
    this.negativeConditionsTriggered = [];
    this.quizScores = [];
    this.startTime = new Date();
    this.endTime = null;
    this.requiredConditions = requiredConditions;
    this.contentScore = 0;

    // Vary starting app usage score based on scenario
    this.appUsageScore = lessonScenario.baseAppScore;

    // Set scenario-specific multipliers
    this.scoreMultipliers = lessonScenario.multipliers;
    this.difficultyLevel = lessonScenario.difficulty;

    console.log(`Lesson tracking initialized for: ${lessonTitle}`);
    console.log('Lesson scenario:', lessonScenario);
    console.log('Required conditions for auto-completion:', requiredConditions);
  },

  // Determine lesson scenario for varied testing outcomes
  determineLessonScenario: function (lessonTitle, lessonId) {
    const titleLower = lessonTitle.toLowerCase();

    // Create different scenarios based on lesson content and randomization
    const scenarios = {
      beginner_friendly: {
        name: 'Beginner Friendly',
        baseAppScore: 75, // Higher starting score
        difficulty: 'easy',
        multipliers: { positive: 1.2, negative: 0.8 }, // More forgiving
        description: 'Extra support for new learners',
      },
      standard_challenge: {
        name: 'Standard Challenge',
        baseAppScore: 70, // Normal starting score
        difficulty: 'medium',
        multipliers: { positive: 1.0, negative: 1.0 }, // Balanced
        description: 'Balanced learning experience',
      },
      advanced_mastery: {
        name: 'Advanced Mastery',
        baseAppScore: 65, // Lower starting score
        difficulty: 'hard',
        multipliers: { positive: 0.8, negative: 1.3 }, // More demanding
        description: 'Higher expectations for mastery',
      },
      practical_application: {
        name: 'Practical Application',
        baseAppScore: 60, // Focus on demonstrating skills
        difficulty: 'hard',
        multipliers: { positive: 1.5, negative: 1.5 }, // High stakes
        description: 'Emphasis on real-world application',
      },
      exploratory_learning: {
        name: 'Exploratory Learning',
        baseAppScore: 80, // Encourage experimentation
        difficulty: 'easy',
        multipliers: { positive: 1.0, negative: 0.5 }, // Very forgiving
        description: 'Safe space to explore and learn',
      },
    };

    // Determine scenario based on lesson content and some randomization
    let selectedScenario;

    if (
      titleLower.includes('intro') ||
      titleLower.includes('basic') ||
      titleLower.includes('tutorial')
    ) {
      selectedScenario =
        Math.random() < 0.7 ? 'beginner_friendly' : 'exploratory_learning';
    } else if (
      titleLower.includes('advanced') ||
      titleLower.includes('mastery') ||
      titleLower.includes('expert')
    ) {
      selectedScenario =
        Math.random() < 0.8 ? 'advanced_mastery' : 'practical_application';
    } else if (
      titleLower.includes('practice') ||
      titleLower.includes('application') ||
      titleLower.includes('real')
    ) {
      selectedScenario = 'practical_application';
    } else {
      // For other lessons, add some randomization based on lesson ID
      const scenarioKeys = Object.keys(scenarios);
      let randomFactor;

      if (typeof lessonId === 'string') {
        // Use string hash for test scenarios
        let hash = 0;
        for (let i = 0; i < lessonId.length; i++) {
          hash = ((hash << 5) - hash + lessonId.charCodeAt(i)) & 0xffffffff;
        }
        randomFactor = Math.abs(hash) % scenarioKeys.length;
      } else {
        randomFactor = (lessonId * 7) % scenarioKeys.length;
      }

      selectedScenario = scenarioKeys[randomFactor];
    }

    console.log(
      `Lesson: "${lessonTitle}" -> Selected scenario: "${selectedScenario}"`,
    );

    const scenario = scenarios[selectedScenario];

    // Safety check: if scenario is undefined, default to standard_challenge
    if (!scenario) {
      console.warn(
        `Unknown scenario: ${selectedScenario}, defaulting to standard_challenge`,
      );
      const fallbackScenario = scenarios['standard_challenge'];
      // Create a copy to avoid modifying the original
      return {
        ...fallbackScenario,
        multipliers: {
          positive: fallbackScenario.multipliers.positive,
          negative: fallbackScenario.multipliers.negative,
        },
      };
    }

    // Add some additional randomization to the multipliers (±10%)
    const randomVariation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1

    // Create a copy of the scenario to avoid modifying the original
    const scenarioCopy = {
      ...scenario,
      multipliers: {
        positive: scenario.multipliers.positive * randomVariation,
        negative: scenario.multipliers.negative * randomVariation,
      },
    };

    return scenarioCopy;
  },

  // Record when a positive condition is met
  recordPositiveCondition: function (conditionType, details = {}) {
    if (!this.currentLesson) return;

    const record = {
      type: conditionType,
      timestamp: new Date(),
      details: details,
    };

    this.positiveConditionsMet.push(record);
    console.log(`Positive condition met: ${conditionType}`, details);

    // Update scores based on condition type
    this.updateScoresFromCondition(conditionType, details, true);

    // Check for automatic lesson completion
    this.checkAutoCompletion();
  },

  // Record when a negative condition is triggered
  recordNegativeCondition: function (conditionType, details = {}) {
    if (!this.currentLesson) return;

    const record = {
      type: conditionType,
      timestamp: new Date(),
      details: details,
    };

    this.negativeConditionsTriggered.push(record);
    console.log(`Negative condition triggered: ${conditionType}`, details);

    // Update scores based on condition type
    this.updateScoresFromCondition(conditionType, details, false);
  },

  // Update scores based on specific conditions
  updateScoresFromCondition: function (conditionType, details, isPositive) {
    // Get scenario multipliers for varied scoring
    const positiveMultiplier = this.scoreMultipliers?.positive || 1.0;
    const negativeMultiplier = this.scoreMultipliers?.negative || 1.0;
    const difficulty = this.difficultyLevel || 'medium';

    // Base score changes (before multipliers)
    let baseScoreChange = 0;

    switch (conditionType) {
      case 'lesson_content_viewed':
        // Award points for viewing lesson content (only positive)
        if (isPositive) {
          const viewingScore =
            details.slidesViewed && details.totalSlides
              ? (details.slidesViewed / details.totalSlides) * 30
              : 15;
          this.contentScore = Math.max(0, Math.min(30, viewingScore));
        }
        break;

      case 'deposit_made':
        baseScoreChange = isPositive ? 10 : -15;
        // Vary based on difficulty and amount
        if (details.amount) {
          if (details.amount >= 1000)
            baseScoreChange *= 1.3; // Larger deposits worth more
          else if (details.amount >= 100) baseScoreChange *= 1.1;
          else if (details.amount < 10) baseScoreChange *= 0.7; // Tiny deposits worth less
        }
        break;

      case 'transfer_completed':
        baseScoreChange = isPositive ? 8 : -12;
        // Bonus for complex transfers
        if (details.transferType === 'external' || details.recurring) {
          baseScoreChange *= 1.2;
        }
        break;

      case 'bill_paid':
        baseScoreChange = isPositive ? 12 : -18;
        // Vary based on bill type and timing
        if (details.billType === 'credit_card' || details.billType === 'loan') {
          baseScoreChange *= 1.2; // More important bills
        }
        if (details.onTime === false && isPositive === false) {
          baseScoreChange *= 1.5; // Late payment penalty
        }
        break;

      case 'investment_made':
        baseScoreChange = isPositive ? 15 : -22;
        // Reward thoughtful investment choices
        if (details.riskLevel === 'balanced' || details.diversified) {
          baseScoreChange *= 1.3;
        } else if (details.riskLevel === 'high_risk') {
          baseScoreChange *= 0.8; // Slight penalty for risky choices without analysis
        }
        break;

      case 'budget_created':
        baseScoreChange = isPositive ? 10 : -15;
        // Reward comprehensive budgets
        if (details.categories && details.categories.length >= 5) {
          baseScoreChange *= 1.4; // Detailed budget gets bonus
        } else if (details.categories && details.categories.length <= 2) {
          baseScoreChange *= 0.7; // Simple budget gets less
        }
        break;

      case 'goal_set':
        baseScoreChange = isPositive ? 8 : -12;
        // Use SMART goal validation if available
        if (details.smartScore) {
          baseScoreChange *= 0.7 + details.smartScore * 0.6; // Scale based on SMART quality
        }
        break;

      case 'account_checked':
        baseScoreChange = isPositive ? 3 : -5;
        // Bonus for checking multiple accounts or frequently
        if (details.accountType === 'all_accounts') {
          baseScoreChange *= 1.5;
        }
        break;

      case 'financial_mistake':
        // Always negative, scale by severity and scenario
        baseScoreChange = -15;
        if (details.severity === 'critical') baseScoreChange *= 1.8;
        else if (details.severity === 'minor') baseScoreChange *= 0.6;
        break;

      case 'incorrect_answer':
        baseScoreChange = -8;
        // Scale by attempt number
        if (details.attemptNumber) {
          baseScoreChange *= Math.min(details.attemptNumber * 0.3, 2.0);
        }
        break;

      case 'help_used':
        baseScoreChange = isPositive ? 2 : -3;
        // Different types of help have different impacts
        if (details.helpType === 'hint') baseScoreChange *= 0.5;
        else if (details.helpType === 'tutorial') baseScoreChange *= 1.2;
        break;

      case 'timeout_occurred':
        baseScoreChange = -10;
        // Scale by how close they were to completion
        if (details.progressPercentage) {
          const progressMultiplier =
            1 - (details.progressPercentage / 100) * 0.5;
          baseScoreChange *= progressMultiplier;
        }
        break;

      case 'multiple_attempts_failed':
        baseScoreChange = -12;
        // Scale by number of attempts
        if (details.attempts) {
          baseScoreChange *= Math.min(details.attempts * 0.2, 2.5);
        }
        break;

      case 'efficiency_bonus':
        // New condition for completing tasks quickly and correctly
        baseScoreChange = isPositive ? 8 : 0;
        if (details.timeSeconds && details.timeSeconds < 60) {
          baseScoreChange *= 1.5; // Speed bonus
        }
        break;

      case 'exploration_bonus':
        // New condition for trying different features
        baseScoreChange = isPositive ? 5 : 0;
        if (details.featuresExplored && details.featuresExplored > 3) {
          baseScoreChange *= 1.3; // Exploration bonus
        }
        break;

      case 'creative_solution':
        // New condition for innovative approaches
        baseScoreChange = isPositive ? 12 : 0;
        break;

      default:
        // Generic positive/negative actions with scenario variation
        baseScoreChange = isPositive ? 5 : -8;
    }

    // Apply scenario multipliers
    if (isPositive) {
      baseScoreChange *= positiveMultiplier;
    } else {
      baseScoreChange *= negativeMultiplier;
    }

    // Apply difficulty scaling
    if (difficulty === 'easy') {
      baseScoreChange = isPositive
        ? baseScoreChange * 1.1
        : baseScoreChange * 0.8;
    } else if (difficulty === 'hard') {
      baseScoreChange = isPositive
        ? baseScoreChange * 0.9
        : baseScoreChange * 1.2;
    }

    // Apply the score change
    this.appUsageScore += baseScoreChange;

    // Keep app usage score within bounds (MAX 70 points for app usage)
    this.appUsageScore = Math.max(0, Math.min(70, this.appUsageScore));

    // Log the scoring for debugging
    console.log(
      `Score change for ${conditionType}: ${baseScoreChange.toFixed(1)} (${isPositive ? 'positive' : 'negative'}). New app score: ${this.appUsageScore}`,
    );
  },

  // Check if all required conditions are met for auto-completion
  checkAutoCompletion: function () {
    if (!this.currentLesson || this.currentLesson.status === 'completed')
      return;

    // If no required conditions specified, use default completion logic
    if (this.requiredConditions.length === 0) {
      this.checkDefaultAutoCompletion();
      return;
    }

    // Check if all required conditions are met
    const metConditionTypes = this.positiveConditionsMet.map(
      record => record.type,
    );
    const allRequiredMet = this.requiredConditions.every(required =>
      metConditionTypes.includes(required),
    );

    if (allRequiredMet) {
      console.log('All required conditions met! Auto-completing lesson...');
      this.autoCompleteLesson();
    }
  },

  // Default auto-completion logic when no specific conditions are set
  checkDefaultAutoCompletion: function () {
    const metConditionTypes = this.positiveConditionsMet.map(
      record => record.type,
    );

    // Check if this is a test scenario (lesson ID starts with 'test_')
    const isTestScenario = this.currentLesson.id.startsWith('test_');

    // Auto-complete if student has:
    // 1. Viewed lesson content AND performed at least 2 app actions (3 for test scenarios)
    // OR
    // 2. Performed at least 3 significant app actions (4 for test scenarios)

    const hasViewedContent = metConditionTypes.includes(
      'lesson_content_viewed',
    );
    const appActionTypes = metConditionTypes.filter(type =>
      [
        'deposit_made',
        'transfer_completed',
        'bill_paid',
        'investment_made',
        'budget_created',
        'goal_set',
      ].includes(type),
    );

    const significantActions = appActionTypes.length;

    // Use higher thresholds for test scenarios to allow more actions to be processed
    const requiredWithContent = isTestScenario ? 3 : 2;
    const requiredWithoutContent = isTestScenario ? 4 : 3;

    if (
      (hasViewedContent && significantActions >= requiredWithContent) ||
      significantActions >= requiredWithoutContent
    ) {
      console.log(
        'Default auto-completion conditions met! Completing lesson...',
      );
      this.autoCompleteLesson();
    }
  },

  // Automatically complete the lesson
  autoCompleteLesson: function () {
    if (!this.currentLesson || this.currentLesson.status === 'completed')
      return;

    // Calculate combined score
    let totalScore = this.calculateCombinedScore();

    // Special case: If lesson is completed primarily through content viewing
    // and no significant app actions were required, award full points
    const hasSignificantAppActions = this.positiveConditionsMet.some(
      condition =>
        [
          'deposit_made',
          'transfer_completed',
          'bill_paid',
          'investment_made',
          'budget_created',
          'goal_set',
        ].includes(condition.type),
    );

    const hasViewedContent = this.positiveConditionsMet.some(
      condition => condition.type === 'lesson_content_viewed',
    );

    // If this is a content-only lesson (slider-only, no quiz), award 100
    if (
      hasViewedContent &&
      !hasSignificantAppActions &&
      this.requiredConditions.length === 0
    ) {
      totalScore = 100;
      console.log('Content-only lesson detected - awarding full score (100)');
    }

    // Determine appropriate completion message based on performance
    let completionMessage = `Great work! You've completed "${this.currentLesson.title}".`;

    // Only claim "mastery" for good grades (80+)
    if (totalScore >= 80) {
      completionMessage = `Excellent work! You've mastered "${this.currentLesson.title}" through hands-on practice!`;
    } else if (totalScore >= 70) {
      completionMessage = `Good progress! You've completed "${this.currentLesson.title}".`;
    } else {
      completionMessage = `You've completed "${this.currentLesson.title}". Keep practicing to improve your skills!`;
    }

    completeLesson({
      message: completionMessage,
      baseScore: totalScore,
      completionType: 'automatic',
      autoCompleted: true,
    });
  },

  // Calculate combined score from content viewing and app usage
  calculateCombinedScore: function () {
    // Content score is out of 30 points, app usage score is out of 70 points
    // They're already weighted properly, so just add them together
    const combinedScore = this.contentScore + this.appUsageScore;
    return Math.round(combinedScore);
  },

  // Add a quiz score to the lesson
  addQuizScore: function (score, maxScore = 100, quizName = 'Quiz') {
    if (!this.currentLesson) return;

    const quizRecord = {
      name: quizName,
      score: score,
      maxScore: maxScore,
      percentage: (score / maxScore) * 100,
      timestamp: new Date(),
    };

    this.quizScores.push(quizRecord);
    console.log(
      `Quiz score added: ${score}/${maxScore} (${quizRecord.percentage.toFixed(1)}%)`,
    );

    // Check for auto-completion after quiz
    this.checkAutoCompletion();
  },

  // Get current lesson progress for display
  getLessonProgress: function () {
    if (!this.currentLesson) return null;

    const metConditionTypes = this.positiveConditionsMet.map(
      record => record.type,
    );
    const requiredMet =
      this.requiredConditions.length > 0
        ? this.requiredConditions.filter(req => metConditionTypes.includes(req))
            .length
        : metConditionTypes.filter(type =>
            [
              'deposit_made',
              'transfer_completed',
              'bill_paid',
              'investment_made',
              'budget_created',
              'goal_set',
            ].includes(type),
          ).length;

    const requiredTotal =
      this.requiredConditions.length > 0 ? this.requiredConditions.length : 3;

    return {
      lessonTitle: this.currentLesson.title,
      progress: Math.min(100, (requiredMet / requiredTotal) * 100),
      contentScore: this.contentScore,
      appUsageScore: this.appUsageScore,
      combinedScore: this.calculateCombinedScore(),
      conditionsMet: requiredMet,
      conditionsRequired: requiredTotal,
      metConditions: this.positiveConditionsMet,
      isComplete: this.currentLesson.status === 'completed',
    };
  },
};

/**
 * Complete the current lesson and calculate the final score
 * @param {Object} completionConfig - Configuration for lesson completion
 * @param {string} completionConfig.message - Completion message for student
 * @param {number} completionConfig.baseScore - Base score before bonuses/penalties
 * @param {number} completionConfig.positiveBonus - Points per positive condition (default: 3)
 * @param {number} completionConfig.negativePenalty - Points per negative condition (default: 2)
 * @param {number} completionConfig.quizWeight - Quiz weight as percentage (default: 20)
 * @param {boolean} completionConfig.autoCompleted - Whether this was auto-completed
 * @param {string} completionConfig.completionType - 'automatic' or 'manual'
 * @returns {Object} Lesson completion result with score breakdown
 */
export const completeLesson = function (completionConfig = {}) {
  if (!lessonTracker.currentLesson) {
    console.error('No active lesson to complete');
    return null;
  }

  // Set default configuration
  const config = {
    message:
      completionConfig.message ||
      'Congratulations! You have completed this lesson.',
    baseScore:
      completionConfig.baseScore || lessonTracker.calculateCombinedScore(),
    positiveBonus: completionConfig.positiveBonus || 3,
    negativePenalty: completionConfig.negativePenalty || 2,
    quizWeight: completionConfig.quizWeight || 20,
    autoCompleted: completionConfig.autoCompleted || false,
    completionType: completionConfig.completionType || 'manual',
  };

  // Calculate score components with new system
  const scoreBreakdown = calculateLessonScore(config);

  // Mark lesson as completed
  lessonTracker.endTime = new Date();
  lessonTracker.currentLesson.status = 'completed';

  const completionResult = {
    lesson: lessonTracker.currentLesson,
    score: scoreBreakdown,
    completionTime: new Date(),
    duration: lessonTracker.endTime - lessonTracker.startTime,
    message: config.message,
    autoCompleted: config.autoCompleted,
    completionType: config.completionType,
    conditionsSummary: {
      positive: lessonTracker.positiveConditionsMet.length,
      negative: lessonTracker.negativeConditionsTriggered.length,
      quizzes: lessonTracker.quizScores.length,
    },
    detailedScores: {
      contentScore: lessonTracker.contentScore,
      appUsageScore: lessonTracker.appUsageScore,
      combinedBaseScore: lessonTracker.calculateCombinedScore(),
    },
  };

  // Save lesson completion to student profile
  saveLessonCompletion(completionResult);

  // Display completion to student
  displayLessonCompletion(completionResult);

  // Reset tracker for next lesson
  resetLessonTracker();

  console.log('Lesson completed:', completionResult);
  return completionResult;
};

/**
 * Calculate the final lesson score based on content viewing, app usage, conditions, and quizzes
 * @param {Object} config - Scoring configuration
 * @returns {Object} Detailed score breakdown
 */
const calculateLessonScore = function (config) {
  // Start with the combined base score (content + app usage)
  let baseScore = config.baseScore;

  // Add small bonuses for positive conditions (reduced impact since main scoring is in app usage)
  const positiveBonus =
    lessonTracker.positiveConditionsMet.length * config.positiveBonus;
  baseScore += positiveBonus;

  // Subtract penalties for negative conditions
  const negativePenalty =
    lessonTracker.negativeConditionsTriggered.length * config.negativePenalty;
  baseScore -= negativePenalty;

  // Ensure base score is within bounds
  baseScore = Math.max(0, Math.min(100, baseScore));

  // Calculate average quiz score
  let averageQuizScore = 0;
  if (lessonTracker.quizScores.length > 0) {
    const totalQuizScore = lessonTracker.quizScores.reduce(
      (sum, quiz) => sum + quiz.percentage,
      0,
    );
    averageQuizScore = totalQuizScore / lessonTracker.quizScores.length;
  }

  // Calculate weighted final score
  // If no quizzes were taken, use the full base score without quiz weighting
  const activityWeight = 100 - config.quizWeight; // Define this always for the breakdown
  let finalScore;
  if (lessonTracker.quizScores.length === 0) {
    finalScore = baseScore;
  } else {
    finalScore =
      (baseScore * activityWeight) / 100 +
      (averageQuizScore * config.quizWeight) / 100;
  }

  return {
    finalScore: Math.round(finalScore * 10) / 10, // Round to 1 decimal place
    breakdown: {
      baseScore: baseScore,
      contentScore: lessonTracker.contentScore,
      appUsageScore: lessonTracker.appUsageScore,
      averageQuizScore: Math.round(averageQuizScore * 10) / 10,
      positiveConditions: lessonTracker.positiveConditionsMet.length,
      negativeConditions: lessonTracker.negativeConditionsTriggered.length,
      positiveBonus: positiveBonus,
      negativePenalty: negativePenalty,
      quizCount: lessonTracker.quizScores.length,
      weights: {
        activity: activityWeight,
        quiz: config.quizWeight,
        content: 30, // 30% of activity score
        appUsage: 70, // 70% of activity score
      },
    },
    grade: getLetterGrade(finalScore),
  };
};

/**
 * Convert numeric score to letter grade
 * @param {number} score - Numeric score (0-100)
 * @returns {string} Letter grade
 */
const getLetterGrade = function (score) {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
};

/**
 * Send lesson completion data to server for database update
 * @param {Object} completionResult - Lesson completion data
 */
const sendLessonCompletionToServer = async function (completionResult) {
  try {
    // Get current student name from localStorage or session
    const studentName =
      localStorage.getItem('currentProfile') ||
      sessionStorage.getItem('currentProfile');

    if (!studentName) {
      console.warn('No student name found for database update');
      return;
    }

    // Safely extract breakdown data with proper null handling
    const breakdown = completionResult.score.breakdown || {};
    const positiveConditions = breakdown.positiveConditions || 0;
    const negativeConditions = breakdown.negativeConditions || 0;

    const lessonCompletionData = {
      studentName: studentName,
      lessonId: completionResult.lesson.id,
      lessonTitle: completionResult.lesson.title,
      score: completionResult.score.finalScore || 0,
      grade: completionResult.score.grade || 'F',
      completionDate: completionResult.completionTime,
      duration: completionResult.duration || 0,
      autoCompleted: completionResult.autoCompleted || false,
      difficultyLevel:
        completionResult.lesson.scenario?.difficulty || 'Standard',
      conditionsBreakdown: breakdown,
      totalConditions: positiveConditions + negativeConditions,
      completedConditions: positiveConditions,
    };

    const response = await fetch('http://localhost:3000/lesson-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lessonCompletionData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Lesson completion saved to database:', result);
    } else {
      console.error(
        'Failed to save lesson completion to database:',
        response.statusText,
      );
    }
  } catch (error) {
    console.error('Error sending lesson completion to server:', error);
  }
};

/**
 * Save lesson completion to student profile
 * @param {Object} completionResult - Lesson completion data
 */
const saveLessonCompletion = function (completionResult) {
  try {
    // Get or create student progress data
    let studentProgress = JSON.parse(
      localStorage.getItem('studentLessonProgress') || '{}',
    );

    // Initialize student data if needed
    if (!studentProgress.completedLessons) {
      studentProgress.completedLessons = [];
      studentProgress.totalLessonsCompleted = 0;
      studentProgress.averageScore = 0;
      studentProgress.totalScore = 0;
    }

    // Add this lesson to completed lessons
    studentProgress.completedLessons.push({
      lessonId: completionResult.lesson.id,
      lessonTitle: completionResult.lesson.title,
      score: completionResult.score.finalScore,
      grade: completionResult.score.grade,
      completionDate: completionResult.completionTime,
      duration: completionResult.duration,
      conditionsBreakdown: completionResult.score.breakdown,
    });

    // Update totals
    studentProgress.totalLessonsCompleted++;
    studentProgress.totalScore += completionResult.score.finalScore;
    studentProgress.averageScore =
      studentProgress.totalScore / studentProgress.totalLessonsCompleted;

    // Save to localStorage
    localStorage.setItem(
      'studentLessonProgress',
      JSON.stringify(studentProgress),
    );

    // Send to server for database update
    sendLessonCompletionToServer(completionResult);

    console.log('Lesson completion saved to student profile');
  } catch (error) {
    console.error('Error saving lesson completion:', error);
  }
};

/**
 * Display lesson completion modal to student
 * @param {Object} completionResult - Lesson completion data
 */
const displayLessonCompletion = function (completionResult) {
  const modal = document.createElement('div');
  modal.className = 'lesson-completion-modal';

  // Determine the completion message style based on auto vs manual completion
  const completionIcon = completionResult.autoCompleted
    ? 'fa-solid fa-star'
    : 'fa-solid fa-trophy';
  const completionTitle = completionResult.autoCompleted
    ? 'Lesson Mastered!'
    : 'Lesson Complete!';

  modal.innerHTML = `
    <div class="completion-modal-content">
      <div class="completion-header ${completionResult.autoCompleted ? 'auto-completion' : ''}">
        <i class="${completionIcon} completion-icon"></i>
        <h2>${completionTitle}</h2>
      </div>
      
      <div class="completion-message">
        <p>${completionResult.message}</p>
        ${
          completionResult.autoCompleted &&
          completionResult.score.finalScore >= 80
            ? '<p class="auto-completion-note">You mastered this lesson through hands-on practice!</p>'
            : completionResult.autoCompleted &&
                completionResult.score.finalScore >= 70
              ? '<p class="auto-completion-note">Good progress! Keep practicing to master the skills.</p>'
              : completionResult.autoCompleted
                ? '<p class="auto-completion-note">Completed through app usage. Review the material to strengthen understanding.</p>'
                : ''
        }
      </div>
      
      <div class="score-display">
        <div class="final-score">
          <span class="score-label">Final Grade:</span>
          <span class="score-value">${completionResult.score.finalScore}</span>
          <span class="score-grade">${completionResult.score.grade}</span>
        </div>
        
        <div class="score-breakdown">
          <div class="breakdown-section">
            <h4>Score Breakdown</h4>
            <div class="breakdown-item primary">
              <span>Content Understanding:</span>
              <span>${completionResult.score.breakdown.contentScore}/30</span>
            </div>
            <div class="breakdown-item primary">
              <span>App Usage Mastery:</span>
              <span>${completionResult.score.breakdown.appUsageScore}/70</span>
            </div>
            <div class="breakdown-item">
              <span>Base Combined Score:</span>
              <span>${completionResult.score.breakdown.baseScore}/100</span>
            </div>
            ${
              completionResult.score.breakdown.averageQuizScore > 0
                ? `
            <div class="breakdown-item">
              <span>Quiz Average:</span>
              <span>${completionResult.score.breakdown.averageQuizScore}/100</span>
            </div>
            `
                : ''
            }
            ${
              completionResult.score.breakdown.positiveBonus > 0
                ? `
            <div class="breakdown-item bonus">
              <span>Bonus Actions:</span>
              <span>+${completionResult.score.breakdown.positiveBonus} pts</span>
            </div>
            `
                : ''
            }
            ${
              completionResult.score.breakdown.negativePenalty > 0
                ? `
            <div class="breakdown-item penalty">
              <span>Penalties:</span>
              <span>-${completionResult.score.breakdown.negativePenalty} pts</span>
            </div>
            `
                : ''
            }
          </div>
          
          <div class="completion-stats">
            <div class="stat-item">
              <i class="fa-solid fa-check-circle"></i>
              <span>${completionResult.conditionsSummary.positive} Actions Completed</span>
            </div>
            ${
              completionResult.conditionsSummary.quizzes > 0
                ? `
            <div class="stat-item">
              <i class="fa-solid fa-brain"></i>
              <span>${completionResult.conditionsSummary.quizzes} Quizzes Taken</span>
            </div>
            `
                : ''
            }
            <div class="stat-item">
              <i class="fa-solid fa-clock"></i>
              <span>Duration: ${Math.round(completionResult.duration / 60000)} minutes</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="completion-actions">
        <button class="btn-primary" onclick="closeLessonCompletion()">Continue Learning</button>
        <button class="btn-secondary" onclick="viewDetailedResults()">View Details</button>
      </div>
    </div>
  `;

  // Enhanced modal styles
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease-out;
  `;

  // Add enhanced completion modal styles
  if (!document.getElementById('enhancedCompletionStyles')) {
    const style = document.createElement('style');
    style.id = 'enhancedCompletionStyles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .completion-modal-content {
        background: white;
        border-radius: 16px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: slideInUp 0.4s ease-out;
      }
      
      @keyframes slideInUp {
        from {
          transform: translateY(50px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .completion-header {
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 24px;
        text-align: center;
        border-radius: 16px 16px 0 0;
      }
      
      .completion-header.auto-completion {
        background: linear-gradient(135deg, #ffc107, #ff8c00);
      }
      
      .completion-icon {
        font-size: 3em;
        margin-bottom: 12px;
        display: block;
      }
      
      .completion-header h2 {
        margin: 0;
        font-size: 1.8em;
        font-weight: 700;
      }
      
      .completion-message {
        padding: 20px 24px;
        text-align: center;
      }
      
      .completion-message p {
        margin: 0 0 8px 0;
        font-size: 1.1em;
        color: #333;
      }
      
      .auto-completion-note {
        font-size: 0.95em !important;
        color: #666 !important;
        font-style: italic;
      }
      
      .score-display {
        padding: 0 24px 20px;
      }
      
      .final-score {
        background: linear-gradient(135deg, #00ffcc, #00b3a6);
        color: white;
        padding: 16px;
        border-radius: 12px;
        text-align: center;
        margin-bottom: 20px;
      }
      
      .score-label {
        display: block;
        font-size: 0.9em;
        margin-bottom: 4px;
        opacity: 0.9;
      }
      
      .score-value {
        font-size: 2.5em;
        font-weight: 700;
        margin: 0 8px;
      }
      
      .score-grade {
        font-size: 1.5em;
        font-weight: 600;
      }
      
      .breakdown-section h4 {
        margin: 0 0 12px 0;
        color: #333;
        font-size: 1.1em;
      }
      
      .breakdown-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .breakdown-item.primary {
        font-weight: 600;
        color: #00b3a6;
      }
      
      .breakdown-item.bonus {
        color: #28a745;
        font-weight: 500;
      }
      
      .breakdown-item.penalty {
        color: #dc3545;
        font-weight: 500;
      }
      
      .completion-stats {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 2px solid #f0f0f0;
      }
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: #666;
      }
      
      .stat-item i {
        color: #00b3a6;
        width: 16px;
      }
      
      .completion-actions {
        padding: 20px 24px;
        display: flex;
        gap: 12px;
        justify-content: center;
        border-top: 1px solid #f0f0f0;
      }
      
      .completion-actions .btn-primary {
        background: #00b3a6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .completion-actions .btn-primary:hover {
        background: #00998a;
      }
      
      .completion-actions .btn-secondary {
        background: white;
        color: #666;
        border: 2px solid #ddd;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .completion-actions .btn-secondary:hover {
        border-color: #00b3a6;
        color: #00b3a6;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  // Global functions for modal interaction
  window.closeLessonCompletion = function () {
    modal.style.animation = 'fadeOut 0.3s ease-in';
    setTimeout(() => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }, 300);
  };

  window.viewDetailedResults = function () {
    console.log('Detailed Results:', completionResult);

    // Create detailed breakdown display
    const detailsModal = document.createElement('div');
    detailsModal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 8px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
        <h3>Detailed Lesson Results</h3>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 0.9em; overflow-x: auto;">
${JSON.stringify(completionResult, null, 2)}
        </pre>
        <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 15px; padding: 8px 16px; background: #00b3a6; color: white; border: none; border-radius: 4px; cursor: pointer;">Close Details</button>
      </div>
    `;
    detailsModal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); display: flex; align-items: center; 
      justify-content: center; z-index: 10001;
    `;
    document.body.appendChild(detailsModal);
  };
};

/**
 * Reset the lesson tracker for the next lesson
 */
const resetLessonTracker = function () {
  lessonTracker.currentLesson = null;
  lessonTracker.positiveConditionsMet = [];
  lessonTracker.negativeConditionsTriggered = [];
  lessonTracker.quizScores = [];
  lessonTracker.startTime = null;
  lessonTracker.endTime = null;
};

/**
 * Get student's lesson progress summary
 * @returns {Object} Student progress data
 */
export const getStudentProgress = function () {
  try {
    const progress = JSON.parse(
      localStorage.getItem('studentLessonProgress') || '{}',
    );
    return {
      totalCompleted: progress.totalLessonsCompleted || 0,
      averageScore: progress.averageScore || 0,
      completedLessons: progress.completedLessons || [],
      currentLesson: lessonTracker.currentLesson,
    };
  } catch (error) {
    console.error('Error retrieving student progress:', error);
    return {
      totalCompleted: 0,
      averageScore: 0,
      completedLessons: [],
      currentLesson: null,
    };
  }
};

/**
 * Check if a specific lesson completion condition is met
 * This function can be called by the teacher's conditional system
 * @param {string} conditionType - Type of completion condition to check
 * @returns {boolean} Whether the condition is met
 */
export const checkLessonCompletionCondition = function (conditionType) {
  switch (conditionType) {
    case 'lesson_completion_trigger':
      return true; // Always true when this is called - used to trigger completion
    default:
      return false;
  }
};

/****************ADDITIONAL TEST FUNCTIONS FOR DEMO PAGE****************/

/**
 * Run quiz-specific demo scenarios
 */
window.runQuizDemo = function () {
  console.log('\n📚 === QUIZ DEMO SCENARIOS ===');

  // Test different quiz performance levels
  const quizScenarios = [
    { name: 'Perfect Quiz', score: 100, description: 'All answers correct' },
    { name: 'Good Quiz', score: 85, description: 'Most answers correct' },
    { name: 'Average Quiz', score: 70, description: 'Some mistakes made' },
    { name: 'Poor Quiz', score: 45, description: 'Many wrong answers' },
  ];

  quizScenarios.forEach(quiz => {
    lessonTracker.initializeLesson(
      `quiz_test_${Date.now()}`,
      `Quiz Test: ${quiz.name}`,
      [],
    );

    // Add some content viewing
    lessonTracker.recordPositiveCondition('lesson_content_viewed', {
      slidesViewed: 8,
      totalSlides: 10,
    });

    // Add the quiz score
    lessonTracker.addQuizScore(quiz.score, 100, quiz.name);

    // Add some app usage based on quiz performance
    if (quiz.score >= 85) {
      lessonTracker.recordPositiveCondition('deposit_made', { amount: 500 });
      lessonTracker.recordPositiveCondition('efficiency_bonus', {
        timeSeconds: 30,
      });
    } else if (quiz.score >= 70) {
      lessonTracker.recordPositiveCondition('deposit_made', { amount: 100 });
      lessonTracker.recordNegativeCondition('incorrect_answer', {
        attemptNumber: 1,
      });
    } else {
      lessonTracker.recordNegativeCondition('financial_mistake', {
        severity: 'minor',
      });
      lessonTracker.recordNegativeCondition('multiple_attempts_failed', {
        attempts: 3,
      });
    }

    // Complete the lesson
    const result = completeLesson({
      message: `${quiz.name} completed - ${quiz.description}`,
      completionType: 'quiz_demo',
    });

    console.log(
      `${quiz.name}: ${result.score.finalScore}% (${result.score.grade})`,
    );
    console.log(
      `  Quiz Impact: ${quiz.score}% quiz, Activity: ${result.score.breakdown.baseScore}%`,
    );
    console.log(`  Description: ${quiz.description}\n`);
  });
};

/**
 * Run individual test scenarios for comparison
 */
window.runIndividualTest = function () {
  console.log('\n🔬 === INDIVIDUAL TEST SCENARIOS ===');

  const individualTests = [
    {
      name: 'Speed Runner',
      actions: [
        {
          type: 'lesson_content_viewed',
          details: { slidesViewed: 10, totalSlides: 10 },
        },
        {
          type: 'efficiency_bonus',
          details: { timeSeconds: 20, featuresUsed: 4 },
        },
        { type: 'deposit_made', details: { amount: 1000 } },
        {
          type: 'efficiency_bonus',
          details: { timeSeconds: 15, featuresUsed: 2 },
        },
      ],
    },
    {
      name: 'Detail Oriented',
      actions: [
        {
          type: 'lesson_content_viewed',
          details: { slidesViewed: 10, totalSlides: 10 },
        },
        {
          type: 'budget_created',
          details: {
            categories: [
              'housing',
              'food',
              'transport',
              'utilities',
              'savings',
              'entertainment',
            ],
          },
        },
        { type: 'goal_set', details: { smartScore: 0.95 } },
        {
          type: 'investment_made',
          details: { riskLevel: 'balanced', diversified: true },
        },
      ],
    },
    {
      name: 'Explorer',
      actions: [
        {
          type: 'lesson_content_viewed',
          details: { slidesViewed: 6, totalSlides: 10 },
        },
        { type: 'exploration_bonus', details: { featuresExplored: 8 } },
        { type: 'account_checked', details: { accountType: 'all_accounts' } },
        {
          type: 'creative_solution',
          details: { approach: 'automated_budgeting' },
        },
        { type: 'help_used', details: { helpType: 'tutorial' } },
      ],
    },
    {
      name: 'Struggling Learner',
      actions: [
        {
          type: 'lesson_content_viewed',
          details: { slidesViewed: 4, totalSlides: 10 },
        },
        {
          type: 'timeout_occurred',
          details: { progressPercentage: 30 },
          negative: true,
        },
        { type: 'help_used', details: { helpType: 'hint' } },
        { type: 'deposit_made', details: { amount: 20 } },
        {
          type: 'incorrect_answer',
          details: { attemptNumber: 2 },
          negative: true,
        },
        {
          type: 'financial_mistake',
          details: { severity: 'minor' },
          negative: true,
        },
      ],
    },
  ];

  individualTests.forEach(test => {
    lessonTracker.initializeLesson(
      `individual_${Date.now()}`,
      `Individual Test: ${test.name}`,
      [],
    );

    console.log(`\n--- ${test.name} Test ---`);
    console.log(`Scenario: ${lessonTracker.currentLesson.scenario.name}`);
    console.log(`Starting score: ${lessonTracker.appUsageScore}`);

    // Execute actions
    test.actions.forEach(action => {
      if (action.negative) {
        lessonTracker.recordNegativeCondition(action.type, action.details);
      } else {
        lessonTracker.recordPositiveCondition(action.type, action.details);
      }
    });

    // Complete the lesson
    const result = completeLesson({
      message: `${test.name} test completed`,
      completionType: 'individual_test',
    });

    console.log(
      `Final Score: ${result.score.finalScore}% (${result.score.grade})`,
    );
    console.log(
      `Content: ${result.score.breakdown.contentScore}/30, App: ${result.score.breakdown.appUsageScore}/70`,
    );
  });
};

/****************MAKE FUNCTIONS GLOBALLY AVAILABLE****************/

// Make test functions available globally for easy console access
window.testLessonActions = testLessonActions;
window.runTestScenario = runTestScenario;
window.runAllTestScenarios = runAllTestScenarios;

// Make database functions available globally
window.sendLessonCompletionToServer = sendLessonCompletionToServer;
window.saveLessonCompletion = saveLessonCompletion;

/**
 * Test database integration - for console testing
 */
window.testDatabaseIntegration = async function () {
  console.log('🧪 Testing Database Integration...');

  // Set a test student email (this would normally be set during login)
  localStorage.setItem('currentStudentEmail', 'test-student@example.com');

  // Run the excellent student scenario
  console.log('📊 Running excellent student test scenario...');
  const result = await runTestScenario('excellent_student');

  if (result) {
    console.log('✅ Database integration test completed successfully!');
    console.log(
      `Final result: ${result.score.finalScore}% (${result.score.grade})`,
    );
    console.log(
      '💡 Check server logs for database updates (if server is running on port 3000).',
    );
  } else {
    console.log('❌ Test failed - check the errors above.');
  }

  console.log(
    '💡 In a real scenario, the student email would be set during login process.',
  );
};

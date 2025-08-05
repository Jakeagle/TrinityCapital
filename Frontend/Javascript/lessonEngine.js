/****************Variables****************/
console.log('🔧 lessonEngine.js loaded with ES6 exports');
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
export const renderLessons = async function (studentProfile) {
  console.log('✅ renderLessons function called with profile:', studentProfile);
  if (!studentProfile) {
    console.error('Student profile is required to render lessons.');
    lessonHeader.textContent = 'Lessons';
    lessonContainer.innerHTML =
      '<p>Could not identify student to load lessons.</p>';
    return;
  }

  const studentId =
    studentProfile.memberName || studentProfile.username || studentProfile._id;
  console.log('Fetching assigned units for student:', studentId);

  try {
    console.log('=== FETCHING ASSIGNED UNITS ===');
    console.log('Student ID:', studentId);
    console.log(
      'Fetch URL:',
      `http://localhost:3000/student/${studentId}/assignedUnits`,
    );

    // Fetch all assigned units with complete lesson data from the server
    const response = await fetch(
      `http://localhost:3000/student/${studentId}/assignedUnits`,
    );

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      console.error('❌ Failed to fetch assigned units:', response.status);
      console.error('Response status text:', response.statusText);
      lessonHeader.textContent = 'Lessons';
      lessonContainer.innerHTML =
        '<p>Error loading lessons. Please try again.</p>';
      return;
    }

    const data = await response.json();
    console.log('✅ Received data from server:', data);
    console.log('Data structure:', {
      success: data.success,
      assignedUnitsCount: data.assignedUnits ? data.assignedUnits.length : 0,
      assignedUnits: data.assignedUnits,
    });

    if (!data.success || !data.assignedUnits) {
      console.log('No assigned units data received');
      lessonHeader.textContent = 'Lessons';
      lessonContainer.innerHTML = '<p>No lessons assigned yet.</p>';
      return;
    }

    const assignedUnits = data.assignedUnits;
    console.log(
      `✅ Received ${assignedUnits.length} assigned units with complete lesson data`,
    );

    if (assignedUnits.length === 0) {
      lessonHeader.textContent = 'Lessons';
      lessonContainer.innerHTML = '<p>No lessons assigned yet.</p>';
      return;
    }

    // Render all assigned units
    console.log('✅ Successfully fetched lesson data, rendering units...');
    renderAllAssignedUnits(assignedUnits);
  } catch (error) {
    console.error('❌ Error fetching assigned units:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    lessonHeader.textContent = 'Lessons';
    lessonContainer.innerHTML =
      '<p>Error loading lessons. Please check your connection and ensure the server is running.</p>';
  }
};

// Make renderLessons available globally for socket listeners
window.renderLessons = renderLessons;

/**
 * Render all assigned units with their lessons
 * @param {Array} assignedUnits - Array of units with complete lesson data
 */
const renderAllAssignedUnits = function (assignedUnits) {
  console.log('=== RENDERING ALL ASSIGNED UNITS ===');
  console.log('Assigned units data:', assignedUnits);
  console.log('Number of units:', assignedUnits.length);

  // Log detailed structure of each unit
  assignedUnits.forEach((unit, index) => {
    console.log(`Unit ${index}:`, {
      unitName: unit.unitName,
      unitValue: unit.unitValue,
      lessonsCount: unit.lessons ? unit.lessons.length : 0,
      lessons: unit.lessons,
    });

    if (unit.lessons && unit.lessons.length > 0) {
      unit.lessons.forEach((lesson, lessonIndex) => {
        console.log(`  Lesson ${lessonIndex}:`, {
          title: lesson.lesson_title,
          hasContent: !!lesson.content,
          hasLessonBlocks: !!lesson.lesson_blocks,
          hasConditions: !!lesson.lesson_conditions,
          lessonKeys: Object.keys(lesson),
        });
      });
    }
  });

  lessonContainer.innerHTML = ''; // Clear the container

  // Store all lessons data globally for carousel access
  window.currentLessonsData = [];
  console.log('Initialized window.currentLessonsData as empty array');

  // Sort units to ensure proper order (Unit 1, Unit 2, etc.)
  const sortedUnits = [...assignedUnits].sort((a, b) => {
    const getUnitNumber = unitValue => {
      if (typeof unitValue === 'string') {
        const match = unitValue.match(/\d+/);
        return match ? parseInt(match[0]) : 999;
      }
      return typeof unitValue === 'number' ? unitValue : 999;
    };

    return getUnitNumber(a.unitValue) - getUnitNumber(b.unitValue);
  });

  console.log(
    'Units sorted by value:',
    sortedUnits.map(u => `${u.unitName} (${u.unitValue})`),
  );

  // Set header based on number of units
  if (sortedUnits.length === 1) {
    const unit = sortedUnits[0];
    const unitNumber = getUnitDisplayNumber(unit.unitValue);
    lessonHeader.textContent = `Unit ${unitNumber}: ${unit.unitName}`;
  } else {
    lessonHeader.textContent = `${sortedUnits.length} Units Assigned`;
  }

  // Add styles for unit sections
  addUnitStyles();

  // Handle multiple units by showing them as separate sections
  sortedUnits.forEach((unit, unitIndex) => {
    if (
      unit.lessons &&
      Array.isArray(unit.lessons) &&
      unit.lessons.length > 0
    ) {
      // Create unit section header (only if multiple units)
      if (sortedUnits.length > 1) {
        const unitNumber = getUnitDisplayNumber(unit.unitValue);
        const unitSectionHtml = `
          <div class="col-12 unit-section-header">
            <h4 class="unit-title">Unit ${unitNumber}: ${unit.unitName}</h4>
            <p class="unit-description">${unit.lessons.length} lesson${unit.lessons.length === 1 ? '' : 's'} available</p>
          </div>
        `;
        lessonContainer.insertAdjacentHTML('beforeend', unitSectionHtml);
      }

      // Add lessons for this unit
      unit.lessons.forEach((lesson, lessonIndex) => {
        // Calculate global lesson index across all units
        const globalLessonIndex = window.currentLessonsData.length;

        // Add lesson to global data store
        window.currentLessonsData.push({
          ...lesson,
          unitName: unit.unitName,
          unitIndex: unitIndex,
          lessonIndex: lessonIndex,
        });

        const iconClass =
          lesson.icon_class || getIconForLesson(lesson.lesson_title);
        const lessonHtml = `
          <div class="col-1 lesson-item-wrapper" onclick="openLessonCarousel(${globalLessonIndex})" style="cursor: pointer;">
            <div class="lessonDiv">
              <i class="${iconClass} lessonIcon"></i>
            </div>
            <h5 class="lessonName">${lesson.lesson_title}</h5>
          </div>
        `;
        lessonContainer.insertAdjacentHTML('beforeend', lessonHtml);
      });
    } else {
      // Unit exists but has no lessons
      if (sortedUnits.length > 1) {
        const unitNumber = getUnitDisplayNumber(unit.unitValue);
        const emptyUnitHtml = `
          <div class="col-12 unit-section-header">
            <h4 class="unit-title">Unit ${unitNumber}: ${unit.unitName}</h4>
            <p class="unit-description">No lessons available yet</p>
          </div>
        `;
        lessonContainer.insertAdjacentHTML('beforeend', emptyUnitHtml);
      }
    }
  });

  // Handle case where no lessons were found across all units
  if (window.currentLessonsData.length === 0) {
    lessonContainer.innerHTML =
      '<p>No lessons available in assigned units.</p>';
  }

  console.log(
    `✅ Rendered ${sortedUnits.length} units with ${window.currentLessonsData.length} total lessons`,
  );
  console.log(
    'Units rendered in order:',
    sortedUnits.map(
      u => `Unit ${getUnitDisplayNumber(u.unitValue)}: ${u.unitName}`,
    ),
  );
};

/**
 * Extract display number from unit value
 * @param {string|number} unitValue - The unit value (e.g., "unit1", 1, "Unit 2")
 * @returns {number} - The unit number for display
 */
const getUnitDisplayNumber = function (unitValue) {
  if (typeof unitValue === 'string') {
    const match = unitValue.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  }
  return typeof unitValue === 'number' ? unitValue : 1;
};

/**
 * Add CSS styles for unit sections
 */
const addUnitStyles = function () {
  // Check if styles already added
  if (document.getElementById('unitSectionStyles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'unitSectionStyles';
  style.textContent = `
    .unit-section-header {
      margin: 1.5rem 0 1rem 0;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, rgba(0, 255, 204, 0.1) 0%, rgba(79, 172, 254, 0.1) 100%);
      border-radius: 12px;
      border: 1px solid rgba(0, 255, 204, 0.2);
      text-align: center;
    }

    .unit-title {
      color: #00ffcc;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 0 10px rgba(0, 255, 204, 0.3);
    }

    .unit-description {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1rem;
      margin: 0;
      font-style: italic;
    }

    .lesson-item-wrapper {
      transition: all 0.3s ease;
      margin-bottom: 1rem;
    }

    .lesson-item-wrapper:hover {
      transform: translateY(-2px);
    }

    .lesson-item-wrapper:hover .lessonDiv {
      box-shadow: 0 8px 25px rgba(0, 255, 204, 0.3);
      border-color: #00ffcc;
    }

    .lesson-item-wrapper:hover .lessonName {
      color: #00ffcc;
    }

    .lessonDiv {
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .lessonName {
      transition: color 0.3s ease;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .unit-section-header {
        margin: 1rem 0 0.5rem 0;
        padding: 0.75rem 1rem;
      }
      
      .unit-title {
        font-size: 1.3rem;
      }
      
      .unit-description {
        font-size: 0.9rem;
      }
    }
  `;
  document.head.appendChild(style);
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
  console.log('=== OPENING LESSON CAROUSEL ===');
  console.log('Lesson index requested:', lessonIndex);
  console.log('window.currentLessonsData exists:', !!window.currentLessonsData);
  console.log(
    'window.currentLessonsData length:',
    window.currentLessonsData ? window.currentLessonsData.length : 'undefined',
  );

  if (!window.currentLessonsData || !window.currentLessonsData[lessonIndex]) {
    console.error('❌ Lesson data not found for index:', lessonIndex);
    console.error('Available lesson data:', window.currentLessonsData);
    console.error(
      'Available lesson count:',
      window.currentLessonsData ? window.currentLessonsData.length : 0,
    );
    alert('Lesson data not found. Please refresh the page and try again.');
    return;
  }

  const lesson = window.currentLessonsData[lessonIndex];
  console.log('✅ Found lesson data:', lesson);
  console.log('Lesson title:', lesson.lesson_title);
  console.log('Lesson keys:', Object.keys(lesson));

  carouselState.currentLessonIndex = lessonIndex;
  carouselState.lessonData = lesson;
  carouselState.currentSlideIndex = 0;

  // Parse lesson content into slides
  console.log('Parsing lesson content...');
  carouselState.slides = parseLessonContent(lesson);
  console.log('✅ Parsed slides:', carouselState.slides);
  console.log('Total slides created:', carouselState.slides.length);

  if (carouselState.slides.length === 0) {
    console.error('❌ No slides were created from lesson content!');
    alert('This lesson appears to have no content. Please contact support.');
    return;
  }

  // Check if content has been completed and navigate to instructions automatically
  const contentCompleted = isLessonContentCompleted(lessonIndex);
  const instructionSlideIndex = carouselState.slides.findIndex(
    slide => slide.isInstructions,
  );

  if (contentCompleted && instructionSlideIndex !== -1) {
    console.log('Content already completed, navigating to instructions...');
    carouselState.currentSlideIndex = instructionSlideIndex;

    // Show a brief notification about automatic navigation
    setTimeout(() => {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #2196F3;
        color: white;
        padding: 10px 16px;
        border-radius: 4px;
        font-size: 13px;
        z-index: 10001;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      `;
      notification.textContent = 'Content completed! Showing instructions.';
      document.body.appendChild(notification);

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    }, 500);
  }

  // Create and show the carousel dialog
  console.log('Creating carousel dialog...');
  createCarouselDialog();

  // Initialize lesson tracking for auto-completion
  console.log('Initializing lesson tracking for auto-completion...');
  const requiredConditions = extractRequiredConditions(lesson);
  lessonTracker.initializeLesson(
    `lesson_${lessonIndex}`,
    lesson.lesson_title,
    requiredConditions,
  );
  console.log(
    'Lesson tracking initialized with required conditions:',
    requiredConditions,
  );

  console.log('Showing current slide...');
  showCurrentSlide();
  console.log('✅ Lesson carousel opened successfully');
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
  console.log('parseLessonContent called with lesson:', lesson);
  console.log('Lesson object keys:', Object.keys(lesson));
  console.log('Lesson object values:', Object.values(lesson));

  // Log the specific key-value pairs to see what we're working with
  console.log('DETAILED LESSON STRUCTURE:');
  Object.keys(lesson).forEach(key => {
    console.log(`Key: "${key}" = Value:`, lesson[key]);
    if (typeof lesson[key] === 'object' && lesson[key] !== null) {
      console.log(`  ${key} object keys:`, Object.keys(lesson[key]));
    }
  });

  const slides = [];

  // Check for Dallas Fed lesson structure first (content array)
  if (lesson.content && Array.isArray(lesson.content)) {
    console.log(
      'Found Dallas Fed content array with',
      lesson.content.length,
      'blocks',
    );

    // Process content blocks according to the Dallas Fed structure
    let currentSlide = null;

    for (let i = 0; i < lesson.content.length; i++) {
      const current = lesson.content[i];
      const next = lesson.content[i + 1];

      console.log(`Processing content block ${i}:`, current);

      if (current.type === 'header') {
        if (next && next.type === 'text') {
          // Rule 1: Header followed by text - combine them
          currentSlide = {
            type: 'header-with-text',
            header: current.content,
            text: next.content,
          };
          slides.push(currentSlide);
          console.log('Created header-with-text slide:', currentSlide);
          i++; // Skip the next item since we've processed it
        } else {
          // Rule 3: Header standalone
          const headerSlide = {
            type: 'header-only',
            content: current.content,
            isHeader: true,
          };
          slides.push(headerSlide);
          console.log('Created header-only slide:', headerSlide);
        }
      } else if (current.type === 'text') {
        // Check if previous block was not a header (meaning this text wasn't combined)
        const previous = lesson.content[i - 1];
        if (!previous || previous.type !== 'header') {
          // Rule 2: Text preceded by text or standalone text
          const textSlide = {
            type: 'text-only',
            content: current.content,
            isHeader: false,
          };
          slides.push(textSlide);
          console.log('Created text-only slide:', textSlide);
        }
        // If text follows header, it was already handled in Rule 1
      }
    }

    console.log(
      'Processed Dallas Fed content blocks, created',
      slides.length,
      'slides',
    );

    // Add instructions slide at the end if lesson has conditions
    console.log('=== CHECKING FOR INSTRUCTION SLIDE (Dallas Fed) ===');
    console.log('lesson.lesson_conditions exists:', !!lesson.lesson_conditions);
    console.log(
      'lesson.lesson_conditions is array:',
      Array.isArray(lesson.lesson_conditions),
    );
    if (lesson.lesson_conditions && Array.isArray(lesson.lesson_conditions)) {
      console.log('lesson_conditions length:', lesson.lesson_conditions.length);
    }

    if (
      lesson.lesson_conditions &&
      Array.isArray(lesson.lesson_conditions) &&
      lesson.lesson_conditions.length > 0
    ) {
      console.log(
        '✅ Adding instructions slide for Dallas Fed lesson with conditions',
      );
      console.log(
        'Number of conditions found:',
        lesson.lesson_conditions.length,
      );
      slides.push({
        type: 'instructions',
        content: 'Instructions for completing this lesson',
        isHeader: false,
        isInstructions: true,
      });
      console.log('Instructions slide added. Total slides now:', slides.length);
    } else {
      console.log(
        '❌ No conditions found for Dallas Fed lesson, not adding instructions slide',
      );
    }

    return slides;
  }

  // Check if we have lesson_blocks (the original lesson content structure)
  if (lesson.lesson_blocks && Array.isArray(lesson.lesson_blocks)) {
    console.log(
      'Found lesson_blocks array with',
      lesson.lesson_blocks.length,
      'blocks',
    );

    // Process lesson blocks according to the database structure
    let currentSlide = null;

    for (let i = 0; i < lesson.lesson_blocks.length; i++) {
      const current = lesson.lesson_blocks[i];
      const next = lesson.lesson_blocks[i + 1];

      console.log(`Processing lesson block ${i}:`, current);

      if (current.type === 'header') {
        if (next && next.type === 'text') {
          // Rule 1: Header followed by text - combine them
          currentSlide = {
            type: 'header-with-text',
            header: current.content,
            text: next.content,
          };
          slides.push(currentSlide);
          console.log('Created header-with-text slide:', currentSlide);
          i++; // Skip the next item since we've processed it
        } else {
          // Rule 3: Header standalone
          const headerSlide = {
            type: 'header-only',
            content: current.content,
            isHeader: true,
          };
          slides.push(headerSlide);
          console.log('Created header-only slide:', headerSlide);
        }
      } else if (current.type === 'text') {
        // Check if previous block was not a header (meaning this text wasn't combined)
        const previous = lesson.lesson_blocks[i - 1];
        if (!previous || previous.type !== 'header') {
          // Rule 2: Text preceded by text or standalone text
          const textSlide = {
            type: 'text-only',
            content: current.content,
            isHeader: false,
          };
          slides.push(textSlide);
          console.log('Created text-only slide:', textSlide);
        }
        // If text follows header, it was already handled in Rule 1
      }
    }

    console.log('Processed lesson blocks, created', slides.length, 'slides');

    // Add instructions slide at the end if lesson has conditions
    console.log('=== CHECKING FOR INSTRUCTION SLIDE (lesson_blocks) ===');
    console.log('lesson.lesson_conditions exists:', !!lesson.lesson_conditions);
    console.log(
      'lesson.lesson_conditions is array:',
      Array.isArray(lesson.lesson_conditions),
    );
    if (lesson.lesson_conditions && Array.isArray(lesson.lesson_conditions)) {
      console.log('lesson_conditions length:', lesson.lesson_conditions.length);
    }

    if (
      lesson.lesson_conditions &&
      Array.isArray(lesson.lesson_conditions) &&
      lesson.lesson_conditions.length > 0
    ) {
      console.log(
        '✅ Adding instructions slide for lesson_blocks lesson with conditions',
      );
      console.log(
        'Number of conditions found:',
        lesson.lesson_conditions.length,
      );
      slides.push({
        type: 'instructions',
        content: 'Instructions for completing this lesson',
        isHeader: false,
        isInstructions: true,
      });
      console.log('Instructions slide added. Total slides now:', slides.length);
    } else {
      console.log(
        '❌ No conditions found for lesson_blocks lesson, not adding instructions slide',
      );
    }

    return slides;
  }

  // Fallback: Try to extract content from other possible fields
  let contentText =
    lesson.content ||
    lesson.text ||
    lesson.description ||
    lesson.lesson_content ||
    lesson.lesson_description ||
    lesson.body ||
    lesson.details ||
    lesson.material ||
    lesson.slides ||
    lesson.slide_content ||
    '';

  console.log('Extracted content text:', contentText);
  console.log('Available lesson fields:', Object.keys(lesson));

  if (!contentText) {
    // If no content found, create a default slide with the lesson title
    console.log('No content found, creating default slide');
    console.log(
      'ISSUE: The lesson object does not contain lesson_blocks data!',
    );
    console.log(
      'This means the server/database query is not returning the complete lesson object.',
    );
    console.log(
      'The lesson object should include: lesson_title, lesson_description, lesson_blocks, etc.',
    );
    console.log('Current lesson object only has:', Object.keys(lesson));

    slides.push({
      type: 'header-only',
      content: `${lesson.lesson_title || 'Lesson Content'} (Missing Content)`,
      isHeader: true,
    });

    // Add a second slide explaining the issue
    slides.push({
      type: 'text-only',
      content:
        'This lesson appears to be missing its content blocks. The server needs to return the complete lesson object including the lesson_blocks array with the actual lesson content.',
      isHeader: false,
    });

    return slides;
  }

  // Split content by common delimiters (new lines, etc.)
  const lines = contentText.split(/\n+/).filter(line => line.trim() !== '');
  console.log('Split into lines:', lines);

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

  console.log('Content blocks:', contentBlocks);

  // Process blocks according to the rules
  let currentSlide = null;

  for (let i = 0; i < contentBlocks.length; i++) {
    const current = contentBlocks[i];
    const next = contentBlocks[i + 1];
    const previous = contentBlocks[i - 1];

    console.log(`Processing block ${i}:`, current);

    if (current.isHeader) {
      if (next && !next.isHeader) {
        // Rule 1: Header followed by text - combine them
        currentSlide = {
          type: 'header-with-text',
          header: current.content,
          text: next.content,
        };
        slides.push(currentSlide);
        console.log('Created header-with-text slide:', currentSlide);
        i++; // Skip the next item since we've processed it
      } else {
        // Rule 3: Header preceded by another header or standalone header
        const headerSlide = {
          type: 'header-only',
          content: current.content,
          isHeader: true,
        };
        slides.push(headerSlide);
        console.log('Created header-only slide:', headerSlide);
      }
    } else {
      // Current is text
      if (previous && !previous.isHeader) {
        // Rule 2: Text preceded by text - show without header
        const textSlide = {
          type: 'text-only',
          content: current.content,
          isHeader: false,
        };
        slides.push(textSlide);
        console.log('Created text-only slide:', textSlide);
      }
      // If text is preceded by header, it's already handled in Rule 1
    }
  }

  // If no slides were created, create a default slide
  if (slides.length === 0) {
    console.log('No slides created, creating default text slide');
    slides.push({
      type: 'text-only',
      content: contentText,
      isHeader: false,
    });
  }

  // Add instructions slide at the end if lesson has conditions
  console.log('=== CHECKING FOR INSTRUCTION SLIDE ===');
  console.log('lesson.lesson_conditions exists:', !!lesson.lesson_conditions);
  console.log(
    'lesson.lesson_conditions is array:',
    Array.isArray(lesson.lesson_conditions),
  );
  if (lesson.lesson_conditions && Array.isArray(lesson.lesson_conditions)) {
    console.log('lesson_conditions length:', lesson.lesson_conditions.length);
  }

  if (
    lesson.lesson_conditions &&
    Array.isArray(lesson.lesson_conditions) &&
    lesson.lesson_conditions.length > 0
  ) {
    console.log('✅ Adding instructions slide for lesson with conditions');
    console.log('Number of conditions found:', lesson.lesson_conditions.length);
    slides.push({
      type: 'instructions',
      content: 'Instructions for completing this lesson',
      isHeader: false,
      isInstructions: true,
    });
    console.log('Instructions slide added. Total slides now:', slides.length);
  } else {
    console.log('❌ No conditions found, not adding instructions slide');
    if (!lesson.lesson_conditions) {
      console.log('   - lesson.lesson_conditions is null/undefined');
    } else if (!Array.isArray(lesson.lesson_conditions)) {
      console.log('   - lesson.lesson_conditions is not an array');
    } else if (lesson.lesson_conditions.length === 0) {
      console.log('   - lesson.lesson_conditions is empty array');
    }
  }

  console.log('Final slides array:', slides);
  console.log('=== INSTRUCTION SLIDE DEBUG ===');
  console.log('Lesson object being processed:', lesson);
  console.log('lesson.lesson_conditions:', lesson.lesson_conditions);
  if (lesson.lesson_conditions) {
    console.log('lesson_conditions is:', typeof lesson.lesson_conditions);
    console.log('lesson_conditions length:', lesson.lesson_conditions.length);
    console.log('lesson_conditions contents:', lesson.lesson_conditions);
  } else {
    console.log('lesson.lesson_conditions is undefined/null');
  }
  console.log('=== END DEBUG ===');
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
      padding: 24px;
      overflow-y: auto;
      overflow-x: hidden;
      max-height: calc(90vh - 200px); /* Ensure container has a max height */
      scrollbar-width: thin;
      scrollbar-color: #00ffcc #f1f1f1;
    }

    /* Custom scrollbar for Webkit browsers */
    .carousel-slide-container::-webkit-scrollbar {
      width: 8px;
    }

    .carousel-slide-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    .carousel-slide-container::-webkit-scrollbar-thumb {
      background: #00ffcc;
      border-radius: 4px;
    }

    .carousel-slide-container::-webkit-scrollbar-thumb:hover {
      background: #00b3a6;
    }

    .slide-content {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      text-align: left;
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
  `;

  document.head.appendChild(style);
  document.body.appendChild(dialog);
  dialog.showModal();
};

/**
 * Show the current slide content with enhanced rendering and conditions
 */
const showCurrentSlide = function () {
  console.log('=== SHOWING CURRENT SLIDE ===');
  const slideContent = document.getElementById('carouselSlideContent');
  const slideCounter = document.getElementById('slideCounter');
  const prevBtn = document.getElementById('prevSlideBtn');
  const nextBtn = document.getElementById('nextSlideBtn');

  console.log('slideContent element found:', !!slideContent);
  console.log('slideCounter element found:', !!slideCounter);
  console.log('Current slide index:', carouselState.currentSlideIndex);
  console.log('Total slides:', carouselState.slides.length);
  console.log('Carousel state:', carouselState);

  if (!slideContent || carouselState.slides.length === 0) {
    console.error('❌ slideContent element not found or no slides available');
    console.error('slideContent:', slideContent);
    console.error('slides:', carouselState.slides);
    return;
  }

  const currentSlide = carouselState.slides[carouselState.currentSlideIndex];
  console.log('Current slide data:', currentSlide);

  // Use enhanced slide rendering with condition support
  let contentHtml = renderSlideContent(currentSlide, carouselState.lessonData);

  console.log('Generated content HTML length:', contentHtml.length);
  console.log('Content HTML preview:', contentHtml.substring(0, 300) + '...');
  slideContent.innerHTML = contentHtml;

  // Update navigation
  if (slideCounter) {
    slideCounter.textContent = `${carouselState.currentSlideIndex + 1} / ${carouselState.slides.length}`;
  }
  if (prevBtn) {
    prevBtn.disabled = carouselState.currentSlideIndex === 0;
  }
  if (nextBtn) {
    nextBtn.disabled =
      carouselState.currentSlideIndex === carouselState.slides.length - 1;
  }

  // Track lesson progress
  trackSlideViewed();

  // Add enhanced slide styles if not already present
  addEnhancedSlideStyles();

  console.log('✅ Slide displayed successfully');
};

/**
 * Enhanced slide rendering that handles conditions and dynamic content
 * @param {Object} slide - The slide object to render
 * @param {Object} lesson - The complete lesson object for context
 * @returns {string} HTML content for the slide
 */
const renderSlideContent = function (slide, lesson) {
  console.log('Rendering slide:', slide);

  let html = '';

  switch (slide.type) {
    case 'header-with-text':
      html = `
        <div class="enhanced-slide-container">
          <div class="slide-header">
            <h2>${slide.header}</h2>
          </div>
          <div class="slide-content">
            <p>${slide.text}</p>
          </div>
        </div>
      `;
      break;

    case 'header-only':
      html = `
        <div class="enhanced-slide-container">
          <div class="slide-header-only">
            <h1>${slide.content}</h1>
          </div>
        </div>
      `;
      break;

    case 'text-only':
      html = `
        <div class="enhanced-slide-container">
          <div class="slide-text-only">
            <p>${slide.content}</p>
          </div>
        </div>
      `;
      break;

    case 'instructions':
      console.log('=== RENDERING INSTRUCTIONS SLIDE ===');
      console.log('Lesson data for instructions:', lesson);
      // Generate comprehensive instructions for this lesson
      const instructionsHtml = generateLessonInstructions(lesson);
      console.log(
        'Generated instructions HTML length:',
        instructionsHtml.length,
      );
      console.log(
        'Instructions HTML preview:',
        instructionsHtml.substring(0, 200) + '...',
      );
      html =
        instructionsHtml ||
        `
        <div class="enhanced-slide-container">
          <div class="slide-text-only">
            <p>No specific instructions available for this lesson.</p>
          </div>
        </div>
      `;
      console.log('Final instructions HTML length:', html.length);
      break;

    default:
      html = `
        <div class="enhanced-slide-container">
          <div class="slide-fallback">
            <p>Unknown slide type: ${slide.type}</p>
            <p>Content: ${slide.content || 'No content available'}</p>
          </div>
        </div>
      `;
  }

  // Check for lesson conditions that might add dynamic content
  if (lesson.lesson_conditions && Array.isArray(lesson.lesson_conditions)) {
    const dynamicContent = evaluateLessonConditions(
      lesson.lesson_conditions,
      slide,
    );
    if (dynamicContent) {
      html += `
        <div class="dynamic-content">
          ${dynamicContent}
        </div>
      `;
    }
  }

  return html;
};

/**
 * Generate clear, actionable instructions for students based on lesson conditions
 * Maps Dallas Fed conditions to specific Trinity Capital app features
 * @param {Object} lesson - The lesson object containing conditions
 * @returns {string} HTML with step-by-step instructions
 */
const generateLessonInstructions = function (lesson) {
  console.log('=== GENERATING LESSON INSTRUCTIONS ===');
  console.log('Lesson object passed to generateLessonInstructions:', lesson);
  console.log('lesson.lesson_conditions:', lesson.lesson_conditions);

  if (!lesson.lesson_conditions || !Array.isArray(lesson.lesson_conditions)) {
    console.log('❌ No valid lesson_conditions found for instructions');
    return '';
  }

  console.log('✅ Found lesson_conditions, generating instructions...');
  const conditionTypes = lesson.lesson_conditions.map(
    cond => cond.condition_type,
  );
  console.log('Condition types found:', conditionTypes);
  const instructions = [];

  // Map condition types to specific app instructions
  const instructionMap = {
    // Money & Spending Analysis
    spending_analyzed: {
      title: '📊 Analyze Your Spending',
      steps: [
        '1. Go to Bills & Payments and create 3 different expense categories:',
        '   • Set up "Housing" bill (rent/mortgage) - example: $800/month',
        '   • Set up "Food" bill (groceries) - example: $300/month',
        '   • Set up "Custom-Expense" bill (entertainment/dining out) - example: $200/month',
        '2. Click "Save" on each bill to record these spending categories',
        '3. Go to Messages and write to your teacher: "I set up 3 spending categories: housing, food, and custom-expense"',
      ],
      appFeatures: ['Bills & Payments', 'Messages'],
    },

    smart_goal_validated: {
      title: '🎯 Create SMART Financial Goals',
      steps: [
        '1. Use Bills & Payments to set up a savings goal:',
        '   • Create bill named "Emergency Fund Savings" for $100/month',
        '   • Create bill named "Vacation Savings" for $50/month',
        '2. Use Transfer Money to move money from checking to savings account',
        '3. Set transfer amount to match your savings goals ($150 total)',
        '4. Go to Messages and write to your teacher your SMART goal: "Save $1800 in 12 months for emergency fund by transferring $150 monthly"',
      ],
      appFeatures: ['Bills & Payments', 'Transfer Money', 'Messages'],
    },

    balance_sheet_created: {
      title: '💰 Create Your Personal Balance Sheet',
      steps: [
        '1. Check your current account balance (this is your main asset)',
        '2. Use Bills & Payments to create liability entries:',
        '   • Set up "Credit Card Payment" bill for $150/month',
        '   • Set up "Student Loan Payment" bill for $200/month',
        '3. Use Transfer Money to move $500 from checking to savings (creates 2 assets)',
        '4. Go to Messages and write to your teacher: "Assets: $X checking + $500 savings = $Y total. Liabilities: $350/month. Net worth: $Y - annual liabilities"',
      ],
      appFeatures: [
        'Account Dashboard',
        'Bills & Payments',
        'Transfer Money',
        'Messages',
      ],
    },

    assets_liabilities_identified: {
      title: '🏦 Identify Assets vs Liabilities',
      steps: [
        '1. Click on your account balance to see your primary asset',
        '2. Use Transfer Money to create a second asset (savings account)',
        '3. In Bills & Payments, create 2 liabilities:',
        '   • "Monthly Rent" bill for $600',
        '   • "Car Payment" bill for $250',
        '4. Go to Messages and write to your teacher: "Assets: checking account, savings account. Liabilities: rent payment, car payment"',
      ],
      appFeatures: [
        'Account Dashboard',
        'Transfer Money',
        'Bills & Payments',
        'Messages',
      ],
    },

    transactions_reconciled: {
      title: '✅ Reconcile Your Bank Statements',
      steps: [
        '1. Use Transfer Money to move $100 from checking to savings',
        '2. Use Deposits to add $500 (simulating a paycheck)',
        '3. Go to Messages and write to your teacher: "I made 2 transactions: $100 transfer, $500 deposit. My balance changed by +$400"',
        '4. Calculate if your current balance matches: starting balance + $400',
      ],
      appFeatures: ['Transfer Money', 'Deposits', 'Messages'],
    },

    paycheck_analyzed: {
      title: '💵 Analyze Paycheck Components',
      steps: [
        '1. Use Deposits to create a "Gross Pay" deposit for $1000',
        '2. Use Bills & Payments to set up deductions:',
        '   • "Federal Tax Withholding" bill for $150',
        '   • "Social Security Tax" bill for $62',
        '   • "Health Insurance" bill for $75',
        '3. Calculate net pay: $1000 - $287 = $713',
        '4. Go to Messages and write to your teacher: "Gross pay $1000, deductions $287, net pay $713"',
      ],
      appFeatures: ['Deposits', 'Bills & Payments', 'Messages'],
    },

    budget_balanced: {
      title: '📋 Create a Balanced Budget',
      steps: [
        '1. Use Deposits to add income: $2000 monthly salary',
        '2. Use Bills & Payments to create the 50/30/20 budget:',
        '   • "Rent + Groceries" (needs): $1000 (50%)',
        '   • "Custom-Expense + Dining" (wants): $600 (30%)',
        '   • "Savings Transfer" (savings): $400 (20%)',
        '3. Use Transfer Money to move the $400 to savings account',
        '4. Go to Messages and write to your teacher: "Budget: $2000 income = $1000 needs + $600 wants + $400 savings"',
      ],
      appFeatures: [
        'Deposits',
        'Bills & Payments',
        'Transfer Money',
        'Messages',
      ],
    },

    income_tracked: {
      title: '💰 Track All Income Sources',
      steps: [
        '1. Use Deposits to record different income sources:',
        '   • "Job Salary" deposit: $1500',
        '   • "Side Gig" deposit: $300',
        '   • "Gift Money" deposit: $100',
        '2. Check your account balance to see total income: $1900',
        '3. Go to Messages and write to your teacher: "Total monthly income: $1900 from 3 sources: job ($1500), side gig ($300), gifts ($100)"',
      ],
      appFeatures: ['Deposits', 'Account Dashboard', 'Messages'],
    },

    expenses_categorized: {
      title: '🏷️ Categorize Your Expenses',
      steps: [
        '1. Use Bills & Payments to create specific expense categories:',
        '   • NEEDS: "Rent" ($800), "Groceries" ($400), "Utilities" ($200)',
        '   • WANTS: "Movies" ($100), "Restaurants" ($200), "Shopping" ($150)',
        '   • SAVINGS: Create "Emergency Fund" ($300)',
        '2. Click "Save" on each bill to record these 7 categories',
        '3. Use Transfer Money to move the $300 to savings account',
        '4. Go to Messages and write to your teacher listing all 7 categories you created',
      ],
      appFeatures: ['Bills & Payments', 'Transfer Money', 'Messages'],
    },

    cost_comparison_completed: {
      title: '🔍 Complete Cost Comparison Analysis',
      steps: [
        '1. Use Bills & Payments to model "Option A - Renting":',
        '   • "Monthly Rent" bill: $1200',
        '   • "Renters Insurance" bill: $25',
        '2. Use Bills & Payments to model "Option B - Buying":',
        '   • "Mortgage Payment" bill: $1500',
        '   • "Property Tax" bill: $300',
        '   • "Homeowners Insurance" bill: $100',
        '3. Calculate total costs: Rent = $1225/month, Buy = $1900/month',
        '4. Go to Messages and write to your teacher: "Cost comparison: Renting $1225/month vs Buying $1900/month. Difference: $675/month"',
      ],
      appFeatures: ['Bills & Payments', 'Messages'],
    },

    payment_methods_compared: {
      title: '💳 Compare Payment Methods',
      steps: [
        '1. Use Bills & Payments to model cash payments:',
        '   • "Cash Purchase" bill: $50 (no extra fees)',
        '2. Use Bills & Payments to model debit card fees:',
        '   • "Debit Card Purchase" bill: $50 (no extra fees)',
        '3. Use Bills & Payments to model credit card costs:',
        '   • "Credit Card Purchase" bill: $50',
        '   • "Credit Card Interest" bill: $8.25 (if not paid immediately)',
        '4. Go to Messages and write to your teacher: "Cash: $50 total, Debit: $50 total, Credit: $58.25 if carrying balance"',
      ],
      appFeatures: ['Bills & Payments', 'Messages'],
    },
  };

  // Generate instructions for conditions present in this lesson
  conditionTypes.forEach(conditionType => {
    if (instructionMap[conditionType]) {
      instructions.push(instructionMap[conditionType]);
    }
  });

  if (instructions.length === 0) {
    return '';
  }

  // Generate HTML for instructions
  let html = `
    <div class="lesson-instructions-container">
      <div class="instructions-header">
        <h3>🎯 How to Complete This Lesson</h3>
        <p class="instructions-subtitle">Use Trinity Capital's banking features to practice these skills:</p>
      </div>
  `;

  instructions.forEach((instruction, index) => {
    html += `
      <div class="instruction-block">
        <div class="instruction-title">
          <h4>${instruction.title}</h4>
        </div>
        <div class="instruction-steps">
          ${instruction.steps.map(step => `<p class="step">${step}</p>`).join('')}
        </div>
        <div class="app-features">
          <strong>💻 App Features to Use:</strong>
          <div class="feature-tags">
            ${instruction.appFeatures
              .map(feature => `<span class="feature-tag">${feature}</span>`)
              .join('')}
          </div>
        </div>
      </div>
    `;
  });

  html += `
      <div class="instructions-footer">
        <div class="auto-completion-info">
          <h4>🚀 Automatic Completion</h4>
          <p>• This lesson will <strong>automatically complete</strong> when you finish the activities above!</p>
          <p>• No need to click a "Complete" button - just use the app features as instructed</p>
          <p>• Your grade will reflect your actual engagement with the banking activities</p>
        </div>
        <div class="completion-reminder">
          <h4>📝 Getting Your Grade:</h4>
          <p>• <strong>Reading content only = D+ level (65%)</strong></p>
          <p>• <strong>Using app features = Higher grades!</strong></p>
          <p>• Complete the activities above to earn A-level grades (90%+)</p>
        </div>
        <div class="help-section">
          <h4>🆘 Need Help?</h4>
          <p>• Use the <strong>Messages</strong> feature to send your answers to your teacher</p>
          <p>• Try each feature - you can't break anything!</p>
          <p>• Look for the feature buttons in the main Trinity Capital interface</p>
        </div>
      </div>
    </div>
  `;

  return html;
};

/**
 * Evaluate lesson conditions and return dynamic content if conditions are met
 * @param {Array} conditions - Array of lesson conditions
 * @param {Object} currentSlide - Current slide being rendered
 * @returns {string} Dynamic HTML content or empty string
 */
const evaluateLessonConditions = function (conditions, currentSlide) {
  console.log('Evaluating lesson conditions:', conditions);

  let dynamicContent = '';

  for (const condition of conditions) {
    if (!condition.condition_type || !condition.action) {
      continue;
    }

    // Check different condition types
    switch (condition.condition_type) {
      case 'bank_balance_above':
        // Check student's current bank balance
        const balance = getCurrentBankBalance();
        if (balance && balance > condition.value) {
          dynamicContent += processConditionAction(condition.action);
        }
        break;

      case 'elapsed_time':
        // Check if enough time has elapsed in the lesson
        const elapsedTime = getLessonElapsedTime();
        if (elapsedTime && elapsedTime > condition.value) {
          dynamicContent += processConditionAction(condition.action);
        }
        break;

      case 'slide_number':
        // Check if we're on a specific slide
        if (carouselState.currentSlideIndex + 1 >= condition.value) {
          dynamicContent += processConditionAction(condition.action);
        }
        break;

      default:
        console.log('Unknown condition type:', condition.condition_type);
    }
  }

  return dynamicContent;
};

/**
 * Process a condition action and return the appropriate content
 * @param {Object} action - The action object from the condition
 * @returns {string} HTML content for the action
 */
const processConditionAction = function (action) {
  switch (action.type) {
    case 'add_text_block':
      if (action.block && action.block.content) {
        return `
          <div class="condition-text-block">
            <div class="dynamic-highlight">
              <span class="highlight-icon">💡</span>
              <p><strong>${action.block.content}</strong></p>
            </div>
          </div>
        `;
      }
      break;

    case 'send_message':
      if (action.content) {
        return `
          <div class="condition-message">
            <div class="message-popup">
              <span class="message-icon">📢</span>
              <span class="message-text">${action.content}</span>
            </div>
          </div>
        `;
      }
      break;

    case 'highlight_element':
      return `
        <div class="condition-highlight">
          <div class="highlight-banner">
            <span class="highlight-icon">✨</span>
            <em>Key point highlighted based on your progress!</em>
          </div>
        </div>
      `;

    default:
      console.log('Unknown action type:', action.type);
  }

  return '';
};

/**
 * Get current bank balance from student profile
 * In a real implementation, this would fetch from the student's actual account
 */
const getCurrentBankBalance = function () {
  // Try to get from global student profile if available
  if (window.currentProfile && window.currentProfile.checkingAccount) {
    return window.currentProfile.checkingAccount.balanceTotal || 0;
  }

  // Fallback to mock data for development
  return Math.floor(Math.random() * 2000) + 500; // Random balance between 500-2500
};

/**
 * Get elapsed time in the current lesson (in seconds)
 */
const getLessonElapsedTime = function () {
  if (lessonTracker.startTime) {
    return Math.floor((Date.now() - lessonTracker.startTime) / 1000);
  }
  return 0;
};

/**
 * Track that a slide has been viewed for lesson progress
 */
const trackSlideViewed = function () {
  // Initialize lesson tracking if not already done
  if (!lessonTracker.currentLesson && carouselState.lessonData) {
    lessonTracker.initializeLesson(
      `lesson_${carouselState.currentLessonIndex}`,
      carouselState.lessonData.lesson_title || 'Unknown Lesson',
      extractRequiredConditions(carouselState.lessonData),
    );
  }

  // Record slide view progress
  const totalSlides = carouselState.slides.length;
  const viewedSlides = carouselState.currentSlideIndex + 1;
  const progressPercentage = Math.round((viewedSlides / totalSlides) * 100);

  // Record individual slide viewing for detailed tracking
  if (window.recordLessonAction) {
    window.recordLessonAction('slide_viewed', {
      slideIndex: carouselState.currentSlideIndex,
      slidesViewed: viewedSlides,
      totalSlides: totalSlides,
      progressPercentage: progressPercentage,
    });
  }

  // Check if this is the last content slide (excluding instruction slides)
  const contentSlides = carouselState.slides.filter(
    slide => !slide.isInstructions,
  );
  const currentSlideIsLastContent =
    carouselState.currentSlideIndex === contentSlides.length - 1;
  const hasInstructionSlide = carouselState.slides.some(
    slide => slide.isInstructions,
  );

  // If this is the last content slide, mark content as completed and save progress
  if (currentSlideIsLastContent && hasInstructionSlide) {
    console.log('Student completed all content slides! Saving progress...');
    saveLessonContentProgress(
      carouselState.currentLessonIndex,
      carouselState.lessonData,
    );

    // Show a notification that content is complete
    showContentCompletionNotification();
  }

  // If this is the last slide or student has viewed most content, record full content viewing
  if (
    viewedSlides >= Math.ceil(totalSlides * 0.8) ||
    viewedSlides === totalSlides
  ) {
    console.log(
      'Student has viewed significant lesson content, recording lesson_content_viewed...',
    );
    if (window.recordLessonAction) {
      window.recordLessonAction('lesson_content_viewed', {
        slidesViewed: viewedSlides,
        totalSlides: totalSlides,
        completionMethod: 'viewing',
        viewingQuality: calculateViewingQuality(),
        timeSpent: getLessonElapsedTime(),
        progressPercentage: progressPercentage,
      });
    }
  }
};

/**
 * Save lesson content completion progress to localStorage
 */
const saveLessonContentProgress = function (lessonIndex, lessonData) {
  try {
    const progressKey = `lesson_${lessonIndex}_content_complete`;
    const progressData = {
      completed: true,
      timestamp: new Date().toISOString(),
      lessonTitle: lessonData.lesson_title || 'Unknown Lesson',
      lessonIndex: lessonIndex,
    };

    localStorage.setItem(progressKey, JSON.stringify(progressData));
    console.log(`Saved completion progress for lesson ${lessonIndex}`);
  } catch (error) {
    console.error('Error saving lesson progress:', error);
  }
};

/**
 * Check if lesson content has been completed
 */
const isLessonContentCompleted = function (lessonIndex) {
  try {
    const progressKey = `lesson_${lessonIndex}_content_complete`;
    const progressData = localStorage.getItem(progressKey);
    return progressData ? JSON.parse(progressData).completed : false;
  } catch (error) {
    console.error('Error checking lesson progress:', error);
    return false;
  }
};

/****************Notification Stacking System****************/

/**
 * Global notification manager to handle stacking notifications
 */
const notificationManager = {
  activeNotifications: [],
  baseTopPosition: 20, // Starting position from top
  verticalSpacing: 80, // Space between notifications

  /**
   * Add a notification to the stack and calculate its position
   * @param {HTMLElement} notification - The notification element
   * @returns {number} The top position for this notification
   */
  addNotification: function (notification) {
    this.activeNotifications.push(notification);
    const position = this.calculatePosition(
      this.activeNotifications.length - 1,
    );

    // Add data attribute for tracking
    notification.setAttribute(
      'data-notification-index',
      this.activeNotifications.length - 1,
    );

    return position;
  },

  /**
   * Remove a notification from the stack and reposition remaining ones
   * @param {HTMLElement} notification - The notification element to remove
   */
  removeNotification: function (notification) {
    const index = this.activeNotifications.indexOf(notification);
    if (index > -1) {
      this.activeNotifications.splice(index, 1);
      // Reposition remaining notifications
      this.repositionNotifications();
    }
  },

  /**
   * Calculate the top position for a notification at given index
   * @param {number} index - Index in the stack
   * @returns {number} Top position in pixels
   */
  calculatePosition: function (index) {
    return this.baseTopPosition + index * this.verticalSpacing;
  },

  /**
   * Reposition all active notifications after a removal
   */
  repositionNotifications: function () {
    this.activeNotifications.forEach((notification, index) => {
      const newTop = this.calculatePosition(index);
      notification.style.top = `${newTop}px`;
      notification.setAttribute('data-notification-index', index);
    });
  },

  /**
   * Create a notification with automatic stacking
   * @param {Object} config - Notification configuration
   * @returns {HTMLElement} The created notification element
   */
  createStackedNotification: function (config) {
    const notification = document.createElement('div');
    notification.className = config.className || 'stacked-notification';
    notification.innerHTML = config.content || '';

    // Calculate position
    const topPosition = this.addNotification(notification);

    // Apply base styles with calculated position
    const baseStyles = `
      position: fixed;
      top: ${topPosition}px;
      right: 20px;
      z-index: 9999;
      max-width: 300px;
      animation: slideInFromRight 0.5s ease-out;
      transition: top 0.3s ease-out;
    `;

    // Merge with custom styles
    notification.style.cssText = baseStyles + (config.customStyles || '');

    // Auto-remove functionality
    if (config.autoRemove !== false) {
      const duration = config.duration || 4000;
      const removeDelay = config.removeDelay || 500;

      setTimeout(() => {
        notification.style.animation = 'slideOutToRight 0.5s ease-in';
        setTimeout(() => {
          if (notification.parentNode) {
            this.removeNotification(notification);
            notification.parentNode.removeChild(notification);
          }
        }, removeDelay);
      }, duration);
    }

    return notification;
  },
};

/**
 * Show notification when content is completed
 */
const showContentCompletionNotification = function () {
  const notification = notificationManager.createStackedNotification({
    className: 'content-completion-notification',
    content: '✓ Content completed! Click lesson again to view instructions.',
    customStyles: `
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `,
    duration: 4000,
  });

  document.body.appendChild(notification);
};

/**
 * Add enhanced styles for the new slide rendering system
 */
const addEnhancedSlideStyles = function () {
  if (document.getElementById('enhancedSlideStyles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'enhancedSlideStyles';
  style.textContent = `
    .enhanced-slide-container {
      padding: 1rem;
      min-height: auto;
      max-height: none;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow-y: visible;
    }

    .slide-header h2 {
      color: #00ffcc;
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      text-align: center;
      border-bottom: 2px solid #00ffcc;
      padding-bottom: 0.5rem;
    }

    .slide-header-only h1 {
      color: #00ffcc;
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      margin: 0;
      line-height: 1.2;
    }

    .slide-content p, .slide-text-only p {
      font-size: 1.2rem;
      line-height: 1.6;
      color: #333;
      text-align: left;
      margin: 1rem 0;
    }

    .dynamic-content {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .condition-text-block .dynamic-highlight {
      background: linear-gradient(135deg, #fff3cd, #ffeaa7);
      border: 1px solid #ffd93d;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 2px 4px rgba(255, 217, 61, 0.2);
    }

    .condition-message .message-popup {
      background: linear-gradient(135deg, #d1ecf1, #bee5eb);
      border: 1px solid #17a2b8;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      animation: slideInFromRight 0.5s ease-out;
    }

    .condition-highlight .highlight-banner {
      background: linear-gradient(135deg, #f8d7da, #f1b0b7);
      border: 1px solid #dc3545;
      border-radius: 8px;
      padding: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: center;
    }

    .highlight-icon, .message-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .slide-fallback {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      color: #6c757d;
    }

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

    /* Lesson Instructions Styling */
    .lesson-instructions-container {
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      border: 2px solid #00ffcc;
      border-radius: 12px;
      margin: 0;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 255, 204, 0.1);
      max-width: 100%;
      overflow-y: visible;
      height: auto;
    }

    .instructions-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .instructions-header h3 {
      color: #00ffcc;
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .instructions-subtitle {
      color: #666;
      font-size: 1.1rem;
      margin: 0;
    }

    .instruction-block {
      background: white;
      border-radius: 8px;
      margin: 1.5rem 0;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #00ffcc;
    }

    .instruction-title h4 {
      color: #333;
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .instruction-steps .step {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 0.8rem 1rem;
      margin: 0.5rem 0;
      border-left: 3px solid #28a745;
      font-size: 1rem;
      line-height: 1.5;
    }

    .app-features {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e9ecef;
    }

    .app-features strong {
      color: #333;
      font-size: 1rem;
    }

    .feature-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .feature-tag {
      background: linear-gradient(135deg, #00ffcc, #00e5b8);
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0, 255, 204, 0.3);
    }

    .instructions-footer {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 1.5rem;
      margin-top: 2rem;
    }

    .auto-completion-info {
      background: linear-gradient(135deg, #d4edda, #c3e6cb);
      border: 1px solid #28a745;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .auto-completion-info h4 {
      color: #155724;
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0 0 0.8rem 0;
    }

    .auto-completion-info p {
      margin: 0.5rem 0;
      color: #155724;
      font-size: 1rem;
    }

    .auto-completion-info strong {
      color: #0a4c1a;
      font-weight: 600;
    }

    .completion-reminder h4, .help-section h4 {
      color: #856404;
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0 0 0.8rem 0;
    }

    .completion-reminder p, .help-section p {
      margin: 0.5rem 0;
      color: #856404;
      font-size: 1rem;
    }

    .completion-reminder strong, .help-section strong {
      color: #495057;
    }

    .help-section {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #ffeaa7;
    }

    @media (max-width: 768px) {
      .lesson-instructions-container {
        margin: 1rem 0;
        padding: 1rem;
      }
      
      .instruction-block {
        padding: 1rem;
      }
      
      .feature-tags {
        flex-direction: column;
      }
      
      .feature-tag {
        text-align: center;
      }
    }
  `;

  document.head.appendChild(style);
};

/**
 * Navigate to previous slide
 */
window.previousSlide = function () {
  console.log('previousSlide called');
  console.log('Current index:', carouselState.currentSlideIndex);

  if (carouselState.currentSlideIndex > 0) {
    carouselState.currentSlideIndex--;
    console.log('Moving to slide index:', carouselState.currentSlideIndex);
    showCurrentSlide();
  } else {
    console.log('Already at first slide');
  }
};

/**
 * Navigate to next slide
 */
window.nextSlide = function () {
  console.log('nextSlide called');
  console.log('Current index:', carouselState.currentSlideIndex);
  console.log('Max index:', carouselState.slides.length - 1);

  if (carouselState.currentSlideIndex < carouselState.slides.length - 1) {
    carouselState.currentSlideIndex++;
    console.log('Moving to slide index:', carouselState.currentSlideIndex);
    showCurrentSlide();
  } else {
    console.log('Already at last slide');
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

// Make lesson tracking functions available globally for other scripts
window.recordLessonAction = recordLessonAction;
window.recordLessonMistake = recordLessonMistake;

/**
 * Debug function to check lesson tracking status
 * Call this in browser console: window.debugLessonTracking()
 */
window.debugLessonTracking = function () {
  console.log('=== LESSON TRACKING DEBUG ===');
  console.log('Current lesson:', lessonTracker.currentLesson);
  if (lessonTracker.currentLesson) {
    console.log('Lesson title:', lessonTracker.currentLesson.title);
    console.log('Lesson status:', lessonTracker.currentLesson.status);
    console.log(
      'Positive conditions met:',
      lessonTracker.positiveConditionsMet,
    );
    console.log(
      'Negative conditions triggered:',
      lessonTracker.negativeConditionsTriggered,
    );

    // Count spending analyzed actions specifically
    const spendingActions = lessonTracker.positiveConditionsMet.filter(
      record => record.type === 'spending_analyzed',
    );
    console.log(
      'Spending analyzed actions:',
      spendingActions.length,
      spendingActions,
    );

    // Count other important actions
    const actionCounts = {};
    lessonTracker.positiveConditionsMet.forEach(record => {
      actionCounts[record.type] = (actionCounts[record.type] || 0) + 1;
    });
    console.log('Action counts by type:', actionCounts);

    console.log('Required conditions:', lessonTracker.requiredConditions);
    console.log('Current scores:', {
      contentScore: lessonTracker.contentScore,
      appUsageScore: lessonTracker.appUsageScore,
      combinedScore: lessonTracker.calculateCombinedScore(),
    });

    const progress = lessonTracker.getLessonProgress();
    console.log('Current progress:', progress);
  } else {
    console.log('No active lesson found');
  }
  console.log('=== END DEBUG ===');
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
  const notificationContent = `
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

  const notification = notificationManager.createStackedNotification({
    className: 'lesson-start-notification',
    content: notificationContent,
    customStyles: `
      background: linear-gradient(135deg, #00ffcc, #00b3a6);
      color: white;
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `,
    duration: 4000,
  });

  // Add notification styles if not already present
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
};

/**
 * Show lesson progress update
 * @param {Object} progress - Current lesson progress
 */
const showLessonProgressUpdate = function (progress) {
  // Only show progress updates occasionally to avoid spam
  if (progress.conditionsMet % 2 !== 0 && progress.conditionsMet > 1) return;

  const notificationContent = `
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

  const notification = notificationManager.createStackedNotification({
    className: 'lesson-progress-notification',
    content: notificationContent,
    customStyles: `
      background: white;
      border: 2px solid #00b3a6;
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 280px;
    `,
    duration: 3000,
  });

  // Add progress-specific styles if not present
  if (!document.getElementById('progressNotificationStyles')) {
    const style = document.createElement('style');
    style.id = 'progressNotificationStyles';
    style.textContent = `
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
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);
};

/**
 * Extract required conditions from lesson data for condition-aware completion
 * @param {Object} lessonData - The lesson object containing conditions
 * @returns {Array} Array of required condition types
 */
const extractRequiredConditions = function (lessonData) {
  if (!lessonData) return [];

  // Check multiple possible locations for conditions based on lesson structure
  const conditions =
    lessonData.lesson_conditions ||
    lessonData.conditions ||
    lessonData.lesson?.lesson_conditions ||
    lessonData.lesson?.conditions ||
    [];

  // Extract condition types that are required for completion
  return conditions
    .filter(condition => condition.required !== false) // Include unless explicitly marked as not required
    .map(condition => condition.condition_type || condition.type)
    .filter(type => type); // Remove any undefined values
};

/**
 * Calculate viewing quality based on time spent and engagement
 * @returns {number} Quality score between 0.5 and 1.0
 */
const calculateViewingQuality = function () {
  const timeSpent = getLessonElapsedTime();
  const slidesViewed = carouselState.currentSlideIndex + 1;
  const totalSlides = carouselState.slides.length;

  // Base quality from slide completion
  const completionRatio = slidesViewed / totalSlides;

  // Time quality (reasonable pace, not too fast or too slow)
  const averageTimePerSlide = timeSpent / slidesViewed;
  let timeQuality = 1.0;

  if (averageTimePerSlide < 10) {
    // Less than 10 seconds per slide = rushing
    timeQuality = 0.7;
  } else if (averageTimePerSlide > 180) {
    // More than 3 minutes per slide = distracted
    timeQuality = 0.8;
  }

  // Combined quality score
  const qualityScore = completionRatio * 0.7 + timeQuality * 0.3;
  return Math.max(0.5, Math.min(1.0, qualityScore)); // Clamp between 0.5 and 1.0
};

/**
 * Analyze lesson completion requirements based on lesson data and conditions
 * @param {Object} lessonData - The lesson object to analyze
 * @returns {Object} Analysis of completion requirements and suggested scoring
 */
const analyzeCompletionRequirements = function (lessonData) {
  console.log(
    'Analyzing completion requirements for lesson:',
    lessonData.lesson_title,
  );

  // Extract lesson conditions
  const conditions =
    lessonData.lesson_conditions ||
    lessonData.conditions ||
    lessonData.lesson?.lesson_conditions ||
    lessonData.lesson?.conditions ||
    [];

  const hasConditions = conditions.length > 0;
  const conditionTypes = conditions
    .map(c => c.condition_type || c.type)
    .filter(Boolean);

  console.log('Found conditions:', conditionTypes);

  // Analyze condition types to determine lesson complexity and requirements
  const dallasFedConditions = [
    'spending_analyzed',
    'smart_goal_validated',
    'balance_sheet_created',
    'assets_liabilities_identified',
    'transactions_reconciled',
    'paycheck_analyzed',
    'deductions_calculated',
    'net_pay_computed',
    'income_tracked',
    'expenses_categorized',
    'budget_balanced',
    'cost_comparison_completed',
    'housing_calculator_used',
    'vehicle_calculator_used',
    'payment_methods_compared',
    'unit_price_calculated',
    'savings_found',
  ];

  const basicConditions = [
    'lesson_content_viewed',
    'account_checked',
    'deposit_made',
    'transfer_completed',
    'bill_paid',
    'investment_made',
    'budget_created',
    'goal_set',
  ];

  // Categorize conditions
  const hasDallasFedConditions = conditionTypes.some(type =>
    dallasFedConditions.includes(type),
  );
  const hasBasicConditions = conditionTypes.some(type =>
    basicConditions.includes(type),
  );
  const appRequiredConditions = conditionTypes.filter(
    type => !['lesson_content_viewed'].includes(type),
  );

  // Determine completion strategy
  let analysis = {
    hasConditions: hasConditions,
    conditionTypes: conditionTypes,
    hasDallasFedConditions: hasDallasFedConditions,
    hasBasicConditions: hasBasicConditions,
    appRequired: appRequiredConditions.length > 0,
    baseScore: 45, // Reduced from 85 - requires app usage for good grades
    message: `Great job completing "${lessonData.lesson_title}"!`,
    completionStrategy: 'standard',
  };

  // Content-only lessons (no app interaction required)
  if (!hasConditions || !appRequiredConditions.length) {
    analysis.baseScore = 65; // Reduced from 100 - content viewing alone = D+ level
    analysis.message = `You completed "${lessonData.lesson_title}" by viewing content. For higher grades, complete lessons with app activities!`;
    analysis.completionStrategy = 'content_only';
    console.log(
      'Content-only lesson detected - awarding minimal passing score',
    );
  }
  // Dallas Fed lessons with practical requirements
  else if (hasDallasFedConditions) {
    analysis.baseScore = 35; // Reduced from 75 - very low base, app usage essential
    analysis.message = `You've completed the content for "${lessonData.lesson_title}". Use the app features to earn your full grade!`;
    analysis.completionStrategy = 'dallas_fed_practical';
    console.log('Dallas Fed lesson with practical requirements detected');
  }
  // Standard Trinity Capital lessons
  else if (hasBasicConditions) {
    analysis.baseScore = 40; // Reduced from 80 - app usage needed for passing
    analysis.message = `Good progress on "${lessonData.lesson_title}"! Complete the activities to earn your full grade.`;
    analysis.completionStrategy = 'trinity_standard';
    console.log('Standard Trinity Capital lesson detected');
  }

  return analysis;
};

/**
 * Track lesson completion events for analytics and teacher dashboard
 * @param {string} eventType - Type of completion event
 * @param {Object} eventData - Data about the completion event
 */
const trackLessonCompletionEvent = function (eventType, eventData) {
  // Send to analytics if available
  if (typeof window.recordLessonAction === 'function') {
    window.recordLessonAction(eventType, eventData);
  }

  // Log for debugging
  console.log('Lesson completion event tracked:', {
    event: eventType,
    data: eventData,
    timestamp: new Date().toISOString(),
  });

  // Store in local storage for offline analytics
  try {
    const analyticsEvents = JSON.parse(
      localStorage.getItem('lessonAnalytics') || '[]',
    );
    analyticsEvents.push({
      event: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
      studentName: localStorage.getItem('currentProfile') || 'unknown',
    });

    // Keep only last 100 events to avoid storage bloat
    if (analyticsEvents.length > 100) {
      analyticsEvents.splice(0, analyticsEvents.length - 100);
    }

    localStorage.setItem('lessonAnalytics', JSON.stringify(analyticsEvents));
  } catch (error) {
    console.warn('Failed to store analytics event:', error);
  }
};

/****************Enhanced Condition Tracking Functions****************/

/**
 * Enhanced condition tracking system for Dallas Fed alignment
 * Provides detailed tracking and validation for all condition types
 */
const enhancedConditionTracker = {
  // Dallas Fed condition definitions with validation criteria
  conditionDefinitions: {
    // Money Personality & Spending Analysis
    spending_analyzed: {
      category: 'financial_analysis',
      baseScore: 12,
      description:
        'Student analyzes spending patterns and categorizes expenses',
      validation: details => {
        return (
          (details.categories_identified || 0) >= 3 &&
          details.needs_vs_wants_identified === true
        );
      },
      feedback: {
        success: 'Great job analyzing your spending patterns!',
        improvement:
          'Try to identify more spending categories to better understand your habits.',
      },
    },

    // SMART Goal Setting
    smart_goal_validated: {
      category: 'goal_planning',
      baseScore: 15,
      description: 'Student creates and validates SMART financial goals',
      validation: details => {
        return (
          details.all_criteria_met === true && (details.smart_score || 0) >= 0.8
        );
      },
      feedback: {
        success: 'Outstanding! Your goal meets all SMART criteria!',
        improvement: 'Review the SMART criteria and refine your goal.',
      },
    },

    // Balance Sheet & Asset Management
    balance_sheet_created: {
      category: 'financial_planning',
      baseScore: 18,
      description:
        'Student creates a personal balance sheet identifying assets and liabilities',
      validation: details => {
        return (
          (details.assets_count || 0) >= 2 &&
          details.net_worth_calculated === true
        );
      },
      feedback: {
        success: 'Excellent work on your balance sheet!',
        improvement:
          'Make sure to identify both assets and liabilities clearly.',
      },
    },

    assets_liabilities_identified: {
      category: 'financial_analysis',
      baseScore: 10,
      description:
        'Student correctly identifies and categorizes assets and liabilities',
      validation: details => {
        return (
          (details.assets_identified || 0) >= 1 &&
          (details.liabilities_identified || 0) >= 1
        );
      },
      feedback: {
        success: 'Perfect understanding of assets vs liabilities!',
        improvement: 'Review the difference between assets and liabilities.',
      },
    },

    // Banking & Reconciliation
    transactions_reconciled: {
      category: 'banking_skills',
      baseScore: 16,
      description: 'Student reconciles bank statements with personal records',
      validation: details => {
        return (
          (details.accuracy_rate || 0) >= 0.9 &&
          details.discrepancies_resolved === true
        );
      },
      feedback: {
        success: 'Great job reconciling your banking records!',
        improvement:
          'Double-check your calculations and look for any discrepancies.',
      },
    },

    // Paycheck Analysis
    paycheck_analyzed: {
      category: 'income_understanding',
      baseScore: 14,
      description:
        'Student analyzes paycheck components including gross pay and benefits',
      validation: details => {
        return (
          details.gross_pay_identified === true &&
          details.all_components_identified === true
        );
      },
      feedback: {
        success: 'Excellent understanding of paycheck components!',
        improvement:
          'Review all paycheck sections including benefits and deductions.',
      },
    },

    deductions_calculated: {
      category: 'tax_understanding',
      baseScore: 13,
      description:
        'Student calculates payroll deductions including FICA and federal taxes',
      validation: details => {
        return (
          (details.calculation_accuracy || 0) >= 0.98 &&
          details.all_deductions_calculated === true
        );
      },
      feedback: {
        success: 'Perfect calculation of payroll deductions!',
        improvement:
          'Review the calculation methods for FICA and federal taxes.',
      },
    },

    net_pay_computed: {
      category: 'income_understanding',
      baseScore: 11,
      description:
        'Student accurately computes net pay from gross pay and deductions',
      validation: details => {
        return (
          details.calculation_accurate === true &&
          (details.variance || 1) <= 0.02
        );
      },
      feedback: {
        success: 'Perfect! You understand paycheck calculations!',
        improvement: 'Check your math on the net pay calculation.',
      },
    },

    // Enhanced Budgeting
    income_tracked: {
      category: 'budgeting',
      baseScore: 8,
      description: 'Student identifies and tracks all income sources',
      validation: details => {
        return (
          (details.sources_identified || 0) >= 1 &&
          (details.total_income || 0) > 0
        );
      },
      feedback: {
        success: 'Good work tracking your income sources!',
        improvement: 'Make sure to include all sources of income.',
      },
    },

    expenses_categorized: {
      category: 'budgeting',
      baseScore: 12,
      description:
        'Student categorizes expenses into needs, wants, and savings',
      validation: details => {
        return (
          (details.categories_count || 0) >= 5 &&
          details.fifty_thirty_twenty_applied === true
        );
      },
      feedback: {
        success: 'Excellent expense categorization using the 50/30/20 rule!',
        improvement:
          'Try to categorize more expenses and apply the 50/30/20 rule.',
      },
    },

    budget_balanced: {
      category: 'budgeting',
      baseScore: 20,
      description:
        'Student creates a balanced budget where expenses do not exceed income',
      validation: details => {
        return (
          details.balanced === true && details.emergency_fund_included === true
        );
      },
      feedback: {
        success: 'Outstanding budget creation! Perfect balance achieved!',
        improvement:
          "Adjust your expenses to ensure they don't exceed your income.",
      },
    },

    // Cost Analysis & Comparison
    cost_comparison_completed: {
      category: 'decision_making',
      baseScore: 15,
      description: 'Student completes comprehensive cost comparison analysis',
      validation: details => {
        return (
          (details.factors_considered || 0) >= 6 &&
          details.long_term_analysis_included === true
        );
      },
      feedback: {
        success: 'Excellent comprehensive cost analysis!',
        improvement: 'Consider more factors in your cost comparison.',
      },
    },

    housing_calculator_used: {
      category: 'major_purchases',
      baseScore: 14,
      description:
        'Student uses housing calculator to compare rent vs buy costs',
      validation: details => {
        return (
          details.rent_calculated === true &&
          details.mortgage_calculated === true
        );
      },
      feedback: {
        success: 'Great work analyzing housing costs!',
        improvement: 'Make sure to calculate both rental and purchase costs.',
      },
    },

    vehicle_calculator_used: {
      category: 'major_purchases',
      baseScore: 13,
      description:
        'Student uses vehicle calculator to compare buying vs leasing',
      validation: details => {
        return (
          details.total_cost_of_ownership_calculated === true &&
          details.comparison_completed === true
        );
      },
      feedback: {
        success: 'Excellent vehicle cost analysis!',
        improvement: 'Compare both purchase and lease options thoroughly.',
      },
    },

    // Smart Shopping
    payment_methods_compared: {
      category: 'consumer_skills',
      baseScore: 11,
      description:
        'Student compares different payment methods and their total costs',
      validation: details => {
        return (
          (details.methods_analyzed || 0) >= 3 &&
          details.interest_rates_compared === true
        );
      },
      feedback: {
        success: 'Great comparison of payment methods!',
        improvement: 'Analyze more payment options and their total costs.',
      },
    },

    unit_price_calculated: {
      category: 'consumer_skills',
      baseScore: 9,
      description: 'Student calculates unit prices to find best deals',
      validation: details => {
        return (
          (details.calculations_correct || 0) >= 3 &&
          details.best_deal_identified === true
        );
      },
      feedback: {
        success: 'Perfect unit price calculations!',
        improvement:
          'Practice more unit price calculations to find the best deals.',
      },
    },

    savings_found: {
      category: 'consumer_skills',
      baseScore: 17,
      description:
        'Student successfully identifies and quantifies savings opportunities',
      validation: details => {
        return (
          (details.amount_saved || 0) >= 25 &&
          details.strategy_documented === true
        );
      },
      feedback: {
        success: "Excellent! You're now a savvy shopper!",
        improvement:
          'Look for more savings opportunities and document your strategies.',
      },
    },
  },

  /**
   * Validate if a condition is properly met with detailed feedback
   * @param {string} conditionType - The type of condition to validate
   * @param {Object} actionDetails - Details of the action performed
   * @returns {Object} Validation result with score and feedback
   */
  validateCondition: function (conditionType, actionDetails) {
    const definition = this.conditionDefinitions[conditionType];

    if (!definition) {
      // Return default validation for unknown conditions
      return {
        met: true,
        score: 10,
        feedback: 'Action completed',
        category: 'general',
        quality: 'standard',
      };
    }

    const isValid = definition.validation(actionDetails);
    let score = definition.baseScore;

    // Apply quality modifiers
    if (isValid) {
      // Bonus for exceptional performance
      if (actionDetails.exceptional_performance === true) {
        score *= 1.3;
      }
      // Bonus for efficiency
      if (
        actionDetails.completion_time &&
        actionDetails.completion_time < 300
      ) {
        score *= 1.15;
      }
      // Bonus for accuracy
      if (actionDetails.accuracy_rate && actionDetails.accuracy_rate >= 0.98) {
        score *= 1.1;
      }
    } else {
      // Partial credit for attempted but incomplete actions
      score *= 0.4;
    }

    return {
      met: isValid,
      score: Math.round(score),
      feedback: isValid
        ? definition.feedback.success
        : definition.feedback.improvement,
      category: definition.category,
      quality: this.assessQuality(actionDetails, isValid),
      requirements: definition.description,
    };
  },

  /**
   * Assess the quality of an action based on details
   * @param {Object} actionDetails - Details of the action performed
   * @param {boolean} conditionMet - Whether the basic condition was met
   * @returns {string} Quality assessment: 'exceptional', 'proficient', 'developing', 'beginning'
   */
  assessQuality: function (actionDetails, conditionMet) {
    if (!conditionMet) return 'beginning';

    let qualityScore = 0;

    // Check various quality indicators
    if ((actionDetails.accuracy_rate || 0) >= 0.98) qualityScore += 2;
    else if ((actionDetails.accuracy_rate || 0) >= 0.95) qualityScore += 1;

    if (actionDetails.completion_time && actionDetails.completion_time < 180)
      qualityScore += 1;
    if (actionDetails.exceptional_performance) qualityScore += 2;
    if (actionDetails.creative_approach) qualityScore += 1;
    if (actionDetails.help_others) qualityScore += 1;

    if (qualityScore >= 4) return 'exceptional';
    if (qualityScore >= 2) return 'proficient';
    return 'developing';
  },
};

/**
 * Enhanced event listener for condition tracking
 * This should be called when students complete actions in the app
 * @param {string} conditionType - Type of condition completed
 * @param {Object} actionDetails - Details of the action
 * @param {Object} context - Additional context about where action occurred
 */
window.recordConditionMet = function (
  conditionType,
  actionDetails = {},
  context = {},
) {
  console.log(`🎯 Condition tracking: ${conditionType}`, actionDetails);

  // Validate the condition using enhanced tracker
  const validation = enhancedConditionTracker.validateCondition(
    conditionType,
    actionDetails,
  );

  // Record in lesson tracker if lesson is active
  if (lessonTracker.currentLesson) {
    const enhancedDetails = {
      ...actionDetails,
      validation: validation,
      context: context,
      timestamp: new Date().toISOString(),
      quality: validation.quality,
      category: validation.category,
    };

    if (validation.met) {
      lessonTracker.recordPositiveCondition(conditionType, enhancedDetails);

      // Show immediate feedback for successful conditions
      showConditionFeedback(conditionType, validation.feedback, 'success');
    } else {
      // Record as attempted but not fully successful
      lessonTracker.recordNegativeCondition(
        `${conditionType}_attempted`,
        enhancedDetails,
      );

      // Show improvement feedback
      showConditionFeedback(conditionType, validation.feedback, 'improvement');
    }

    // Update progress indicators if available
    updateLessonProgress();
  }

  // Track for analytics
  trackLessonCompletionEvent('condition_attempted', {
    conditionType: conditionType,
    met: validation.met,
    score: validation.score,
    quality: validation.quality,
    category: validation.category,
  });

  return validation;
};

/**
 * Show feedback when conditions are met or attempted
 * @param {string} conditionType - Type of condition
 * @param {string} feedback - Feedback message
 * @param {string} type - 'success' or 'improvement'
 */
const showConditionFeedback = function (conditionType, feedback, type) {
  // Create feedback notification
  const notification = document.createElement('div');
  notification.className = `condition-feedback ${type}`;
  notification.innerHTML = `
    <div class="feedback-content">
      <div class="feedback-icon">
        ${type === 'success' ? '✅' : '💡'}
      </div>
      <div class="feedback-text">
        <div class="feedback-title">${type === 'success' ? 'Great Work!' : 'Keep Going!'}</div>
        <div class="feedback-message">${feedback}</div>
      </div>
    </div>
  `;

  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #17a2b8, #6f42c1)'};
    color: white;
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    max-width: 300px;
    animation: slideInFromRight 0.5s ease-out;
  `;

  // Add to page
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
 * Update lesson progress indicators (if UI elements exist)
 */
const updateLessonProgress = function () {
  if (!lessonTracker.currentLesson) return;

  // Get current lesson progress
  const progress = lessonTracker.getLessonProgress();
  if (!progress) return;

  // Update progress text if it exists
  const progressText = document.querySelector('.lesson-progress-text');
  if (progressText) {
    progressText.textContent = `Progress: ${Math.round(progress.progress)}%`;
  }

  // Update progress bar if it exists
  const progressBar = document.querySelector('.lesson-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progress.progress}%`;
  }

  // Log progress for debugging
  console.log('Lesson progress updated:', Math.round(progress.progress) + '%');
};

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
      lessonTracker.initializeLesson(String(lesson.id), lesson.title, []);
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
              'custom-expense',
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
        baseAppScore: 15, // Small starting score - must use app to earn rest
        difficulty: 'easy',
        multipliers: { positive: 1.2, negative: 0.8 }, // More forgiving
        description: 'Extra support for new learners',
      },
      standard_challenge: {
        name: 'Standard Challenge',
        baseAppScore: 10, // Minimal starting score - app usage required
        difficulty: 'medium',
        multipliers: { positive: 1.0, negative: 1.0 }, // Balanced
        description: 'Balanced learning experience',
      },
      advanced_mastery: {
        name: 'Advanced Mastery',
        baseAppScore: 5, // Very low starting score - must demonstrate mastery
        difficulty: 'hard',
        multipliers: { positive: 0.8, negative: 1.3 }, // More demanding
        description: 'Higher expectations for mastery',
      },
      practical_application: {
        name: 'Practical Application',
        baseAppScore: 0, // Zero starting score - prove app competency
        difficulty: 'hard',
        multipliers: { positive: 1.5, negative: 1.5 }, // High stakes
        description: 'Emphasis on real-world application',
      },
      exploratory_learning: {
        name: 'Exploratory Learning',
        baseAppScore: 20, // Encourage experimentation with small buffer
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

    // Check if this is a Dallas Fed condition that should use enhanced tracking
    const dallasFedCondition =
      enhancedConditionTracker.conditionDefinitions[conditionType];

    // Base score changes (before multipliers)
    let baseScoreChange = 0;

    // Use enhanced scoring for Dallas Fed conditions
    if (dallasFedCondition && isPositive) {
      const validation = enhancedConditionTracker.validateCondition(
        conditionType,
        details,
      );
      baseScoreChange = validation.score;

      // Apply quality bonuses based on validation
      if (validation.quality === 'exceptional') {
        baseScoreChange *= 1.2;
      } else if (validation.quality === 'proficient') {
        baseScoreChange *= 1.05;
      }

      console.log(
        `Enhanced scoring for ${conditionType}: ${baseScoreChange} (${validation.quality})`,
      );
    }
    // Use existing scoring system for standard conditions
    else {
      switch (conditionType) {
        case 'lesson_content_viewed':
          // Award points for viewing lesson content (only positive)
          if (isPositive) {
            const viewingScore =
              details.slidesViewed && details.totalSlides
                ? (details.slidesViewed / details.totalSlides) * 30
                : 15;
            this.contentScore = Math.max(0, Math.min(30, viewingScore));

            // Apply viewing quality bonus
            if (details.viewingQuality) {
              this.contentScore *= details.viewingQuality;
            }

            // Round to 1 decimal place to avoid floating point precision issues
            this.contentScore = Math.round(this.contentScore * 10) / 10;
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
          if (
            details.billType === 'credit_card' ||
            details.billType === 'loan'
          ) {
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

        // Dallas Fed Aligned Action Types
        case 'spending_analyzed':
          baseScoreChange = isPositive ? 12 : -10;
          if (details.categories_identified >= 5) {
            baseScoreChange *= 1.3; // Bonus for detailed analysis
          }
          break;

        case 'smart_goal_validated':
          baseScoreChange = isPositive ? 15 : -12;
          if (details.smart_score >= 0.9) {
            baseScoreChange *= 1.4; // Excellent SMART goal bonus
          }
          break;

        case 'balance_sheet_created':
          baseScoreChange = isPositive ? 18 : -15;
          if (details.assets_count >= 3 && details.net_worth_calculated) {
            baseScoreChange *= 1.3; // Comprehensive balance sheet bonus
          }
          break;

        case 'assets_liabilities_identified':
          baseScoreChange = isPositive ? 10 : -8;
          if (details.categorization_accuracy >= 0.9) {
            baseScoreChange *= 1.2; // Accuracy bonus
          }
          break;

        case 'transactions_reconciled':
          baseScoreChange = isPositive ? 16 : -20;
          if (details.accuracy_rate >= 0.95) {
            baseScoreChange *= 1.4; // High accuracy bonus
          }
          break;

        case 'paycheck_analyzed':
          baseScoreChange = isPositive ? 14 : -12;
          if (details.all_components_identified) {
            baseScoreChange *= 1.2; // Complete analysis bonus
          }
          break;

        case 'deductions_calculated':
          baseScoreChange = isPositive ? 13 : -15;
          if (details.calculation_accuracy >= 0.98) {
            baseScoreChange *= 1.3; // Precision bonus
          }
          break;

        case 'net_pay_computed':
          baseScoreChange = isPositive ? 11 : -14;
          if (details.variance <= 0.01) {
            baseScoreChange *= 1.25; // Exact calculation bonus
          }
          break;

        case 'income_tracked':
          baseScoreChange = isPositive ? 8 : -6;
          if (details.sources_identified >= 2) {
            baseScoreChange *= 1.2; // Multiple income sources bonus
          }
          break;

        case 'expenses_categorized':
          baseScoreChange = isPositive ? 12 : -10;
          if (details.fifty_thirty_twenty_applied) {
            baseScoreChange *= 1.3; // 50/30/20 rule bonus
          }
          break;

        case 'budget_balanced':
          baseScoreChange = isPositive ? 20 : -18;
          if (details.emergency_fund_included && details.savings_rate >= 0.2) {
            baseScoreChange *= 1.4; // Excellent budgeting bonus
          }
          break;

        case 'cost_comparison_completed':
          baseScoreChange = isPositive ? 15 : -12;
          if (details.factors_considered >= 6) {
            baseScoreChange *= 1.3; // Comprehensive analysis bonus
          }
          break;

        case 'housing_calculator_used':
          baseScoreChange = isPositive ? 14 : -11;
          if (details.long_term_analysis_included) {
            baseScoreChange *= 1.2; // Long-term thinking bonus
          }
          break;

        case 'vehicle_calculator_used':
          baseScoreChange = isPositive ? 13 : -10;
          if (details.total_cost_of_ownership_calculated) {
            baseScoreChange *= 1.25; // TCO analysis bonus
          }
          break;

        case 'payment_methods_compared':
          baseScoreChange = isPositive ? 11 : -9;
          if (details.interest_rates_compared) {
            baseScoreChange *= 1.2; // Interest rate awareness bonus
          }
          break;

        case 'unit_price_calculated':
          baseScoreChange = isPositive ? 9 : -7;
          if (details.calculations_correct >= 5) {
            baseScoreChange *= 1.3; // Multiple calculations bonus
          }
          break;

        case 'savings_found':
          baseScoreChange = isPositive ? 17 : -8;
          if (details.amount_saved >= 100) {
            baseScoreChange *= 1.5; // Significant savings bonus
          }
          break;

        default:
          // Generic positive/negative actions with scenario variation
          baseScoreChange = isPositive ? 5 : -8;
      }
    } // Close the else block for standard conditions

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
    const lessonIdString = String(this.currentLesson.id || '');
    const isTestScenario = lessonIdString.startsWith('test_');

    // Check for spending analysis completion - need multiple bills created
    const spendingAnalyzedActions = this.positiveConditionsMet.filter(
      record => record.type === 'spending_analyzed',
    );
    const hasCompletedSpendingAnalysis = spendingAnalyzedActions.length >= 3; // Need 3 bills for housing, food, custom-expense

    // Auto-complete if student has:
    // 1. Viewed lesson content AND performed at least 2 app actions (3 for test scenarios)
    // OR
    // 2. Performed at least 3 significant app actions (4 for test scenarios)
    // OR
    // 3. Completed spending analysis with 3+ bills

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
        // Dallas Fed Aligned Actions
        'spending_analyzed',
        'smart_goal_validated',
        'balance_sheet_created',
        'assets_liabilities_identified',
        'transactions_reconciled',
        'paycheck_analyzed',
        'deductions_calculated',
        'net_pay_computed',
        'income_tracked',
        'expenses_categorized',
        'budget_balanced',
        'cost_comparison_completed',
        'housing_calculator_used',
        'vehicle_calculator_used',
        'payment_methods_compared',
        'unit_price_calculated',
        'savings_found',
      ].includes(type),
    );

    const significantActions = appActionTypes.length;

    // Use higher thresholds for test scenarios to allow more actions to be processed
    const requiredWithContent = isTestScenario ? 3 : 2;
    const requiredWithoutContent = isTestScenario ? 4 : 3;

    // Check completion conditions
    const contentAndActions =
      hasViewedContent && significantActions >= requiredWithContent;
    const actionsOnly = significantActions >= requiredWithoutContent;
    const spendingAnalysisComplete = hasCompletedSpendingAnalysis;

    if (contentAndActions || actionsOnly || spendingAnalysisComplete) {
      console.log(
        'Default auto-completion conditions met! Completing lesson...',
        {
          contentAndActions,
          actionsOnly,
          spendingAnalysisComplete,
          spendingBillsCreated: spendingAnalyzedActions.length,
          hasViewedContent,
          significantActions,
        },
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
          // Dallas Fed Aligned Actions
          'spending_analyzed',
          'smart_goal_validated',
          'balance_sheet_created',
          'assets_liabilities_identified',
          'transactions_reconciled',
          'paycheck_analyzed',
          'deductions_calculated',
          'net_pay_computed',
          'income_tracked',
          'expenses_categorized',
          'budget_balanced',
          'cost_comparison_completed',
          'housing_calculator_used',
          'vehicle_calculator_used',
          'payment_methods_compared',
          'unit_price_calculated',
          'savings_found',
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

    // Close the carousel if it's open
    if (document.getElementById('lessonCarouselDialog')) {
      console.log('Auto-completion: Closing lesson carousel...');
      closeLessonCarousel();
    }
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
              <span>${Math.round(completionResult.score.breakdown.contentScore * 10) / 10}/30</span>
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
              'custom-expense',
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

/****************Hover Scroll Functionality****************/

/**
 * Set up hover scrolling for the lessons block
 */
function setupLessonHoverScroll() {
  const lessonsBlock = document.querySelector('.lessonsBlock');
  const lessonRow = document.querySelector('.lessonRow');

  if (!lessonsBlock || !lessonRow) return;

  // Create scroll zones
  const leftScrollZone = document.createElement('div');
  const rightScrollZone = document.createElement('div');

  leftScrollZone.className = 'lessonsBlock-scroll-left';
  rightScrollZone.className = 'lessonsBlock-scroll-right';

  lessonsBlock.appendChild(leftScrollZone);
  lessonsBlock.appendChild(rightScrollZone);

  let scrollInterval;
  const scrollSpeed = 8; // pixels per frame (increased from 2 to 8)
  const scrollDelay = 16; // ~60fps

  // Left scroll zone
  leftScrollZone.addEventListener('mouseenter', () => {
    scrollInterval = setInterval(() => {
      lessonRow.scrollLeft -= scrollSpeed;
    }, scrollDelay);
  });

  leftScrollZone.addEventListener('mouseleave', () => {
    clearInterval(scrollInterval);
  });

  // Right scroll zone
  rightScrollZone.addEventListener('mouseenter', () => {
    scrollInterval = setInterval(() => {
      lessonRow.scrollLeft += scrollSpeed;
    }, scrollDelay);
  });

  rightScrollZone.addEventListener('mouseleave', () => {
    clearInterval(scrollInterval);
  });

  // Show/hide scroll zones based on scroll position
  function updateScrollZones() {
    const canScrollLeft = lessonRow.scrollLeft > 0;
    const canScrollRight =
      lessonRow.scrollLeft < lessonRow.scrollWidth - lessonRow.clientWidth;

    leftScrollZone.style.opacity = canScrollLeft ? '1' : '0.3';
    rightScrollZone.style.opacity = canScrollRight ? '1' : '0.3';
    leftScrollZone.style.pointerEvents = canScrollLeft ? 'auto' : 'none';
    rightScrollZone.style.pointerEvents = canScrollRight ? 'auto' : 'none';
  }

  // Update scroll zones on scroll
  lessonRow.addEventListener('scroll', updateScrollZones);

  // Initial update
  setTimeout(updateScrollZones, 100);
}

/**
 * Trinity Capital - Lesson Renderer
 *
 * This module handles pulling and rendering lesson content from MongoDB Atlas DB.
 * It follows the architecture plan for lesson content rendering with proper
 * grouping of headers and text blocks.
 *
 * Key Features:
 * - Pulls lesson content from MongoDB
 * - Groups headers + text blocks appropriately
 * - Handles consecutive headers independently
 * - Manages lesson gating and progression
 * - Integrates with lesson engine for dynamic content
 */

class LessonRenderer {
  constructor() {
    this.currentStudent = null;
    this.currentLesson = null;
    this.renderedContent = null;
    this.contentContainer = null;

    console.log('📖 Trinity Capital Lesson Renderer initialized');
  }

  /**
   * Initialize the renderer for a specific student
   * @param {string} studentId - The student's ID
   * @param {string} containerId - DOM container ID for rendering content
   */
  initialize(studentId, containerId = 'lesson-content') {
    this.currentStudent = studentId;

    // Try to find the specified container, or look for LessonsBlock class
    this.contentContainer = document.getElementById(containerId);

    if (!this.contentContainer) {
      console.log(
        `📝 Content container '${containerId}' not found, checking for LessonsBlock...`,
      );

      // Look for the LessonsBlock class container
      const lessonsBlock = document.querySelector('.LessonsBlock');
      if (lessonsBlock) {
        // Use the existing LessonsBlock container
        this.contentContainer = lessonsBlock;
        console.log(
          `📚 Using existing LessonsBlock container for lesson content`,
        );
      } else if (containerId === 'lesson-content') {
        // Create the lesson-content div inside the lesson modal or main area
        const lessonModal = document.querySelector('.lessonModal');
        const targetContainer =
          lessonModal ||
          document.querySelector('.mainContent') ||
          document.querySelector('.rightSide') ||
          document.body;

        this.contentContainer = document.createElement('div');
        this.contentContainer.id = 'lesson-content';
        this.contentContainer.className =
          'lesson-content-container LessonsBlock';
        this.contentContainer.style.display = 'none'; // Hidden by default
        targetContainer.appendChild(this.contentContainer);
        console.log(
          `📚 Created lesson-content container with LessonsBlock class`,
        );
      } else {
        // Create a container in the main content area
        const mainContent =
          document.querySelector('.mainContent') ||
          document.querySelector('.rightSide') ||
          document.body;
        this.contentContainer = document.createElement('div');
        this.contentContainer.id = containerId;
        this.contentContainer.className = 'lesson-content-container';
        this.contentContainer.style.display = 'none'; // Hidden by default
        mainContent.appendChild(this.contentContainer);
        console.log(`📚 Created ${containerId} container in main content area`);
      }
    }

    console.log(`📚 Lesson Renderer initialized for student: ${studentId}`);
    return true;
  }

  /**
   * Render a specific lesson by ID
   * @param {string} lessonId - The lesson ID to render
   */
  async renderLesson(lessonId) {
    try {
      console.log(`🔄 Loading lesson: ${lessonId}`);

      // Check if student can access this lesson (gating)
      const canAccess = await this.checkLessonAccess(lessonId);
      if (!canAccess) {
        this.renderAccessDenied(lessonId);
        return;
      }

      // Fetch lesson data from MongoDB
      const lessonData = await this.fetchLessonData(lessonId);
      if (!lessonData) {
        this.renderLessonNotFound(lessonId);
        return;
      }

      this.currentLesson = lessonData;

      // Render lesson content
      await this.renderLessonContent(lessonData);

      // Initialize lesson engine for this lesson
      if (window.lessonEngine) {
        await window.lessonEngine.initialize(this.currentStudent);
      }

      console.log(
        `✅ Lesson rendered successfully: ${lessonData.lesson_title}`,
      );
    } catch (error) {
      console.error('❌ Error rendering lesson:', error);
      this.renderError(error.message);
    }
  }

  /**
   * Fetch lesson data from the server/MongoDB
   * @param {string} lessonId - The lesson ID
   */
  async fetchLessonData(lessonId) {
    try {
      const response = await fetch(`/api/lesson/${lessonId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch lesson: ${response.status}`);
      }

      const lessonData = await response.json();
      return lessonData;
    } catch (error) {
      console.error('❌ Error fetching lesson data:', error);
      return null;
    }
  }

  /**
   * Check if student has access to a specific lesson (lesson gating)
   * @param {string} lessonId - The lesson ID to check
   */
  async checkLessonAccess(lessonId) {
    try {
      const response = await fetch(
        `/api/lesson-access/${this.currentStudent}/${lessonId}`,
      );

      if (response.ok) {
        const accessData = await response.json();
        return accessData.hasAccess;
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking lesson access:', error);
      return false;
    }
  }

  /**
   * Render the main lesson content according to architecture rules
   * @param {Object} lessonData - The lesson data from MongoDB
   */
  async renderLessonContent(lessonData) {
    // Clear existing content
    this.contentContainer.innerHTML = '';

    // Create lesson header
    this.renderLessonHeader(lessonData);

    // Process and render content blocks
    const contentBlocks = this.processContentBlocks(lessonData.content || []);
    this.renderContentBlocks(contentBlocks);

    // Render lesson instructions if available
    if (
      lessonData.lesson_conditions &&
      lessonData.lesson_conditions.length > 0
    ) {
      this.renderInstructions(lessonData);
    }

    // Add lesson navigation
    this.renderLessonNavigation(lessonData);
  }

  /**
   * Process content blocks according to architecture rules:
   * - Headers + text blocks are grouped
   * - Multiple text blocks with no header appear standalone
   * - Consecutive headers render independently
   */
  processContentBlocks(content) {
    const processedBlocks = [];
    let currentGroup = null;

    for (let i = 0; i < content.length; i++) {
      const block = content[i];

      if (block.type === 'header') {
        // If we have a current group, finalize it
        if (currentGroup) {
          processedBlocks.push(currentGroup);
        }

        // Check if next block is also a header (consecutive headers)
        const nextBlock = content[i + 1];
        if (nextBlock && nextBlock.type === 'header') {
          // Render this header independently
          processedBlocks.push({
            type: 'standalone_header',
            content: [block],
          });
          currentGroup = null;
        } else {
          // Start new group with this header
          currentGroup = {
            type: 'header_group',
            content: [block],
          };
        }
      } else if (block.type === 'text') {
        if (currentGroup && currentGroup.type === 'header_group') {
          // Add to current header group
          currentGroup.content.push(block);
        } else {
          // Standalone text block or group with other text blocks
          if (!currentGroup || currentGroup.type !== 'text_group') {
            if (currentGroup) {
              processedBlocks.push(currentGroup);
            }
            currentGroup = {
              type: 'text_group',
              content: [],
            };
          }
          currentGroup.content.push(block);
        }
      } else {
        // Other content types (images, videos, etc.)
        if (currentGroup) {
          processedBlocks.push(currentGroup);
          currentGroup = null;
        }

        processedBlocks.push({
          type: 'standalone_content',
          content: [block],
        });
      }
    }

    // Add final group if exists
    if (currentGroup) {
      processedBlocks.push(currentGroup);
    }

    return processedBlocks;
  }

  /**
   * Render processed content blocks
   */
  renderContentBlocks(blocks) {
    blocks.forEach(block => {
      const blockElement = this.createBlockElement(block);
      this.contentContainer.appendChild(blockElement);
    });
  }

  /**
   * Create DOM element for a content block
   */
  createBlockElement(block) {
    const container = document.createElement('div');
    container.className = `lesson-block lesson-${block.type}`;

    switch (block.type) {
      case 'header_group':
        this.renderHeaderGroup(container, block.content);
        break;
      case 'text_group':
        this.renderTextGroup(container, block.content);
        break;
      case 'standalone_header':
        this.renderStandaloneHeader(container, block.content[0]);
        break;
      case 'standalone_content':
        this.renderStandaloneContent(container, block.content[0]);
        break;
    }

    return container;
  }

  /**
   * Render header group (header + associated text blocks)
   */
  renderHeaderGroup(container, content) {
    content.forEach(item => {
      if (item.type === 'header') {
        const header = document.createElement(`h${item.level || 2}`);
        header.textContent = item.text;
        header.className = 'lesson-header';
        container.appendChild(header);
      } else if (item.type === 'text') {
        const text = document.createElement('p');
        text.innerHTML = this.processTextContent(item.text);
        text.className = 'lesson-text';
        container.appendChild(text);
      }
    });
  }

  /**
   * Render text group (multiple text blocks without headers)
   */
  renderTextGroup(container, content) {
    content.forEach(item => {
      const text = document.createElement('p');
      text.innerHTML = this.processTextContent(item.text);
      text.className = 'lesson-text standalone';
      container.appendChild(text);
    });
  }

  /**
   * Render standalone header (consecutive headers)
   */
  renderStandaloneHeader(container, headerContent) {
    const header = document.createElement(`h${headerContent.level || 2}`);
    header.textContent = headerContent.text;
    header.className = 'lesson-header standalone';
    container.appendChild(header);
  }

  /**
   * Render standalone content (images, videos, etc.)
   */
  renderStandaloneContent(container, content) {
    switch (content.type) {
      case 'image':
        const img = document.createElement('img');
        img.src = content.src;
        img.alt = content.alt || '';
        img.className = 'lesson-image';
        container.appendChild(img);
        break;
      case 'video':
        const video = document.createElement('video');
        video.src = content.src;
        video.controls = true;
        video.className = 'lesson-video';
        container.appendChild(video);
        break;
      default:
        const div = document.createElement('div');
        div.innerHTML = this.processTextContent(content.text || '');
        container.appendChild(div);
    }
  }

  /**
   * Process text content for formatting and dynamic content
   */
  processTextContent(text) {
    if (!text) return '';

    // Basic markdown-style formatting
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');

    // Process dynamic placeholders
    text = this.processDynamicPlaceholders(text);

    return text;
  }

  /**
   * Process dynamic placeholders in lesson content
   */
  processDynamicPlaceholders(text) {
    // Replace student-specific placeholders
    if (this.currentStudent) {
      text = text.replace(/\{studentName\}/g, this.currentStudent);
    }

    // Replace lesson-specific placeholders
    if (this.currentLesson) {
      text = text.replace(
        /\{lessonTitle\}/g,
        this.currentLesson.lesson_title || '',
      );
      text = text.replace(/\{unitNumber\}/g, this.currentLesson.unit || '');
    }

    return text;
  }

  /**
   * Render lesson header with title and metadata
   */
  renderLessonHeader(lessonData) {
    const header = document.createElement('div');
    header.className = 'lesson-header-section';

    const title = document.createElement('h1');
    title.textContent = lessonData.lesson_title;
    title.className = 'lesson-title';

    const metadata = document.createElement('div');
    metadata.className = 'lesson-metadata';

    if (lessonData.unit) {
      const unit = document.createElement('span');
      unit.textContent = `Unit ${lessonData.unit}`;
      unit.className = 'lesson-unit';
      metadata.appendChild(unit);
    }

    if (lessonData.estimated_duration) {
      const duration = document.createElement('span');
      duration.textContent = `${lessonData.estimated_duration} minutes`;
      duration.className = 'lesson-duration';
      metadata.appendChild(duration);
    }

    header.appendChild(title);
    header.appendChild(metadata);
    this.contentContainer.appendChild(header);
  }

  /**
   * Generate and render personalized instructions based on lesson conditions
   */
  renderInstructions(lessonData) {
    const instructionsContainer = document.createElement('div');
    instructionsContainer.className = 'lesson-instructions';
    instructionsContainer.id = 'lesson-instructions';

    const instructionsTitle = document.createElement('h3');
    instructionsTitle.textContent = 'Your Tasks';
    instructionsTitle.className = 'instructions-title';

    const instructionsList = document.createElement('ul');
    instructionsList.className = 'instructions-list';

    // Generate instructions from lesson conditions
    const instructions = this.generateInstructions(
      lessonData.lesson_conditions,
    );

    instructions.forEach((instruction, index) => {
      const listItem = document.createElement('li');
      listItem.innerHTML = instruction;
      listItem.className = 'instruction-item';
      listItem.dataset.conditionIndex = index;
      instructionsList.appendChild(listItem);
    });

    instructionsContainer.appendChild(instructionsTitle);
    instructionsContainer.appendChild(instructionsList);
    this.contentContainer.appendChild(instructionsContainer);
  }

  /**
   * Generate personalized instructions from lesson conditions
   */
  generateInstructions(conditions) {
    const instructions = [];

    conditions.forEach(condition => {
      const instruction = this.conditionToInstruction(condition);
      if (instruction) {
        instructions.push(instruction);
      }
    });

    return instructions;
  }

  /**
   * Convert a lesson condition to a user-friendly instruction
   */
  conditionToInstruction(condition) {
    const templates = {
      transfer_completed:
        'Make a transfer between your checking and savings accounts',
      deposit_completed: 'Make a deposit using the check deposit feature',
      bill_created: 'Set up a recurring bill payment',
      savings_balance_above: `Save at least $${condition.value} in your savings account`,
      goal_set_specific:
        'Set a specific financial goal with clear action steps',
      budget_positive_above: `Maintain a positive budget with at least $${condition.value} surplus`,
      transfer_amount_above: `Make a transfer of at least $${condition.value}`,
      message_sent: 'Send a message to a classmate or teacher',
    };

    const baseInstruction = templates[condition.condition_type];

    if (!baseInstruction) {
      return null;
    }

    // Add action-specific context if available
    if (condition.action && condition.action.description) {
      return `${baseInstruction} - ${condition.action.description}`;
    }

    return baseInstruction;
  }

  /**
   * Render lesson navigation (previous/next lesson buttons)
   */
  renderLessonNavigation(lessonData) {
    const navigation = document.createElement('div');
    navigation.className = 'lesson-navigation';

    // Previous lesson button (if applicable)
    if (lessonData.previousLessonId) {
      const prevButton = document.createElement('button');
      prevButton.textContent = '← Previous Lesson';
      prevButton.className = 'nav-button prev-lesson';
      prevButton.onclick = () => this.renderLesson(lessonData.previousLessonId);
      navigation.appendChild(prevButton);
    }

    // Next lesson button (if accessible)
    if (lessonData.nextLessonId) {
      const nextButton = document.createElement('button');
      nextButton.textContent = 'Next Lesson →';
      nextButton.className = 'nav-button next-lesson';
      nextButton.onclick = () =>
        this.checkAndNavigateNext(lessonData.nextLessonId);
      navigation.appendChild(nextButton);
    }

    this.contentContainer.appendChild(navigation);
  }

  /**
   * Check lesson completion before allowing navigation to next lesson
   */
  async checkAndNavigateNext(nextLessonId) {
    const canAccess = await this.checkLessonAccess(nextLessonId);

    if (canAccess) {
      this.renderLesson(nextLessonId);
    } else {
      this.showGatingMessage();
    }
  }

  /**
   * Show message when lesson gating prevents access
   */
  showGatingMessage() {
    const message = `
            <div class="gating-message">
                <h3>🔒 Complete Current Lesson First</h3>
                <p>You need to complete all tasks in your current lesson before moving to the next one.</p>
                <p>Check your task list above and make sure you've completed all required activities.</p>
            </div>
        `;

    this.showModal(message);
  }

  /**
   * Render access denied message
   */
  renderAccessDenied(lessonId) {
    this.contentContainer.innerHTML = `
            <div class="access-denied">
                <h2>🔒 Access Denied</h2>
                <p>You don't have permission to access this lesson yet.</p>
                <p>Please complete the previous lessons first.</p>
                <button onclick="window.location.reload()" class="retry-button">Return to Available Lessons</button>
            </div>
        `;
  }

  /**
   * Render lesson not found message
   */
  renderLessonNotFound(lessonId) {
    this.contentContainer.innerHTML = `
            <div class="lesson-not-found">
                <h2>📚 Lesson Not Found</h2>
                <p>The lesson with ID "${lessonId}" could not be found.</p>
                <button onclick="window.location.reload()" class="retry-button">Return to Lesson List</button>
            </div>
        `;
  }

  /**
   * Render error message
   */
  renderError(errorMessage) {
    this.contentContainer.innerHTML = `
            <div class="lesson-error">
                <h2>❌ Error Loading Lesson</h2>
                <p>There was an error loading the lesson: ${errorMessage}</p>
                <button onclick="window.location.reload()" class="retry-button">Try Again</button>
            </div>
        `;
  }

  /**
   * Show modal dialog
   */
  showModal(content) {
    const modal = document.createElement('div');
    modal.className = 'lesson-modal';
    modal.innerHTML = `
            <div class="modal-content">
                ${content}
                <button class="modal-close" onclick="this.closest('.lesson-modal').remove()">×</button>
            </div>
        `;

    document.body.appendChild(modal);

    // Auto-close after 10 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 10000);
  }

  /**
   * Get available lessons for current student
   */
  async getAvailableLessons() {
    try {
      const response = await fetch(
        `/api/student-lessons/${this.currentStudent}`,
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('❌ Error fetching available lessons:', error);
    }
    return [];
  }

  /**
   * Update instruction completion status
   */
  markInstructionComplete(conditionIndex) {
    const instructionItem = document.querySelector(
      `[data-condition-index="${conditionIndex}"]`,
    );
    if (instructionItem) {
      instructionItem.classList.add('completed');
      instructionItem.innerHTML += ' ✅';
    }
  }

  /**
   * Refresh lesson content (useful for dynamic updates)
   */
  async refreshLesson() {
    if (this.currentLesson) {
      await this.renderLesson(this.currentLesson._id);
    }
  }
}

// Initialize global lesson renderer instance
window.lessonRenderer = new LessonRenderer();

/**
 * Main function called from script.js to render lessons for a student
 * This maintains compatibility with the existing system
 * @param {Object} studentProfile - The student's profile object
 */
export function renderLessons(studentProfile) {
  console.log('📚 renderLessons called with profile:', studentProfile);

  if (!studentProfile || !studentProfile.memberName) {
    console.warn('⚠️ Invalid student profile provided to renderLessons');
    return;
  }

  // Initialize the lesson renderer for this student
  const initialized = window.lessonRenderer.initialize(
    studentProfile.memberName,
    'lesson-content',
  );

  if (!initialized) {
    console.warn('⚠️ Failed to initialize lesson renderer');
    return;
  }

  // If the student has a current lesson, render it
  if (studentProfile.currentLessonId) {
    window.lessonRenderer.renderLesson(studentProfile.currentLessonId);
  } else if (studentProfile.lessonIds && studentProfile.lessonIds.length > 0) {
    // Render the first available lesson
    window.lessonRenderer.renderLesson(studentProfile.lessonIds[0]);
  } else {
    console.log('📝 No lessons found for student');
    // Could render a "no lessons available" message
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LessonRenderer, renderLessons };
}

console.log('✅ Trinity Capital Lesson Renderer loaded successfully');

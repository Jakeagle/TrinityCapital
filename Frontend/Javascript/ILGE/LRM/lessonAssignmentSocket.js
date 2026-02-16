/**
 * LRM - Lesson Assignment Socket Module
 *
 * Handles incoming lesson assignments from the lesson server (localhost:4000)
 * and updates the student UI using LRM functions.
 *
 * Flow:
 * 1. Teacher assigns lesson via LMM -> unitAssignmentSocket -> Lesson Server
 * 2. Lesson Server -> This LRM socket -> LRM UI updates
 */

// Store received lessons globally for UI rendering
let receivedLessons = [];

class LessonAssignmentSocket {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.studentName = null;
    this.lrmInstance = null;
  }

  /**
   * Initialize socket connection to lesson server
   * @param {string} studentName - The student's name for identification
   * @param {Object} lrmInstance - The LRM instance for UI updates
   */
  initialize(studentName, lrmInstance = null) {
    console.log(
      `🔌 [LRM-Socket] INIT: Starting initialization for student: ${studentName}`,
    );
    this.studentName = studentName;
    this.lrmInstance = lrmInstance;

    try {
      console.log(
        `🔌 [LRM-Socket] INIT: Attempting to connect to localhost:4000`,
      );

      // Test server connectivity first
      console.log(
        `🔍 [LRM-Socket] INIT: Testing if localhost:4000 is reachable...`,
      );
      fetch("http://localhost:4000", { mode: "no-cors" })
        .then(() =>
          console.log(`✅ [LRM-Socket] INIT: localhost:4000 is reachable`),
        )
        .catch((err) =>
          console.warn(
            `⚠️ [LRM-Socket] INIT: localhost:4000 test failed:`,
            err.message,
          ),
        );

      // Connect to lesson server on localhost:4000
      this.socket = io("http://localhost:4000", {
        withCredentials: true,
        transports: ["websocket", "polling"],
      });

      console.log(
        `🔌 [LRM-Socket] INIT: Socket object created, setting up event handlers`,
      );
      this.setupEventHandlers();

      console.log(
        `✅ [LRM-Socket] INIT: Initialization complete for student: ${studentName}`,
      );
    } catch (error) {
      console.error(
        `❌ [LRM-Socket] INIT: Failed to initialize socket:`,
        error,
      );
    }
  }

  /**
   * Set up socket event handlers for lesson assignments
   */
  setupEventHandlers() {
    if (!this.socket) {
      console.error(
        `❌ [LRM-Socket] SETUP: No socket available for event handler setup`,
      );
      return;
    }
    console.log(`🎯 [LRM-Socket] SETUP: Setting up event handlers`);

    // Connection established
    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log(
        `✅ [LRM-Socket] CONNECT: Successfully connected to lesson server (localhost:4000)`,
      );
      console.log(`📝 [LRM-Socket] CONNECT: Socket ID: ${this.socket.id}`);

      // Identify student with server
      const identifyData = {
        studentName: this.studentName,
        purpose: "lessonReceiver",
      };
      console.log(
        `💬 [LRM-Socket] CONNECT: Sending identifyStudent with data:`,
        identifyData,
      );
      this.socket.emit("identifyStudent", identifyData);
    });

    // Connection lost
    this.socket.on("disconnect", () => {
      this.isConnected = false;
      console.log(
        `❌ [LRM-Socket] DISCONNECT: Lost connection to lesson server`,
      );
      console.log(
        `❌ [LRM-Socket] DISCONNECT: Will attempt reconnection automatically`,
      );
    });

    // Student identification confirmed
    this.socket.on("studentIdentified", (data) => {
      console.log(
        `✅ [LRM-Socket] IDENTIFIED: Student identification confirmed:`,
        data,
      );
      console.log(
        `✅ [LRM-Socket] IDENTIFIED: Ready to receive lesson assignments for ${this.studentName}`,
      );
    });

    // New lesson assignment received
    this.socket.on("newLessonAssigned", (assignmentData) => {
      console.log(
        `🎆 [LRM-Socket] NEW-LESSON: Received new lesson assignment:`,
        assignmentData,
      );
      console.log(
        `🎆 [LRM-Socket] NEW-LESSON: Processing assignment for student: ${this.studentName}`,
      );
      this.handleNewLessonAssignment(assignmentData);
    });

    // Unit assignment received (multiple lessons)
    this.socket.on("unitAssignedToStudent", (unitData) => {
      console.log(
        `📚 [LRM-Socket] UNIT-ASSIGN: Unit assignment received:`,
        unitData,
      );
      console.log(
        `📚 [LRM-Socket] UNIT-ASSIGN: Processing unit for student: ${this.studentName}`,
      );
      this.handleUnitAssignment(unitData);
    });

    // Lesson update received
    this.socket.on("lessonUpdated", (lessonData) => {
      console.log("[LRM-Socket] Lesson update received:", lessonData);
      this.handleLessonUpdate(lessonData);
    });

    // Lesson removal notification
    this.socket.on("lessonRemoved", (lessonData) => {
      console.log("[LRM-Socket] Lesson removal notification:", lessonData);
      this.handleLessonRemoval(lessonData);
    });

    // Error handling
    this.socket.on("error", (error) => {
      console.error(`❌ [LRM-Socket] ERROR: Socket error occurred:`, error);
    });

    // Connection error
    this.socket.on("connect_error", (error) => {
      console.error(
        `❌ [LRM-Socket] CONNECT-ERROR: Failed to connect to lesson server:`,
        error,
      );
      console.error(
        `❌ [LRM-Socket] CONNECT-ERROR: Is the lesson server running on localhost:4000?`,
      );
    });

    // Assignment error
    this.socket.on("assignmentError", (error) => {
      console.error("[LRM-Socket] Assignment error:", error);
    });
  }

  /**
   * Handle new lesson assignment from teacher
   * @param {Object} assignmentData - The lesson assignment data
   */
  async handleNewLessonAssignment(assignmentData) {
    console.log(
      `🗺️ [LRM-Socket] HANDLER: Starting to process new lesson assignment`,
    );
    try {
      const { lessonData, unitData, teacherName, timestamp } = assignmentData;

      console.log(
        `🗺️ [LRM-Socket] HANDLER: Processing new lesson assignment: ${lessonData.name || lessonData.lesson_title}`,
      );
      console.log(
        `🗺️ [LRM-Socket] HANDLER: Assignment from teacher: ${teacherName}`,
      );
      console.log(
        `🗺️ [LRM-Socket] HANDLER: Assignment timestamp: ${timestamp}`,
      );

      // Add lesson to received lessons array (check for duplicates)
      console.log(`🗺️ [LRM-Socket] HANDLER: Adding lesson to UI collection`);

      // Check if lesson already exists to avoid duplicates
      const existingLesson = receivedLessons.find(
        (existing) =>
          existing._id === (lessonData._id || lessonData.id) ||
          existing.id === (lessonData._id || lessonData.id) ||
          existing.lesson_title === lessonData.lesson_title,
      );

      if (!existingLesson) {
        receivedLessons.push(lessonData);
        console.log(
          `✅ [LRM-Socket] HANDLER: Added new lesson: ${lessonData.lesson_title}`,
        );
      } else {
        console.log(
          `⚠️ [LRM-Socket] HANDLER: Lesson already exists, skipping: ${lessonData.lesson_title}`,
        );
      }

      // Update current profile with new assignment if not already there
      if (window.currentProfile) {
        if (!window.currentProfile.assignedUnitIds) {
          window.currentProfile.assignedUnitIds = [];
        }

        // Check if this unit is already assigned
        const existingUnit = window.currentProfile.assignedUnitIds.find(
          (unit) => unit.unitId === unitData.id,
        );

        if (!existingUnit) {
          const newUnit = {
            unitId: unitData.id,
            unitName: unitData.name,
            assignedBy: teacherName,
            assignedAt: new Date(timestamp),
            lessonIds: [lessonData._id || lessonData.id],
            assignmentType: "socket-received",
          };
          window.currentProfile.assignedUnitIds.push(newUnit);
          console.log(
            `🗺️ [LRM-Socket] HANDLER: Updated currentProfile with new unit: ${unitData.name}`,
          );
        } else {
          // Add lesson to existing unit if not already there
          const lessonId = lessonData._id || lessonData.id;
          if (!existingUnit.lessonIds.includes(lessonId)) {
            existingUnit.lessonIds.push(lessonId);
            console.log(
              `🗺️ [LRM-Socket] HANDLER: Added lesson to existing unit: ${lessonData.lesson_title}`,
            );
          }
        }
      }

      // Show notification to student
      this.showStudentNotification(
        "New Lesson Available!",
        `Your teacher ${teacherName} has assigned: ${lessonData.name || lessonData.lesson_title}`,
        "success",
      );

      // Trigger UI refresh using existing LRM functions
      console.log(
        `🗺️ [LRM-Socket] HANDLER: Refreshing UI with ${receivedLessons.length} lessons`,
      );
      this.refreshLessonUI();
    } catch (error) {
      console.error(
        "[LRM-Socket] Error handling new lesson assignment:",
        error,
      );
    }
  }

  /**
   * Handle unit assignment (multiple lessons)
   * @param {Object} unitData - The unit assignment data
   */
  async handleUnitAssignment(unitData) {
    try {
      const { unitName, unitId, lessons, teacherName, timestamp } = unitData;

      console.log(
        `📚 [LRM-Socket] UNIT: Processing unit assignment: "${unitName}" (ID: ${unitId}) with ${lessons.length} lessons`,
      );
      console.log(`📚 [LRM-Socket] UNIT: Unit data received:`, {
        unitId,
        unitName,
        teacherName,
        lessonCount: lessons.length,
      });

      // Add all lessons from the unit to our collection
      lessons.forEach((lesson) => {
        console.log(
          `📚 [LRM-Socket] UNIT: Adding lesson ${lesson.lesson_title} to collection`,
        );

        // Check if lesson already exists to avoid duplicates
        const existingLesson = receivedLessons.find(
          (existing) =>
            existing._id === lesson._id || existing.id === lesson.id,
        );

        if (!existingLesson) {
          receivedLessons.push(lesson);
        }
      });

      // Update current profile with unit assignment
      if (window.currentProfile) {
        console.log(
          `📚 [LRM-Socket] UNIT: window.currentProfile is available, updating assignedUnitIds`,
        );

        if (!window.currentProfile.assignedUnitIds) {
          window.currentProfile.assignedUnitIds = [];
          console.log(`📚 [LRM-Socket] UNIT: Created assignedUnitIds array`);
        }

        // Check if this unit is already assigned
        const existingUnit = window.currentProfile.assignedUnitIds.find(
          (unit) => unit.unitId === unitData.unitId,
        );

        if (!existingUnit) {
          const newUnitData = {
            unitId: unitData.unitId,
            unitName: unitData.unitName,
            assignedBy: teacherName,
            assignedAt: new Date(timestamp),
            lessonIds: lessons.map((lesson) => lesson._id || lesson.id),
            assignmentType: "socket-received",
          };

          window.currentProfile.assignedUnitIds.push(newUnitData);
          console.log(
            `📚 [LRM-Socket] UNIT: Added new unit to profile:`,
            newUnitData,
          );
          console.log(
            `📚 [LRM-Socket] UNIT: Total units now: ${window.currentProfile.assignedUnitIds.length}`,
          );
        } else {
          console.log(
            `📚 [LRM-Socket] UNIT: Unit ${unitData.unitName} already exists in profile`,
          );
        }
      } else {
        console.error(
          `❌ [LRM-Socket] UNIT: window.currentProfile is NOT available! Cannot update profile.`,
        );
        console.error(
          `❌ [LRM-Socket] UNIT: This will prevent unit header from updating.`,
        );
      }

      // Show unit notification
      this.showStudentNotification(
        "New Unit Available!",
        `Your teacher ${teacherName} has assigned unit: ${unitName} (${lessons.length} lessons)`,
        "success",
      );

      // Trigger UI refresh with all received lessons
      console.log(
        `📚 [LRM-Socket] UNIT: Refreshing UI with ${receivedLessons.length} total lessons`,
      );
      this.refreshLessonUI();
    } catch (error) {
      console.error("[LRM-Socket] Error handling unit assignment:", error);
    }
  }

  /**
   * Handle lesson update from teacher
   * @param {Object} lessonData - The updated lesson data
   */
  async handleLessonUpdate(lessonData) {
    try {
      console.log(
        `[LRM-Socket] Processing lesson update: ${lessonData.name || lessonData.lesson_title}`,
      );

      // Update lesson data in UI
      this.updateExistingLesson(lessonData);

      // If LRM instance is available, re-render the lesson
      if (
        this.lrmInstance &&
        typeof this.lrmInstance.updateLesson === "function"
      ) {
        await this.lrmInstance.updateLesson(lessonData);
      }

      // Show update notification
      this.showStudentNotification(
        "Lesson Updated",
        `Lesson "${lessonData.name || lessonData.lesson_title}" has been updated`,
        "info",
      );
    } catch (error) {
      console.error("[LRM-Socket] Error handling lesson update:", error);
    }
  }

  /**
   * Handle lesson removal notification
   * @param {Object} lessonData - The lesson to remove
   */
  handleLessonRemoval(lessonData) {
    try {
      console.log(
        `[LRM-Socket] Processing lesson removal: ${lessonData.name || lessonData.lesson_title}`,
      );

      // Remove lesson from UI
      this.updateLessonAvailability(lessonData, false);

      // If LRM instance is available, remove the lesson
      if (
        this.lrmInstance &&
        typeof this.lrmInstance.removeLesson === "function"
      ) {
        this.lrmInstance.removeLesson(lessonData);
      }

      // Show removal notification
      this.showStudentNotification(
        "Lesson Removed",
        `Lesson "${lessonData.name || lessonData.lesson_title}" is no longer available`,
        "warning",
      );
    } catch (error) {
      console.error("[LRM-Socket] Error handling lesson removal:", error);
    }
  }

  /**
   * Update lesson availability in the UI
   * @param {Object} lessonData - The lesson data
   * @param {boolean} isAvailable - Whether the lesson is available
   */
  updateLessonAvailability(lessonData, isAvailable) {
    const lessonId = lessonData.id || lessonData._id || lessonData.lesson_id;

    // Update lesson selector if it exists
    const lessonSelector = document.querySelector("#lessonSelect");
    if (lessonSelector) {
      if (isAvailable) {
        // Add lesson option if not already present
        if (!lessonSelector.querySelector(`option[value="${lessonId}"]`)) {
          const option = document.createElement("option");
          option.value = lessonId;
          option.textContent = lessonData.name || lessonData.lesson_title;
          option.dataset.lessonData = JSON.stringify(lessonData);
          lessonSelector.appendChild(option);
        }
      } else {
        // Remove lesson option
        const option = lessonSelector.querySelector(
          `option[value="${lessonId}"]`,
        );
        if (option) {
          option.remove();
        }
      }
    }

    // Update lesson list if it exists
    const lessonList = document.querySelector("#lessonList");
    if (lessonList) {
      if (isAvailable) {
        this.addLessonToList(lessonList, lessonData);
      } else {
        this.removeLessonFromList(lessonList, lessonId);
      }
    }
  }

  /**
   * Add lesson to lesson list UI
   * @param {HTMLElement} lessonList - The lesson list container
   * @param {Object} lessonData - The lesson data
   */
  addLessonToList(lessonList, lessonData) {
    const lessonId = lessonData.id || lessonData._id || lessonData.lesson_id;

    // Check if lesson already exists
    if (lessonList.querySelector(`[data-lesson-id="${lessonId}"]`)) {
      return; // Lesson already in list
    }

    // Create lesson item
    const lessonItem = document.createElement("div");
    lessonItem.className = "lesson-item";
    lessonItem.dataset.lessonId = lessonId;
    lessonItem.innerHTML = `
      <div class="lesson-info">
        <h4>${lessonData.name || lessonData.lesson_title}</h4>
        <p>${lessonData.description || "New lesson available"}</p>
      </div>
      <button class="start-lesson-btn" onclick="startLesson('${lessonId}')">Start Lesson</button>
    `;

    lessonList.appendChild(lessonItem);
  }

  /**
   * Remove lesson from lesson list UI
   * @param {HTMLElement} lessonList - The lesson list container
   * @param {string} lessonId - The lesson ID to remove
   */
  removeLessonFromList(lessonList, lessonId) {
    const lessonItem = lessonList.querySelector(
      `[data-lesson-id="${lessonId}"]`,
    );
    if (lessonItem) {
      lessonItem.remove();
    }
  }

  /**
   * Update existing lesson in UI
   * @param {Object} lessonData - The updated lesson data
   */
  updateExistingLesson(lessonData) {
    const lessonId = lessonData.id || lessonData._id || lessonData.lesson_id;

    // Update lesson selector option
    const option = document.querySelector(
      `#lessonSelect option[value="${lessonId}"]`,
    );
    if (option) {
      option.textContent = lessonData.name || lessonData.lesson_title;
      option.dataset.lessonData = JSON.stringify(lessonData);
    }

    // Update lesson list item
    const lessonItem = document.querySelector(`[data-lesson-id="${lessonId}"]`);
    if (lessonItem) {
      const titleElement = lessonItem.querySelector("h4");
      const descElement = lessonItem.querySelector("p");

      if (titleElement)
        titleElement.textContent = lessonData.name || lessonData.lesson_title;
      if (descElement)
        descElement.textContent = lessonData.description || "Updated lesson";
    }
  }

  /**
   * Show notification to student
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, info, warning, error)
   */
  showStudentNotification(title, message, type = "info") {
    // Try to use existing notification system
    if (window.showNotification) {
      window.showNotification(message, type);
      return;
    }

    // Fallback notification display
    console.log(`[LRM-Socket] ${title}: ${message}`);

    // Create simple notification if no system exists
    const notification = document.createElement("div");
    notification.className = `lrm-notification lrm-notification-${type}`;
    notification.innerHTML = `
      <strong>${title}</strong><br>
      ${message}
    `;

    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === "success" ? "#4CAF50" : type === "warning" ? "#FF9800" : "#2196F3"};
      color: white;
      padding: 15px;
      border-radius: 8px;
      z-index: 9999;
      max-width: 300px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  /**
   * Refresh the lesson UI using existing LRM functions
   */
  refreshLessonUI() {
    console.log(
      `🔄 [LRM-Socket] REFRESH: Starting UI refresh with ${receivedLessons.length} lessons`,
    );

    // Log current profile state for debugging
    if (window.currentProfile && window.currentProfile.assignedUnitIds) {
      console.log(
        `🔄 [LRM-Socket] REFRESH: Profile has ${window.currentProfile.assignedUnitIds.length} assigned units`,
        window.currentProfile.assignedUnitIds,
      );
    }

    try {
      // Import and use the existing LRM rendering functions
      import("./lessonRenderer.js")
        .then(({ renderLessonButtons, renderUnitHeader }) => {
          console.log(
            `🔄 [LRM-Socket] REFRESH: LRM functions imported successfully`,
          );
          console.log(
            `🔄 [LRM-Socket] REFRESH: renderUnitHeader function available: ${typeof renderUnitHeader}`,
          );
          console.log(
            `🔄 [LRM-Socket] REFRESH: window.currentProfile exists: ${!!window.currentProfile}`,
          );

          // Debug currentProfile state
          if (window.currentProfile) {
            console.log(
              `🔄 [LRM-Socket] REFRESH: currentProfile memberName: ${window.currentProfile.memberName}`,
            );
            console.log(
              `🔄 [LRM-Socket] REFRESH: assignedUnitIds exists: ${!!window.currentProfile.assignedUnitIds}`,
            );
            console.log(
              `🔄 [LRM-Socket] REFRESH: assignedUnitIds count: ${window.currentProfile.assignedUnitIds?.length || 0}`,
            );
            if (
              window.currentProfile.assignedUnitIds &&
              window.currentProfile.assignedUnitIds.length > 0
            ) {
              console.log(
                `🔄 [LRM-Socket] REFRESH: Latest unit:`,
                window.currentProfile.assignedUnitIds[
                  window.currentProfile.assignedUnitIds.length - 1
                ],
              );
            }
          }

          // Always try to update unit header if function is available
          if (renderUnitHeader) {
            console.log(`🔄 [LRM-Socket] REFRESH: Calling renderUnitHeader`);
            try {
              renderUnitHeader(window.currentProfile);
              console.log(
                `✅ [LRM-Socket] REFRESH: renderUnitHeader completed`,
              );
            } catch (headerError) {
              console.error(
                `❌ [LRM-Socket] REFRESH: renderUnitHeader failed:`,
                headerError,
              );
            }
          } else {
            console.warn(
              `⚠️ [LRM-Socket] REFRESH: renderUnitHeader function not available`,
            );
          }

          // Render lesson buttons with received lessons
          if (renderLessonButtons && receivedLessons.length > 0) {
            console.log(
              `🔄 [LRM-Socket] REFRESH: Rendering ${receivedLessons.length} lesson buttons`,
            );
            renderLessonButtons(receivedLessons, window.currentProfile);
          } else {
            console.log(
              `🔄 [LRM-Socket] REFRESH: No lessons to render or function not available`,
            );
          }

          console.log(
            `✅ [LRM-Socket] REFRESH: UI refresh completed successfully`,
          );
        })
        .catch((error) => {
          console.error(
            `❌ [LRM-Socket] REFRESH: Failed to import LRM functions:`,
            error,
          );
        });
    } catch (error) {
      console.error(`❌ [LRM-Socket] REFRESH: Error during UI refresh:`, error);
    }

    // Trigger custom event for UI refresh (fallback)
    const refreshEvent = new CustomEvent("lessonUIRefresh", {
      detail: {
        source: "lessonAssignmentSocket",
        lessons: receivedLessons,
        profile: window.currentProfile,
      },
    });
    document.dispatchEvent(refreshEvent);
  }

  /**
   * Set LRM instance for UI updates
   * @param {Object} lrmInstance - The LRM instance
   */
  setLRMInstance(lrmInstance) {
    this.lrmInstance = lrmInstance;
  }

  /**
   * Disconnect from lesson server
   */
  disconnect() {
    if (this.socket && this.isConnected) {
      console.log("[LRM-Socket] Disconnecting from lesson server");
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean} - Connection status
   */
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  /**
   * Get current student name
   * @returns {string} - Student name
   */
  getStudentName() {
    return this.studentName;
  }
}

// Create singleton instance
const lessonAssignmentSocket = new LessonAssignmentSocket();

// Export for use in other modules
export default lessonAssignmentSocket;

// Also export the class for potential multiple instances
export { LessonAssignmentSocket };

// Export initialization function for easy setup
export function initializeLessonAssignmentSocket(studentName, lrmInstance) {
  console.log(
    `🎯 [LRM-Socket] EXPORT: initializeLessonAssignmentSocket called with student: ${studentName}`,
  );

  if (!studentName) {
    console.error(
      `❌ [LRM-Socket] EXPORT: Student name is required for initialization`,
    );
    return null;
  }

  console.log(
    `🎯 [LRM-Socket] EXPORT: Calling lessonAssignmentSocket.initialize`,
  );
  lessonAssignmentSocket.initialize(studentName, lrmInstance);

  console.log(`✅ [LRM-Socket] EXPORT: Returning socket instance`);
  return lessonAssignmentSocket;
}

// Make it globally available for non-module usage
if (typeof window !== "undefined") {
  window.lessonAssignmentSocket = lessonAssignmentSocket;
  window.initializeLessonAssignmentSocket = initializeLessonAssignmentSocket;
}

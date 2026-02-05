/**
 * Quick Time Mode Module
 * ======================
 * Frontend module for displaying and managing Quick Time mode
 * Only visible and functional for sample student accounts
 */

"use strict";

import { currentProfile } from "./script.js";

class QuickTimeMode {
  constructor() {
    this.isEnabled = false;
    this.isLoading = true;
    this.apiUrl = "https://tcstudentserver-production.up.railway.app";
    this.socket = io(this.apiUrl);
    this.statusElement = null;
    this.containerElement = null;
  }

  /**
   * Check if the current user is a sample user
   */
  isSampleUser(username) {
    return username && username.toLowerCase().includes("sample");
  }

  /**
   * Initialize quick time mode display and functionality
   */
  async initialize(username) {
    if (!username) {
      console.log(
        "⏱️  [QuickTimeMode] No username provided, skipping initialization",
      );
      return;
    }

    if (!this.isSampleUser(username)) {
      console.log(
        `ℹ️  [QuickTimeMode] "${username}" is not a sample user - Quick Time mode disabled`,
      );
      return;
    }

    console.log(
      `⏱️  [QuickTimeMode] Initializing Quick Time mode for: ${username}`,
    );

    // Create UI elements
    this.createQuickTimeModeUI();

    // Load quick time status
    await this.loadQuickTimeStatus(username);

    // Listen for quick time events
    this.setupEventListeners(username);
  }

  /**
   * Create the quick time mode UI elements
   */
  createQuickTimeModeUI() {
    // Check if container already exists
    if (document.querySelector(".quick-time-container")) {
      this.containerElement = document.querySelector(".quick-time-container");
      return;
    }

    // Create container
    const container = document.createElement("div");
    container.className = "quick-time-container";
    container.innerHTML = `
      <div class="quick-time-indicator" title="Quick Time Mode: 1 second = 1 day">
        <div class="quick-time-badge">
          <span class="quick-time-icon">⏱️</span>
          <span class="quick-time-label">Quick Time</span>
          <span class="quick-time-status">ENABLED</span>
        </div>
        <div class="quick-time-info">
          <p class="quick-time-description">
            <strong>Accelerated Mode Active</strong>
            <br>
            1 second = 1 day
            <br>
            <small>Weekly: 7 sec | Bi-weekly: 14 sec | Monthly: 30 sec</small>
          </p>
        </div>
      </div>
    `;

    // Style the container
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      font-family: Arial, sans-serif;
    `;

    // Add styles for child elements
    const style = document.createElement("style");
    style.textContent = `
      .quick-time-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 8px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .quick-time-badge:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
      }

      .quick-time-icon {
        font-size: 18px;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      .quick-time-label {
        font-size: 14px;
      }

      .quick-time-status {
        font-size: 12px;
        background: rgba(255, 255, 255, 0.3);
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }

      .quick-time-info {
        display: none;
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        background: white;
        border: 2px solid #667eea;
        border-radius: 8px;
        padding: 12px;
        width: 250px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .quick-time-badge:hover + .quick-time-info {
        display: block;
      }

      .quick-time-info p {
        margin: 0;
        font-size: 13px;
        color: #333;
        line-height: 1.5;
      }

      .quick-time-info strong {
        color: #667eea;
      }

      .quick-time-info small {
        color: #666;
        display: block;
        margin-top: 6px;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(container);
    this.containerElement = container;
  }

  /**
   * Load and display quick time status
   */
  async loadQuickTimeStatus(username) {
    try {
      const response = await fetch(
        `${this.apiUrl}/quicktime/status/${encodeURIComponent(username)}`,
      );

      if (!response.ok) {
        console.warn("⏱️  [QuickTimeMode] Could not fetch quick time status");
        return;
      }

      const status = await response.json();
      console.log("⏱️  [QuickTimeMode] Status:", status);

      this.isEnabled = status.isEnabled;
      this.updateUIStatus(this.isEnabled);

      if (this.isEnabled) {
        console.log(
          `✅ [QuickTimeMode] Quick Time mode is ACTIVE for ${username}`,
        );
      } else {
        console.log(
          `⏱️  [QuickTimeMode] Quick Time mode is not yet active for ${username}`,
        );
      }
    } catch (error) {
      console.error(
        "⏱️  [QuickTimeMode] Error loading quick time status:",
        error,
      );
    }
  }

  /**
   * Update the UI to reflect quick time status
   */
  updateUIStatus(isEnabled) {
    if (!this.containerElement) return;

    const statusElement =
      this.containerElement.querySelector(".quick-time-status");
    if (statusElement) {
      statusElement.textContent = isEnabled ? "ENABLED" : "DISABLED";
      statusElement.style.background = isEnabled
        ? "rgba(76, 175, 80, 0.3)"
        : "rgba(244, 67, 54, 0.3)";
      statusElement.style.color = isEnabled ? "#4CAF50" : "#F44336";
    }

    const badge = this.containerElement.querySelector(".quick-time-badge");
    if (badge) {
      badge.style.background = isEnabled
        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        : "linear-gradient(135deg, #999 0%, #666 100%)";
    }
  }

  /**
   * Setup socket event listeners for real-time updates
   */
  setupEventListeners(username) {
    // Listen for transaction processed events
    this.socket.on("transactionProcessed", (data) => {
      if (data.quickTimeMode) {
        console.log(
          `⏱️  [QuickTimeMode] ${data.type} processed in quick time:`,
          data,
        );

        // Show notification to user
        this.showQuickTimeNotification(data);
      }
    });

    // Listen for checking account updates
    this.socket.on("checkingAccountUpdate", (account) => {
      if (account && account.balance !== undefined) {
        console.log(
          `💰 [QuickTimeMode] Account updated. New balance: $${account.balance}`,
        );
      }
    });
  }

  /**
   * Show a notification when a quick time transaction is processed
   */
  showQuickTimeNotification(data) {
    const { type, name, amount, newBalance } = data;

    const notification = document.createElement("div");
    notification.className = "quick-time-notification";
    notification.innerHTML = `
      <div class="quick-time-notification-content">
        <span class="notification-icon">⏱️</span>
        <div class="notification-text">
          <strong>${type === "bill" ? "Bill Paid" : "Paycheck Received"}</strong>
          <p>${name}: ${type === "bill" ? "-" : "+"}$${amount}</p>
          <small>New Balance: $${newBalance}</small>
        </div>
        <button class="notification-close">&times;</button>
      </div>
    `;

    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: white;
      border-left: 4px solid ${type === "bill" ? "#F44336" : "#4CAF50"};
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: Arial, sans-serif;
      font-size: 13px;
      z-index: 9998;
      max-width: 280px;
      animation: slideIn 0.3s ease;
    `;

    // Add animation style
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(-300px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .quick-time-notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .notification-icon {
        font-size: 20px;
      }

      .notification-text {
        flex: 1;
      }

      .notification-text strong {
        display: block;
        color: #333;
        margin-bottom: 4px;
      }

      .notification-text p {
        margin: 0;
        color: #666;
      }

      .notification-text small {
        display: block;
        color: #999;
        margin-top: 4px;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .notification-close:hover {
        color: #333;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Close button handler
    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.addEventListener("click", () => notification.remove());

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Disable quick time mode (cleanup on logout)
   */
  disable() {
    console.log("⏱️  [QuickTimeMode] Disabling Quick Time mode");
    this.isEnabled = false;
    if (this.containerElement) {
      this.updateUIStatus(false);
    }
  }
}

// Export singleton instance
export const quickTimeMode = new QuickTimeMode();

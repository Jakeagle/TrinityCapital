/**
 * Sample User Reset Helper - Student Frontend
 * ============================================
 * Handles sample user data cleanup when logging out or leaving the page
 *
 * Automatically detects if user is a sample user and triggers data reset
 */

class SampleUserResetHelper {
  constructor(apiBaseUrl = "http://localhost:3000") {
    this.apiBaseUrl = apiBaseUrl;
    this.resetInProgress = false;
  }

  /**
   * Checks if a username is a sample user
   */
  isSampleUser(username) {
    return username && username.toLowerCase().includes("sample");
  }

  /**
   * Resets sample user data when they log out or leave
   * Should be called during logout and unload events
   */
  async resetSampleUserDataIfNeeded(username) {
    if (!this.isSampleUser(username) || this.resetInProgress) {
      return { skipped: true, reason: "not_sample_user" };
    }

    this.resetInProgress = true;

    try {
      console.log(
        `🗑️  [SampleUserResetHelper] Resetting sample user data for: ${username}`,
      );

      const response = await fetch(`${this.apiBaseUrl}/sample/reset-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          userType: "student",
        }),
        // Use sendBeacon if available for unload events (more reliable)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(
          `✅ [SampleUserResetHelper] Sample data reset successful:`,
          result,
        );
        return { success: true, result };
      } else {
        console.warn(
          `⚠️  [SampleUserResetHelper] Server returned error:`,
          response.status,
        );
        return { success: false, reason: "server_error" };
      }
    } catch (error) {
      console.error(
        `❌ [SampleUserResetHelper] Error resetting sample data:`,
        error,
      );
      return { success: false, reason: "fetch_error", error: error.message };
    } finally {
      this.resetInProgress = false;
    }
  }

  /**
   * Reset using sendBeacon (for unload events)
   * This is more reliable during page unload
   */
  resetSampleUserWithBeacon(username) {
    if (!this.isSampleUser(username)) {
      return false;
    }

    try {
      const payload = JSON.stringify({
        username: username,
        userType: "student",
      });

      const sent = navigator.sendBeacon(
        `${this.apiBaseUrl}/sample/reset-data`,
        new Blob([payload], { type: "application/json" }),
      );

      if (sent) {
        console.log(
          `📡 [SampleUserResetHelper] Sent reset request via sendBeacon for: ${username}`,
        );
      }
      return sent;
    } catch (error) {
      console.error(`❌ [SampleUserResetHelper] Error with sendBeacon:`, error);
      return false;
    }
  }

  /**
   * Setup handlers for logout and page unload
   * Call this during app initialization
   */
  setupResetHandlers(getCurrentUsername) {
    // Handle logout button
    const logOutButton = document.querySelector(".logOutBTN");
    if (logOutButton) {
      logOutButton.addEventListener("click", async (e) => {
        const username = getCurrentUsername();
        if (this.isSampleUser(username)) {
          console.log(
            `[SampleUserResetHelper] Logout detected for sample user: ${username}`,
          );
          // The reset will be called in the logout handler as part of the flow
        }
      });
    }

    // Handle page unload/refresh/close
    window.addEventListener("beforeunload", (e) => {
      const username = getCurrentUsername();
      if (this.isSampleUser(username)) {
        console.log(
          `[SampleUserResetHelper] Page unload detected for sample user: ${username}`,
        );
        this.resetSampleUserWithBeacon(username);
      }
    });

    // Handle visibility change (tab/window blur)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        const username = getCurrentUsername();
        if (this.isSampleUser(username)) {
          console.log(
            `[SampleUserResetHelper] Page hidden for sample user: ${username}`,
          );
          // Reset data when user leaves the page
          this.resetSampleUserWithBeacon(username);
        }
      }
    });

    console.log("✅ [SampleUserResetHelper] Reset handlers initialized");
  }
}

// Export for use in script.js
if (typeof window !== "undefined") {
  window.SampleUserResetHelper = SampleUserResetHelper;
}

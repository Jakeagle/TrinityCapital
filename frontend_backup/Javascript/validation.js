export function validateText(text, options) {
  const errors = [];
  if (options.required && !text) {
    errors.push(`${options.fieldName} is required.`);
  }
  if (options.minLength && text.length < options.minLength) {
    errors.push(
      `${options.fieldName} must be at least ${options.minLength} characters.`
    );
  }
  if (options.maxLength && text.length > options.maxLength) {
    errors.push(
      `${options.fieldName} must be no more than ${options.maxLength} characters.`
    );
  }
  return errors;
}

export function validateAmount(amount, options) {
  const errors = [];
  if (isNaN(amount)) {
    errors.push(`${options.fieldName} must be a number.`);
  }
  if (options.min && amount < options.min) {
    errors.push(`${options.fieldName} must be at least ${options.min}.`);
  }
  if (options.max && amount > options.max) {
    errors.push(`${options.fieldName} must be no more than ${options.max}.`);
  }
  return errors;
}

export function validateSelection(value, options) {
  const errors = [];
  if (!value) {
    errors.push(`${options.fieldName} is required.`);
  }
  return errors;
}

export function validateDate(date, options) {
  const errors = [];
  if (!date) {
    errors.push(`${options.fieldName} is required.`);
  }
  // Add more date validation logic here if needed
  return errors;
}

export function validateSignature(signature, expectedSignature, fieldName) {
  const errors = [];
  if (!signature) {
    errors.push(`${fieldName} is required.`);
  }
  if (signature !== expectedSignature) {
    errors.push(`Invalid ${fieldName}.`);
  }
  return errors;
}

export function validateForm(rules) {
  const errors = [];
  for (const rule of rules) {
    for (const validation of rule.validations) {
      const error = validation(rule.value);
      if (error && error.length > 0) {
        errors.push(...error);
      }
    }
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * Sets a button's loading state and updates its text/icon accordingly
 * @param {HTMLButtonElement} button - The button element to update
 * @param {boolean} isLoading - Whether the button should show loading state
 * @param {string} originalText - The original button text to restore when not loading
 */
export function setButtonLoading(button, isLoading, originalText) {
  if (isLoading) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  } else {
    button.disabled = false;
    button.innerHTML = originalText;
  }
}

/**
 * Shows a notification message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success', 'error', 'warning', 'info')
 * @param {number} [duration=3000] - How long to show the notification in milliseconds
 */
export function showNotification(message, type = "info", duration = 3000) {
  // Remove any existing notifications
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification--${type}`;

  // Add icon based on type
  let icon = "";
  switch (type) {
    case "success":
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case "error":
      icon = '<i class="fas fa-times-circle"></i>';
      break;
    case "warning":
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle"></i>';
  }

  notification.innerHTML = `
    ${icon}
    <span class="notification__message">${message}</span>
    <button class="notification__close">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Add to document
  document.body.appendChild(notification);

  // Add close button handler
  const closeButton = notification.querySelector(".notification__close");
  if (closeButton) {
    closeButton.addEventListener("click", () => notification.remove());
  }

  // Auto remove after duration
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, duration);
}

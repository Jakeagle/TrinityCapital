export function validateText(text, options) {
  const errors = [];
  if (options.required && !text) {
    errors.push(`${options.fieldName} is required.`);
  }
  if (options.minLength && text.length < options.minLength) {
    errors.push(`${options.fieldName} must be at least ${options.minLength} characters.`);
  }
  if (options.maxLength && text.length > options.maxLength) {
    errors.push(`${options.fieldName} must be no more than ${options.maxLength} characters.`);
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

import { ConvexError } from "convex/values";

/**
 * Validates that a value exists (not null or undefined)
 * @param value - The value to check
 * @param errorMessage - Custom error message
 * @throws ConvexError if the value doesn't exist
 */
export const validateExists = <T>(
  value: T | null | undefined,
  errorMessage = "Required value not found",
): T => {
  if (value === null || value === undefined) {
    throw new ConvexError(errorMessage);
  }
  return value;
};

/**
 * Validates that a string is not empty
 * @param value - The string to check
 * @param errorMessage - Custom error message
 * @throws ConvexError if the string is empty
 */
export const validateNonEmptyString = (
  value: string | null | undefined,
  errorMessage = "String cannot be empty",
): string => {
  const validatedValue = validateExists(value, errorMessage);
  if (validatedValue.trim() === "") {
    throw new ConvexError(errorMessage);
  }
  return validatedValue;
};

/**
 * Validates that a number is within a specified range
 * @param value - The number to check
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @param errorMessage - Custom error message
 * @throws ConvexError if the number is outside the range
 */
export const validateNumberInRange = (
  value: number,
  min: number,
  max: number,
  errorMessage = `Value must be between ${min} and ${max}`,
): number => {
  if (value < min || value > max) {
    throw new ConvexError(errorMessage);
  }
  return value;
};

/**
 * Validates that an array has items
 * @param array - The array to check
 * @param errorMessage - Custom error message
 * @throws ConvexError if the array is empty
 */
export const validateNonEmptyArray = <T>(
  array: T[] | null | undefined,
  errorMessage = "Array cannot be empty",
): T[] => {
  const validatedArray = validateExists(array, errorMessage);
  if (validatedArray.length === 0) {
    throw new ConvexError(errorMessage);
  }
  return validatedArray;
};

/**
 * Validates that a document exists in the database
 * @param doc - The document to check
 * @param errorMessage - Custom error message
 * @throws ConvexError if the document doesn't exist
 */
export const validateDocumentExists = <T>(
  doc: T | null | undefined,
  errorMessage = "Document not found",
): T => {
  return validateExists(doc, errorMessage);
};

/**
 * Validates an email string
 * @param email - The email to validate
 * @param errorMessage - Custom error message
 * @throws ConvexError if the email is invalid
 */
export const validateEmail = (
  email: string,
  errorMessage = "Invalid email format",
): string => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new ConvexError(errorMessage);
  }
  return email;
};

/**
 * Validates a URL string
 * @param url - The URL to validate
 * @param errorMessage - Custom error message
 * @throws ConvexError if the URL is invalid
 */
export const validateUrl = (
  url: string,
  errorMessage = "Invalid URL format",
): string => {
  const urlRegex = /^https?:\/\/.+$/;
  if (!urlRegex.test(url)) {
    throw new ConvexError(errorMessage);
  }
  return url;
};

/**
 * Validates a phone number string
 * @param phoneNumber - The phone number to validate
 * @param errorMessage - Custom error message
 * @throws ConvexError if the phone number is invalid
 */
export const validatePhoneNumber = (
  phoneNumber: string,
  errorMessage = "Invalid phone number format",
): string => {
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new ConvexError(errorMessage);
  }
  return phoneNumber;
};

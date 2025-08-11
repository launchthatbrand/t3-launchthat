import { ConvexError } from "convex/values";
/**
 * Validates that a value exists (not null or undefined)
 * @param value - The value to check
 * @param errorMessage - Custom error message
 * @throws ConvexError if the value doesn't exist
 */
export const validateExists = (value, errorMessage = "Required value not found") => {
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
export const validateNonEmptyString = (value, errorMessage = "String cannot be empty") => {
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
export const validateNumberInRange = (value, min, max, errorMessage = `Value must be between ${min} and ${max}`) => {
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
export const validateNonEmptyArray = (array, errorMessage = "Array cannot be empty") => {
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
export const validateDocumentExists = (doc, errorMessage = "Document not found") => {
    return validateExists(doc, errorMessage);
};
/**
 * Validates an email string
 * @param email - The email to validate
 * @param errorMessage - Custom error message
 * @throws ConvexError if the email is invalid
 */
export const validateEmail = (email, errorMessage = "Invalid email format") => {
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
export const validateUrl = (url, errorMessage = "Invalid URL format") => {
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
export const validatePhoneNumber = (phoneNumber, errorMessage = "Invalid phone number format") => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
        throw new ConvexError(errorMessage);
    }
    return phoneNumber;
};

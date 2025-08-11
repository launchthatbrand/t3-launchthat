/**
 * Formats a date as a string using the specified locale and options
 * @param date - The date to format
 * @param locale - The locale to use (default: 'en-US')
 * @param options - Intl.DateTimeFormatOptions
 * @returns The formatted date string
 */
export const formatDate = (date, locale = "en-US", options = {
    year: "numeric",
    month: "long",
    day: "numeric",
}) => {
    const dateToFormat = typeof date === "number" ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateToFormat);
};
/**
 * Formats a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale to use (default: 'en-US')
 * @returns The formatted currency string
 */
export const formatCurrency = (amount, currency = "USD", locale = "en-US") => {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
    }).format(amount);
};
/**
 * Formats a number with the specified options
 * @param number - The number to format
 * @param locale - The locale to use (default: 'en-US')
 * @param options - Intl.NumberFormatOptions
 * @returns The formatted number string
 */
export const formatNumber = (number, locale = "en-US", options = {}) => {
    return new Intl.NumberFormat(locale, options).format(number);
};
/**
 * Truncates a string to the specified length and adds an ellipsis if needed
 * @param str - The string to truncate
 * @param maxLength - The maximum length
 * @returns The truncated string
 */
export const truncateString = (str, maxLength) => {
    if (str.length <= maxLength)
        return str;
    return str.slice(0, maxLength) + "...";
};
/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes - The file size in bytes
 * @param decimals - The number of decimal places (default: 2)
 * @returns The formatted file size string
 */
export const formatFileSize = (bytes, decimals = 2) => {
    if (bytes === 0)
        return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]);
};
/**
 * Formats a phone number to a standard format
 * @param phoneNumber - The phone number to format
 * @returns The formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
    // Simple US phone number formatting
    // For international numbers, consider using a library like libphonenumber-js
    const cleaned = phoneNumber.replace(/\D/g, "");
    const regex = /^(\d{3})(\d{3})(\d{4})$/;
    const match = regex.exec(cleaned);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phoneNumber;
};

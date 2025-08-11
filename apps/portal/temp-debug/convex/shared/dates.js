/**
 * Get the current timestamp in milliseconds
 * @returns The current timestamp
 */
export const getCurrentTimestamp = () => {
    return Date.now();
};
/**
 * Calculate the difference between two dates in days
 * @param date1 - The first date
 * @param date2 - The second date (default: current date)
 * @returns The difference in days
 */
export const getDaysDifference = (date1, date2 = Date.now()) => {
    const d1 = typeof date1 === "number" ? date1 : date1.getTime();
    const d2 = typeof date2 === "number" ? date2 : date2.getTime();
    return Math.floor(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
};
/**
 * Check if a date is in the past
 * @param date - The date to check
 * @returns True if the date is in the past
 */
export const isDateInPast = (date) => {
    const dateToCheck = typeof date === "number" ? date : date.getTime();
    return dateToCheck < Date.now();
};
/**
 * Check if a date is in the future
 * @param date - The date to check
 * @returns True if the date is in the future
 */
export const isDateInFuture = (date) => {
    const dateToCheck = typeof date === "number" ? date : date.getTime();
    return dateToCheck > Date.now();
};
/**
 * Check if a date is today
 * @param date - The date to check
 * @returns True if the date is today
 */
export const isToday = (date) => {
    const dateToCheck = new Date(date);
    const today = new Date();
    return (dateToCheck.getDate() === today.getDate() &&
        dateToCheck.getMonth() === today.getMonth() &&
        dateToCheck.getFullYear() === today.getFullYear());
};
/**
 * Add days to a date
 * @param date - The starting date
 * @param days - The number of days to add
 * @returns The new date
 */
export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
/**
 * Add months to a date
 * @param date - The starting date
 * @param months - The number of months to add
 * @returns The new date
 */
export const addMonths = (date, months) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
};
/**
 * Get the start of a day (midnight)
 * @param date - The date
 * @returns The start of the day
 */
export const startOfDay = (date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
};
/**
 * Get the end of a day (23:59:59.999)
 * @param date - The date
 * @returns The end of the day
 */
export const endOfDay = (date) => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
};

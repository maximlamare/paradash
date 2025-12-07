/**
 * Common date formatting utilities for ParaDash
 */

/**
 * Format a date string to DD-MM-YYYY format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date or "Not specified"
 */
export function formatDate(dateString) {
  if (!dateString) return "Not specified";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format a date string to a readable format with weekday
 * Example: "Monday 15th January 2024"
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date with weekday
 */
export function formatDateWithWeekday(dateString) {
  const date = new Date(dateString);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const year = date.getFullYear();

  // Add ordinal suffix to day
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `${weekday} ${day}${getOrdinalSuffix(day)} ${month} ${year}`;
}

/**
 * Format a date string to short format (e.g., "Jan 15, 2024")
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDateShort(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}


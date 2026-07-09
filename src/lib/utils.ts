/**
 * Calculates the average progress of a list of tasks.
 * @param tasks - Array of tasks with a progress property.
 * @returns The rounded average progress percentage (0-100).
 */
export function calculateProgress(tasks: { progress: number }[] | undefined | null): number {
  if (!tasks || tasks.length === 0) return 0;
  const sum = tasks.reduce((acc, t) => acc + t.progress, 0);
  return Math.round(sum / tasks.length);
}

/**
 * Formats a date string safely, returning "N/D" for invalid dates or 1970 zero-time errors.
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/D";

  const date = new Date(dateString);

  // Check if it's an invalid date
  if (isNaN(date.getTime())) return "N/D";

  // Also check if it resolved to Unix epoch (Jan 1, 1970) which means the original data was 0 or a falsy equivalent
  if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
    return "N/D";
  }

  return date.toLocaleDateString("it-IT");
}

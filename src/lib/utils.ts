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

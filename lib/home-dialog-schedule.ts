export const HOME_DIALOG_INTERVAL_MS = 60 * 60 * 1000;

/**
 * @param intervalMs délai avant réaffichage ; 0 = à chaque visite.
 */
export function shouldShowHomeDialog(
  lastShownAt: number | null,
  now: number,
  intervalMs: number = HOME_DIALOG_INTERVAL_MS,
): boolean {
  if (lastShownAt === null || !Number.isFinite(lastShownAt)) {
    return true;
  }

  return now - lastShownAt >= intervalMs;
}

export function getHomeDialogDelay(
  lastShownAt: number | null,
  now: number,
  intervalMs: number = HOME_DIALOG_INTERVAL_MS,
): number {
  if (shouldShowHomeDialog(lastShownAt, now, intervalMs)) {
    return 0;
  }

  if (lastShownAt === null || !Number.isFinite(lastShownAt)) {
    return 0;
  }

  const elapsed = now - lastShownAt;

  return Math.max(intervalMs - elapsed, 0);
}

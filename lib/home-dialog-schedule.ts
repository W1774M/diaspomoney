export const HOME_DIALOG_INTERVAL_MS = 60 * 60 * 1000;

export function shouldShowHomeDialog(
  lastShownAt: number | null,
  now: number,
): boolean {
  if (lastShownAt === null || !Number.isFinite(lastShownAt)) {
    return true;
  }

  return now - lastShownAt >= HOME_DIALOG_INTERVAL_MS;
}

export function getHomeDialogDelay(
  lastShownAt: number | null,
  now: number,
): number {
  if (shouldShowHomeDialog(lastShownAt, now)) {
    return 0;
  }

  if (lastShownAt === null || !Number.isFinite(lastShownAt)) {
    return 0;
  }

  const elapsed = now - lastShownAt;

  return Math.max(HOME_DIALOG_INTERVAL_MS - elapsed, 0);
}

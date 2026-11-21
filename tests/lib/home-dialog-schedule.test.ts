import { describe, expect, it } from 'vitest';

import {
  getHomeDialogDelay,
  HOME_DIALOG_INTERVAL_MS,
  shouldShowHomeDialog,
} from '../../lib/home-dialog-schedule';

describe('shouldShowHomeDialog', () => {
  it('shows the dialog when it has never been shown', () => {
    expect(shouldShowHomeDialog(null, 1_000)).toBe(true);
  });

  it('does not show the dialog before one hour has elapsed', () => {
    expect(shouldShowHomeDialog(1_000, 1_000 + HOME_DIALOG_INTERVAL_MS - 1)).toBe(false);
  });

  it('shows the dialog again once one hour has elapsed', () => {
    expect(shouldShowHomeDialog(1_000, 1_000 + HOME_DIALOG_INTERVAL_MS)).toBe(true);
  });

  it('shows the dialog when the stored timestamp is invalid', () => {
    expect(shouldShowHomeDialog(Number.NaN, 1_000)).toBe(true);
  });
});

describe('getHomeDialogDelay', () => {
  it('returns zero when the dialog should be shown now', () => {
    expect(getHomeDialogDelay(null, 1_000)).toBe(0);
  });

  it('returns the remaining delay before one hour has elapsed', () => {
    expect(getHomeDialogDelay(1_000, 1_000 + 10_000)).toBe(
      HOME_DIALOG_INTERVAL_MS - 10_000,
    );
  });
});

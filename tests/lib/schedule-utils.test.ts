import { describe, expect, it } from 'vitest';
import {
  daySlotsToRules,
  rulesToDaySlots,
  summarizeRules,
} from '@/components/availabilities/schedule-utils';

describe('schedule-utils', () => {
  it('round-trip rules ↔ daySlots', () => {
    const rules = [
      { days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' },
      { days: [1], start: '18:00', end: '20:00' },
    ];
    const slots = rulesToDaySlots(rules);
    expect(slots[1]).toEqual([
      { start: '09:00', end: '17:00' },
      { start: '18:00', end: '20:00' },
    ]);
    expect(slots[0]).toEqual([]);
    const back = daySlotsToRules(slots);
    expect(back).toContainEqual({
      days: [1, 2, 3, 4, 5],
      start: '09:00',
      end: '17:00',
    });
    expect(back).toContainEqual({ days: [1], start: '18:00', end: '20:00' });
  });

  it('summarizeRules produit un résumé lisible', () => {
    const summary = summarizeRules([
      { days: [1, 2], start: '09:00', end: '12:00' },
    ]);
    expect(summary).toContain('Lun');
    expect(summary).toContain('09:00');
  });
});

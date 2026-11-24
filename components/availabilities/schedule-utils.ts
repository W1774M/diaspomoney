import type {
  ScheduleOverride,
  ScheduleTimeRange,
  ScheduleWeeklyRule,
} from '@/lib/types/schedule.types';

export const DAYS_OF_WEEK = [
  { index: 0, label: 'Dimanche', short: 'Dim' },
  { index: 1, label: 'Lundi', short: 'Lun' },
  { index: 2, label: 'Mardi', short: 'Mar' },
  { index: 3, label: 'Mercredi', short: 'Mer' },
  { index: 4, label: 'Jeudi', short: 'Jeu' },
  { index: 5, label: 'Vendredi', short: 'Ven' },
  { index: 6, label: 'Samedi', short: 'Sam' },
] as const;

/** Ordre d’affichage type Cal.com : lundi → dimanche */
export const DISPLAY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export type DaySlotsState = Record<number, ScheduleTimeRange[]>;

export function rulesToDaySlots(rules: ScheduleWeeklyRule[]): DaySlotsState {
  const state: DaySlotsState = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };
  for (const rule of rules) {
    for (const day of rule.days) {
      if (day < 0 || day > 6) continue;
      state[day] = [
        ...(state[day] || []),
        { start: rule.start, end: rule.end },
      ];
    }
  }
  return state;
}

/** Compacte les plages par jour en rules coss (même start/end regroupés). */
export function daySlotsToRules(daySlots: DaySlotsState): ScheduleWeeklyRule[] {
  const bucket = new Map<string, number[]>();
  for (let day = 0; day <= 6; day++) {
    const slots = daySlots[day] || [];
    for (const slot of slots) {
      const key = `${slot.start}|${slot.end}`;
      const days = bucket.get(key) || [];
      days.push(day);
      bucket.set(key, days);
    }
  }
  return Array.from(bucket.entries()).map(([key, days]) => {
    const [start, end] = key.split('|');
    return { days: days.sort((a, b) => a - b), start: start!, end: end! };
  });
}

export function summarizeRules(rules: ScheduleWeeklyRule[]): string {
  if (!rules.length) return 'Aucun créneau';
  const daySlots = rulesToDaySlots(rules);
  const parts: string[] = [];
  for (const day of DISPLAY_DAY_ORDER) {
    const slots = daySlots[day] || [];
    if (!slots.length) continue;
    const dayLabel = DAYS_OF_WEEK.find(d => d.index === day)?.short || String(day);
    parts.push(
      `${dayLabel} ${slots.map(s => `${s.start}–${s.end}`).join(', ')}`,
    );
  }
  return parts.join(' · ') || 'Aucun créneau';
}

export function sortOverrides(overrides: ScheduleOverride[]): ScheduleOverride[] {
  return [...overrides].sort((a, b) => a.date.localeCompare(b.date));
}

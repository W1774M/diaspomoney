/**
 * Types pour les plannings prestataire (coss Scheduling schedules).
 */

export interface ScheduleTimeRange {
  start: string; // HH:mm ou 24:00
  end: string;
}

export interface ScheduleWeeklyRule {
  /** Jours de la semaine, dimanche = 0 */
  days: number[];
  start: string;
  end: string;
}

export interface ScheduleOverride {
  /** Date locale YYYY-MM-DD */
  date: string;
  /** Vide = indisponible toute la journée */
  ranges: ScheduleTimeRange[];
}

export interface ProviderSchedule {
  id: string;
  host: string;
  name: string;
  timeZone: string;
  isDefault: boolean;
  rules: ScheduleWeeklyRule[];
  overrides: ScheduleOverride[];
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProviderScheduleInput {
  name?: string | undefined;
  timeZone?: string | undefined;
  isDefault?: boolean | undefined;
  rules: ScheduleWeeklyRule[];
  overrides?: ScheduleOverride[] | undefined;
}

/**
 * Plannings prestataire via coss Scheduling (hosts + schedules).
 * Host uid déterministe : dm_provider_{userId}
 */
import { getCossClient, isCossSchedulingConfigured } from '@/lib/coss/client';
import { TIMEZONES } from '@/lib/constants';
import { childLogger } from '@/lib/logger';
import type {
  ProviderSchedule,
  UpsertProviderScheduleInput,
} from '@/lib/types/schedule.types';

const log = childLogger({ component: 'coss-provider-schedules' });

export function providerHostUid(userId: string): string {
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  return `dm_provider_${safe || 'unknown'}`;
}

export type ProviderHostUser = {
  id: string;
  email?: string | null | undefined;
  name?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  preferences?: { timezone?: string | null | undefined } | null | undefined;
};

function hostDisplayName(user: ProviderHostUser): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (user.name?.trim()) return user.name.trim();
  if (user.email?.trim()) return user.email.trim();
  return 'Prestataire DiaspoMoney';
}

function hostTimeZone(user: ProviderHostUser): string {
  return user.preferences?.timezone?.trim() || TIMEZONES.PARIS;
}

function mapSchedule(raw: {
  id: string;
  host: string;
  name: string;
  time_zone: string;
  is_default: boolean;
  rules: Array<{ days: number[]; start: string; end: string }>;
  overrides: Array<{ date: string; ranges: Array<{ start: string; end: string }> }>;
  created_at: string;
  updated_at: string;
}): ProviderSchedule {
  return {
    id: raw.id,
    host: raw.host,
    name: raw.name,
    timeZone: raw.time_zone,
    isDefault: raw.is_default,
    rules: (raw.rules || []).map(r => ({
      days: r.days,
      start: r.start,
      end: r.end,
    })),
    overrides: (raw.overrides || []).map(o => ({
      date: o.date,
      ranges: (o.ranges || []).map(rg => ({ start: rg.start, end: rg.end })),
    })),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function toCossParams(input: UpsertProviderScheduleInput) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.timeZone !== undefined ? { time_zone: input.timeZone } : {}),
    ...(input.isDefault !== undefined ? { is_default: input.isDefault } : {}),
    rules: input.rules.map(r => ({
      days: r.days,
      start: r.start,
      end: r.end,
    })),
    ...(input.overrides !== undefined
      ? {
          overrides: input.overrides.map(o => ({
            date: o.date,
            ranges: o.ranges.map(rg => ({ start: rg.start, end: rg.end })),
          })),
        }
      : {}),
  };
}

function throwCossError(error: { message?: string } | null | undefined, fallback: string): never {
  throw new Error(error?.message || fallback);
}

/** Get-or-create du host coss pour ce prestataire. Renvoie le uid. */
export async function ensureProviderHost(user: ProviderHostUser): Promise<string> {
  if (!isCossSchedulingConfigured()) {
    throw new Error('Scheduling coss non configuré');
  }

  const uid = providerHostUid(user.id);
  const coss = getCossClient();

  const existing = await coss.scheduling.hosts.get(uid);
  if (!existing.error && existing.data) {
    return uid;
  }

  const createParams: {
    uid: string;
    name: string;
    email?: string;
    time_zone: string;
    metadata: { diaspo_user_id: string };
  } = {
    uid,
    name: hostDisplayName(user),
    time_zone: hostTimeZone(user),
    metadata: { diaspo_user_id: user.id },
  };
  if (user.email) {
    createParams.email = user.email;
  }

  const created = await coss.scheduling.hosts.create(createParams);

  if (created.error || !created.data) {
    log.error({ error: created.error, uid }, 'Impossible de créer le host coss');
    throwCossError(created.error, 'Impossible de créer le host coss');
  }

  log.info({ uid, hostId: created.data.id }, 'Host coss prestataire créé');
  return uid;
}

export async function listProviderSchedules(
  user: ProviderHostUser,
): Promise<ProviderSchedule[]> {
  const uid = await ensureProviderHost(user);
  const coss = getCossClient();
  const listed = await coss.scheduling.schedules.list(uid);
  if (listed.error || !listed.data) {
    throwCossError(listed.error, 'Impossible de lister les plannings');
  }
  const items = listed.data.data || [];
  return items.map(mapSchedule);
}

export async function getProviderSchedule(
  user: ProviderHostUser,
  scheduleId: string,
): Promise<ProviderSchedule> {
  const uid = await ensureProviderHost(user);
  const coss = getCossClient();
  const result = await coss.scheduling.schedules.get(uid, scheduleId);
  if (result.error || !result.data) {
    throwCossError(result.error, 'Planning introuvable');
  }
  return mapSchedule(result.data);
}

export async function createProviderSchedule(
  user: ProviderHostUser,
  input: UpsertProviderScheduleInput,
): Promise<ProviderSchedule> {
  const uid = await ensureProviderHost(user);
  const coss = getCossClient();
  const result = await coss.scheduling.schedules.create(uid, toCossParams(input));
  if (result.error || !result.data) {
    throwCossError(result.error, 'Impossible de créer le planning');
  }
  return mapSchedule(result.data);
}

export async function updateProviderSchedule(
  user: ProviderHostUser,
  scheduleId: string,
  input: UpsertProviderScheduleInput,
): Promise<ProviderSchedule> {
  const uid = await ensureProviderHost(user);
  const coss = getCossClient();
  const result = await coss.scheduling.schedules.update(
    uid,
    scheduleId,
    toCossParams(input),
  );
  if (result.error || !result.data) {
    throwCossError(result.error, 'Impossible de mettre à jour le planning');
  }
  return mapSchedule(result.data);
}

export async function deleteProviderSchedule(
  user: ProviderHostUser,
  scheduleId: string,
): Promise<{ id: string; deleted: true }> {
  const uid = await ensureProviderHost(user);
  const coss = getCossClient();
  const result = await coss.scheduling.schedules.remove(uid, scheduleId);
  if (result.error || !result.data) {
    throwCossError(
      result.error,
      'Impossible de supprimer le planning (le planning par défaut ne peut pas être supprimé)',
    );
  }
  return { id: result.data.id, deleted: true };
}

/** Règles par défaut type Cal.com Working Hours (lun–ven 09:00–17:00). */
export function defaultWeeklyRules(): UpsertProviderScheduleInput['rules'] {
  return [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' }];
}

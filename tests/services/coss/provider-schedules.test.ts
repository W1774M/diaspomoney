/**
 * lib/coss/provider-schedules
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getClient, isConfigured } = vi.hoisted(() => ({
  getClient: vi.fn(),
  isConfigured: vi.fn(),
}));

vi.mock('@/lib/coss/client', () => ({
  getCossClient: getClient,
  isCossSchedulingConfigured: isConfigured,
}));

vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  createProviderSchedule,
  ensureProviderHost,
  listProviderSchedules,
  providerHostUid,
} from '@/lib/coss/provider-schedules';

describe('provider-schedules', () => {
  const hosts = {
    get: vi.fn(),
    create: vi.fn(),
  };
  const schedules = {
    list: vi.fn(),
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    isConfigured.mockReturnValue(true);
    getClient.mockReturnValue({
      scheduling: { hosts, schedules },
    });
  });

  it('providerHostUid est déterministe et sanitisé', () => {
    expect(providerHostUid('abc123')).toBe('dm_provider_abc123');
    expect(providerHostUid('ab/c!')).toBe('dm_provider_abc');
  });

  it('ensureProviderHost réutilise un host existant', async () => {
    hosts.get.mockResolvedValue({ data: { id: 'host_1' }, error: null });
    const uid = await ensureProviderHost({
      id: 'u1',
      email: 'a@b.c',
      name: 'Ana',
    });
    expect(uid).toBe('dm_provider_u1');
    expect(hosts.create).not.toHaveBeenCalled();
  });

  it('ensureProviderHost crée le host si absent', async () => {
    hosts.get.mockResolvedValue({ data: null, error: { message: 'not found' } });
    hosts.create.mockResolvedValue({
      data: { id: 'host_new' },
      error: null,
    });
    const uid = await ensureProviderHost({
      id: 'u2',
      email: 'p@example.com',
      name: 'Bill',
    });
    expect(uid).toBe('dm_provider_u2');
    expect(hosts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'dm_provider_u2',
        email: 'p@example.com',
      }),
    );
  });

  it('listProviderSchedules mappe les champs coss', async () => {
    hosts.get.mockResolvedValue({ data: { id: 'host_1' }, error: null });
    schedules.list.mockResolvedValue({
      data: {
        data: [
          {
            id: 'sched_1',
            host: 'host_1',
            name: 'Clinic',
            time_zone: 'Europe/Paris',
            is_default: true,
            rules: [{ days: [1], start: '09:00', end: '12:00' }],
            overrides: [{ date: '2026-12-24', ranges: [] }],
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
      error: null,
    });

    const result = await listProviderSchedules({ id: 'u1', email: 'a@b.c' });
    expect(result[0]).toMatchObject({
      id: 'sched_1',
      name: 'Clinic',
      timeZone: 'Europe/Paris',
      isDefault: true,
      overrides: [{ date: '2026-12-24', ranges: [] }],
    });
  });

  it('createProviderSchedule envoie rules/overrides', async () => {
    hosts.get.mockResolvedValue({ data: { id: 'host_1' }, error: null });
    schedules.create.mockResolvedValue({
      data: {
        id: 'sched_2',
        host: 'host_1',
        name: 'Soirs',
        time_zone: 'Europe/Paris',
        is_default: false,
        rules: [{ days: [5], start: '18:00', end: '21:00' }],
        overrides: [],
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      error: null,
    });

    const created = await createProviderSchedule(
      { id: 'u1' },
      {
        name: 'Soirs',
        rules: [{ days: [5], start: '18:00', end: '21:00' }],
        overrides: [],
      },
    );
    expect(created.name).toBe('Soirs');
    expect(schedules.create).toHaveBeenCalled();
  });
});

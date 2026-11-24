/**
 * GET/POST /api/scheduling/schedules
 * GET/PUT/DELETE /api/scheduling/schedules/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  isConfigured,
  requireProvider,
  listSchedules,
  createSchedule,
  getSchedule,
  updateSchedule,
  deleteSchedule,
} = vi.hoisted(() => ({
  isConfigured: vi.fn(),
  requireProvider: vi.fn(),
  listSchedules: vi.fn(),
  createSchedule: vi.fn(),
  getSchedule: vi.fn(),
  updateSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
}));

vi.mock('@/lib/coss/client', () => ({
  isCossSchedulingConfigured: isConfigured,
}));

vi.mock('@/lib/coss/require-provider-for-schedules', () => ({
  requireProviderForSchedules: requireProvider,
}));

vi.mock('@/lib/coss/provider-schedules', () => ({
  listProviderSchedules: listSchedules,
  createProviderSchedule: createSchedule,
  getProviderSchedule: getSchedule,
  updateProviderSchedule: updateSchedule,
  deleteProviderSchedule: deleteSchedule,
  defaultWeeklyRules: () => [
    { days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' },
  ],
}));

vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET, POST } from '@/app/api/scheduling/schedules/route';
import {
  DELETE,
  GET as GET_ID,
  PUT,
} from '@/app/api/scheduling/schedules/[id]/route';

const provider = {
  id: 'user123',
  email: 'p@example.com',
  name: 'Doc',
};

const sampleSchedule = {
  id: 'sched_1',
  host: 'dm_provider_user123',
  name: 'Horaires de travail',
  timeZone: 'Europe/Paris',
  isDefault: true,
  rules: [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' }],
  overrides: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('/api/scheduling/schedules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isConfigured.mockReturnValue(true);
    requireProvider.mockResolvedValue(provider);
    listSchedules.mockResolvedValue([sampleSchedule]);
    createSchedule.mockResolvedValue(sampleSchedule);
    getSchedule.mockResolvedValue(sampleSchedule);
    updateSchedule.mockResolvedValue(sampleSchedule);
    deleteSchedule.mockResolvedValue({ id: 'sched_1', deleted: true });
  });

  it('GET répond 503 si coss non configuré (via requireProvider)', async () => {
    const { ApiError } = await import('@/lib/api/error-handler');
    requireProvider.mockRejectedValue(
      new ApiError(503, 'Scheduling coss non configuré', 'COSS_NOT_CONFIGURED'),
    );
    const res = await GET(new NextRequest('http://localhost/api/scheduling/schedules'));
    expect(res.status).toBe(503);
  });

  it('GET liste les plannings', async () => {
    const res = await GET(new NextRequest('http://localhost/api/scheduling/schedules'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(listSchedules).toHaveBeenCalledWith(provider);
  });

  it('POST crée un planning avec règles par défaut', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/scheduling/schedules', {
        method: 'POST',
        body: JSON.stringify({ name: 'Clinique' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.id).toBe('sched_1');
    expect(createSchedule).toHaveBeenCalledWith(
      provider,
      expect.objectContaining({
        name: 'Clinique',
        rules: [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' }],
      }),
    );
  });

  it('GET [id] retourne un planning', async () => {
    const res = await GET_ID(
      new NextRequest('http://localhost/api/scheduling/schedules/sched_1'),
      { params: Promise.resolve({ id: 'sched_1' }) },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.id).toBe('sched_1');
  });

  it('PUT [id] met à jour un planning', async () => {
    const res = await PUT(
      new NextRequest('http://localhost/api/scheduling/schedules/sched_1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Soirs',
          rules: [{ days: [1], start: '18:00', end: '21:00' }],
          overrides: [{ date: '2026-12-24', ranges: [] }],
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'sched_1' }) },
    );
    expect(res.status).toBe(200);
    expect(updateSchedule).toHaveBeenCalledWith(
      provider,
      'sched_1',
      expect.objectContaining({
        name: 'Soirs',
        overrides: [{ date: '2026-12-24', ranges: [] }],
      }),
    );
  });

  it('DELETE [id] refuse le planning par défaut', async () => {
    deleteSchedule.mockRejectedValue(
      new Error('Cannot delete the default schedule'),
    );
    const res = await DELETE(
      new NextRequest('http://localhost/api/scheduling/schedules/sched_1', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'sched_1' }) },
    );
    expect(res.status).toBe(422);
  });

  it('DELETE [id] réussit pour un planning non défaut', async () => {
    const res = await DELETE(
      new NextRequest('http://localhost/api/scheduling/schedules/sched_2', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'sched_2' }) },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.deleted).toBe(true);
  });
});

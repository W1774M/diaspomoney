/**
 * lib/coss/scheduling-health-poc
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  hostsGet,
  hostsCreate,
  schedulesCreate,
  eventTypesList,
  eventTypesCreate,
  slotsList,
  bookingsCreate,
} = vi.hoisted(() => ({
  hostsGet: vi.fn(),
  hostsCreate: vi.fn(),
  schedulesCreate: vi.fn(),
  eventTypesList: vi.fn(),
  eventTypesCreate: vi.fn(),
  slotsList: vi.fn(),
  bookingsCreate: vi.fn(),
}));

vi.mock('@/lib/coss/client', () => ({
  getCossClient: () => ({
    scheduling: {
      hosts: { get: hostsGet, create: hostsCreate },
      schedules: { create: schedulesCreate },
      eventTypes: { list: eventTypesList, create: eventTypesCreate },
      slots: { list: slotsList },
      bookings: { create: bookingsCreate },
    },
  }),
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
  createHealthCossBooking,
  ensureHealthPocEventTypeId,
  listHealthSlotsForDate,
  parisLocalToIso,
} from '@/lib/coss/scheduling-health-poc';

describe('scheduling-health-poc', () => {
  const prevEt = process.env['COSS_HEALTH_EVENT_TYPE_ID'];
  const prevHost = process.env['COSS_HEALTH_HOST_UID'];

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env['COSS_HEALTH_EVENT_TYPE_ID'];
    delete process.env['COSS_HEALTH_HOST_UID'];
    hostsGet.mockResolvedValue({ data: { uid: 'diaspomoney_health_poc' } });
    eventTypesList.mockResolvedValue({
      data: { data: [{ id: 'ev_existing', title: 'Consultation santé POC' }] },
    });
    slotsList.mockResolvedValue({ data: { data: [] } });
    bookingsCreate.mockResolvedValue({ data: { id: 'bk_1' } });
  });

  afterEach(() => {
    if (prevEt === undefined) delete process.env['COSS_HEALTH_EVENT_TYPE_ID'];
    else process.env['COSS_HEALTH_EVENT_TYPE_ID'] = prevEt;
    if (prevHost === undefined) delete process.env['COSS_HEALTH_HOST_UID'];
    else process.env['COSS_HEALTH_HOST_UID'] = prevHost;
  });

  it('ensureHealthPocEventTypeId lit COSS_HEALTH_EVENT_TYPE_ID', async () => {
    process.env['COSS_HEALTH_EVENT_TYPE_ID'] = ' evtype_fixed ';
    expect(await ensureHealthPocEventTypeId()).toBe('evtype_fixed');
    expect(hostsGet).not.toHaveBeenCalled();
  });

  it('crée le host et le schedule si absent', async () => {
    hostsGet.mockResolvedValue({ error: { message: 'not found' } });
    hostsCreate.mockResolvedValue({ data: { uid: 'diaspomoney_health_poc' } });
    schedulesCreate.mockResolvedValue({ data: {} });
    eventTypesList.mockResolvedValue({ data: { data: [] } });
    eventTypesCreate.mockResolvedValue({ data: { id: 'ev_new' } });

    expect(await ensureHealthPocEventTypeId()).toBe('ev_new');
    expect(hostsCreate).toHaveBeenCalled();
    expect(schedulesCreate).toHaveBeenCalledWith(
      'diaspomoney_health_poc',
      expect.objectContaining({ rules: expect.any(Array) }),
    );
    expect(eventTypesCreate).toHaveBeenCalled();
  });

  it('échoue si création host impossible', async () => {
    hostsGet.mockResolvedValue({ error: { message: 'gone' } });
    hostsCreate.mockResolvedValue({ error: { message: 'quota' } });
    await expect(ensureHealthPocEventTypeId()).rejects.toThrow(/quota|host/);
  });

  it('utilise COSS_HEALTH_HOST_UID et liste plate des event types', async () => {
    process.env['COSS_HEALTH_HOST_UID'] = 'custom_host';
    hostsGet.mockResolvedValue({ data: { uid: 'custom_host' } });
    eventTypesList.mockResolvedValue({
      data: [{ id: 'ev_flat', title: 'Consultation santé POC' }],
    });
    expect(await ensureHealthPocEventTypeId()).toBe('ev_flat');
  });

  it('échoue si création event type impossible', async () => {
    hostsGet.mockResolvedValue({ data: { uid: 'diaspomoney_health_poc' } });
    eventTypesList.mockResolvedValue({ data: { data: [] } });
    eventTypesCreate.mockResolvedValue({ error: { message: 'et fail' } });
    await expect(ensureHealthPocEventTypeId()).rejects.toThrow(/et fail|event type/);
  });

  it('listHealthSlotsForDate filtre le jour Paris et mappe time', async () => {
    process.env['COSS_HEALTH_EVENT_TYPE_ID'] = 'ev_1';
    slotsList.mockResolvedValue({
      data: {
        data: [
          {
            start: '2026-11-24T08:00:00.000Z',
            end: '2026-11-24T08:30:00.000Z',
          },
          {
            start: '2026-11-25T08:00:00.000Z',
            end: '2026-11-25T08:30:00.000Z',
          },
        ],
      },
    });

    const slots = await listHealthSlotsForDate('2026-11-24');
    expect(slots).toHaveLength(1);
    expect(slots[0]?.start).toBe('2026-11-24T08:00:00.000Z');
    expect(slots[0]?.time).toMatch(/^\d{2}:\d{2}$/);
    expect(slotsList).toHaveBeenCalledWith(
      'ev_1',
      expect.objectContaining({ start: expect.any(String), end: expect.any(String) }),
    );
  });

  it('listHealthSlotsForDate propage l erreur coss', async () => {
    process.env['COSS_HEALTH_EVENT_TYPE_ID'] = 'ev_1';
    slotsList.mockResolvedValue({ error: { message: 'rate limit' } });
    await expect(listHealthSlotsForDate('2026-11-24')).rejects.toThrow(/rate limit/);
  });

  it('listHealthSlotsForDate accepte une liste plate', async () => {
    process.env['COSS_HEALTH_EVENT_TYPE_ID'] = 'ev_1';
    slotsList.mockResolvedValue({
      data: [
        {
          start: '2026-11-24T08:00:00.000Z',
          end: '2026-11-24T08:30:00.000Z',
        },
      ],
    });
    const slots = await listHealthSlotsForDate('2026-11-24');
    expect(slots).toHaveLength(1);
  });

  it('createHealthCossBooking renvoie id ou null', async () => {
    process.env['COSS_HEALTH_EVENT_TYPE_ID'] = 'ev_1';
    const ok = await createHealthCossBooking({
      startIso: '2026-11-24T08:00:00.000Z',
      attendee: { uid: 'u1', name: 'Ada', email: 'ada@example.com', timeZone: 'Africa/Dakar' },
    });
    expect(ok).toEqual({ id: 'bk_1' });
    expect(bookingsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'ev_1',
        attendee: expect.objectContaining({ time_zone: 'Africa/Dakar' }),
      }),
    );

    bookingsCreate.mockResolvedValue({ error: { code: 'busy', message: 'taken' } });
    expect(
      await createHealthCossBooking({
        startIso: '2026-11-24T08:00:00.000Z',
        attendee: { uid: 'u1', name: 'Ada', email: 'ada@example.com' },
      }),
    ).toBeNull();
  });

  it('parisLocalToIso produit un ISO', () => {
    const iso = parisLocalToIso('2026-11-24', '10:30');
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Number.isNaN(Date.parse(iso))).toBe(false);
  });
});

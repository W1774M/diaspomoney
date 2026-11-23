/**
 * GET /api/scheduling/slots
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { isConfigured, listSlots } = vi.hoisted(() => ({
  isConfigured: vi.fn(),
  listSlots: vi.fn(),
}));

vi.mock('@/lib/coss/client', () => ({
  isCossSchedulingConfigured: isConfigured,
}));
vi.mock('@/lib/coss/scheduling-health-poc', () => ({
  listHealthSlotsForDate: listSlots,
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET } from '@/app/api/scheduling/slots/route';

describe('GET /api/scheduling/slots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isConfigured.mockReturnValue(true);
    listSlots.mockResolvedValue([
      { start: '2026-11-24T08:00:00.000Z', end: '2026-11-24T08:30:00.000Z', time: '09:00' },
    ]);
  });

  it('répond 503 si coss non configuré', async () => {
    isConfigured.mockReturnValue(false);
    const res = await GET(new NextRequest('http://localhost/api/scheduling/slots?date=2026-11-24'));
    expect(res.status).toBe(503);
  });

  it('répond 400 sans date', async () => {
    const res = await GET(new NextRequest('http://localhost/api/scheduling/slots'));
    expect(res.status).toBe(400);
  });

  it('liste les créneaux du jour', async () => {
    const res = await GET(new NextRequest('http://localhost/api/scheduling/slots?date=2026-11-24'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.slots).toHaveLength(1);
    expect(body.slots[0].time).toBe('09:00');
    expect(listSlots).toHaveBeenCalledWith('2026-11-24');
  });
});

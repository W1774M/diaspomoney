/**
 * POST /api/notifications/process-scheduled
 */
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectId } from 'mongodb';

const { find, sort, limit, toArray, deliver } = vi.hoisted(() => {
  const toArray = vi.fn();
  const limit = vi.fn(() => ({ toArray }));
  const sort = vi.fn(() => ({ limit }));
  const find = vi.fn(() => ({ sort }));
  return {
    find,
    sort,
    limit,
    toArray,
    deliver: vi.fn(),
  };
});

vi.mock('@/lib/database/mongodb', () => ({
  getMongoClient: vi.fn(async () => ({
    db: () => ({
      collection: () => ({ find }),
    }),
  })),
}));
vi.mock('@/services/notification/notification.service', () => ({
  notificationService: {
    deliverNotificationById: deliver,
  },
}));

import { POST } from '@/app/api/notifications/process-scheduled/route';

function post(headers: Record<string, string> = {}, qs = '') {
  return POST(
    new NextRequest(`http://localhost/api/notifications/process-scheduled${qs}`, {
      method: 'POST',
      headers,
    }),
  );
}

describe('POST /api/notifications/process-scheduled', () => {
  const prevSecret = process.env['NOTIFICATIONS_CRON_SECRET'];
  const prevEnv = process.env['NODE_ENV'];

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env['NOTIFICATIONS_CRON_SECRET'];
    process.env['NODE_ENV'] = 'test';
    toArray.mockResolvedValue([]);
    deliver.mockResolvedValue(true);
  });

  afterEach(() => {
    if (prevSecret === undefined) delete process.env['NOTIFICATIONS_CRON_SECRET'];
    else process.env['NOTIFICATIONS_CRON_SECRET'] = prevSecret;
    if (prevEnv === undefined) delete process.env['NODE_ENV'];
    else process.env['NODE_ENV'] = prevEnv;
  });

  it('en prod refuse sans secret configuré', async () => {
    process.env['NODE_ENV'] = 'production';
    delete process.env['NOTIFICATIONS_CRON_SECRET'];
    expect((await post()).status).toBe(403);
  });

  it('refuse un Bearer incorrect', async () => {
    process.env['NOTIFICATIONS_CRON_SECRET'] = 'cron-secret';
    expect((await post({ authorization: 'Bearer wrong' })).status).toBe(401);
  });

  it('délivre les notifications dues', async () => {
    process.env['NOTIFICATIONS_CRON_SECRET'] = 'cron-secret';
    const id1 = new ObjectId();
    const id2 = new ObjectId();
    toArray.mockResolvedValue([{ _id: id1 }, { _id: id2 }]);
    deliver.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const res = await post(
      { authorization: 'Bearer cron-secret' },
      '?limit=10',
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      processed: 2,
      delivered: 1,
      failed: 1,
      limit: 10,
    });
    expect(deliver).toHaveBeenCalledWith(id1.toString());
    expect(deliver).toHaveBeenCalledWith(id2.toString());
  });

  it('compte failed si deliver throw', async () => {
    process.env['NOTIFICATIONS_CRON_SECRET'] = 'cron-secret';
    toArray.mockResolvedValue([{ _id: new ObjectId() }]);
    deliver.mockRejectedValue(new Error('smtp'));

    const res = await post({ authorization: 'Bearer cron-secret' });
    const body = await res.json();
    expect(body.failed).toBe(1);
    expect(body.delivered).toBe(0);
  });
});

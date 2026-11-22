// @vitest-environment node
/**
 * Connexion : une notification in-app « Connexion réussie » remplace l'e-mail.
 * - NotificationService.sendLoginNotification n'utilise que le canal IN_APP ;
 * - events.signIn de NextAuth la déclenche sans jamais bloquer la connexion.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  passThrough: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  sendEmail: vi.fn(async () => true),
  findByEmail: vi.fn(),
  notificationRepo: {
    create: vi.fn(async (n: unknown) => n),
    updateStatus: vi.fn(async () => true),
  },
}));

vi.mock('@/lib/decorators/cache.decorator', () => ({ Cacheable: h.passThrough }));
vi.mock('@/lib/decorators/log.decorator', () => ({ Log: h.passThrough }));
vi.mock('@/lib/decorators/performance.decorator', () => ({ Performance: h.passThrough }));
vi.mock('@/lib/decorators/validate.decorator', () => ({ Validate: h.passThrough }));
vi.mock('@/lib/email/resend', () => ({ sendEmail: h.sendEmail }));
vi.mock('@/repositories', () => ({
  getNotificationRepository: () => h.notificationRepo,
  getNotificationTemplateRepository: () => ({ findByNameAndLocale: vi.fn(async () => null) }),
  getUserRepository: () => ({ findByEmail: h.findByEmail, findById: vi.fn() }),
}));

import { authConfig } from '@/auth.config';
import { notificationService } from '@/services/notification/notification.service';

const signInEvent = authConfig.events!.signIn! as (msg: {
  user: { id?: string; email?: string | null };
  account: { provider: string } | null;
}) => Promise<void>;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('NotificationService.sendLoginNotification', () => {
  it('crée une notification in-app LOGIN_SUCCESS, sans canal e-mail', async () => {
    const spy = vi.spyOn(notificationService, 'sendNotification');

    await notificationService.sendLoginNotification(
      'user123',
      'test@example.com',
      new Date('2026-11-22T10:00:00Z'),
    );

    expect(spy).toHaveBeenCalledTimes(1);
    const data = spy.mock.calls[0]![0];
    expect(data).toMatchObject({
      recipient: 'user123',
      type: 'LOGIN_SUCCESS',
      template: 'login_success',
    });
    expect(data.channels).toEqual([
      { type: 'IN_APP', enabled: true, priority: 'MEDIUM' },
    ]);

    // Enregistrée pour l'utilisateur (visible dans le dashboard) et marquée envoyée
    expect(h.notificationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user123', type: 'LOGIN_SUCCESS', read: false }),
    );
    expect(h.notificationRepo.updateStatus).toHaveBeenCalledWith(
      expect.any(String),
      'SENT',
      expect.anything(),
    );
    expect(h.sendEmail).not.toHaveBeenCalled();
  });
});

describe('NextAuth events.signIn', () => {
  it('déclenche la notification in-app pour l’utilisateur connecté', async () => {
    const spy = vi
      .spyOn(notificationService, 'sendLoginNotification')
      .mockResolvedValue();

    await signInEvent({
      user: { id: 'user123', email: 'Test@Example.com' },
      account: { provider: 'credentials' },
    });

    expect(spy).toHaveBeenCalledWith('user123', 'test@example.com');
    expect(h.sendEmail).not.toHaveBeenCalled();
  });

  it('retrouve l’id en base par e-mail s’il manque', async () => {
    h.findByEmail.mockResolvedValueOnce({ id: 'db-id' });
    const spy = vi
      .spyOn(notificationService, 'sendLoginNotification')
      .mockResolvedValue();

    await signInEvent({
      user: { email: 'oauth@example.com' },
      account: { provider: 'google' },
    });

    expect(h.findByEmail).toHaveBeenCalledWith('oauth@example.com');
    expect(spy).toHaveBeenCalledWith('db-id', 'oauth@example.com');
  });

  it('ne bloque pas la connexion si la notification échoue', async () => {
    vi.spyOn(notificationService, 'sendLoginNotification').mockRejectedValue(
      new Error('mongo indisponible'),
    );

    await expect(
      signInEvent({
        user: { id: 'user123', email: 'test@example.com' },
        account: { provider: 'credentials' },
      }),
    ).resolves.toBeUndefined();
  });
});

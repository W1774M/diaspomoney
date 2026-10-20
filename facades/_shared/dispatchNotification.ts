/**
 * Point unique Comms pour les facades métier.
 * Construit un NotificationIntent puis délègue au NotificationService.
 * Échec notif = best-effort (log), ne rollback pas le métier.
 */

import { NotificationIntent } from '@/domain/comms';
import type { NotificationChannel } from '@/domain/comms';
import { LANGUAGES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { notificationService } from '@/services/notification/notification.service';

export interface FacadeNotifyInput {
  recipient: string;
  template: string;
  type: string;
  payload?: Record<string, unknown>;
  channels?: NotificationChannel[];
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  locale?: string;
}

/**
 * @returns true si dispatch OK
 */
export async function dispatchFacadeNotification(
  input: FacadeNotifyInput,
): Promise<boolean> {
  try {
    const channels = input.channels?.length
      ? input.channels
      : (['EMAIL', 'PUSH'] as NotificationChannel[]);

    const intent = NotificationIntent.of({
      recipient: input.recipient,
      template: input.template,
      channels,
      payload: input.payload || {},
      priority: input.priority || 'NORMAL',
    });

    const priorityMap = {
      LOW: 'LOW',
      NORMAL: 'MEDIUM',
      HIGH: 'HIGH',
    } as const;

    await notificationService.sendNotification({
      recipient: intent.recipient,
      type: input.type as never,
      template: intent.template,
      data: intent.payload,
      channels: intent.channels.map((ch) => ({
        type: ch === 'PUSH' ? 'IN_APP' : ch,
        enabled: true,
        priority: priorityMap[intent.priority],
      })) as never,
      locale: input.locale || LANGUAGES.FR.code,
      priority: priorityMap[intent.priority],
    });

    return true;
  } catch (error) {
    logger.warn(
      {
        error: error instanceof Error ? error.message : String(error),
        recipient: input.recipient,
        template: input.template,
      },
      'Facade notification dispatch failed (non-blocking)',
    );
    return false;
  }
}

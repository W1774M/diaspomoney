/**
 * Schémas de validation Zod pour le service de notifications
 * Utilisés dans les services pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour envoyer une notification
 */
export const SendNotificationSchema = z.object({
  recipient: z.string().min(1, 'Recipient is required'),
  type: z.string().min(1, 'Notification type is required'),
  template: z.string().min(1, 'Template is required'),
  channels: z.array(
    z.object({
      type: z.enum(['EMAIL', 'SMS', 'PUSH', 'WHATSAPP', 'IN_APP']),
      enabled: z.boolean(),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    }),
  ).min(1, 'At least one channel is required'),
  locale: z.string().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  data: z.record(z.unknown()).optional(),
  userId: z.string().optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type SendNotificationInput = z.infer<typeof SendNotificationSchema>;


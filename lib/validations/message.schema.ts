/**
 * Schémas de validation Zod pour les messages
 * Utilisés dans les routes API pour valider les entrées
 */

import { MESSAGE_TYPES } from '@/lib/constants';
import { z } from 'zod';

/**
 * Schéma pour créer un message
 */
export const CreateMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  senderId: z.string().min(1, 'Sender ID is required'),
  text: z.string().min(1, 'Message text is required').max(5000, 'Message text is too long'),
  type: z.enum([
    MESSAGE_TYPES.TEXT,
    MESSAGE_TYPES.IMAGE,
    MESSAGE_TYPES.FILE,
    MESSAGE_TYPES.AUDIO,
    MESSAGE_TYPES.VIDEO,
    MESSAGE_TYPES.SYSTEM,
  ] as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid message type' }),
  }).default(MESSAGE_TYPES.TEXT),
  attachments: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Schéma pour mettre à jour un message
 */
export const UpdateMessageSchema = z.object({
  text: z.string().min(1).max(5000).optional(),
  read: z.boolean().optional(),
  readAt: z.string().datetime().optional().or(z.date().optional()),
});

/**
 * Schéma pour marquer un message comme lu
 */
export const MarkMessageReadSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * Schéma pour créer un message de support
 */
export const CreateSupportMessageSchema = z.object({
  text: z.string().max(5000, 'Message text is too long').optional(),
  attachments: z.array(z.string()).optional(),
}).refine(
  (data) => data.text || (data.attachments && data.attachments.length > 0),
  {
    message: 'Either text or attachments must be provided',
    path: ['text'],
  },
);

/**
 * Types TypeScript dérivés des schémas
 */
/**
 * Schéma pour uploader un fichier joint
 */
export const UploadAttachmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  size: z.number().positive('Size must be positive'),
  url: z.string().url('Invalid URL'),
  uploadedBy: z.string().min(1, 'Uploaded by is required'),
  conversationId: z.string().optional(),
  messageId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;
export type UpdateMessageInput = z.infer<typeof UpdateMessageSchema>;
export type MarkMessageReadInput = z.infer<typeof MarkMessageReadSchema>;
export type CreateSupportMessageInput = z.infer<typeof CreateSupportMessageSchema>;
export type UploadAttachmentInput = z.infer<typeof UploadAttachmentSchema>;


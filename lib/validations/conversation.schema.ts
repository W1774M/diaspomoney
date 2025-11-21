/**
 * Schémas de validation Zod pour les conversations
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour créer une conversation
 */
export const CreateConversationSchema = z.object({
  participants: z
    .array(z.string().min(1, 'Participant ID is required'))
    .min(2, 'At least 2 participants are required')
    .max(10, 'Maximum 10 participants allowed'),
  type: z.enum(['user', 'support'], {
    errorMap: () => ({ message: 'Conversation type must be either "user" or "support"' }),
  }),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Schéma pour mettre à jour une conversation
 */
export const UpdateConversationSchema = z.object({
  lastMessage: z.string().optional(),
  lastMessageAt: z.string().datetime().optional().or(z.date().optional()),
  unreadCount: z.record(z.number()).optional(),
});

/**
 * Schéma pour ajouter un participant à une conversation
 */
export const AddParticipantSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  participantId: z.string().min(1, 'Participant ID is required'),
});

/**
 * Schéma pour retirer un participant d'une conversation
 */
export const RemoveParticipantSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  participantId: z.string().min(1, 'Participant ID is required'),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
export type UpdateConversationInput = z.infer<typeof UpdateConversationSchema>;
export type AddParticipantInput = z.infer<typeof AddParticipantSchema>;
export type RemoveParticipantInput = z.infer<typeof RemoveParticipantSchema>;


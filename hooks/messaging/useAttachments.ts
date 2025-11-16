/**
 * Custom Hook pour les attachments
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services (évite les imports MongoDB côté client)
 */

import { useNotificationManager } from '@/components/ui/Notification';
import { UIAttachment } from '@/types/messaging';
import { useCallback, useState } from 'react';

export const useAttachments = () => {
  const [attachments, setAttachments] = useState<UIAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addError, addSuccess } = useNotificationManager();

  const fetchAttachments = useCallback(
    async (
      _userId: string,
      filters?: {
        conversationId?: string;
        messageId?: string;
        type?: string;
        search?: string;
      }
    ) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters?.conversationId) {
          params.append('conversationId', filters.conversationId);
        }
        if (filters?.messageId) {
          params.append('messageId', filters.messageId);
        }
        if (filters?.type) {
          params.append('type', filters.type);
        }
        if (filters?.search) {
          params.append('search', filters.search);
        }

        const response = await fetch(
          `/api/messaging/attachments?${params.toString()}`
        );
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des pièces jointes');
        }
        const data = await response.json();
        if (data.success && data.attachments) {
          setAttachments(data.attachments);
          return {
            attachments: data.attachments,
            total: data.attachments.length,
          };
        } else {
          throw new Error(data.error || 'Erreur inconnue');
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        addError('Erreur lors de la récupération des pièces jointes');
        return {
          attachments: [],
          total: 0,
        };
      } finally {
        setLoading(false);
      }
    },
    [addError]
  );

  const deleteAttachment = useCallback(
    async (attachmentId: string, _userId: string) => {
      setError(null);
      try {
        const response = await fetch(
          `/api/messaging/attachments?id=${attachmentId}`,
          {
            method: 'DELETE',
          }
        );
        if (!response.ok) {
          throw new Error('Erreur lors de la suppression de la pièce jointe');
        }
        const data = await response.json();
        if (data.success) {
          setAttachments(prev => prev.filter(att => att.id !== attachmentId));
          addSuccess('Pièce jointe supprimée');
        } else {
          throw new Error(data.error || 'Erreur inconnue');
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        addError('Erreur lors de la suppression de la pièce jointe');
        throw err;
      }
    },
    [addError, addSuccess]
  );

  return {
    attachments,
    loading,
    error,
    fetchAttachments,
    deleteAttachment,
  };
};

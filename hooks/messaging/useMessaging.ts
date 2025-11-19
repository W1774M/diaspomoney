/**
 * Custom Hook pour la messagerie
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services (évite les imports MongoDB côté client)
 */

import { useNotificationManager } from '@/components/ui/Notification';
import { UIConversation, UIMessage } from '@/types/messaging';
import { useCallback, useRef, useState } from 'react';

export const useMessaging = () => {
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addError, addSuccess } = useNotificationManager();

  // Utiliser useRef pour éviter les re-renders causés par les changements de référence
  const addErrorRef = useRef(addError);
  const addSuccessRef = useRef(addSuccess);
  addErrorRef.current = addError;
  addSuccessRef.current = addSuccess;

  const fetchConversations = useCallback(
    async (_userId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/messaging/conversations');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des conversations');
        }
        const data = await response.json();
        if (data.success && data.conversations) {
          setConversations(data.conversations);
        } else {
          throw new Error(data.error || 'Erreur inconnue');
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        addErrorRef.current('Erreur lors de la récupération des conversations');
      } finally {
        setLoading(false);
      }
    },
    [], // Plus de dépendance sur addError
  );

  const createConversation = useCallback(
    async (participantIds: string[], _type?: 'user' | 'support') => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/messaging/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantId: participantIds[1] || participantIds[0],
          }),
        });
        if (!response.ok) {
          throw new Error('Erreur lors de la création de la conversation');
        }
        const data = await response.json();
        if (data.success && data.conversation) {
          // Recharger les conversations pour avoir les données complètes
          await fetchConversations(participantIds[0]!);
          addSuccessRef.current('Conversation créée avec succès');
          return data.conversation;
        } else {
          throw new Error(data.error || 'Erreur inconnue');
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        addErrorRef.current('Erreur lors de la création de la conversation');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchConversations], // Seulement fetchConversations comme dépendance
  );

  const fetchMessages = useCallback(
    async (conversationId: string, _userId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/messaging/messages?conversationId=${conversationId}`,
        );
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des messages');
        }
        const data = await response.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
          return {
            messages: data.messages,
            total: data.pagination?.total || data.messages.length,
          };
        } else {
          throw new Error(data.error || 'Erreur inconnue');
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        addErrorRef.current('Erreur lors de la récupération des messages');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [], // Plus de dépendance sur addError
  );

  const sendMessage = useCallback(
    async (
      conversationId: string,
      text: string,
      _userId: string,
      attachments?: string[],
    ) => {
      setError(null);
      try {
        const response = await fetch('/api/messaging/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId,
            text,
            attachments: attachments || [],
          }),
        });
        if (!response.ok) {
          throw new Error("Erreur lors de l'envoi du message");
        }
        const data = await response.json();
        if (data.success && data.message) {
          const message: UIMessage = {
            id: data.message.id,
            text: data.message.text,
            senderId: data.message.senderId,
            timestamp: new Date(data.message.timestamp),
            attachments: data.message.attachments || [],
            read: false,
          };
          setMessages(prev => [...prev, message]);
          return message;
        } else {
          throw new Error(data.error || 'Erreur inconnue');
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        addErrorRef.current("Erreur lors de l'envoi du message");
        throw err;
      }
    },
    [], // Plus de dépendance sur addError
  );

  return {
    conversations,
    messages,
    loading,
    error,
    fetchConversations,
    createConversation,
    fetchMessages,
    sendMessage,
  };
};

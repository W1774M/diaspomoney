/**
 * Custom Hook pour le chat de support
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services (évite les imports MongoDB côté client)
 */

import { useNotificationManager } from '@/components/ui/Notification';
import { UIMessage } from '@/types/messaging';
import { useCallback, useRef, useState } from 'react';

export const useSupportChat = () => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [ticket, setTicket] = useState<{
    id: string;
    status: string;
    priority: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addError, addSuccess } = useNotificationManager();

  // Utiliser useRef pour éviter les re-renders causés par les changements de référence
  const addErrorRef = useRef(addError);
  const addSuccessRef = useRef(addSuccess);
  addErrorRef.current = addError;
  addSuccessRef.current = addSuccess;

  const fetchSupportChat = useCallback(
    async (_userId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/messaging/support');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération du chat de support');
        }
        const data = await response.json();
        if (data.success) {
          const uiMessages: UIMessage[] = (data.messages || []).map(
            (msg: any) => ({
              id: msg.id,
              text: msg.text,
              senderId: msg.sender === 'user' ? 'user' : 'support',
              timestamp: new Date(msg.timestamp),
              attachments: msg.attachments || [],
              read: false,
            })
          );
          setMessages(uiMessages);
          setTicket(data.ticket || null);
        } else {
          throw new Error(data.error || 'Erreur inconnue');
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        addErrorRef.current(
          'Erreur lors de la récupération du chat de support'
        );
      } finally {
        setLoading(false);
      }
    },
    [] // Plus de dépendance sur addError
  );

  const sendSupportMessage = useCallback(
    async (_userId: string, text: string, attachments?: string[]) => {
      setError(null);
      try {
        const response = await fetch('/api/messaging/support', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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
            senderId: 'user',
            timestamp: new Date(data.message.timestamp),
            attachments: data.message.attachments || [],
            read: false,
          };
          setMessages(prev => [...prev, message]);
          addSuccessRef.current('Message envoyé');
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
    [] // Plus de dépendance sur addError et addSuccess
  );

  return {
    messages,
    ticket,
    loading,
    error,
    fetchSupportChat,
    sendSupportMessage,
  };
};

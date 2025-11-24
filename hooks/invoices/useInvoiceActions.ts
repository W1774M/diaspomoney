'use client';

import { useCallback, useState } from 'react';
import { useNotificationManager } from '@/components/ui/Notification';

export interface UseInvoiceActionsReturn {
  deleteInvoice: (id: string) => Promise<boolean>;
  downloadInvoice: (id: string) => Promise<void>;
  sendInvoiceByEmail: (id: string) => Promise<void>;
  isDownloading: boolean;
  isSending: boolean;
}

/**
 * Hook pour les actions sur les factures (delete, download)
 * Implémente les design patterns :
 * - Custom Hooks Pattern
 * - Error Handling Pattern
 * - Notification Pattern
 */
export function useInvoiceActions(
  onSuccess?: () => void | Promise<void>,
): UseInvoiceActionsReturn {
  const { addSuccess, addError } = useNotificationManager();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const deleteInvoice = useCallback(
    async (id: string): Promise<boolean> => {
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
        return false;
      }

      try {
        const response = await fetch(`/api/invoices/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erreur lors de la suppression de la facture');
        }

        addSuccess('Facture supprimée avec succès');
        await onSuccess?.();
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur lors de la suppression de la facture';
        addError(errorMessage);
        return false;
      }
    },
    [addSuccess, addError, onSuccess],
  );

  const downloadInvoice = useCallback(
    async (id: string): Promise<void> => {
      try {
        setIsDownloading(true);
        // Ouvrir le téléchargement dans une nouvelle fenêtre
        window.open(`/api/invoices/${id}/download`, '_blank');
        addSuccess('Téléchargement de la facture démarré');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur lors du téléchargement de la facture';
        addError(errorMessage);
      } finally {
        setIsDownloading(false);
      }
    },
    [addSuccess, addError],
  );

  const sendInvoiceByEmail = useCallback(
    async (id: string): Promise<void> => {
      try {
        setIsSending(true);
        const response = await fetch(`/api/invoices/${id}/send`, {
          method: 'POST',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erreur lors de l\'envoi de la facture par email');
        }

        addSuccess('Facture envoyée par email avec succès');
        await onSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur lors de l\'envoi de la facture par email';
        addError(errorMessage);
      } finally {
        setIsSending(false);
      }
    },
    [addSuccess, addError, onSuccess],
  );

  return {
    deleteInvoice,
    downloadInvoice,
    sendInvoiceByEmail,
    isDownloading,
    isSending,
  };
}

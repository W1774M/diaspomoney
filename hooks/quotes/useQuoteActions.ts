'use client';

import { useCallback, useState } from 'react';
import { useNotificationManager } from '@/components/ui/Notification';

export interface UseQuoteActionsReturn {
  deleteQuote: (id: string) => Promise<boolean>;
  approveQuote: (id: string) => Promise<boolean>;
  rejectQuote: (id: string) => Promise<boolean>;
  downloadQuote: (id: string) => Promise<void>;
  isDeleting: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  isDownloading: boolean;
}

/**
 * Hook pour les actions sur les devis (delete, approve, reject, download)
 * Implémente les design patterns :
 * - Custom Hooks Pattern
 * - Error Handling Pattern
 * - Notification Pattern
 */
export function useQuoteActions(
  onSuccess?: () => void | Promise<void>,
): UseQuoteActionsReturn {
  const { addSuccess, addError } = useNotificationManager();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const deleteQuote = useCallback(
    async (id: string): Promise<boolean> => {
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
        return false;
      }

      try {
        setIsDeleting(true);
        const response = await fetch(`/api/quotes/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erreur lors de la suppression du devis');
        }

        addSuccess('Devis supprimé avec succès');
        await onSuccess?.();
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur lors de la suppression du devis';
        addError(errorMessage);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [addSuccess, addError, onSuccess],
  );

  const approveQuote = useCallback(
    async (id: string): Promise<boolean> => {
      if (!window.confirm('Êtes-vous sûr de vouloir approuver ce devis ?')) {
        return false;
      }

      try {
        setIsApproving(true);
        const response = await fetch(`/api/quotes/${id}/approve`, {
          method: 'POST',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Erreur lors de l'approbation du devis");
        }

        addSuccess('Devis approuvé avec succès');
        await onSuccess?.();
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur lors de l'approbation du devis";
        addError(errorMessage);
        return false;
      } finally {
        setIsApproving(false);
      }
    },
    [addSuccess, addError, onSuccess],
  );

  const rejectQuote = useCallback(
    async (id: string): Promise<boolean> => {
      if (!window.confirm('Êtes-vous sûr de vouloir rejeter ce devis ?')) {
        return false;
      }

      try {
        setIsRejecting(true);
        const response = await fetch(`/api/quotes/${id}/reject`, {
          method: 'POST',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erreur lors du rejet du devis');
        }

        addSuccess('Devis rejeté avec succès');
        await onSuccess?.();
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur lors du rejet du devis';
        addError(errorMessage);
        return false;
      } finally {
        setIsRejecting(false);
      }
    },
    [addSuccess, addError, onSuccess],
  );

  const downloadQuote = useCallback(
    async (id: string): Promise<void> => {
      try {
        setIsDownloading(true);
        const response = await fetch(`/api/quotes/${id}/download`, {
          method: 'GET',
        });

        if (!response.ok) {
          if (response.status === 404) {
            addError('Devis non trouvé');
            return;
          }
          if (response.status === 403) {
            addError('Accès non autorisé');
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erreur lors du téléchargement du devis');
        }

        // Récupérer le blob PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Extraire le nom de fichier depuis les headers ou utiliser un nom par défaut
        const contentDisposition = response.headers.get('content-disposition');
        const filename =
          contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || `devis-${id}.pdf`;

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        addSuccess('Devis téléchargé avec succès');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur lors du téléchargement du devis';
        addError(errorMessage);
      } finally {
        setIsDownloading(false);
      }
    },
    [addSuccess, addError],
  );

  return {
    deleteQuote,
    approveQuote,
    rejectQuote,
    downloadQuote,
    isDeleting,
    isApproving,
    isRejecting,
    isDownloading,
  };
}


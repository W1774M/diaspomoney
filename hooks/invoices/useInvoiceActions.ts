'use client';

import { useNotificationManager } from '@/components/ui/Notification';
import { useCallback, useState } from 'react';

interface UseInvoiceActionsReturn {
  downloadInvoice: (invoiceId: string) => Promise<void>;
  sendInvoiceByEmail: (invoiceId: string) => Promise<void>;
  isDownloading: boolean;
  isSending: boolean;
}

/**
 * Custom Hook pour les actions sur les factures (download, send email, print)
 * Implémente le Custom Hooks Pattern
 */
export function useInvoiceActions(): UseInvoiceActionsReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { addSuccess, addError } = useNotificationManager();

  const downloadInvoice = useCallback(
    async (invoiceId: string) => {
      if (!invoiceId) {
        addError('ID de facture manquant');
        return;
      }

      try {
        setIsDownloading(true);

        const response = await fetch(`/api/invoices/${invoiceId}/download`, {
          method: 'GET',
        });

        if (!response.ok) {
          if (response.status === 404) {
            addError('Facture non trouvée');
          } else if (response.status === 403) {
            addError('Accès non autorisé');
          } else {
            addError('Erreur lors du téléchargement de la facture');
          }
          return;
        }

        // Récupérer le blob PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Extraire le nom de fichier depuis les headers ou utiliser un nom par défaut
        const contentDisposition = response.headers.get('content-disposition');
        const filename =
          contentDisposition?.split('filename=')[1]?.replace(/"/g, '') ||
          `facture-${invoiceId}.pdf`;

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        addSuccess('Facture téléchargée avec succès');
      } catch (error) {
        addError('Erreur lors du téléchargement de la facture');
      } finally {
        setIsDownloading(false);
      }
    },
    [addSuccess, addError]
  );

  const sendInvoiceByEmail = useCallback(
    async (invoiceId: string) => {
      if (!invoiceId) {
        addError('ID de facture manquant');
        return;
      }

      try {
        setIsSending(true);

        const response = await fetch(`/api/invoices/${invoiceId}/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          if (response.status === 404) {
            addError('Facture non trouvée');
          } else if (response.status === 403) {
            addError('Accès non autorisé');
          } else {
            addError(
              data.error || "Erreur lors de l'envoi de la facture par email"
            );
          }
          return;
        }

        const data = await response.json();
        if (data.success) {
          addSuccess('Facture envoyée par email avec succès');
        } else {
          addError(data.error || "Erreur lors de l'envoi de la facture");
        }
      } catch (error) {
        addError("Erreur lors de l'envoi de la facture par email");
      } finally {
        setIsSending(false);
      }
    },
    [addSuccess, addError]
  );

  return {
    downloadInvoice,
    sendInvoiceByEmail,
    isDownloading,
    isSending,
  };
}

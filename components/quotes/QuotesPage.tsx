'use client';
/**
 * QuotesPage Component
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useQuoteFilters, usePermissions)
 * - Error Handling Pattern (via useNotificationManager)
 * - Notification Pattern (via useNotificationManager)
 */

import { useNotificationManager } from '@/components/ui/Notification';
import { useQuoteFilters } from '@/hooks/quotes';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import QuotesFilters from './QuotesFilters';
import QuotesHeader from './QuotesHeader';
import QuotesTable from './QuotesTable';

const QuotesPage = React.memo(function QuotesPage() {
  const { canCreateQuotes } = usePermissions();
  const { addSuccess, addError } = useNotificationManager();
  const router = useRouter();

  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'ALL'
  >('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Récupérer les devis depuis la base de données après authentification
  useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/quotes', { method: 'GET' });
        if (!response.ok) {
          setQuotes([]);
          setLoading(false);
          return;
        }
        const data = await response.json();
        setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
      } catch (_error) {
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  const { filteredQuotes, updateFilter, clearFilters, hasActiveFilters } =
    useQuoteFilters(quotes);

  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/quotes/${id}`);
    },
    [router],
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/dashboard/quotes/${id}/edit`);
    },
    [router],
  );

  // Suppression réelle du devis via l'API
  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
        try {
          setLoading(true);
          const response = await fetch(`/api/quotes/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            setQuotes(prev =>
              prev.filter(quote => quote._id !== id && quote.id !== id),
            );
            addSuccess('Devis supprimé avec succès');
          } else {
            addError('Erreur lors de la suppression du devis');
          }
        } catch (_error) {
          addError('Erreur lors de la suppression du devis');
        } finally {
          setLoading(false);
        }
      }
    },
    [addSuccess, addError],
  );

  const handleDownload = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/quotes/${id}/download`, {
          method: 'GET',
        });

        if (!response.ok) {
          if (response.status === 404) {
            addError('Devis non trouvé');
          } else if (response.status === 403) {
            addError('Accès non autorisé');
          } else {
            addError('Erreur lors du téléchargement du devis');
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
          `devis-${id}.pdf`;

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        addSuccess('Devis téléchargé avec succès');
      } catch (_error) {
        addError('Erreur lors du téléchargement du devis');
      }
    },
    [addSuccess, addError],
  );

  const handleApprove = useCallback(
    async (id: string) => {
      if (window.confirm('Êtes-vous sûr de vouloir approuver ce devis ?')) {
        try {
          setLoading(true);
          const response = await fetch(`/api/quotes/${id}/approve`, {
            method: 'POST',
          });
          if (response.ok) {
            // Mettre à jour le statut dans la liste côté client pour un feedback immédiat
            setQuotes(prev =>
              prev.map(quote =>
                quote._id === id || quote.id === id
                  ? { ...quote, status: 'APPROVED' }
                  : quote,
              ),
            );
            addSuccess('Devis approuvé avec succès');
          } else {
            addError("Erreur lors de l'approbation du devis");
          }
        } catch (_error) {
          addError("Erreur lors de l'approbation du devis");
        } finally {
          setLoading(false);
        }
      }
    },
    [addSuccess, addError],
  );

  const handleReject = useCallback(
    async (id: string) => {
      if (window.confirm('Êtes-vous sûr de vouloir rejeter ce devis ?')) {
        try {
          setLoading(true);
          const response = await fetch(`/api/quotes/${id}/reject`, {
            method: 'POST',
          });
          if (response.ok) {
            setQuotes(prev =>
              prev.map(quote =>
                quote._id === id || quote.id === id
                  ? { ...quote, status: 'REJECTED' }
                  : quote,
              ),
            );
            addSuccess('Devis rejeté avec succès');
          } else {
            addError('Erreur lors du rejet du devis');
          }
        } catch (_error) {
          addError('Erreur lors du rejet du devis');
        } finally {
          setLoading(false);
        }
      }
    },
    [addSuccess, addError],
  );

  const handleAddQuote = useCallback(() => {
    router.push('/dashboard/quotes/new');
  }, [router]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      updateFilter('searchTerm', value);
    },
    [updateFilter],
  );

  const handleStatusChange = useCallback(
    (value: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'ALL') => {
      setStatusFilter(value);
      updateFilter('statusFilter', value);
    },
    [updateFilter],
  );

  const handleDateChange = useCallback(
    (value: string) => {
      setDateFilter(value);
      updateFilter('dateFilter', value);
    },
    [updateFilter],
  );

  // Les clients peuvent voir les devis mais ne peuvent pas en créer
  // Pas de restriction d'accès complète, juste masquer le bouton de création

  return (
    <div className='space-y-6'>
      <QuotesHeader
        totalQuotes={filteredQuotes.length}
        onAddQuote={handleAddQuote}
        canCreate={canCreateQuotes}
      />

      <QuotesFilters
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusChange}
        dateFilter={dateFilter}
        setDateFilter={handleDateChange}
      />

      {hasActiveFilters && (
        <div className='flex justify-end'>
          <button
            onClick={clearFilters}
            className='px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors'
          >
            Effacer tous les filtres
          </button>
        </div>
      )}

      <QuotesTable
        quotes={filteredQuotes}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
});

QuotesPage.displayName = 'QuotesPage';

export default QuotesPage;

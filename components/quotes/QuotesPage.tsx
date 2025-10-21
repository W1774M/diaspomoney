'use client';

import { useQuoteFilters } from '@/hooks/quotes';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import QuotesFilters from './QuotesFilters';
import QuotesHeader from './QuotesHeader';
import QuotesTable from './QuotesTable';

const QuotesPage = React.memo(function QuotesPage() {
  const { canCreateQuotes } = usePermissions();
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
      } catch (err) {
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
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/dashboard/quotes/${id}/edit`);
    },
    [router]
  );

  // Suppression réelle du devis via l'API
  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      try {
        setLoading(true);
        const response = await fetch(`/api/quotes/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setQuotes(prev =>
            prev.filter(quote => quote._id !== id && quote.id !== id)
          );
        }
      } catch (e) {
        // Gérer l'erreur si besoin
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const handleDownload = useCallback((id: string) => {
    // À implémenter : téléchargement d'un PDF de devis
    console.log('Télécharger le devis:', id);
  }, []);

  const handleApprove = useCallback(async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir approuver ce devis ?')) {
      try {
        setLoading(true);
        const response = await fetch(`/api/quotes/${id}/approve`, {
          method: 'POST',
        });
        if (response.ok) {
          // Optionnel : mettre à jour le status dans la liste côté client
          setQuotes(prev =>
            prev.map(quote =>
              quote._id === id || quote.id === id
                ? { ...quote, status: 'APPROVED' }
                : quote
            )
          );
        }
      } catch (e) {
        // Gérer l'erreur si besoin
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const handleReject = useCallback(async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir rejeter ce devis ?')) {
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
                : quote
            )
          );
        }
      } catch (e) {
        // Gérer l'erreur si besoin
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const handleAddQuote = useCallback(() => {
    router.push('/dashboard/quotes/new');
  }, [router]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      updateFilter('searchTerm', value);
    },
    [updateFilter]
  );

  const handleStatusChange = useCallback(
    (value: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'ALL') => {
      setStatusFilter(value);
      updateFilter('statusFilter', value);
    },
    [updateFilter]
  );

  const handleDateChange = useCallback(
    (value: string) => {
      setDateFilter(value);
      updateFilter('dateFilter', value);
    },
    [updateFilter]
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

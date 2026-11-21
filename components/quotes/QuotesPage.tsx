'use client';
/**
 * QuotesPage Component
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useQuoteFilters, usePermissions)
 * - Error Handling Pattern (via useNotificationManager)
 * - Notification Pattern (via useNotificationManager)
 */

import { useQuoteFilters, useQuotes, useQuoteActions } from '@/hooks/quotes';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import QuotesFilters from './QuotesFilters';
import QuotesHeader from './QuotesHeader';
import QuotesTable from './QuotesTable';

const QuotesPage = React.memo(function QuotesPage() {
  const { canCreateQuotes } = usePermissions();
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'ALL'
  >('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Utiliser le hook useQuotes pour récupérer les devis
  const { quotes, loading, error: quotesError, refetch } = useQuotes({
    userId: user?.id,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    isAdmin: isAdmin(),
  });

  const { filteredQuotes, updateFilter, clearFilters, hasActiveFilters } =
    useQuoteFilters(quotes);

  // Utiliser le hook useQuoteActions pour les actions
  const { deleteQuote, approveQuote, rejectQuote, downloadQuote } = useQuoteActions(refetch);

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

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteQuote(id);
    },
    [deleteQuote],
  );

  const handleDownload = useCallback(
    async (id: string) => {
      await downloadQuote(id);
    },
    [downloadQuote],
  );

  const handleApprove = useCallback(
    async (id: string) => {
      await approveQuote(id);
    },
    [approveQuote],
  );

  const handleReject = useCallback(
    async (id: string) => {
      await rejectQuote(id);
    },
    [rejectQuote],
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

      {quotesError && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>{quotesError}</p>
          <button
            onClick={() => refetch()}
            className='mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
          >
            Réessayer
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

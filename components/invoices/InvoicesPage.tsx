'use client';
/**
 * InvoicesPage Component
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useInvoiceFilters, useAuth, usePermissions)
 * - Error Handling Pattern (via useNotificationManager)
 * - Notification Pattern (via useNotificationManager)
 */

import { useAuth } from '@/hooks';
import { useInvoiceFilters, useInvoices, useInvoiceActions } from '@/hooks/invoices';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import InvoicesFilters from './InvoicesFilters';
import InvoicesHeader from './InvoicesHeader';
import InvoicesTable from './InvoicesTable';
import InvoicesTabs from './InvoicesTabs';

const InvoicesPage = React.memo(function InvoicesPage() {
  const { user, isAdmin, isProvider, isCustomer } = useAuth();
  const { canCreateInvoices } = usePermissions();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'ALL'
  >('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [activeTab, setActiveTab] = useState<
    'all' | 'as-provider' | 'as-customer'
  >('all');

  // Utiliser le hook useInvoices pour récupérer les factures
  const { invoices, loading, error: invoicesError, refetch } = useInvoices({
    userId: user?.id,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    isAdmin: isAdmin(),
    isProvider: isProvider(),
    isCustomer: isCustomer(),
  });

  const { filteredInvoices, updateFilter, clearFilters, hasActiveFilters } =
    useInvoiceFilters(invoices);

  // Utiliser le hook useInvoiceActions pour les actions
  const { deleteInvoice, downloadInvoice } = useInvoiceActions(refetch);

  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/invoices/${id}`);
    },
    [router],
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/dashboard/invoices/${id}/edit`);
    },
    [router],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteInvoice(id);
    },
    [deleteInvoice],
  );

  const handleDownload = useCallback(
    async (id: string) => {
      await downloadInvoice(id);
    },
    [downloadInvoice],
  );

  const handleAddInvoice = useCallback(() => {
    router.push('/dashboard/invoices/new');
  }, [router]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      updateFilter('searchTerm', value);
    },
    [updateFilter],
  );

  const handleStatusChange = useCallback(
    (value: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'ALL') => {
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

  // Les clients peuvent voir les factures mais ne peuvent pas en créer
  // Pas de restriction d'accès complète, juste masquer le bouton de création

  return (
    <div className='space-y-6'>
      <InvoicesHeader
        totalInvoices={filteredInvoices.length}
        onAddInvoice={handleAddInvoice}
        canCreate={canCreateInvoices}
      />

      <InvoicesTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin()}
        isProvider={isProvider()}
        isCustomer={isCustomer()}
      />

      <InvoicesFilters
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

      {invoicesError && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>{invoicesError}</p>
          <button
            onClick={() => refetch()}
            className='mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
          >
            Réessayer
          </button>
        </div>
      )}

      <InvoicesTable
        invoices={filteredInvoices}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDownload={handleDownload}
      />
    </div>
  );
});

InvoicesPage.displayName = 'InvoicesPage';

export default InvoicesPage;

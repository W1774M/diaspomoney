'use client';

import { useAuth } from '@/hooks';
import { useInvoiceFilters } from '@/hooks/invoices';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import InvoicesFilters from './InvoicesFilters';
import InvoicesHeader from './InvoicesHeader';
import InvoicesTable from './InvoicesTable';
import InvoicesTabs from './InvoicesTabs';

const InvoicesPage = React.memo(function InvoicesPage() {
  const { user, isAdmin, isProvider, isCustomer } = useAuth();
  const { canCreateInvoices } = usePermissions();
  const router = useRouter();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'ALL'
  >('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [activeTab, setActiveTab] = useState<
    'all' | 'as-provider' | 'as-customer'
  >('all');

  // Récupérer les factures depuis la base de données
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) {
        setInvoices([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Appel à l'API pour récupérer les factures de l'utilisateur connecté
        const response = await fetch('/api/invoices', { method: 'GET' });
        if (!response.ok) {
          setInvoices([]);
          setLoading(false);
          return;
        }
        const data = await response.json();
        // Optionnel: filtrer par utilisateur côté client si l'API retourne trop large
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
      } catch (err) {
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user]);

  const { filteredInvoices, updateFilter, clearFilters, hasActiveFilters } =
    useInvoiceFilters(invoices);

  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/invoices/${id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/dashboard/invoices/${id}/edit`);
    },
    [router]
  );

  // Optionnel: Ici on peut appeler une API pour supprimer réellement la facture
  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      try {
        setLoading(true);
        const response = await fetch(`/api/invoices/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setInvoices(prev => prev.filter(invoice => invoice._id !== id));
        }
      } catch (e) {
        // Gérer l'erreur si besoin
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const handleDownload = useCallback((id: string) => {
    // Implémenter le téléchargement de la facture
    console.log('Télécharger la facture:', id);
  }, []);

  const handleAddInvoice = useCallback(() => {
    router.push('/dashboard/invoices/new');
  }, [router]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      updateFilter('searchTerm', value);
    },
    [updateFilter]
  );

  const handleStatusChange = useCallback(
    (value: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'ALL') => {
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

'use client';

import {
  PaymentReceiptCard,
  PaymentReceiptFilters,
  PaymentStats,
} from '@/components/payments';
import { useInvoiceActions } from '@/hooks/invoices';
import { usePaymentReceipts, type PaymentReceipt } from '@/hooks/payments';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

/**
 * Page des reçus de paiement
 * Implémente les design patterns :
 * - Custom Hooks Pattern (via usePaymentReceipts, useInvoiceActions)
 * - Service Layer Pattern (via les hooks qui appellent les API)
 * - Logger Pattern (structured logging côté serveur via les API routes)
 * - Error Handling Pattern (gestion d'erreurs via les hooks et notifications)
 */
export default function PaymentReceiptsPage() {
  const router = useRouter();
  const { receipts, loading, error, refetch } = usePaymentReceipts();
  const { downloadInvoice } = useInvoiceActions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'service'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredReceipts = useMemo(() => {
    return receipts
      .filter(receipt => {
        const matchesSearch =
          receipt.invoiceNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          receipt.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
          receipt.provider.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === 'all' || receipt.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'date':
            comparison =
              new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'amount':
            comparison = a.amount - b.amount;
            break;
          case 'service':
            comparison = a.service.localeCompare(b.service);
            break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [receipts, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleDownload = async (receipt: PaymentReceipt) => {
    // Utiliser le hook pour télécharger la facture
    if (receipt.id) {
      await downloadInvoice(receipt.id);
    }
  };

  const handleView = (receipt: PaymentReceipt) => {
    // Rediriger vers la page de détail de la facture
    if (receipt.id) {
      router.push(`/dashboard/invoices/${receipt.id}`);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center'>
              <Link
                href='/dashboard'
                className='flex items-center text-gray-500 hover:text-gray-700 mr-4'
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                Retour au dashboard
              </Link>
              <h1 className='text-2xl font-bold text-gray-900'>
                Reçus de paiement
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Filtres et recherche */}
        <PaymentReceiptFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />

        {/* Liste des reçus */}
        <div className='bg-white rounded-lg shadow border border-gray-200'>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Historique des paiements
              </h2>
              <div className='text-sm text-gray-500'>
                {filteredReceipts.length} reçu
                {filteredReceipts.length > 1 ? 's' : ''}
              </div>
            </div>

            {loading ? (
              <div className='text-center py-12'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto mb-4'></div>
                <p className='text-gray-500'>Chargement des reçus...</p>
              </div>
            ) : error ? (
              <div className='text-center py-12'>
                <div className='text-red-500 mb-4'>
                  <svg
                    className='h-12 w-12 mx-auto mb-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  Erreur lors du chargement
                </h3>
                <p className='text-red-500 mb-4'>{error}</p>
                <button
                  onClick={refetch}
                  className='text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] font-medium'
                >
                  Réessayer
                </button>
              </div>
            ) : filteredReceipts.length > 0 ? (
              <div className='space-y-4'>
                {filteredReceipts.map(receipt => (
                  <PaymentReceiptCard
                    key={receipt.id}
                    receipt={receipt}
                    onView={handleView}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <FileText className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  {searchTerm || statusFilter !== 'all'
                    ? 'Aucun reçu trouvé'
                    : 'Aucun reçu de paiement'}
                </h3>
                <p className='text-gray-500 mb-4'>
                  {searchTerm || statusFilter !== 'all'
                    ? 'Aucun reçu ne correspond à vos critères de recherche.'
                    : "Vous n'avez pas encore effectué de paiements. Vos reçus apparaîtront ici après vos premiers paiements."}
                </p>
                {searchTerm || statusFilter !== 'all' ? (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className='text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] font-medium'
                  >
                    Effacer les filtres
                  </button>
                ) : (
                  <Link
                    href='/dashboard'
                    className='inline-flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] font-medium'
                  >
                    <ArrowLeft className='h-4 w-4 mr-2' />
                    Retour au tableau de bord
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Statistiques */}
        {filteredReceipts.length > 0 && (
          <div className='mt-8'>
            <PaymentStats
              totalPaid={filteredReceipts
                .filter(r => r.status === 'paid')
                .reduce((sum, r) => sum + r.amount, 0)}
              pendingCount={
                filteredReceipts.filter(r => r.status === 'pending').length
              }
              receiptsCount={filteredReceipts.length}
              currency='EUR'
            />
          </div>
        )}
      </div>
    </div>
  );
}

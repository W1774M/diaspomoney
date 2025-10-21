'use client';

import {
  PaymentReceiptCard,
  PaymentReceiptFilters,
  PaymentStats,
} from '@/components/payments';
import { useAuth } from '@/hooks/auth/useAuth';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface PaymentReceipt {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  service: string;
  provider: string;
  date: string;
  description: string;
  downloadUrl: string;
}

export default function PaymentReceiptsPage() {
  const {} = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'service'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceipts() {
      setLoading(true);
      setError(null);
      try {
        // Remplace cette URL par ton endpoint réel côté API
        const res = await fetch('/api/payment-receipts');
        if (!res.ok) {
          throw new Error('Erreur lors du chargement des reçus');
        }
        const data = await res.json();
        setReceipts(data.receipts || []);
      } catch (e: any) {
        setError(e.message ?? 'Erreur inconnue');
        setReceipts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchReceipts();
  }, []);

  const filteredReceipts = receipts
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
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
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

  const handleDownload = (receipt: PaymentReceipt) => {
    // Ici, vous pourriez implémenter la logique de téléchargement réel
    if (receipt.downloadUrl) {
      window.open(receipt.downloadUrl, '_blank');
    }
  };

  const handleView = (receipt: PaymentReceipt) => {
    // Ici, vous pourriez ouvrir un modal ou rediriger vers une page de détail
    // window.location.href = `/dashboard/payment-receipts/${receipt.id}`;
    // Pour l’instant console.log
    console.log(`Ouverture du reçu: ${receipt.invoiceNumber}`);
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
              <div className='text-center py-12 text-gray-400'>
                Chargement...
              </div>
            ) : error ? (
              <div className='text-center py-12 text-red-500'>{error}</div>
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
                  Aucun reçu trouvé
                </h3>
                <p className='text-gray-500 mb-4'>
                  {searchTerm || statusFilter !== 'all'
                    ? 'Aucun reçu ne correspond à vos critères de recherche.'
                    : "Vous n'avez pas encore de reçus de paiement."}
                </p>
                {(searchTerm || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className='text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] font-medium'
                  >
                    Effacer les filtres
                  </button>
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

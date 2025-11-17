'use client';

/**
 * Page Historique des Commandes
 * Affiche toutes les commandes passées avec factures, notation et possibilité de réserver à nouveau
 */

import HistoricalOrderCard from '@/components/orders/HistoricalOrderCard';
import { useAuth } from '@/hooks';
import { HistoricalOrder } from '@/types/orders';
import { FileText, Package, Search, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function OrderHistoryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<HistoricalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'completed' | 'cancelled'
  >('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistoricalOrders();
    }
  }, [isAuthenticated]);

  const fetchHistoricalOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders/history');
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de l'historique");
      }
      const data = await response.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching historical orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = useCallback(
    (order: HistoricalOrder) => {
      router.push(`/dashboard/orders/${order._id}`);
    },
    [router],
  );

  const handleDownloadInvoice = useCallback(async (order: HistoricalOrder) => {
    if (!order.invoiceId) {
      alert('Aucune facture disponible pour cette commande');
      return;
    }
    try {
      const response = await fetch(`/api/invoices/${order.invoiceId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-${order.invoiceNumber || order.orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Erreur lors du téléchargement de la facture');
    }
  }, []);

  const handleRate = useCallback(
    (order: HistoricalOrder) => {
      router.push(`/dashboard/orders/${order._id}/rate`);
    },
    [router],
  );

  const handleReorder = useCallback(
    (order: HistoricalOrder) => {
      router.push(`/dashboard/services?reorder=${order.bookingId}`);
    },
    [router],
  );

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      !searchTerm ||
      order.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.providerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Historique des Commandes
          </h1>
          <p className='text-gray-600 mt-1'>
            Consultez toutes vos commandes passées
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Total</p>
              <p className='text-2xl font-bold text-gray-900'>
                {orders.length}
              </p>
            </div>
            <Package className='h-8 w-8 text-blue-500' />
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Terminées</p>
              <p className='text-2xl font-bold text-green-600'>
                {orders.filter(o => o.status === 'completed').length}
              </p>
            </div>
            <FileText className='h-8 w-8 text-green-500' />
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>À noter</p>
              <p className='text-2xl font-bold text-orange-600'>
                {
                  orders.filter(o => o.status === 'completed' && !o.rating)
                    .length
                }
              </p>
            </div>
            <Star className='h-8 w-8 text-orange-500' />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1 relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
            <input
              type='text'
              placeholder='Rechercher une commande...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
            />
          </div>
          <select
            title='Filtrer par statut'
            value={filterStatus}
            onChange={e =>
              setFilterStatus(
                e.target.value as 'all' | 'completed' | 'cancelled',
              )
            }
            className='px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
          >
            <option value='all'>Tous les statuts</option>
            <option value='completed'>Terminées</option>
            <option value='cancelled'>Annulées</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)]'></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className='text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200'>
          <Package className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Aucune commande dans l&apos;historique
          </h3>
          <p className='text-gray-600'>
            Vos commandes terminées apparaîtront ici
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {filteredOrders.map(order => (
            <HistoricalOrderCard
              key={order._id}
              order={order}
              onView={handleViewOrder}
              onDownloadInvoice={handleDownloadInvoice}
              onRate={handleRate}
              onReorder={handleReorder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

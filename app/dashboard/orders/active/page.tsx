'use client';

/**
 * Page des Commandes Actives
 * Affiche la liste des services en cours avec progression, prestataires, date de livraison et chat
 */

import ActiveOrderCard from '@/components/orders/ActiveOrderCard';
import { useAuth } from '@/hooks';
import { ActiveOrder } from '@/types/orders';
import { Calendar, Clock, Package, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function ActiveOrdersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending' | 'confirmed' | 'in_progress'
  >('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveOrders();
    }
  }, [isAuthenticated]);

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders/active');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des commandes');
      }
      const data = await response.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching active orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = useCallback(
    (order: ActiveOrder) => {
      router.push(`/dashboard/orders/${order._id}`);
    },
    [router],
  );

  const handleChat = useCallback(
    (order: ActiveOrder) => {
      if (order.conversationId) {
        router.push(
          `/dashboard/messaging/users?conversation=${order.conversationId}`,
        );
      } else {
        // Créer une conversation si elle n'existe pas
        router.push(`/dashboard/orders/${order._id}/chat`);
      }
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
            Commandes Actives
          </h1>
          <p className='text-gray-600 mt-1'>
            Suivez vos services en cours de réalisation
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
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
              <p className='text-sm text-gray-600'>En cours</p>
              <p className='text-2xl font-bold text-orange-600'>
                {orders.filter(o => o.status === 'in_progress').length}
              </p>
            </div>
            <Clock className='h-8 w-8 text-orange-500' />
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Confirmées</p>
              <p className='text-2xl font-bold text-green-600'>
                {orders.filter(o => o.status === 'confirmed').length}
              </p>
            </div>
            <Calendar className='h-8 w-8 text-green-500' />
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>En attente</p>
              <p className='text-2xl font-bold text-yellow-600'>
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
            <Clock className='h-8 w-8 text-yellow-500' />
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
                e.target.value as
                  | 'all'
                  | 'pending'
                  | 'confirmed'
                  | 'in_progress',
              )
            }
            className='px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
          >
            <option value='all'>Tous les statuts</option>
            <option value='pending'>En attente</option>
            <option value='confirmed'>Confirmées</option>
            <option value='in_progress'>En cours</option>
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
            Aucune commande active
          </h3>
          <p className='text-gray-600'>
            Vous n&apos;avez pas de services en cours pour le moment
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {filteredOrders.map(order => (
            <ActiveOrderCard
              key={order._id}
              order={order}
              onView={handleViewOrder}
              onChat={handleChat}
            />
          ))}
        </div>
      )}
    </div>
  );
}

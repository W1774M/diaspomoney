'use client';

/**
 * Composant pour afficher une commande active
 * Implémente le Component Pattern avec props typées
 */

import imageLoader from '@/lib/image-loader';
import { ActiveOrderCardProps } from '@/types/orders';
import {
  Calendar,
  ChevronRight,
  MessageSquare,
  User,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import OrderProgressBar from './OrderProgressBar';

// Format date helper
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export default function ActiveOrderCard({
  order,
  onView,
  onChat,
}: ActiveOrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'>
      <div className='p-6'>
        {/* Header */}
        <div className='flex items-start justify-between mb-4'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <h3 className='text-lg font-semibold text-gray-900'>
                {order.serviceName}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
            <p className='text-sm text-gray-600'>N° {order.orderNumber}</p>
          </div>
          <button
            onClick={() => onView(order)}
            aria-label='Voir les détails de la commande'
            className='text-gray-400 hover:text-gray-600 transition-colors'
            title='Voir les détails'
          >
            <ChevronRight className='h-5 w-5' />
          </button>
        </div>

        {/* Progress */}
        {order.progress && (
          <div className='mb-4'>
            <OrderProgressBar progress={order.progress} showSteps={false} />
          </div>
        )}

        {/* Provider Info */}
        <div className='flex items-center gap-4 mb-4'>
          <div className='flex items-center gap-2'>
            {order.providerAvatar ? (
              <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-200'>
                <Image
                  src={order.providerAvatar}
                  alt={order.providerName}
                  width={40}
                  height={40}
                  className='object-cover'
                  loader={imageLoader}
                  unoptimized
                />
              </div>
            ) : (
              <div className='w-10 h-10 rounded-full bg-[hsl(25,100%,53%)] flex items-center justify-center'>
                <User className='h-5 w-5 text-white' />
              </div>
            )}
            <div>
              <p className='text-sm font-medium text-gray-900'>
                {order.providerName}
              </p>
              <p className='text-xs text-gray-500'>Prestataire principal</p>
            </div>
          </div>

          {/* Assigned Providers */}
          {order.assignedProviders && order.assignedProviders.length > 0 && (
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Users className='h-4 w-4' />
              <span>
                +{order.assignedProviders.length} autre
                {order.assignedProviders.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Delivery Date */}
        <div className='flex items-center gap-2 mb-4 text-sm text-gray-600'>
          <Calendar className='h-4 w-4' />
          <span>
            Livraison estimée:{' '}
            <span className='font-medium text-gray-900'>
              {formatDate(new Date(order.estimatedDeliveryDate))}
            </span>
          </span>
        </div>

        {/* Actions */}
        <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
          <div className='text-sm text-gray-600'>
            <span className='font-medium text-gray-900'>
              {order.amount.toFixed(2)} {order.currency}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            {order.chatEnabled && (
              <button
                onClick={() => onChat(order)}
                className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-[hsl(25,100%,53%)] hover:bg-orange-50 rounded-md transition-colors'
              >
                <MessageSquare className='h-4 w-4' />
                Chat
              </button>
            )}
            <button
              onClick={() => onView(order)}
              className='px-4 py-2 text-sm font-medium text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,48%)] rounded-md transition-colors'
            >
              Voir les détails
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

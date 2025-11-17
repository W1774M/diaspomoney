'use client';

/**
 * Composant pour afficher une commande historique
 * Implémente le Component Pattern avec props typées
 */

import imageLoader from '@/lib/image-loader';
import { HistoricalOrderCardProps } from '@/types/orders';
import { ChevronRight, Download, RefreshCw, Star } from 'lucide-react';
import Image from 'next/image';
// Format date helper
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export default function HistoricalOrderCard({
  order,
  onView,
  onDownloadInvoice,
  onRate,
  onReorder,
}: HistoricalOrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
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
                  order.status,
                )}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
            <p className='text-sm text-gray-600'>N° {order.orderNumber}</p>
          </div>
          <button
            onClick={() => onView(order)}
            className='text-gray-400 hover:text-gray-600 transition-colors'
            title='Voir les détails'
          >
            <ChevronRight className='h-5 w-5' />
          </button>
        </div>

        {/* Provider Info */}
        <div className='flex items-center gap-3 mb-4'>
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
            <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center'>
              <span className='text-gray-500 text-sm font-medium'>
                {order.providerName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className='text-sm font-medium text-gray-900'>
              {order.providerName}
            </p>
            <p className='text-xs text-gray-500'>
              {formatDate(new Date(order.completedDate))}
            </p>
          </div>
        </div>

        {/* Rating */}
        {order.rating && (
          <div className='flex items-center gap-1 mb-4'>
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= order.rating!
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
            {order.review && (
              <p className='text-sm text-gray-600 ml-2'>{order.review}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
          <div className='text-sm text-gray-600'>
            <span className='font-medium text-gray-900'>
              {order.amount.toFixed(2)} {order.currency}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            {order.invoiceId && (
              <button
                onClick={() => onDownloadInvoice(order)}
                className='flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                title='Télécharger la facture'
              >
                <Download className='h-4 w-4' />
                <span className='hidden sm:inline'>Facture</span>
              </button>
            )}
            {order.status === 'completed' && !order.rating && (
              <button
                onClick={() => onRate(order)}
                className='flex items-center gap-2 px-3 py-2 text-sm font-medium text-[hsl(25,100%,53%)] hover:bg-orange-50 rounded-md transition-colors'
              >
                <Star className='h-4 w-4' />
                Noter
              </button>
            )}
            {order.canReorder && (
              <button
                onClick={() => onReorder(order)}
                className='flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,48%)] rounded-md transition-colors'
              >
                <RefreshCw className='h-4 w-4' />
                Réserver à nouveau
              </button>
            )}
            <button
              onClick={() => onView(order)}
              className='px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
            >
              Détails
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

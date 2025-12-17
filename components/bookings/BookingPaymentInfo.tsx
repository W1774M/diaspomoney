'use client';

import { CreditCard } from 'lucide-react';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

interface BookingPaymentInfoProps {
  booking: BookingResponse;
}

export default function BookingPaymentInfo({ booking }: BookingPaymentInfoProps) {
  if (!booking.metadata?.['paymentIntentId']) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(25,100%,53%)]" />
        Paiement
      </h2>
      <div className="space-y-3">
        {booking.metadata?.['totalAmount'] && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Montant total</span>
            <span className="text-lg font-semibold text-gray-900">
              {typeof booking.metadata['totalAmount'] === 'string'
                ? `${booking.metadata['totalAmount']}€`
                : `${booking.metadata['totalAmount'].toFixed(2)}€`}
            </span>
          </div>
        )}
        {booking.metadata?.['basePrice'] && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Prix de base</span>
            <span className="text-gray-700">
              {typeof booking.metadata['basePrice'] === 'string'
                ? `${booking.metadata['basePrice']}€`
                : `${booking.metadata['basePrice'].toFixed(2)}€`}
            </span>
          </div>
        )}
        {booking.metadata?.['optionsPrice'] && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Options</span>
            <span className="text-gray-700">
              {typeof booking.metadata['optionsPrice'] === 'string'
                ? `${booking.metadata['optionsPrice']}€`
                : `${booking.metadata['optionsPrice'].toFixed(2)}€`}
            </span>
          </div>
        )}
        <div>
          <p className="text-sm text-gray-500">ID de transaction</p>
          <p className="font-mono text-xs sm:text-sm text-gray-700 break-all">
            {booking.metadata['paymentIntentId']}
          </p>
        </div>
      </div>
    </div>
  );
}


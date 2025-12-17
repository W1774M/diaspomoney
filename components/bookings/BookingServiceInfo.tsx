'use client';

import type { SpecialityType } from '@/lib/types/constants.types';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

interface BookingServiceInfoProps {
  booking: BookingResponse;
  getServiceTypeLabel: (type: SpecialityType) => string;
}

export default function BookingServiceInfo({ booking, getServiceTypeLabel }: BookingServiceInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Informations du service</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Type de service</p>
          <p className="font-medium text-gray-900">{getServiceTypeLabel(booking.serviceType)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Service</p>
          <p className="font-medium text-gray-900 break-words">
            {booking.metadata?.['serviceLabel'] || booking.serviceId || 'Service non spécifié'}
          </p>
          {booking.metadata?.['serviceDescription'] && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
              {booking.metadata['serviceDescription']}
            </p>
          )}
        </div>
        {booking.metadata?.['serviceCategory'] && (
          <div>
            <p className="text-sm text-gray-500">Catégorie</p>
            <p className="font-medium text-gray-900">{booking.metadata['serviceCategory']}</p>
          </div>
        )}
      </div>
    </div>
  );
}


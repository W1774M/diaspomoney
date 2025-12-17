'use client';

import { User } from 'lucide-react';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

interface BookingBeneficiaryInfoProps {
  booking: BookingResponse;
}

export default function BookingBeneficiaryInfo({ booking }: BookingBeneficiaryInfoProps) {
  if (!booking.recipient) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
        <User className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(25,100%,53%)]" />
        Bénéficiaire
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <p className="text-sm text-gray-500">Nom complet</p>
          <p className="font-medium text-gray-900">
            {booking.recipient.firstName} {booking.recipient.lastName}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Téléphone</p>
          <p className="font-medium text-gray-900 break-words">{booking.recipient.phone}</p>
        </div>
      </div>
    </div>
  );
}


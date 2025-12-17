'use client';

import type { BookingResponse } from '@/lib/mappers/booking.mapper';

interface BookingAdditionalOptionsProps {
  booking: BookingResponse;
}

export default function BookingAdditionalOptions({ booking }: BookingAdditionalOptionsProps) {
  if (!booking.metadata?.['additionalOptions']) {
    return null;
  }

  let options: any[] = [];
  try {
    const rawOptions = booking.metadata['additionalOptions'];
    options = typeof rawOptions === 'string' ? JSON.parse(rawOptions) : rawOptions;
    if (!Array.isArray(options)) {
      return null;
    }
  } catch {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
          Options supplémentaires
        </h2>
        <p className="text-sm text-gray-500">Aucune option</p>
      </div>
    );
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
        Options supplémentaires
      </h2>
      <div className="space-y-2">
        {options.map((opt: any, index: number) => (
          <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
            <span className="text-sm text-gray-600">{opt.label || opt.id}</span>
            <span className="text-sm font-semibold text-gray-900">+{opt.price}€</span>
          </div>
        ))}
      </div>
    </div>
  );
}


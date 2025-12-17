'use client';

import { Calendar } from 'lucide-react';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

interface BookingAppointmentInfoProps {
  booking: BookingResponse;
  appointmentDate: Date | null;
}

export default function BookingAppointmentInfo({
  booking,
  appointmentDate,
}: BookingAppointmentInfoProps) {
  if (!appointmentDate && !booking.timeslot) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(25,100%,53%)]" />
        Rendez-vous
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {appointmentDate && (
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium text-gray-900 break-words">
              {appointmentDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}
        {booking.timeslot && (
          <div>
            <p className="text-sm text-gray-500">Heure</p>
            <p className="font-medium text-gray-900">{booking.timeslot}</p>
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import {
  formatBookingAmount,
  formatBookingDate,
  formatBookingTime,
  getPaymentStatusColor,
  getPaymentStatusDisplay,
  getRequesterName,
  getStatusColor,
  getStatusDisplay,
} from "@/lib/bookings/utils";
import type { BookingCardProps } from "@/lib/types";
import { Eye } from "lucide-react";
import Link from "next/link";
import React from "react";
import { AuthorizedContent } from "@/components/auth";
import { ROLES } from "@/lib/constants";
import { useBookingProgress } from "@/hooks/bookings/useBookingProgress";

const BookingCard = React.memo<BookingCardProps>(function BookingCard({
  booking,
  onView: _onView,
  onEdit: _onEdit,
  onCancel: _onCancel,
  showProgress = false,
}) {
  const requesterName = getRequesterName(booking);
  const bookingDate = formatBookingDate(booking);
  const bookingTime = formatBookingTime(booking);
  const bookingAmount = formatBookingAmount(booking);
  const statusDisplay = getStatusDisplay(booking.status);
  const statusColor = getStatusColor(booking.status);
  const paymentStatus = (booking.metadata?.['paymentStatus'] as string) || 'pending';
  const paymentStatusDisplay = getPaymentStatusDisplay(paymentStatus);
  const paymentStatusColor = getPaymentStatusColor(paymentStatus);

  // Utiliser le même hook que la page de détail pour calculer le taux de remplissage
  const progress = useBookingProgress(booking);
  const completionRate = progress.completionPercentage;
  const metadata = booking.metadata || {};
  const isDraft = metadata['isDraft'] === true;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {booking.reservationNumber}
          </div>
          <div className="text-sm text-gray-500">{requesterName}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{bookingDate}</div>
        <div className="text-sm text-gray-500">{bookingTime}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {bookingAmount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}
        >
          {statusDisplay}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusColor}`}
        >
          {paymentStatusDisplay}
        </span>
      </td>
      {showProgress && (
        <AuthorizedContent roles={[ROLES.ADMIN]}>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                <div
                  className={`h-2 rounded-full transition-all ${
                    completionRate === 100
                      ? 'bg-green-500'
                      : completionRate >= 75
                      ? 'bg-blue-500'
                      : completionRate >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 font-medium min-w-[35px]">
                {completionRate}%
              </span>
              {isDraft && completionRate < 100 && (
                <span className="text-xs text-yellow-600 font-medium" title="Commande en brouillon">
                  ⚠
                </span>
              )}
            </div>
          </td>
        </AuthorizedContent>
      )}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Link
          href={`/dashboard/bookings/${booking._id}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-900"
        >
          <Eye className="h-4 w-4 mr-1" />
          Voir
        </Link>
      </td>
    </tr>
  );
});

BookingCard.displayName = "BookingCard";

export default BookingCard;

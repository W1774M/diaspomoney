"use client";

import {
  formatBookingAmount,
  formatBookingDate,
  formatBookingTime,
  getPaymentStatusColor,
  getPaymentStatusDisplay,
  getProviderName,
  getProviderSpecialties,
  getRequesterName,
  getStatusColor,
  getStatusDisplay,
} from "@/lib/bookings/utils";
import { BookingCardProps } from "@/types/bookings";
import { Eye } from "lucide-react";
import Link from "next/link";
import React from "react";

const BookingCard = React.memo<BookingCardProps>(function BookingCard({
  booking,
  onView,
  onEdit,
  onCancel,
}) {
  const providerName = getProviderName(booking);
  const requesterName = getRequesterName(booking);
  const providerSpecialties = getProviderSpecialties(booking);
  const bookingDate = formatBookingDate(booking);
  const bookingTime = formatBookingTime(booking);
  const bookingAmount = formatBookingAmount(booking);
  const statusDisplay = getStatusDisplay(booking.status);
  const statusColor = getStatusColor(booking.status);
  const paymentStatusDisplay = getPaymentStatusDisplay(booking.paymentStatus);
  const paymentStatusColor = getPaymentStatusColor(booking.paymentStatus);

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
        <div className="text-sm text-gray-900">{providerName}</div>
        <div className="text-sm text-gray-500">{providerSpecialties}</div>
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
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Link
          href={`/dashboard/appointments/${appointment._id}`}
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

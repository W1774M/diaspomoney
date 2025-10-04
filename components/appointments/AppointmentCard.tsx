"use client";

import {
  formatAppointmentAmount,
  formatAppointmentDate,
  formatAppointmentTime,
  getPaymentStatusColor,
  getPaymentStatusDisplay,
  getProviderName,
  getProviderSpecialties,
  getRequesterName,
  getStatusColor,
  getStatusDisplay,
} from "@/lib/appointments/utils";
import { AppointmentCardProps } from "@/types/appointments";
import { Eye } from "lucide-react";
import Link from "next/link";
import React from "react";

const AppointmentCard = React.memo<AppointmentCardProps>(
  function AppointmentCard({ appointment, onView: _onView, onEdit: _onEdit, onCancel: _onCancel }) {
    const providerName = getProviderName(appointment);
    const requesterName = getRequesterName(appointment);
    const providerSpecialties = getProviderSpecialties(appointment);
    const appointmentDate = formatAppointmentDate(appointment);
    const appointmentTime = formatAppointmentTime(appointment);
    const appointmentAmount = formatAppointmentAmount(appointment);
    const statusDisplay = getStatusDisplay(appointment.status);
    const statusColor = getStatusColor(appointment.status);
    const paymentStatusDisplay = getPaymentStatusDisplay(
      appointment.paymentStatus,
    );
    const paymentStatusColor = getPaymentStatusColor(appointment.paymentStatus);

    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {appointment.reservationNumber}
            </div>
            <div className="text-sm text-gray-500">{requesterName}</div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{providerName}</div>
          <div className="text-sm text-gray-500">{providerSpecialties}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{appointmentDate}</div>
          <div className="text-sm text-gray-500">{appointmentTime}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {appointmentAmount}
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
  },
);

AppointmentCard.displayName = "AppointmentCard";

export default AppointmentCard;

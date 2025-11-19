"use client";

import type { BookingsHeaderProps } from "@/lib/types";
import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

const BookingsHeader = React.memo<BookingsHeaderProps>(function BookingsHeader({
  onNewBooking: _onNewBooking,
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Réservations</h1>
          <p className="mt-2 text-gray-600">
            Gérez vos réservations et suivez leur statut
          </p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle réservation
        </Link>
      </div>
    </div>
  );
});

BookingsHeader.displayName = "BookingsHeader";

export default BookingsHeader;

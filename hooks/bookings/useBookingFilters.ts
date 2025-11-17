"use client";

import { Booking, BookingFilters } from "@/types/bookings";
import { useCallback, useMemo, useState } from "react";

export function useBookingFilters(bookings: Booking[]) {
  const [filters, setFilters] = useState<BookingFilters>({
    searchTerm: "",
    status: "ALL",
    paymentStatus: "ALL",
    dateRange: {
      start: "",
      end: "",
    },
  });

  // Sécurité : s'assurer que bookings est un tableau
  const safeBookings = bookings || [];

  // Extract unique statuses from bookings
  const availableStatuses = useMemo(() => {
    return [...new Set(safeBookings.map(b => b.status))].sort();
  }, [safeBookings]);

  const availablePaymentStatuses = useMemo(() => {
    return [...new Set(safeBookings.map(b => b.paymentStatus))].sort();
  }, [safeBookings]);

  // Filter bookings based on current filters
  const filteredBookings = useMemo(() => {
    return safeBookings.filter(booking => {
      // Search term filter
      if (
        filters.searchTerm &&
        !booking.reservationNumber
          ?.toLowerCase()
          ?.includes(filters.searchTerm.toLowerCase()) &&
        !`${booking.provider?.firstName || ''} ${booking.provider?.lastName || ''}`
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) &&
        !`${booking.requester?.firstName || ''} ${booking.requester?.lastName || ''}`
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (filters.status !== "ALL" && booking.status !== filters.status) {
        return false;
      }

      // Payment status filter
      if (
        filters.paymentStatus !== "ALL" &&
        booking.paymentStatus !== filters.paymentStatus
      ) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const bookingDate = new Date(booking.date);
        const startDate = filters.dateRange.start
          ? new Date(filters.dateRange.start)
          : null;
        const endDate = filters.dateRange.end
          ? new Date(filters.dateRange.end)
          : null;

        if (startDate && bookingDate < startDate) {
          return false;
        }
        if (endDate && bookingDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [safeBookings, filters]);

  const updateFilter = useCallback(
    (
      key: keyof BookingFilters,
      value: string | { start: string; end: string },
    ) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      status: "ALL",
      paymentStatus: "ALL",
      dateRange: {
        start: "",
        end: "",
      },
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm.length > 0 ||
      filters.status !== "ALL" ||
      filters.paymentStatus !== "ALL" ||
      filters.dateRange.start.length > 0 ||
      filters.dateRange.end.length > 0
    );
  }, [filters]);

  return {
    filters,
    filteredBookings,
    availableStatuses,
    availablePaymentStatuses,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}

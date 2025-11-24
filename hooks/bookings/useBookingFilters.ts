"use client";

import type { BookingFilters } from "@/lib/types";
import type { BookingResponse } from "@/lib/mappers/booking.mapper";
import { useCallback, useMemo, useState } from "react";

export function useBookingFilters(bookings: BookingResponse[]) {
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
  const safeBookings = useMemo(() => bookings || [], [bookings]);

  // Extract unique statuses from bookings
  const availableStatuses = useMemo(() => {
    return [...new Set(safeBookings.map(b => b.status))].sort();
  }, [safeBookings]);

  // Payment status is derived from metadata or transaction status
  const availablePaymentStatuses = useMemo(() => {
    const paymentStatuses = safeBookings
      .map(b => (b.metadata?.['paymentStatus'] as string) || 'UNKNOWN')
      .filter((status): status is string => typeof status === 'string');
    return [...new Set(paymentStatuses)].sort();
  }, [safeBookings]);

  // Filter bookings based on current filters
  const filteredBookings = useMemo(() => {
    return safeBookings.filter(booking => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesReservationNumber = booking.reservationNumber
          ?.toLowerCase()
          .includes(searchLower);
        const matchesRecipient = booking.recipient
          ? `${booking.recipient.firstName || ''} ${booking.recipient.lastName || ''}`
              .toLowerCase()
              .includes(searchLower)
          : false;
        const matchesServiceId = booking.serviceId?.toLowerCase().includes(searchLower);
        
        if (!matchesReservationNumber && !matchesRecipient && !matchesServiceId) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== "ALL" && booking.status !== filters.status) {
        return false;
      }

      // Payment status filter
      if (filters.paymentStatus !== "ALL") {
        const bookingPaymentStatus = (booking.metadata?.['paymentStatus'] as string) || 'UNKNOWN';
        if (bookingPaymentStatus !== filters.paymentStatus) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const bookingDate = booking.appointmentDate 
          ? new Date(booking.appointmentDate)
          : new Date(booking.createdAt);
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

"use client";

import { Appointment, AppointmentFilters } from "@/types/appointments";
import { useCallback, useMemo, useState } from "react";

export function useAppointmentFilters(appointments: Appointment[]) {
  const [filters, setFilters] = useState<AppointmentFilters>({
    searchTerm: "",
    status: "ALL",
    paymentStatus: "ALL",
    dateRange: {
      start: "",
      end: "",
    },
  });

  // Extract unique statuses from appointments
  const availableStatuses = useMemo(() => {
    return [...new Set(appointments.map(a => a.status))].sort();
  }, [appointments]);

  const availablePaymentStatuses = useMemo(() => {
    return [...new Set(appointments.map(a => a.paymentStatus))].sort();
  }, [appointments]);

  // Filter appointments based on current filters
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      // Search term filter
      if (
        filters.searchTerm &&
        !appointment.reservationNumber
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) &&
        !`${appointment.provider.firstName} ${appointment.provider.lastName}`
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) &&
        !`${appointment.requester.firstName} ${appointment.requester.lastName}`
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (filters.status !== "ALL" && appointment.status !== filters.status) {
        return false;
      }

      // Payment status filter
      if (
        filters.paymentStatus !== "ALL" &&
        appointment.paymentStatus !== filters.paymentStatus
      ) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const appointmentDate = new Date(appointment.date);
        const startDate = filters.dateRange.start
          ? new Date(filters.dateRange.start)
          : null;
        const endDate = filters.dateRange.end
          ? new Date(filters.dateRange.end)
          : null;

        if (startDate && appointmentDate < startDate) {
          return false;
        }
        if (endDate && appointmentDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, filters]);

  const updateFilter = useCallback(
    (
      key: keyof AppointmentFilters,
      value: string | { start: string; end: string }
    ) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    []
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
    filteredAppointments,
    availableStatuses,
    availablePaymentStatuses,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}

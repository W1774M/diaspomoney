"use client";

import { Booking, BookingStats } from "@/types/bookings";
import { useMemo } from "react";

export function useBookingStats(bookings: Booking[]): BookingStats {
  return useMemo(() => {
    // Sécurité : s'assurer que bookings est un tableau
    const safeBookings = bookings || [];
    const totalBookings = safeBookings.length;
    const confirmedBookings = safeBookings.filter(
      b => b.status === "confirmed",
    ).length;
    const pendingBookings = safeBookings.filter(b => b.status === "pending").length;
    const cancelledBookings = safeBookings.filter(
      b => b.status === "cancelled",
    ).length;
    const completedBookings = safeBookings.filter(
      b => b.status === "completed",
    ).length;

    const totalRevenue = safeBookings
      .filter(b => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const averageAmount =
      totalBookings > 0
        ? safeBookings.reduce((sum, b) => sum + b.totalAmount, 0) / totalBookings
        : 0;

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      completedBookings,
      totalRevenue,
      averageAmount,
    };
  }, [bookings]);
}

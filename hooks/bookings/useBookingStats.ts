"use client";

import { Booking, BookingStats } from "@/types/bookings";
import { useMemo } from "react";

export function useBookingStats(bookings: Booking[]): BookingStats {
  return useMemo(() => {
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(
      b => b.status === "confirmed"
    ).length;
    const pendingBookings = bookings.filter(b => b.status === "pending").length;
    const cancelledBookings = bookings.filter(
      b => b.status === "cancelled"
    ).length;
    const completedBookings = bookings.filter(
      b => b.status === "completed"
    ).length;

    const totalRevenue = bookings
      .filter(b => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const averageAmount =
      totalBookings > 0
        ? bookings.reduce((sum, b) => sum + b.totalAmount, 0) / totalBookings
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

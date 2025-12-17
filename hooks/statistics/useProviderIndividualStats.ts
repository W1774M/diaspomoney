'use client';

import { useMemo } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { BOOKING_STATUSES } from '@/lib/constants';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

export interface ProviderIndividualStats {
  activeMissions: number;
  completedThisMonth: number;
  revenueThisMonth: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  acceptanceRate: number;
}

interface UseProviderIndividualStatsParams {
  userId?: string;
  enabled: boolean;
  providerInfo?: {
    type?: string;
    rating?: number;
    reviewCount?: number;
  };
}

export function useProviderIndividualStats({
  userId,
  enabled,
  providerInfo,
}: UseProviderIndividualStatsParams) {
  const { bookings = [] } = useBookings({
    providerId: enabled ? userId : undefined,
    limit: 100,
  });

  const stats = useMemo<ProviderIndividualStats | null>(() => {
    if (!enabled || providerInfo?.type !== 'INDIVIDUAL' || !userId) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const activeMissions = bookings.filter(
      (b: BookingResponse) =>
        b.status === BOOKING_STATUSES.PENDING || b.status === BOOKING_STATUSES.CONFIRMED,
    );
    const completedThisMonth = bookings.filter((b: BookingResponse) => {
      if (b.status !== BOOKING_STATUSES.FINISHED) return false;
      const bookingDate = new Date(
        (b as any).date || b.appointmentDate || b.createdAt,
      );
      return (
        bookingDate.getMonth() === currentMonth &&
        bookingDate.getFullYear() === currentYear
      );
    });
    const revenueThisMonth = completedThisMonth.reduce(
      (sum: number, b: BookingResponse) => sum + ((b as any).price || (b as any).totalAmount || 0),
      0,
    );
    const totalRevenue = bookings
      .filter((b: BookingResponse) => b.status === BOOKING_STATUSES.FINISHED)
      .reduce(
        (sum: number, b: BookingResponse) =>
          sum + ((b as any).price || (b as any).totalAmount || 0),
        0,
      );

    // Note moyenne et avis
    const averageRating = providerInfo?.rating || 0;
    const reviewCount = providerInfo?.reviewCount || 0;

    // Taux d'acceptation
    const totalRequests = bookings.length;
    const acceptedRequests = bookings.filter(
      (b: BookingResponse) => b.status !== BOOKING_STATUSES.CANCELLED,
    ).length;
    const acceptanceRate =
      totalRequests > 0 ? (acceptedRequests / totalRequests) * 100 : 0;

    return {
      activeMissions: activeMissions.length,
      completedThisMonth: completedThisMonth.length,
      revenueThisMonth,
      totalRevenue,
      averageRating,
      reviewCount,
      acceptanceRate,
    };
  }, [bookings, userId, enabled, providerInfo]);

  return stats;
}


'use client';

import { useMemo } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { BOOKING_STATUSES } from '@/lib/constants';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

interface FavoriteProvider {
  id: string;
  name: string;
  rating: number;
  count: number;
}

export interface CustomerStats {
  activeOrders: number;
  completedOrders: number;
  totalSpent: number;
  favoriteProviders: FavoriteProvider[];
}

interface UseCustomerStatsParams {
  userId?: string;
  enabled: boolean;
}

export function useCustomerStats({ userId, enabled }: UseCustomerStatsParams) {
  const { bookings = [] } = useBookings({
    enabled,
    userId,
    limit: 100,
  });

  const stats = useMemo<CustomerStats | null>(() => {
    if (!enabled || !userId) return null;

    const activeBookings = bookings.filter(
      (b: BookingResponse) =>
        b.status === BOOKING_STATUSES.PENDING || b.status === BOOKING_STATUSES.CONFIRMED,
    );
    const completedBookings = bookings.filter(
      (b: BookingResponse) => b.status === BOOKING_STATUSES.FINISHED,
    );
    const totalSpent = completedBookings.reduce(
      (sum: number, b: BookingResponse) => sum + ((b as any).price || (b as any).totalAmount || 0),
      0,
    );

    // Prestataires favoris (par nombre de commandes)
    const providerCounts = new Map<string, { count: number; name: string; rating: number }>();
    bookings.forEach((b: BookingResponse) => {
      const provider = (b as any).provider;
      if (provider?.id) {
        const existing = providerCounts.get(provider.id) || {
          count: 0,
          name: `${provider.firstName || ''} ${provider.lastName || ''}`.trim(),
          rating: provider.rating || 0,
        };
        providerCounts.set(provider.id, {
          count: existing.count + 1,
          name: existing.name,
          rating: existing.rating,
        });
      }
    });
    const favoriteProviders: FavoriteProvider[] = Array.from(providerCounts.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      activeOrders: activeBookings.length,
      completedOrders: completedBookings.length,
      totalSpent,
      favoriteProviders,
    };
  }, [bookings, userId, enabled]);

  return stats;
}


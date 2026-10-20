'use client';

import { fetchJson } from '@/lib/api/fetchJson';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type Booking = BookingResponse;

export interface UseBookingsOptions {
  userId?: string | undefined;
  providerId?: string | undefined;
  status?: string | undefined;
  paymentStatus?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
  viewMode?: 'customer' | 'provider' | undefined;
}

export interface UseBookingsReturn {
  bookings: Booking[];
  isLoading: boolean;
  /** @deprecated alias isLoading */
  loading: boolean;
  error: string | null;
  total: number;
  refetch: () => Promise<void>;
}

export const useBookings = (
  options: UseBookingsOptions = {},
): UseBookingsReturn => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const optionsString = JSON.stringify(options);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedOptions = useMemo(() => options, [optionsString]);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();

      if (memoizedOptions.userId)
        searchParams.append('userId', memoizedOptions.userId);
      if (memoizedOptions.providerId)
        searchParams.append('providerId', memoizedOptions.providerId);
      if (memoizedOptions.status)
        searchParams.append('status', memoizedOptions.status);
      if (memoizedOptions.paymentStatus)
        searchParams.append('paymentStatus', memoizedOptions.paymentStatus);
      if (memoizedOptions.limit)
        searchParams.append('limit', memoizedOptions.limit.toString());
      if (memoizedOptions.offset)
        searchParams.append('offset', memoizedOptions.offset.toString());
      if (memoizedOptions.sortBy)
        searchParams.append('sortBy', memoizedOptions.sortBy);
      if (memoizedOptions.sortOrder)
        searchParams.append('sortOrder', memoizedOptions.sortOrder);
      if (memoizedOptions.viewMode)
        searchParams.append('viewMode', memoizedOptions.viewMode);

      const data = await fetchJson<{
        success?: boolean;
        data?: Booking[];
        error?: string;
        pagination?: { total?: number };
      }>(`/api/bookings?${searchParams.toString()}`);

      if (!data.success) {
        throw new Error(
          data.error || 'Erreur lors de la récupération des réservations',
        );
      }

      setBookings(Array.isArray(data.data) ? data.data : []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setBookings([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [memoizedOptions]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    isLoading,
    loading: isLoading,
    error,
    total,
    refetch: fetchBookings,
  };
};

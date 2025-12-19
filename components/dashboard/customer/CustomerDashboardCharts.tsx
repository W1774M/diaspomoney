'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks';
import { useBookings } from '@/hooks/useBookings';
import { BOOKING_STATUSES } from '@/lib/constants';
import BookingsByStatusChart from '@/components/dashboard/charts/BookingsByStatusChart';
import TransactionsChart from '@/components/dashboard/charts/TransactionsChart';
import TopServicesChart from '@/components/dashboard/charts/TopServicesChart';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import { DollarSign, CalendarClock, Percent, ShoppingCart } from 'lucide-react';

type MonthlyPoint = {
  month: string;
  revenue: number;
  transactions: number;
  bookings: number;
  newUsers: number;
};

function getBookingAmount(b: BookingResponse): number {
  const anyB = b as any;
  const candidates = [
    anyB?.totalAmount,
    anyB?.price,
    anyB?.amount,
    anyB?.metadata?.totalAmount,
    anyB?.metadata?.price,
    anyB?.metadata?.amount,
  ];
  const value = candidates.find((v) => typeof v === 'number' && Number.isFinite(v));
  return value ?? 0;
}

function getBookingDate(b: BookingResponse): Date | null {
  const base = b.appointmentDate || b.createdAt || b.updatedAt;
  const dt = base ? new Date(base) : null;
  if (!dt || Number.isNaN(dt.getTime())) return null;
  return dt;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

export default function CustomerDashboardCharts() {
  const { user } = useAuth();
  const userId = user?.id;

  const { bookings = [], loading, error } = useBookings({
    enabled: Boolean(userId),
    userId: userId || undefined,
    limit: 250,
    viewMode: 'customer',
  });

  const { statusData, monthlyData, topServices, kpis } = useMemo(() => {
    const completed = bookings.filter((b: BookingResponse) => b.status === BOOKING_STATUSES.FINISHED);
    const pending = bookings.filter(
      (b: BookingResponse) =>
        b.status === BOOKING_STATUSES.PENDING || b.status === BOOKING_STATUSES.CONFIRMED,
    );
    const cancelled = bookings.filter((b: BookingResponse) => b.status === BOOKING_STATUSES.CANCELLED);
    const others =
      bookings.length - completed.length - pending.length - cancelled.length;

    const totalSpent = completed.reduce((sum, b) => sum + getBookingAmount(b), 0);
    const avgOrderValue = completed.length > 0 ? totalSpent / completed.length : 0;
    const completionRate = bookings.length > 0 ? (completed.length / bookings.length) * 100 : 0;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const spentThisMonth = completed.reduce((sum, b) => {
      const dt = getBookingDate(b);
      if (!dt) return sum;
      return dt >= monthStart ? sum + getBookingAmount(b) : sum;
    }, 0);

    const nextBookingDate = pending
      .map((b) => getBookingDate(b))
      .filter((d): d is Date => Boolean(d))
      .filter((d) => d >= now)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    // 12 derniers mois (y compris mois courant)
    const first = addMonths(startOfMonth(now), -11);
    const months: Date[] = Array.from({ length: 12 }, (_, i) => addMonths(first, i));

    const series: MonthlyPoint[] = months.map((m) => {
      const y = m.getFullYear();
      const mo = m.getMonth();

      const inMonth = (b: BookingResponse) => {
        const dt = getBookingDate(b);
        if (!dt) return false;
        return dt.getFullYear() === y && dt.getMonth() === mo;
      };

      const monthBookings = bookings.filter(inMonth);
      const monthCompleted = completed.filter(inMonth);

      const revenue = monthCompleted.reduce((sum, b) => sum + getBookingAmount(b), 0);

      return {
        month: monthLabel(m),
        revenue,
        transactions: monthCompleted.length,
        bookings: monthBookings.length,
        newUsers: 0,
      };
    });

    // Top services (fallback: serviceType)
    const serviceCounts = new Map<string, number>();
    bookings.forEach((b: BookingResponse) => {
      const anyB = b as any;
      const name =
        anyB?.service?.name ||
        anyB?.serviceName ||
        b.serviceType ||
        'Autre';
      serviceCounts.set(name, (serviceCounts.get(name) || 0) + 1);
    });

    const top = Array.from(serviceCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      statusData: {
        completed: completed.length,
        pending: pending.length,
        cancelled: cancelled.length,
        others: Math.max(0, others),
      },
      monthlyData: series,
      topServices: top,
      kpis: {
        spentThisMonth,
        nextBookingDate,
        completionRate,
        avgOrderValue,
      },
    };
  }, [bookings]);

  if (!userId) return null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard
          title="Dépenses (mois)"
          value={`${kpis.spentThisMonth.toFixed(2)} €`}
          icon={DollarSign}
          color="orange"
        />
        <DashboardStatCard
          title="Prochain RDV"
          value={
            kpis.nextBookingDate
              ? kpis.nextBookingDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
              : '—'
          }
          icon={CalendarClock}
          color="blue"
          {...(kpis.nextBookingDate
            ? {
                description: kpis.nextBookingDate.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              }
            : {})}
        />
        <DashboardStatCard
          title="Taux de complétion"
          value={`${kpis.completionRate.toFixed(0)}%`}
          icon={Percent}
          color="green"
        />
        <DashboardStatCard
          title="Panier moyen"
          value={`${kpis.avgOrderValue.toFixed(2)} €`}
          icon={ShoppingCart}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BookingsByStatusChart data={statusData} />
        <TopServicesChart data={topServices} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <TransactionsChart data={monthlyData} />
      </div>

      {loading && (
        <p className="text-sm text-gray-500">Chargement des graphiques…</p>
      )}
    </div>
  );
}



'use client';

import { useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { useBookings } from '@/hooks/useBookings';
import { useStatistics } from '@/hooks/statistics/useStatistics';
import { BOOKING_STATUSES } from '@/lib/constants';
import BookingsByStatusChart from '@/components/dashboard/charts/BookingsByStatusChart';
import TransactionsChart from '@/components/dashboard/charts/TransactionsChart';
import TopServicesChart from '@/components/dashboard/charts/TopServicesChart';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import { DollarSign, CalendarClock, ShoppingCart } from 'lucide-react';

type MonthlyPoint = {
  month: string;
  revenue: number;
  transactions: number;
  bookings: number;
  newUsers: number;
};

function getBookingAmount(b: BookingResponse): number {
  const anyB = b as any;
  const metadata = anyB?.metadata || {};
  
  // Essayer d'abord les champs directs
  const candidates = [
    anyB?.totalAmount,
    anyB?.price,
    anyB?.amount,
    metadata?.totalAmount,
    metadata?.price,
    metadata?.amount,
  ];
  const directValue = candidates.find((v) => typeof v === 'number' && Number.isFinite(v) && v > 0);
  if (directValue) return directValue;
  
  // Si pas de valeur directe, calculer à partir de basePrice + optionsPrice - discountAmount
  const basePrice = 
    (typeof metadata?.basePrice === 'number' ? metadata.basePrice : 0) ||
    (typeof metadata?.servicePrice === 'number' ? metadata.servicePrice : 0);
  
  const optionsPrice = (() => {
    if (metadata?.additionalOptions) {
      try {
        const options = typeof metadata.additionalOptions === 'string' 
          ? JSON.parse(metadata.additionalOptions) 
          : metadata.additionalOptions;
        if (Array.isArray(options)) {
          return options.reduce((sum: number, opt: any) => {
            const optPrice = typeof opt.price === 'number' ? opt.price : parseFloat(opt.price) || 0;
            return sum + optPrice;
          }, 0);
        }
      } catch {
        // Ignorer les erreurs de parsing
      }
    }
    return typeof metadata?.optionsPrice === 'number' ? metadata.optionsPrice : 0;
  })();
  
  const discountAmount = typeof metadata?.discountAmount === 'number' ? metadata.discountAmount : 0;
  
  const calculatedAmount = basePrice + optionsPrice - discountAmount;
  return calculatedAmount > 0 ? calculatedAmount : 0;
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

  const { bookings = [], loading: bookingsLoading, error: bookingsError } = useBookings({
    enabled: Boolean(userId),
    userId: userId || undefined,
    limit: 250,
    viewMode: 'customer',
  });

  const { statistics, loading: statsLoading, error: statsError, fetchStatistics } = useStatistics();

  // Charger les statistiques au montage
  useEffect(() => {
    if (userId) {
      fetchStatistics();
    }
  }, [userId, fetchStatistics]);

  const { statusData, monthlyData, topServices, kpis } = useMemo(() => {
    const completed = bookings.filter((b: BookingResponse) => b.status === BOOKING_STATUSES.FINISHED);
    const pending = bookings.filter(
      (b: BookingResponse) =>
        b.status === BOOKING_STATUSES.PENDING || b.status === BOOKING_STATUSES.CONFIRMED,
    );
    const cancelled = bookings.filter((b: BookingResponse) => b.status === BOOKING_STATUSES.CANCELLED);
    const others =
      bookings.length - completed.length - pending.length - cancelled.length;

    // Utiliser les données de l'API pour les commandes terminées, le montant total et le panier moyen
    const completedFromAPI = statistics?.bookings?.completed ?? completed.length;
    const totalSpentFromAPI = statistics?.bookings?.totalSpent;
    const avgOrderValueFromAPI = statistics?.bookings?.averageBasketValue;
    
    // Fallback sur les bookings si l'API ne retourne pas de valeurs
    const totalSpent = totalSpentFromAPI !== undefined 
      ? totalSpentFromAPI 
      : completed.reduce((sum, b) => sum + getBookingAmount(b), 0);
    const avgOrderValue = avgOrderValueFromAPI !== undefined 
      ? avgOrderValueFromAPI 
      : (completedFromAPI > 0 ? totalSpent / completedFromAPI : 0);

    const now = new Date();
    const monthStart = startOfMonth(now);
    
    // Calculer les dépenses depuis les bookings terminés du mois en cours
    // Inclure aussi les bookings avec statut CONFIRMED qui ont un montant (car ils peuvent être payés)
    const bookingsThisMonth = bookings.filter((b: BookingResponse) => {
      const dt = getBookingDate(b);
      if (!dt) return false;
      const isInMonth = dt >= monthStart;
      const isCompletedOrConfirmed = 
        b.status === BOOKING_STATUSES.FINISHED || 
        b.status === BOOKING_STATUSES.CONFIRMED;
      const hasAmount = getBookingAmount(b) > 0;
      return isInMonth && isCompletedOrConfirmed && hasAmount;
    });
    
    const spentThisMonthFromBookings = bookingsThisMonth.reduce((sum, b) => {
      return sum + getBookingAmount(b);
    }, 0);
    
    // Utiliser les données de l'API si disponibles ET non nulles
    // Sinon utiliser le fallback sur les bookings (plus fiable car basé sur les données réelles)
    const spentThisMonthFromAPI = statistics?.budget?.monthly?.spent;
    
    // Si l'API retourne une valeur > 0, l'utiliser
    // Sinon, utiliser les bookings comme source de vérité (car les transactions peuvent ne pas être créées)
    const finalSpentThisMonth = 
      (spentThisMonthFromAPI !== undefined && spentThisMonthFromAPI > 0) 
        ? spentThisMonthFromAPI 
        : spentThisMonthFromBookings;

    const nextBookingDate = pending
      .map((b) => getBookingDate(b))
      .filter((d): d is Date => Boolean(d))
      .filter((d) => d >= now)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    // 12 derniers mois (y compris mois courant)
    const first = addMonths(startOfMonth(now), -11);
    const months: Date[] = Array.from({ length: 12 }, (_, i) => addMonths(first, i));

    // Créer un map des dépenses mensuelles depuis l'API (budget.trends)
    const trendsMap = new Map<string, number>();
    if (statistics?.budget?.trends) {
      statistics.budget.trends.forEach((trend: { period: string; budget: number; spent: number }) => {
        trendsMap.set(trend.period, trend.spent);
      });
    }

    const series: MonthlyPoint[] = months.map((m) => {
      const y = m.getFullYear();
      const mo = m.getMonth();
      const periodKey = `${y}-${String(mo + 1).padStart(2, '0')}`;

      const inMonth = (b: BookingResponse) => {
        const dt = getBookingDate(b);
        if (!dt) return false;
        return dt.getFullYear() === y && dt.getMonth() === mo;
      };

      const monthBookings = bookings.filter(inMonth);
      const monthCompleted = completed.filter(inMonth);

      const revenueFromAPI = trendsMap.get(periodKey);
      const revenueFromBookings = monthCompleted.reduce((sum, b) => sum + getBookingAmount(b), 0);
      const revenue = revenueFromAPI !== undefined ? revenueFromAPI : revenueFromBookings;

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
        spentThisMonth: finalSpentThisMonth,
        nextBookingDate,
        avgOrderValue,
        completedOrders: completedFromAPI,
      },
    };
  }, [bookings, statistics]);

  if (!userId) return null;

  const loading = bookingsLoading || statsLoading;
  const error = bookingsError || statsError;

  return (
    <div className="space-y-6">
      {(error || statsError) && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4 text-sm text-red-700">
          {error || statsError || 'Erreur lors du chargement des données'}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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



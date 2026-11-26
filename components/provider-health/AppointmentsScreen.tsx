'use client';

import { CalendarDays, CalendarX } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { BookingResponse } from '@/lib/mappers/booking.mapper';
import {
  appointmentTime,
  splitAppointments,
} from '@/lib/provider-health/appointments';
import { cn } from '@/lib/utils';

import {
  AppointmentRow,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  TruncationNotice,
  formatLongDate,
  useProviderBookings,
} from './shared';

type Tab = 'upcoming' | 'past';

/** Regroupe des rendez-vous déjà triés par jour (clé : date locale). */
function groupByDay(bookings: BookingResponse[]) {
  const groups: { key: string; label: string; items: BookingResponse[] }[] = [];
  for (const booking of bookings) {
    const t = appointmentTime(booking);
    const key = t === null ? 'undated' : new Date(t).toDateString();
    let group = groups.at(-1);
    if (!group || group.key !== key) {
      const label =
        t === null || !booking.appointmentDate
          ? 'Date à planifier'
          : formatLongDate(booking.appointmentDate);
      group = { key, label, items: [] };
      groups.push(group);
    }
    group.items.push(booking);
  }
  return groups;
}

export function AppointmentsScreen() {
  const { bookings, isLoading, error, total, refetch } = useProviderBookings();
  const [tab, setTab] = useState<Tab>('upcoming');

  const { upcoming, past } = useMemo(
    () => splitAppointments(bookings),
    [bookings],
  );
  const todayKey = new Date().toDateString();
  const todayCount = upcoming.filter((b) => {
    const t = appointmentTime(b);
    return t !== null && new Date(t).toDateString() === todayKey;
  }).length;

  const list = tab === 'upcoming' ? upcoming : past;
  const groups = useMemo(() => groupByDay(list), [list]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'upcoming', label: 'À venir', count: upcoming.length },
    { id: 'past', label: 'Passés et annulés', count: past.length },
  ];

  return (
    <>
      <PageHeader
        title='Mes rendez-vous'
        subtitle='Vos consultations à venir et l’historique de vos rendez-vous'
      />

      {isLoading && bookings.length === 0 ? (
        <LoadingState label='Chargement des rendez-vous…' />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <TruncationNotice loaded={bookings.length} total={total} />

          <dl className='mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3'>
            {[
              { label: 'Aujourd’hui', value: todayCount },
              { label: 'À venir', value: upcoming.length },
              { label: 'Historique', value: past.length },
            ].map((s) => (
              <div
                key={s.label}
                className='rounded-xl border border-gray-200 bg-white px-4 py-3'
              >
                <dt className='text-sm text-gray-600'>{s.label}</dt>
                <dd className='mt-1 text-2xl font-semibold tabular-nums text-gray-900'>
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <div
            role='tablist'
            aria-label='Période'
            className='mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-1'
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type='button'
                role='tab'
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  tab === t.id
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100',
                )}
              >
                {t.label}
                <span className='ms-1.5 tabular-nums opacity-80'>{t.count}</span>
              </button>
            ))}
          </div>

          {groups.length === 0 ? (
            tab === 'upcoming' ? (
              <EmptyState icon={CalendarDays} title='Aucun rendez-vous à venir'>
                Les réservations de vos patients apparaîtront ici dès qu’elles
                vous seront attribuées.
              </EmptyState>
            ) : (
              <EmptyState icon={CalendarX} title='Aucun rendez-vous passé' />
            )
          ) : (
            <div className='space-y-6' role='tabpanel'>
              {groups.map((g) => (
                <section key={g.key} aria-labelledby={`day-${g.key}`}>
                  <h2
                    id={`day-${g.key}`}
                    className='mb-2 text-sm font-semibold capitalize text-gray-700'
                  >
                    {g.key === todayKey ? `Aujourd’hui — ${g.label}` : g.label}
                  </h2>
                  <ul className='divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white'>
                    {g.items.map((b) => (
                      <AppointmentRow key={b.id || b._id} booking={b} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

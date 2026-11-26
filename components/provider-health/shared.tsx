'use client';

import Link from 'next/link';
import { Calendar, Clock, MapPin, Video } from 'lucide-react';

import { useBookings } from '@/hooks/bookings/useBookings';
import { getStatusColor, getStatusDisplay } from '@/lib/bookings/utils';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';
import {
  appointmentTime,
  consultationModeLabel,
  getPatient,
} from '@/lib/provider-health/appointments';
import { cn } from '@/lib/utils';

/** Plafond de chargement : au-delà, on affiche un avertissement. */
export const PROVIDER_BOOKINGS_LIMIT = 500;

/** Réservations attribuées au prestataire connecté (vue prestataire). */
export function useProviderBookings() {
  return useBookings({
    roleFilter: 'PROVIDER',
    limit: PROVIDER_BOOKINGS_LIMIT,
    sortBy: 'appointmentDate',
    sortOrder: 'desc',
  });
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className='mb-6'>
      <h1 className='text-2xl font-bold text-gray-900 sm:text-3xl'>{title}</h1>
      <p className='mt-2 text-gray-600'>{subtitle}</p>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className='py-12 text-center' role='status'>
      <div className='mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600' />
      <p className='mt-4 text-gray-600'>{label}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role='alert'
      className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
    >
      <span>{message}</span>
      <button
        type='button'
        onClick={onRetry}
        className='rounded-lg border border-red-300 bg-white px-3 py-1.5 font-medium hover:bg-red-100'
      >
        Réessayer
      </button>
    </div>
  );
}

export function TruncationNotice({
  loaded,
  total,
}: {
  loaded: number;
  total: number;
}) {
  if (total <= loaded) return null;
  return (
    <p className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900'>
      Affichage des {loaded} réservations les plus récentes sur {total}.
    </p>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Calendar;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className='rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center'>
      <Icon className='mx-auto mb-3 h-12 w-12 text-gray-400' aria-hidden />
      <h2 className='text-lg font-medium text-gray-900'>{title}</h2>
      {children && <div className='mt-2 text-sm text-gray-500'>{children}</div>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        getStatusColor(status),
      )}
    >
      {getStatusDisplay(status)}
    </span>
  );
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortDateFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const timeFmt = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatLongDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatShortDate(iso: string | undefined): string {
  return iso ? shortDateFmt.format(new Date(iso)) : '—';
}

/** Ligne d'un rendez-vous, cliquable vers la fiche de réservation. */
export function AppointmentRow({
  booking,
  showPatient = true,
  showDate = false,
}: {
  booking: BookingResponse;
  showPatient?: boolean;
  /** Affiche la date avec l'heure (listes non groupées par jour). */
  showDate?: boolean;
}) {
  const t = appointmentTime(booking);
  const patient = getPatient(booking);
  const mode = consultationModeLabel(booking.consultationMode);
  const ModeIcon = booking.consultationMode === 'video' ? Video : MapPin;
  const id = booking.id || booking._id;

  return (
    <li>
      <Link
        href={`/dashboard/bookings/${id}`}
        className='flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 sm:flex-row sm:items-center sm:gap-4'
      >
        <div
          className={cn(
            'flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gray-900',
            showDate ? 'w-44' : 'w-24',
          )}
        >
          <Clock className='h-4 w-4 text-gray-400' aria-hidden />
          {t === null
            ? 'À planifier'
            : showDate
              ? `${shortDateFmt.format(t)} · ${timeFmt.format(t)}`
              : timeFmt.format(t)}
        </div>
        <div className='min-w-0 flex-1'>
          {showPatient && (
            <p className='truncate font-medium text-gray-900'>
              {patient?.fullName ?? 'Patient non renseigné'}
            </p>
          )}
          <p className='truncate text-sm text-gray-600'>
            {booking.selectedService?.name ?? 'Consultation'}
            {booking.reservationNumber && (
              <span className='text-gray-400'> · {booking.reservationNumber}</span>
            )}
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {mode && (
            <span className='inline-flex items-center gap-1 text-xs text-gray-600'>
              <ModeIcon className='h-3.5 w-3.5' aria-hidden />
              {mode}
            </span>
          )}
          <StatusPill status={booking.status} />
        </div>
      </Link>
    </li>
  );
}

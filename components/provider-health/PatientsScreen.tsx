'use client';

import { ChevronDown, Mail, Phone, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  buildPatients,
  matchesPatientQuery,
  type PatientSummary,
} from '@/lib/provider-health/appointments';
import { cn } from '@/lib/utils';

import {
  AppointmentRow,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  TruncationNotice,
  formatShortDate,
  useProviderBookings,
} from './shared';

function initials(p: PatientSummary): string {
  const s = `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase();
  return s || '?';
}

function PatientCard({ patient }: { patient: PatientSummary }) {
  const [open, setOpen] = useState(false);
  const panelId = `patient-${patient.key.replace(/[^a-z0-9]/gi, '-')}`;

  return (
    <li className='overflow-hidden rounded-xl border border-gray-200 bg-white'>
      <div className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center'>
        <div className='flex min-w-0 flex-1 items-center gap-3'>
          <span
            aria-hidden
            className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700'
          >
            {initials(patient)}
          </span>
          <div className='min-w-0'>
            <p className='truncate font-semibold text-gray-900'>
              {patient.fullName}
            </p>
            <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600'>
              {patient.phone && (
                <a
                  href={`tel:${patient.phone.replace(/\s+/g, '')}`}
                  className='inline-flex items-center gap-1 hover:text-gray-900'
                >
                  <Phone className='h-3.5 w-3.5' aria-hidden />
                  {patient.phone}
                </a>
              )}
              {patient.email && (
                <a
                  href={`mailto:${patient.email}`}
                  className='inline-flex min-w-0 items-center gap-1 hover:text-gray-900'
                >
                  <Mail className='h-3.5 w-3.5 shrink-0' aria-hidden />
                  <span className='truncate'>{patient.email}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <dl className='grid grid-cols-3 gap-4 text-sm sm:w-[22rem]'>
          <div>
            <dt className='text-gray-500'>Rendez-vous</dt>
            <dd className='font-medium tabular-nums text-gray-900'>
              {patient.appointmentCount}
            </dd>
          </div>
          <div>
            <dt className='text-gray-500'>Dernière visite</dt>
            <dd className='font-medium text-gray-900'>
              {formatShortDate(patient.lastVisit)}
            </dd>
          </div>
          <div>
            <dt className='text-gray-500'>Prochain RDV</dt>
            <dd
              className={cn(
                'font-medium',
                patient.nextAppointment ? 'text-brand-700' : 'text-gray-900',
              )}
            >
              {formatShortDate(patient.nextAppointment)}
            </dd>
          </div>
        </dl>

        <button
          type='button'
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className='inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50'
        >
          Historique
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </button>
      </div>

      {open && (
        <ul
          id={panelId}
          className='divide-y divide-gray-100 border-t border-gray-100 bg-gray-50/50'
        >
          {patient.bookings.map((b) => (
            <AppointmentRow
              key={b.id || b._id}
              booking={b}
              showPatient={false}
              showDate
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function PatientsScreen() {
  const { bookings, isLoading, error, total, refetch } = useProviderBookings();
  const [query, setQuery] = useState('');

  const patients = useMemo(() => buildPatients(bookings), [bookings]);
  const filtered = useMemo(
    () => patients.filter((p) => matchesPatientQuery(p, query)),
    [patients, query],
  );
  const withUpcoming = patients.filter((p) => p.nextAppointment).length;

  return (
    <>
      <PageHeader
        title='Mes patients'
        subtitle='Les personnes que vous avez reçues ou qui ont rendez-vous avec vous'
      />

      {isLoading && bookings.length === 0 ? (
        <LoadingState label='Chargement des patients…' />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : patients.length === 0 ? (
        <EmptyState icon={Users} title='Aucun patient pour le moment'>
          Vos patients apparaîtront ici dès qu’une réservation vous sera
          attribuée.
        </EmptyState>
      ) : (
        <>
          <TruncationNotice loaded={bookings.length} total={total} />

          <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-sm text-gray-600'>
              <span className='font-semibold tabular-nums text-gray-900'>
                {patients.length}
              </span>{' '}
              patient{patients.length > 1 ? 's' : ''} ·{' '}
              <span className='font-semibold tabular-nums text-gray-900'>
                {withUpcoming}
              </span>{' '}
              avec un rendez-vous à venir
            </p>
            <label className='relative block sm:w-72'>
              <span className='sr-only'>Rechercher un patient</span>
              <Search
                className='pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400'
                aria-hidden
              />
              <input
                type='search'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Nom, téléphone ou e-mail'
                className='block w-full rounded-lg border border-gray-300 bg-white py-2 ps-9 pe-3 text-sm focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30'
              />
            </label>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Search} title='Aucun patient ne correspond'>
              Essayez un autre nom ou numéro.
            </EmptyState>
          ) : (
            <ul className='space-y-3'>
              {filtered.map((p) => (
                <PatientCard key={p.key} patient={p} />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}

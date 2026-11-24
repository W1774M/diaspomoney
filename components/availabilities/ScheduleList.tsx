'use client';

import { summarizeRules } from '@/components/availabilities/schedule-utils';
import { Button } from '@/components/ui/Button';
import type { ProviderSchedule } from '@/lib/types/schedule.types';
import { Calendar, Pencil, Plus, Star, Trash2 } from 'lucide-react';

interface ScheduleListProps {
  schedules: ProviderSchedule[];
  onCreate: () => void;
  onEdit: (schedule: ProviderSchedule) => void;
  onSetDefault: (schedule: ProviderSchedule) => void;
  onDelete: (schedule: ProviderSchedule) => void;
  creating?: boolean;
}

export function ScheduleList({
  schedules,
  onCreate,
  onEdit,
  onSetDefault,
  onDelete,
  creating,
}: ScheduleListProps) {
  if (schedules.length === 0) {
    return (
      <div className='rounded-xl border border-gray-200 bg-white px-6 py-16 text-center'>
        <Calendar className='mx-auto mb-4 h-12 w-12 text-gray-400' aria-hidden />
        <h2 className='text-lg font-semibold text-gray-900'>
          Aucun planning
        </h2>
        <p className='mx-auto mt-2 max-w-md text-sm text-gray-600'>
          Créez un planning d&apos;horaires (comme Working Hours sur Cal.com) pour
          indiquer quand vous êtes disponible.
        </p>
        <Button
          type='button'
          className='mt-6'
          onClick={onCreate}
          loading={Boolean(creating)}
          loadingText='Création…'
        >
          <Plus className='h-4 w-4' aria-hidden />
          Nouveau planning
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <p className='text-sm text-gray-600'>
          {schedules.length} planning{schedules.length > 1 ? 's' : ''}
        </p>
        <Button
          type='button'
          size='sm'
          onClick={onCreate}
          loading={Boolean(creating)}
          loadingText='Création…'
        >
          <Plus className='h-4 w-4' aria-hidden />
          Nouveau planning
        </Button>
      </div>

      <ul className='divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white'>
        {schedules.map(schedule => (
          <li
            key={schedule.id}
            className='flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5'
          >
            <div className='min-w-0 flex-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <h3 className='truncate text-base font-semibold text-gray-900'>
                  {schedule.name}
                </h3>
                {schedule.isDefault && (
                  <span className='inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800'>
                    <Star className='h-3 w-3' aria-hidden />
                    Par défaut
                  </span>
                )}
              </div>
              <p className='mt-1 text-sm text-gray-500'>{schedule.timeZone}</p>
              <p className='mt-1 line-clamp-2 text-sm text-gray-700'>
                {summarizeRules(schedule.rules)}
              </p>
            </div>
            <div className='flex shrink-0 flex-wrap items-center gap-2'>
              {!schedule.isDefault && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => onSetDefault(schedule)}
                >
                  Définir par défaut
                </Button>
              )}
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => onEdit(schedule)}
                aria-label={`Modifier ${schedule.name}`}
              >
                <Pencil className='h-4 w-4' aria-hidden />
                Modifier
              </Button>
              {!schedule.isDefault && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => onDelete(schedule)}
                  aria-label={`Supprimer ${schedule.name}`}
                  className='text-red-600 hover:bg-red-50 hover:text-red-700'
                >
                  <Trash2 className='h-4 w-4' aria-hidden />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

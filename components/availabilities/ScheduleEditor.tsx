'use client';

import {
  DAYS_OF_WEEK,
  DISPLAY_DAY_ORDER,
  daySlotsToRules,
  rulesToDaySlots,
  sortOverrides,
  type DaySlotsState,
} from '@/components/availabilities/schedule-utils';
import { Button } from '@/components/ui/Button';
import { TIMEZONES } from '@/lib/constants';
import type {
  ProviderSchedule,
  ScheduleOverride,
  ScheduleTimeRange,
  UpsertProviderScheduleInput,
} from '@/lib/types/schedule.types';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

const TIMEZONE_OPTIONS = Object.values(TIMEZONES);

interface ScheduleEditorProps {
  schedule: ProviderSchedule;
  onSave: (input: UpsertProviderScheduleInput) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function ScheduleEditor({
  schedule,
  onSave,
  onCancel,
  saving,
}: ScheduleEditorProps) {
  const [name, setName] = useState(schedule.name);
  const [timeZone, setTimeZone] = useState(schedule.timeZone);
  const [isDefault, setIsDefault] = useState(schedule.isDefault);
  const [daySlots, setDaySlots] = useState<DaySlotsState>(() =>
    rulesToDaySlots(schedule.rules),
  );
  const [overrides, setOverrides] = useState<ScheduleOverride[]>(() =>
    sortOverrides(schedule.overrides),
  );
  const [copyFromDay, setCopyFromDay] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const timezoneChoices = useMemo(() => {
    const set = new Set<string>(TIMEZONE_OPTIONS);
    if (timeZone) set.add(timeZone);
    return Array.from(set).sort();
  }, [timeZone]);

  const toggleDay = (day: number) => {
    setDaySlots(prev => {
      const current = prev[day] || [];
      if (current.length > 0) {
        return { ...prev, [day]: [] };
      }
      return { ...prev, [day]: [{ start: '09:00', end: '17:00' }] };
    });
  };

  const addSlot = (day: number) => {
    setDaySlots(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { start: '09:00', end: '17:00' }],
    }));
  };

  const updateSlot = (
    day: number,
    index: number,
    patch: Partial<ScheduleTimeRange>,
  ) => {
    setDaySlots(prev => {
      const slots = [...(prev[day] || [])];
      const current = slots[index];
      if (!current) return prev;
      slots[index] = { ...current, ...patch };
      return { ...prev, [day]: slots };
    });
  };

  const removeSlot = (day: number, index: number) => {
    setDaySlots(prev => ({
      ...prev,
      [day]: (prev[day] || []).filter((_, i) => i !== index),
    }));
  };

  const applyCopyToDays = (targetDays: number[]) => {
    if (copyFromDay === null) return;
    const source = daySlots[copyFromDay] || [];
    setDaySlots(prev => {
      const next = { ...prev };
      for (const day of targetDays) {
        if (day === copyFromDay) continue;
        next[day] = source.map(s => ({ ...s }));
      }
      return next;
    });
    setCopyFromDay(null);
  };

  const addOverride = () => {
    const today = new Date().toISOString().slice(0, 10);
    setOverrides(prev =>
      sortOverrides([
        ...prev,
        { date: today, ranges: [] },
      ]),
    );
  };

  const updateOverride = (
    index: number,
    patch: Partial<ScheduleOverride>,
  ) => {
    setOverrides(prev => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;
      next[index] = { ...current, ...patch };
      return sortOverrides(next);
    });
  };

  const removeOverride = (index: number) => {
    setOverrides(prev => prev.filter((_, i) => i !== index));
  };

  const addOverrideRange = (index: number) => {
    setOverrides(prev => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;
      next[index] = {
        ...current,
        ranges: [...current.ranges, { start: '09:00', end: '12:00' }],
      };
      return next;
    });
  };

  const updateOverrideRange = (
    overrideIndex: number,
    rangeIndex: number,
    patch: Partial<ScheduleTimeRange>,
  ) => {
    setOverrides(prev => {
      const next = [...prev];
      const current = next[overrideIndex];
      if (!current) return prev;
      const ranges = [...current.ranges];
      const range = ranges[rangeIndex];
      if (!range) return prev;
      ranges[rangeIndex] = { ...range, ...patch };
      next[overrideIndex] = { ...current, ranges };
      return next;
    });
  };

  const removeOverrideRange = (overrideIndex: number, rangeIndex: number) => {
    setOverrides(prev => {
      const next = [...prev];
      const current = next[overrideIndex];
      if (!current) return prev;
      next[overrideIndex] = {
        ...current,
        ranges: current.ranges.filter((_, i) => i !== rangeIndex),
      };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Le nom du planning est obligatoire.');
      return;
    }
    const rules = daySlotsToRules(daySlots);
    for (const rule of rules) {
      if (rule.start >= rule.end) {
        setFormError('Chaque créneau doit avoir une fin après le début.');
        return;
      }
    }
    for (const ov of overrides) {
      for (const range of ov.ranges) {
        if (range.start >= range.end) {
          setFormError(
            `Override ${ov.date} : plage invalide (${range.start}–${range.end}).`,
          );
          return;
        }
      }
    }
    await onSave({
      name: name.trim(),
      timeZone,
      isDefault,
      rules,
      overrides,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-8'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900'>
            Modifier le planning
          </h2>
          <p className='mt-1 text-sm text-gray-600'>
            Horaires hebdomadaires, fuseau et exceptions de dates.
          </p>
        </div>
        <Button type='button' variant='outline' onClick={onCancel}>
          Retour à la liste
        </Button>
      </div>

      {formError && (
        <div
          role='alert'
          className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
        >
          {formError}
        </div>
      )}

      <div className='grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 sm:p-6'>
        <div>
          <label
            htmlFor='schedule-name'
            className='mb-1.5 block text-sm font-medium text-gray-700'
          >
            Nom
          </label>
          <input
            id='schedule-name'
            type='text'
            value={name}
            onChange={e => setName(e.target.value)}
            className='w-full rounded-lg border border-gray-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600'
            required
          />
        </div>
        <div>
          <label
            htmlFor='schedule-tz'
            className='mb-1.5 block text-sm font-medium text-gray-700'
          >
            Fuseau horaire
          </label>
          <select
            id='schedule-tz'
            value={timeZone}
            onChange={e => setTimeZone(e.target.value)}
            className='w-full rounded-lg border border-gray-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600'
          >
            {timezoneChoices.map(tz => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        <div className='flex items-center gap-2 sm:col-span-2'>
          <input
            id='schedule-default'
            type='checkbox'
            checked={isDefault}
            onChange={e => setIsDefault(e.target.checked)}
            className='h-4 w-4 rounded border-gray-300 text-brand-700 focus-visible:ring-brand-600'
          />
          <label htmlFor='schedule-default' className='text-sm text-gray-700'>
            Planning par défaut
          </label>
        </div>
      </div>

      <section className='rounded-xl border border-gray-200 bg-white p-4 sm:p-6'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-base font-semibold text-gray-900'>
            Horaires de la semaine
          </h3>
          {copyFromDay !== null && (
            <div className='flex flex-wrap items-center gap-2 text-sm'>
              <span className='text-gray-600'>
                Copier{' '}
                {DAYS_OF_WEEK.find(d => d.index === copyFromDay)?.label} vers :
              </span>
              {DISPLAY_DAY_ORDER.filter(d => d !== copyFromDay).map(day => (
                <button
                  key={day}
                  type='button'
                  className='rounded-md border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50'
                  onClick={() => applyCopyToDays([day])}
                >
                  {DAYS_OF_WEEK.find(d => d.index === day)?.short}
                </button>
              ))}
              <button
                type='button'
                className='rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-800'
                onClick={() =>
                  applyCopyToDays(
                    DISPLAY_DAY_ORDER.filter(d => d !== copyFromDay) as number[],
                  )
                }
              >
                Tous
              </button>
              <button
                type='button'
                className='text-xs text-gray-500 underline'
                onClick={() => setCopyFromDay(null)}
              >
                Annuler
              </button>
            </div>
          )}
        </div>

        <div className='space-y-3'>
          {DISPLAY_DAY_ORDER.map(day => {
            const slots = daySlots[day] || [];
            const enabled = slots.length > 0;
            const meta = DAYS_OF_WEEK.find(d => d.index === day)!;
            return (
              <div
                key={day}
                className='flex flex-col gap-3 border-b border-gray-100 pb-3 last:border-0 sm:flex-row sm:items-start'
              >
                <div className='flex w-full items-center gap-3 sm:w-40 sm:shrink-0'>
                  <input
                    type='checkbox'
                    checked={enabled}
                    onChange={() => toggleDay(day)}
                    aria-label={`Disponible le ${meta.label}`}
                    className='h-4 w-4 rounded border-gray-300 text-brand-700 focus-visible:ring-brand-600'
                  />
                  <span className='text-sm font-medium text-gray-900'>
                    {meta.label}
                  </span>
                </div>
                <div className='flex-1 space-y-2'>
                  {!enabled ? (
                    <p className='text-sm italic text-gray-500'>Indisponible</p>
                  ) : (
                    slots.map((slot, index) => (
                      <div key={`${day}-${index}`} className='flex flex-wrap items-center gap-2'>
                        <input
                          type='time'
                          value={slot.start === '24:00' ? '23:59' : slot.start}
                          onChange={e =>
                            updateSlot(day, index, { start: e.target.value })
                          }
                          className='rounded-md border border-gray-300 px-2 py-1.5 text-sm'
                          aria-label={`${meta.label} début ${index + 1}`}
                        />
                        <span className='text-gray-400'>—</span>
                        <input
                          type='time'
                          value={slot.end === '24:00' ? '23:59' : slot.end}
                          onChange={e =>
                            updateSlot(day, index, { end: e.target.value })
                          }
                          className='rounded-md border border-gray-300 px-2 py-1.5 text-sm'
                          aria-label={`${meta.label} fin ${index + 1}`}
                        />
                        <button
                          type='button'
                          onClick={() => removeSlot(day, index)}
                          className='rounded p-1.5 text-red-600 hover:bg-red-50'
                          aria-label='Supprimer ce créneau'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>
                    ))
                  )}
                  {enabled && (
                    <div className='flex flex-wrap gap-2'>
                      <button
                        type='button'
                        onClick={() => addSlot(day)}
                        className='inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800'
                      >
                        <Plus className='h-3.5 w-3.5' />
                        Ajouter
                      </button>
                      <button
                        type='button'
                        onClick={() => setCopyFromDay(day)}
                        className='inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900'
                      >
                        <Copy className='h-3.5 w-3.5' />
                        Copier
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className='rounded-xl border border-gray-200 bg-white p-4 sm:p-6'>
        <div className='mb-4 flex items-center justify-between gap-2'>
          <div>
            <h3 className='text-base font-semibold text-gray-900'>
              Exceptions de dates
            </h3>
            <p className='mt-1 text-sm text-gray-600'>
              Remplacent les horaires hebdomadaires pour une date donnée. Plages
              vides = indisponible.
            </p>
          </div>
          <Button type='button' variant='outline' size='sm' onClick={addOverride}>
            <Plus className='h-4 w-4' />
            Ajouter
          </Button>
        </div>

        {overrides.length === 0 ? (
          <p className='text-sm italic text-gray-500'>Aucune exception</p>
        ) : (
          <ul className='space-y-4'>
            {overrides.map((override, index) => (
              <li
                key={`${override.date}-${index}`}
                className='rounded-lg border border-gray-100 bg-gray-50 p-3'
              >
                <div className='mb-2 flex flex-wrap items-center gap-2'>
                  <input
                    type='date'
                    value={override.date}
                    onChange={e =>
                      updateOverride(index, { date: e.target.value })
                    }
                    className='rounded-md border border-gray-300 px-2 py-1.5 text-sm'
                    aria-label='Date d’exception'
                  />
                  <button
                    type='button'
                    onClick={() =>
                      updateOverride(index, { ranges: [] })
                    }
                    className='text-xs font-medium text-gray-600 underline'
                  >
                    Marquer indisponible
                  </button>
                  <button
                    type='button'
                    onClick={() => removeOverride(index)}
                    className='ml-auto rounded p-1.5 text-red-600 hover:bg-red-50'
                    aria-label='Supprimer l’exception'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
                {override.ranges.length === 0 ? (
                  <p className='text-sm text-gray-500'>Indisponible toute la journée</p>
                ) : (
                  <div className='space-y-2'>
                    {override.ranges.map((range, rangeIndex) => (
                      <div
                        key={rangeIndex}
                        className='flex flex-wrap items-center gap-2'
                      >
                        <input
                          type='time'
                          value={range.start}
                          onChange={e =>
                            updateOverrideRange(index, rangeIndex, {
                              start: e.target.value,
                            })
                          }
                          className='rounded-md border border-gray-300 px-2 py-1.5 text-sm'
                        />
                        <span className='text-gray-400'>—</span>
                        <input
                          type='time'
                          value={range.end}
                          onChange={e =>
                            updateOverrideRange(index, rangeIndex, {
                              end: e.target.value,
                            })
                          }
                          className='rounded-md border border-gray-300 px-2 py-1.5 text-sm'
                        />
                        <button
                          type='button'
                          onClick={() => removeOverrideRange(index, rangeIndex)}
                          className='rounded p-1.5 text-red-600 hover:bg-red-50'
                          aria-label='Supprimer la plage'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type='button'
                  onClick={() => addOverrideRange(index)}
                  className='mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-700'
                >
                  <Plus className='h-3.5 w-3.5' />
                  Ajouter une plage
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className='flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4'>
        <Button type='button' variant='outline' onClick={onCancel}>
          Annuler
        </Button>
        <Button type='submit' loading={Boolean(saving)} loadingText='Enregistrement…'>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

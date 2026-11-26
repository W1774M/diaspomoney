'use client';

import { ScheduleEditor } from '@/components/availabilities/ScheduleEditor';
import { ScheduleList } from '@/components/availabilities/ScheduleList';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { useNotificationManager } from '@/components/ui/Notification';
import { useSchedules } from '@/hooks/availabilities';
import type {
  ProviderSchedule,
  UpsertProviderScheduleInput,
} from '@/lib/types/schedule.types';
import { useCallback, useState } from 'react';

/**
 * Disponibilités prestataire — UX type Cal.com, backend coss schedules.
 */
export default function AvailabilitiesPageContent() {
  const confirmer = useConfirm();
  const { addSuccess, addError } = useNotificationManager();
  const {
    schedules,
    loading,
    error,
    errorCode,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    setAsDefault,
  } = useSchedules();

  const [editing, setEditing] = useState<ProviderSchedule | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const created = await createSchedule({ name: 'Horaires de travail' });
      if (created) {
        addSuccess('Planning créé', 5000);
        setEditing(created);
      } else {
        addError('Impossible de créer le planning', 8000);
      }
    } finally {
      setCreating(false);
    }
  }, [createSchedule, addSuccess, addError]);

  const handleSave = useCallback(
    async (input: UpsertProviderScheduleInput) => {
      if (!editing) return;
      setSaving(true);
      try {
        const updated = await updateSchedule(editing.id, input);
        if (updated) {
          addSuccess('Planning enregistré', 5000);
          setEditing(null);
        } else {
          addError('Impossible d’enregistrer le planning', 8000);
        }
      } finally {
        setSaving(false);
      }
    },
    [editing, updateSchedule, addSuccess, addError],
  );

  const handleDelete = useCallback(
    async (schedule: ProviderSchedule) => {
      const ok = await confirmer({
        message: `Supprimer le planning « ${schedule.name} » ?`,
        variant: 'danger',
      });
      if (!ok) return;
      const deleted = await deleteSchedule(schedule.id);
      if (deleted) {
        addSuccess('Planning supprimé', 5000);
        if (editing?.id === schedule.id) setEditing(null);
      } else {
        addError(
          'Suppression impossible (le planning par défaut ne peut pas être supprimé)',
          8000,
        );
      }
    },
    [confirmer, deleteSchedule, addSuccess, addError, editing],
  );

  const handleSetDefault = useCallback(
    async (schedule: ProviderSchedule) => {
      const updated = await setAsDefault(schedule.id);
      if (updated) {
        addSuccess(`« ${schedule.name} » est maintenant le planning par défaut`, 5000);
      } else {
        addError('Impossible de définir le planning par défaut', 8000);
      }
    },
    [setAsDefault, addSuccess, addError],
  );

  if (loading && schedules.length === 0 && !errorCode) {
    return (
      <div className='py-12 text-center'>
        <div className='mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600' />
        <p className='mt-4 text-gray-600'>Chargement des plannings…</p>
      </div>
    );
  }

  return (
    <>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900 sm:text-3xl'>
          Mes disponibilités
        </h1>
        <p className='mt-2 text-gray-600'>
          Gérez vos plannings d&apos;horaires pour les rendez-vous
        </p>
      </div>

      {errorCode === 'COSS_NOT_CONFIGURED' && (
        <div
          role='alert'
          className='mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900'
        >
          <p className='font-semibold'>Scheduling indisponible</p>
          <p className='mt-1'>
            La clé API coss n&apos;est pas configurée sur cet environnement
            (`COSS_API_KEY`). Les plannings ne peuvent pas être chargés ni
            modifiés pour le moment.
          </p>
        </div>
      )}

      {errorCode === 'GENERIC' && error && (
        <div
          role='alert'
          className='mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
        >
          {error}
        </div>
      )}

      {errorCode !== 'COSS_NOT_CONFIGURED' &&
        (editing ? (
          <ScheduleEditor
            key={editing.id}
            schedule={editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        ) : (
          <ScheduleList
            schedules={schedules}
            onCreate={handleCreate}
            onEdit={setEditing}
            onSetDefault={handleSetDefault}
            onDelete={handleDelete}
            creating={creating}
          />
        ))}
    </>
  );
}

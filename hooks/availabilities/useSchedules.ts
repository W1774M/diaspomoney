'use client';

/**
 * Hook CRUD des plannings coss (schedules) pour le dashboard prestataire.
 */

import type {
  ProviderSchedule,
  UpsertProviderScheduleInput,
} from '@/lib/types/schedule.types';
import { useCallback, useEffect, useState } from 'react';

export type SchedulesErrorCode = 'COSS_NOT_CONFIGURED' | 'GENERIC' | null;

interface UseSchedulesReturn {
  schedules: ProviderSchedule[];
  loading: boolean;
  error: string | null;
  errorCode: SchedulesErrorCode;
  refresh: () => Promise<void>;
  createSchedule: (
    input?: Partial<UpsertProviderScheduleInput> & { name?: string },
  ) => Promise<ProviderSchedule | null>;
  updateSchedule: (
    id: string,
    input: UpsertProviderScheduleInput,
  ) => Promise<ProviderSchedule | null>;
  deleteSchedule: (id: string) => Promise<boolean>;
  setAsDefault: (id: string) => Promise<ProviderSchedule | null>;
}

export function useSchedules(): UseSchedulesReturn {
  const [schedules, setSchedules] = useState<ProviderSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<SchedulesErrorCode>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorCode(null);
      const res = await fetch('/api/scheduling/schedules', { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (res.status === 503) {
        setErrorCode('COSS_NOT_CONFIGURED');
        setError(body.error || 'Scheduling coss non configuré');
        setSchedules([]);
        return;
      }
      if (!res.ok || !body.success) {
        setErrorCode('GENERIC');
        setError(body.error || 'Impossible de charger les plannings');
        setSchedules([]);
        return;
      }
      setSchedules(body.data || []);
    } catch {
      setErrorCode('GENERIC');
      setError('Impossible de charger les plannings');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createSchedule = useCallback(
    async (input?: Partial<UpsertProviderScheduleInput> & { name?: string }) => {
      const res = await fetch('/api/scheduling/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input || {}),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        setError(body.error || 'Création impossible');
        return null;
      }
      await refresh();
      return body.data as ProviderSchedule;
    },
    [refresh],
  );

  const updateSchedule = useCallback(
    async (id: string, input: UpsertProviderScheduleInput) => {
      const res = await fetch(`/api/scheduling/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        setError(body.error || 'Mise à jour impossible');
        return null;
      }
      await refresh();
      return body.data as ProviderSchedule;
    },
    [refresh],
  );

  const deleteSchedule = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/scheduling/schedules/${id}`, {
        method: 'DELETE',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        setError(body.error || 'Suppression impossible');
        return false;
      }
      await refresh();
      return true;
    },
    [refresh],
  );

  const setAsDefault = useCallback(
    async (id: string) => {
      const current = schedules.find(s => s.id === id);
      if (!current) return null;
      return updateSchedule(id, {
        name: current.name,
        timeZone: current.timeZone,
        isDefault: true,
        rules: current.rules,
        overrides: current.overrides,
      });
    },
    [schedules, updateSchedule],
  );

  return {
    schedules,
    loading,
    error,
    errorCode,
    refresh,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    setAsDefault,
  };
}

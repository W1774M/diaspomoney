/**
 * GET/POST /api/scheduling/schedules — plannings coss du prestataire connecté
 */
import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import {
  createProviderSchedule,
  defaultWeeklyRules,
  listProviderSchedules,
} from '@/lib/coss/provider-schedules';
import { requireProviderForSchedules } from '@/lib/coss/require-provider-for-schedules';
import { UpsertProviderScheduleSchema } from '@/lib/validations/schedule.schema';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return handleApiRoute(
    request,
    async () => {
      const provider = await requireProviderForSchedules();
      const schedules = await listProviderSchedules(provider);
      return { success: true, data: schedules };
    },
    'api/scheduling/schedules',
  );
}

export async function POST(request: NextRequest) {
  return handleApiRoute(
    request,
    async () => {
      const provider = await requireProviderForSchedules();
      const body = await request.json().catch(() => ({}));
      const data = validateBody(
        {
          ...body,
          rules:
            Array.isArray(body?.rules) && body.rules.length > 0
              ? body.rules
              : defaultWeeklyRules(),
        },
        UpsertProviderScheduleSchema,
      );

      const schedule = await createProviderSchedule(provider, {
        name: data.name || 'Horaires de travail',
        rules: data.rules,
        ...(data.timeZone !== undefined ? { timeZone: data.timeZone } : {}),
        ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        ...(data.overrides !== undefined ? { overrides: data.overrides } : {}),
      });

      return {
        success: true,
        data: schedule,
        message: 'Planning créé avec succès',
      };
    },
    'api/scheduling/schedules',
  );
}

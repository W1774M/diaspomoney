/**
 * GET/PUT/DELETE /api/scheduling/schedules/[id]
 */
import { ApiError, ApiErrors, handleApiRoute, validateBody } from '@/lib/api/error-handler';
import {
  deleteProviderSchedule,
  getProviderSchedule,
  updateProviderSchedule,
} from '@/lib/coss/provider-schedules';
import { requireProviderForSchedules } from '@/lib/coss/require-provider-for-schedules';
import { UpsertProviderScheduleSchema } from '@/lib/validations/schedule.schema';
import { NextRequest } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return handleApiRoute(
    request,
    async () => {
      const provider = await requireProviderForSchedules();
      const { id } = await context.params;
      if (!id) throw ApiErrors.VALIDATION_ERROR({ id: 'id requis' });

      try {
        const schedule = await getProviderSchedule(provider, id);
        return { success: true, data: schedule };
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (/introuvable|not found/i.test(message)) {
          throw ApiErrors.NOT_FOUND;
        }
        throw error;
      }
    },
    'api/scheduling/schedules/[id]',
  );
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleApiRoute(
    request,
    async () => {
      const provider = await requireProviderForSchedules();
      const { id } = await context.params;
      if (!id) throw ApiErrors.VALIDATION_ERROR({ id: 'id requis' });

      const body = await request.json();
      const data = validateBody(body, UpsertProviderScheduleSchema);

      try {
        const schedule = await updateProviderSchedule(provider, id, {
          rules: data.rules,
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.timeZone !== undefined ? { timeZone: data.timeZone } : {}),
          ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
          ...(data.overrides !== undefined ? { overrides: data.overrides } : {}),
        });
        return {
          success: true,
          data: schedule,
          message: 'Planning mis à jour',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (/introuvable|not found/i.test(message)) {
          throw ApiErrors.NOT_FOUND;
        }
        throw error;
      }
    },
    'api/scheduling/schedules/[id]',
  );
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleApiRoute(
    request,
    async () => {
      const provider = await requireProviderForSchedules();
      const { id } = await context.params;
      if (!id) throw ApiErrors.VALIDATION_ERROR({ id: 'id requis' });

      try {
        const result = await deleteProviderSchedule(provider, id);
        return {
          success: true,
          data: result,
          message: 'Planning supprimé',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (/default|par défaut/i.test(message)) {
          throw new ApiError(
            422,
            'Le planning par défaut ne peut pas être supprimé',
            'DEFAULT_SCHEDULE',
          );
        }
        if (/introuvable|not found/i.test(message)) {
          throw ApiErrors.NOT_FOUND;
        }
        throw error;
      }
    },
    'api/scheduling/schedules/[id]',
  );
}

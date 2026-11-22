'use client';

import { scheduleState, type ScheduleState } from '@/lib/home-content';

export const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[hsl(25,100%,53%)]';
export const labelClass = 'block text-sm font-medium text-gray-700';
export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[hsl(25,100%,53%)] px-4 py-2 text-sm font-semibold text-white hover:bg-[hsl(25,90%,48%)] disabled:opacity-50';
export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50';
export const iconButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30';

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  // FormData : le navigateur pose lui-même le Content-Type (avec la boundary).
  const res = await fetch(
    url,
    isForm
      ? init
      : { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Erreurs Zod renvoyées par validateBody.
    const issues = data?.details?.issues ?? data?.details?.errors;
    const details = Array.isArray(issues)
      ? ` : ${issues.map((e: { message?: string }) => e.message).join(', ')}`
      : '';
    throw new Error(`${data?.error || data?.message || 'Erreur inattendue'}${details}`);
  }
  return data as T;
}

/** ISO → valeur d'un <input type="datetime-local"> (heure locale). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** Valeur d'un <input type="datetime-local"> → ISO (ou null si vide). */
export function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

const STATE_STYLES: Record<ScheduleState, { label: string; className: string }> = {
  live: { label: 'En ligne', className: 'bg-green-100 text-green-800' },
  scheduled: { label: 'Programmé', className: 'bg-blue-100 text-blue-800' },
  expired: { label: 'Terminé', className: 'bg-gray-200 text-gray-700' },
  inactive: { label: 'Désactivé', className: 'bg-gray-100 text-gray-500' },
};

export function ScheduleBadge({
  item,
}: {
  item: { isActive: boolean; startsAt: string | null; endsAt: string | null };
}) {
  const { label, className } = STATE_STYLES[scheduleState(item)];
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{label}</span>
  );
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

export function ScheduleSummary({
  startsAt,
  endsAt,
}: {
  startsAt: string | null;
  endsAt: string | null;
}) {
  if (!startsAt && !endsAt) return null;
  return (
    <p className="text-xs text-gray-500">
      {startsAt ? `Du ${dateFormatter.format(new Date(startsAt))}` : 'Dès maintenant'}
      {endsAt ? ` au ${dateFormatter.format(new Date(endsAt))}` : ', sans fin'}
    </p>
  );
}

/** Champs « période de diffusion » communs aux deux formulaires. */
export function ScheduleFields({
  startsAt,
  endsAt,
  onChange,
}: {
  startsAt: string;
  endsAt: string;
  onChange: (values: { startsAt?: string; endsAt?: string }) => void;
}) {
  return (
    <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <legend className="mb-2 text-sm font-semibold text-gray-900">
        Période de diffusion <span className="font-normal text-gray-500">(facultative)</span>
      </legend>
      <label className={labelClass}>
        Début
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(e) => onChange({ startsAt: e.target.value })}
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className={labelClass}>
        Fin
        <input
          type="datetime-local"
          value={endsAt}
          min={startsAt || undefined}
          onChange={(e) => onChange({ endsAt: e.target.value })}
          className={`${inputClass} mt-1`}
        />
      </label>
    </fieldset>
  );
}

'use client';

import { AuthorizedRoute } from '@/components/auth';
import { useNotificationManager } from '@/components/ui/Notification';
import { ROLES } from '@/lib/constants';
import {
  PROVIDER_APPLICATION_STATUSES,
  PROVIDER_APPLICATION_STATUS_LABELS,
  type ProviderApplication,
  type ProviderApplicationStatus,
} from '@/lib/provider-applications';
import { Download, Mail, Phone, RefreshCcw, Search, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus-visible:ring-2 focus-visible:ring-brand-600';

const STATUS_BADGE: Record<ProviderApplicationStatus, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-gray-100 text-gray-600 border-gray-200',
};

type StatusFilter = ProviderApplicationStatus | 'all';

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.error || data?.message || 'Erreur inattendue');
  }
  return data as T;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function exportCsv(applications: ProviderApplication[]) {
  const header = ['Nom', 'Email', 'Téléphone', 'Statut', 'Note', 'Reçue le', 'Origine'];
  const rows = applications.map((a) =>
    [
      a.name,
      a.email,
      a.phone,
      PROVIDER_APPLICATION_STATUS_LABELS[a.status],
      a.note,
      a.submittedAt ?? '',
      a.source === 'csm' ? `CSM${a.proposedBy ? ` (${a.proposedBy})` : ''}` : 'Formulaire',
    ]
      .map(csvCell)
      .join(';'),
  );
  // BOM pour qu'Excel lise correctement les accents.
  const bom = String.fromCharCode(0xfeff);
  const blob = new Blob([`${bom}${[header.join(';'), ...rows].join('\n')}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `candidatures-prestataires-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function NoteEditor({
  application,
  onSave,
}: {
  application: ProviderApplication;
  onSave: (note: string) => Promise<void>;
}) {
  const [value, setValue] = useState(application.note);
  const [saving, setSaving] = useState(false);
  useEffect(() => setValue(application.note), [application.note]);
  const dirty = value.trim() !== application.note;

  return (
    <div className="flex items-start gap-2">
      <textarea
        aria-label={`Note sur la candidature de ${application.name}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={1}
        placeholder="Ajouter une note…"
        className={`${inputClass} min-w-[12rem] resize-y`}
      />
      {dirty && (
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave(value.trim());
            } finally {
              setSaving(false);
            }
          }}
          className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Enregistrer
        </button>
      )}
    </div>
  );
}

function CandidaturesContent() {
  const notify = useNotificationManager();
  const [applications, setApplications] = useState<ProviderApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ applications: ProviderApplication[] }>(
        '/api/admin/provider-applications',
        { cache: 'no-store' },
      );
      setApplications(data.applications);
    } catch (error) {
      notify.addError(`Chargement impossible : ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (
    application: ProviderApplication,
    patch: { status?: ProviderApplicationStatus; note?: string },
  ) => {
    try {
      const data = await apiRequest<{ application: ProviderApplication }>(
        `/api/admin/provider-applications/${application.id}`,
        { method: 'PATCH', body: JSON.stringify(patch) },
      );
      setApplications((list) => list.map((a) => (a.id === application.id ? data.application : a)));
      notify.addSuccess(
        patch.status
          ? `${application.name} : ${PROVIDER_APPLICATION_STATUS_LABELS[patch.status].toLowerCase()}`
          : 'Note enregistrée',
      );
    } catch (error) {
      notify.addError((error as Error).message);
    }
  };

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: applications.length,
      new: 0,
      contacted: 0,
      accepted: 0,
      rejected: 0,
    };
    for (const a of applications) result[a.status] += 1;
    return result;
  }, [applications]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter(
      (a) =>
        (statusFilter === 'all' || a.status === statusFilter) &&
        (!q || [a.name, a.email, a.phone, a.note].some((v) => v.toLowerCase().includes(q))),
    );
  }, [applications, query, statusFilter]);

  const filters: StatusFilter[] = ['all', ...PROVIDER_APPLICATION_STATUSES];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            <UserPlus className="h-7 w-7 text-brand-700" aria-hidden />
            Candidatures prestataires
          </h1>
          <p className="mt-2 text-gray-600">
            Demandes envoyées depuis le formulaire « Devenir prestataire » de la page d’accueil.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportCsv(filtered)}
            disabled={!filtered.length}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </button>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden />
            Rafraîchir
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="search"
            aria-label="Rechercher une candidature"
            placeholder="Nom, e-mail, téléphone, note…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={statusFilter === f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                statusFilter === f
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Toutes' : PROVIDER_APPLICATION_STATUS_LABELS[f]} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading && !applications.length ? (
          <p className="p-6 text-sm text-gray-600">Chargement…</p>
        ) : !filtered.length ? (
          <p className="p-6 text-sm text-gray-600">
            {applications.length ? 'Aucune candidature ne correspond aux filtres.' : 'Aucune candidature pour le moment.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Candidat</th>
                  <th scope="col" className="px-4 py-3">Contact</th>
                  <th scope="col" className="px-4 py-3">Reçue le</th>
                  <th scope="col" className="px-4 py-3">Statut</th>
                  <th scope="col" className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((a) => (
                  <tr key={a.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{a.name || '—'}</div>
                      {a.source === 'csm' && (
                        <div className="mt-1 flex flex-col gap-1 text-xs">
                          <span className="inline-flex w-fit rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-purple-800">
                            Proposée par {a.proposedBy || 'un CSM'}
                          </span>
                          {a.providerUserId && (
                            <Link
                              href={`/dashboard/users/${a.providerUserId}`}
                              className="text-brand-700 hover:underline"
                            >
                              Fiche du compte en attente
                            </Link>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {a.email ? (
                          <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                            <Mail className="h-3.5 w-3.5" aria-hidden />
                            {a.email}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500">E-mail à obtenir</span>
                        )}
                        {a.phone && (
                          <a href={`tel:${a.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-1 text-gray-700 hover:underline">
                            <Phone className="h-3.5 w-3.5" aria-hidden />
                            {a.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDate(a.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`mb-2 inline-flex rounded-full border px-2.5 py-0.5 text-xs ${STATUS_BADGE[a.status]}`}>
                        {PROVIDER_APPLICATION_STATUS_LABELS[a.status]}
                      </span>
                      <select
                        aria-label={`Statut de la candidature de ${a.name}`}
                        value={a.status}
                        onChange={(e) => update(a, { status: e.target.value as ProviderApplicationStatus })}
                        className={`${inputClass} block min-w-[9rem]`}
                      >
                        {PROVIDER_APPLICATION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {PROVIDER_APPLICATION_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <NoteEditor application={a} onSave={(note) => update(a, { note })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CandidaturesPage() {
  return (
    <AuthorizedRoute roles={[ROLES.ADMIN, ROLES.SUPERADMIN]} redirectTo="/dashboard">
      <CandidaturesContent />
    </AuthorizedRoute>
  );
}

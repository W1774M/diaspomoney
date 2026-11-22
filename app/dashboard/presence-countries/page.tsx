'use client';

import { AuthorizedRoute } from '@/components/auth';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useNotificationManager } from '@/components/ui/Notification';
import { ROLES } from '@/lib/constants';
import {
  COUNTRY_PREPOSITIONS,
  flagUrl,
  presenceBadgeLabel,
  type CountryPreposition,
  type PresenceCountry,
  type PresenceStatus,
} from '@/lib/presence-countries';
import { countries as FLAG_COUNTRY_CODES } from 'country-flag-icons';
import { ArrowDown, ArrowUp, Check, Globe2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const STATUS_LABELS: Record<PresenceStatus, string> = {
  present: 'Présent',
  coming_soon: 'Bientôt disponible',
};

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[hsl(25,100%,53%)]';
const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[hsl(25,100%,53%)] px-4 py-2 text-sm font-semibold text-white hover:bg-[hsl(25,90%,48%)] disabled:opacity-50';
const iconButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30';

/** Proposition de préposition (modifiable) : « en » si le nom finit par « e », « aux » par « s ». */
function guessPreposition(name: string): CountryPreposition {
  const lower = name.toLowerCase();
  if (lower.endsWith('s')) return 'aux';
  if (lower.endsWith('e') && !['mexique', 'cambodge', 'mozambique', 'zimbabwe'].includes(lower)) {
    return 'en';
  }
  return 'au';
}

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

interface CountryFormValues {
  iso: string;
  name: string;
  preposition: CountryPreposition;
  status: PresenceStatus;
}

function PresenceCountriesContent() {
  const notify = useNotificationManager();
  const [countries, setCountries] = useState<PresenceCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Pick<CountryFormValues, 'name' | 'preposition'>>({
    name: '',
    preposition: 'au',
  });
  const [toDelete, setToDelete] = useState<PresenceCountry | null>(null);
  const [form, setForm] = useState<CountryFormValues>({
    iso: '',
    name: '',
    preposition: 'au',
    status: 'coming_soon',
  });

  const regionNames = useMemo(() => new Intl.DisplayNames(['fr'], { type: 'region' }), []);
  const availableCountries = useMemo(() => {
    const used = new Set(countries.map((c) => c.iso));
    return FLAG_COUNTRY_CODES.filter((iso) => /^[A-Z]{2}$/.test(iso) && !used.has(iso))
      .map((iso) => ({ iso, name: regionNames.of(iso) ?? iso }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [countries, regionNames]);

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<{ countries: PresenceCountry[] }>('/api/presence-countries');
      setCountries(data.countries);
    } catch (error) {
      notify.addError(`Chargement impossible : ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      notify.addSuccess(success);
      await load();
    } catch (error) {
      notify.addError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const patch = (id: string, body: Partial<PresenceCountry>) =>
    apiRequest(`/api/presence-countries/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

  const handleSelectIso = (iso: string) => {
    const name = iso ? regionNames.of(iso) ?? '' : '';
    setForm((f) => ({ ...f, iso, name, preposition: guessPreposition(name) }));
  };

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.iso || !form.name.trim()) return;
    void run(
      () => apiRequest('/api/presence-countries', { method: 'POST', body: JSON.stringify(form) }),
      `${form.name} ajouté`,
    ).then(() => setForm({ iso: '', name: '', preposition: 'au', status: 'coming_soon' }));
  };

  const handleToggleStatus = (country: PresenceCountry) => {
    const status: PresenceStatus = country.status === 'present' ? 'coming_soon' : 'present';
    void run(
      () => patch(country.id, { status }),
      `${country.name} : ${STATUS_LABELS[status].toLowerCase()}`,
    );
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const current = countries[index];
    const other = countries[index + direction];
    if (!current || !other) return;
    // Renumérote toute la liste pour éviter les ex æquo.
    const reordered = [...countries];
    reordered[index] = other;
    reordered[index + direction] = current;
    void run(
      () =>
        Promise.all(
          reordered
            .map((country, i) => ({ country, order: i + 1 }))
            .filter(({ country, order }) => country.order !== order)
            .map(({ country, order }) => patch(country.id, { order })),
        ),
      'Ordre mis à jour',
    );
  };

  const startEdit = (country: PresenceCountry) => {
    setEditingId(country.id);
    setEditValues({ name: country.name, preposition: country.preposition });
  };

  const saveEdit = (country: PresenceCountry) => {
    if (!editValues.name.trim()) return;
    void run(() => patch(country.id, editValues), 'Pays modifié').then(() => setEditingId(null));
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const country = toDelete;
    await run(
      () =>
        apiRequest(`/api/presence-countries/${encodeURIComponent(country.id)}`, {
          method: 'DELETE',
        }),
      `${country.name} retiré`,
    );
    setToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          <Globe2 className="h-7 w-7 text-[hsl(25,100%,53%)]" aria-hidden />
          Pays de présence
        </h1>
        <p className="mt-2 text-gray-600">
          Badges affichés sur la page d’accueil. Les pays « Présent » sont cliquables et filtrent
          le carrousel des cliniques.
        </p>
      </div>

      {/* Ajout */}
      <form
        onSubmit={handleAdd}
        className="rounded-lg border border-gray-200 bg-white p-4 shadow sm:p-6"
        aria-labelledby="add-country-title"
      >
        <h2 id="add-country-title" className="mb-4 text-lg font-semibold text-gray-900">
          Ajouter un pays
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <label className="text-sm font-medium text-gray-700 md:col-span-2">
            Pays
            <select
              required
              value={form.iso}
              onChange={(e) => handleSelectIso(e.target.value)}
              className={`${inputClass} mt-1`}
            >
              <option value="">Choisir un pays…</option>
              {availableCountries.map(({ iso, name }) => (
                <option key={iso} value={iso}>
                  {name} ({iso})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Nom affiché
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Préposition
            <select
              value={form.preposition}
              onChange={(e) =>
                setForm((f) => ({ ...f, preposition: e.target.value as CountryPreposition }))
              }
              className={`${inputClass} mt-1`}
            >
              {COUNTRY_PREPOSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Statut
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PresenceStatus }))}
              className={`${inputClass} mt-1`}
            >
              <option value="coming_soon">{STATUS_LABELS.coming_soon}</option>
              <option value="present">{STATUS_LABELS.present}</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Aperçu :{' '}
            <span className="font-medium text-gray-800">
              {form.iso && form.name
                ? presenceBadgeLabel({ ...form, id: '', order: 0 })
                : '—'}
            </span>
          </p>
          <button type="submit" disabled={busy || !form.iso} className={primaryButtonClass}>
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter
          </button>
        </div>
      </form>

      {/* Liste */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        {loading ? (
          <p className="p-6 text-center text-gray-600">Chargement des pays…</p>
        ) : countries.length === 0 ? (
          <p className="p-6 text-center text-gray-600">
            Aucun pays : les badges n’apparaissent plus sur la page d’accueil.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {countries.map((country, index) => {
              const editing = editingId === country.id;
              return (
                <li key={country.id} className="flex flex-wrap items-center gap-3 p-4">
                  <img
                    src={flagUrl(country.iso)}
                    alt=""
                    width={30}
                    height={20}
                    className="h-5 w-[30px] rounded-[2px] object-cover ring-1 ring-black/10"
                  />

                  {editing ? (
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <select
                        aria-label={`Préposition pour ${country.name}`}
                        value={editValues.preposition}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            preposition: e.target.value as CountryPreposition,
                          }))
                        }
                        className={`${inputClass} w-20`}
                      >
                        {COUNTRY_PREPOSITIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <input
                        aria-label={`Nom affiché pour ${country.name}`}
                        value={editValues.name}
                        onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                        className={`${inputClass} max-w-xs`}
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(country)}
                        disabled={busy}
                        className={iconButtonClass}
                        aria-label="Enregistrer"
                      >
                        <Check className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className={iconButtonClass}
                        aria-label="Annuler la modification"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{presenceBadgeLabel(country)}</p>
                      <p className="text-xs text-gray-500">{country.iso}</p>
                    </div>
                  )}

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      country.status === 'present'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {STATUS_LABELS[country.status]}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(country)}
                    disabled={busy}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {country.status === 'present' ? 'Repasser en bientôt' : 'Passer en présent'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(index, -1)}
                      disabled={busy || index === 0}
                      className={iconButtonClass}
                      aria-label={`Monter ${country.name}`}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 1)}
                      disabled={busy || index === countries.length - 1}
                      className={iconButtonClass}
                      aria-label={`Descendre ${country.name}`}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                    {!editing ? (
                      <button
                        type="button"
                        onClick={() => startEdit(country)}
                        className={iconButtonClass}
                        aria-label={`Modifier ${country.name}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setToDelete(country)}
                      disabled={busy}
                      className={`${iconButtonClass} hover:bg-red-50 hover:text-red-600`}
                      aria-label={`Retirer ${country.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Retirer ce pays ?"
        message={
          toDelete
            ? `« ${presenceBadgeLabel(toDelete)} » ne sera plus affiché sur la page d’accueil.`
            : ''
        }
        confirmText="Retirer"
        variant="danger"
        isLoading={busy}
      />
    </div>
  );
}

export default function PresenceCountriesPage() {
  return (
    <AuthorizedRoute roles={[ROLES.ADMIN, ROLES.SUPERADMIN]} redirectTo="/dashboard">
      <PresenceCountriesContent />
    </AuthorizedRoute>
  );
}

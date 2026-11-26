'use client';

import { AnnouncementContent } from '@/components/features/home/HomeAnnouncementDialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { NativeModal } from '@/components/ui/NativeModal';
import { useNotificationManager } from '@/components/ui/Notification';
import {
  ANNOUNCEMENT_IMAGE_MAX_BYTES,
  ANNOUNCEMENT_IMAGE_TYPES,
  pickCurrentAnnouncement,
  type HomeAnnouncement,
} from '@/lib/home-content';
import { Eye, EyeOff, ImageUp, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  apiRequest,
  fromLocalInput,
  iconButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  ScheduleBadge,
  ScheduleFields,
  ScheduleSummary,
  secondaryButtonClass,
  toLocalInput,
} from './shared';

type AdminAnnouncement = HomeAnnouncement & { createdAt: string | null };

interface FormValues {
  title: string;
  message: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
  ctaLabel: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  frequencyHours: number;
}

const EMPTY_FORM: FormValues = {
  title: '',
  message: '',
  imageUrl: '',
  imageAlt: '',
  href: '',
  ctaLabel: '',
  isActive: false,
  startsAt: '',
  endsAt: '',
  frequencyHours: 24,
};

const FREQUENCIES = [
  { value: 0, label: 'À chaque visite' },
  { value: 1, label: 'Toutes les heures' },
  { value: 24, label: 'Une fois par jour' },
  { value: 168, label: 'Une fois par semaine' },
  { value: 720, label: 'Une fois par mois' },
];

function frequencyLabel(hours: number): string {
  return FREQUENCIES.find((f) => f.value === hours)?.label ?? `Toutes les ${hours} h`;
}

function toForm(a: HomeAnnouncement): FormValues {
  return {
    title: a.title,
    message: a.message,
    imageUrl: a.imageUrl,
    imageAlt: a.imageAlt,
    href: a.href,
    ctaLabel: a.ctaLabel,
    isActive: a.isActive,
    startsAt: toLocalInput(a.startsAt),
    endsAt: toLocalInput(a.endsAt),
    frequencyHours: a.frequencyHours,
  };
}

function toPayload(form: FormValues) {
  return {
    ...form,
    ctaLabel: form.href ? form.ctaLabel : '',
    startsAt: fromLocalInput(form.startsAt),
    endsAt: fromLocalInput(form.endsAt),
  };
}

export function AnnouncementsPanel() {
  const notify = useNotificationManager();
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [toDelete, setToDelete] = useState<AdminAnnouncement | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<{ announcements: AdminAnnouncement[] }>(
        '/api/home-announcements',
      );
      setAnnouncements(data.announcements);
    } catch (error) {
      notify.addError(`Chargement impossible : ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<unknown>, success: string): Promise<boolean> => {
    setBusy(true);
    try {
      await action();
      notify.addSuccess(success);
      await load();
      return true;
    } catch (error) {
      notify.addError((error as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const patch = (id: string, body: object) =>
    apiRequest(`/api/home-announcements/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!ANNOUNCEMENT_IMAGE_TYPES.includes(file.type)) {
      notify.addError('Format non pris en charge (JPEG, PNG, WebP ou GIF)');
      return;
    }
    if (file.size > ANNOUNCEMENT_IMAGE_MAX_BYTES) {
      notify.addError('Image trop lourde (2 Mo maximum)');
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('image', file);
      const { url } = await apiRequest<{ url: string }>('/api/home-announcements/images', {
        method: 'POST',
        body,
      });
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (error) {
      notify.addError((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.imageUrl) {
      notify.addError('Ajoutez une image');
      return;
    }
    const payload = toPayload(form);
    const ok =
      editing === 'new'
        ? await run(
            () =>
              apiRequest('/api/home-announcements', {
                method: 'POST',
                body: JSON.stringify(payload),
              }),
            'Annonce créée',
          )
        : await run(() => patch(editing as string, payload), 'Annonce modifiée');
    if (ok) setEditing(null);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { id } = toDelete;
    await run(
      () => apiRequest(`/api/home-announcements/${encodeURIComponent(id)}`, { method: 'DELETE' }),
      'Annonce supprimée',
    );
    setToDelete(null);
  };

  const current = pickCurrentAnnouncement(announcements);

  return (
    <section aria-labelledby="announcement-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="announcement-title" className="text-lg font-semibold text-gray-900">
            Annonce d’accueil
          </h2>
          <p className="text-sm text-gray-600">
            Fenêtre affichée à l’arrivée sur la page d’accueil. Si plusieurs annonces sont en ligne,
            la plus récemment démarrée est affichée (marquée d’une étoile).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY_FORM);
            setEditing('new');
          }}
          className={primaryButtonClass}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nouvelle annonce
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        {loading ? (
          <p className="p-6 text-center text-gray-600">Chargement…</p>
        ) : announcements.length === 0 ? (
          <p className="p-6 text-center text-gray-600">Aucune annonce.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {announcements.map((announcement) => {
              const isCurrent = current?.id === announcement.id;
              return (
                <li key={announcement.id} className="flex flex-wrap items-center gap-4 p-4">
                  <img
                    src={announcement.imageUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg border border-gray-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-medium text-gray-900">
                      {isCurrent ? (
                        <Star
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                          aria-label="Affichée actuellement"
                        />
                      ) : null}
                      {announcement.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {frequencyLabel(announcement.frequencyHours)}
                      {announcement.href ? ` · Lien : ${announcement.href}` : ''}
                    </p>
                    <ScheduleSummary startsAt={announcement.startsAt} endsAt={announcement.endsAt} />
                  </div>
                  <ScheduleBadge item={announcement} />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        void run(
                          () => patch(announcement.id, { isActive: !announcement.isActive }),
                          announcement.isActive ? 'Annonce désactivée' : 'Annonce activée',
                        )
                      }
                      disabled={busy}
                      className={iconButtonClass}
                      aria-label={announcement.isActive ? 'Désactiver' : 'Activer'}
                      title={announcement.isActive ? 'Désactiver' : 'Activer'}
                    >
                      {announcement.isActive ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(toForm(announcement));
                        setEditing(announcement.id);
                      }}
                      className={iconButtonClass}
                      aria-label="Modifier"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(announcement)}
                      disabled={busy}
                      className={`${iconButtonClass} hover:bg-red-50 hover:text-red-600`}
                      aria-label="Supprimer"
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

      <NativeModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        labelledBy="announcement-form-title"
        className="w-full max-w-5xl rounded-2xl shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h3 id="announcement-form-title" className="text-lg font-semibold text-gray-900">
              {editing === 'new' ? 'Nouvelle annonce' : 'Modifier l’annonce'}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className={iconButtonClass}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,24rem)]">
            <div className="space-y-5">
              <label className={labelClass}>
                Titre
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={`${inputClass} mt-1`}
                />
              </label>

              <div>
                <span className={labelClass}>Image</span>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <label className={`${secondaryButtonClass} cursor-pointer`}>
                    <ImageUp className="h-4 w-4" aria-hidden />
                    {uploading ? 'Envoi…' : form.imageUrl ? 'Remplacer l’image' : 'Choisir une image'}
                    <input
                      type="file"
                      accept={ANNOUNCEMENT_IMAGE_TYPES.join(',')}
                      className="sr-only"
                      disabled={uploading}
                      onChange={(e) => {
                        void handleUpload(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <span className="text-xs text-gray-500">JPEG, PNG, WebP ou GIF · 2 Mo max · carré conseillé</span>
                </div>
              </div>

              <label className={labelClass}>
                Description de l’image <span className="font-normal text-gray-500">(lue par les lecteurs d’écran)</span>
                <input
                  required
                  minLength={2}
                  maxLength={200}
                  value={form.imageAlt}
                  onChange={(e) => setForm((f) => ({ ...f, imageAlt: e.target.value }))}
                  placeholder="Offre DiaspoMoney à 2 euros"
                  className={`${inputClass} mt-1`}
                />
              </label>

              <label className={labelClass}>
                Texte <span className="font-normal text-gray-500">(facultatif)</span>
                <textarea
                  rows={3}
                  maxLength={600}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className={`${inputClass} mt-1`}
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Lien <span className="font-normal text-gray-500">(facultatif)</span>
                  <input
                    value={form.href}
                    onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
                    placeholder="/services/health ou https://…"
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className={labelClass}>
                  Bouton <span className="font-normal text-gray-500">(facultatif)</span>
                  <input
                    value={form.ctaLabel}
                    maxLength={60}
                    disabled={!form.href}
                    onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                    placeholder="J’en profite"
                    className={`${inputClass} mt-1 disabled:bg-gray-50`}
                  />
                </label>
              </div>

              <label className={labelClass}>
                Réafficher à un visiteur qui l’a fermée
                <select
                  value={form.frequencyHours}
                  onChange={(e) => setForm((f) => ({ ...f, frequencyHours: Number(e.target.value) }))}
                  className={`${inputClass} mt-1`}
                >
                  {FREQUENCIES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs font-normal text-gray-500">
                  Une annonce modifiée est réaffichée à tous immédiatement.
                </span>
              </label>

              <ScheduleFields
                startsAt={form.startsAt}
                endsAt={form.endsAt}
                onChange={(values) => setForm((f) => ({ ...f, ...values }))}
              />

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-brand-700"
                />
                Active
              </label>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Aperçu</p>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                {form.imageUrl || form.title ? (
                  <AnnouncementContent
                    announcement={{
                      ...form,
                      title: form.title || 'Titre de l’annonce',
                      ctaLabel: form.href ? form.ctaLabel : '',
                    }}
                    titleId="announcement-preview-title"
                  />
                ) : (
                  <p className="p-8 text-center text-sm text-gray-500">
                    Ajoutez un titre et une image pour voir l’aperçu.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={() => setEditing(null)} className={secondaryButtonClass}>
              Annuler
            </button>
            <button type="submit" disabled={busy || uploading} className={primaryButtonClass}>
              Enregistrer
            </button>
          </div>
        </form>
      </NativeModal>

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer cette annonce ?"
        message="L’annonce et son image seront supprimées définitivement. Pour la retirer temporairement, désactivez-la plutôt."
        confirmText="Supprimer"
        variant="danger"
        isLoading={busy}
      />
    </section>
  );
}

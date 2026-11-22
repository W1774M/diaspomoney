'use client';

import { BannerMessageContent } from '@/components/features/home/HomeBanner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { NativeModal } from '@/components/ui/NativeModal';
import { useNotificationManager } from '@/components/ui/Notification';
import {
  isScheduledNow,
  type BannerLinkType,
  type HomeBannerMessage,
} from '@/lib/home-content';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react';
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

interface FormValues {
  icon: string;
  textBefore: string;
  linkType: BannerLinkType;
  linkLabel: string;
  linkHref: string;
  textAfter: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
}

const EMPTY_FORM: FormValues = {
  icon: '',
  textBefore: '',
  linkType: 'none',
  linkLabel: '',
  linkHref: '',
  textAfter: '',
  isActive: true,
  startsAt: '',
  endsAt: '',
};

const ICON_SUGGESTIONS = ['🎉', '🎁', '🔥', '⭐', '🩺', '🎒', '🏠', '💳', '📢', '✅'];

function toForm(message: HomeBannerMessage): FormValues {
  return {
    icon: message.icon,
    textBefore: message.textBefore,
    linkType: message.linkType,
    linkLabel: message.linkLabel,
    linkHref: message.linkHref,
    textAfter: message.textAfter,
    isActive: message.isActive,
    startsAt: toLocalInput(message.startsAt),
    endsAt: toLocalInput(message.endsAt),
  };
}

function toPayload(form: FormValues) {
  return {
    ...form,
    linkLabel: form.linkType === 'none' ? '' : form.linkLabel,
    linkHref: form.linkType === 'url' ? form.linkHref : '',
    startsAt: fromLocalInput(form.startsAt),
    endsAt: fromLocalInput(form.endsAt),
  };
}

/** Bande orange identique à la home, sans défilement. */
function BannerStrip({ messages }: { messages: HomeBannerMessage[] }) {
  if (messages.length === 0) {
    return (
      <p className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">
        Aucun message en ligne : le bandeau est masqué sur la page d’accueil.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg bg-[hsl(25,100%,53%)] py-3 text-sm font-medium text-white">
      <div className="flex w-max whitespace-nowrap">
        {messages.map((message) => (
          <span key={message.id} className="mx-6 inline-flex items-center gap-1">
            <BannerMessageContent message={message} preview />
            <span className="mx-2 text-white/70" aria-hidden>
              •
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function BannerMessagesPanel() {
  const notify = useNotificationManager();
  const [messages, setMessages] = useState<HomeBannerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  /** `null` = fermé, `'new'` = création, sinon id du message édité. */
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [toDelete, setToDelete] = useState<HomeBannerMessage | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<{ messages: HomeBannerMessage[] }>('/api/home-banner-messages');
      setMessages(data.messages);
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
    apiRequest(`/api/home-banner-messages/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing('new');
  };

  const openEdit = (message: HomeBannerMessage) => {
    setForm(toForm(message));
    setEditing(message.id);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = toPayload(form);
    const ok =
      editing === 'new'
        ? await run(
            () =>
              apiRequest('/api/home-banner-messages', {
                method: 'POST',
                body: JSON.stringify(payload),
              }),
            'Message ajouté',
          )
        : await run(() => patch(editing as string, payload), 'Message modifié');
    if (ok) setEditing(null);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const current = messages[index];
    const other = messages[index + direction];
    if (!current || !other) return;
    const reordered = [...messages];
    reordered[index] = other;
    reordered[index + direction] = current;
    void run(
      () =>
        Promise.all(
          reordered
            .map((message, i) => ({ message, order: i + 1 }))
            .filter(({ message, order }) => message.order !== order)
            .map(({ message, order }) => patch(message.id, { order })),
        ),
      'Ordre mis à jour',
    );
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { id } = toDelete;
    await run(
      () => apiRequest(`/api/home-banner-messages/${encodeURIComponent(id)}`, { method: 'DELETE' }),
      'Message supprimé',
    );
    setToDelete(null);
  };

  const preview: HomeBannerMessage = {
    ...toPayload(form),
    id: 'preview',
    order: 0,
  };
  const liveMessages = messages.filter((message) => isScheduledNow(message));

  return (
    <section aria-labelledby="banner-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="banner-title" className="text-lg font-semibold text-gray-900">
            Bandeau défilant
          </h2>
          <p className="text-sm text-gray-600">
            Messages qui défilent en haut de la page d’accueil, dans l’ordre ci-dessous.
          </p>
        </div>
        <button type="button" onClick={openCreate} className={primaryButtonClass}>
          <Plus className="h-4 w-4" aria-hidden />
          Nouveau message
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Aperçu actuel
        </p>
        <BannerStrip messages={liveMessages} />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        {loading ? (
          <p className="p-6 text-center text-gray-600">Chargement…</p>
        ) : messages.length === 0 ? (
          <p className="p-6 text-center text-gray-600">Aucun message.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {messages.map((message, index) => (
              <li key={message.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">
                    <BannerMessageContent message={message} preview />
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {message.linkType === 'announcement'
                      ? 'Lien : ouvre l’annonce d’accueil'
                      : message.linkType === 'url'
                        ? `Lien : ${message.linkHref}`
                        : 'Sans lien'}
                  </p>
                  <ScheduleSummary startsAt={message.startsAt} endsAt={message.endsAt} />
                </div>
                <ScheduleBadge item={message} />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      void run(
                        () => patch(message.id, { isActive: !message.isActive }),
                        message.isActive ? 'Message désactivé' : 'Message activé',
                      )
                    }
                    disabled={busy}
                    className={iconButtonClass}
                    aria-label={message.isActive ? 'Désactiver' : 'Activer'}
                    title={message.isActive ? 'Désactiver' : 'Activer'}
                  >
                    {message.isActive ? (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={busy || index === 0}
                    className={iconButtonClass}
                    aria-label="Monter"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={busy || index === messages.length - 1}
                    className={iconButtonClass}
                    aria-label="Descendre"
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(message)}
                    className={iconButtonClass}
                    aria-label="Modifier"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(message)}
                    disabled={busy}
                    className={`${iconButtonClass} hover:bg-red-50 hover:text-red-600`}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <NativeModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        labelledBy="banner-form-title"
        className="w-full max-w-2xl rounded-2xl shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <h3 id="banner-form-title" className="text-lg font-semibold text-gray-900">
              {editing === 'new' ? 'Nouveau message' : 'Modifier le message'}
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

          <div>
            <span className={labelClass}>Emoji</span>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <input
                aria-label="Emoji"
                value={form.icon}
                maxLength={8}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className={`${inputClass} w-16 text-center`}
              />
              {ICON_SUGGESTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={`h-9 w-9 rounded-lg text-lg hover:bg-orange-50 ${
                    form.icon === icon ? 'bg-orange-100 ring-1 ring-orange-300' : ''
                  }`}
                  aria-label={`Choisir ${icon}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <label className={labelClass}>
            Texte avant le lien
            <input
              value={form.textBefore}
              maxLength={200}
              onChange={(e) => setForm((f) => ({ ...f, textBefore: e.target.value }))}
              placeholder="Nouvelle offre santé :"
              className={`${inputClass} mt-1`}
            />
          </label>

          <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              Lien
              <select
                value={form.linkType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, linkType: e.target.value as BannerLinkType }))
                }
                className={`${inputClass} mt-1`}
              >
                <option value="none">Aucun</option>
                <option value="url">Vers une page</option>
                <option value="announcement">Ouvre l’annonce d’accueil</option>
              </select>
            </label>
            {form.linkType !== 'none' ? (
              <label className={labelClass}>
                Texte du lien
                <input
                  required
                  value={form.linkLabel}
                  maxLength={80}
                  onChange={(e) => setForm((f) => ({ ...f, linkLabel: e.target.value }))}
                  placeholder="voir l’offre"
                  className={`${inputClass} mt-1`}
                />
              </label>
            ) : null}
            {form.linkType === 'url' ? (
              <label className={labelClass}>
                Adresse
                <input
                  required
                  value={form.linkHref}
                  onChange={(e) => setForm((f) => ({ ...f, linkHref: e.target.value }))}
                  placeholder="/services/health ou https://…"
                  className={`${inputClass} mt-1`}
                />
              </label>
            ) : null}
          </fieldset>

          <label className={labelClass}>
            Texte après le lien
            <input
              value={form.textAfter}
              maxLength={200}
              onChange={(e) => setForm((f) => ({ ...f, textAfter: e.target.value }))}
              placeholder="à partir de 10€."
              className={`${inputClass} mt-1`}
            />
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
              className="h-4 w-4 rounded border-gray-300 text-[hsl(25,100%,53%)]"
            />
            Actif
          </label>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Aperçu</p>
            <BannerStrip messages={[preview]} />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={() => setEditing(null)} className={secondaryButtonClass}>
              Annuler
            </button>
            <button type="submit" disabled={busy} className={primaryButtonClass}>
              Enregistrer
            </button>
          </div>
        </form>
      </NativeModal>

      <ConfirmDialog
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer ce message ?"
        message="Il disparaîtra du bandeau de la page d’accueil. Pour le retirer temporairement, désactivez-le plutôt."
        confirmText="Supprimer"
        variant="danger"
        isLoading={busy}
      />
    </section>
  );
}

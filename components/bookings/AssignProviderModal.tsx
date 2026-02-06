'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { ProviderInfo } from '@/lib/types';
import { useNotificationManager } from '@/components/ui/Notification';
import { logger } from '@/lib/logger';

type AssignMode = 'registered' | 'external';

interface AssignProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  currentProviderId?: string;
  currentAssignedProviderEmail?: string;
  onAssigned?: () => Promise<void> | void;
}

export default function AssignProviderModal({
  isOpen,
  onClose,
  bookingId,
  currentProviderId,
  currentAssignedProviderEmail,
  onAssigned,
}: AssignProviderModalProps) {
  const notificationManager = useNotificationManager();

  const [mode, setMode] = useState<AssignMode>('registered');
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [selectedProviderId, setSelectedProviderId] = useState<string>(currentProviderId || '');

  const [externalEmail, setExternalEmail] = useState<string>(currentAssignedProviderEmail || '');
  const [externalName, setExternalName] = useState<string>('');
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  
  // Éléments à transmettre au prestataire
  const [sharedElements, setSharedElements] = useState<{
    clientInfo: boolean;
    beneficiaryInfo: boolean;
    serviceDetails: boolean;
    paymentInfo: boolean;
    appointmentInfo: boolean;
    additionalOptions: boolean;
  }>({
    clientInfo: true,
    beneficiaryInfo: true,
    serviceDetails: true,
    paymentInfo: false,
    appointmentInfo: true,
    additionalOptions: true,
  });

  const [submitting, setSubmitting] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (!isOpen) return;
    setMode(currentAssignedProviderEmail ? 'external' : 'registered');
    setSelectedProviderId(currentProviderId || '');
    setExternalEmail(currentAssignedProviderEmail || '');
    setExternalName('');
    setSendEmail(true);
    setSearch('');
    setSharedElements({
      clientInfo: true,
      beneficiaryInfo: true,
      serviceDetails: true,
      paymentInfo: false,
      appointmentInfo: true,
      additionalOptions: true,
    });
  }, [isOpen, currentAssignedProviderEmail, currentProviderId]);

  // Load providers (best-effort, paginated)
  useEffect(() => {
    if (!isOpen) return;
    if (mode !== 'registered') return;

    let cancelled = false;
    async function loadProviders() {
      setProvidersLoading(true);
      try {
        const limit = 100;
        const maxTotal = 500;
        let offset = 0;
        const all: ProviderInfo[] = [];

        while (offset < maxTotal) {
          const res = await fetch(`/api/providers?limit=${limit}&offset=${offset}&status=ALL`, {
            method: 'GET',
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || !json?.success) {
            logger.error({ 
              status: res.status, 
              json,
              url: `/api/providers?limit=${limit}&offset=${offset}&status=ALL`
            }, 'Error fetching providers');
            break;
          }

          const pageItems = (json.data as ProviderInfo[]) || [];
          if (pageItems.length === 0 && offset === 0) {
            logger.warn({ json }, 'No providers found in first page');
          }
          all.push(...pageItems);

          if (pageItems.length < limit) break;
          offset += limit;
        }

        if (!cancelled) {
          setProviders(all);
        }
      } catch (error) {
        logger.error({ error }, 'Error loading providers');
        notificationManager.addError('Erreur lors du chargement des prestataires');
      } finally {
        if (!cancelled) setProvidersLoading(false);
      }
    }

    loadProviders();
    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, notificationManager]);

  const filteredProviders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter((p) => {
      const hay = `${p.name || ''} ${p.email || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [providers, search]);

  const canSubmit = useMemo(() => {
    if (mode === 'registered') return !!selectedProviderId;
    return !!externalEmail && externalEmail.includes('@');
  }, [mode, selectedProviderId, externalEmail]);

  const canRemoveProvider = useMemo(() => {
    return !!(currentProviderId || currentAssignedProviderEmail);
  }, [currentProviderId, currentAssignedProviderEmail]);

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload =
        mode === 'registered'
          ? { mode: 'registered', providerId: selectedProviderId, sharedElements }
          : { mode: 'external', providerEmail: externalEmail.trim(), providerName: externalName.trim() || undefined, sendEmail, sharedElements };

      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/assign-provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Erreur lors de l’attribution');
      }

      notificationManager.addSuccess('Prestataire attribué avec succès');
      await onAssigned?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      notificationManager.addError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const removeProvider = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/assign-provider`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Erreur lors de la suppression du prestataire');
      }

      notificationManager.addSuccess('Prestataire retiré avec succès');
      await onAssigned?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      notificationManager.addError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Attribuer un prestataire</h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="assign-mode"
                value="registered"
                checked={mode === 'registered'}
                onChange={() => setMode('registered')}
              />
              Prestataire enregistré
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="assign-mode"
                value="external"
                checked={mode === 'external'}
                onChange={() => setMode('external')}
              />
              Prestataire non enregistré (email)
            </label>
          </div>

          {mode === 'registered' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom ou email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prestataire</label>
                <div className="relative">
                  <select
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                    disabled={providersLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">Sélectionner un prestataire</option>
                    {filteredProviders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.email}
                      </option>
                    ))}
                  </select>
                  {providersLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Liste chargée (max 500). Utilisez la recherche si nécessaire.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email du prestataire</label>
                <input
                  type="email"
                  value={externalEmail}
                  onChange={(e) => setExternalEmail(e.target.value)}
                  placeholder="prestataire@exemple.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom (optionnel)</label>
                <input
                  type="text"
                  value={externalName}
                  onChange={(e) => setExternalName(e.target.value)}
                  placeholder="Nom du prestataire"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                Envoyer les détails de la réservation par email
              </label>
            </div>
          )}

          {/* Section de sélection des éléments à transmettre */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Éléments à transmettre au prestataire</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={sharedElements.clientInfo}
                  onChange={(e) => setSharedElements({ ...sharedElements, clientInfo: e.target.checked })}
                />
                Informations client
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={sharedElements.beneficiaryInfo}
                  onChange={(e) => setSharedElements({ ...sharedElements, beneficiaryInfo: e.target.checked })}
                />
                Informations bénéficiaire
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={sharedElements.serviceDetails}
                  onChange={(e) => setSharedElements({ ...sharedElements, serviceDetails: e.target.checked })}
                />
                Détails du service
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={sharedElements.paymentInfo}
                  onChange={(e) => setSharedElements({ ...sharedElements, paymentInfo: e.target.checked })}
                />
                Informations de paiement
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={sharedElements.appointmentInfo}
                  onChange={(e) => setSharedElements({ ...sharedElements, appointmentInfo: e.target.checked })}
                />
                Informations de rendez-vous
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={sharedElements.additionalOptions}
                  onChange={(e) => setSharedElements({ ...sharedElements, additionalOptions: e.target.checked })}
                />
                Options supplémentaires
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <div>
            {canRemoveProvider && (
              <button
                onClick={removeProvider}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    Retirer le prestataire
                  </>
                )}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={submitting || !canSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-[hsl(25,100%,53%)] rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Attribution...
                </>
              ) : (
                'Attribuer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



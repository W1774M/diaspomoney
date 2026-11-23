'use client';

import { AuthorizedRoute } from '@/components/auth';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useNotificationManager } from '@/components/ui/Notification';
import { useAuth } from '@/hooks';
import { ROLES } from '@/lib/constants';
import { isPlaceholderEmail } from '@/lib/csm/provider-proposal';
import { UserPlus, RefreshCcw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type ProviderLite = {
  id?: string;
  _id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  status?: string;
  category?: string;
};

type ProposalForm = {
  type: 'INDIVIDUAL' | 'INSTITUTION';
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  category: '' | 'HEALTH' | 'BTP' | 'EDUCATION';
  city: string;
  notes: string;
};

const EMPTY_FORM: ProposalForm = {
  type: 'INDIVIDUAL',
  firstName: '',
  lastName: '',
  companyName: '',
  email: '',
  phone: '',
  category: '',
  city: '',
  notes: '',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Actif', className: 'bg-green-100 text-green-800' },
  PENDING: { label: 'En attente de validation', className: 'bg-yellow-100 text-yellow-800' },
  INACTIVE: { label: 'Inactif', className: 'bg-gray-100 text-gray-700' },
  SUSPENDED: { label: 'Suspendu', className: 'bg-red-100 text-red-800' },
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus:border-transparent text-sm';

function CSMPorfolioPageContent() {
  const { user } = useAuth();
  const notificationManager = useNotificationManager();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProposalForm>(EMPTY_FORM);
  const setField = useCallback(
    <K extends keyof ProposalForm>(key: K, value: ProposalForm[K]) =>
      setForm(prev => ({ ...prev, [key]: value })),
    [],
  );
  const [portfolioProviderIds, setPortfolioProviderIds] = useState<string[]>([]);
  const [providers, setProviders] = useState<ProviderLite[]>([]);

  const fetchPortfolioIds = useCallback(async () => {
    const res = await fetch('/api/csm/portfolio/providers');
    if (!res.ok) throw new Error('Impossible de récupérer le portefeuille');
    const data = await res.json();
    return (data.providerIds || []) as string[];
  }, []);

  const fetchProviders = useCallback(async () => {
    // /api/providers est déjà restreint au portefeuille pour un CSM
    const res = await fetch('/api/providers?status=ALL&limit=100&offset=0');
    if (!res.ok) throw new Error('Impossible de récupérer les prestataires');
    const data = await res.json();
    return (data.data || data.providers || data.items || data || []) as ProviderLite[];
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ids, provs] = await Promise.all([fetchPortfolioIds(), fetchProviders()]);
      setPortfolioProviderIds(ids);
      setProviders(Array.isArray(provs) ? provs : []);
    } catch (e) {
      notificationManager.addError(
        e instanceof Error ? e.message : "Erreur lors du rafraîchissement",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchPortfolioIds, fetchProviders, notificationManager]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const normalizedProviders = useMemo(() => {
    return providers.map((p) => ({
      ...p,
      id: p.id || p._id || '',
      name:
        p.name ||
        `${p.firstName || ''} ${p.lastName || ''}`.trim() ||
        p.email ||
        'Prestataire',
    }));
  }, [providers]);

  const handleAdd = useCallback(async () => {
    // Vérifications rapides côté client (le serveur valide aussi)
    const hasName =
      form.type === 'INSTITUTION'
        ? form.companyName.trim().length > 0
        : (form.firstName + form.lastName).trim().length > 0;
    if (!hasName) {
      notificationManager.addError(
        form.type === 'INSTITUTION'
          ? "Indiquez le nom de l'établissement"
          : 'Indiquez le nom du prestataire',
      );
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      notificationManager.addError('Indiquez au moins un e-mail ou un téléphone');
      return;
    }

    setLoading(true);
    try {
      const provider = Object.fromEntries(
        Object.entries(form).filter(([, v]) => typeof v === 'string' && v.trim() !== ''),
      );
      const res = await fetch('/api/csm/portfolio/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || "Impossible d'ajouter ce prestataire");
      }

      const payload = data.data || data;
      if (payload.status === 'created') {
        const missing: string[] = payload.missingInfo || [];
        notificationManager.addSuccess(
          `${payload.providerName} n'avait pas de compte : il est ajouté à votre portefeuille, en attente de validation par un admin.` +
            (missing.length > 0
              ? ` Informations manquantes : ${missing.join(', ')} (l'admin prendra contact avec le prestataire).`
              : ''),
          8000,
        );
      } else {
        notificationManager.addSuccess(
          `${payload.providerName || 'Prestataire'} retrouvé et ajouté à votre portefeuille`,
        );
      }
      setForm(EMPTY_FORM);
      await refresh();
    } catch (e) {
      notificationManager.addError(e instanceof Error ? e.message : 'Erreur lors de l’ajout');
    } finally {
      setLoading(false);
    }
  }, [form, notificationManager, refresh]);

  const handleRemove = useCallback(
    async (providerId: string) => {
      if (!providerId) return;
      setLoading(true);
      try {
        const res = await fetch('/api/csm/portfolio/providers', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId }),
        });
        if (!res.ok) throw new Error("Impossible de retirer ce prestataire");
        notificationManager.addSuccess('Prestataire retiré du portefeuille');
        await refresh();
      } catch (e) {
        notificationManager.addError(e instanceof Error ? e.message : 'Erreur lors de la suppression');
      } finally {
        setLoading(false);
      }
    },
    [notificationManager, refresh],
  );

  return (
    <div className='space-y-6'>
      <DashboardHeader
        userName={user?.name || 'CSM'}
        subtitle='Mon portefeuille de prestataires (ajout manuel + attributions)'
      />

      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>Ajouter un prestataire</h2>
            <p className='text-sm text-gray-600 mt-1'>
              Indiquez ce que vous savez : un nom et au moins un e-mail ou un téléphone.
              Un prestataire déjà inscrit est retrouvé automatiquement. Sinon, il est
              ajouté en attente de validation : un admin vérifiera ses informations ou
              le contactera si elles sont insuffisantes.
            </p>
          </div>
          <div className='text-sm text-gray-700 whitespace-nowrap'>
            <span className='font-medium'>Dans le portefeuille :</span> {portfolioProviderIds.length}
          </div>
        </div>

        <form
          className='mt-4 space-y-4'
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <fieldset className='flex flex-wrap gap-4 text-sm'>
            <legend className='sr-only'>Type de prestataire</legend>
            <label className='inline-flex items-center gap-2'>
              <input
                type='radio'
                name='type'
                checked={form.type === 'INDIVIDUAL'}
                onChange={() => setField('type', 'INDIVIDUAL')}
              />
              Indépendant
            </label>
            <label className='inline-flex items-center gap-2'>
              <input
                type='radio'
                name='type'
                checked={form.type === 'INSTITUTION'}
                onChange={() => setField('type', 'INSTITUTION')}
              />
              Établissement / entreprise
            </label>
          </fieldset>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {form.type === 'INSTITUTION' ? (
              <label className='sm:col-span-2 text-sm text-gray-700'>
                Nom de l&apos;établissement *
                <input
                  value={form.companyName}
                  onChange={(e) => setField('companyName', e.target.value)}
                  className={`${inputClass} mt-1`}
                  autoComplete='organization'
                />
              </label>
            ) : (
              <>
                <label className='text-sm text-gray-700'>
                  Prénom
                  <input
                    value={form.firstName}
                    onChange={(e) => setField('firstName', e.target.value)}
                    className={`${inputClass} mt-1`}
                    autoComplete='off'
                  />
                </label>
                <label className='text-sm text-gray-700'>
                  Nom *
                  <input
                    value={form.lastName}
                    onChange={(e) => setField('lastName', e.target.value)}
                    className={`${inputClass} mt-1`}
                    autoComplete='off'
                  />
                </label>
              </>
            )}
            <label className='text-sm text-gray-700'>
              E-mail
              <input
                type='email'
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className={`${inputClass} mt-1`}
                autoComplete='off'
              />
            </label>
            <label className='text-sm text-gray-700'>
              Téléphone
              <input
                type='tel'
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                className={`${inputClass} mt-1`}
                autoComplete='off'
              />
            </label>
            <label className='text-sm text-gray-700'>
              Catégorie
              <select
                value={form.category}
                onChange={(e) => setField('category', e.target.value as ProposalForm['category'])}
                className={`${inputClass} mt-1`}
              >
                <option value=''>Je ne sais pas</option>
                <option value='HEALTH'>Santé</option>
                <option value='BTP'>BTP</option>
                <option value='EDUCATION'>Éducation</option>
              </select>
            </label>
            <label className='text-sm text-gray-700'>
              Ville
              <input
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                className={`${inputClass} mt-1`}
                autoComplete='off'
              />
            </label>
            <label className='sm:col-span-2 text-sm text-gray-700'>
              Note pour l&apos;admin
              <textarea
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                rows={2}
                className={`${inputClass} mt-1 resize-y`}
                placeholder='Comment vous connaissez ce prestataire, informations utiles…'
              />
            </label>
          </div>
          <p className='text-xs text-gray-500'>* Obligatoire, ainsi qu&apos;un e-mail ou un téléphone.</p>

          <div className='flex flex-col sm:flex-row gap-2'>
            <button
              type='submit'
              disabled={loading}
              className='inline-flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50'
            >
              <UserPlus className='h-4 w-4 mr-2' />
              Ajouter au portefeuille
            </button>
            <button
              type='button'
              onClick={refresh}
              disabled={loading}
              className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50'
            >
              <RefreshCcw className='h-4 w-4 mr-2' />
              Rafraîchir
            </button>
          </div>
        </form>
      </div>

      <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
        <div className='p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>Mon portefeuille</h2>
            <p className='text-sm text-gray-600 mt-1'>
              Vous ne voyez que les prestataires de votre portefeuille.
            </p>
          </div>
          {loading && <div className='text-sm text-gray-500'>Chargement…</div>}
        </div>

        {normalizedProviders.length === 0 ? (
          <div className='p-6 text-center text-gray-600'>
            Aucun prestataire dans votre portefeuille pour le moment.
          </div>
        ) : (
          <div className='divide-y divide-gray-200'>
            {normalizedProviders.map((p) => (
              <div key={p.id} className='p-4 sm:p-6 flex items-start justify-between gap-4'>
                <div className='min-w-0'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='font-medium text-gray-900 truncate'>{p.name}</p>
                    {p.status && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          STATUS_LABELS[p.status]?.className || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {STATUS_LABELS[p.status]?.label || p.status}
                      </span>
                    )}
                    {p.category && (
                      <span className='px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700'>
                        {p.category}
                      </span>
                    )}
                  </div>
                  <div className='text-sm text-gray-600 mt-2 space-y-1'>
                    {p.email && !isPlaceholderEmail(p.email) && (
                      <div><span className='font-medium'>E-mail :</span> {p.email}</div>
                    )}
                    {p.phone && <div><span className='font-medium'>Tél. :</span> {p.phone}</div>}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(p.id || '')}
                  disabled={loading}
                  className='inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50'
                  title='Retirer du portefeuille'
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CSMPorfolioPage() {
  return (
    <AuthorizedRoute roles={[ROLES.CSM]} redirectTo='/dashboard'>
      <CSMPorfolioPageContent />
    </AuthorizedRoute>
  );
}



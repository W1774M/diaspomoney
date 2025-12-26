'use client';

import { AuthorizedRoute } from '@/components/auth';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useNotificationManager } from '@/components/ui/Notification';
import { useAuth } from '@/hooks';
import { ROLES } from '@/lib/constants';
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

function CSMPorfolioPageContent() {
  const { user } = useAuth();
  const notificationManager = useNotificationManager();

  const [loading, setLoading] = useState(false);
  const [providerIdInput, setProviderIdInput] = useState('');
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
    const providerId = providerIdInput.trim();
    if (!/^[a-f\d]{24}$/i.test(providerId)) {
      notificationManager.addError('Veuillez saisir un providerId valide (ObjectId MongoDB)');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/csm/portfolio/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });
      if (!res.ok) throw new Error("Impossible d'ajouter ce prestataire");

      notificationManager.addSuccess('Prestataire ajouté au portefeuille');
      setProviderIdInput('');
      await refresh();
    } catch (e) {
      notificationManager.addError(e instanceof Error ? e.message : 'Erreur lors de l’ajout');
    } finally {
      setLoading(false);
    }
  }, [providerIdInput, notificationManager, refresh]);

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
        <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4'>
          <div className='flex-1'>
            <h2 className='text-lg font-semibold text-gray-900'>Ajouter un prestataire</h2>
            <p className='text-sm text-gray-600 mt-1'>
              Ajoutez un prestataire à votre portefeuille via son <span className='font-mono'>providerId</span>.
            </p>
            <div className='mt-3 flex flex-col sm:flex-row gap-2'>
              <input
                value={providerIdInput}
                onChange={(e) => setProviderIdInput(e.target.value)}
                placeholder='Ex: 64d2f9c3e6a1b2c3d4e5f678'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent font-mono text-sm'
              />
              <button
                onClick={handleAdd}
                disabled={loading}
                className='inline-flex items-center justify-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors disabled:opacity-50'
              >
                <UserPlus className='h-4 w-4 mr-2' />
                Ajouter
              </button>
              <button
                onClick={refresh}
                disabled={loading}
                className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50'
              >
                <RefreshCcw className='h-4 w-4 mr-2' />
                Rafraîchir
              </button>
            </div>
          </div>
          <div className='text-sm text-gray-700'>
            <div>
              <span className='font-medium'>IDs portefeuille:</span> {portfolioProviderIds.length}
            </div>
            <div>
              <span className='font-medium'>Prestataires visibles:</span> {normalizedProviders.length}
            </div>
          </div>
        </div>
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
                      <span className='px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700'>
                        {p.status}
                      </span>
                    )}
                    {p.category && (
                      <span className='px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700'>
                        {p.category}
                      </span>
                    )}
                  </div>
                  <p className='text-xs text-gray-500 font-mono mt-1'>{p.id}</p>
                  <div className='text-sm text-gray-600 mt-2 space-y-1'>
                    {p.email && <div><span className='font-medium'>Email:</span> {p.email}</div>}
                    {p.phone && <div><span className='font-medium'>Tel:</span> {p.phone}</div>}
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



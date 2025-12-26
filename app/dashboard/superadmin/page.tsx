'use client';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import RoleSpecificStats from '@/components/dashboard/RoleSpecificStats';
import { SuperAdminRoute } from '@/components/auth';
import { useAuth } from '@/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, RefreshCcw } from 'lucide-react';

type HealthStatus = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: { status: string; responseTime?: number; host?: string; name?: string };
    redis?: { status: string; responseTime?: number };
    cdn?: { status: string; responseTime?: number };
  };
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    activeAlerts: number;
  };
  alerts: Array<{ id: string; severity: string; message: string; timestamp: string }>;
};

function StatusBadge({ status }: { status: HealthStatus['status'] }) {
  const cfg = useMemo(() => {
    if (status === 'healthy') return { label: 'OK', cls: 'bg-green-50 text-green-700 border-green-200' };
    if (status === 'degraded') return { label: 'Dégradé', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    return { label: 'KO', cls: 'bg-red-50 text-red-700 border-red-200' };
  }, [status]);

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function SuperAdminHealthPanel() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Erreur health (${res.status})`);
      }
      const json = (await res.json()) as HealthStatus;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 30_000);
    return () => clearInterval(id);
  }, [fetchHealth]);

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
      <div className='p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between gap-3'>
        <div>
          <h2 className='text-lg font-semibold text-gray-900'>Santé application</h2>
          <p className='text-sm text-gray-600 mt-1'>Source: <span className='font-mono'>/api/health</span> (refresh auto 30s)</p>
        </div>
        <div className='flex items-center gap-2'>
          <a
            href='/api/monitoring/metrics'
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50'
            title='Ouvrir les métriques Prometheus'
          >
            <ExternalLink className='h-4 w-4 mr-2' />
            Métriques
          </a>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className='inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50'
          >
            <RefreshCcw className='h-4 w-4 mr-2' />
            Rafraîchir
          </button>
        </div>
      </div>

      <div className='p-4 sm:p-6 space-y-4'>
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <p className='text-red-800 text-sm'>{error}</p>
          </div>
        )}

        {!data ? (
          <div className='text-sm text-gray-600'>{loading ? 'Chargement…' : 'Aucune donnée.'}</div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='border border-gray-200 rounded-lg p-4'>
              <div className='flex items-center justify-between'>
                <p className='text-sm text-gray-600'>Statut</p>
                <StatusBadge status={data.status} />
              </div>
              <p className='text-xs text-gray-500 mt-2'>Version: {data.version}</p>
              <p className='text-xs text-gray-500'>Uptime: {Math.round(data.uptime)}s</p>
            </div>
            <div className='border border-gray-200 rounded-lg p-4'>
              <p className='text-sm text-gray-600'>DB</p>
              <p className='mt-1 font-medium text-gray-900'>{data.services.database.status}</p>
              <p className='text-xs text-gray-500 mt-2'>
                {data.services.database.responseTime !== undefined ? `${data.services.database.responseTime}ms` : '—'}
                {data.services.database.host ? ` • ${data.services.database.host}` : ''}
              </p>
            </div>
            <div className='border border-gray-200 rounded-lg p-4'>
              <p className='text-sm text-gray-600'>Redis</p>
              <p className='mt-1 font-medium text-gray-900'>{data.services.redis?.status || 'disconnected'}</p>
              <p className='text-xs text-gray-500 mt-2'>
                {data.services.redis?.responseTime !== undefined ? `${data.services.redis.responseTime}ms` : '—'}
              </p>
            </div>
            <div className='border border-gray-200 rounded-lg p-4'>
              <p className='text-sm text-gray-600'>Perf</p>
              <p className='mt-1 text-sm text-gray-900'>
                Req: <span className='font-medium'>{data.metrics.totalRequests}</span>
              </p>
              <p className='mt-1 text-sm text-gray-900'>
                Error rate: <span className='font-medium'>{(data.metrics.errorRate * 100).toFixed(2)}%</span>
              </p>
              <p className='mt-1 text-sm text-gray-900'>
                Avg: <span className='font-medium'>{Math.round(data.metrics.averageResponseTime)}ms</span>
              </p>
              <p className='text-xs text-gray-500 mt-2'>Alertes actives: {data.metrics.activeAlerts}</p>
            </div>
          </div>
        )}

        {data?.alerts?.length ? (
          <div className='border border-gray-200 rounded-lg overflow-hidden'>
            <div className='px-4 py-3 bg-gray-50 border-b border-gray-200'>
              <p className='text-sm font-medium text-gray-900'>Alertes actives</p>
            </div>
            <div className='divide-y divide-gray-200'>
              {data.alerts.slice(0, 10).map(a => (
                <div key={a.id} className='p-4'>
                  <div className='flex items-center justify-between gap-3'>
                    <p className='text-sm font-medium text-gray-900'>{a.message}</p>
                    <span className='text-xs text-gray-500'>{a.severity}</span>
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>{new Date(a.timestamp).toLocaleString('fr-FR')}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SuperAdminDashboardContent() {
  const { user } = useAuth();

  return (
    <div className='space-y-6'>
      <DashboardHeader
        userName={user?.name || 'Super Admin'}
        subtitle="Observabilité & pilotage plateforme (santé, alertes, métriques, graphes d'activité)"
      />

      <SuperAdminHealthPanel />

      {/* Graphes plateforme (déjà existants) */}
      <RoleSpecificStats {...(user?.id && { userId: user.id })} />
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  return (
    <SuperAdminRoute redirectTo='/dashboard'>
      <SuperAdminDashboardContent />
    </SuperAdminRoute>
  );
}



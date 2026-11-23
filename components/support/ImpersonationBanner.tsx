'use client';

/**
 * Bandeau affiché pendant une consultation du support (« voir en tant que ») :
 * qui est consulté, pourquoi, jusqu'à quand, et un bouton pour quitter.
 */
import type { ImpersonationInfo } from '@/lib/support/impersonation-policy';
import { Eye } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function ImpersonationBanner() {
  const { data, update } = useSession();
  const info = (data as { impersonation?: ImpersonationInfo } | null)?.impersonation;
  const [leaving, setLeaving] = useState(false);

  const leave = async () => {
    if (!info) return;
    setLeaving(true);
    try {
      await update({ endImpersonation: true });
    } finally {
      // Rechargement complet : aucune donnée de l'utilisateur consulté ne reste en mémoire
      window.location.assign(`/dashboard/users/${encodeURIComponent(info.targetId)}`);
    }
  };

  // Fin automatique : à l'échéance, la session redevient celle de l'admin
  useEffect(() => {
    if (!info) return;
    const delay = Math.max(0, info.expiresAt - Date.now()) + 1000;
    const timer = window.setTimeout(() => window.location.reload(), delay);
    return () => window.clearTimeout(timer);
  }, [info]);

  if (!info) return null;

  const until = new Date(info.expiresAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      role='status'
      className='sticky top-0 z-[1000] w-full bg-amber-500 text-amber-950 px-4 py-2 text-sm shadow'
    >
      <div className='mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1'>
        <Eye className='h-4 w-4 shrink-0' aria-hidden='true' />
        <p className='flex-1 min-w-0'>
          <strong>Consultation du compte de {info.targetName}</strong> en lecture seule par {info.adminName} ·
          motif : {info.reason} · jusqu’à {until}
        </p>
        <button
          type='button'
          onClick={leave}
          disabled={leaving}
          className='rounded-md bg-amber-950 px-3 py-1 font-medium text-white hover:bg-amber-900 disabled:opacity-60'
        >
          {leaving ? 'Sortie…' : 'Quitter la consultation'}
        </button>
      </div>
    </div>
  );
}

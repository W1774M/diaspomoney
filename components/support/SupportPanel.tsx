'use client';

/**
 * Carte « Support » de la fiche utilisateur (administrateurs) : volumes réels, actions
 * ciblées avec motif obligatoire, consultation en lecture seule et historique du support.
 */
import { useNotificationManager } from '@/components/ui/Notification';
import { IMPERSONATION_REASON_MIN_LENGTH } from '@/lib/support/impersonation-policy';
import { Eye, KeyRound, LifeBuoy, PauseCircle, PlayCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

type PendingAction = 'suspend' | 'reactivate' | 'send-password-reset' | 'impersonate';

interface SupportSummary {
  user: { id: string; name: string; status: string; emailVerified: boolean; email: string };
  counts: { bookingsAsCustomer: number; bookingsAsProvider: number; transactions: number; invoices: number };
  canImpersonate: boolean;
  history: Array<{ id: string; action: string; at: string; adminName: string; reason: string }>;
}

const ACTION_LABELS: Record<PendingAction, string> = {
  impersonate: 'Voir en tant que (lecture seule)',
  'send-password-reset': 'Envoyer un lien de réinitialisation du mot de passe',
  suspend: 'Suspendre le compte',
  reactivate: 'Réactiver le compte',
};

const HISTORY_LABELS: Record<string, string> = {
  SUPPORT_IMPERSONATION_REQUESTED: 'Consultation demandée',
  SUPPORT_IMPERSONATION_STARTED: 'Consultation commencée',
  SUPPORT_IMPERSONATION_ENDED: 'Consultation terminée',
  SUPPORT_ACCOUNT_SUSPENDED: 'Compte suspendu',
  SUPPORT_ACCOUNT_REACTIVATED: 'Compte réactivé',
  SUPPORT_PASSWORD_RESET_SENT: 'Lien de mot de passe envoyé',
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

export function SupportPanel({ userId, onChanged }: { userId: string; onChanged?: () => void }) {
  const { update } = useSession();
  const { addSuccess, addError } = useNotificationManager();
  const [summary, setSummary] = useState<SupportSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/support/users/${encodeURIComponent(userId)}`, { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Fiche support indisponible');
      setSummary(body.data);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Fiche support indisponible');
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const cancel = () => {
    setPending(null);
    setReason('');
  };

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending === 'impersonate') {
        const res = await fetch(`/api/admin/support/users/${encodeURIComponent(userId)}/impersonation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Consultation impossible');
        const session = await update({ impersonationTicket: body.data.ticketId });
        if (!(session as { impersonation?: unknown } | null)?.impersonation) {
          throw new Error('La consultation n’a pas pu démarrer. Réessayez.');
        }
        // Rechargement complet : aucune donnée de l'admin ne reste en mémoire côté client
        window.location.assign('/dashboard');
        return;
      }

      const res = await fetch(`/api/admin/support/users/${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: pending, reason }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Action impossible');
      addSuccess(body.message || 'Action effectuée', 5000);
      cancel();
      await load();
      onChanged?.();
    } catch (error) {
      addError(error instanceof Error ? error.message : 'Action impossible', 8000);
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
        <h2 className='text-lg font-semibold text-gray-900 mb-2'>Support</h2>
        <p className='text-sm text-gray-600'>{loadError}</p>
      </div>
    );
  }
  if (!summary) {
    return (
      <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
        <h2 className='text-lg font-semibold text-gray-900 mb-2'>Support</h2>
        <p className='text-sm text-gray-500'>Chargement…</p>
      </div>
    );
  }

  const { counts, user } = summary;
  const available: PendingAction[] = [];
  if (summary.canImpersonate) available.push('impersonate');
  if (user.email) available.push('send-password-reset');
  if (user.status === 'SUSPENDED') available.push('reactivate');
  else if (summary.canImpersonate) available.push('suspend');

  const icons: Record<PendingAction, React.ReactNode> = {
    impersonate: <Eye className='h-4 w-4 mr-2' />,
    'send-password-reset': <KeyRound className='h-4 w-4 mr-2' />,
    suspend: <PauseCircle className='h-4 w-4 mr-2' />,
    reactivate: <PlayCircle className='h-4 w-4 mr-2' />,
  };
  const reasonOk = reason.trim().length >= IMPERSONATION_REASON_MIN_LENGTH;

  return (
    <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
      <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
        <LifeBuoy className='h-5 w-5 mr-2 text-brand-600' />
        Support
      </h2>

      <dl className='grid grid-cols-2 gap-3 mb-5 text-sm'>
        <div>
          <dt className='text-gray-600'>Réservations (client)</dt>
          <dd className='text-lg font-bold text-gray-900'>{counts.bookingsAsCustomer}</dd>
        </div>
        <div>
          <dt className='text-gray-600'>Réservations (prestataire)</dt>
          <dd className='text-lg font-bold text-gray-900'>{counts.bookingsAsProvider}</dd>
        </div>
        <div>
          <dt className='text-gray-600'>Transactions</dt>
          <dd className='text-lg font-bold text-gray-900'>{counts.transactions}</dd>
        </div>
        <div>
          <dt className='text-gray-600'>Factures</dt>
          <dd className='text-lg font-bold text-gray-900'>{counts.invoices}</dd>
        </div>
        <div className='col-span-2'>
          <dt className='text-gray-600'>E-mail vérifié</dt>
          <dd className='text-gray-900'>{user.emailVerified ? 'Oui' : 'Non'}</dd>
        </div>
      </dl>

      {pending ? (
        <div className='space-y-3'>
          <p className='text-sm font-medium text-gray-900'>{ACTION_LABELS[pending]}</p>
          {pending === 'impersonate' && (
            <p className='text-xs text-gray-600'>
              Vous verrez l’application comme cet utilisateur, sans pouvoir rien modifier, pendant 30 minutes au
              plus. La consultation est inscrite au journal d’audit.
            </p>
          )}
          <label className='block text-sm text-gray-700' htmlFor='support-reason'>
            Motif (obligatoire)
          </label>
          <input
            id='support-reason'
            type='text'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='ex. ticket 123 : paiement bloqué'
            maxLength={500}
            className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none'
            autoFocus
          />
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={confirm}
              disabled={!reasonOk || busy}
              className='flex-1 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {busy ? 'En cours…' : 'Confirmer'}
            </button>
            <button
              type='button'
              onClick={cancel}
              disabled={busy}
              className='px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50'
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className='space-y-2'>
          {available.map((action) => (
            <button
              key={action}
              type='button'
              onClick={() => setPending(action)}
              className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm transition-colors ${
                action === 'suspend'
                  ? 'border border-red-300 text-red-700 hover:bg-red-50'
                  : 'border border-gray-300 text-gray-800 hover:bg-gray-50'
              }`}
            >
              {icons[action]}
              {ACTION_LABELS[action]}
            </button>
          ))}
          {!summary.canImpersonate && user.status !== 'SUSPENDED' && (
            <p className='text-xs text-gray-500'>Les comptes administrateurs ne peuvent pas être consultés.</p>
          )}
        </div>
      )}

      <h3 className='text-sm font-semibold text-gray-800 mt-6 mb-2'>Historique du support</h3>
      {summary.history.length === 0 ? (
        <p className='text-sm text-gray-500'>Aucune intervention.</p>
      ) : (
        <ul className='space-y-2 text-sm'>
          {summary.history.map((entry) => (
            <li key={entry.id} className='border-l-2 border-gray-200 pl-3'>
              <p className='text-gray-900'>{HISTORY_LABELS[entry.action] ?? entry.action}</p>
              <p className='text-xs text-gray-500'>
                {formatDateTime(entry.at)}
                {entry.adminName && ` · ${entry.adminName}`}
                {entry.reason && ` · ${entry.reason}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

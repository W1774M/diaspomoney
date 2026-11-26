'use client';
import {
  notificationActions,
  useDispatch,
  useNotifications,
} from '@/store/simple-store';
import type { INotificationUIType } from '@/lib/types';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface ToastItem {
  id: string;
  type: INotificationUIType;
  message: string;
  duration?: number;
}

// Contraste AA (texte blanc ≥ 4,5:1) et icône : l'état ne repose pas sur la couleur seule
const STYLES: Record<INotificationUIType, { box: string; Icon: typeof Info; label: string }> = {
  info: { box: 'bg-stone-900 text-white', Icon: Info, label: 'Information' },
  success: { box: 'bg-green-700 text-white', Icon: CheckCircle2, label: 'Succès' },
  warning: { box: 'bg-amber-300 text-stone-950', Icon: AlertTriangle, label: 'Attention' },
  error: { box: 'bg-red-700 text-white', Icon: XCircle, label: 'Erreur' },
};

const asType = (t: unknown): INotificationUIType =>
  t === 'success' || t === 'warning' || t === 'error' ? t : 'info';

type AriaNotifyDocument = Document & {
  ariaNotify?: (message: string, options?: { priority?: 'normal' | 'high' }) => void;
};

function Toast({ item, onClose }: { item: ToastItem; onClose: (id: string) => void }) {
  const { box, Icon, label } = STYLES[item.type];
  const ref = useRef<HTMLLIElement>(null);
  const [paused, setPaused] = useState(false);
  // Erreurs persistantes (à fermer soi-même) ; le reste disparaît, sauf survol ou focus
  const duration = item.type === 'error' ? 0 : (item.duration ?? 6000);

  useEffect(() => {
    if (!duration || paused) return;
    const t = window.setTimeout(() => onClose(item.id), duration);
    return () => window.clearTimeout(t);
  }, [duration, paused, item.id, onClose]);

  return (
    <li
      ref={ref}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={e => {
        if (!ref.current?.contains(e.relatedTarget as Node)) setPaused(false);
      }}
      className={`toast-item pointer-events-auto flex w-full items-start gap-3 rounded-xl p-4 shadow-lg ring-1 ring-black/10 ${box}`}
    >
      <Icon aria-hidden='true' className='mt-0.5 size-5 shrink-0' />
      <p className='min-w-0 flex-1 text-sm font-medium'>
        <span className='visually-hidden'>{label} : </span>
        {item.message}
      </p>
      <button
        type='button'
        onClick={() => onClose(item.id)}
        className='-m-2 inline-flex size-10 shrink-0 items-center justify-center rounded-md hover:bg-black/10'
      >
        <X aria-hidden='true' className='size-4' />
        <span className='visually-hidden'>Fermer la notification</span>
      </button>
    </li>
  );
}

/**
 * Zone de notifications unique (montée une fois dans app/layout.tsx).
 * Annonce : ariaNotify() si disponible, sinon régions live présentes dès le chargement.
 */
export default function NotificationContainer() {
  const notifications = useNotifications() as ToastItem[];
  const dispatch = useDispatch();
  const regionRef = useRef<HTMLDivElement>(null);
  const announced = useRef(new Set<string>());
  const [politeText, setPoliteText] = useState('');
  const [assertiveText, setAssertiveText] = useState('');

  const remove = useCallback(
    (id: string) => {
      // focus dans le toast fermé : passer au suivant, sinon le relâcher sans le perdre
      const region = regionRef.current;
      const hadFocus = region?.contains(document.activeElement);
      dispatch(notificationActions.remove(id));
      if (hadFocus) {
        requestAnimationFrame(() => {
          const next = region?.querySelector<HTMLButtonElement>('.toast-item button');
          if (next) next.focus();
          else (document.getElementById('contenu') ?? document.body).focus();
        });
      }
    },
    [dispatch],
  );

  useEffect(() => {
    for (const n of notifications) {
      if (announced.current.has(n.id)) continue;
      announced.current.add(n.id);
      const type = asType(n.type);
      const text = `${STYLES[type].label} : ${n.message}`;
      const doc = document as AriaNotifyDocument;
      if (typeof doc.ariaNotify === 'function') {
        doc.ariaNotify(text, { priority: type === 'error' ? 'high' : 'normal' });
      } else if (type === 'error') {
        setAssertiveText(text);
      } else {
        setPoliteText(text);
      }
    }
  }, [notifications]);

  const items = useMemo(
    () => notifications.map(n => ({ ...n, type: asType(n.type) })),
    [notifications],
  );

  return (
    <>
      <div className='visually-hidden' aria-live='polite'>
        {politeText}
      </div>
      <div className='visually-hidden' aria-live='assertive'>
        {assertiveText}
      </div>
      <div
        ref={regionRef}
        role='region'
        aria-label='Notifications'
        className='pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 sm:inset-x-auto sm:end-0 sm:justify-end sm:p-4'
      >
        <ol className='flex w-full max-w-md flex-col gap-2' role='list'>
          {items.map(item => (
            <Toast key={item.id} item={item} onClose={remove} />
          ))}
        </ol>
      </div>
    </>
  );
}

// Hook utilitaire pour ajouter des notifications
export const useNotificationManager = () => {
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      addSuccess: (message: string, duration = 5000) => {
        dispatch(notificationActions.add({ type: 'success', message, duration }));
      },
      addError: (message: string, duration = 8000) => {
        dispatch(notificationActions.add({ type: 'error', message, duration }));
      },
      addWarning: (message: string, duration = 6000) => {
        dispatch(notificationActions.add({ type: 'warning', message, duration }));
      },
      addInfo: (message: string, duration = 5000) => {
        dispatch(notificationActions.add({ type: 'info', message, duration }));
      },
    }),
    [dispatch],
  );
};

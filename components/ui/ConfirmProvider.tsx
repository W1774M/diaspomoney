'use client';

import { AlertTriangle } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { buttonClasses } from './Button';
import { NativeModal } from './NativeModal';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** « danger » pour une action destructive (bouton rouge, focus sur Annuler). */
  variant?: 'default' | 'danger';
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Remplace window.confirm() : boîte <dialog> native, nommée par son titre, Annuler
 * reçoit le focus pour les actions destructives, Échap / clic extérieur = Annuler.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const titleId = useId();
  const descId = useId();

  const confirm = useCallback<ConfirmFn>(opts => {
    const o = typeof opts === 'string' ? { message: opts } : opts;
    resolver.current?.(false);
    setOptions(o);
    return new Promise<boolean>(resolve => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  const danger = options?.variant === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <NativeModal
        open={options !== null}
        onClose={() => settle(false)}
        labelledBy={titleId}
        className='max-w-md rounded-2xl'
      >
        {options && (
          <div className='p-6' aria-describedby={descId}>
            <div className='flex items-start gap-4'>
              {danger && (
                <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700'>
                  <AlertTriangle aria-hidden='true' className='size-5' />
                </span>
              )}
              <div className='min-w-0'>
                <h2 id={titleId} className='text-lg font-semibold text-stone-900'>
                  {options.title ?? (danger ? 'Confirmer la suppression' : 'Confirmer')}
                </h2>
                <p id={descId} className='mt-2 text-sm text-stone-600'>
                  {options.message}
                </p>
              </div>
            </div>
            <div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
              <button
                type='button'
                // action destructive : le choix sûr reçoit le focus
                autoFocus={danger}
                onClick={() => settle(false)}
                className={buttonClasses({ variant: 'outline' })}
              >
                {options.cancelText ?? 'Annuler'}
              </button>
              <button
                type='button'
                autoFocus={!danger}
                onClick={() => settle(true)}
                className={buttonClasses({ variant: danger ? 'danger' : 'primary' })}
              >
                {options.confirmText ?? (danger ? 'Supprimer' : 'Confirmer')}
              </button>
            </div>
          </div>
        )}
      </NativeModal>
    </ConfirmContext.Provider>
  );
}

/** const confirmer = useConfirm(); if (!(await confirmer({ message, variant: 'danger' }))) return; */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Hors provider (tests) : repli sur la boîte native
    return async opts => window.confirm(typeof opts === 'string' ? opts : opts.message);
  }
  return ctx;
}

'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface NativeModalProps {
  open: boolean;
  /** Appelé pour toute fermeture : bouton, Échap, geste retour, clic sur le fond. */
  onClose: () => void;
  /** id du titre de la modale (nom accessible). */
  labelledBy: string;
  /** Clic sur le fond pour fermer (true par défaut). */
  lightDismiss?: boolean;
  className?: string;
  children: ReactNode;
}

const supportsClosedBy =
  typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype;

function isPointerOutside(event: React.PointerEvent<HTMLDialogElement>): boolean {
  const rect = event.currentTarget.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

/**
 * Modale basée sur l'élément natif <dialog> ouvert avec showModal() :
 * top layer, focus piégé puis rendu au bouton d'origine, page inerte, Échap et geste retour
 * gérés par le navigateur. Pas de role="dialog", aria-modal, piège à focus ni
 * overflow:hidden sur <body> (voir styles/globals.css pour le blocage du défilement).
 */
export function NativeModal({
  open,
  onClose,
  labelledBy,
  lightDismiss = true,
  className = '',
  children,
}: NativeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutside = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        // Environnements sans showModal (jsdom) : simple affichage.
        dialog.setAttribute('open', '');
      }
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  const useFallbackDismiss = lightDismiss && !supportsClosedBy;

  return (
    <dialog
      ref={dialogRef}
      // closedby n'est pas encore connu de React 18 : attribut passé tel quel.
      {...{ closedby: lightDismiss ? 'any' : 'closerequest' }}
      aria-labelledby={labelledBy}
      onClose={() => {
        if (open) onClose();
      }}
      onPointerDown={(event) => {
        if (useFallbackDismiss) pressedOutside.current = isPointerOutside(event);
      }}
      onPointerUp={(event) => {
        // Repli Safari : appui ET relâchement hors de la boîte (évite de fermer en fin de sélection).
        if (useFallbackDismiss && pressedOutside.current && isPointerOutside(event)) {
          event.currentTarget.close();
        }
      }}
      className={`m-auto max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto bg-white p-0 shadow-xl ${className}`}
    >
      {open ? children : null}
    </dialog>
  );
}

export default NativeModal;

'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * Menu déroulant / panneau repliable accessible :
 * - le bouton porte aria-expanded + aria-controls ;
 * - Échap ferme et rend le focus au bouton ;
 * - un clic ou un focus hors du conteneur ferme.
 *
 * Usage :
 *   const menu = useDisclosure();
 *   <div ref={menu.containerRef}>
 *     <button {...menu.triggerProps}>Compte</button>
 *     <div {...menu.panelProps} hidden={!menu.open}>…</div>
 *   </div>
 */
export function useDisclosure<
  C extends HTMLElement = HTMLDivElement,
  T extends HTMLElement = HTMLButtonElement,
>(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  const containerRef = useRef<C>(null);
  const triggerRef = useRef<T>(null);
  const panelId = useId();

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);
  const toggle = useCallback(() => setOpen(o => !o), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(true);
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close();
    };
    const onFocus = (e: FocusEvent) => {
      if (e.target instanceof Node && !containerRef.current?.contains(e.target)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('focusin', onFocus);
    };
  }, [open, close]);

  return {
    open,
    setOpen,
    toggle,
    close,
    containerRef,
    triggerRef,
    triggerProps: {
      ref: triggerRef,
      type: 'button' as const,
      'aria-expanded': open,
      'aria-controls': panelId,
      onClick: toggle,
    },
    panelProps: { id: panelId },
  };
}

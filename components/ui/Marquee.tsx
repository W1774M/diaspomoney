'use client';

import { Pause, Play } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface MarqueeProps {
  /** Contenu à faire défiler (rendu une seconde fois, masqué, pour la boucle). */
  children: ReactNode;
  /** Nom accessible de la zone. */
  label: string;
  className?: string;
  trackClassName?: string;
  /** Classes du bouton pause/lecture (position, couleurs). */
  controlClassName?: string;
}

/**
 * Défilement continu respectueux de l'accessibilité :
 * - l'animation n'existe que si l'utilisateur n'a pas demandé à réduire les animations ;
 * - sinon la zone devient une simple bande défilable sans copie du contenu ;
 * - bouton pause visible (WCAG 2.2.2), pause aussi au survol et au focus clavier ;
 * - la copie servant à la boucle est inerte et masquée des lecteurs d'écran.
 */
export function Marquee({
  children,
  label,
  className = '',
  trackClassName = '',
  controlClassName = '',
}: MarqueeProps) {
  const [paused, setPaused] = useState(false);

  return (
    <div
      className={`marquee relative ${className}`}
      role="region"
      aria-label={label}
      data-paused={paused ? '' : undefined}
    >
      <div className={`marquee-track ${trackClassName}`}>
        <div className="marquee-set">{children}</div>
        {/* inert posé par ref : React 18 ignore la prop booléenne `inert`. */}
        <div
          className="marquee-set"
          data-marquee-clone
          aria-hidden="true"
          ref={(element) => element?.setAttribute('inert', '')}
        >
          {children}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        className={`marquee-control ${controlClassName}`}
        aria-label={paused ? 'Reprendre le défilement' : 'Mettre en pause le défilement'}
      >
        {paused ? (
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Pause className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export default Marquee;

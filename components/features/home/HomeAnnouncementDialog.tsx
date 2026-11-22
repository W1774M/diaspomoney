'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { NativeModal } from '@/components/ui/NativeModal';
import { isExternalHref, type HomeAnnouncement } from '@/lib/home-content';
import { getHomeDialogDelay } from '@/lib/home-dialog-schedule';
import { OPEN_HOME_ANNOUNCEMENT_EVENT } from './HomeAnnouncementBannerButton';

const STORAGE_KEY = 'diaspomoney.homeDialog.lastShownAt';
const VERSION_KEY = 'diaspomoney.homeDialog.version';

/** Date de dernière fermeture, remise à zéro si l'annonce a changé depuis. */
function readLastShownAt(version: string): number | null {
  if (window.localStorage.getItem(VERSION_KEY) !== version) {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
}

function AnnouncementLink({
  href,
  onClick,
  className,
  children,
  ...rest
}: {
  href: string;
  onClick?: () => void;
  className: string;
  children: React.ReactNode;
  'aria-label'?: string;
  autoFocus?: boolean;
}) {
  const handlers = onClick ? { onClick } : {};
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...handlers} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} {...handlers} {...rest}>
      {children}
    </Link>
  );
}

/** Contenu de la fenêtre (réutilisé pour l'aperçu dans l'admin). */
export function AnnouncementContent({
  announcement,
  onClose,
  titleId = 'home-announcement-dialog-title',
}: {
  announcement: Pick<
    HomeAnnouncement,
    'title' | 'message' | 'imageUrl' | 'imageAlt' | 'href' | 'ctaLabel'
  >;
  onClose?: () => void;
  titleId?: string;
}) {
  const { title, message, imageUrl, imageAlt, href, ctaLabel } = announcement;

  const image = imageUrl ? (
    <Image
      src={imageUrl}
      alt={imageAlt}
      width={800}
      height={800}
      className="h-auto w-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.02]"
      // Image révélée après un délai : elle ne doit pas concurrencer l'image principale (LCP).
      fetchPriority="low"
      unoptimized
    />
  ) : null;

  return (
    <>
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-brand-500/10 p-2">
            <Bell className="h-5 w-5 text-brand-700" aria-hidden="true" />
          </div>
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 transition-colors hover:text-gray-600"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="space-y-5 p-6">
        {image ? (
          href ? (
            <AnnouncementLink
              href={href}
              {...(onClose ? { onClick: onClose } : {})}
              className="group block overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
              aria-label={`${imageAlt} - ouvrir le lien associé`}
              autoFocus={!ctaLabel}
            >
              {image}
            </AnnouncementLink>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">{image}</div>
          )
        ) : null}

        {message ? <p className="whitespace-pre-line text-gray-700">{message}</p> : null}

        {ctaLabel && href ? (
          <AnnouncementLink
            href={href}
            {...(onClose ? { onClick: onClose } : {})}
            className="flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700"
            autoFocus
          >
            {ctaLabel}
          </AnnouncementLink>
        ) : null}
      </div>
    </>
  );
}

export default function HomeAnnouncementDialog({
  announcement,
}: {
  /** Annonce en cours de diffusion, `null` si aucune. */
  announcement: HomeAnnouncement | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastClosedAt, setLastClosedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!announcement) {
      return;
    }

    const handleOpen = () => setIsOpen(true);

    window.addEventListener(OPEN_HOME_ANNOUNCEMENT_EVENT, handleOpen);

    return () => {
      window.removeEventListener(OPEN_HOME_ANNOUNCEMENT_EVENT, handleOpen);
    };
  }, [announcement]);

  useEffect(() => {
    if (!announcement) {
      return;
    }

    const intervalMs = announcement.frequencyHours * 60 * 60 * 1000;
    // « À chaque visite » : une fois fermée, on ne la rouvre pas pendant cette visite.
    if (intervalMs === 0 && lastClosedAt !== null) {
      return;
    }
    const delay = getHomeDialogDelay(readLastShownAt(announcement.version), Date.now(), intervalMs);

    if (delay === 0) {
      setIsOpen(true);
      return;
    }

    const timeoutId = window.setTimeout(() => setIsOpen(true), delay);

    return () => window.clearTimeout(timeoutId);
  }, [announcement, lastClosedAt]);

  const handleClose = useCallback(() => {
    const now = Date.now();

    window.localStorage.setItem(STORAGE_KEY, String(now));
    if (announcement) {
      window.localStorage.setItem(VERSION_KEY, announcement.version);
    }
    setLastClosedAt(now);
    setIsOpen(false);
  }, [announcement]);

  if (!announcement) {
    return null;
  }

  return (
    <NativeModal
      open={isOpen}
      onClose={handleClose}
      labelledBy="home-announcement-dialog-title"
      className="max-w-md rounded-2xl"
    >
      <AnnouncementContent announcement={announcement} onClose={handleClose} />
    </NativeModal>
  );
}

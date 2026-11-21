'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { NativeModal } from '@/components/ui/NativeModal';
import { getHomeDialogDelay } from '@/lib/home-dialog-schedule';

const STORAGE_KEY = 'diaspomoney.homeDialog.lastShownAt';

const enabled = process.env['NEXT_PUBLIC_HOME_DIALOG_ENABLED'] === 'true';
const title = 'Offre spéciale de 2 euros';
const imageSrc = '/api/home-dialog-ad';
const imageHref = '/services/health';
const imageAlt = 'Offre DiaspoMoney à 2 euros';

function readLastShownAt(): number | null {
  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
}

export default function HomeAnnouncementDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastClosedAt, setLastClosedAt] = useState<number | null>(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);

    window.addEventListener('diaspomoney:open-home-announcement', handleOpen);

    return () => {
      window.removeEventListener('diaspomoney:open-home-announcement', handleOpen);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const delay = getHomeDialogDelay(readLastShownAt(), Date.now());

    if (delay === 0) {
      setIsOpen(true);
      return;
    }

    const timeoutId = window.setTimeout(() => setIsOpen(true), delay);

    return () => window.clearTimeout(timeoutId);
  }, [lastClosedAt]);

  const handleClose = useCallback(() => {
    const now = Date.now();

    window.localStorage.setItem(STORAGE_KEY, String(now));
    setLastClosedAt(now);
    setIsOpen(false);
  }, []);

  return (
    <NativeModal
      open={isOpen}
      onClose={handleClose}
      labelledBy="home-announcement-dialog-title"
      className="max-w-md rounded-2xl"
    >
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[#F97015]/10 p-2">
            <Bell className="h-5 w-5 text-[#F97015]" aria-hidden="true" />
          </div>
          <h2 id="home-announcement-dialog-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-5 p-6">
        <Link
          href={imageHref}
          onClick={handleClose}
          className="group block overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
          aria-label={`${imageAlt} - ouvrir le service associé`}
          autoFocus
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={800}
            height={800}
            className="h-auto w-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.02]"
            // Image révélée après un délai : elle ne doit pas concurrencer l'image principale (LCP).
            fetchPriority="low"
            unoptimized
          />
        </Link>
      </div>
    </NativeModal>
  );
}

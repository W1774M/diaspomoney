'use client';

import { AuthorizedRoute } from '@/components/auth';
import { ROLES } from '@/lib/constants';
import { ExternalLink, Megaphone } from 'lucide-react';
import { useState } from 'react';
import { AnnouncementsPanel } from './_components/AnnouncementsPanel';
import { BannerMessagesPanel } from './_components/BannerMessagesPanel';

const TABS = [
  { key: 'banner', label: 'Bandeau défilant' },
  { key: 'announcement', label: 'Annonce d’accueil' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function HomeContentPageContent() {
  const [tab, setTab] = useState<TabKey>('banner');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            <Megaphone className="h-7 w-7 text-brand-700" aria-hidden />
            Contenu de la page d’accueil
          </h1>
          <p className="mt-2 text-gray-600">
            Les modifications sont visibles sur la page d’accueil sous une minute.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-800 hover:underline"
        >
          Voir la page d’accueil
          <ExternalLink className="h-4 w-4" aria-hidden />
          <span className="sr-only">(nouvel onglet)</span>
        </a>
      </div>

      <div role="tablist" aria-label="Contenu à gérer" className="flex gap-2 border-b border-gray-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`panel-${key}`}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              tab === key
                ? 'border-brand-600 text-brand-800'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'banner' ? <BannerMessagesPanel /> : <AnnouncementsPanel />}
      </div>
    </div>
  );
}

export default function HomeContentPage() {
  return (
    <AuthorizedRoute roles={[ROLES.ADMIN, ROLES.SUPERADMIN]} redirectTo="/dashboard">
      <HomeContentPageContent />
    </AuthorizedRoute>
  );
}

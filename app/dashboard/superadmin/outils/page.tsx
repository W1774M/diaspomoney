'use client';

import { SuperAdminRoute } from '@/components/auth';
import {
  ADMIN_TOOL_CATEGORY_LABELS,
  type AdminToolCategory,
  type AdminToolLink,
} from '@/lib/admin-tools';
import { ExternalLink, KeyRound, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

const CATEGORY_ORDER: AdminToolCategory[] = ['infra', 'monitoring', 'services', 'code'];

function ToolCard({ tool }: { tool: AdminToolLink }) {
  const external = tool.url?.startsWith('http');
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-gray-900">{tool.name}</p>
        {tool.url && <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />}
      </div>
      <p className="mt-1 text-sm text-gray-600">{tool.description}</p>
      {tool.url ? (
        <p className="mt-2 truncate font-mono text-xs text-gray-500">{tool.url}</p>
      ) : (
        <p className="mt-2 text-xs text-yellow-800">
          Non configuré : renseigner <span className="font-mono">{tool.envVar}</span> dans le .env serveur.
        </p>
      )}
      {tool.credentialsHint && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500">
          <KeyRound className="h-3.5 w-3.5" aria-hidden />
          {tool.credentialsHint}
        </p>
      )}
    </>
  );

  const cls = 'block rounded-lg border border-gray-200 bg-white p-4 shadow-sm';
  if (!tool.url) return <div className={`${cls} opacity-75`}>{body}</div>;
  return (
    <a
      href={tool.url}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      className={`${cls} transition hover:border-brand-600 hover:shadow focus-visible:ring-2 focus-visible:ring-brand-600`}
    >
      {body}
    </a>
  );
}

function OutilsContent() {
  const [tools, setTools] = useState<AdminToolLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/tools', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error?.message || data?.error || `Erreur ${res.status}`);
        setTools(data.tools as AdminToolLink[]);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          <Wrench className="h-7 w-7 text-brand-700" aria-hidden />
          Outils & accès
        </h1>
        <p className="mt-2 text-gray-600">
          Raccourcis vers la base de données, l’infrastructure et les services utilisés par la
          plateforme. Chaque outil garde sa propre authentification.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}
      {!tools && !error && <p className="text-sm text-gray-600">Chargement…</p>}

      {tools &&
        CATEGORY_ORDER.map((category) => {
          const items = tools.filter((t) => t.category === category);
          if (!items.length) return null;
          return (
            <section key={category} aria-labelledby={`tools-${category}`}>
              <h2 id={`tools-${category}`} className="mb-3 text-lg font-semibold text-gray-900">
                {ADMIN_TOOL_CATEGORY_LABELS[category]}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((tool) => (
                  <ToolCard key={tool.key} tool={tool} />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}

export default function SuperAdminOutilsPage() {
  return (
    <SuperAdminRoute redirectTo="/dashboard">
      <OutilsContent />
    </SuperAdminRoute>
  );
}

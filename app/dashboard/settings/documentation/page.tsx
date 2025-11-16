'use client';

import { useAuth } from '@/hooks';
import {
  Book,
  ChevronRight,
  ExternalLink,
  FileText,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  articles: DocArticle[];
}

interface DocArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
}

const documentation: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Premiers pas',
    description: 'Découvrez comment commencer à utiliser Diaspomoney',
    icon: <Book className='h-6 w-6' />,
    articles: [
      {
        id: 'doc-1',
        title: 'Guide de démarrage rapide',
        description: 'Tout ce que vous devez savoir pour commencer',
        url: '#',
        category: 'Débutant',
      },
      {
        id: 'doc-2',
        title: 'Créer votre compte',
        description: 'Étapes pour créer et configurer votre compte',
        url: '#',
        category: 'Compte',
      },
      {
        id: 'doc-3',
        title: 'Navigation dans le dashboard',
        description: 'Apprenez à naviguer efficacement dans votre espace',
        url: '#',
        category: 'Interface',
      },
    ],
  },
  {
    id: 'features',
    title: 'Fonctionnalités',
    description: 'Explorez toutes les fonctionnalités disponibles',
    icon: <FileText className='h-6 w-6' />,
    articles: [
      {
        id: 'doc-4',
        title: 'Gestion des rendez-vous',
        description: 'Comment prendre, modifier et annuler des rendez-vous',
        url: '#',
        category: 'Réservation',
      },
      {
        id: 'doc-5',
        title: 'Gestion des bénéficiaires',
        description: 'Ajouter et gérer vos bénéficiaires',
        url: '#',
        category: 'Gestion',
      },
      {
        id: 'doc-6',
        title: 'Facturation et paiements',
        description: 'Comprendre le système de facturation',
        url: '#',
        category: 'Facturation',
      },
      {
        id: 'doc-7',
        title: 'Disponibilités (Prestataires)',
        description: 'Configurer vos créneaux disponibles',
        url: '#',
        category: 'Prestataire',
      },
    ],
  },
  {
    id: 'api',
    title: 'API et intégrations',
    description: 'Documentation technique pour les développeurs',
    icon: <ExternalLink className='h-6 w-6' />,
    articles: [
      {
        id: 'doc-8',
        title: "Introduction à l'API",
        description: "Vue d'ensemble de l'API Diaspomoney",
        url: '#',
        category: 'API',
      },
      {
        id: 'doc-9',
        title: 'Authentification',
        description: "Comment s'authentifier avec l'API",
        url: '#',
        category: 'API',
      },
      {
        id: 'doc-10',
        title: 'Endpoints disponibles',
        description: 'Liste complète des endpoints API',
        url: '#',
        category: 'API',
      },
    ],
  },
];

export default function DocumentationPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['getting-started'])
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const filteredDocs = documentation.map(section => ({
    ...section,
    articles: section.articles.filter(
      article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900 flex items-center'>
          <Book className='h-8 w-8 mr-3 text-[hsl(25,100%,53%)]' />
          Documentation
        </h1>
        <p className='text-gray-600 mt-2'>
          Guide complet pour utiliser toutes les fonctionnalités de Diaspomoney
        </p>
      </div>

      {/* Search */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
          <input
            type='text'
            placeholder='Rechercher dans la documentation...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
          />
        </div>
      </div>

      {/* Documentation Sections */}
      <div className='space-y-4'>
        {filteredDocs.map(section => (
          <div
            key={section.id}
            className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'
          >
            <button
              onClick={() => toggleSection(section.id)}
              className='w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors'
            >
              <div className='flex items-center space-x-3'>
                <div className='text-[hsl(25,100%,53%)]'>{section.icon}</div>
                <div className='text-left'>
                  <h2 className='text-lg font-semibold text-gray-900'>
                    {section.title}
                  </h2>
                  <p className='text-sm text-gray-600'>{section.description}</p>
                </div>
              </div>
              <ChevronRight
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  expandedSections.has(section.id) ? 'rotate-90' : ''
                }`}
              />
            </button>

            {expandedSections.has(section.id) && (
              <div className='border-t border-gray-200 bg-gray-50'>
                {section.articles.length === 0 ? (
                  <div className='px-6 py-8 text-center text-gray-500'>
                    Aucun article trouvé
                  </div>
                ) : (
                  <div className='p-4 space-y-2'>
                    {section.articles.map(article => (
                      <a
                        key={article.id}
                        href={article.url}
                        className='block p-4 bg-white rounded-md border border-gray-200 hover:border-[hsl(25,100%,53%)] hover:shadow-sm transition-all group'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center space-x-2 mb-1'>
                              <h3 className='text-base font-semibold text-gray-900 group-hover:text-[hsl(25,100%,53%)] transition-colors'>
                                {article.title}
                              </h3>
                              <span className='text-xs font-medium text-[hsl(25,100%,53%)] bg-[hsl(25,100%,53%)]/10 px-2 py-0.5 rounded'>
                                {article.category}
                              </span>
                            </div>
                            <p className='text-sm text-gray-600'>
                              {article.description}
                            </p>
                          </div>
                          <ExternalLink className='h-5 w-5 text-gray-400 group-hover:text-[hsl(25,100%,53%)] transition-colors ml-4 flex-shrink-0' />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-[hsl(25,100%,53%)]/10 border border-[hsl(25,100%,53%)]/20 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Tutoriels vidéo
          </h3>
          <p className='text-gray-600 mb-4'>
            Apprenez visuellement avec nos tutoriels vidéo étape par étape
          </p>
          <a
            href='/dashboard/settings/tutorials'
            className='inline-flex items-center text-[hsl(25,100%,53%)] hover:underline font-medium'
          >
            Voir les tutoriels
            <ChevronRight className='h-4 w-4 ml-1' />
          </a>
        </div>

        <div className='bg-[hsl(25,100%,53%)]/10 border border-[hsl(25,100%,53%)]/20 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Besoin d'aide ?
          </h3>
          <p className='text-gray-600 mb-4'>
            Contactez notre équipe de support pour une assistance personnalisée
          </p>
          <a
            href='/dashboard/settings/support'
            className='inline-flex items-center text-[hsl(25,100%,53%)] hover:underline font-medium'
          >
            Contacter le support
            <ChevronRight className='h-4 w-4 ml-1' />
          </a>
        </div>
      </div>
    </div>
  );
}

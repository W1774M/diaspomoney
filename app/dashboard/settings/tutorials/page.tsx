'use client';

import { useAuth } from '@/hooks';
import { BookOpen, Clock, Play, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  thumbnail: string;
  videoUrl: string;
}

const tutorials: Tutorial[] = [
  {
    id: 'tutorial-1',
    title: 'Bienvenue sur Diaspomoney',
    description:
      'Découvrez les fonctionnalités principales de la plateforme et comment naviguer dans votre dashboard.',
    duration: '5:30',
    category: 'Débutant',
    thumbnail: '/img/tutorials/welcome.jpg',
    videoUrl: '#',
  },
  {
    id: 'tutorial-2',
    title: 'Comment prendre un rendez-vous',
    description:
      'Apprenez à réserver un service pour vous ou vos bénéficiaires en quelques clics.',
    duration: '3:15',
    category: 'Réservation',
    thumbnail: '/img/tutorials/booking.jpg',
    videoUrl: '#',
  },
  {
    id: 'tutorial-3',
    title: 'Gérer vos disponibilités (Prestataires)',
    description:
      'Configurez vos créneaux disponibles et gérez votre calendrier efficacement.',
    duration: '4:20',
    category: 'Prestataire',
    thumbnail: '/img/tutorials/availability.jpg',
    videoUrl: '#',
  },
  {
    id: 'tutorial-4',
    title: 'Gérer vos bénéficiaires',
    description:
      'Ajoutez, modifiez et gérez les informations de vos bénéficiaires.',
    duration: '2:45',
    category: 'Gestion',
    thumbnail: '/img/tutorials/beneficiaries.jpg',
    videoUrl: '#',
  },
  {
    id: 'tutorial-5',
    title: 'Comprendre la facturation',
    description:
      'Découvrez comment consulter vos factures, devis et bons de paiement.',
    duration: '3:50',
    category: 'Facturation',
    thumbnail: '/img/tutorials/billing.jpg',
    videoUrl: '#',
  },
  {
    id: 'tutorial-6',
    title: 'Paramètres et configuration',
    description:
      'Personnalisez votre compte, configurez vos notifications et préférences.',
    duration: '4:10',
    category: 'Configuration',
    thumbnail: '/img/tutorials/settings.jpg',
    videoUrl: '#',
  },
];

export default function TutorialsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  const categories = Array.from(new Set(tutorials.map(t => t.category)));

  const filteredTutorials = tutorials.filter(
    tutorial => !selectedCategory || tutorial.category === selectedCategory,
  );

  const handlePlay = (tutorial: Tutorial) => {
    // Ici, vous pouvez ouvrir une modal vidéo ou rediriger vers la page de lecture
    console.log('Lecture du tutoriel:', tutorial.title);
    // window.open(tutorial.videoUrl, '_blank');
  };

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
          <Video className='h-8 w-8 mr-3 text-[hsl(25,100%,53%)]' />
          Tutoriels vidéo
        </h1>
        <p className='text-gray-600 mt-2'>
          Apprenez à utiliser toutes les fonctionnalités de Diaspomoney grâce à
          nos tutoriels vidéo
        </p>
      </div>

      {/* Filters */}
      <div className='flex flex-wrap gap-2'>
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-[hsl(25,100%,53%)] text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Tous les tutoriels
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-[hsl(25,100%,53%)] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Tutorials Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredTutorials.map(tutorial => (
          <div
            key={tutorial.id}
            className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow'
          >
            {/* Thumbnail */}
            <div className='relative aspect-video bg-gray-200'>
              <div className='absolute inset-0 flex items-center justify-center bg-gray-300'>
                <Video className='h-16 w-16 text-gray-400' />
              </div>
              <button
                onClick={() => handlePlay(tutorial)}
                aria-label={`Lire le tutoriel: ${tutorial.title}`}
                className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-opacity group'
              >
                <div className='bg-white rounded-full p-4 group-hover:scale-110 transition-transform'>
                  <Play className='h-8 w-8 text-[hsl(25,100%,53%)] ml-1' />
                </div>
              </button>
              <div className='absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center'>
                <Clock className='h-3 w-3 mr-1' />
                {tutorial.duration}
              </div>
            </div>

            {/* Content */}
            <div className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-xs font-medium text-[hsl(25,100%,53%)] bg-[hsl(25,100%,53%)]/10 px-2 py-1 rounded'>
                  {tutorial.category}
                </span>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                {tutorial.title}
              </h3>
              <p className='text-sm text-gray-600 line-clamp-2'>
                {tutorial.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTutorials.length === 0 && (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center'>
          <Video className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Aucun tutoriel trouvé
          </h3>
          <p className='text-gray-600'>
            Essayez de sélectionner une autre catégorie
          </p>
        </div>
      )}

      {/* Documentation Link */}
      <div className='bg-[hsl(25,100%,53%)]/10 border border-[hsl(25,100%,53%)]/20 rounded-lg p-6'>
        <div className='flex items-start'>
          <BookOpen className='h-6 w-6 text-[hsl(25,100%,53%)] mr-3 mt-1' />
          <div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Besoin de plus d'informations ?
            </h3>
            <p className='text-gray-600 mb-4'>
              Consultez notre documentation complète pour des guides détaillés
              et des exemples pratiques.
            </p>
            <a
              href='/dashboard/settings/documentation'
              className='inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-md hover:bg-[hsl(25,100%,48%)] transition-colors'
            >
              Voir la documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

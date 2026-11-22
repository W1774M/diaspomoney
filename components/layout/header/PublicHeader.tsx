'use client';

import Logo from '@/components/ui/Logo';
import { useAuth } from '@/hooks/auth/useAuth';
import { logger } from '@/lib/logger';
import { Menu, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PublicHeader() {
  const { user, signOut, isAuthenticated: _isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  const handleSignOut = () => {
    setIsUserMenuOpen(false);
    signOut();
  };

  // Forcer la mise à jour du composant quand l'état d'authentification change
  useEffect(() => {
    logger.debug({ _isAuthenticated, user }, 'PublicHeader useEffect');
    setForceUpdate(prev => prev + 1);
  }, [_isAuthenticated, user]);

  return (
    <header
      key={forceUpdate}
      className='bg-black shadow-sm border-b border-gray-800'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link href='/' className='flex-shrink-0 flex items-center space-x-2'>
              <Logo
                loading='eager'
                src='/img/diaspo/Logo_Diaspo_Horizontal_enrichi.webp'
                width={640}
                height={320}
                alt='Diaspomoney'
                className='h-20 w-auto'
              />
            </Link>
          </div>

          {/* Navigation centrale - masquée en mobile */}
          <nav className='hidden md:flex items-center space-x-8'>
            <Link
              href='/#how-it-works'
              className='text-white hover:text-[hsl(25,100%,53%)] transition-colors text-sm font-medium'
            >
              Comment ça marche
            </Link>
            <Link
              href='/#services'
              className='text-white hover:text-[hsl(25,100%,53%)] transition-colors text-sm font-medium'
            >
              Nos services
            </Link>
            <Link
              href='/#testimonials'
              className='text-white hover:text-[hsl(25,100%,53%)] transition-colors text-sm font-medium'
            >
              Témoignages
            </Link>
            <Link
              href='/#partners'
              className='text-white hover:text-[hsl(25,100%,53%)] transition-colors text-sm font-medium'
            >
              Partenaires
            </Link>
          </nav>

          {/* Actions côté droit */}
          <div className='flex items-center space-x-4'>
            {/* Menu utilisateur (si connecté) - masqué en mobile */}
            {user ? (
              <div className='hidden md:block relative'>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className='flex items-center space-x-3 p-2 rounded-md hover:bg-gray-800 transition-colors'
                >
                  <div className='w-8 h-8 bg-[hsl(25,100%,53%)] rounded-full flex items-center justify-center'>
                    <User className='h-4 w-4 text-white' />
                  </div>
                  <span className='text-sm font-medium text-white'>
                    {user?.name || 'Utilisateur'}
                  </span>
                </button>

                {/* Dropdown menu */}
                {isUserMenuOpen && (
                  <div className='absolute right-0 mt-2 w-48 bg-gray-900 rounded-md shadow-lg py-1 z-50 border border-gray-800'>
                    <Link
                      href='/dashboard'
                      className='block px-4 py-2 text-sm text-white hover:bg-gray-800 hover:text-[hsl(25,100%,53%)]'
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href='/dashboard/settings'
                      className='block px-4 py-2 text-sm text-white hover:bg-gray-800 hover:text-[hsl(25,100%,53%)]'
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Paramètres
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className='block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 hover:text-[hsl(25,100%,53%)]'
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Lien "Se connecter" - masqué en mobile */}
                <Link
                  href='/login'
                  className='hidden md:inline-flex items-center text-sm font-medium text-white hover:text-[hsl(25,100%,53%)] transition-colors'
                >
                  Se connecter
                </Link>
                {/* Bouton "Commencer" - masqué en mobile */}
                <Link
                  href='/#services'
                  className='hidden md:inline-flex items-center px-6 py-2.5 text-sm font-medium text-white rounded-full bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(25,100%,48%)] hover:from-[hsl(25,100%,50%)] hover:to-[hsl(25,100%,45%)] transition-all shadow-lg hover:shadow-xl'
                >
                  Commencer
                </Link>
              </>
            )}

            {/* Menu mobile */}
            <button
              aria-label={isMenuOpen ? 'Fermer le menu mobile' : 'Ouvrir le menu mobile'}
              title={isMenuOpen ? 'Fermer le menu mobile' : 'Ouvrir le menu mobile'}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='md:hidden p-2 text-white hover:text-[hsl(25,100%,53%)] transition-colors'
            >
              <Menu className='h-5 w-5' />
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className='md:hidden'>
            <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-800 bg-gray-900'>
              {/* Accueil */}
              <Link
                href='/'
                className='block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-800'
                onClick={() => setIsMenuOpen(false)}
              >
                Accueil
              </Link>
              
              {/* Comment ça marche */}
              <Link
                href='/#how-it-works'
                className='block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-800'
                onClick={() => setIsMenuOpen(false)}
              >
                Comment ça marche
              </Link>
              
              {/* Nos services */}
              <Link
                href='/#services'
                className='block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-800'
                onClick={() => setIsMenuOpen(false)}
              >
                Nos services
              </Link>
              
              {/* Témoignages */}
              <Link
                href='/#testimonials'
                className='block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-800'
                onClick={() => setIsMenuOpen(false)}
              >
                Témoignages
              </Link>
              
              {/* Partenaires */}
              <Link
                href='/#partners'
                className='block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-800'
                onClick={() => setIsMenuOpen(false)}
              >
                Partenaires
              </Link>
              
              {/* Dashboard - seulement si connecté */}
              {user && (
                <Link
                  href='/dashboard'
                  className='block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-800'
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              
              {/* Se connecter - seulement si NON connecté */}
              {!user && (
                <>
                  <Link
                    href='/login'
                    className='block px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-800'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Se connecter
                  </Link>
                  <Link
                    href='/#services'
                    className='block px-3 py-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(25,100%,48%)] hover:from-[hsl(25,100%,50%)] hover:to-[hsl(25,100%,45%)] transition-all'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Commencer
                  </Link>
                </>
              )}
              
              {/* Se déconnecter - seulement si connecté */}
              {user && (
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className='block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:text-[hsl(25,100%,53%)] hover:bg-gray-800'
                >
                  Se déconnecter
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

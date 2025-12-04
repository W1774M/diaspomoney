/**
 * Page d'inscription
 * Design professionnel optimisé pour l'UX
 */

'use client';

import {
  FacebookLoginButton,
  GoogleLoginButton,
} from '@/components/features/auth';
import { RegisterForm } from '@/components/features/auth/RegisterForm';
import { getAssetURL } from '@/config/cdn';
import { CheckCircle, Shield } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

export default function RegisterPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50'>
      <div className='flex flex-col lg:flex-row min-h-screen'>
        {/* Sidebar réduite - 40% au lieu de 50% */}
        <div className='hidden lg:flex lg:w-2/5 bg-gradient-to-br from-[hsl(25,100%,53%)] via-[hsl(25,100%,45%)] to-[hsl(25,100%,35%)] relative overflow-hidden'>
          {/* Pattern de fond simplifié */}
          <div className='absolute inset-0 bg-black/10'></div>
          <div className='absolute top-0 left-0 w-full h-full'>
            <div className='absolute top-20 right-10 w-32 h-32 bg-white/5 rounded-full animate-pulse'></div>
            <div className='absolute bottom-20 left-10 w-24 h-24 bg-white/5 rounded-full animate-pulse delay-300'></div>
          </div>

          <div className='relative z-10 flex flex-col justify-center px-6 xl:px-8 py-12 w-full'>
            <div className='mb-6'>
              <div className='bg-white/20 backdrop-blur-sm rounded-xl p-3 inline-block mb-4'>
                <Image
                  src='/img/diaspo/Logo_Diaspo_Horizontal_enrichi.webp'
                  alt='DiaspoMoney'
                  width={150}
                  height={45}
                  className='brightness-0 invert'
                  priority
                  loader={({ src, width, quality }) =>
                    getAssetURL(src, { width, quality: quality ?? 85 })
                  }
                />
              </div>
              <h1 className='text-2xl xl:text-3xl font-bold text-white mb-3 leading-tight'>
                Rejoignez DiaspoMoney
              </h1>
              <p className='text-orange-100 text-sm xl:text-base leading-relaxed'>
                Créez votre compte en quelques secondes et commencez à envoyer
                des services à vos proches en Afrique.
              </p>
            </div>

            {/* Features simplifiées - seulement 2 */}
            <div className='space-y-3 max-w-sm'>
              <div className='flex items-start space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3'>
                <div className='flex-shrink-0 w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center'>
                  <CheckCircle className='w-4 h-4 text-white' />
                </div>
                <div>
                  <h3 className='text-white font-semibold text-sm'>
                    Inscription Rapide
                  </h3>
                  <p className='text-orange-100 text-xs'>
                    Moins d'une minute
                  </p>
                </div>
              </div>

              <div className='flex items-start space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3'>
                <div className='flex-shrink-0 w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center'>
                  <Shield className='w-4 h-4 text-white' />
                </div>
                <div>
                  <h3 className='text-white font-semibold text-sm'>
                    Paiements Sécurisés
                  </h3>
                  <p className='text-orange-100 text-xs'>
                    Cryptage SSL
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire d'inscription - 60% avec plus d'espace */}
        <div className='flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12 xl:px-16'>
          <div className='w-full max-w-lg'>
            {/* Header mobile */}
            <div className='lg:hidden text-center mb-8'>
              <div className='inline-block bg-gradient-to-br from-[hsl(25,100%,53%)] to-[hsl(25,100%,45%)] rounded-2xl p-3 mb-4 shadow-lg'>
                <Image
                  src='/img/diaspo/Logo_Diaspo_Horizontal_enrichi.webp'
                  alt='DiaspoMoney'
                  width={140}
                  height={42}
                  className='brightness-0 invert'
                  priority
                  loader={({ src, width, quality }) =>
                    getAssetURL(src, { width, quality: quality ?? 85 })
                  }
                />
              </div>
              <h1 className='text-xl font-bold text-gray-900 mb-2'>
                Rejoignez DiaspoMoney
              </h1>
              <p className='text-gray-600 text-sm'>
                Créez votre compte en quelques secondes
              </p>
            </div>

            <div className='bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10'>
              <div className='text-center mb-8'>
                <div className='inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(25,100%,45%)] rounded-full mb-3 shadow-lg'>
                  <CheckCircle className='w-6 h-6 text-white' />
                </div>
                <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                  Créer un compte
                </h2>
                <p className='text-gray-600 text-sm'>
                  Commencez votre parcours avec nous
                </p>
              </div>

              {/* Formulaire d'inscription */}
              <Suspense fallback={<div>Chargement...</div>}>
                <RegisterForm />
              </Suspense>

              {/* Séparateur */}
              <div className='mt-8 mb-6'>
                <div className='relative'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-gray-200' />
                  </div>
                  <div className='relative flex justify-center text-xs sm:text-sm'>
                    <span className='px-3 bg-white text-gray-500 font-medium'>
                      Ou continuer avec
                    </span>
                  </div>
                </div>
              </div>

              {/* Boutons OAuth */}
              <div className='space-y-3'>
                <GoogleLoginButton />
                <FacebookLoginButton />
              </div>

              {/* Liens utiles */}
              <div className='mt-8 pt-6 border-t border-gray-100'>
                <div className='flex flex-wrap justify-center gap-4 text-xs sm:text-sm'>
                  <Link
                    href='/hotline'
                    className='text-gray-500 hover:text-[hsl(25,100%,53%)] transition-colors duration-200 font-medium'
                  >
                    Aide
                  </Link>
                  <Link
                    href='/support'
                    className='text-gray-500 hover:text-[hsl(25,100%,53%)] transition-colors duration-200 font-medium'
                  >
                    Support
                  </Link>
                  <Link
                    href='/privacy'
                    className='text-gray-500 hover:text-[hsl(25,100%,53%)] transition-colors duration-200 font-medium'
                  >
                    Confidentialité
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

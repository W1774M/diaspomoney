'use client';

import { AlertCircle, Lock } from 'lucide-react';
import React from 'react';

interface AccessRestrictedProps {
  title?: string;
  message?: string;
  requiredRole?: string;
  currentRole?: string;
}

const AccessRestricted = React.memo<AccessRestrictedProps>(
  function AccessRestricted({
    title = 'Accès restreint',
    message = "Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.",
    requiredRole,
    currentRole,
  }) {
    return (
      <div className='min-h-[400px] flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4'>
            <Lock className='h-8 w-8 text-red-600' />
          </div>

          <h2 className='text-xl font-semibold text-gray-900 mb-2'>{title}</h2>

          <p className='text-gray-600 mb-4'>{message}</p>

          {requiredRole && currentRole && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
              <div className='flex items-start'>
                <AlertCircle className='h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0' />
                <div className='text-sm'>
                  <p className='text-yellow-800'>
                    <strong>Rôle requis :</strong> {requiredRole}
                  </p>
                  <p className='text-yellow-700 mt-1'>
                    <strong>Votre rôle :</strong> {currentRole}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className='mt-6'>
            <button
              onClick={() => window.history.back()}
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,48%)] transition-colors'
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }
);

AccessRestricted.displayName = 'AccessRestricted';

export default AccessRestricted;

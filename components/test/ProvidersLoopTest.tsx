'use client';

import { useProvidersOptimized } from '@/hooks/api/useProvidersOptimized';
import { useEffect, useState } from 'react';

interface CallLog {
  timestamp: number;
  callNumber: number;
  filters: any;
  result: {
    providersCount: number;
    hasResults: boolean;
    loading: boolean;
  };
}

export default function ProvidersLoopTest() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [testFilters, setTestFilters] = useState({
    category: '',
    city: '',
    specialty: '',
    service: '',
    minRating: 0,
  });

  const { providers, loading, error, hasResults, refetch } =
    useProvidersOptimized(testFilters);

  // Logger les appels
  useEffect(() => {
    const newLog: CallLog = {
      timestamp: Date.now(),
      callNumber: callLogs.length + 1,
      filters: { ...testFilters },
      result: {
        providersCount: providers.length,
        hasResults,
        loading,
      },
    };

    setCallLogs(prev => [...prev, newLog]);
  }, [providers, loading, hasResults, testFilters, callLogs.length]);

  // Détecter les appels trop fréquents
  useEffect(() => {
    if (callLogs.length > 3) {
      const recentLogs = callLogs.slice(-3);
      const intervals = recentLogs.map((log, index, arr) => {
        if (index === 0) return 0;
        // arr[index - 1] is always defined for index > 0 since recentLogs has length > 3
        return log.timestamp - (arr[index - 1]?.timestamp ?? log.timestamp);
      });

      // If intervals array is empty or contains only one entry, avoid dividing by zero
      const avgInterval =
        intervals.length > 1
          ? intervals.slice(1).reduce((sum, interval) => sum + interval, 0) /
            (intervals.length - 1)
          : 0;
      if (avgInterval < 500) {
        // Moins de 500ms entre les appels
        console.warn(
          '⚠️ ATTENTION: Appels trop fréquents détectés (possible boucle infinie)'
        );
        console.warn('Intervalles moyens:', avgInterval, 'ms');
      }
    }
  }, [callLogs]);

  const handleFilterChange = (key: string, value: any) => {
    setTestFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearLogs = () => {
    setCallLogs([]);
  };

  const testEmptyFilters = () => {
    setTestFilters({
      category: '',
      city: '',
      specialty: '',
      service: '',
      minRating: 0,
    });
  };

  const testWithFilters = () => {
    setTestFilters({
      category: 'HEALTH',
      city: 'Paris',
      specialty: 'Médecine',
      service: 'Consultation',
      minRating: 4,
    });
  };

  return (
    <div className='p-6 max-w-4xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>
        Test des Appels en Boucle - Providers
      </h1>

      {/* Contrôles de test */}
      <div className='mb-6 p-4 bg-gray-100 rounded-lg'>
        <h2 className='text-lg font-semibold mb-4'>Contrôles de Test</h2>
        <div className='flex flex-wrap gap-2 mb-4'>
          <button
            onClick={testEmptyFilters}
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Test Filtres Vides
          </button>
          <button
            onClick={testWithFilters}
            className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'
          >
            Test avec Filtres
          </button>
          <button
            onClick={refetch}
            className='px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600'
          >
            Refetch Manuel
          </button>
          <button
            onClick={clearLogs}
            className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
          >
            Effacer Logs
          </button>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label
              className='block text-sm font-medium mb-1'
              htmlFor='category'
            >
              Category:
            </label>
            <select
              id='category'
              title='Category'
              value={testFilters.category}
              onChange={e => handleFilterChange('category', e.target.value)}
              className='w-full p-2 border rounded'
            >
              <option value=''>Toutes</option>
              <option value='HEALTH'>Santé</option>
              <option value='EDU'>Éducation</option>
              <option value='IMMO'>Immobilier</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1' htmlFor='city'>
              Ville:
            </label>
            <input
              type='text'
              id='city'
              title='Ville'
              value={testFilters.city}
              onChange={e => handleFilterChange('city', e.target.value)}
              className='w-full p-2 border rounded'
              placeholder='Entrez une ville'
            />
          </div>
        </div>
      </div>

      {/* État actuel */}
      <div className='mb-6 p-4 bg-blue-50 rounded'>
        <h3 className='text-lg font-semibold mb-2'>État Actuel</h3>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <strong>Loading:</strong> {loading ? 'Oui' : 'Non'}
          </div>
          <div>
            <strong>Providers:</strong> {providers.length}
          </div>
          <div>
            <strong>Has Results:</strong> {hasResults ? 'Oui' : 'Non'}
          </div>
          <div>
            <strong>Error:</strong> {error || 'Aucune'}
          </div>
        </div>
      </div>

      {/* Logs des appels */}
      <div className='mb-6'>
        <h3 className='text-lg font-semibold mb-4'>
          Historique des Appels ({callLogs.length} appels)
        </h3>
        <div className='max-h-96 overflow-y-auto border rounded'>
          {callLogs.length === 0 ? (
            <p className='p-4 text-gray-500'>Aucun appel enregistré</p>
          ) : (
            <div className='space-y-2 p-4'>
              {callLogs
                .slice()
                .reverse()
                .map((log, index) => (
                  <div
                    key={log.timestamp}
                    className={`p-3 rounded text-sm ${
                      index < 3
                        ? 'bg-yellow-50 border-l-4 border-yellow-400'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className='flex justify-between items-start'>
                      <div>
                        <strong>Appel #{log.callNumber}</strong>
                        <span className='text-gray-500 ml-2'>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className='text-right'>
                        <div>Providers: {log.result.providersCount}</div>
                        <div>Loading: {log.result.loading ? 'Oui' : 'Non'}</div>
                      </div>
                    </div>
                    <div className='mt-2 text-xs text-gray-600'>
                      Filtres: {JSON.stringify(log.filters)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Analyse des patterns */}
      {callLogs.length > 5 && (
        <div className='p-4 bg-yellow-50 border border-yellow-200 rounded'>
          <h4 className='font-semibold text-yellow-800 mb-2'>
            Analyse des Patterns
          </h4>
          <div className='text-sm text-yellow-700'>
            {(() => {
              const recentLogs = callLogs.slice(-5);
              const intervals = recentLogs
                .map((log, index) => {
                  if (index === 0) return 0;
                  return (
                    log.timestamp -
                    (recentLogs[index - 1]?.timestamp ?? log.timestamp)
                  );
                })
                .filter(interval => interval > 0);

              const avgInterval =
                intervals.length > 0
                  ? intervals.reduce((sum, interval) => sum + interval, 0) /
                    intervals.length
                  : 0;

              if (avgInterval < 1000) {
                return (
                  <div className='text-red-600'>
                    ⚠️ <strong>ATTENTION:</strong> Appels très fréquents
                    détectés (moyenne: {Math.round(avgInterval)}ms). Possible
                    boucle infinie.
                  </div>
                );
              } else if (avgInterval < 2000) {
                return (
                  <div className='text-yellow-600'>
                    ⚠️ Appels fréquents (moyenne: {Math.round(avgInterval)}ms).
                    Surveiller le comportement.
                  </div>
                );
              } else {
                return (
                  <div className='text-green-600'>
                    ✅ Appels normaux (moyenne: {Math.round(avgInterval)}ms).
                    Aucun problème détecté.
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

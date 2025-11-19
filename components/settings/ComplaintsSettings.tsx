'use client';

import { AlertTriangle, FileText, Plus } from 'lucide-react';
import React, { useState } from 'react';

interface ComplaintsSettingsProps {
  data?: any;
  setData?: (data: any) => void;
  onSave?: () => void;
  saving?: boolean;
}

const ComplaintsSettings = React.memo<ComplaintsSettingsProps>(
  function ComplaintsSettings({ onSave, saving }) {
    const [newComplaint, setNewComplaint] = useState({
      subject: '',
      description: '',
      priority: 'medium',
    });

    const handleSubmitComplaint = (e: React.FormEvent) => {
      e.preventDefault();
      if (onSave) {
        onSave();
      }
      // Reset form
      setNewComplaint({
        subject: '',
        description: '',
        priority: 'medium',
      });
    };

    return (
      <div className='space-y-6'>
        <div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Mes réclamations
          </h3>
          <p className='text-sm text-gray-600'>
            Gérez vos réclamations et demandes de support.
          </p>
        </div>

        {/* Nouvelle réclamation */}
        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <div className='flex items-center mb-4'>
            <Plus className='h-5 w-5 text-[hsl(25,100%,53%)] mr-2' />
            <h4 className='text-md font-medium text-gray-900'>
              Nouvelle réclamation
            </h4>
          </div>

          <form onSubmit={handleSubmitComplaint} className='space-y-4'>
            <div>
              <label
                htmlFor='subject'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Sujet
              </label>
              <input
                type='text'
                id='subject'
                value={newComplaint.subject}
                onChange={e =>
                  setNewComplaint({ ...newComplaint, subject: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='Décrivez brièvement votre réclamation'
                required
              />
            </div>

            <div>
              <label
                htmlFor='priority'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Priorité
              </label>
              <select
                id='priority'
                value={newComplaint.priority}
                onChange={e =>
                  setNewComplaint({ ...newComplaint, priority: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              >
                <option value='low'>Faible</option>
                <option value='medium'>Moyenne</option>
                <option value='high'>Élevée</option>
                <option value='urgent'>Urgente</option>
              </select>
            </div>

            <div>
              <label
                htmlFor='description'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Description détaillée
              </label>
              <textarea
                id='description'
                value={newComplaint.description}
                onChange={e =>
                  setNewComplaint({
                    ...newComplaint,
                    description: e.target.value,
                  })
                }
                rows={4}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='Décrivez en détail votre réclamation...'
                required
              />
            </div>

            <div className='flex justify-end'>
              <button
                type='submit'
                disabled={saving}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,45%)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(25,100%,53%)] disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {saving ? 'Envoi...' : 'Envoyer la réclamation'}
              </button>
            </div>
          </form>
        </div>

        {/* Historique des réclamations */}
        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <div className='flex items-center mb-4'>
            <FileText className='h-5 w-5 text-gray-600 mr-2' />
            <h4 className='text-md font-medium text-gray-900'>
              Historique des réclamations
            </h4>
          </div>

          <div className='text-center py-8'>
            <AlertTriangle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Aucune réclamation
            </h3>
            <p className='text-gray-500'>
              Vous n'avez pas encore de réclamations. Vos réclamations
              apparaîtront ici.
            </p>
          </div>
        </div>
      </div>
    );
  },
);

ComplaintsSettings.displayName = 'ComplaintsSettings';

export default ComplaintsSettings;

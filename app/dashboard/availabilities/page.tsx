'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { useAvailabilities } from '@/hooks/availabilities';
import { useNotificationManager } from '@/components/ui/Notification';
import type { AvailabilityRule, AvailabilityTimeSlot } from '@/lib/types/availability.types';
import { Calendar, Plus, Save, Settings, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// Utility: forces a unique string ID
const uniqueId = (() => {
  let count = 1000;
  return () => `${Date.now()}-${++count}`.toString();
})();

export default function AvailabilitiesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'custom'>(
    'weekly',
  );
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);

  // Utiliser le hook personnalisé (Custom Hooks Pattern)
  const {
    availabilities,
    loading: availabilitiesLoading,
    error: availabilitiesError,
    createAvailabilityRule,
    updateAvailabilityRule,
    deleteAvailabilityRule,
    toggleAvailabilityRuleStatus,
    refreshAvailabilities,
  } = useAvailabilities(activeTab);

  // Utiliser le gestionnaire de notifications toast (Toast Pattern)
  const { addSuccess, addError } = useNotificationManager();

  // Ensure authentication
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Afficher les erreurs de chargement
  useEffect(() => {
    if (availabilitiesError) {
      addError(availabilitiesError, 8000);
    }
  }, [availabilitiesError, addError]);

  const daysOfWeek = [
    'Dimanche',
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
  ];

  // Filter availabilities by active tab (déjà fait par le hook, mais on garde pour compatibilité)
  const filteredAvailabilities = availabilities || [];

  // Save new or edited rule (useCallback Pattern)
  const handleSaveRule = useCallback(
    async (rule: AvailabilityRule) => {
      try {
        if (editingRule) {
          // Mettre à jour une règle existante
          const updateData: any = {
            name: rule.name,
            type: rule.type,
            isActive: rule.isActive,
            timeSlots: rule.timeSlots,
          };
          if (rule.startDate) updateData.startDate = rule.startDate;
          if (rule.endDate) updateData.endDate = rule.endDate;
          if (rule.timezone) updateData.timezone = rule.timezone;
          
          const updated = await updateAvailabilityRule(editingRule.id, updateData);

          if (updated) {
            addSuccess('Règle de disponibilité mise à jour avec succès', 6000);
          } else {
            addError('Erreur lors de la mise à jour de la règle', 8000);
          }
        } else {
          // Créer une nouvelle règle
          const createData: any = {
            name: rule.name,
            type: rule.type,
            isActive: rule.isActive ?? true,
            timeSlots: rule.timeSlots,
            timezone: rule.timezone || 'UTC',
          };
          if (rule.startDate) createData.startDate = rule.startDate;
          if (rule.endDate) createData.endDate = rule.endDate;
          
          const created = await createAvailabilityRule(createData);

          if (created) {
            addSuccess('Règle de disponibilité créée avec succès', 6000);
          } else {
            addError('Erreur lors de la création de la règle', 8000);
          }
        }
        setShowForm(false);
        setEditingRule(null);
      } catch (_error) {
        addError('Erreur lors de la sauvegarde de la règle', 8000);
      }
    },
    [editingRule, createAvailabilityRule, updateAvailabilityRule, addSuccess, addError],
  );

  // Delete a rule (useCallback Pattern)
  const handleDeleteRule = useCallback(
    async (id: string) => {
      // Utiliser une confirmation via toast warning (Toast Pattern)
      // Note: Pour une vraie confirmation, on pourrait utiliser un composant modal
      const confirmed = window.confirm(
        'Êtes-vous sûr de vouloir supprimer cette règle de disponibilité ?',
      );

      if (confirmed) {
        const deleted = await deleteAvailabilityRule(id);
        if (deleted) {
          addSuccess('Règle de disponibilité supprimée avec succès', 6000);
          if (editingRule && editingRule.id === id) {
            setShowForm(false);
            setEditingRule(null);
          }
        } else {
          addError('Erreur lors de la suppression de la règle', 8000);
        }
      }
    },
    [deleteAvailabilityRule, editingRule, addSuccess, addError],
  );

  // Toggle a rule's isActive status (useCallback Pattern)
  const toggleRuleStatus = useCallback(
    async (id: string) => {
      const toggled = await toggleAvailabilityRuleStatus(id);
      if (toggled) {
        const rule = availabilities.find(r => r.id === id);
        addSuccess(
          `Règle ${rule?.isActive ? 'activée' : 'désactivée'} avec succès`,
          5000,
        );
      } else {
        addError('Erreur lors du changement de statut de la règle', 8000);
      }
    },
    [availabilities, toggleAvailabilityRuleStatus, addSuccess, addError],
  );

  // Rafraîchir les disponibilités quand l'onglet change
  useEffect(() => {
    refreshAvailabilities(activeTab);
  }, [activeTab, refreshAvailabilities]);

  if (isLoading || availabilitiesLoading) {
    return (
      <div className='text-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto'></div>
        <p className='mt-4 text-gray-600'>Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
          Mes disponibilités
        </h1>
        <p className='text-gray-600 mt-2'>
          Gérez votre planning de disponibilités pour les rendez-vous
        </p>
      </div>

      {/* Tabs */}
      <div className='bg-white rounded-lg shadow border border-gray-200 p-4 mb-6'>
        <div className='flex space-x-4'>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'weekly'
                ? 'bg-[hsl(25,100%,53%)] text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            type='button'
          >
            <Calendar className='h-4 w-4 inline mr-2' />
            Planning hebdomadaire
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'monthly'
                ? 'bg-[hsl(25,100%,53%)] text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            type='button'
          >
            <Calendar className='h-4 w-4 inline mr-2' />
            Planning mensuel
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'custom'
                ? 'bg-[hsl(25,100%,53%)] text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            type='button'
          >
            <Settings className='h-4 w-4 inline mr-2' />
            Planning personnalisé
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6'>
        {filteredAvailabilities.length === 0 ? (
          <div className='col-span-full text-center py-12'>
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-8'>
              <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Aucune règle de disponibilité
              </h3>
              <p className='text-gray-600 mb-4'>
                {activeTab === 'weekly'
                  ? 'Aucune règle hebdomadaire configurée'
                  : activeTab === 'monthly'
                    ? 'Aucune règle mensuelle configurée'
                    : 'Aucune règle personnalisée configurée'}
              </p>
              <button
                onClick={() => {
                  setEditingRule(null);
                  setShowForm(true);
                }}
                aria-label='Créer une nouvelle règle'
                className='inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors'
                type='button'
              >
                <Plus className='h-4 w-4 mr-2' />
                Créer une nouvelle règle
              </button>
            </div>
          </div>
        ) : (
          filteredAvailabilities.map(rule => (
            <div
              key={rule.id}
              className={`bg-white rounded-lg shadow border border-gray-200 p-6 ${!rule.isActive ? 'opacity-60' : ''}`}
            >
              <div className='flex items-start justify-between mb-4'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {rule.name}
                  </h3>
                  <p className='text-sm text-gray-500 mt-1'>
                    {rule.type === 'weekly'
                      ? 'Planning hebdomadaire'
                      : rule.type === 'monthly'
                        ? 'Planning mensuel'
                        : 'Planning personnalisé'}
                  </p>
                </div>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() => toggleRuleStatus(rule.id)}
                    aria-label={rule.isActive ? 'Désactiver' : 'Activer'}
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rule.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                    type='button'
                  >
                    {rule.isActive ? 'Actif' : 'Inactif'}
                  </button>
                </div>
              </div>
              <div className='space-y-2 mb-4'>
                {daysOfWeek
                  .map((day, index) => {
                    const slots = (rule.timeSlots || []).filter(
                      (slot: AvailabilityTimeSlot) => slot.dayOfWeek === index,
                    );
                    if (slots.length === 0) return null;
                    return (
                      <div key={index} className='text-sm'>
                        <span className='font-medium text-gray-700'>
                          {day}:
                        </span>
                        <div className='ml-4 space-y-1'>
                          {slots.map((slot: AvailabilityTimeSlot) => (
                            <div key={slot.id} className='text-gray-600'>
                              {slot.startTime} - {slot.endTime}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                  .filter(Boolean)}
              </div>
              {(rule.type === 'monthly' || rule.type === 'custom') && (
                <div className='mb-4 text-xs text-gray-500'>
                  {rule.startDate && (
                    <div>
                      <span className='font-medium'>Début :</span>{' '}
                      {rule.startDate}
                    </div>
                  )}
                  {rule.endDate && (
                    <div>
                      <span className='font-medium'>Fin :</span> {rule.endDate}
                    </div>
                  )}
                </div>
              )}
              <div className='flex items-center justify-between pt-4 border-t border-gray-100'>
                <button
                  onClick={() => {
                    setEditingRule(rule);
                    setShowForm(true);
                  }}
                  aria-label='Modifier la règle'
                  className='text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] text-sm font-medium'
                  type='button'
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  aria-label='Supprimer la règle'
                  className='text-red-600 hover:text-red-900 text-sm font-medium'
                  type='button'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Rule Button */}
      <div className='text-center'>
        <button
          onClick={() => {
            setEditingRule(null);
            setShowForm(true);
          }}
          className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)] transition-colors'
          type='button'
        >
          <Plus className='h-5 w-5 mr-2' />
          Créer une nouvelle règle
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <AvailabilityForm
          rule={editingRule}
          onSave={handleSaveRule}
          onCancel={() => {
            setShowForm(false);
            setEditingRule(null);
          }}
          daysOfWeek={daysOfWeek}
          activeTab={activeTab}
        />
      )}
    </>
  );
}

// Form for create/edit a rule
interface AvailabilityFormProps {
  rule?: AvailabilityRule | null;
  onSave: (rule: AvailabilityRule) => void;
  onCancel: () => void;
  daysOfWeek: string[];
  activeTab?: 'weekly' | 'monthly' | 'custom';
}

function AvailabilityForm({
  rule,
  onSave,
  onCancel,
  daysOfWeek,
  activeTab,
}: AvailabilityFormProps) {
  const [formData, setFormData] = useState(() => ({
    name: rule?.name || '',
    type: rule?.type || activeTab || 'weekly',
    startDate: rule?.startDate || '',
    endDate: rule?.endDate || '',
    timeSlots: rule?.timeSlots
      ? rule.timeSlots.map((slot: AvailabilityTimeSlot) => ({ ...slot }))
      : [],
    isActive: rule?.isActive ?? true,
  }));

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type: type as 'weekly' | 'monthly' | 'custom',
      startDate: type === 'weekly' ? '' : prev.startDate,
      endDate: type === 'weekly' ? '' : prev.endDate,
    }));
  };

  const addTimeSlot = (dayOfWeek: number) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: [
        ...prev.timeSlots,
        {
          id: uniqueId(),
          dayOfWeek,
          startTime: '09:00',
          endTime: '10:00',
          isActive: true,
        },
      ],
    }));
  };

  const updateTimeSlot = (id: string, updates: Partial<AvailabilityTimeSlot>) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot: AvailabilityTimeSlot) =>
        slot.id === id ? { ...slot, ...updates } : slot,
      ),
    }));
  };

  const removeTimeSlot = (id: string) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: (prev.timeSlots || []).filter((slot: AvailabilityTimeSlot) => slot.id !== id),
    }));
  };

  // Utiliser le gestionnaire de notifications toast (Toast Pattern)
  const { addError: addFormError } = useNotificationManager();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addFormError('Le nom de la règle est obligatoire.', 6000);
      return;
    }

    if (
      (formData.type === 'monthly' || formData.type === 'custom') &&
      (!formData.startDate || !formData.endDate)
    ) {
      addFormError('Début et fin du planning requises pour ce type.', 6000);
      return;
    }

    for (const slot of formData.timeSlots) {
      if (slot.startTime >= slot.endTime) {
        addFormError(
          "L'heure de début doit précéder celle de fin pour tous les créneaux.",
          6000,
        );
        return;
      }
      // Ensure required slot fields
      if (
        slot.startTime.trim() === '' ||
        slot.endTime.trim() === '' ||
        typeof slot.dayOfWeek !== 'number'
      ) {
        addFormError('Merci de remplir tous les champs pour chaque créneau.', 6000);
        return;
      }
    }

    const ruleData: AvailabilityRule = {
      id: rule?.id || '',
      _id: rule?._id || rule?.id || '',
      userId: rule?.userId || '',
      name: formData.name,
      type: formData.type as 'weekly' | 'monthly' | 'custom',
      timeSlots: formData.timeSlots,
      isActive: formData.isActive,
      monday: formData.timeSlots.filter(
        (slot: AvailabilityTimeSlot) => slot.dayOfWeek === 1,
      ),
      tuesday: formData.timeSlots.filter(
        (slot: AvailabilityTimeSlot) => slot.dayOfWeek === 2,
      ),
      wednesday: formData.timeSlots.filter(
        (slot: AvailabilityTimeSlot) => slot.dayOfWeek === 3,
      ),
      thursday: formData.timeSlots.filter(
        (slot: AvailabilityTimeSlot) => slot.dayOfWeek === 4,
      ),
      friday: formData.timeSlots.filter(
        (slot: AvailabilityTimeSlot) => slot.dayOfWeek === 5,
      ),
      saturday: formData.timeSlots.filter(
        (slot: AvailabilityTimeSlot) => slot.dayOfWeek === 6,
      ),
      sunday: formData.timeSlots.filter(
        (slot: AvailabilityTimeSlot) => slot.dayOfWeek === 0,
      ),
      timezone: 'UTC',
      createdAt: rule?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    // Ajouter les propriétés optionnelles seulement si elles sont définies
    if (formData.type !== 'weekly' && formData.startDate) {
      ruleData.startDate = formData.startDate;
    }
    if (formData.type !== 'weekly' && formData.endDate) {
      ruleData.endDate = formData.endDate;
    }
    
    onSave(ruleData);
  };

  // Only allow to edit timeSlots for days which exist
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            {rule ? 'Modifier la règle' : 'Créer une nouvelle règle'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className='p-6' autoComplete='off'>
          <div className='space-y-6'>
            {/* Basic Info */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Nom de la règle <span className='text-red-400'>*</span>
                </label>
                <input
                  type='text'
                  required
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder='Ex: Planning hebdomadaire standard'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Type de planning
                </label>
                <select
                  value={formData.type}
                  onChange={e => handleTypeChange(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  title='Type de planning'
                >
                  <option value='weekly'>Hebdomadaire</option>
                  <option value='monthly'>Mensuel</option>
                  <option value='custom'>Personnalisé</option>
                </select>
              </div>
            </div>
            {/* Monthly & Custom Schedule Dates */}
            {(formData.type === 'monthly' || formData.type === 'custom') && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Début <span className='text-red-400'>*</span>
                  </label>
                  <input
                    type='date'
                    required
                    value={formData.startDate}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                    title='Début'
                    placeholder='JJ/MM/AAAA'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Fin <span className='text-red-400'>*</span>
                  </label>
                  <input
                    type='date'
                    required
                    value={formData.endDate}
                    min={formData.startDate || undefined}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                    title='Fin'
                    placeholder='JJ/MM/AAAA'
                  />
                </div>
              </div>
            )}
            {/* Time Slots */}
            <div>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Créneaux horaires
              </h3>
              <div className='space-y-4'>
                {daysOfWeek.map((day, dayIndex) => {
                  const daySlots = (formData.timeSlots || []).filter( 
                    (slot: AvailabilityTimeSlot) => slot.dayOfWeek === dayIndex,
                  );
                  return (
                    <div
                      key={dayIndex}
                      className='border border-gray-200 rounded-lg p-4'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <h4 className='font-medium text-gray-900'>{day}</h4>
                        <button
                          type='button'
                          onClick={() => addTimeSlot(dayIndex)}
                          className='text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] text-sm font-medium'
                          aria-label={`Ajouter un créneau pour ${day}`}
                        >
                          <Plus className='h-4 w-4 inline mr-1' />
                          Ajouter un créneau
                        </button>
                      </div>
                      {daySlots.length === 0 ? (
                        <p className='text-sm text-gray-500 italic'>
                          Aucun créneau défini pour ce jour
                        </p>
                      ) : (
                        <div className='space-y-2'>
                          {daySlots.map((slot: AvailabilityTimeSlot) => (
                            <div
                              key={slot.id}
                              className='flex items-center space-x-2'
                            >
                              <input
                                type='time'
                                value={slot.startTime}
                                onChange={e =>
                                  updateTimeSlot(slot.id || '', {
                                    startTime: e.target.value,
                                  })
                                }
                                className='px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                                required
                                aria-label='Heure de début'
                              />
                              <span className='text-gray-500'>-</span>
                              <input
                                type='time'
                                value={slot.endTime}
                                onChange={e =>
                                  updateTimeSlot(slot.id || '', {
                                    endTime: e.target.value,
                                  })
                                }
                                className='px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                                required
                                aria-label='Heure de fin'
                              />
                              <button
                                type='button'
                                onClick={() => removeTimeSlot(slot.id || '')}
                                className='text-red-600 hover:text-red-900'
                                aria-label='Supprimer ce créneau'
                              >
                                <Trash2 className='h-4 w-4' />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Status */}
            <div className='flex items-center'>
              <input
                type='checkbox'
                id='isActive'
                checked={formData.isActive}
                onChange={e =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className='h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded'
              />
              <label htmlFor='isActive' className='ml-2 text-sm text-gray-700'>
                Activer cette règle
              </label>
            </div>
          </div>
          {/* Actions */}
          <div className='flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200'>
            <button
              type='button'
              onClick={onCancel}
              className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
            >
              Annuler
            </button>
            <button
              type='submit'
              className='flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors'
            >
              <Save className='h-4 w-4 mr-2' />
              {rule ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

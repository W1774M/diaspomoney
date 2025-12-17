/**
 * CreateUserModal - Modal de création d'utilisateur
 * 
 * Implémente les design patterns :
 * - Custom Hooks Pattern (via useCreateUser)
 * - Notification Pattern (via useNotificationManager)
 * - Logger Pattern (structured logging)
 * 
 * Architecture :
 * - Le composant utilise useCreateUser qui appelle /api/users
 * - /api/users utilise le Facade Pattern (userFacade.execute)
 * - userFacade orchestre la création via Repository Pattern
 * - Service Layer Pattern : userFacade utilise userRepository et userService
 */
'use client';

import { X, Plus, X as XIcon } from 'lucide-react';
import { useEffect, useCallback, useState } from 'react';
import { PhoneInput } from 'react-international-phone';
import { useCreateUser, CreateUserFormData } from '@/hooks/users';
import { useNotificationManager } from '@/components/ui/Notification';
import { logger } from '@/lib/logger';
import { USER_ROLES, ProviderType, ProviderCategory } from '@/lib/types';
import { USER_STATUSES as CONST_USER_STATUSES, ROLES } from '@/lib/constants';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const { createUser, loading } = useCreateUser();
  const { addSuccess, addError } = useNotificationManager();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    roles: [] as string[],
    status: CONST_USER_STATUSES.PENDING, // Toujours PENDING pour activation via email
    clientNotes: '',
    // Provider info
    isProvider: false,
    providerType: ProviderType.INDIVIDUAL,
    providerCategory: ProviderCategory.HEALTH,
    // Individuel
    individualFirstName: '',
    individualLastName: '',
    individualRcs: '',
    individualTva: '',
    individualSiret: '',
    individualSiren: '',
    // Institution
    institutionName: '',
    institutionRcs: '',
    institutionTva: '',
    institutionSiret: '',
    institutionSiren: '',
    // Adresse professionnelle (commune) - un seul champ pour l'instant
    professionalAddress: '',
    // Provider autres
    recommended: false,
    specialties: [] as string[],
    specialtyInput: '',
  });

  // Fermer avec Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, loading]);

  // Empêcher le scroll du body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Réinitialiser le formulaire quand la modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        roles: [],
        status: CONST_USER_STATUSES.PENDING,
        clientNotes: '',
        isProvider: false,
        providerType: ProviderType.INDIVIDUAL,
        providerCategory: ProviderCategory.HEALTH,
        individualFirstName: '',
        individualLastName: '',
        individualRcs: '',
        individualTva: '',
        individualSiret: '',
        individualSiren: '',
        institutionName: '',
        institutionRcs: '',
        institutionTva: '',
        institutionSiret: '',
        institutionSiren: '',
        professionalAddress: '',
        recommended: false,
        specialties: [],
        specialtyInput: '',
      });
    }
  }, [isOpen]);

  // Détecter si customer
  const isCustomer = formData.roles.includes(ROLES.CUSTOMER);
  // Détecter si provider
  const isProvider = formData.roles.includes(ROLES.PROVIDER);

  // Mettre à jour isProvider quand les rôles changent
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      isProvider: prev.roles.includes(ROLES.PROVIDER),
    }));
  }, [formData.roles]);

  const handleInputChange = useCallback((
    field: string,
    value: string | boolean | string[] | ProviderType | ProviderCategory
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleRoleChange = useCallback((role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role),
    }));
  }, []);

  const handleAddSpecialty = useCallback(() => {
    if (formData.specialtyInput.trim()) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, prev.specialtyInput.trim()],
        specialtyInput: '',
      }));
    }
  }, [formData.specialtyInput]);

  const handleRemoveSpecialty = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validation côté client
      // Pour les entreprises (INSTITUTION), firstName/lastName ne sont pas requis au niveau de base
      const isInstitutionProvider = isProvider && formData.providerType === ProviderType.INSTITUTION;
      // Si l'utilisateur est customer ET provider, les champs firstName/lastName sont optionnels
      const isCustomerAndProvider = isCustomer && isProvider;
      const requiresBaseName = !isInstitutionProvider && !isCustomerAndProvider;
      
      if (!formData.email || formData.roles.length === 0) {
        addError(
          'Veuillez remplir tous les champs obligatoires (email, rôles)',
          6000,
        );
        return;
      }

      if (requiresBaseName && (!formData.firstName || !formData.lastName)) {
        addError(
          'Veuillez remplir le prénom et le nom',
          6000,
        );
        return;
      }

      // Validation provider
      if (isProvider) {
        if (formData.providerType === ProviderType.INDIVIDUAL) {
          if (!formData.individualFirstName || !formData.individualLastName) {
            addError(
              'Pour un prestataire individuel, le prénom et le nom sont obligatoires',
              6000,
            );
            return;
          }
        } else {
          if (!formData.institutionName) {
            addError(
              'Pour une entreprise, le nom de l\'entreprise est obligatoire',
              6000,
            );
            return;
          }
        }

        if (!formData.professionalAddress || formData.professionalAddress.trim() === '') {
          addError(
            'L\'adresse professionnelle est obligatoire pour un prestataire',
            6000,
          );
          return;
        }
      }

      try {
        logger.info(
          {
            email: formData.email,
            roles: formData.roles,
            isProvider,
          },
          'Submitting user creation form',
        );

        // Pour les entreprises, utiliser le nom de l'entreprise comme name
        // et ne pas exiger firstName/lastName au niveau de base
        // Pour customer ET provider, construire le name à partir des données disponibles
        let userName: string;
        let userFirstName: string;
        let userLastName: string;

        if (isInstitutionProvider) {
          // Pour les entreprises, utiliser le nom de l'entreprise
          userName = formData.institutionName;
          userFirstName = formData.institutionName;
          userLastName = '';
        } else if (isCustomerAndProvider) {
          // Pour customer ET provider, utiliser les données du provider si disponibles
          if (formData.providerType === ProviderType.INDIVIDUAL) {
            // Utiliser les données individuelles du provider
            userName = formData.individualFirstName && formData.individualLastName
              ? `${formData.individualFirstName} ${formData.individualLastName}`
              : formData.firstName && formData.lastName
              ? `${formData.firstName} ${formData.lastName}`
              : formData.email; // Fallback sur l'email
            userFirstName = formData.individualFirstName || formData.firstName || '';
            userLastName = formData.individualLastName || formData.lastName || '';
          } else {
            // Provider institution mais pas customer seul
            userName = formData.institutionName || formData.firstName || formData.email;
            userFirstName = formData.institutionName || formData.firstName || '';
            userLastName = formData.lastName || '';
          }
        } else {
          // Cas normal : customer seul ou provider seul (individuel)
          userName = formData.firstName && formData.lastName
            ? `${formData.firstName} ${formData.lastName}`
            : formData.email; // Fallback sur l'email
          userFirstName = formData.firstName || '';
          userLastName = formData.lastName || '';
        }

        const userData: CreateUserFormData = {
          email: formData.email,
          name: userName,
          firstName: userFirstName,
          lastName: userLastName,
          phone: formData.phone,
          roles: formData.roles,
          status: formData.status,
          clientNotes: formData.clientNotes,
        };

        // Ajouter providerInfo seulement si c'est un provider
        if (isProvider) {
          userData.providerInfo = {
            type: formData.providerType,
            category: formData.providerCategory,
            specialties: formData.specialties,
            recommended: formData.recommended,
            ...(formData.providerType === ProviderType.INDIVIDUAL ? {
              individual: {
                firstName: formData.individualFirstName,
                lastName: formData.individualLastName,
                rcs: formData.individualRcs,
                tva: formData.individualTva,
                siret: formData.individualSiret,
                siren: formData.individualSiren,
              },
            } : {
              institution: {
                legalName: formData.institutionName,
                registrationNumber: formData.institutionRcs || formData.institutionSiret || formData.institutionSiren || '',
                taxId: formData.institutionTva || '',
                rcs: formData.institutionRcs,
                siret: formData.institutionSiret,
                siren: formData.institutionSiren,
              },
            }),
            professionalAddress: {
              street: formData.professionalAddress,
              city: '', // Sera rempli plus tard avec Google API
              country: '', // Sera rempli plus tard avec Google API
              postalCode: '', // Sera rempli plus tard avec Google API
            },
          };
        }

        const result = await createUser(userData);

        // Gérer les erreurs de duplication (409) - l'utilisateur existe peut-être déjà
        const isDuplicateError = result.error?.includes('existe déjà') || 
                                 result.error?.includes('duplicate') ||
                                 result.error?.includes('DUPLICATE_EMAIL');

        if (result.success && result.user) {
          const userEmail = result.user.email || formData.email;
          logger.info(
            {
              userId: result.user.id || result.user._id,
              email: userEmail,
            },
            'User created successfully',
          );

          // Afficher la notification immédiatement (avant toute autre action)
          addSuccess(
            `Utilisateur créé avec succès ! Un email d'activation a été envoyé à ${userEmail}`,
            8000,
          );

          // Attendre un peu pour que la notification s'affiche
          await new Promise(resolve => setTimeout(resolve, 300));

          // Appeler le callback de succès pour rafraîchir la liste
          if (onSuccess) {
            onSuccess();
          }

          // Fermer la modal après le rafraîchissement
          onClose();
        } else if (isDuplicateError) {
          // En cas d'erreur de duplication, informer l'utilisateur et fermer la modal
          // car l'utilisateur existe peut-être déjà dans le système
          const errorMessage = result.error || "Un compte avec cet email existe déjà";
          logger.warn(
            {
              error: result.error,
              email: formData.email,
            },
            'User creation failed: duplicate email',
          );
          addError(errorMessage, 8000);
          
          // Fermer la modal même en cas d'erreur de duplication
          // pour permettre à l'utilisateur de vérifier la liste
          onClose();
          
          if (onSuccess) {
            onSuccess();
          }
        } else {
          const errorMessage =
            result.error || "Erreur lors de la création de l'utilisateur";
          logger.error(
            {
              error: result.error,
              email: formData.email,
            },
            'User creation failed',
          );
          addError(errorMessage, 8000);
        }
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : "Erreur lors de la création de l'utilisateur. Veuillez réessayer.";
        
        logger.error(
          {
            error,
            email: formData.email,
            roles: formData.roles,
          },
          'Error submitting user creation form',
        );
        addError(errorMessage, 8000);
      }
    },
    [formData, createUser, addSuccess, addError, onClose, onSuccess, isProvider],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 id="create-user-modal-title" className="text-xl font-semibold text-gray-900">
            Nouvel Utilisateur
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="create-user-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informations de base
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                    placeholder="jean.dupont@email.com"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Un email d&apos;activation sera envoyé à l&apos;utilisateur
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <PhoneInput
                    defaultCountry="fr"
                    value={formData.phone}
                    onChange={(phone) => handleInputChange('phone', phone)}
                    className="w-full"
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Rôles */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Rôles *
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {USER_ROLES.map(role => (
                  <label key={role} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role)}
                      onChange={e => handleRoleChange(role, e.target.checked)}
                      className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Informations client */}
            {isCustomer && !isProvider && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Informations client
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={e => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      placeholder="Jean"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={e => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      placeholder="Dupont"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Informations client optionnelles si customer ET provider */}
            {isCustomer && isProvider && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Informations client (optionnel)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={e => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      placeholder="Jean"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={e => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      placeholder="Dupont"
                    />
                  </div>
                  <small className="text-xs text-gray-500 md:col-span-2">
                    Ces champs sont optionnels si l&apos;utilisateur est à la fois client et prestataire.
                  </small>
                </div>
              </div>
            )}

            {/* Informations prestataire */}
            {isProvider && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Informations prestataire
                </h2>

                {/* Type de prestataire */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Type de prestataire *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="providerType"
                        value={ProviderType.INDIVIDUAL}
                        checked={formData.providerType === ProviderType.INDIVIDUAL}
                        onChange={e => handleInputChange('providerType', e.target.value as ProviderType)}
                        className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Individuel</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="providerType"
                        value={ProviderType.INSTITUTION}
                        checked={formData.providerType === ProviderType.INSTITUTION}
                        onChange={e => handleInputChange('providerType', e.target.value as ProviderType)}
                        className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Entreprise</span>
                    </label>
                  </div>
                </div>

                {/* Informations individuelles */}
                {formData.providerType === ProviderType.INDIVIDUAL && (
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-800">Informations individuelles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prénom *
                        </label>
                        <input
                          type="text"
                          value={formData.individualFirstName}
                          onChange={e => handleInputChange('individualFirstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                          placeholder="Jean"
                          required={isProvider && formData.providerType === ProviderType.INDIVIDUAL}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom *
                        </label>
                        <input
                          type="text"
                          value={formData.individualLastName}
                          onChange={e => handleInputChange('individualLastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                          placeholder="Dupont"
                          required={isProvider && formData.providerType === ProviderType.INDIVIDUAL}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          RCS
                        </label>
                        <input
                          type="text"
                          value={formData.individualRcs}
                          onChange={e => handleInputChange('individualRcs', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                          placeholder="RCS Paris B 123 456 789"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          TVA
                        </label>
                        <input
                          type="text"
                          value={formData.individualTva}
                          onChange={e => handleInputChange('individualTva', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                          placeholder="FR 12 345678901"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SIRET
                        </label>
                        <input
                          type="text"
                          value={formData.individualSiret}
                          onChange={e => handleInputChange('individualSiret', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                          placeholder="123 456 789 00012"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SIREN
                        </label>
                        <input
                          type="text"
                          value={formData.individualSiren}
                          onChange={e => handleInputChange('individualSiren', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                          placeholder="123 456 789"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations entreprise */}
                {formData.providerType === ProviderType.INSTITUTION && (
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-800">Informations entreprise</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom de l&apos;entreprise *
                        </label>
                        <input
                          type="text"
                          value={formData.institutionName}
                          onChange={e => handleInputChange('institutionName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                          placeholder="Entreprise ABC"
                          required={isProvider && formData.providerType === ProviderType.INSTITUTION}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          RCS
                        </label>
                        <input
                          type="text"
                          value={formData.institutionRcs}
                          onChange={e => handleInputChange('institutionRcs', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                          placeholder="RCS Paris B 123 456 789"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          TVA
                        </label>
                        <input
                          type="text"
                          value={formData.institutionTva}
                          onChange={e => handleInputChange('institutionTva', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                          placeholder="FR 12 345678901"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SIRET
                        </label>
                        <input
                          type="text"
                          value={formData.institutionSiret}
                          onChange={e => handleInputChange('institutionSiret', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                          placeholder="123 456 789 00012"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SIREN
                        </label>
                        <input
                          type="text"
                          value={formData.institutionSiren}
                          onChange={e => handleInputChange('institutionSiren', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                          placeholder="123 456 789"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Adresse professionnelle */}
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-800">Adresse professionnelle *</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse complète *
                    </label>
                    <input
                      type="text"
                      value={formData.professionalAddress}
                      onChange={e => handleInputChange('professionalAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      placeholder="123 Rue de la Paix, 75001 Paris, France"
                      required={isProvider}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Saisissez l&apos;adresse complète. Le découpage administratif sera ajouté ultérieurement.
                    </p>
                  </div>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.providerCategory}
                    onChange={e => handleInputChange('providerCategory', e.target.value as ProviderCategory)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                    required={isProvider}
                  >
                    <option value={ProviderCategory.HEALTH}>Santé</option>
                    <option value={ProviderCategory.BTP}>BTP</option>
                    <option value={ProviderCategory.EDUCATION}>Éducation</option>
                  </select>
                </div>

                {/* Spécialités */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spécialités
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={formData.specialtyInput}
                      onChange={e => handleInputChange('specialtyInput', e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSpecialty();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                      placeholder="Ajouter une spécialité"
                    />
                    <button
                      type="button"
                      onClick={handleAddSpecialty}
                      className="px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {formData.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[hsl(25,100%,53%)]/10 text-[hsl(25,100%,53%)]"
                        >
                          {specialty}
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialty(index)}
                            className="ml-2 text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prestataire recommandé */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="recommended"
                    checked={formData.recommended}
                    onChange={e => handleInputChange('recommended', e.target.checked)}
                    className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
                  />
                  <label htmlFor="recommended" className="ml-2 text-sm text-gray-700">
                    Prestataire recommandé
                  </label>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="create-user-form"
            disabled={loading || formData.roles.length === 0}
            className="px-6 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Création...' : "Créer l'utilisateur"}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * Page d'édition d'un utilisateur
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useUser, useUserEdit, useAuth)
 * - Service Layer Pattern (via les API routes)
 * - Logger Pattern (logging structuré côté serveur)
 * - Middleware Pattern (authentification via useAuth)
 * 
 * Architecture :
 * - Le composant utilise useUserEdit qui appelle /api/users/[id]
 * - /api/users/[id] utilise le Service Layer Pattern (userService.updateUserProfile)
 * - userService utilise le Repository Pattern pour la persistance
 */

import { useUser, useUserEdit } from '@/hooks';
import { USER_ROLES, USER_STATUSES, ProviderType, ProviderCategory } from '@/lib/types';
import { LANGUAGES, TIMEZONES, USER_STATUSES as CONST_USER_STATUSES, ROLES } from '@/lib/constants';
import { AuthorizedRoute } from '@/components/auth';
import { ArrowLeft, Plus, X as XIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { PhoneInput } from 'react-international-phone';
import { useNotificationManager } from '@/components/ui/Notification';

/**
 * Contenu de la page d'édition d'un utilisateur
 */
function EditUserPageContent() {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  const { user, loading, error, fetchUser } = useUser();
  const { updateUser, loading: saving } = useUserEdit();
  const { addSuccess, addError } = useNotificationManager();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    name: '',
    phone: '',
    roles: [] as string[],
        status: CONST_USER_STATUSES.ACTIVE as string,
    clientNotes: '',
    avatar: '',
        preferences: {
          language: LANGUAGES.FR.code as string,
          timezone: TIMEZONES.PARIS as string,
          notifications: true,
        },
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
    // Adresse professionnelle
    professionalAddress: '',
    // Provider autres
    recommended: false,
    specialties: [] as string[],
    specialtyInput: '',
  });

  // Charger les données de l'utilisateur
  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId, fetchUser]);

  // Remplir le formulaire avec les données de l'utilisateur
  useEffect(() => {
    if (user) {
      const isProvider = (user.roles || []).some(role => String(role) === ROLES.PROVIDER);
      const providerInfo = user.providerInfo || {} as any;
      
      setFormData({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: user.name || '',
        phone: user.phone || '',
        roles: (user.roles || []).map(String),
        status: String(user.status || CONST_USER_STATUSES.ACTIVE),
        clientNotes: user.clientNotes || '',
        avatar:
          typeof user.avatar === 'string'
            ? user.avatar
            : (user.avatar as any)?.image || '',
        preferences: {
          language: user.preferences?.language || LANGUAGES.FR.code,
          timezone: user.preferences?.timezone || TIMEZONES.PARIS,
          notifications: user.preferences?.notifications ?? true,
        },
        // Provider info
        isProvider,
        providerType: providerInfo.type || ProviderType.INDIVIDUAL,
        providerCategory: providerInfo.category || ProviderCategory.HEALTH,
        // Individuel
        individualFirstName: providerInfo.individual?.firstName || '',
        individualLastName: providerInfo.individual?.lastName || '',
        individualRcs: providerInfo.individual?.rcs || '',
        individualTva: providerInfo.individual?.tva || '',
        individualSiret: providerInfo.individual?.siret || '',
        individualSiren: providerInfo.individual?.siren || '',
        // Institution
        institutionName: providerInfo.institution?.legalName || '',
        institutionRcs: providerInfo.institution?.registrationNumbers?.rcs || providerInfo.institution?.rcs || '',
        institutionTva: providerInfo.institution?.taxId || providerInfo.institution?.tva || '',
        institutionSiret: providerInfo.institution?.registrationNumbers?.siret || providerInfo.institution?.siret || '',
        institutionSiren: providerInfo.institution?.registrationNumbers?.siren || providerInfo.institution?.siren || '',
        // Adresse professionnelle
        professionalAddress: providerInfo.professionalAddress?.street || '',
        // Provider autres
        recommended: user.recommended || providerInfo.recommended || false,
        specialties: providerInfo.specialties || user.specialties || [],
        specialtyInput: '',
      });
    }
  }, [user]);

  // Mettre à jour isProvider quand les rôles changent
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      isProvider: prev.roles.includes(ROLES.PROVIDER as string),
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

  const handlePreferenceChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) return;

    try {
      const isCustomer = formData.roles.includes(ROLES.CUSTOMER);
      const isProvider = formData.roles.includes(ROLES.PROVIDER);
      const isInstitutionProvider = isProvider && formData.providerType === ProviderType.INSTITUTION;
      const isCustomerAndProvider = isCustomer && isProvider;

      // Construire les données de mise à jour
      const updateData: any = {
        email: formData.email,
        phone: formData.phone,
        roles: formData.roles,
        status: formData.status,
        clientNotes: formData.clientNotes,
        preferences: formData.preferences,
      };

      // Construire name, firstName, lastName selon le type
      if (isInstitutionProvider) {
        updateData.name = formData.institutionName;
        updateData.firstName = formData.institutionName;
        updateData.lastName = '';
      } else if (isCustomerAndProvider) {
        if (formData.providerType === ProviderType.INDIVIDUAL) {
          updateData.name = formData.individualFirstName && formData.individualLastName
            ? `${formData.individualFirstName} ${formData.individualLastName}`
            : formData.firstName && formData.lastName
            ? `${formData.firstName} ${formData.lastName}`
            : formData.name || formData.email;
          updateData.firstName = formData.individualFirstName || formData.firstName || '';
          updateData.lastName = formData.individualLastName || formData.lastName || '';
        } else {
          updateData.name = formData.institutionName || formData.firstName || formData.name || formData.email;
          updateData.firstName = formData.institutionName || formData.firstName || '';
          updateData.lastName = formData.lastName || '';
        }
      } else {
        updateData.name = formData.firstName && formData.lastName
          ? `${formData.firstName} ${formData.lastName}`
          : formData.name || formData.email;
        updateData.firstName = formData.firstName || '';
        updateData.lastName = formData.lastName || '';
      }

      // Ajouter providerInfo seulement si c'est un provider
      if (isProvider) {
        updateData.providerInfo = {
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
        updateData.recommended = formData.recommended;
      }

      const result = await updateUser(userId, updateData);
      
      if (result) {
        addSuccess('Utilisateur mis à jour avec succès', 5000);
        
        // Attendre un peu pour que la notification s'affiche
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Rediriger vers la page de détail seulement en cas de succès
        router.push(`/dashboard/users/${userId}`);
      } else {
        throw new Error("Erreur lors de la mise à jour de l'utilisateur");
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erreur lors de la mise à jour de l'utilisateur. Veuillez réessayer.";
      
      // Afficher la notification d'erreur
      addError(errorMessage, 8000);
      
      // Ne pas rediriger en cas d'erreur pour que l'utilisateur puisse voir le message
    }
  }, [formData, userId, updateUser, router, addSuccess, addError]);

  if (loading) {
    return (
      <div className='text-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto'></div>
        <p className='mt-4 text-gray-600'>Chargement de l'utilisateur...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-600'>{error || 'Utilisateur non trouvé'}</p>
        <Link
          href='/dashboard/users'
          className='mt-4 inline-flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Retour aux utilisateurs
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className='mb-8'>
        <div className='flex items-center mb-4'>
          <Link
            href={`/dashboard/users/${userId}`}
            className='flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] mr-4'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Retour à l'utilisateur
          </Link>
        </div>
        <h1 className='text-3xl font-bold text-gray-900'>
          Modifier l'Utilisateur
        </h1>
        <p className='text-gray-600 mt-2'>
          Modifiez les informations de {formData.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Informations de base */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Informations de base
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Email *
              </label>
              <input
                type='email'
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='jean.dupont@email.com'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
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

        {/* Rôles et statut */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Rôles et statut
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                Rôles *
              </label>
              <div className='space-y-2'>
                {USER_ROLES.map(role => (
                  <label key={role} className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={formData.roles.includes(role)}
                      onChange={e => handleRoleChange(role, e.target.checked)}
                      className='h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded'
                    />
                    <span className='ml-2 text-sm text-gray-700'>{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Statut
              </label>
              <select
                title='Statut'
                value={formData.status}
                onChange={e => handleInputChange('status', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              >
                {USER_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Informations client */}
        {formData.roles.includes(ROLES.CUSTOMER) && !formData.roles.includes(ROLES.PROVIDER) && (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Informations client
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Prénom *
                </label>
                <input
                  type='text'
                  value={formData.firstName}
                  onChange={e => handleInputChange('firstName', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder='Jean'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Nom *
                </label>
                <input
                  type='text'
                  value={formData.lastName}
                  onChange={e => handleInputChange('lastName', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder='Dupont'
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Informations client optionnelles si customer ET provider */}
        {formData.roles.includes(ROLES.CUSTOMER) && formData.roles.includes(ROLES.PROVIDER) && (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Informations client (optionnel)
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Prénom
                </label>
                <input
                  type='text'
                  value={formData.firstName}
                  onChange={e => handleInputChange('firstName', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder='Jean'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Nom
                </label>
                <input
                  type='text'
                  value={formData.lastName}
                  onChange={e => handleInputChange('lastName', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder='Dupont'
                />
              </div>
              <small className='text-xs text-gray-500 md:col-span-2'>
                Ces champs sont optionnels si l&apos;utilisateur est à la fois client et prestataire.
              </small>
            </div>
          </div>
        )}

        {/* Informations prestataire */}
        {formData.roles.includes(ROLES.PROVIDER) && (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6 space-y-6'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Informations prestataire
            </h2>

            {/* Type de prestataire */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                Type de prestataire *
              </label>
              <div className='flex gap-4'>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='providerType'
                    value={ProviderType.INDIVIDUAL}
                    checked={formData.providerType === ProviderType.INDIVIDUAL}
                    onChange={e => handleInputChange('providerType', e.target.value as ProviderType)}
                    className='h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300'
                  />
                  <span className='ml-2 text-sm text-gray-700'>Individuel</span>
                </label>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='providerType'
                    value={ProviderType.INSTITUTION}
                    checked={formData.providerType === ProviderType.INSTITUTION}
                    onChange={e => handleInputChange('providerType', e.target.value as ProviderType)}
                    className='h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300'
                  />
                  <span className='ml-2 text-sm text-gray-700'>Entreprise</span>
                </label>
              </div>
            </div>

            {/* Informations individuelles */}
            {formData.providerType === ProviderType.INDIVIDUAL && (
              <div className='space-y-4'>
                <h3 className='text-md font-semibold text-gray-800'>Informations individuelles</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Prénom *
                    </label>
                    <input
                      type='text'
                      value={formData.individualFirstName}
                      onChange={e => handleInputChange('individualFirstName', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='Jean'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Nom *
                    </label>
                    <input
                      type='text'
                      value={formData.individualLastName}
                      onChange={e => handleInputChange('individualLastName', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='Dupont'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      RCS
                    </label>
                    <input
                      type='text'
                      value={formData.individualRcs}
                      onChange={e => handleInputChange('individualRcs', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='RCS Paris B 123 456 789'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      TVA
                    </label>
                    <input
                      type='text'
                      value={formData.individualTva}
                      onChange={e => handleInputChange('individualTva', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='FR 12 345678901'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      SIRET
                    </label>
                    <input
                      type='text'
                      value={formData.individualSiret}
                      onChange={e => handleInputChange('individualSiret', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='123 456 789 00012'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      SIREN
                    </label>
                    <input
                      type='text'
                      value={formData.individualSiren}
                      onChange={e => handleInputChange('individualSiren', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='123 456 789'
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Informations entreprise */}
            {formData.providerType === ProviderType.INSTITUTION && (
              <div className='space-y-4'>
                <h3 className='text-md font-semibold text-gray-800'>Informations entreprise</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='md:col-span-2'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Nom de l&apos;entreprise *
                    </label>
                    <input
                      type='text'
                      value={formData.institutionName}
                      onChange={e => handleInputChange('institutionName', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='Entreprise ABC'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      RCS
                    </label>
                    <input
                      type='text'
                      value={formData.institutionRcs}
                      onChange={e => handleInputChange('institutionRcs', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='RCS Paris B 123 456 789'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      TVA
                    </label>
                    <input
                      type='text'
                      value={formData.institutionTva}
                      onChange={e => handleInputChange('institutionTva', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='FR 12 345678901'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      SIRET
                    </label>
                    <input
                      type='text'
                      value={formData.institutionSiret}
                      onChange={e => handleInputChange('institutionSiret', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='123 456 789 00012'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      SIREN
                    </label>
                    <input
                      type='text'
                      value={formData.institutionSiren}
                      onChange={e => handleInputChange('institutionSiren', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                      placeholder='123 456 789'
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Adresse professionnelle */}
            <div className='space-y-4'>
              <h3 className='text-md font-semibold text-gray-800'>Adresse professionnelle *</h3>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Adresse complète *
                </label>
                <input
                  type='text'
                  value={formData.professionalAddress}
                  onChange={e => handleInputChange('professionalAddress', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder='123 Rue de la Paix, 75001 Paris, France'
                  required
                />
                <p className='mt-1 text-xs text-gray-500'>
                  Saisissez l&apos;adresse complète. Le découpage administratif sera ajouté ultérieurement.
                </p>
              </div>
            </div>

            {/* Catégorie */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Catégorie *
              </label>
              <select
                value={formData.providerCategory}
                onChange={e => handleInputChange('providerCategory', e.target.value as ProviderCategory)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                required
              >
                <option value={ProviderCategory.HEALTH}>Santé</option>
                <option value={ProviderCategory.BTP}>BTP</option>
                <option value={ProviderCategory.EDUCATION}>Éducation</option>
              </select>
            </div>

            {/* Spécialités */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Spécialités
              </label>
              <div className='flex gap-2 mb-2'>
                <input
                  type='text'
                  value={formData.specialtyInput}
                  onChange={e => handleInputChange('specialtyInput', e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSpecialty();
                    }
                  }}
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  placeholder='Ajouter une spécialité'
                />
                <button
                  type='button'
                  onClick={handleAddSpecialty}
                  className='px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors'
                >
                  <Plus className='h-4 w-4' />
                </button>
              </div>
              {formData.specialties.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {formData.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center px-3 py-1 rounded-full text-sm bg-[hsl(25,100%,53%)]/10 text-[hsl(25,100%,53%)]'
                    >
                      {specialty}
                      <button
                        type='button'
                        onClick={() => handleRemoveSpecialty(index)}
                        className='ml-2 text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]'
                      >
                        <XIcon className='h-3 w-3' />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Prestataire recommandé */}
            <div className='flex items-center'>
              <input
                type='checkbox'
                id='recommended'
                checked={formData.recommended}
                onChange={e => handleInputChange('recommended', e.target.checked)}
                className='h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded'
              />
              <label htmlFor='recommended' className='ml-2 text-sm text-gray-700'>
                Prestataire recommandé
              </label>
            </div>
          </div>
        )}

        {/* Notes client */}
        {formData.roles.includes(ROLES.CUSTOMER) && (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Notes client
            </h2>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Notes client
              </label>
              <textarea
                value={formData.clientNotes}
                onChange={e => handleInputChange('clientNotes', e.target.value)}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                placeholder='Notes sur le client...'
              />
            </div>
          </div>
        )}

        {/* Préférences */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Préférences
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Langue
              </label>
              <select
                title='Langue'
                value={formData.preferences.language}
                onChange={e =>
                  handlePreferenceChange('language', e.target.value)
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              >
                <option value='fr'>Français</option>
                <option value='en'>English</option>
                <option value='es'>Español</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Fuseau horaire
              </label>
              <select
                title='Fuseau horaire'
                value={formData.preferences.timezone}
                onChange={e =>
                  handlePreferenceChange('timezone', e.target.value)
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              >
                <option value='Europe/Paris'>Europe/Paris</option>
                <option value='UTC'>UTC</option>
                <option value='America/New_York'>America/New_York</option>
              </select>
            </div>

            <div className='flex items-center'>
              <input
                type='checkbox'
                title='Notifications activées'
                checked={formData.preferences.notifications}
                onChange={e =>
                  handlePreferenceChange('notifications', e.target.checked)
                }
                className='h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded'
              />
              <label className='ml-2 text-sm text-gray-700'>
                Notifications activées
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex justify-end space-x-4'>
          <Link
            href={`/dashboard/users/${userId}`}
            className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
          >
            Annuler
          </Link>
          <button
            type='submit'
            disabled={saving || formData.roles.length === 0}
            className='px-6 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </>
  );
}

/**
 * Page d'édition d'un utilisateur
 * Implémente les design patterns :
 * - Authorization Pattern (via AuthorizedRoute aligné avec @Authorize decorator backend)
 */
export default function EditUserPage() {
  return (
    <AuthorizedRoute roles={[ROLES.ADMIN]} redirectTo="/dashboard/users">
      <EditUserPageContent />
    </AuthorizedRoute>
  );
}

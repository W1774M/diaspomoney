'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { useServices, useServiceOptions, type Service, type ServiceOption } from '@/hooks/services';
import { SPECIALITY_TYPES, ROLES } from '@/lib/constants';
import { useNotificationManager } from '@/components/ui/Notification';
import { AuthorizedRoute } from '@/components/auth';
import { childLogger } from '@/lib/logger';
import { 
  Settings2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Heart, 
  GraduationCap, 
  Home,
  Package,
  Link2,
  X,
} from 'lucide-react';
import { useEffect, useState, useMemo, FormEvent } from 'react';

// Créer un logger avec contexte pour ce composant
const logger = childLogger({ component: 'ServicesManagementPage' });

/**
 * Page de gestion des services
 * Implémente les design patterns :
 * - Custom Hooks Pattern (via useServices, useServiceOptions)
 * - Service Layer Pattern (via les hooks qui appellent les API)
 * - Error Handling Pattern (gestion d'erreurs via les hooks et notifications)
 * - Authorization Pattern (via AuthorizedRoute aligné avec @Authorize decorator backend)
 */
function ServicesManagementPageContent() {
  const { user } = useAuth();
  const notificationManager = useNotificationManager();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'services' | 'options' | 'associations'>('services');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedOption, setSelectedOption] = useState<ServiceOption | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showOptionForm, setShowOptionForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingOption, setEditingOption] = useState<ServiceOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mémoriser le statut admin basé sur les rôles de l'utilisateur
  const isAdminValue = useMemo(() => {
    return user?.roles?.includes(ROLES.ADMIN) || false;
  }, [user?.roles]);
  
  // Mémoriser les options pour éviter les re-renders infinis
  const servicesOptions = useMemo(() => ({
    isActive: isAdminValue ? undefined : true, // Les admins voient tous les services, les autres seulement les actifs
  }), [isAdminValue]);

  const serviceOptionsOptions = useMemo(() => ({
    isActive: isAdminValue ? undefined : true, // Les admins voient toutes les options, les autres seulement les actives
  }), [isAdminValue]);

  // Utiliser le Custom Hook Pattern
  const { services, loading: servicesLoading, error: servicesError, refetch: refetchServices } = useServices(servicesOptions);
  const { options, loading: optionsLoading, error: optionsError, refetch: refetchOptions } = useServiceOptions(serviceOptionsOptions);

  const loading = servicesLoading || optionsLoading;
  const error = servicesError || optionsError;

  // Afficher les erreurs via les notifications
  useEffect(() => {
    if (error) {
      notificationManager.addError(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Filtrer les services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = 
        !searchTerm || 
        service.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !categoryFilter || service.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [services, searchTerm, categoryFilter]);

  // Icône selon la catégorie
  const getCategoryIcon = (category?: string) => {
    if (!category) return Package;
    switch (category) {
      case SPECIALITY_TYPES.HEALTH:
        return Heart;
      case SPECIALITY_TYPES.EDUCATION:
        return GraduationCap;
      case SPECIALITY_TYPES.BTP:
        return Home;
      default:
        return Settings2;
    }
  };

  // Label de catégorie
  const getCategoryLabel = (category?: string) => {
    if (!category) return 'Multi-catégories';
    switch (category) {
      case SPECIALITY_TYPES.HEALTH:
        return 'Santé';
      case SPECIALITY_TYPES.EDUCATION:
        return 'Éducation';
      case SPECIALITY_TYPES.BTP:
        return 'Immobilier & BTP';
      default:
        return category;
    }
  };

  // Couleur de catégorie
  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-800';
    switch (category) {
      case SPECIALITY_TYPES.HEALTH:
        return 'bg-emerald-100 text-emerald-800';
      case SPECIALITY_TYPES.EDUCATION:
        return 'bg-blue-100 text-blue-800';
      case SPECIALITY_TYPES.BTP:
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir les options associées à un service
  const getServiceOptions = (serviceId: string) => {
    return options.filter(opt => opt.associatedServices?.includes(serviceId) || false);
  };

  // Obtenir les services associés à une option
  const getOptionServices = (optionId: string) => {
    return services.filter(svc => svc.associatedOptions?.includes(optionId) || false);
  };

  // Associer une option à un service
  const handleAssociateOption = async (serviceId: string, optionId: string) => {
    try {
      const response = await fetch('/api/services/associations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Inclure les cookies de session
        body: JSON.stringify({ serviceId, optionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'association');
      }

      // Rafraîchir les données
      await Promise.all([refetchServices(), refetchOptions()]);
      notificationManager.addSuccess('Option associée au service avec succès');
    } catch (error: any) {
      notificationManager.addError(error.message || 'Erreur lors de l\'association');
    }
  };

  // Dissocier une option d'un service
  const handleDissociateOption = async (serviceId: string, optionId: string) => {
    try {
      const response = await fetch('/api/services/associations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Inclure les cookies de session
        body: JSON.stringify({ serviceId, optionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la dissociation');
      }

      // Rafraîchir les données
      await Promise.all([refetchServices(), refetchOptions()]);
      notificationManager.addSuccess('Option dissociée du service avec succès');
    } catch (error: any) {
      notificationManager.addError(error.message || 'Erreur lors de la dissociation');
    }
  };

  // Ouvrir le formulaire de création
  const handleCreateService = () => {
    setEditingService(null);
    setShowServiceForm(true);
  };

  // Ouvrir le formulaire de modification
  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  // Fermer le formulaire
  const handleCloseForm = () => {
    setShowServiceForm(false);
    setEditingService(null);
  };

  // Soumettre le formulaire (création ou modification)
  const handleSubmitService = async (formData: {
    id: string;
    category: string;
    label: string;
    description: string;
    price: number;
    isActive: boolean;
    metadata?: Record<string, any>;
    associatedOptions?: string[];
  }) => {
    setIsSubmitting(true);
    try {
      // Vérifier que l'utilisateur est admin avant de soumettre
      if (!isAdminValue) {
        logger.warn({
          userId: user?.id,
          userRoles: user?.roles,
          isAdminValue,
        }, '[ServiceForm] Utilisateur non admin');
        notificationManager.addError('Vous devez être administrateur pour effectuer cette action');
        setIsSubmitting(false);
        return;
      }

      // Log pour déboguer
      logger.debug({
        editingService: !!editingService,
        serviceId: editingService?.id,
        formData,
        userRoles: user?.roles,
      }, '[ServiceForm] Soumission du service');

      const url = editingService 
        ? `/api/services/${editingService.id}`
        : '/api/services';
      
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Inclure les cookies de session
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorData: any = {};
        let responseText = '';
        try {
          responseText = await response.text();
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
            } catch {
              errorData = { rawResponse: responseText };
            }
          } else {
            errorData = { error: 'Réponse vide' };
          }
        } catch (parseError) {
          errorData = { 
            error: 'Erreur lors de la lecture de la réponse',
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
          };
        }
        
        const errorMessage = errorData.error || errorData.message || `Erreur HTTP: ${response.status}`;
        
        // Log détaillé pour le débogage - s'assurer que toutes les valeurs sont définies
        const logData: Record<string, any> = {
          status: response.status,
          statusText: response.statusText || 'Unknown',
          url: url || 'Unknown',
          method: method || 'Unknown',
          errorMessage,
        };
        
        // Ajouter les données d'erreur seulement si elles existent
        if (errorData && Object.keys(errorData).length > 0) {
          logData['errorData'] = errorData;
        }
        if (user?.id) {
          logData['userId'] = user.id;
        }
        if (user?.roles && user.roles.length > 0) {
          logData['userRoles'] = user.roles;
        }
        
        // Logger avec Pino et console.error pour le débogage côté client
        // Pino peut avoir des problèmes de sérialisation côté client, donc on utilise aussi console.error
        logger.error(logData, '[ServiceForm] Erreur API lors de la soumission du service');
        // Log supplémentaire avec console.error pour garantir la visibilité dans la console du navigateur
        console.error('[ServiceForm] Erreur API lors de la soumission du service', {
          ...logData,
          errorDataString: JSON.stringify(errorData),
        });
        
        // Message spécifique pour 403
        if (response.status === 403) {
          throw new Error('Accès refusé. Vous devez être administrateur pour effectuer cette action.');
        }
        
        throw new Error(errorMessage);
      }

      await response.json();
      
      // Rafraîchir les données
      await refetchServices();
      
      notificationManager.addSuccess(
        editingService 
          ? 'Service modifié avec succès'
          : 'Service créé avec succès',
      );
      
      handleCloseForm();
    } catch (error: any) {
      notificationManager.addError(error.message || 'Erreur lors de l\'opération');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer un service
  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.')) {
      return;
    }

    // Vérifier que l'utilisateur est admin avant de supprimer
    if (!isAdminValue) {
      notificationManager.addError('Vous devez être administrateur pour effectuer cette action');
      return;
    }

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Inclure les cookies de session
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Erreur lors de la suppression');
      }

      // Rafraîchir les données
      await refetchServices();
      
      notificationManager.addSuccess('Service supprimé avec succès');
    } catch (error: any) {
      notificationManager.addError(error.message || 'Erreur lors de la suppression');
    }
  };

  // Ouvrir le formulaire de création d'option
  const handleCreateOption = () => {
    setEditingOption(null);
    setShowOptionForm(true);
  };

  // Ouvrir le formulaire de modification d'option
  const handleEditOption = (option: ServiceOption) => {
    setEditingOption(option);
    setShowOptionForm(true);
  };

  // Fermer le formulaire d'option
  const handleCloseOptionForm = () => {
    setShowOptionForm(false);
    setEditingOption(null);
  };

  // Soumettre le formulaire d'option (création ou modification)
  const handleSubmitOption = async (formData: {
    label: string;
    description: string;
    price: number;
    optional: boolean;
    isActive: boolean;
    metadata?: Record<string, any>;
  }) => {
    setIsSubmitting(true);
    try {
      // Vérifier que l'utilisateur est admin avant de soumettre
      if (!isAdminValue) {
        logger.warn({
          userId: user?.id,
          userRoles: user?.roles,
          isAdminValue,
        }, '[OptionForm] Utilisateur non admin');
        notificationManager.addError('Vous devez être administrateur pour effectuer cette action');
        setIsSubmitting(false);
        return;
      }

      const url = editingOption 
        ? `/api/service-options/${editingOption.id}`
        : '/api/service-options';
      
      const method = editingOption ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || `Erreur HTTP: ${response.status}`);
      }

      await response.json();
      
      // Rafraîchir les données
      await refetchOptions();
      
      notificationManager.addSuccess(
        editingOption 
          ? 'Option modifiée avec succès'
          : 'Option créée avec succès',
      );
      
      handleCloseOptionForm();
    } catch (error: any) {
      notificationManager.addError(error.message || 'Erreur lors de l\'opération');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer une option
  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette option ? Cette action est irréversible.')) {
      return;
    }

    // Vérifier que l'utilisateur est admin avant de supprimer
    if (!isAdminValue) {
      notificationManager.addError('Vous devez être administrateur pour effectuer cette action');
      return;
    }

    try {
      const response = await fetch(`/api/service-options/${optionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Erreur lors de la suppression');
      }

      // Rafraîchir les données
      await refetchOptions();
      
      notificationManager.addSuccess('Option supprimée avec succès');
    } catch (error: any) {
      notificationManager.addError(error.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-[hsl(25,100%,53%)]" />
            Gestion des services et options
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les services et leurs options disponibles sur la plateforme
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'services' && (
            <button
              onClick={handleCreateService}
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nouveau service
            </button>
          )}
          {activeTab === 'options' && (
            <button
              onClick={handleCreateOption}
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nouvelle option
            </button>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('services')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'services'
                ? 'border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Services ({services.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('options')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'options'
                ? 'border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Options ({options.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('associations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'associations'
                ? 'border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Associations
            </div>
          </button>
        </nav>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'services' && (
        <>
          {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
            />
          </div>

          {/* Filtre par catégorie */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            title="Filtrer par catégorie"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
          >
            <option value="">Toutes les catégories</option>
            <option value={SPECIALITY_TYPES.HEALTH}>Santé</option>
            <option value={SPECIALITY_TYPES.EDUCATION}>Éducation</option>
            <option value={SPECIALITY_TYPES.BTP}>Immobilier & BTP</option>
          </select>
        </div>
      </div>

      {/* Liste des services */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center">
            <Settings2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun service trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service) => {
                  const CategoryIcon = getCategoryIcon(service.category);
                  return (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100">
                            <CategoryIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {service.label}
                            </div>
                            <div className="text-sm text-gray-500">
                              {service.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getCategoryColor(service.category)}`}>
                          {getCategoryLabel(service.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {service.price === 0 ? (
                          <span className="text-gray-400">Gratuit</span>
                        ) : (
                          <span className="font-medium">{service.price} €</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedService(service);
                              setActiveTab('associations');
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Gérer les options"
                          >
                            <Link2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEditService(service)}
                            className="text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] transition-colors"
                            title="Modifier"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

              {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total services</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{services.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Santé</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {services.filter(s => s.category === SPECIALITY_TYPES.HEALTH).length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Éducation</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {services.filter(s => s.category === SPECIALITY_TYPES.EDUCATION).length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Immobilier & BTP</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {services.filter(s => s.category === SPECIALITY_TYPES.BTP).length}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'options' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Options disponibles</h2>
            {options.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune option disponible</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {options.map((option) => {
                  const associatedServices = getOptionServices(option.id);
                  const associatedServicesCount = associatedServices.length;
                  // Récupérer les catégories uniques des services associés
                  const categories = Array.from(new Set(associatedServices.map(s => s.category))).filter(Boolean);
                  // Utiliser la catégorie de l'option si disponible, sinon la première catégorie des services associés
                  const displayCategory = (option as any)?.category || categories[0];
                  const CategoryIcon = displayCategory ? getCategoryIcon(displayCategory) : Package;
                  return (
                    <div key={option.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100">
                            <CategoryIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{option.label}</h3>
                            {displayCategory ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getCategoryColor(displayCategory)}`}>
                                {getCategoryLabel(displayCategory)}
                                {categories.length > 1 && ` (+${categories.length - 1})`}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 bg-gray-100 text-gray-800">
                                Multi-catégories
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedOption(option);
                            setActiveTab('associations');
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Gérer les services"
                        >
                          <Link2 className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900">{option.price} €</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {associatedServicesCount} service{associatedServicesCount !== 1 ? 's' : ''}
                          </span>
                          {option.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Inactif
                            </span>
                          )}
                        </div>
                      </div>
                      {isAdminValue && (
                        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleEditOption(option)}
                            className="text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] transition-colors"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOption(option.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'associations' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Gestion des associations</h2>
            <p className="text-gray-600">
              Associez ou dissociez des options aux services. Une option peut être utilisée par plusieurs services.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sélection de service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un service
              </label>
              <select
                value={selectedService?.id || ''}
                onChange={(e) => {
                  const service = services.find(s => s.id === e.target.value);
                  setSelectedService(service || null);
                }}
                title="Sélectionner un service"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              >
                <option value="">-- Choisir un service --</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sélection d'option */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner une option
              </label>
              <select
                value={selectedOption?.id || ''}
                onChange={(e) => {
                  const option = options.find(o => o.id === e.target.value);
                  setSelectedOption(option || null);
                }}
                title="Sélectionner une option"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              >
                <option value="">-- Choisir une option --</option>
                {options.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label} ({option.price} €)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions d'association */}
          {selectedService && selectedOption && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    Associer "{selectedOption.label}" à "{selectedService.label}" ?
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Cette option sera disponible lors de la sélection de ce service.
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedService.associatedOptions?.includes(selectedOption.id) ? (
                    <button
                      onClick={() => handleDissociateOption(selectedService.id, selectedOption.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Dissocier
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAssociateOption(selectedService.id, selectedOption.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors"
                    >
                      <Link2 className="h-4 w-4" />
                      Associer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Liste des associations existantes */}
          {selectedService && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Options associées à "{selectedService.label}"
              </h3>
              {getServiceOptions(selectedService.id).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aucune option associée à ce service
                </p>
              ) : (
                <div className="space-y-2">
                  {getServiceOptions(selectedService.id).map(option => (
                    <div key={option.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100">
                          <Package className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-900">+{option.price} €</span>
                        <button
                          onClick={() => handleDissociateOption(selectedService.id, option.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Dissocier"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedOption && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Services associés à "{selectedOption.label}"
              </h3>
              {getOptionServices(selectedOption.id).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Cette option n'est associée à aucun service
                </p>
              ) : (
                <div className="space-y-2">
                  {getOptionServices(selectedOption.id).map(service => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100">
                          <Settings2 className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{service.label}</p>
                          <p className="text-sm text-gray-500">{service.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDissociateOption(service.id, selectedOption.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Dissocier"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de formulaire pour créer/modifier un service */}
      {showServiceForm && (
        <ServiceFormModal
          service={editingService}
          onSave={handleSubmitService}
          onCancel={handleCloseForm}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Modal de formulaire pour créer/modifier une option */}
      {showOptionForm && (
        <OptionFormModal
          option={editingOption}
          onSave={handleSubmitOption}
          onCancel={handleCloseOptionForm}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

/**
 * Page wrapper avec autorisation
 * Utilise AuthorizedRoute pour protéger la route avec les rôles ADMIN
 */
export default function ServicesManagementPage() {
  return (
    <AuthorizedRoute roles={[ROLES.ADMIN]} redirectTo="/dashboard">
      <ServicesManagementPageContent />
    </AuthorizedRoute>
  );
}

/**
 * Composant modal de formulaire pour créer/modifier un service
 * Implémente les design patterns :
 * - Form Pattern (formulaire contrôlé)
 * - Modal Pattern (overlay avec formulaire)
 */
interface ServiceFormModalProps {
  service: Service | null;
  onSave: (data: {
    id: string;
    category: string;
    label: string;
    description: string;
    price: number;
    isActive: boolean;
    metadata?: Record<string, any>;
    associatedOptions?: string[];
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function ServiceFormModal({ service, onSave, onCancel, isSubmitting }: ServiceFormModalProps) {
  const [formData, setFormData] = useState({
    id: service?.id || '',
    category: service?.category || SPECIALITY_TYPES.HEALTH,
    label: service?.label || '',
    description: service?.description || '',
    price: service?.price || 0,
    isActive: (service as any)?.isActive ?? true,
    metadata: (service as any)?.metadata || {},
    associatedOptions: (service as any)?.associatedOptions || [],
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    if (!formData.id.trim()) {
      alert('L\'ID du service est requis');
      return;
    }
    if (!formData.label.trim()) {
      alert('Le libellé est requis');
      return;
    }
    if (!formData.description.trim()) {
      alert('La description est requise');
      return;
    }
    if (formData.price < 0) {
      alert('Le prix doit être positif');
      return;
    }

    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {service ? 'Modifier le service' : 'Créer un nouveau service'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
              title="Fermer"
              aria-label="Fermer le formulaire"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ID du service */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID du service <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              disabled={!!service} // L'ID ne peut pas être modifié
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="ex: consultation-general"
              required
            />
            {service && (
              <p className="mt-1 text-xs text-gray-500">L'ID ne peut pas être modifié</p>
            )}
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              required
              title="Catégorie du service"
              aria-label="Catégorie du service"
            >
              <option value={SPECIALITY_TYPES.HEALTH}>Santé</option>
              <option value={SPECIALITY_TYPES.EDUCATION}>Éducation</option>
              <option value={SPECIALITY_TYPES.BTP}>Immobilier & BTP</option>
            </select>
          </div>

          {/* Libellé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Libellé <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              placeholder="ex: Consultation générale"
              required
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              placeholder="Description du service..."
              rows={4}
              required
              maxLength={1000}
            />
          </div>

          {/* Prix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
            {formData.price === 0 && (
              <p className="mt-1 text-xs text-gray-500">0€ = Sur devis</p>
            )}
          </div>

          {/* Statut actif */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Service actif (visible pour les utilisateurs)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>{service ? 'Modifier' : 'Créer'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Composant modal de formulaire pour créer/modifier une option
 * Implémente les design patterns :
 * - Form Pattern (formulaire contrôlé)
 * - Modal Pattern (overlay avec formulaire)
 */
interface OptionFormModalProps {
  option: ServiceOption | null;
  onSave: (data: {
    label: string;
    description: string;
    price: number;
    optional: boolean;
    isActive: boolean;
    metadata?: Record<string, any>;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function OptionFormModal({ option, onSave, onCancel, isSubmitting }: OptionFormModalProps) {
  const [formData, setFormData] = useState({
    label: option?.label || '',
    description: option?.description || '',
    price: option?.price || 0,
    optional: option?.optional ?? true,
    isActive: (option as any)?.isActive ?? true,
    metadata: (option as any)?.metadata || {},
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    if (!formData.label.trim()) {
      alert('Le libellé est requis');
      return;
    }
    if (!formData.description.trim()) {
      alert('La description est requise');
      return;
    }
    if (formData.price < 0) {
      alert('Le prix doit être positif');
      return;
    }

    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {option ? 'Modifier l\'option' : 'Créer une nouvelle option'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
              title="Fermer"
              aria-label="Fermer le formulaire"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Note sur les catégories */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Cette option peut être associée à plusieurs services de catégories différentes. 
              La catégorie sera déterminée automatiquement selon les services associés.
            </p>
          </div>

          {/* Libellé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Libellé <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              placeholder="ex: Consultation urgente"
              required
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              placeholder="Description de l'option..."
              rows={4}
              required
              maxLength={1000}
            />
          </div>

          {/* Prix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Optionnel */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="optional"
              checked={formData.optional}
              onChange={(e) => setFormData({ ...formData, optional: e.target.checked })}
              className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
            />
            <label htmlFor="optional" className="ml-2 block text-sm text-gray-700">
              Option facultative (l'utilisateur peut choisir de l'ajouter ou non)
            </label>
          </div>

          {/* Statut actif */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActiveOption"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
            />
            <label htmlFor="isActiveOption" className="ml-2 block text-sm text-gray-700">
              Option active (visible pour les utilisateurs)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>{option ? 'Modifier' : 'Créer'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

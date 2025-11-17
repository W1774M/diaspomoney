/**
 * BTP Service - DiaspoMoney
 * Service BTP (Immobilier & Construction) Company-Grade
 * Basé sur la charte de développement
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Repository Pattern
 * - Dependency Injection
 * - Singleton Pattern
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { getQuoteRepository, IQuoteRepository } from '@/repositories';
import { notificationService } from '@/services/notification/notification.service';
import * as Sentry from '@sentry/nextjs';

export interface Property {
  id: string;
  title: string;
  description: string;
  type: 'LAND' | 'HOUSE' | 'APARTMENT' | 'COMMERCIAL' | 'INDUSTRIAL';
  status: 'FOR_SALE' | 'FOR_RENT' | 'SOLD' | 'RENTED' | 'UNDER_CONSTRUCTION';
  price: number;
  currency: string;
  pricePerSqm?: number;
  area: number; // m²
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  yearBuilt?: number;
  location: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    neighborhood?: string;
  };
  features: PropertyFeature[];
  images: PropertyImage[];
  documents: PropertyDocument[];
  owner: {
    id: string;
    name: string;
    type: 'INDIVIDUAL' | 'COMPANY';
    contact: {
      phone: string;
      email: string;
    };
  };
  agent?: {
    id: string;
    name: string;
    company: string;
    phone: string;
    email: string;
  };
  isActive: boolean;
  isFeatured: boolean;
  views: number;
  favorites: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyFeature {
  category: 'GENERAL' | 'EXTERIOR' | 'INTERIOR' | 'UTILITIES' | 'SECURITY';
  name: string;
  value: string;
  icon?: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  type: 'MAIN' | 'GALLERY' | 'FLOOR_PLAN' | 'VIRTUAL_TOUR';
  order: number;
  isActive: boolean;
}

export interface PropertyDocument {
  id: string;
  name: string;
  type: 'TITLE_DEED' | 'SURVEY' | 'PERMIT' | 'CONTRACT' | 'OTHER';
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface Contractor {
  id: string;
  name: string;
  type: 'GENERAL_CONTRACTOR' | 'SPECIALIST' | 'SUPPLIER';
  specialties: string[];
  description: string;
  experience: number; // years
  rating: number;
  reviewCount: number;
  location: {
    city: string;
    country: string;
    serviceRadius: number; // km
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  portfolio: Project[];
  certifications: Certification[];
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  type: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'RENOVATION';
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  budget: number;
  currency: string;
  duration: number; // months
  startDate: Date;
  endDate?: Date;
  images: string[];
  client: {
    name: string;
    type: 'INDIVIDUAL' | 'COMPANY';
  };
  location: {
    city: string;
    country: string;
  };
}

export interface Certification {
  name: string;
  issuer: string;
  issuedAt: Date;
  expiresAt?: Date;
  documentUrl?: string;
}

export interface Material {
  id: string;
  name: string;
  category:
    | 'CONSTRUCTION'
    | 'FINISHING'
    | 'ELECTRICAL'
    | 'PLUMBING'
    | 'ROOFING';
  description: string;
  specifications: Record<string, string>;
  price: number;
  currency: string;
  unit: 'PIECE' | 'SQM' | 'METER' | 'TON' | 'KG';
  supplier: {
    id: string;
    name: string;
    contact: {
      phone: string;
      email: string;
    };
  };
  availability: {
    inStock: boolean;
    quantity?: number;
    leadTime?: number; // days
  };
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConstructionProject {
  id: string;
  name: string;
  description: string;
  type: 'NEW_CONSTRUCTION' | 'RENOVATION' | 'EXTENSION' | 'REPAIR';
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
  budget: number;
  currency: string;
  actualCost?: number;
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date;
  clientId: string;
  contractorId?: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  milestones: ProjectMilestone[];
  materials: ProjectMaterial[];
  documents: ProjectDocument[];
  progress: number; // percentage
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  dueDate: Date;
  completedDate?: Date;
  paymentAmount?: number;
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE';
  dependencies?: string[]; // Other milestone IDs
}

export interface ProjectMaterial {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplier: string;
  status: 'ORDERED' | 'DELIVERED' | 'USED' | 'RETURNED';
  orderDate?: Date;
  deliveryDate?: Date;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'PLAN' | 'PERMIT' | 'INVOICE' | 'RECEIPT' | 'PHOTO' | 'REPORT';
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface BTPFilters {
  query?: string;
  type?: string;
  status?: string;
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  rooms?: number;
  features?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number; // km
  };
}

/**
 * BTPService utilisant le Service Layer Pattern
 * Utilise le Repository Pattern pour l'accès aux données (Dependency Injection)
 */
export class BTPService {
  private static instance: BTPService;
  private quoteRepository: IQuoteRepository;
  private readonly log = childLogger({
    component: 'BTPService',
  });

  private constructor() {
    // Dependency Injection : injecter le repository
    this.quoteRepository = getQuoteRepository();
  }

  static getInstance(): BTPService {
    if (!BTPService.instance) {
      BTPService.instance = new BTPService();
    }
    return BTPService.instance;
  }

  /**
   * Rechercher des propriétés
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BTPService:searchProperties' }) // Cache 5 minutes
  async searchProperties(filters: BTPFilters): Promise<Property[]> {
    try {
      // TODO: Implémenter la recherche avec Elasticsearch
      // const searchQuery = this.buildPropertySearchQuery(filters);
      // const results = await elasticsearch.search(searchQuery);

      // Simulation pour l'instant
      const mockProperties: Property[] = [
        {
          id: 'prop_1',
          title: 'Villa moderne à Dakar',
          description: 'Belle villa de 4 chambres avec jardin et piscine',
          type: 'HOUSE',
          status: 'FOR_SALE',
          price: 150000000,
          currency: 'XOF',
          pricePerSqm: 750000,
          area: 200,
          rooms: 6,
          bedrooms: 4,
          bathrooms: 3,
          floors: 2,
          yearBuilt: 2020,
          location: {
            address: '456 Avenue Léopold Sédar Senghor',
            city: 'Dakar',
            country: 'SN',
            postalCode: '10000',
            coordinates: { latitude: 14.6928, longitude: -17.4467 },
            neighborhood: 'Almadies',
          },
          features: [
            { category: 'GENERAL', name: 'Jardin', value: 'Oui' },
            { category: 'GENERAL', name: 'Piscine', value: 'Oui' },
            { category: 'SECURITY', name: 'Garde', value: '24h/24' },
          ],
          images: [],
          documents: [],
          owner: {
            id: 'owner_1',
            name: 'M. Amadou Diallo',
            type: 'INDIVIDUAL',
            contact: {
              phone: '+221 33 123 45 67',
              email: 'amadou.diallo@email.com',
            },
          },
          isActive: true,
          isFeatured: true,
          views: 156,
          favorites: 23,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'btp_properties_searched',
        value: 1,
        timestamp: new Date(),
        labels: {
          search_type: filters.type || 'all',
          has_location: filters.coordinates ? 'true' : 'false',
          has_price_range:
            filters.minPrice || filters.maxPrice ? 'true' : 'false',
        },
        type: 'counter',
      });

      const result = mockProperties;
      this.log.debug({ count: result.length, filters }, 'Properties searched');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in searchProperties');
      Sentry.captureException(error as Error, {
        tags: { component: 'BTPService', action: 'searchProperties' },
        extra: { filters },
      });
      throw error;
    }
  }

  /**
   * Récupérer une propriété par ID
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BTPService:getProperty' }) // Cache 5 minutes
  async getProperty(_propertyId: string): Promise<Property | null> {
    try {
      // TODO: Récupérer depuis la base de données
      // const property = await Property.findById(propertyId)
      //   .populate('owner')
      //   .populate('agent');

      // Incrémenter le compteur de vues
      // await Property.updateOne(
      //   { _id: propertyId },
      //   { $inc: { views: 1 } }
      // );

      return null;
    } catch (error) {
      this.log.error(
        { error, propertyId: _propertyId },
        'Error in getProperty'
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'BTPService', action: 'getProperty' },
        extra: { propertyId: _propertyId },
      });
      throw error;
    }
  }

  /**
   * Créer une propriété
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BTPService:*') // Invalider le cache après création
  async createProperty(
    propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Property> {
    try {
      const property: Property = {
        ...propertyData,
        id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        views: 0,
        favorites: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: Sauvegarder en base de données
      // await Property.create(property);

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'btp_properties_created',
        value: 1,
        timestamp: new Date(),
        labels: {
          property_type: property.type,
          status: property.status,
        },
        type: 'counter',
      });

      this.log.info(
        { propertyId: property.id, type: property.type },
        'Property created successfully'
      );
      return property;
    } catch (error) {
      this.log.error(
        { error, propertyType: propertyData.type },
        'Error in createProperty'
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'BTPService', action: 'createProperty' },
        extra: { propertyType: propertyData.type },
      });
      throw error;
    }
  }

  /**
   * Rechercher des entrepreneurs
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BTPService:searchContractors' }) // Cache 5 minutes
  async searchContractors(_filters: BTPFilters): Promise<Contractor[]> {
    try {
      // TODO: Implémenter la recherche d'entrepreneurs
      const mockContractors: Contractor[] = [
        {
          id: 'contractor_1',
          name: 'BTP Excellence',
          type: 'GENERAL_CONTRACTOR',
          specialties: ['Construction', 'Rénovation', 'Électricité'],
          description:
            'Entreprise spécialisée dans la construction de maisons modernes',
          experience: 15,
          rating: 4.7,
          reviewCount: 89,
          location: {
            city: 'Dakar',
            country: 'SN',
            serviceRadius: 50,
          },
          contact: {
            phone: '+221 33 987 65 43',
            email: 'contact@btpexcellence.sn',
            website: 'https://btpexcellence.sn',
          },
          portfolio: [],
          certifications: [],
          isActive: true,
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = mockContractors;
      this.log.debug({ count: result.length }, 'Contractors searched');
      return result;
    } catch (error) {
      this.log.error(
        { error, filters: _filters },
        'Error in searchContractors'
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'BTPService', action: 'searchContractors' },
        extra: { filters: _filters },
      });
      throw error;
    }
  }

  /**
   * Rechercher des matériaux
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BTPService:searchMaterials' }) // Cache 5 minutes
  async searchMaterials(_filters: BTPFilters): Promise<Material[]> {
    try {
      // TODO: Implémenter la recherche de matériaux
      const mockMaterials: Material[] = [
        {
          id: 'material_1',
          name: 'Ciment Portland',
          category: 'CONSTRUCTION',
          description: 'Ciment de haute qualité pour construction',
          specifications: {
            Résistance: '32.5 MPa',
            Couleur: 'Gris',
            Poids: '50 kg',
          },
          price: 8500,
          currency: 'XOF',
          unit: 'PIECE',
          supplier: {
            id: 'supplier_1',
            name: 'Matériaux Plus',
            contact: {
              phone: '+221 33 555 12 34',
              email: 'ventes@materiauxplus.sn',
            },
          },
          availability: {
            inStock: true,
            quantity: 500,
            leadTime: 1,
          },
          images: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = mockMaterials;
      this.log.debug({ count: result.length }, 'Materials searched');
      return result;
    } catch (error) {
      this.log.error({ error, filters: _filters }, 'Error in searchMaterials');
      Sentry.captureException(error as Error, {
        tags: { component: 'BTPService', action: 'searchMaterials' },
        extra: { filters: _filters },
      });
      throw error;
    }
  }

  /**
   * Créer un projet de construction
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BTPService:*') // Invalider le cache après création
  async createConstructionProject(
    projectData: Omit<ConstructionProject, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ConstructionProject> {
    try {
      const project: ConstructionProject = {
        ...projectData,
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: Sauvegarder en base de données
      // await ConstructionProject.create(project);

      // Envoyer une notification de création de projet
      await notificationService.sendNotification({
        recipient: project.clientId,
        type: 'PROJECT_CREATED',
        template: 'project_created',
        data: {
          projectName: project.name,
          projectType: project.type,
          expectedEndDate: project.expectedEndDate.toLocaleDateString('fr'),
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
          { type: 'PUSH', enabled: true, priority: 'MEDIUM' },
        ],
        locale: 'fr',
        priority: 'MEDIUM',
      });

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'btp_projects_created',
        value: 1,
        timestamp: new Date(),
        labels: {
          project_type: project.type,
          status: project.status,
        },
        type: 'counter',
      });

      this.log.info(
        {
          projectId: project.id,
          type: project.type,
          clientId: project.clientId,
        },
        'Construction project created successfully'
      );
      return project;
    } catch (error) {
      this.log.error(
        { error, projectType: projectData.type },
        'Error in createConstructionProject'
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'BTPService', action: 'createConstructionProject' },
        extra: { projectType: projectData.type },
      });
      throw error;
    }
  }

  /**
   * Mettre à jour le progrès d'un projet
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BTPService:*') // Invalider le cache après mise à jour
  async updateProjectProgress(
    projectId: string,
    progress: number,
    milestoneId?: string
  ): Promise<void> {
    try {
      // TODO: Mettre à jour le projet
      // await ConstructionProject.updateOne(
      //   { _id: projectId },
      //   {
      //     progress,
      //     updatedAt: new Date()
      //   }
      // );

      // Si un jalon est spécifié, le marquer comme terminé
      if (milestoneId) {
        // await ProjectMilestone.updateOne(
        //   { _id: milestoneId },
        //   {
        //     status: 'COMPLETED',
        //     completedDate: new Date()
        //   }
        // );
      }

      // Envoyer une notification de mise à jour
      // await notificationService.sendProjectUpdateNotification(projectId, progress);

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'btp_project_progress_updated',
        value: progress,
        timestamp: new Date(),
        labels: {
          project_id: projectId,
          milestone_completed: milestoneId ? 'true' : 'false',
        },
        type: 'gauge',
      });
      this.log.info(
        { projectId, progress, milestoneId },
        'Project progress updated'
      );
    } catch (error) {
      this.log.error(
        { error, projectId, progress },
        'Error in updateProjectProgress'
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'BTPService', action: 'updateProjectProgress' },
        extra: { projectId, progress },
      });
      throw error;
    }
  }

  /**
   * Calculer le coût d'un projet
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(600, { prefix: 'BTPService:calculateProjectCost' }) // Cache 10 minutes
  async calculateProjectCost(
    _projectType: string,
    area: number,
    features: string[]
  ): Promise<{
    estimatedCost: number;
    currency: string;
    breakdown: Record<string, number>;
  }> {
    try {
      // TODO: Implémenter le calcul de coût basé sur des données réelles
      const baseCostPerSqm = 150000; // XOF par m²
      const featureMultipliers: Record<string, number> = {
        piscine: 1.2,
        jardin: 1.1,
        garage: 1.15,
        terrasse: 1.05,
      };

      let multiplier = 1;
      for (const feature of features) {
        multiplier *= featureMultipliers[feature] || 1;
      }

      const estimatedCost = area * baseCostPerSqm * multiplier;

      return {
        estimatedCost,
        currency: 'XOF',
        breakdown: {
          'Construction de base': area * baseCostPerSqm,
          Fonctionnalités: estimatedCost - area * baseCostPerSqm,
        },
      };
    } catch (error) {
      this.log.error(
        { error, projectType: _projectType, area },
        'Error in calculateProjectCost'
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'BTPService', action: 'calculateProjectCost' },
        extra: { projectType: _projectType, area },
      });
      throw error;
    }
  }

  /**
   * Créer une demande de devis BTP
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('quote:*')
  async createBTPQuote(data: {
    projectType: string;
    area: number;
    features: string[];
    budget?: number;
    timeline?: string;
    location: {
      city: string;
      country: string;
    };
    contact: {
      name: string;
      email: string;
      phone?: string;
    };
    description?: string;
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
    providerId?: string;
  }): Promise<any> {
    try {
      // Calculer l'estimation
      const costEstimate = await this.calculateProjectCost(
        data.projectType,
        data.area,
        data.features
      );

      // Créer la demande de devis via le repository
      // Construire l'objet de manière conditionnelle pour éviter les erreurs TypeScript avec exactOptionalPropertyTypes
      const quoteData: any = {
        type: 'BTP',
        projectType: data.projectType,
        area: data.area,
        features: data.features,
        location: data.location,
        contact: data.contact,
        urgency: data.urgency || 'MEDIUM',
        costEstimate: costEstimate.estimatedCost,
        status: 'PENDING',
      };

      // Ajouter les champs optionnels seulement s'ils sont définis
      if (data.budget !== undefined) {
        quoteData.budget = data.budget;
      }
      if (data.timeline) {
        quoteData.timeline = data.timeline;
      }
      if (data.description) {
        quoteData.description = data.description;
      }
      if (data.providerId) {
        quoteData.providerId = data.providerId;
      }

      const quote = await this.quoteRepository.create(quoteData);

      // Envoyer une notification
      if (data.contact.email) {
        await notificationService.sendNotification({
          recipient: data.contact.email,
          type: 'QUOTE_REQUEST',
          template: 'quote_request',
          data: {
            quoteId: quote.id,
            projectType: data.projectType,
            estimatedCost: costEstimate.estimatedCost,
          },
          channels: [
            { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
            { type: 'IN_APP', enabled: true, priority: 'MEDIUM' },
          ],
          locale: 'fr',
          priority: 'MEDIUM',
        });
      }

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'btp_quote_requests',
        value: 1,
        timestamp: new Date(),
        labels: {
          project_type: data.projectType,
          urgency: data.urgency || 'MEDIUM',
          has_budget: data.budget ? 'true' : 'false',
        },
        type: 'counter',
      });

      this.log.info(
        { quoteId: quote.id, projectType: data.projectType },
        'BTP quote created successfully'
      );
      return quote;
    } catch (error) {
      this.log.error({ error, data }, 'Error in createBTPQuote');
      Sentry.captureException(error as Error, {
        tags: { component: 'BTPService', action: 'createBTPQuote' },
        extra: { projectType: data.projectType },
      });
      throw error;
    }
  }
}

// Export de l'instance singleton
export const btpService = BTPService.getInstance();

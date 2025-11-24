/**
 * Service Service - DiaspoMoney
 * Service de gestion des services utilisant le Service Layer Pattern
 * Utilise les constantes, types, schémas et mappers centralisés
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { Authorize } from '@/lib/decorators/authorize.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { SPECIALITY_TYPES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import {
  CreateServiceSchema,
  UpdateServiceSchema,
  type CreateServiceInput,
  type UpdateServiceInput,
} from '@/lib/validations/service.schema';
import {
  CreateServiceOptionSchema,
  UpdateServiceOptionSchema,
} from '@/lib/validations/service-options.schema';
import { getServiceRepository, getServiceOptionRepository, IServiceRepository, IServiceOptionRepository } from '@/repositories';
import { z } from 'zod';

export class ServiceService {
  private static instance: ServiceService;
  private serviceRepository: IServiceRepository;
  private serviceOptionRepository: IServiceOptionRepository;

  private constructor() {
    this.serviceRepository = getServiceRepository();
    this.serviceOptionRepository = getServiceOptionRepository();
  }

  static getInstance(): ServiceService {
    if (!ServiceService.instance) {
      ServiceService.instance = new ServiceService();
    }
    return ServiceService.instance;
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: CreateServiceSchema,
        paramName: 'data',
      },
    ],
  })
  @Authorize({ roles: ['ADMIN', 'SUPERADMIN'] })
  @Audit({ eventType: 'SERVICE_CREATED', includeArgs: true })
  @Performance({ warningThreshold: 1000, errorThreshold: 5000 })
  @InvalidateCache('ServiceRepository:*')
  async createService(data: CreateServiceInput) {
    try {
      // Vérifier si le service existe déjà
      const existing = await this.serviceRepository.findByCustomId(data.id);
      if (existing) {
        throw new Error(`Service with id ${data.id} already exists`);
      }

      const service = await this.serviceRepository.create(data as any);
      logger.info({ serviceId: service.id }, 'Service created successfully');
      return service;
    } catch (error) {
      logger.error({ error, data }, 'Error creating service');
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string(),
        paramName: 'id',
      },
      {
        paramIndex: 1,
        schema: UpdateServiceSchema,
        paramName: 'data',
      },
    ],
  })
  @Authorize({ roles: ['ADMIN', 'SUPERADMIN'] })
  @Audit({ eventType: 'SERVICE_UPDATED', includeArgs: true })
  @Performance({ warningThreshold: 1000, errorThreshold: 5000 })
  @InvalidateCache('ServiceRepository:*')
  async updateService(id: string, data: UpdateServiceInput) {
    try {
      const service = await this.serviceRepository.update(id, data as any);
      logger.info({ serviceId: id }, 'Service updated successfully');
      return service;
    } catch (error) {
      logger.error({ error, id, data }, 'Error updating service');
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Authorize({ roles: ['ADMIN', 'SUPERADMIN'] })
  @Audit({ eventType: 'SERVICE_DELETED', includeArgs: true })
  @Performance({ warningThreshold: 1000, errorThreshold: 5000 })
  @InvalidateCache('ServiceRepository:*')
  async deleteService(id: string) {
    try {
      const deleted = await this.serviceRepository.delete(id);
      logger.info({ serviceId: id }, 'Service deleted successfully');
      return deleted;
    } catch (error) {
      logger.error({ error, id }, 'Error deleting service');
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceService:getService' })
  async getService(id: string) {
    try {
      const service = await this.serviceRepository.findByCustomId(id) || 
                      await this.serviceRepository.findById(id);
      return service;
    } catch (error) {
      logger.error({ error, id }, 'Error getting service');
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Performance({ warningThreshold: 500, errorThreshold: 2000 })
  @Cacheable(300, { prefix: 'ServiceService:getAllServices' })
  async getAllServices(filters?: { category?: typeof SPECIALITY_TYPES[keyof typeof SPECIALITY_TYPES]; isActive?: boolean }) {
    try {
      if (filters?.category) {
        return await this.serviceRepository.findByCategory(filters.category as 'HEALTH' | 'EDUCATION' | 'BTP');
      }
      if (filters?.isActive !== undefined) {
        return filters.isActive 
          ? await this.serviceRepository.findActive()
          : await this.serviceRepository.findAll({ isActive: false });
      }
      return await this.serviceRepository.findAll();
    } catch (error) {
      logger.error({ error, filters }, 'Error getting services');
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: CreateServiceOptionSchema,
        paramName: 'data',
      },
    ],
  })
  @Authorize({ roles: ['ADMIN', 'SUPERADMIN'] })
  @Audit({ eventType: 'SERVICE_OPTION_CREATED', includeArgs: true })
  @Performance({ warningThreshold: 1000, errorThreshold: 5000 })
  @InvalidateCache('ServiceOptionRepository:*')
  async createServiceOption(data: z.infer<typeof CreateServiceOptionSchema>) {
    try {
      // Générer un ID si non fourni
      const optionId = `${data.category.toLowerCase()  }-${  data.label.toLowerCase().replace(/\s+/g, '-')}`;
      const option = await this.serviceOptionRepository.create({
        ...data,
        id: optionId,
      } as any);
      logger.info({ optionId: option.id }, 'Service option created successfully');
      return option;
    } catch (error) {
      logger.error({ error, data }, 'Error creating service option');
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string(),
        paramName: 'id',
      },
      {
        paramIndex: 1,
        schema: UpdateServiceOptionSchema,
        paramName: 'data',
      },
    ],
  })
  @Authorize({ roles: ['ADMIN', 'SUPERADMIN'] })
  @Audit({ eventType: 'SERVICE_OPTION_UPDATED', includeArgs: true })
  @Performance({ warningThreshold: 1000, errorThreshold: 5000 })
  @InvalidateCache('ServiceOptionRepository:*')
  async updateServiceOption(id: string, data: z.infer<typeof UpdateServiceOptionSchema>) {
    try {
      const option = await this.serviceOptionRepository.update(id, data as any);
      logger.info({ optionId: id }, 'Service option updated successfully');
      return option;
    } catch (error) {
      logger.error({ error, id, data }, 'Error updating service option');
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Authorize({ roles: ['ADMIN', 'SUPERADMIN'] })
  @Audit({ eventType: 'SERVICE_OPTION_DELETED', includeArgs: true })
  @Performance({ warningThreshold: 1000, errorThreshold: 5000 })
  @InvalidateCache('ServiceOptionRepository:*')
  async deleteServiceOption(id: string) {
    try {
      const deleted = await this.serviceOptionRepository.delete(id);
      logger.info({ optionId: id }, 'Service option deleted successfully');
      return deleted;
    } catch (error) {
      logger.error({ error, id }, 'Error deleting service option');
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceService:getAllOptions' })
  async getAllOptions(filters?: { category?: typeof SPECIALITY_TYPES[keyof typeof SPECIALITY_TYPES]; isActive?: boolean }) {
    try {
      if (filters?.category) {
        return await this.serviceOptionRepository.findByCategory(filters.category as 'HEALTH' | 'EDUCATION' | 'BTP');
      }
      if (filters?.isActive !== undefined) {
        return filters.isActive 
          ? await this.serviceOptionRepository.findActive()
          : await this.serviceOptionRepository.findAll({ isActive: false });
      }
      return await this.serviceOptionRepository.findAll();
    } catch (error) {
      logger.error({ error, filters }, 'Error getting service options');
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Authorize({ roles: ['ADMIN', 'SUPERADMIN'] })
  @Audit({ eventType: 'SERVICE_OPTION_ASSOCIATED', includeArgs: true })
  @Performance({ warningThreshold: 1000, errorThreshold: 5000 })
  @InvalidateCache('ServiceRepository:*')
  @InvalidateCache('ServiceOptionRepository:*')
  async associateOptionToService(serviceId: string, optionId: string) {
    try {
      await this.serviceOptionRepository.associateToService(optionId, serviceId);
      logger.info({ serviceId, optionId }, 'Option associated to service successfully');
    } catch (error) {
      logger.error({ error, serviceId, optionId }, 'Error associating option to service');
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Authorize({ roles: ['ADMIN', 'SUPERADMIN'] })
  @Audit({ eventType: 'SERVICE_OPTION_DISSOCIATED', includeArgs: true })
  @Performance({ warningThreshold: 1000, errorThreshold: 5000 })
  @InvalidateCache('ServiceRepository:*')
  @InvalidateCache('ServiceOptionRepository:*')
  async dissociateOptionFromService(serviceId: string, optionId: string) {
    try {
      await this.serviceOptionRepository.dissociateFromService(optionId, serviceId);
      logger.info({ serviceId, optionId }, 'Option dissociated from service successfully');
    } catch (error) {
      logger.error({ error, serviceId, optionId }, 'Error dissociating option from service');
      throw error;
    }
  }
}

export const serviceService = ServiceService.getInstance();


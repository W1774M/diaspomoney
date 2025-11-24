/**
 * Types pour les options de service
 */

export interface ServiceOption {
  id: string;
  category: string;
  label: string;
  description: string;
  price: number;
  optional: boolean;
  isActive?: boolean;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceOptionAssociation {
  serviceId: string;
  optionId: string;
  isDefault: boolean;
  order?: number;
}

export interface ServiceWithOptions {
  service: {
    id: string;
    category: string;
    label: string;
    description: string;
    price: number;
    optional: boolean;
  };
  options: Array<{
    option: ServiceOption;
    isDefault: boolean;
    order?: number;
  }>;
}

export interface OptionWithServices {
  option: ServiceOption;
  services: Array<{
    serviceId: string;
    serviceLabel: string;
    isDefault: boolean;
    order?: number;
  }>;
}


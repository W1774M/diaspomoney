/**
 * Types pour les règles de disponibilité (Availability Rules)
 */

import { BaseEntity } from './index';

export type AvailabilityRuleType = 'weekly' | 'monthly' | 'custom';

export interface AvailabilityTimeSlot {
  id?: string | undefined; // Compatible avec exactOptionalPropertyTypes
  dayOfWeek: number; // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  startTime: string; // Format "HH:mm"
  endTime: string; // Format "HH:mm"
  isActive: boolean;
  start?: string | undefined; // Alias pour startTime (compatibilité)
  end?: string | undefined; // Alias pour endTime (compatibilité)
}

export interface AvailabilityRule extends BaseEntity {
  id: string;
  _id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  type: AvailabilityRuleType;
  isActive: boolean;
  startDate?: string | undefined; // Format "YYYY-MM-DD" (pour monthly et custom)
  endDate?: string | undefined; // Format "YYYY-MM-DD" (pour monthly et custom)
  timeSlots: AvailabilityTimeSlot[];
  // Propriétés de compatibilité avec le type Availability
  monday: AvailabilityTimeSlot[];
  tuesday: AvailabilityTimeSlot[];
  wednesday: AvailabilityTimeSlot[];
  thursday: AvailabilityTimeSlot[];
  friday: AvailabilityTimeSlot[];
  saturday: AvailabilityTimeSlot[];
  sunday: AvailabilityTimeSlot[];
  timezone?: string | undefined;
}

export interface CreateAvailabilityRuleData {
  name: string;
  type: AvailabilityRuleType;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  timeSlots: AvailabilityTimeSlot[];
  timezone?: string;
}

export interface UpdateAvailabilityRuleData {
  name?: string;
  type?: AvailabilityRuleType;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  timeSlots?: AvailabilityTimeSlot[];
  timezone?: string;
}


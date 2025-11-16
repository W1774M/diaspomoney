/**
 * Interface du repository pour les devis
 */

import { IRepository } from './IRepository';

export interface Quote {
  _id?: string;
  id: string;
  type: 'BTP' | 'EDUCATION';
  projectType?: string; // Pour BTP
  area?: number; // Pour BTP
  features?: string[]; // Pour BTP
  budget?: number;
  timeline?: string;
  location?: {
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
  costEstimate?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  providerId?: string; // Pour BTP
  schoolId?: string; // Pour EDUCATION
  // Champs spécifiques EDUCATION
  studentType?: 'SELF' | 'CHILD' | 'DEPENDENT';
  studentInfo?: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    nationality?: string;
  };
  academicInfo?: {
    currentLevel?: string;
    desiredProgram?: string;
    academicYear?: string;
    previousEducation?: string;
  };
  preferences?: {
    language?: string;
    schedule?: string;
    budget?: number;
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  questions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteFilters {
  type?: 'BTP' | 'EDUCATION';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  providerId?: string;
  schoolId?: string;
  contactEmail?: string;
  [key: string]: any;
}

export interface IQuoteRepository extends IRepository<Quote, string> {
  /**
   * Trouver des devis par type
   */
  findByType(type: 'BTP' | 'EDUCATION'): Promise<Quote[]>;

  /**
   * Trouver des devis par statut
   */
  findByStatus(
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  ): Promise<Quote[]>;

  /**
   * Trouver des devis par email de contact
   */
  findByContactEmail(email: string): Promise<Quote[]>;
}

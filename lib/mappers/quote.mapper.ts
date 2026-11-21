/**
 * Mappers pour les devis/quotes
 * Transforme les documents quote en réponses API
 */

import type { IMapper, MappingOptions } from '@/lib/types';
import type { Quote } from '@/lib/types/quotes.types';

/**
 * Type pour un document Quote MongoDB
 */
export interface QuoteDocument {
  _id?: any;
  id?: string;
  type?: 'BTP' | 'EDUCATION';
  projectType?: string;
  area?: number;
  features?: string[];
  budget?: number;
  timeline?: string;
  location?: {
    city?: string;
    country?: string;
  };
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  description?: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  costEstimate?: number;
  status?: string;
  providerId?: string;
  schoolId?: string;
  studentType?: 'SELF' | 'CHILD' | 'DEPENDENT';
  studentInfo?: {
    firstName?: string;
    lastName?: string;
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
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

/**
 * Type pour une réponse API de quote
 */
export interface QuoteResponse {
  id: string;
  _id: string;
  type: 'BTP' | 'EDUCATION';
  projectType?: string;
  area?: number;
  features?: string[];
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
  status: Quote['status'];
  providerId?: string;
  schoolId?: string;
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
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convertit une date en ISO string de manière sécurisée
 */
function toISOString(date: Date | string | undefined | null): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  try {
    return new Date(date as string | number).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Mappe le statut
 */
function mapStatus(status: string | undefined): Quote['status'] {
  if (!status) return 'PENDING';
  
  const statusMap: Record<string, Quote['status']> = {
    pending: 'PENDING',
    approved: 'APPROVED',
    rejected: 'REJECTED',
    expired: 'EXPIRED',
  };
  
  const normalizedStatus = status.toUpperCase();
  return (statusMap[normalizedStatus.toLowerCase()] || normalizedStatus) as Quote['status'];
}

/**
 * Classe QuoteMapper implémentant IMapper
 */
export class QuoteMapper implements IMapper<QuoteDocument, QuoteResponse> {
  /**
   * Transforme un document quote vers une réponse API
   */
  map(input: QuoteDocument, options?: MappingOptions): QuoteResponse {
    return mapQuoteToResponse(input, options);
  }

  /**
   * Transforme un tableau de documents quote
   */
  mapMany(inputs: QuoteDocument[], options?: MappingOptions): QuoteResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Instance singleton du mapper
 */
export const quoteMapper = new QuoteMapper();

/**
 * Mappe un document quote vers une réponse API
 * 
 * @param quoteDoc - Document quote depuis le repository
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapQuoteToResponse(
  quoteDoc: QuoteDocument,
  _options?: MappingOptions,
): QuoteResponse {
  // Extraire l'ID
  const id = quoteDoc.id || quoteDoc._id?.toString() || '';
  const _id = quoteDoc._id?.toString() || id;

  // Construire l'objet de base
  const baseResponse: QuoteResponse = {
    id,
    _id,
    type: quoteDoc.type || 'BTP',
    contact: {
      name: quoteDoc.contact?.name || '',
      email: quoteDoc.contact?.email || '',
      ...(quoteDoc.contact?.phone && { phone: quoteDoc.contact.phone }),
    },
    status: mapStatus(quoteDoc.status),
    createdAt: toISOString(quoteDoc.createdAt),
    updatedAt: toISOString(quoteDoc.updatedAt),
  };

  // Ajouter les propriétés optionnelles seulement si elles ont une valeur
  if (quoteDoc.projectType) baseResponse.projectType = quoteDoc.projectType;
  if (quoteDoc.area !== undefined) baseResponse.area = quoteDoc.area;
  if (quoteDoc.features && quoteDoc.features.length > 0) baseResponse.features = quoteDoc.features;
  if (quoteDoc.budget !== undefined) baseResponse.budget = quoteDoc.budget;
  if (quoteDoc.timeline) baseResponse.timeline = quoteDoc.timeline;
  if (quoteDoc.location) {
    baseResponse.location = {
      city: quoteDoc.location.city || '',
      country: quoteDoc.location.country || '',
    };
  }
  if (quoteDoc.description) baseResponse.description = quoteDoc.description;
  if (quoteDoc.urgency) baseResponse.urgency = quoteDoc.urgency;
  if (quoteDoc.costEstimate !== undefined) baseResponse.costEstimate = quoteDoc.costEstimate;
  if (quoteDoc.providerId) baseResponse.providerId = quoteDoc.providerId;
  if (quoteDoc.schoolId) baseResponse.schoolId = quoteDoc.schoolId;
  if (quoteDoc.studentType) baseResponse.studentType = quoteDoc.studentType;
  if (quoteDoc.studentInfo && quoteDoc.studentInfo.firstName && quoteDoc.studentInfo.lastName) {
    baseResponse.studentInfo = {
      firstName: quoteDoc.studentInfo.firstName,
      lastName: quoteDoc.studentInfo.lastName,
      ...(quoteDoc.studentInfo.dateOfBirth && { dateOfBirth: quoteDoc.studentInfo.dateOfBirth }),
      ...(quoteDoc.studentInfo.gender && { gender: quoteDoc.studentInfo.gender }),
      ...(quoteDoc.studentInfo.nationality && { nationality: quoteDoc.studentInfo.nationality }),
    };
  }
  if (quoteDoc.academicInfo) baseResponse.academicInfo = quoteDoc.academicInfo;
  if (quoteDoc.preferences) baseResponse.preferences = quoteDoc.preferences;
  if (quoteDoc.questions) baseResponse.questions = quoteDoc.questions;
  if (quoteDoc.metadata) baseResponse.metadata = quoteDoc.metadata;

  return baseResponse;
}


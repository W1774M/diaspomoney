/**
 * Mappers pour les réclamations/complaints
 * Transforme les documents complaint en réponses API
 */

import type { IMapper, MappingOptions } from '@/lib/types';
import type { ComplaintStatus, ComplaintType, ComplaintPriority } from '@/lib/types/complaints.types';
// Complaint type is used in the function signatures

/**
 * Type pour un document Complaint MongoDB
 */
export interface ComplaintDocument {
  _id?: any;
  id?: string;
  title?: string;
  type?: string;
  priority?: string;
  status?: string;
  description?: string;
  provider?: string;
  appointmentId?: string;
  userId?: string;
  comments?: Array<{
    userId?: string;
    text?: string;
    createdAt?: Date | string;
  }>;
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

/**
 * Type pour une réponse API de complaint
 */
export interface ComplaintResponse {
  id: string;
  _id: string;
  title: string;
  type: ComplaintType;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  description: string;
  provider: string;
  appointmentId: string;
  userId: string;
  comments?: Array<{
    userId: string;
    text: string;
    createdAt: string;
  }>;
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
 * Mappe le type de complaint
 */
function mapType(type: string | undefined): ComplaintType {
  if (!type) return 'QUALITY';
  
  const typeMap: Record<string, ComplaintType> = {
    quality: 'QUALITY',
    delay: 'DELAY',
    billing: 'BILLING',
    communication: 'COMMUNICATION',
  };
  
  const normalizedType = type.toUpperCase();
  return (typeMap[normalizedType.toLowerCase()] || normalizedType) as ComplaintType;
}

/**
 * Mappe la priorité
 */
function mapPriority(priority: string | undefined): ComplaintPriority {
  if (!priority) return 'MEDIUM';
  
  const priorityMap: Record<string, ComplaintPriority> = {
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
  };
  
  const normalizedPriority = priority.toUpperCase();
  return (priorityMap[normalizedPriority.toLowerCase()] || normalizedPriority) as ComplaintPriority;
}

/**
 * Mappe le statut
 */
function mapStatus(status: string | undefined): ComplaintStatus {
  if (!status) return 'OPEN';
  
  const statusMap: Record<string, ComplaintStatus> = {
    open: 'OPEN',
    in_progress: 'IN_PROGRESS',
    inprogress: 'IN_PROGRESS',
    resolved: 'RESOLVED',
    closed: 'CLOSED',
  };
  
  const normalizedStatus = status.toUpperCase().replace(' ', '_');
  return (statusMap[normalizedStatus.toLowerCase()] || normalizedStatus) as ComplaintStatus;
}

/**
 * Classe ComplaintMapper implémentant IMapper
 */
export class ComplaintMapper implements IMapper<ComplaintDocument, ComplaintResponse> {
  /**
   * Transforme un document complaint vers une réponse API
   */
  map(input: ComplaintDocument, options?: MappingOptions): ComplaintResponse {
    return mapComplaintToResponse(input, options);
  }

  /**
   * Transforme un tableau de documents complaint
   */
  mapMany(inputs: ComplaintDocument[], options?: MappingOptions): ComplaintResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Instance singleton du mapper
 */
export const complaintMapper = new ComplaintMapper();

/**
 * Mappe un document complaint vers une réponse API
 * 
 * @param complaintDoc - Document complaint depuis le repository
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapComplaintToResponse(
  complaintDoc: ComplaintDocument,
  _options?: MappingOptions,
): ComplaintResponse {
  // Extraire l'ID
  const id = complaintDoc.id || complaintDoc._id?.toString() || '';
  const _id = complaintDoc._id?.toString() || id;

  // Mapper les comments
  const comments = (complaintDoc.comments || []).map(comment => ({
    userId: comment.userId || '',
    text: comment.text || '',
    createdAt: toISOString(comment.createdAt),
  }));

  return {
    id,
    _id,
    title: complaintDoc.title || '',
    type: mapType(complaintDoc.type),
    priority: mapPriority(complaintDoc.priority),
    status: mapStatus(complaintDoc.status),
    description: complaintDoc.description || '',
    provider: complaintDoc.provider || '',
    appointmentId: complaintDoc.appointmentId || '',
    userId: complaintDoc.userId || '',
    ...(comments.length > 0 && { comments }),
    ...(complaintDoc.metadata && { metadata: complaintDoc.metadata }),
    createdAt: toISOString(complaintDoc.createdAt),
    updatedAt: toISOString(complaintDoc.updatedAt),
  };
}


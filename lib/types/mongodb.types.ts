/**
 * Types pour les documents MongoDB
 */

import type { BaseEntity } from './index';

/**
 * Type générique pour un document MongoDB brut
 * Utilisé pour typer les documents retournés par Mongoose avant mapping
 */
export interface MongoDocument<_T extends BaseEntity = BaseEntity> {
  _id: any; // ObjectId de MongoDB
  [key: string]: any; // Propriétés dynamiques du document
}

/**
 * Type pour un document MongoDB avec conversion d'ObjectId en string
 */
export interface MongoDocumentWithStringId<T extends BaseEntity> extends Omit<MongoDocument<T>, '_id'> {
  _id: string;
  id?: string; // Alias optionnel pour _id
}

/**
 * Type helper pour mapper un document MongoDB vers une entité
 */
export type MapMongoDocument<T extends BaseEntity> = (doc: MongoDocument<T>) => T;


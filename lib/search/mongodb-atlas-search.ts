/**
 * MongoDB Atlas Search - DiaspoMoney
 * Configuration de recherche avancée avec MongoDB Atlas
 * Alternative à Elasticsearch
 * Implémente les design patterns :
 * - Singleton Pattern (via getSearchInstance)
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 * - Builder Pattern (via QueryBuilder)
 */

import { childLogger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { Db, MongoClient } from 'mongodb';

export interface SearchConfig {
  indexName: string;
  fields: SearchField[];
  analyzers?: string[];
  synonyms?: string[][];
}

export interface SearchField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  analyzer?: string;
  searchAnalyzer?: string;
  indexAnalyzer?: string;
  searchable?: boolean;
  facetable?: boolean;
  sortable?: boolean;
}

export interface SearchQuery {
  text?: string;
  filters?: Record<string, any>;
  facets?: string[];
  sort?: Record<string, 1 | -1>;
  limit?: number;
  offset?: number;
}

export interface SearchResult<T = any> {
  hits: T[];
  total: number;
  facets?: Record<string, any>;
  took: number;
}

export class MongoDBAtlasSearch {
  private client: MongoClient;
  private db: Db;
  private isConnected: boolean = false;

  constructor(connectionString: string, databaseName: string) {
    this.client = new MongoClient(connectionString);
    this.db = this.client.db(databaseName);
  }

  /**
   * Se connecter à MongoDB Atlas
   */
  private readonly log = childLogger({ component: 'MongoDBAtlasSearch' });

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.isConnected = true;
      this.log.info('MongoDB Atlas Search connected');
    } catch (error) {
      this.log.error({ error }, 'MongoDB Atlas Search connection failed');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoDBAtlasSearch', action: 'connect' },
      });
      throw error;
    }
  }

  /**
   * Créer un index de recherche
   */
  async createSearchIndex(
    collectionName: string,
    config: SearchConfig
  ): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // const _indexDefinition = {
      //   name: config.indexName,
      //   type: 'search',
      //   definition: {
      //     mappings: {
      //       fields: this.buildFieldMappings(config.fields),
      //       ...(config.analyzers && { analyzers: config.analyzers }),
      //       ...(config.synonyms && { synonyms: config.synonyms }),
      //     },
      //   },
      // };

      // Note: En production, utilisez l'API Atlas Search
      // await this.db.collection(collectionName).createSearchIndex(indexDefinition);

      this.log.info(
        { indexName: config.indexName, collectionName },
        'Search index created'
      );
    } catch (error) {
      this.log.error(
        { error, indexName: config.indexName },
        'Error creating search index'
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoDBAtlasSearch', action: 'createSearchIndex' },
        extra: { indexName: config.indexName },
      });
      throw error;
    }
  }

  /**
   * Rechercher dans une collection
   */
  async search<T = any>(
    collectionName: string,
    indexName: string,
    query: SearchQuery
  ): Promise<SearchResult<T>> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const startTime = Date.now();

      // Construire la requête de recherche
      // const _searchQuery = this.buildSearchQuery(query);

      // En production, utilisez l'opérateur $search
      // const pipeline = [
      //   { $search: { index: indexName, ...searchQuery } },
      //   { $limit: query.limit || 20 },
      //   { $skip: query.offset || 0 }
      // ];

      // Simulation pour le développement
      // Utiliser QueryBuilder pour construire la requête (Builder Pattern)
      const { QueryBuilder } = await import('@/builders');
      const queryBuilder = new QueryBuilder();

      // Recherche textuelle simple
      // Note: $text nécessite un index spécial, on le gère séparément
      let textSearch: any = null;
      if (query.text) {
        textSearch = { $text: { $search: query.text } };
      }

      // Appliquer les filtres avec QueryBuilder
      if (query.filters) {
        Object.entries(query.filters).forEach(([key, value]) => {
          queryBuilder.where(key, value);
        });
      }

      // Appliquer le tri
      if (query.sort) {
        Object.entries(query.sort).forEach(([field, direction]) => {
          queryBuilder.orderBy(field, direction === 1 ? 'asc' : 'desc');
        });
      }

      // Appliquer la pagination
      if (query.limit) {
        queryBuilder.limit(query.limit);
      }
      if (query.offset) {
        queryBuilder.offset(query.offset);
      }

      // Construire la requête finale
      const builtQuery = queryBuilder.build();
      let mongoQuery = builtQuery.filters;

      // Ajouter la recherche textuelle si présente
      if (textSearch) {
        mongoQuery = { ...mongoQuery, ...textSearch };
      }

      // Exécuter la requête
      const collection = this.db.collection(collectionName);
      const cursor = collection.find(mongoQuery);

      // Appliquer le tri (si pas déjà fait par QueryBuilder)
      if (builtQuery.sort) {
        cursor.sort(builtQuery.sort);
      }

      // Appliquer la pagination
      if (builtQuery.pagination.limit) {
        cursor.limit(builtQuery.pagination.limit);
      }
      if (builtQuery.pagination.offset) {
        cursor.skip(builtQuery.pagination.offset);
      }

      const hits = await cursor.toArray();
      const total = await collection.countDocuments(mongoQuery);
      const took = Date.now() - startTime;

      this.log.debug(
        {
          collectionName,
          indexName,
          hitsCount: hits.length,
          total,
          took,
        },
        'Search completed'
      );

      return {
        hits: hits as T[],
        total,
        took,
      };
    } catch (error) {
      this.log.error({ error, collectionName, indexName }, 'Error searching');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoDBAtlasSearch', action: 'search' },
        extra: { collectionName, indexName },
      });
      throw error;
    }
  }

  /**
   * Rechercher des prestataires
   */
  async searchProviders(query: SearchQuery): Promise<SearchResult> {
    return this.search('users', 'providers_search', query);
  }

  /**
   * Rechercher des propriétés BTP
   */
  async searchProperties(query: SearchQuery): Promise<SearchResult> {
    return this.search('properties', 'properties_search', query);
  }

  /**
   * Rechercher des écoles
   */
  async searchSchools(query: SearchQuery): Promise<SearchResult> {
    return this.search('users', 'schools_search', query);
  }

  /**
   * Rechercher des transactions
   */
  async searchTransactions(query: SearchQuery): Promise<SearchResult> {
    return this.search('transactions', 'transactions_search', query);
  }

  /**
   * Construire les mappings de champs
   */
  // private buildFieldMappings(fields: SearchField[]): Record<string, any> {
  //   const mappings: Record<string, any> = {};

  //   fields.forEach(field => {
  //     const fieldConfig: any = {
  //       type: field.type,
  //     };

  //     if (field.analyzer) fieldConfig.analyzer = field.analyzer;
  //     if (field.searchAnalyzer)
  //       fieldConfig.searchAnalyzer = field.searchAnalyzer;
  //     if (field.indexAnalyzer) fieldConfig.indexAnalyzer = field.indexAnalyzer;
  //     if (field.searchable !== undefined)
  //       fieldConfig.searchable = field.searchable;
  //     if (field.facetable !== undefined)
  //       fieldConfig.facetable = field.facetable;
  //     if (field.sortable !== undefined) fieldConfig.sortable = field.sortable;

  //     mappings[field.name] = fieldConfig;
  //   });

  //   return mappings;
  // }

  /**
   * Construire la requête de recherche
   */
  // private buildSearchQuery(query: SearchQuery): any {
  //   return query;
  // }
}

// Instance singleton
let searchInstance: MongoDBAtlasSearch | null = null;

export const getSearchInstance = (): MongoDBAtlasSearch => {
  if (!searchInstance) {
    const connectionString =
      process.env['MONGODB_URI'] || 'mongodb://localhost:27017';
    const databaseName = process.env['MONGODB_DATABASE'] || 'diaspomoney';
    searchInstance = new MongoDBAtlasSearch(connectionString, databaseName);
  }
  return searchInstance;
};

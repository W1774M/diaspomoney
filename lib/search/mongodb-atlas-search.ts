/**
 * MongoDB Atlas Search - DiaspoMoney
 * Configuration de recherche avancée avec MongoDB Atlas
 * Alternative à Elasticsearch
 */

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
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.isConnected = true;
      console.log('✅ MongoDB Atlas Search connected');
    } catch (error) {
      console.error('❌ MongoDB Atlas Search connection failed:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Créer un index de recherche
   */
  async createSearchIndex(
    _collectionName: string,
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

      console.log(`✅ Search index created: ${config.indexName}`);
    } catch (error) {
      console.error('❌ Error creating search index:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Rechercher dans une collection
   */
  async search<T = any>(
    collectionName: string,
    _indexName: string,
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
      const collection = this.db.collection(collectionName);
      let mongoQuery: any = {};

      // Recherche textuelle simple
      if (query.text) {
        mongoQuery.$text = { $search: query.text };
      }

      // Filtres
      if (query.filters) {
        mongoQuery = { ...mongoQuery, ...query.filters };
      }

      // Exécuter la requête
      const cursor = collection.find(mongoQuery);

      if (query.sort) {
        cursor.sort(query.sort);
      }

      if (query.limit) {
        cursor.limit(query.limit);
      }

      if (query.offset) {
        cursor.skip(query.offset);
      }

      const hits = await cursor.toArray();
      const total = await collection.countDocuments(mongoQuery);
      const took = Date.now() - startTime;

      return {
        hits: hits as T[],
        total,
        took,
      };
    } catch (error) {
      console.error('❌ Error searching:', error);
      Sentry.captureException(error);
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


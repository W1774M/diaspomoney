/**
 * QueryBuilder - Implémentation du Builder Pattern pour construire des requêtes MongoDB
 * Permet la construction fluide et lisible de requêtes complexes
 */

export type SortDirection = 1 | -1 | 'asc' | 'desc';

export interface QueryOptions {
  filters: Record<string, any>;
  sort: Record<string, 1 | -1>;
  pagination: {
    limit?: number;
    offset?: number;
    page?: number;
  };
}

/**
 * Builder pour construire des requêtes MongoDB de manière fluide
 */
export class QueryBuilder {
  private filters: Record<string, any> = {};
  private sort: Record<string, 1 | -1> = {};
  private pagination: {
    limit?: number;
    offset?: number;
    page?: number;
  } = {};

  /**
   * Ajouter un filtre d'égalité
   */
  where(field: string, value: any): this {
    this.filters[field] = value;
    return this;
  }

  /**
   * Ajouter un filtre avec opérateur MongoDB
   */
  whereOperator(field: string, operator: string, value: any): this {
    if (!this.filters[field]) {
      this.filters[field] = {};
    }
    this.filters[field][operator] = value;
    return this;
  }

  /**
   * Ajouter un filtre $in
   */
  whereIn(field: string, values: any[]): this {
    this.filters[field] = { $in: values };
    return this;
  }

  /**
   * Ajouter un filtre $nin (not in)
   */
  whereNotIn(field: string, values: any[]): this {
    this.filters[field] = { $nin: values };
    return this;
  }

  /**
   * Ajouter un filtre $gt (greater than)
   */
  whereGreaterThan(field: string, value: number | Date): this {
    return this.whereOperator(field, '$gt', value);
  }

  /**
   * Ajouter un filtre $gte (greater than or equal)
   */
  whereGreaterThanOrEqual(field: string, value: number | Date): this {
    return this.whereOperator(field, '$gte', value);
  }

  /**
   * Ajouter un filtre $lt (less than)
   */
  whereLessThan(field: string, value: number | Date): this {
    return this.whereOperator(field, '$lt', value);
  }

  /**
   * Ajouter un filtre $lte (less than or equal)
   */
  whereLessThanOrEqual(field: string, value: number | Date): this {
    return this.whereOperator(field, '$lte', value);
  }

  /**
   * Ajouter un filtre $ne (not equal)
   */
  whereNotEqual(field: string, value: any): this {
    return this.whereOperator(field, '$ne', value);
  }

  /**
   * Ajouter un filtre $regex (pattern matching)
   */
  whereRegex(field: string, pattern: string, options?: string): this {
    this.filters[field] = { $regex: pattern, $options: options || 'i' };
    return this;
  }

  /**
   * Ajouter un filtre $exists
   */
  whereExists(field: string, exists: boolean = true): this {
    this.filters[field] = { $exists: exists };
    return this;
  }

  /**
   * Ajouter un filtre $or
   */
  whereOr(conditions: Array<Record<string, any>>): this {
    this.filters['$or'] = conditions;
    return this;
  }

  /**
   * Ajouter un filtre $and
   */
  whereAnd(conditions: Array<Record<string, any>>): this {
    this.filters['$and'] = conditions;
    return this;
  }

  /**
   * Ajouter un tri
   */
  orderBy(field: string, direction: SortDirection = 'asc'): this {
    const sortValue = typeof direction === 'string' 
      ? (direction === 'asc' ? 1 : -1)
      : direction;
    this.sort[field] = sortValue;
    return this;
  }

  /**
   * Ajouter plusieurs tris
   */
  orderByMultiple(sorts: Record<string, SortDirection>): this {
    Object.entries(sorts).forEach(([field, direction]) => {
      this.orderBy(field, direction);
    });
    return this;
  }

  /**
   * Définir la limite
   */
  limit(count: number): this {
    this.pagination.limit = count;
    return this;
  }

  /**
   * Définir l'offset
   */
  offset(count: number): this {
    this.pagination.offset = count;
    return this;
  }

  /**
   * Définir la page (calcule automatiquement l'offset)
   */
  page(pageNumber: number, pageSize: number = 50): this {
    this.pagination.page = pageNumber;
    this.pagination.limit = pageSize;
    this.pagination.offset = (pageNumber - 1) * pageSize;
    return this;
  }

  /**
   * Construire la requête finale
   */
  build(): QueryOptions {
    return {
      filters: this.filters,
      sort: this.sort,
      pagination: this.pagination,
    };
  }

  /**
   * Obtenir uniquement les filtres
   */
  getFilters(): Record<string, any> {
    return this.filters;
  }

  /**
   * Obtenir uniquement le tri
   */
  getSort(): Record<string, 1 | -1> {
    return this.sort;
  }

  /**
   * Obtenir uniquement la pagination
   */
  getPagination(): { limit?: number; offset?: number; page?: number } {
    return this.pagination;
  }

  /**
   * Réinitialiser le builder
   */
  reset(): this {
    this.filters = {};
    this.sort = {};
    this.pagination = {};
    return this;
  }

  /**
   * Cloner le builder
   */
  clone(): QueryBuilder {
    const cloned = new QueryBuilder();
    cloned.filters = { ...this.filters };
    cloned.sort = { ...this.sort };
    cloned.pagination = { ...this.pagination };
    return cloned;
  }
}


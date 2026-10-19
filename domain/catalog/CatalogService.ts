import { Money } from '@/domain/payment';
import { assertCatalogCategory, type CatalogCategory } from './Category';

export interface CatalogServiceProps {
  id: string;
  name: string;
  category: CatalogCategory;
  price: Money;
  isActive: boolean;
  description?: string;
}

/**
 * Agrégat offre catalogue (bookable).
 * Ne pas confondre avec le service applicatif ServiceService.
 */
export class CatalogService {
  private props: CatalogServiceProps;

  private constructor(props: CatalogServiceProps) {
    this.props = props;
  }

  static create(input: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency?: string;
    description?: string;
    isActive?: boolean;
  }): CatalogService {
    if (!input.id?.trim()) {
      throw new Error('CatalogService id is required');
    }
    if (!input.name?.trim()) {
      throw new Error('CatalogService name is required');
    }
    if (input.price < 0) {
      throw new Error('CatalogService price must be >= 0');
    }

    return new CatalogService({
      id: input.id.trim(),
      name: input.name.trim(),
      category: assertCatalogCategory(input.category),
      price: Money.of(input.price, input.currency || 'EUR'),
      isActive: input.isActive ?? true,
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get isBookable(): boolean {
    return this.props.isActive;
  }

  deactivate(): void {
    this.props.isActive = false;
  }

  activate(): void {
    this.props.isActive = true;
  }

  assertBookable(): void {
    if (!this.isBookable) {
      throw new Error(`CatalogService ${this.props.id} is not bookable`);
    }
  }

  toCreateInput(): {
    id: string;
    name: string;
    category: CatalogCategory;
    price: number;
    currency: string;
    isActive: boolean;
    description?: string;
  } {
    return {
      id: this.props.id,
      name: this.props.name,
      category: this.props.category,
      price: this.props.price.amount,
      currency: this.props.price.currency,
      isActive: this.props.isActive,
      ...(this.props.description !== undefined
        ? { description: this.props.description }
        : {}),
    };
  }
}

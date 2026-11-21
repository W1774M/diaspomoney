import { assertCatalogCategory, type CatalogCategory } from './Category';

export class Speciality {
  private constructor(
    readonly name: string,
    readonly category: CatalogCategory,
    readonly isActive: boolean,
  ) {}

  static create(input: {
    name: string;
    category: string;
    isActive?: boolean;
  }): Speciality {
    if (!input.name?.trim()) {
      throw new Error('Speciality name is required');
    }
    return new Speciality(
      input.name.trim(),
      assertCatalogCategory(input.category),
      input.isActive ?? true,
    );
  }
}

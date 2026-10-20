export const CATALOG_CATEGORIES = {
  HEALTH: 'HEALTH',
  EDUCATION: 'EDUCATION',
  BTP: 'BTP',
} as const;

export type CatalogCategory =
  (typeof CATALOG_CATEGORIES)[keyof typeof CATALOG_CATEGORIES];

const VALID = new Set<string>(Object.values(CATALOG_CATEGORIES));

export function assertCatalogCategory(value: string): CatalogCategory {
  const upper = value.toUpperCase();
  if (!VALID.has(upper)) {
    throw new Error(
      `Invalid catalog category: ${value} (expected HEALTH|EDUCATION|BTP)`,
    );
  }
  return upper as CatalogCategory;
}

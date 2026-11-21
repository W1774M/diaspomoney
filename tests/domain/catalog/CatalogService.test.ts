import { describe, expect, it } from 'vitest';
import { CatalogService } from '@/domain/catalog';

describe('CatalogService', () => {
  it('crée une offre bookable', () => {
    const offer = CatalogService.create({
      id: 'svc-1',
      name: 'Consultation',
      category: 'HEALTH',
      price: 50,
    });
    expect(offer.isBookable).toBe(true);
    expect(offer.toCreateInput().category).toBe('HEALTH');
  });

  it('refuse une catégorie invalide', () => {
    expect(() =>
      CatalogService.create({
        id: 'svc-1',
        name: 'X',
        category: 'LEGAL',
        price: 10,
      }),
    ).toThrow(/category/i);
  });

  it('deactivate empêche bookable', () => {
    const offer = CatalogService.create({
      id: 'svc-1',
      name: 'X',
      category: 'BTP',
      price: 0,
    });
    offer.deactivate();
    expect(() => offer.assertBookable()).toThrow();
  });
});

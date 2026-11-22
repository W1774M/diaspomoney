/**
 * Catalogue (services + options), commandes actives, BTP, éducation et santé — vraie base.
 */
import { MongoClient, ObjectId } from 'mongodb';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { auth } from '@/auth';

import { btpService } from '@/services/btp/btp.service';
import { educationService } from '@/services/education/education.service';
import { healthService } from '@/services/health/health.service';
import { getActiveOrdersUseCase } from '@/services/orders/get-active-orders.use-case';
import { serviceService } from '@/services/service/service.service';

const db = () =>
  ((globalThis as any).__DIASPOMONEY_TEST_MONGO__ as MongoClient).db(process.env['MONGODB_DB']);
const uniq = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

describe('serviceService : catalogue', () => {
  // La gestion du catalogue est réservée aux administrateurs (@Authorize).
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: new ObjectId().toString(), email: 'admin@test.fr', roles: ['ADMIN'] },
    } as any);
  });

  it('crée, lit, liste, modifie puis supprime un service', async () => {
    const id = uniq('service');
    const created = await serviceService.createService({
      id,
      category: 'HEALTH',
      label: 'Consultation test',
      description: 'Consultation de médecine générale',
      price: 19,
      isActive: true,
      important: false,
    } as any);
    expect(created).toBeTruthy();

    const createdId = String((created as any).id ?? (created as any)._id);
    expect(await serviceService.getService(createdId)).toBeTruthy();

    const all = await serviceService.getAllServices({ category: 'HEALTH' as any });
    expect(Array.isArray(all) ? all.length : (all as any).data?.length).toBeGreaterThanOrEqual(1);

    const updated = await serviceService.updateService(createdId, { price: 29 } as any);
    expect(updated).toBeTruthy();

    await serviceService.deleteService(createdId);
  });

  it('gère les options et leur association à un service', async () => {
    const service = await serviceService.createService({
      id: uniq('service'),
      category: 'HEALTH',
      label: 'Bilan',
      description: 'Bilan de santé',
      price: 49,
      isActive: true,
      important: false,
    } as any);
    const serviceId = String((service as any).id ?? (service as any)._id);

    const option = await serviceService.createServiceOption({
      category: 'HEALTH',
      label: 'Analyse sanguine',
      description: 'Option analyse',
      price: 10,
      optional: true,
      isActive: true,
    } as any);
    const optionId = String((option as any).id ?? (option as any)._id);

    expect(await serviceService.getServiceOptionById(optionId)).toBeTruthy();
    expect(await serviceService.getAllOptions({ isActive: true })).toBeTruthy();
    expect(await serviceService.updateServiceOption(optionId, { price: 12 } as any)).toBeTruthy();

    await serviceService.associateOptionToService(serviceId, optionId);
    await serviceService.dissociateOptionFromService(serviceId, optionId);
    await serviceService.deleteServiceOption(optionId);
  });

  it('renvoie null pour un service inexistant', async () => {
    expect(await serviceService.getService(new ObjectId().toString())).toBeNull();
  });

  it('refuse la création sans session administrateur', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    await expect(
      serviceService.createService({ id: uniq('s'), category: 'HEALTH', label: 'x', description: 'x', price: 1 } as any),
    ).rejects.toThrow(/Non autorisé/);
  });
});

describe('getActiveOrdersUseCase', () => {
  it('renvoie les commandes en cours d’un client', async () => {
    const userId = new ObjectId().toString();
    await db().collection('bookings').insertOne({
      requesterId: userId,
      providerId: new ObjectId().toString(),
      serviceId: 'consultation',
      serviceType: 'HEALTH',
      status: 'CONFIRMED',
      appointmentDate: new Date(Date.now() + 86_400_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const orders = await getActiveOrdersUseCase(userId);
    expect(Array.isArray(orders)).toBe(true);
  });

  it('renvoie une liste vide pour un client sans commande', async () => {
    expect(await getActiveOrdersUseCase(new ObjectId().toString())).toEqual([]);
  });
});

describe('btpService', () => {
  it('estime le coût d’un projet et crée une demande de devis', async () => {
    const cost = await btpService.calculateProjectCost('HOUSE', 120, ['garage']);
    expect(cost).toBeTruthy();

    const quote = await btpService.createBTPQuote({
      projectType: 'HOUSE',
      area: 120,
      features: ['garage'],
      location: { city: 'Douala', country: 'CM' },
      contact: { name: 'Test', email: `${uniq('btp')}@test.fr` },
      description: 'Maison familiale',
    } as any);
    expect(quote).toBeTruthy();
  });

  it('recherche biens, artisans et matériaux sans erreur', async () => {
    expect(Array.isArray(await btpService.searchProperties({} as any))).toBe(true);
    expect(Array.isArray(await btpService.searchContractors({} as any))).toBe(true);
    expect(Array.isArray(await btpService.searchMaterials({} as any))).toBe(true);
  });
});

describe('educationService', () => {
  it('recherche des écoles et enregistre une demande', async () => {
    expect(Array.isArray(await educationService.searchSchools({} as any))).toBe(true);

    const inquiry = await educationService.createEducationInquiry({
      studentType: 'CHILD',
      studentInfo: { firstName: 'Mamadou', lastName: 'Diallo' },
      academicInfo: { currentLevel: 'CM2', desiredLevel: '6e' },
      schoolPreferences: {},
      contact: { name: 'Parent', email: `${uniq('edu')}@test.fr` },
    } as any);
    expect(inquiry).toBeTruthy();
  });
});

describe('healthService', () => {
  it('recherche des prestataires de santé', async () => {
    expect(Array.isArray(await healthService.searchProviders({}))).toBe(true);
  });

  it('liste les rendez-vous d’un patient', async () => {
    expect(Array.isArray(await healthService.getPatientAppointments(new ObjectId().toString()))).toBe(true);
  });
});

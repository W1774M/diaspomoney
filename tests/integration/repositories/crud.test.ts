/**
 * Socle commun des repositories MongoDB, testé sur une vraie base (diaspomoney_test).
 *
 * Un même scénario est joué pour chaque repository qui expose les opérations standard :
 * create → findById → findOne / findAll / count / exists (filtrés sur l'_id créé) →
 * update → findWithPagination → delete → exists === false.
 * Les filtres portent sur _id (toujours un ObjectId) pour ne pas dépendre de la façon dont
 * chaque repository stocke ses champs métier. Les méthodes propres à chaque repository ont
 * leurs propres tests à côté.
 */
import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';

type Repo = Record<string, (...args: any[]) => Promise<any>>;

const uid = () => new ObjectId().toString();
const uniq = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface Fixture {
  /** Nom de la classe exportée par repositories/implementations/<name>.ts */
  name: string;
  /** Données minimales valides pour create() */
  data: () => Record<string, unknown>;
  /** Champ modifié par update() (absent : update non testé) */
  update?: () => Record<string, unknown>;
}

const FIXTURES: Fixture[] = [
  {
    name: 'MongoAuditLogRepository',
    data: () => ({ userId: uid(), action: 'TEST_ACTION', resource: 'test', resourceId: uid(), success: true }),
    update: () => ({ success: false }),
  },
  {
    name: 'MongoAvailabilityRuleRepository',
    data: () => ({ userId: uid(), name: 'Règle test', type: 'weekly', isActive: true, timeSlots: [] }),
    update: () => ({ isActive: false }),
  },
  {
    name: 'MongoBeneficiaryRepository',
    data: () => ({ payerId: uid(), firstName: 'Awa', lastName: 'Diallo', relationship: 'OTHER', isActive: true }),
    update: () => ({ firstName: 'Aminata' }),
  },
  {
    name: 'MongoBookingRepository',
    data: () => ({
      requesterId: uid(),
      providerId: uid(),
      serviceId: 'service-test',
      serviceType: 'HEALTH',
      status: 'PENDING',
      appointmentDate: new Date(Date.now() + 86_400_000),
    }),
    update: () => ({ status: 'CONFIRMED' }),
  },
  {
    name: 'MongoComplaintRepository',
    data: () => ({ userId: uid(), title: 'Réclamation test', description: 'Description', type: 'SERVICE', status: 'OPEN', priority: 'LOW' }),
    update: () => ({ status: 'RESOLVED' }),
  },
  {
    name: 'MongoDataProcessingRecordRepository',
    data: () => ({ userId: uid(), purpose: 'test', legalBasis: 'CONSENT', dataCategories: ['identity'] }),
    update: () => ({ purpose: 'test-modifié' }),
  },
  {
    name: 'MongoDataSubjectRequestRepository',
    data: () => ({ userId: uid(), type: 'ACCESS', status: 'PENDING' }),
    update: () => ({ status: 'COMPLETED' }),
  },
  {
    name: 'MongoGDPRConsentRepository',
    data: () => ({ userId: uid(), purpose: 'MARKETING', granted: true }),
    update: () => ({ granted: false }),
  },
  {
    name: 'MongoHealthProviderRepository',
    data: () => ({ name: uniq('Clinique'), email: `${uniq('clinique')}@test.fr`, specialty: 'Médecine Générale', isActive: true }),
    update: () => ({ isActive: false }),
  },
  {
    name: 'MongoInvoiceRepository',
    data: () => ({ userId: uid(), invoiceNumber: uniq('FAC'), amount: 19, currency: 'EUR', status: 'PENDING', items: [] }),
    update: () => ({ status: 'PAID' }),
  },
  {
    name: 'MongoKYCRepository',
    data: () => ({ userId: uid(), status: 'PENDING', documents: [] }),
    update: () => ({ status: 'APPROVED' }),
  },
  {
    name: 'MongoNotificationRepository',
    data: () => ({ userId: uid(), recipient: uid(), type: 'INFO', title: 'Titre', message: 'Message', channel: 'IN_APP', status: 'PENDING', read: false }),
    update: () => ({ read: true }),
  },
  {
    name: 'MongoNotificationTemplateRepository',
    data: () => ({ name: uniq('template'), type: 'EMAIL', subject: 'Sujet', body: 'Corps', isActive: true }),
    update: () => ({ subject: 'Sujet modifié' }),
  },
  {
    name: 'MongoPCIAuditLogRepository',
    data: () => ({ userId: uid(), action: 'CARD_ACCESS', resource: 'payment', success: true }),
    update: () => ({ success: false }),
  },
  {
    name: 'MongoPrescriptionRepository',
    data: () => ({ patientId: uid(), providerId: uid(), medications: [], status: 'ACTIVE' }),
    update: () => ({ status: 'CANCELLED' }),
  },
  {
    name: 'MongoQuoteRepository',
    data: () => ({ type: 'BTP', contactEmail: `${uniq('devis')}@test.fr`, contactName: 'Test', status: 'PENDING' }),
    update: () => ({ status: 'SENT' }),
  },
  {
    name: 'MongoServiceOptionRepository',
    data: () => ({ label: 'Option test', category: 'HEALTH', price: 5, isActive: true }),
    update: () => ({ price: 7 }),
  },
  {
    name: 'MongoServiceRepository',
    data: () => ({ name: 'Consultation test', category: 'HEALTH', price: 19, isActive: true }),
    update: () => ({ price: 29 }),
  },
  {
    name: 'MongoSpecialityRepository',
    data: () => ({ name: uniq('Spécialité'), group: 'sante', isActive: true }),
    update: () => ({ isActive: false }),
  },
  {
    name: 'MongoTeleconsultationRepository',
    data: () => ({ patientId: uid(), providerId: uid(), status: 'SCHEDULED', scheduledAt: new Date() }),
    update: () => ({ status: 'COMPLETED' }),
  },
  {
    name: 'MongoTransactionRepository',
    data: () => ({ userId: uid(), payerId: uid(), amount: 19, currency: 'EUR', status: 'PENDING', type: 'PAYMENT' }),
    update: () => ({ status: 'COMPLETED' }),
  },
  {
    name: 'MongoUserRepository',
    data: () => ({ email: `${uniq('user')}@test.fr`, firstName: 'Test', lastName: 'User', roles: ['CUSTOMER'] }),
    update: () => ({ firstName: 'Modifié' }),
  },
];

async function load(name: string): Promise<Repo> {
  // Chemin relatif avec extension : seul format qu'un import dynamique variable sait résoudre.
  const mod = await import(`../../../repositories/implementations/${name}.ts`);
  return new mod[name]() as Repo;
}

const idOf = (entity: any): string => String(entity?.id ?? entity?._id);

describe.each(FIXTURES)('$name : opérations standard', ({ name, data, update }) => {
  it('crée, relit, filtre, compte, modifie, pagine puis supprime', async () => {
    const repo = await load(name);

    const created = await repo['create']!(data());
    const id = idOf(created);
    expect(ObjectId.isValid(id), `${name}.create doit renvoyer un id`).toBe(true);

    expect(idOf(await repo['findById']!(id))).toBe(id);

    const byId = { _id: new ObjectId(id) };
    expect(idOf(await repo['findOne']!(byId))).toBe(id);
    expect((await repo['findAll']!(byId)).map(idOf)).toEqual([id]);
    expect(await repo['count']!(byId)).toBe(1);
    expect(await repo['exists']!(id)).toBe(true);

    if (update && repo['update']) {
      const updated = await repo['update']!(id, update());
      expect(updated, `${name}.update doit renvoyer l'entité`).toBeTruthy();
    }

    if (repo['findWithPagination']) {
      const page = await repo['findWithPagination']!(byId, { limit: 10, page: 1, offset: 0 });
      expect(page.data.map(idOf)).toEqual([id]);
      expect(page.total).toBe(1);
    }

    expect(await repo['delete']!(id)).toBeTruthy();
    expect(await repo['exists']!(id)).toBe(false);
    expect(await repo['findById']!(new ObjectId().toString())).toBeNull();
  });
});

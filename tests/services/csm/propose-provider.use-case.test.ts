// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  findOne: vi.fn(),
  insertOne: vi.fn(),
  updateOne: vi.fn(),
  find: vi.fn(),
  sendNotification: vi.fn(),
  invalidate: vi.fn(),
  collections: [] as string[],
}));

vi.mock('@/lib/database/mongodb', () => ({
  getMongoClient: vi.fn(async () => ({
    db: () => ({
      collection: (name: string) => {
        h.collections.push(name);
        return {
        findOne: h.findOne,
        insertOne: h.insertOne,
        updateOne: h.updateOne,
        find: h.find,
        };
      },
    }),
  })),
}));
vi.mock('@/lib/cache/redis', () => ({ invalidateAppCache: h.invalidate }));
vi.mock('@/services/notification/notification.service', () => ({
  notificationService: { sendNotification: h.sendNotification },
}));

import { ProviderProposalSchema } from '@/lib/csm/provider-proposal';
import { proposeProviderForCsm } from '@/services/csm/propose-provider.use-case';

const CSM_ID = '64d2f9c3e6a1b2c3d4e5f678';
const ctx = { csmId: CSM_ID, csmName: 'Camille CSM', baseUrl: 'https://app.test/' };
const oid = (id: string) => ({ toString: () => id });

beforeEach(() => {
  vi.clearAllMocks();
  h.collections.length = 0;
  h.findOne.mockResolvedValue(null);
  h.find.mockReturnValue({ toArray: async () => [{ _id: oid('admin1') }, { _id: oid('super1') }] });
  h.insertOne.mockResolvedValue({ insertedId: oid('newprov1') });
});

describe('proposeProviderForCsm', () => {
  it('rattache un prestataire existant retrouvé par e-mail, sans rien créer', async () => {
    h.findOne.mockResolvedValueOnce({ _id: oid('prov1'), name: 'Awa Diallo', roles: ['PROVIDER'] });
    const proposal = ProviderProposalSchema.parse({ lastName: 'Diallo', email: 'awa@exemple.fr' });

    const out = await proposeProviderForCsm(proposal, ctx);

    expect(out).toEqual({ status: 'linked', providerId: 'prov1', providerName: 'Awa Diallo' });
    expect(h.findOne).toHaveBeenCalledWith({ email: 'awa@exemple.fr' });
    expect(h.insertOne).not.toHaveBeenCalled();
    expect(h.updateOne).toHaveBeenCalledWith(
      expect.anything(),
      { $addToSet: { csmPortfolioProviderIds: 'prov1' } },
    );
    expect(h.sendNotification).not.toHaveBeenCalled();
    expect(h.collections).not.toContain('roadmap_provider_interest');
  });

  it('signale un conflit si l’e-mail appartient à un compte non prestataire', async () => {
    h.findOne.mockResolvedValueOnce({ _id: oid('cust1'), roles: ['CUSTOMER'] });
    const proposal = ProviderProposalSchema.parse({ lastName: 'Diallo', email: 'awa@exemple.fr' });

    const out = await proposeProviderForCsm(proposal, ctx);

    expect(out.status).toBe('conflict');
    expect(h.updateOne).not.toHaveBeenCalled();
    expect(h.insertOne).not.toHaveBeenCalled();
  });

  it('rattache un prestataire existant retrouvé par téléphone', async () => {
    h.findOne.mockResolvedValueOnce({ _id: oid('prov2'), firstName: 'Moussa', lastName: 'Sow', roles: ['PROVIDER'] });
    const proposal = ProviderProposalSchema.parse({ lastName: 'Sow', phone: '+221 77 123 45 67' });

    const out = await proposeProviderForCsm(proposal, ctx);

    expect(out).toMatchObject({ status: 'linked', providerId: 'prov2', providerName: 'Moussa Sow' });
    expect(h.findOne).toHaveBeenCalledWith({
      phone: { $in: ['+221 77 123 45 67', '+221771234567'] },
      roles: 'PROVIDER',
    });
  });

  it('crée un compte PENDING avec adresse technique quand le prestataire n’a ni compte ni e-mail', async () => {
    const proposal = ProviderProposalSchema.parse({
      lastName: 'Sow',
      phone: '0601020304',
      notes: 'Rencontré au salon',
    });

    const out = await proposeProviderForCsm(proposal, ctx);

    expect(out).toEqual({
      status: 'created',
      providerId: 'newprov1',
      providerName: 'Sow',
      missingInfo: ['e-mail', 'catégorie', 'ville', 'prénom'],
    });
    const doc = h.insertOne.mock.calls[0]![0];
    expect(doc.email).toMatch(/^prestataire-[a-z0-9]+@a-completer\.invalid$/);
    expect(doc).toMatchObject({
      roles: ['PROVIDER'],
      status: 'PENDING',
      phone: '0601020304',
      providerInfo: { type: 'INDIVIDUAL', isVerified: false },
      csmProposal: {
        csmId: CSM_ID,
        csmName: 'Camille CSM',
        notes: 'Rencontré au salon',
        emailToComplete: true,
      },
    });
    expect(doc.password).toBeUndefined();

    // Candidature « Nouvelle » liée au compte, pour le suivi admin
    expect(h.collections).toContain('roadmap_provider_interest');
    const application = h.insertOne.mock.calls[1]![0];
    expect(application).toMatchObject({
      name: 'Sow',
      email: '',
      phone: '0601020304',
      status: 'new',
      source: 'csm',
      csmId: CSM_ID,
      csmName: 'Camille CSM',
      providerUserId: 'newprov1',
    });
    expect(application.note).toContain('Note du CSM : Rencontré au salon');
    expect(application.note).toContain('À compléter : e-mail');
    expect(h.updateOne).toHaveBeenCalledWith(
      expect.anything(),
      { $addToSet: { csmPortfolioProviderIds: 'newprov1' } },
    );
  });

  it('notifie chaque admin (in-app) avec le lien vers la fiche', async () => {
    const proposal = ProviderProposalSchema.parse({
      type: 'INSTITUTION',
      companyName: 'Clinique du Port',
      email: 'contact@clinique.sn',
    });

    await proposeProviderForCsm(proposal, ctx);

    expect(h.sendNotification).toHaveBeenCalledTimes(2);
    const call = h.sendNotification.mock.calls[0]![0];
    expect(call).toMatchObject({
      recipient: 'admin1',
      template: 'admin_csm_provider_proposed',
      channels: [{ type: 'IN_APP', enabled: true, priority: 'MEDIUM' }],
      data: {
        providerName: 'Clinique du Port',
        csmName: 'Camille CSM',
        contact: 'contact@clinique.sn',
        providerUrl: 'https://app.test/dashboard/users/newprov1',
      },
    });
    expect(call.data.missingLine).toContain('téléphone');
  });

  it('garde la proposition même si la notification échoue', async () => {
    h.sendNotification.mockRejectedValue(new Error('service HS'));
    const proposal = ProviderProposalSchema.parse({ lastName: 'Sow', phone: '0601020304' });

    await expect(proposeProviderForCsm(proposal, ctx)).resolves.toMatchObject({ status: 'created' });
  });
});

describe('proposeProviderForCsm : candidature', () => {
  it('garde le compte et le rattachement si la candidature échoue', async () => {
    h.insertOne
      .mockResolvedValueOnce({ insertedId: oid('newprov1') })
      .mockRejectedValueOnce(new Error('mongo HS'));
    const proposal = ProviderProposalSchema.parse({ lastName: 'Sow', phone: '0601020304' });

    await expect(proposeProviderForCsm(proposal, ctx)).resolves.toMatchObject({
      status: 'created',
      providerId: 'newprov1',
    });
    expect(h.updateOne).toHaveBeenCalled();
    expect(h.sendNotification).toHaveBeenCalled();
  });
});

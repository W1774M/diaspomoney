// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Dépôts simulés ; décorateurs de cache, journal et mesure neutres ; @Validate réel.
const h = vi.hoisted(() => ({
  passThrough: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  conv: {
    findByParticipant: vi.fn(), findByParticipants: vi.fn(), findById: vi.fn(), create: vi.fn(),
    resetUnreadCount: vi.fn(), updateLastMessage: vi.fn(), incrementUnreadCount: vi.fn(),
  },
  msg: { findByConversation: vi.fn(), countUnread: vi.fn(), markConversationAsRead: vi.fn(), create: vi.fn() },
  ticket: { findByUser: vi.fn(), create: vi.fn(), addMessage: vi.fn(), update: vi.fn() },
  att: { findByUser: vi.fn(), create: vi.fn(), findById: vi.fn(), delete: vi.fn() },
  users: { findById: vi.fn() },
}));

vi.mock('@/lib/decorators/cache.decorator', () => ({ Cacheable: h.passThrough, InvalidateCache: h.passThrough }));
vi.mock('@/lib/decorators/log.decorator', () => ({ Log: h.passThrough }));
vi.mock('@/lib/decorators/performance.decorator', () => ({ Performance: h.passThrough }));
vi.mock('@/repositories', () => ({
  getConversationRepository: () => h.conv,
  getMessageRepository: () => h.msg,
  getSupportTicketRepository: () => h.ticket,
  getAttachmentRepository: () => h.att,
  getUserRepository: () => h.users,
}));

import { MessagingService, messagingService } from '@/services/messaging/messaging.service';

const svc = messagingService;
const page = <T,>(data: T[], total = data.length) => ({ data, total });
const d = (s: string) => new Date(`2026-11-${s}T10:00:00Z`);
const conv = (id: string, participants: string[], extra: Record<string, unknown> = {}) => ({ _id: id, participants, ...extra });
const message = (id: string, senderId: string, extra: Record<string, unknown> = {}) => ({ _id: id, senderId, text: `texte ${id}`, createdAt: d('20'), ...extra });

beforeEach(() => {
  vi.clearAllMocks();
  h.msg.findByConversation.mockResolvedValue(page([]));
  h.msg.countUnread.mockResolvedValue(0);
  h.users.findById.mockResolvedValue(null);
});

describe('MessagingService.getConversations', () => {
  it('construit la liste vue par l’utilisateur (échanges entre personnes autorisés), triée par dernier message', async () => {
    h.conv.findByParticipant.mockResolvedValue(page([
      conv('c1', ['u1', 'u2'], { unreadCount: { u1: 3 }, lastMessageAt: d('01') }),
      conv('c2', ['u3', 'u1'], { lastMessageAt: d('15') }),
      conv('c3', ['u1']), // seul participant : ignorée
      conv('c4', ['u1', 'u4']), // client ↔ client : paire non autorisée
      conv('c5', ['u1', 'u2'], { type: 'support' }), // ticket support : hors messagerie
    ]));
    h.users.findById.mockImplementation(async (id: string) =>
      id === 'u1' ? { id: 'u1', name: 'Moi', roles: ['CUSTOMER'] }
        : id === 'u2' ? { id: 'u2', name: 'Awa', roles: ['PROVIDER'], avatar: 'a.png' }
          : id === 'u3' ? { id: 'u3', name: 'Support', roles: ['ADMIN'] }
            : id === 'u4' ? { id: 'u4', name: 'Autre client', roles: ['CUSTOMER'] }
              : null);
    h.msg.findByConversation.mockImplementation(async (id: string) => (id === 'c1' ? page([message('m1', 'u2', { createdAt: d('21') })]) : page([])));
    h.msg.countUnread.mockResolvedValue(2);

    const list = await svc.getConversations('u1', { page: 2, limit: 5 });

    expect(h.conv.findByParticipant).toHaveBeenCalledWith('u1', { page: 2, limit: 5, sort: { lastMessageAt: -1 } });
    expect(list).toEqual([
      { id: 'c1', participant: { id: 'u2', name: 'Awa', avatar: 'a.png', role: 'PROVIDER' }, lastMessage: 'texte m1', lastMessageTime: d('21'), unreadCount: 3 },
      { id: 'c2', participant: { id: 'u3', name: 'Support', avatar: undefined, role: 'ADMIN' }, lastMessage: '', lastMessageTime: d('15'), unreadCount: 2 },
    ]);
    expect(h.msg.countUnread).toHaveBeenCalledTimes(1); // seulement c2, c1 a déjà son compteur
  });

  it('pagine par défaut, refuse un utilisateur vide et propage les erreurs', async () => {
    h.conv.findByParticipant.mockResolvedValueOnce(page([]));
    expect(await svc.getConversations('u1')).toEqual([]);
    expect(h.conv.findByParticipant).toHaveBeenCalledWith('u1', { page: 1, limit: 20, sort: { lastMessageAt: -1 } });
    await expect(svc.getConversations('')).rejects.toThrow();
    h.conv.findByParticipant.mockRejectedValueOnce(new Error('mongo HS'));
    await expect(svc.getConversations('u1')).rejects.toThrow('mongo HS');
  });
});

describe('MessagingService.createConversation', () => {
  it('réutilise une conversation existante', async () => {
    h.users.findById.mockImplementation(async (id: string) =>
      ({ id, name: id, roles: [id === 'u1' ? 'CUSTOMER' : 'PROVIDER'] }));
    h.conv.findByParticipants.mockResolvedValueOnce(conv('c1', ['u1', 'u2']));
    h.conv.findByParticipant.mockResolvedValueOnce(page([conv('c1', ['u1', 'u2'])]));
    expect(await svc.createConversation({ participants: ['u1', 'u2'], type: 'user' })).toMatchObject({ id: 'c1', participant: { id: 'u2' } });
    expect(h.conv.create).not.toHaveBeenCalled();
    expect(h.conv.findByParticipants).toHaveBeenCalledWith(['u1', 'u2'], 'user');
  });

  it('renvoie une conversation minimale si elle n’apparaît pas dans la liste', async () => {
    h.conv.findByParticipants.mockResolvedValueOnce(conv('c9', ['u1', 'u2']));
    h.conv.findByParticipant.mockResolvedValueOnce(page([]));
    expect(await svc.createConversation({ participants: ['u1', 'u2'], type: 'support' })).toMatchObject({ id: 'c9', participant: { id: '', name: '' }, unreadCount: 0 });

    h.conv.findByParticipants.mockResolvedValueOnce(null);
    h.conv.create.mockResolvedValueOnce(conv('c10', ['u1', 'u2']));
    h.conv.findByParticipant.mockResolvedValueOnce(page([]));
    expect(await svc.createConversation({ participants: ['u1', 'u2'], type: 'user' })).toMatchObject({ id: 'c10', lastMessage: '' });
  });

  it('crée une nouvelle conversation et la renvoie telle que listée', async () => {
    h.conv.findByParticipants.mockResolvedValueOnce(null);
    h.conv.create.mockResolvedValueOnce(conv('c2', ['u1', 'u2']));
    h.conv.findByParticipant.mockResolvedValueOnce(page([conv('c2', ['u1', 'u2'])]));
    expect(await svc.createConversation({ participants: ['u1', 'u2'], type: 'user' })).toMatchObject({ id: 'c2' });
    expect(h.conv.create).toHaveBeenCalledWith({ participants: ['u1', 'u2'], type: 'user', unreadCount: {} });
  });

  it('exige au moins 2 participants et un type valide', async () => {
    await expect(svc.createConversation({ participants: ['u1'], type: 'user' })).rejects.toThrow();
    await expect(svc.createConversation({ participants: ['u1', 'u2'], type: 'groupe' as 'user' })).rejects.toThrow();
    h.conv.findByParticipants.mockRejectedValueOnce(new Error('mongo HS'));
    await expect(svc.createConversation({ participants: ['u1', 'u2'], type: 'user' })).rejects.toThrow('mongo HS');
  });
});

describe('MessagingService : messages d’une conversation', () => {
  it('renvoie les messages et les marque lus pour un participant', async () => {
    h.conv.findById.mockResolvedValue(conv('c1', ['u1', 'u2']));
    h.msg.findByConversation.mockResolvedValueOnce(page([message('m1', 'u2', { attachments: ['a1'], read: 1 }), message('m2', 'u1', { createdAt: undefined })], 12));

    const { messages, total } = await svc.getMessages('c1', 'u1', { page: 2, limit: 10 });
    expect(total).toBe(12);
    expect(messages[0]).toEqual({ id: 'm1', text: 'texte m1', senderId: 'u2', timestamp: d('20'), attachments: ['a1'], read: true });
    expect(messages[1]).toMatchObject({ attachments: [], read: false, timestamp: expect.any(Date) });
    expect(h.msg.findByConversation).toHaveBeenCalledWith('c1', { page: 2, limit: 10, sort: { createdAt: -1 } });
    expect(h.msg.markConversationAsRead).toHaveBeenCalledWith('c1', 'u1');
    expect(h.conv.resetUnreadCount).toHaveBeenCalledWith('c1', 'u1');
  });

  it('ne marque rien sur une conversation vide', async () => {
    h.conv.findById.mockResolvedValue(conv('c1', ['u1', 'u2']));
    expect(await svc.getMessages('c1', 'u1')).toEqual({ messages: [], total: 0 });
    expect(h.msg.markConversationAsRead).not.toHaveBeenCalled();
  });

  it('refuse une conversation inconnue ou un non-participant', async () => {
    h.conv.findById.mockResolvedValueOnce(null);
    await expect(svc.getMessages('cx', 'u1')).rejects.toThrow('Conversation non trouvée');
    h.conv.findById.mockResolvedValueOnce(conv('c1', ['u2', 'u3']));
    await expect(svc.getMessages('c1', 'u1')).rejects.toThrow('Accès non autorisé');
    h.conv.findById.mockResolvedValueOnce({ _id: 'c1' });
    await expect(svc.getMessages('c1', 'u1')).rejects.toThrow('Accès non autorisé');
  });

  it('envoie un message, met à jour la conversation et les compteurs des autres', async () => {
    h.conv.findById.mockResolvedValue(conv('c1', ['u1', 'u2', 'u3']));
    h.msg.create.mockResolvedValueOnce(message('m9', 'u1', { text: 'Bonjour', attachments: ['a1'] }));
    const sent = await svc.sendMessage({ conversationId: 'c1', text: 'Bonjour', attachments: ['a1'] }, 'u1');

    expect(sent).toEqual({ id: 'm9', text: 'Bonjour', senderId: 'u1', timestamp: d('20'), attachments: ['a1'], read: false });
    expect(h.msg.create).toHaveBeenCalledWith({ conversationId: 'c1', senderId: 'u1', text: 'Bonjour', attachments: ['a1'], read: false });
    expect(h.conv.updateLastMessage).toHaveBeenCalledWith('c1', 'Bonjour', d('20'));
    expect(h.conv.incrementUnreadCount.mock.calls).toEqual([['c1', 'u2'], ['c1', 'u3']]);
  });

  it('refuse l’envoi hors conversation ou d’un texte vide', async () => {
    h.conv.findById.mockResolvedValueOnce(null);
    await expect(svc.sendMessage({ conversationId: 'cx', text: 'x' }, 'u1')).rejects.toThrow('Conversation non trouvée');
    h.conv.findById.mockResolvedValueOnce(conv('c1', ['u2']));
    await expect(svc.sendMessage({ conversationId: 'c1', text: 'x' }, 'u1')).rejects.toThrow('Accès non autorisé');
    await expect(svc.sendMessage({ conversationId: 'c1', text: '' }, 'u1')).rejects.toThrow();
    expect(h.msg.create).not.toHaveBeenCalled();

    h.conv.findById.mockResolvedValueOnce(conv('c1', ['u1']));
    h.msg.create.mockResolvedValueOnce({ _id: 'm1', senderId: 'u1', text: 'x' });
    expect(await svc.sendMessage({ conversationId: 'c1', text: 'x' }, 'u1')).toMatchObject({ attachments: [], timestamp: expect.any(Date) });
  });
});

describe('MessagingService : support', () => {
  it('reprend le ticket ouvert et présente les messages côté utilisateur / support', async () => {
    h.ticket.findByUser.mockResolvedValueOnce(page([{ _id: 't0', status: 'closed' }, { _id: 't1', status: 'in_progress', priority: 'high' }]));
    h.msg.findByConversation.mockResolvedValueOnce(page([message('m1', 'u1'), message('m2', 'agent', { attachments: ['a'] })]));
    const { ticket, messages } = await svc.getSupportTicket('u1');
    expect(ticket).toEqual({ id: 't1', status: 'in_progress', priority: 'high' });
    expect(messages.map((m) => m.senderId)).toEqual(['user', 'support']);
    expect(h.msg.findByConversation).toHaveBeenCalledWith('t1', { page: 1, limit: 100, sort: { createdAt: 1 } });
    expect(h.ticket.create).not.toHaveBeenCalled();
  });

  it('ouvre un ticket si aucun n’est en cours', async () => {
    h.ticket.findByUser.mockResolvedValueOnce({ data: undefined });
    h.ticket.create.mockResolvedValueOnce({ _id: 't2', status: 'open', priority: 'medium' });
    h.msg.findByConversation.mockResolvedValueOnce({ data: undefined });
    expect(await svc.getSupportTicket('u1')).toEqual({ ticket: { id: 't2', status: 'open', priority: 'medium' }, messages: [] });
    expect(h.ticket.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', status: 'open', priority: 'medium', messages: [], subject: 'Support DiaspoMoney' }));
  });

  it('envoie un message de support (texte ou pièces jointes seules)', async () => {
    h.ticket.findByUser.mockResolvedValue(page([{ _id: 't1', status: 'open', priority: 'medium' }]));
    h.msg.create.mockImplementation(async (m: any) => ({ _id: 'm5', ...m }));

    expect(await svc.sendSupportMessage('u1', 'Aide')).toMatchObject({ id: 'm5', text: 'Aide', senderId: 'user', attachments: [] });
    expect(h.ticket.addMessage).toHaveBeenCalledWith('t1', 'm5');
    expect(await svc.sendSupportMessage('u1', '  ', ['a1'])).toMatchObject({ text: 'Pièce(s) jointe(s)', attachments: ['a1'] });
    expect(h.ticket.update).not.toHaveBeenCalled();

    await expect(svc.sendSupportMessage('u1', '   ')).rejects.toThrow('Le message ne peut pas être vide.');
    await expect(svc.sendSupportMessage('u1', '', [])).rejects.toThrow('Le message ne peut pas être vide.');
  });

  it('erreurs du support propagées', async () => {
    h.ticket.findByUser.mockRejectedValueOnce(new Error('mongo HS'));
    await expect(svc.getSupportTicket('u1')).rejects.toThrow('mongo HS');
    await expect(svc.getSupportTicket('')).rejects.toThrow();
  });
});

describe('MessagingService : pièces jointes', () => {
  const att = (id: string, extra: Record<string, unknown> = {}) => ({ _id: id, name: 'doc.pdf', type: 'application/pdf', size: '2048', url: 'https://f.test/doc.pdf', uploadedBy: 'u1', createdAt: d('10'), ...extra });

  it('liste les pièces jointes avec le nom de l’auteur', async () => {
    h.att.findByUser.mockResolvedValueOnce(page([att('a1', { conversationId: 'c1', messageId: 'm1', uploadedAt: d('11') }), att('a2', { size: 'x' })], '7' as unknown as number)); // total renvoyé en texte : converti en nombre
    h.users.findById.mockResolvedValueOnce({ name: 'Awa' }).mockResolvedValueOnce(null);

    const res = await svc.getAttachments('u1', { type: 'pdf' }, { page: 2, limit: 5 });
    expect(h.att.findByUser).toHaveBeenCalledWith('u1', { type: 'pdf' }, { page: 2, limit: 5, sort: { createdAt: -1 } });
    expect(res.total).toBe(7);
    expect(res.attachments).toEqual([
      { id: 'a1', name: 'doc.pdf', type: 'application/pdf', size: 2048, url: 'https://f.test/doc.pdf', uploadedBy: 'Awa', uploadedAt: d('11'), conversationId: 'c1', messageId: 'm1' },
      { id: 'a2', name: 'doc.pdf', type: 'application/pdf', size: 0, url: 'https://f.test/doc.pdf', uploadedBy: 'Utilisateur', uploadedAt: d('10') },
    ]);

    h.att.findByUser.mockResolvedValueOnce({ data: undefined, total: undefined });
    expect(await svc.getAttachments('u1')).toEqual({ attachments: [], total: 0 });
    h.att.findByUser.mockRejectedValueOnce(new Error('mongo HS'));
    await expect(svc.getAttachments('u1')).rejects.toThrow('mongo HS');
  });

  it('enregistre une pièce jointe valide', async () => {
    const data = { name: 'doc.pdf', type: 'application/pdf', size: 2048, url: 'https://f.test/doc.pdf', uploadedBy: 'u1', conversationId: 'c1' };
    h.att.create.mockResolvedValueOnce(att('a3', { conversationId: 'c1' }));
    h.users.findById.mockResolvedValueOnce({ name: 'Awa' });
    expect(await svc.uploadAttachment(data)).toMatchObject({ id: 'a3', size: 2048, uploadedBy: 'Awa', conversationId: 'c1' });
    expect(h.att.create).toHaveBeenCalledWith(data);

    h.att.create.mockResolvedValueOnce(att('a4', { createdAt: undefined, messageId: 'm2' }));
    expect(await svc.uploadAttachment(data)).toMatchObject({ uploadedBy: 'Utilisateur', messageId: 'm2', uploadedAt: expect.any(Date) });

    await expect(svc.uploadAttachment({ ...data, url: 'pas une url' })).rejects.toThrow();
    await expect(svc.uploadAttachment({ ...data, size: 0 })).rejects.toThrow();
    h.att.create.mockRejectedValueOnce(new Error('mongo HS'));
    await expect(svc.uploadAttachment(data)).rejects.toThrow('mongo HS');
  });

  it('ne laisse supprimer une pièce jointe qu’à son auteur', async () => {
    h.att.findById.mockResolvedValueOnce(att('a1'));
    h.att.delete.mockResolvedValueOnce(true);
    expect(await svc.deleteAttachment('a1', 'u1')).toBe(true);
    expect(h.att.delete).toHaveBeenCalledWith('a1');

    h.att.findById.mockResolvedValueOnce(att('a1'));
    await expect(svc.deleteAttachment('a1', 'u2')).rejects.toThrow('Accès non autorisé');
    h.att.findById.mockResolvedValueOnce(null);
    await expect(svc.deleteAttachment('ax', 'u1')).rejects.toThrow('Attachment non trouvé');
    expect(h.att.delete).toHaveBeenCalledTimes(1);
  });

  it('peut être construit avec d’autres dépôts', () => {
    expect(new MessagingService(h.conv as never, h.msg as never, h.ticket as never, h.att as never)).toBeInstanceOf(MessagingService);
  });
});

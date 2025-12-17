/**
 * Configuration globale pour les tests
 * Ce fichier est exécuté avant chaque test
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// S'assurer que document.body existe pour les tests React
if (typeof document !== 'undefined') {
  if (!document.body) {
    const body = document.createElement('body');
    if (document.documentElement) {
      document.documentElement.appendChild(body);
    } else {
      // Créer un document minimal si nécessaire
      const html = document.createElement('html');
      html.appendChild(body);
      Object.defineProperty(document, 'documentElement', {
        value: html,
        writable: false,
        configurable: false,
      });
    }
  }
  // S'assurer qu'il y a un élément racine pour React
  if (!document.getElementById('root')) {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
  }
}

// Nettoyer après chaque test
afterEach(() => {
  cleanup();
});

// Mock des variables d'environnement
(process.env as any).NODE_ENV = 'test';
process.env['MONGODB_URI'] = process.env['MONGODB_URI'] || 'mongodb://217.154.22.202:27017/diaspomoney_test';
process.env['REDIS_URL'] = process.env['REDIS_URL'] || 'redis://localhost:6379';
process.env.NEXTAUTH_SECRET = process.env['NEXTAUTH_SECRET'] || 'test-secret-key-for-testing-only';
process.env.NEXTAUTH_URL = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000';

// Mock de Next.js
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock de next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock de auth() pour éviter les erreurs "headers was called outside a request scope"
vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

// Mock de Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

// Mock de fetch global
global.fetch = vi.fn();

// Mock de la configuration de l'application pour éviter les erreurs dans les tests
vi.mock('@/config/app.config', () => ({
  config: {
    database: {
      uri: process.env['MONGODB_URI'] || 'mongodb://217.154.22.202:27017/diaspomoney_test',
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      },
    },
  },
}));

// Mock de dbConnect pour éviter les connexions réelles à MongoDB dans les tests
vi.mock('@/lib/mongodb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/mongodb')>();
  return {
    ...actual,
    default: vi.fn().mockResolvedValue(undefined), // Mock dbConnect to resolve immediately
    mongoClient: Promise.resolve({
      db: vi.fn(() => ({
        collection: vi.fn(() => ({
          find: vi.fn(),
          findOne: vi.fn(),
          insertOne: vi.fn(),
          insertMany: vi.fn(),
          updateOne: vi.fn(),
          updateMany: vi.fn(),
          deleteOne: vi.fn(),
          deleteMany: vi.fn(),
          countDocuments: vi.fn(),
        })),
      })),
      startSession: vi.fn(() => ({
        startTransaction: vi.fn(),
        commitTransaction: vi.fn().mockResolvedValue(undefined),
        abortTransaction: vi.fn().mockResolvedValue(undefined),
        withTransaction: vi.fn((cb) => cb()),
        endSession: vi.fn(),
      })),
      close: vi.fn().mockResolvedValue(undefined),
    } as any), // Mock mongoClient
    getDatabase: vi.fn().mockResolvedValue({
      collection: vi.fn(() => ({
        find: vi.fn(),
        findOne: vi.fn(),
        insertOne: vi.fn(),
        insertMany: vi.fn(),
        updateOne: vi.fn(),
        updateMany: vi.fn(),
        deleteOne: vi.fn(),
        deleteMany: vi.fn(),
        countDocuments: vi.fn(),
      })),
    }),
    getCollection: vi.fn().mockResolvedValue({
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      insertMany: vi.fn(),
      updateOne: vi.fn(),
      updateMany: vi.fn(),
      deleteOne: vi.fn(),
      deleteMany: vi.fn(),
      countDocuments: vi.fn(),
    }),
    closeConnection: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock global des repositories pour éviter les erreurs dans les tests
// Utiliser vi.hoisted() pour créer les mocks avant le hoisting de vi.mock
const mockRepositories = vi.hoisted(() => {
  const createMockRepository = () => ({
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByPayer: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findWithFilters: vi.fn(),
    findUsersWithFilters: vi.fn(),
  });

  // Créer une instance de repository mockée partagée pour chaque type
  const mockUserRepo = createMockRepository();
  const mockBeneficiaryRepo = createMockRepository();
  const mockTransactionRepo = {
    ...createMockRepository(),
    findTransactionsWithFilters: vi.fn().mockResolvedValue({
      data: [],
      total: 0,
      limit: 50,
      offset: 0,
      page: 1,
    }),
    findByPayer: vi.fn(),
    findByBeneficiary: vi.fn(),
    findByStatus: vi.fn(),
    updateStatus: vi.fn(),
    findByPaymentIntentId: vi.fn(),
    updateWithMetadata: vi.fn(),
    calculateTotalByUser: vi.fn(),
    findWithPagination: vi.fn().mockResolvedValue({
      data: [],
      total: 0,
      limit: 50,
      offset: 0,
      page: 1,
    }),
  };
  const mockBookingRepo = createMockRepository();
  const mockInvoiceRepo = createMockRepository();
  const mockComplaintRepo = createMockRepository();
  const mockNotificationRepo = createMockRepository();
  const mockNotificationTemplateRepo = createMockRepository();
  const mockAuditLogRepo = createMockRepository();
  const mockQuoteRepo = createMockRepository();
  const mockSpecialityRepo = createMockRepository();
  const mockConversationRepo = createMockRepository();
  const mockMessageRepo = createMockRepository();
  const mockSupportTicketRepo = createMockRepository();
  const mockAttachmentRepo = createMockRepository();
  const mockKYCRepo = createMockRepository();
  const mockHealthProviderRepo = createMockRepository();
  const mockPrescriptionRepo = createMockRepository();
  const mockTeleconsultationRepo = createMockRepository();
  const mockAvailabilityRuleRepo = createMockRepository();
  const mockServiceRepo = createMockRepository();
  const mockServiceOptionRepo = createMockRepository();
  const mockDataProcessingRecordRepo = createMockRepository();
  const mockDataSubjectRequestRepo = createMockRepository();
  const mockGDPRConsentRepo = createMockRepository();
  const mockPCIAuditLogRepo = createMockRepository();

  // Créer les fonctions getter qui retournent les repositories mockés
  const getUserRepository = vi.fn(() => mockUserRepo);
  const getBeneficiaryRepository = vi.fn(() => mockBeneficiaryRepo);
  const getTransactionRepository = vi.fn(() => mockTransactionRepo);
  const getBookingRepository = vi.fn(() => mockBookingRepo);
  const getInvoiceRepository = vi.fn(() => mockInvoiceRepo);
  const getComplaintRepository = vi.fn(() => mockComplaintRepo);
  const getNotificationRepository = vi.fn(() => mockNotificationRepo);
  const getNotificationTemplateRepository = vi.fn(() => mockNotificationTemplateRepo);
  const getAuditLogRepository = vi.fn(() => mockAuditLogRepo);
  const getQuoteRepository = vi.fn(() => mockQuoteRepo);
  const getSpecialityRepository = vi.fn(() => mockSpecialityRepo);
  const getConversationRepository = vi.fn(() => mockConversationRepo);
  const getMessageRepository = vi.fn(() => mockMessageRepo);
  const getSupportTicketRepository = vi.fn(() => mockSupportTicketRepo);
  const getAttachmentRepository = vi.fn(() => mockAttachmentRepo);
  const getKYCRepository = vi.fn(() => mockKYCRepo);
  const getHealthProviderRepository = vi.fn(() => mockHealthProviderRepo);
  const getPrescriptionRepository = vi.fn(() => mockPrescriptionRepo);
  const getTeleconsultationRepository = vi.fn(() => mockTeleconsultationRepo);
  const getAvailabilityRuleRepository = vi.fn(() => mockAvailabilityRuleRepo);
  const getServiceRepository = vi.fn(() => mockServiceRepo);
  const getServiceOptionRepository = vi.fn(() => mockServiceOptionRepo);
  const getDataProcessingRecordRepository = vi.fn(() => mockDataProcessingRecordRepo);
  const getDataSubjectRequestRepository = vi.fn(() => mockDataSubjectRequestRepo);
  const getGDPRConsentRepository = vi.fn(() => mockGDPRConsentRepo);
  const getPCIAuditLogRepository = vi.fn(() => mockPCIAuditLogRepo);

  return {
    getUserRepository,
    getBeneficiaryRepository,
    getTransactionRepository,
    getBookingRepository,
    getInvoiceRepository,
    getComplaintRepository,
    getNotificationRepository,
    getNotificationTemplateRepository,
    getAuditLogRepository,
    getQuoteRepository,
    getSpecialityRepository,
    getConversationRepository,
    getMessageRepository,
    getSupportTicketRepository,
    getAttachmentRepository,
    getKYCRepository,
    getHealthProviderRepository,
    getPrescriptionRepository,
    getTeleconsultationRepository,
    getAvailabilityRuleRepository,
    getServiceRepository,
    getServiceOptionRepository,
    getDataProcessingRecordRepository,
    getDataSubjectRequestRepository,
    getGDPRConsentRepository,
    getPCIAuditLogRepository,
    repositoryContainer: {
      getInstance: vi.fn(() => ({
        get: vi.fn(),
        register: vi.fn(),
      })),
    },
  };
});

vi.mock('@/repositories', () => {
  // Utiliser mockRepositories qui est hoisted
  const repos = mockRepositories;
  
  // Retourner directement les mocks sans utiliser importOriginal
  // pour éviter les problèmes de connexion MongoDB
  // Toutes les interfaces et classes sont mockées comme des objets vides
  return {
    // Interfaces (mockées comme des types vides)
    IAuditLogRepository: {},
    IBeneficiaryRepository: {},
    IBookingRepository: {},
    IComplaintRepository: {},
    IHealthProviderRepository: {},
    IInvoiceRepository: {},
    IKYCRepository: {},
    INotificationRepository: {},
    INotificationTemplateRepository: {},
    IPrescriptionRepository: {},
    IQuoteRepository: {},
    IRepository: {},
    ISpecialityRepository: {},
    IServiceRepository: {},
    IServiceOptionRepository: {},
    ITeleconsultationRepository: {},
    ITransactionRepository: {},
    IUserRepository: {},
    IAvailabilityRuleRepository: {},
    
    // Classes (mockées comme des constructeurs vides)
    MongoAuditLogRepository: vi.fn(),
    MongoBeneficiaryRepository: vi.fn(),
    MongoBookingRepository: vi.fn(),
    MongoComplaintRepository: vi.fn(),
    MongoDataProcessingRecordRepository: vi.fn(),
    MongoDataSubjectRequestRepository: vi.fn(),
    MongoGDPRConsentRepository: vi.fn(),
    MongoHealthProviderRepository: vi.fn(),
    MongoInvoiceRepository: vi.fn(),
    MongoKYCRepository: vi.fn(),
    MongoNotificationRepository: vi.fn(),
    MongoNotificationTemplateRepository: vi.fn(),
    MongoPCIAuditLogRepository: vi.fn(),
    MongoPrescriptionRepository: vi.fn(),
    MongoQuoteRepository: vi.fn(),
    MongoSpecialityRepository: vi.fn(),
    MongoServiceRepository: vi.fn(),
    MongoServiceOptionRepository: vi.fn(),
    MongoTeleconsultationRepository: vi.fn(),
    MongoTransactionRepository: vi.fn(),
    MongoUserRepository: vi.fn(),
    MongoAvailabilityRuleRepository: vi.fn(),
    
    // Fonctions getter (les mocks réels) - utiliser les références depuis mockRepositories
    getUserRepository: repos.getUserRepository,
    getBeneficiaryRepository: repos.getBeneficiaryRepository,
    getTransactionRepository: repos.getTransactionRepository,
    getBookingRepository: repos.getBookingRepository,
    getInvoiceRepository: repos.getInvoiceRepository,
    getComplaintRepository: repos.getComplaintRepository,
    getNotificationRepository: repos.getNotificationRepository,
    getNotificationTemplateRepository: repos.getNotificationTemplateRepository,
    getAuditLogRepository: repos.getAuditLogRepository,
    getQuoteRepository: repos.getQuoteRepository,
    getSpecialityRepository: repos.getSpecialityRepository,
    getConversationRepository: repos.getConversationRepository,
    getMessageRepository: repos.getMessageRepository,
    getSupportTicketRepository: repos.getSupportTicketRepository,
    getAttachmentRepository: repos.getAttachmentRepository,
    getKYCRepository: repos.getKYCRepository,
    getHealthProviderRepository: repos.getHealthProviderRepository,
    getPrescriptionRepository: repos.getPrescriptionRepository,
    getTeleconsultationRepository: repos.getTeleconsultationRepository,
    getAvailabilityRuleRepository: repos.getAvailabilityRuleRepository,
    getServiceRepository: repos.getServiceRepository,
    getServiceOptionRepository: repos.getServiceOptionRepository,
    getDataProcessingRecordRepository: repos.getDataProcessingRecordRepository,
    getDataSubjectRequestRepository: repos.getDataSubjectRequestRepository,
    getGDPRConsentRepository: repos.getGDPRConsentRepository,
    getPCIAuditLogRepository: repos.getPCIAuditLogRepository,
    repositoryContainer: repos.repositoryContainer,
  };
});

// Extend Vitest's expect with jest-dom matchers
expect.extend({
  // Add custom matchers here if needed
});


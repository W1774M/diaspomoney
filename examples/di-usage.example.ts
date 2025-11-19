/**
 * Exemple d'utilisation du Dependency Injection Pattern
 * 
 * Ce fichier montre comment utiliser le conteneur de services
 * pour l'injection de dépendances dans votre codebase
 */

import { ServiceKeys, getService, initializeServiceRegistry } from '@/containers';
import { BookingService } from '@/services/booking/booking.service';
import { PaymentService } from '@/services/payment/payment.service';
import { UserService } from '@/services/user/user.service';

/**
 * Exemple 1: Utilisation basique avec getService
 */
export function exampleBasicUsage() {
  // Initialiser le registre (à faire une seule fois au démarrage)
  initializeServiceRegistry();

  // Récupérer un service depuis le conteneur
  const userService = getService<UserService>(ServiceKeys.UserService);
  const paymentService = getService<PaymentService>(ServiceKeys.PaymentService);
  const bookingService = getService<BookingService>(ServiceKeys.BookingService);

  // Utiliser les services (exemples commentés)
  void userService; // Variable d'exemple - sera utilisée dans l'implémentation
  void paymentService; // Variable d'exemple - sera utilisée dans l'implémentation
  void bookingService; // Variable d'exemple - sera utilisée dans l'implémentation
  // userService.getUserProfile(...)
  // paymentService.createPaymentIntent(...)
  // bookingService.getBookings(...)
}

/**
 * Exemple 2: Utilisation dans une classe avec injection de dépendances
 */
export class ExampleService {
  private userService: UserService;
  private paymentService: PaymentService;

  constructor() {
    // Injection manuelle via le conteneur
    this.userService = getService<UserService>(ServiceKeys.UserService);
    this.paymentService = getService<PaymentService>(ServiceKeys.PaymentService);
  }

  async processUserPayment(userId: string, amount: number) {
    const user = await this.userService.getUserProfile(userId);
    void user; // Variable d'exemple - sera utilisée dans l'implémentation complète
    // ... logique métier
    const payment = await this.paymentService.createPaymentIntent(
      amount,
      'EUR',
      userId,
      {},
    );
    return payment;
  }
}

/**
 * Exemple 3: Utilisation dans les tests avec mock
 * 
 * Note: Cette fonction nécessite jest pour être utilisée dans un environnement de test
 */
export async function exampleTestUsage() {
  const { serviceContainer } = await import('@/containers');

  // Enregistrer un mock pour les tests
  // Note: jest doit être disponible dans l'environnement de test
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jestFn = (globalThis as any).jest?.fn || (() => Promise.resolve(null));
  const mockUserService = {
    getUserProfile: jestFn(),
    // ... autres méthodes mockées
  };

  serviceContainer.registerInstance(ServiceKeys.UserService, mockUserService);

  // Utiliser le service mocké
  const userService = getService<UserService>(ServiceKeys.UserService);
  void userService; // Variable d'exemple - sera utilisée dans les tests
  // userService.getUserProfile(...) utilisera le mock

  // Réinitialiser après les tests
  // serviceContainer.reset();
}

/**
 * Exemple 4: Création d'un service avec dépendances
 */
export async function exampleServiceWithDependencies() {
  const { createService, ServiceKeys } = await import('@/containers');

  // Créer un service avec injection automatique de dépendances
  // Note: Cette approche nécessite que les dépendances soient déjà enregistrées
  const bookingService = createService<BookingService>(
    BookingService,
    [ServiceKeys.BookingRepository], // Dépendances requises
  );
  void bookingService; // Variable d'exemple - sera utilisée dans l'implémentation
}


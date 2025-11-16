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

  // Utiliser les services
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
    // ... logique métier
    const payment = await this.paymentService.createPaymentIntent(
      amount,
      'EUR',
      userId,
      {}
    );
    return payment;
  }
}

/**
 * Exemple 3: Utilisation dans les tests avec mock
 */
export function exampleTestUsage() {
  import { serviceContainer } from '@/containers';

  // Enregistrer un mock pour les tests
  const mockUserService = {
    getUserProfile: jest.fn(),
    // ... autres méthodes mockées
  };

  serviceContainer.registerInstance(ServiceKeys.UserService, mockUserService);

  // Utiliser le service mocké
  const userService = getService<UserService>(ServiceKeys.UserService);
  // userService.getUserProfile(...) utilisera le mock

  // Réinitialiser après les tests
  // serviceContainer.reset();
}

/**
 * Exemple 4: Création d'un service avec dépendances
 */
export function exampleServiceWithDependencies() {
  import { createService, ServiceKeys } from '@/containers';

  // Créer un service avec injection automatique de dépendances
  // Note: Cette approche nécessite que les dépendances soient déjà enregistrées
  const bookingService = createService<BookingService>(
    BookingService,
    [ServiceKeys.BookingRepository] // Dépendances requises
  );
}


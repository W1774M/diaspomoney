import { BOOKING_STATUSES } from '@/lib/constants';
import { childLogger } from '@/lib/logger';
import { UserRole } from '@/lib/types';
import {
  getBookingRepository,
  getConversationRepository,
  getUserRepository,
  type Booking,
} from '@/repositories';

interface ProviderInfo {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface ProgressStep {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'pending';
  completedAt?: Date;
}

interface ActiveOrder {
  _id: string;
  orderNumber: string;
  bookingId: string;
  serviceType: 'health';
  serviceName: string;
  serviceDescription?: string;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  status: 'confirmed' | 'pending';
  progress: {
    currentStep: number;
    totalSteps: number;
    steps: ProgressStep[];
    percentage: number;
    estimatedCompletionDate: Date;
  };
  assignedProviders: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: 'main';
    assignedAt: Date;
  }>;
  estimatedDeliveryDate: Date;
  beneficiary?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  amount: number;
  currency: 'EUR';
  paymentStatus: string;
  chatEnabled: boolean;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
}

function uniqueProviderIds(bookings: Booking[]): string[] {
  return Array.from(
    new Set(
      bookings
        .map((booking) => booking.providerId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
}

function formatDateValue(value: Date | string | undefined): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  return new Date().toISOString();
}

function getBookingIdentifier(booking: Booking): string {
  return booking.id || booking._id || '';
}

function getProviderName(provider: ProviderInfo | undefined): string {
  if (!provider) {
    return 'Prestataire';
  }

  return provider.name || `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || 'Prestataire';
}

function getBeneficiary(booking: Booking): ActiveOrder['beneficiary'] {
  const beneficiaryData = booking.beneficiary || booking.recipient;
  if (!beneficiaryData) {
    return undefined;
  }

  const firstName = beneficiaryData.firstName || '';
  const lastName = beneficiaryData.lastName || '';
  const phone = beneficiaryData.phone || '';

  if (!firstName && !lastName) {
    return undefined;
  }

  return {
    firstName,
    lastName,
    phone,
  };
}

function buildProgressSteps(booking: Booking): ProgressStep[] {
  const isConfirmed = booking.status === BOOKING_STATUSES.CONFIRMED;

  return [
    {
      id: '1',
      name: 'Réservation confirmée',
      description: 'Votre réservation a été confirmée',
      status: isConfirmed ? 'completed' : 'pending',
      ...(isConfirmed ? { completedAt: booking.createdAt } : {}),
    },
    {
      id: '2',
      name: 'Prise de contact',
      description: 'Le prestataire vous contactera',
      status: 'pending',
    },
    {
      id: '3',
      name: 'Service en cours',
      description: 'Votre service est en cours de réalisation',
      status: 'pending',
    },
    {
      id: '4',
      name: 'Service terminé',
      description: 'Votre service a été complété',
      status: 'pending',
    },
  ];
}

async function getProviderMap(providerIds: string[]): Promise<Map<string, ProviderInfo>> {
  const userRepository = getUserRepository();
  const providers = await Promise.all(
    providerIds.map(async (id) => {
      try {
        const user = await userRepository.findById(id);
        if (!user?.roles?.includes(UserRole.PROVIDER)) {
          return null;
        }

        const provider: ProviderInfo = {
          id,
          name: user.name,
          ...(user.firstName ? { firstName: user.firstName } : {}),
          ...(user.lastName ? { lastName: user.lastName } : {}),
          ...(typeof user.avatar === 'string' ? { avatar: user.avatar } : {}),
        };

        return provider;
      } catch {
        return null;
      }
    }),
  );

  return new Map(
    providers
      .filter((provider): provider is ProviderInfo => provider !== null)
      .map((provider) => [provider.id, provider]),
  );
}

async function getConversationMap(
  userId: string,
  providerIds: string[],
  bookings: Booking[],
): Promise<Map<string, string>> {
  const conversationRepository = getConversationRepository();
  const conversationMap = new Map<string, string>();

  await Promise.all(
    providerIds.map(async (providerId) => {
      try {
        const conversation = await conversationRepository.findByParticipants(
          [userId, providerId],
          'user',
        );

        if (!conversation?._id) {
          return;
        }

        bookings
          .filter((booking) => booking.providerId === providerId)
          .forEach((booking) => {
            const bookingId = getBookingIdentifier(booking);
            if (bookingId) {
              conversationMap.set(bookingId, conversation._id!.toString());
            }
          });
      } catch {
        // L'absence de conversation ne doit pas bloquer la liste des commandes actives.
      }
    }),
  );

  return conversationMap;
}

function mapBookingToActiveOrder(
  booking: Booking,
  providerMap: Map<string, ProviderInfo>,
  conversationMap: Map<string, string>,
): ActiveOrder {
  const bookingId = getBookingIdentifier(booking);
  const provider = providerMap.get(booking.providerId);
  const providerName = getProviderName(provider);
  const progressSteps = buildProgressSteps(booking);
  const completedSteps = progressSteps.filter((step) => step.status === 'completed').length;
  const estimatedDeliveryDate = new Date(booking.createdAt);
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);
  const beneficiary = getBeneficiary(booking);
  const conversationId = conversationMap.get(bookingId);

  return {
    _id: bookingId,
    orderNumber: booking.reservationNumber || `CMD-${bookingId.slice(-6)}`,
    bookingId,
    serviceType: 'health',
    serviceName: booking.selectedService?.name || 'Service de santé',
    ...(booking.selectedService?.description
      ? { serviceDescription: booking.selectedService.description }
      : {}),
    providerId: booking.providerId,
    providerName,
    ...(provider?.avatar ? { providerAvatar: provider.avatar } : {}),
    status: booking.status === BOOKING_STATUSES.CONFIRMED ? 'confirmed' : 'pending',
    progress: {
      currentStep: completedSteps,
      totalSteps: progressSteps.length,
      steps: progressSteps,
      percentage: Math.round((completedSteps / progressSteps.length) * 100),
      estimatedCompletionDate: estimatedDeliveryDate,
    },
    assignedProviders: [
      {
        id: booking.providerId,
        name: providerName,
        ...(provider?.avatar ? { avatar: provider.avatar } : {}),
        role: 'main',
        assignedAt: booking.createdAt,
      },
    ],
    estimatedDeliveryDate,
    ...(beneficiary ? { beneficiary } : {}),
    amount: booking.selectedService?.price || 0,
    currency: 'EUR',
    paymentStatus: String(booking.metadata?.['paymentStatus'] || 'pending'),
    chatEnabled: true,
    ...(conversationId ? { conversationId } : {}),
    createdAt: formatDateValue(booking.createdAt),
    updatedAt: formatDateValue(booking.updatedAt),
  };
}

export async function getActiveOrdersUseCase(userId: string): Promise<ActiveOrder[]> {
  const log = childLogger({ useCase: 'getActiveOrders' });
  const bookingRepository = getBookingRepository();
  const activeBookingsResult = await bookingRepository.findBookingsWithFilters(
    {
      requesterId: userId,
    },
    {
      limit: 100,
      page: 1,
      offset: 0,
      sort: { createdAt: -1 },
    },
  );

  const activeBookings = activeBookingsResult.data.filter(
    (booking) => (
      booking.status === BOOKING_STATUSES.PENDING ||
      booking.status === BOOKING_STATUSES.CONFIRMED
    ),
  );

  const providerIds = uniqueProviderIds(activeBookings);
  const [providerMap, conversationMap] = await Promise.all([
    getProviderMap(providerIds),
    getConversationMap(userId, providerIds, activeBookings),
  ]);

  const orders = activeBookings.map((booking) => (
    mapBookingToActiveOrder(booking, providerMap, conversationMap)
  ));

  log.info({ userId, orderCount: orders.length }, 'Active orders retrieved successfully');

  return orders;
}

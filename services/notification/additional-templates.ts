/**
 * Modèles de notification utilisés par l'application mais absents de la base et de la liste
 * par défaut de notification.service.ts : sans eux, ces notifications ne partaient jamais
 * (« Template non trouvé »).
 *
 * Règles d'écriture :
 * - le moteur ne remplace que les variables de premier niveau ({{clé}}) : une donnée imbriquée
 *   (booking, conversation, prescription…) s'afficherait « [object Object] » ;
 * - une variable absente resterait affichée telle quelle : n'utiliser que des clés que tous
 *   les appels transmettent ;
 * - un modèle en base (collection notificationTemplates) reste prioritaire sur ces textes.
 */
import type { NotificationTemplate } from '@/lib/types/notifications.types';

type TemplateText = {
  subject: string;
  content: string;
  /** Variables réellement transmises par les appels de l'application. */
  variables: string[];
};

const TEXTS: Record<string, TemplateText> = {
  // ---------------------------------------------------------------- Réservations (client)
  booking_created: {
    subject: 'Votre réservation est enregistrée',
    content:
      'Votre réservation {{bookingId}} est bien enregistrée pour le {{appointmentDate}}. Vous recevrez une confirmation dès qu’elle sera validée.',
    variables: ['bookingId', 'appointmentDate'],
  },
  booking_confirmation: {
    subject: 'Votre réservation est confirmée',
    content:
      'Bonne nouvelle : votre réservation est confirmée. Retrouvez la date, l’heure et le prestataire dans votre espace DiaspoMoney, rubrique « Mes réservations ».',
    variables: [],
  },
  service_booking_confirmed: {
    subject: 'Réservation confirmée — {{serviceLabel}}',
    content: '{{message}}\n\nRéférence : {{reservationNumber}}',
    variables: ['message', 'serviceLabel', 'reservationNumber'],
  },
  booking_status_updated: {
    subject: 'Réservation {{reservationNumber}} : nouveau statut',
    content:
      'Votre réservation {{reservationNumber}} ({{serviceName}}) du {{appointmentDate}} à {{appointmentTime}} est passée au statut « {{status}} ». Détails : {{bookingsUrl}}',
    variables: ['reservationNumber', 'serviceName', 'appointmentDate', 'appointmentTime', 'status', 'bookingsUrl'],
  },
  booking_finished: {
    subject: 'Réservation {{reservationNumber}} terminée',
    content:
      'La prestation {{serviceName}} du {{appointmentDate}} (réservation {{reservationNumber}}) est terminée. Merci de votre confiance. Votre historique : {{bookingsUrl}}',
    variables: ['reservationNumber', 'serviceName', 'appointmentDate', 'bookingsUrl'],
  },

  // ----------------------------------------------------------- Réservations (prestataire)
  provider_booking_status_updated: {
    subject: 'Mission {{reservationNumber}} : nouveau statut',
    content:
      'Bonjour {{providerName}}, la mission {{reservationNumber}} ({{serviceName}}) du {{appointmentDate}} à {{appointmentTime}} est passée au statut « {{status}} ». Détails : {{bookingsUrl}}',
    variables: ['providerName', 'reservationNumber', 'serviceName', 'appointmentDate', 'appointmentTime', 'status', 'bookingsUrl'],
  },
  provider_booking_finished: {
    subject: 'Mission {{reservationNumber}} terminée',
    content:
      'Bonjour {{providerName}}, la mission {{reservationNumber}} ({{serviceName}}) du {{appointmentDate}} est marquée comme terminée. Détails : {{bookingsUrl}}',
    variables: ['providerName', 'reservationNumber', 'serviceName', 'appointmentDate', 'bookingsUrl'],
  },

  // ------------------------------------------------------------ Réservations (équipe)
  booking_received: {
    subject: 'Nouvelle réservation reçue',
    content:
      'Une nouvelle réservation vient d’être passée sur DiaspoMoney. Consultez-la dans le tableau de bord, rubrique « Réservations ».',
    variables: [],
  },
  csm_booking_status_updated: {
    subject: 'Réservation {{reservationNumber}} : statut « {{status}} »',
    content:
      'La réservation {{reservationNumber}} ({{serviceName}}) du {{appointmentDate}} à {{appointmentTime}} est passée au statut « {{status}} ». Détails : {{bookingsUrl}}',
    variables: ['reservationNumber', 'serviceName', 'appointmentDate', 'appointmentTime', 'status', 'bookingsUrl'],
  },

  // ------------------------------------------------------------------ Paiements, factures
  transaction_created: {
    subject: 'Paiement de {{amount}} {{currency}} enregistré',
    content:
      'Votre paiement de {{amount}} {{currency}} a bien été enregistré (référence {{transactionId}}). Vous recevrez une confirmation dès qu’il sera traité.',
    variables: ['transactionId', 'amount', 'currency'],
  },
  payment_succeeded: {
    subject: 'Paiement de {{amount}} {{currency}} confirmé',
    content:
      'Votre paiement de {{amount}} {{currency}} est confirmé (référence {{transactionId}}). Merci de votre confiance.',
    variables: ['amount', 'currency', 'transactionId'],
  },
  invoice_created: {
    subject: 'Votre facture de {{amount}} {{currency}}',
    content:
      'Une facture de {{amount}} {{currency}} est disponible dans votre espace DiaspoMoney, rubrique « Factures ».',
    variables: ['amount', 'currency'],
  },

  // ---------------------------------------------------------- Bénéficiaires, réclamations
  beneficiary_created: {
    subject: '{{firstName}} {{lastName}} ajouté(e) à vos bénéficiaires',
    content:
      '{{firstName}} {{lastName}} fait désormais partie de vos bénéficiaires. Vous pouvez réserver et payer des services pour cette personne depuis votre espace.',
    variables: ['firstName', 'lastName'],
  },
  complaint_created: {
    subject: 'Votre réclamation est enregistrée',
    content:
      'Nous avons bien reçu votre réclamation (type : {{type}}, priorité : {{priority}}). Notre équipe vous répond dans les meilleurs délais.',
    variables: ['type', 'priority'],
  },
  message_received: {
    subject: 'Nouveau message sur DiaspoMoney',
    content:
      'Vous avez reçu un nouveau message. Consultez-le dans votre espace DiaspoMoney, rubrique « Messagerie ».',
    variables: [],
  },

  // ------------------------------------------------------------------------------ Santé
  appointment_confirmation: {
    subject: 'Votre rendez-vous est confirmé',
    content:
      'Votre rendez-vous médical est confirmé. Retrouvez la date, l’heure et le praticien dans votre espace DiaspoMoney.',
    variables: [],
  },
  prescription_created: {
    subject: 'Une ordonnance est disponible',
    content:
      'Une nouvelle ordonnance a été émise à votre nom. Vous pouvez la consulter dans votre espace DiaspoMoney.',
    variables: [],
  },

  // ------------------------------------------------------------------------- Éducation
  education_inquiry: {
    subject: 'Votre demande pour {{studentName}} est bien reçue',
    content:
      'Nous avons bien reçu votre demande d’inscription pour {{studentName}} (référence {{quoteId}}). Un conseiller DiaspoMoney vous recontacte rapidement.',
    variables: ['studentName', 'quoteId'],
  },
  enrollment_confirmation: {
    subject: 'Inscription de {{studentName}} confirmée',
    content:
      'L’inscription de {{studentName}} à {{schoolName}} est confirmée. Vous retrouverez les prochaines étapes dans votre espace DiaspoMoney.',
    variables: ['studentName', 'schoolName'],
  },

  // ------------------------------------------------------------------------------- BTP
  quote_request: {
    subject: 'Votre demande de devis est bien reçue',
    content:
      'Nous avons bien reçu votre demande de devis (référence {{quoteId}}, projet : {{projectType}}). Première estimation : {{estimatedCost}}. Un conseiller vous recontacte pour l’affiner.',
    variables: ['quoteId', 'projectType', 'estimatedCost'],
  },
  project_created: {
    subject: 'Votre projet « {{projectName}} » est créé',
    content:
      'Votre projet {{projectType}} « {{projectName}} » est créé. Fin prévue : {{expectedEndDate}}. Vous suivrez son avancement dans votre espace DiaspoMoney.',
    variables: ['projectName', 'projectType', 'expectedEndDate'],
  },
  // ---------------------------------------------------------------- Admin (propositions CSM)
  admin_csm_provider_proposed: {
    subject: 'Prestataire à valider : {{providerName}}',
    content:
      '{{csmName}} a ajouté un prestataire sans compte à son portefeuille : {{providerName}} (contact : {{contact}}). {{missingLine}} Suivi dans Candidatures prestataires ; fiche : {{providerUrl}}',
    variables: ['providerName', 'csmName', 'contact', 'missingLine', 'providerUrl'],
  },
};

/** Noms des modèles fournis ici. */
export const ADDITIONAL_TEMPLATE_NAMES = Object.keys(TEXTS);

/** Construit le modèle complet attendu par le service de notification, ou null. */
export function getAdditionalTemplate(name: string, locale: string): NotificationTemplate | null {
  // Accepte aussi les anciens noms à tirets (ex. service-booking-confirmed).
  const text = TEXTS[name] ?? TEXTS[name.replace(/-/g, '_')];
  if (!text) return null;
  const now = new Date();
  return {
    _id: name,
    id: name,
    name,
    subject: text.subject,
    content: text.content,
    variables: text.variables,
    channels: [{ type: 'EMAIL', enabled: true, priority: 'MEDIUM' }],
    locale,
    createdAt: now,
    updatedAt: now,
  } as NotificationTemplate;
}

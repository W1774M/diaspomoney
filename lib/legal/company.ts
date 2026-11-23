/**
 * Informations légales de l'éditeur de DiaspoMoney : source unique pour les mentions légales,
 * les CGU, les CGV, la politique de confidentialité et les factures PDF.
 *
 * La société WE WIN SOLUTIONS – DIASPOMONEY (SAS) est en cours de formation (non immatriculée).
 * En attendant, la plateforme est portée par VALEUR ETHIC CONSEIL.
 * Sources : annuaire des entreprises (INSEE / INPI), SIREN 500 085 709 ; CGV IONOS pour l'hébergeur.
 * À l'immatriculation de la SAS, mettre à jour ce fichier (et LEGAL_DOCUMENTS_EFFECTIVE_DATE).
 */

export const LEGAL_ENTITY = {
  /** Nom commercial de la plateforme. */
  brand: 'DiaspoMoney',
  name: 'VALEUR ETHIC CONSEIL',
  legalForm: 'SARL',
  siren: '500 085 709',
  siret: '500 085 709 00029',
  /** Aucun numéro de TVA intracommunautaire valide à ce jour. */
  vatNumber: null as string | null,
  address: {
    street: "42 rue d'Achères",
    postalCode: '78600',
    city: 'Maisons-Laffitte',
    country: 'France',
  },
  email: 'contact@diaspomoney.fr',
  website: 'https://diaspomoney.fr',
  publicationDirector: 'Théodore Ntone Priso',
  /** Société qui reprendra l'activité à son immatriculation. */
  successor: 'WE WIN SOLUTIONS – DIASPOMONEY (SAS), en cours de formation',
} as const;

/** Pas de DPO désigné : les demandes relatives aux données passent par l'adresse de contact. */
export const DATA_PROTECTION_CONTACT = {
  dpoDesignated: false,
  email: LEGAL_ENTITY.email,
  subject: 'Données personnelles',
} as const;

export const HOSTING_PROVIDER = {
  name: 'IONOS SARL',
  address: '7, place de la Gare, BP 70109, 57200 Sarreguemines Cedex, France',
  registration: '431 303 775 RCS Sarreguemines',
  phone: '09 70 80 89 11',
  website: 'https://www.ionos.fr',
} as const;

/** Date d'entrée en vigueur des documents légaux (AAAA-MM-JJ). */
export const LEGAL_DOCUMENTS_EFFECTIVE_DATE = '2026-11-23';

export function formatLegalAddress(): string {
  const { street, postalCode, city, country } = LEGAL_ENTITY.address;
  return `${street}, ${postalCode} ${city}, ${country}`;
}

/** Ex. « VALEUR ETHIC CONSEIL, SARL, SIREN 500 085 709, 42 rue d'Achères, 78600 Maisons-Laffitte, France » */
export function legalIdentity(): string {
  return `${LEGAL_ENTITY.name}, ${LEGAL_ENTITY.legalForm}, SIREN ${LEGAL_ENTITY.siren}, ${formatLegalAddress()}`;
}

/** Ex. « 23 novembre 2026 » */
export function formatEffectiveDate(isoDate: string = LEGAL_DOCUMENTS_EFFECTIVE_DATE): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  });
}

export interface ClinicOption {
  id: string;
  name: string;
  image: string;
  location: string;
  /** Code ISO 3166-1 alpha-2 du pays (ex. « CM »). */
  country: string;
  specialties: string[];
  generalistPrice?: string;
  specialistPrice?: string;
}

export const HEALTH_CLINICS: ClinicOption[] = [
  {
    id: 'clinique-saint-petersbourg',
    name: 'CLINIQUE SAINT PETERSBOURG',
    image: '/img/partners/image-saint-petersboug.png',
    location: 'Bonaberi - Douala',
    country: 'CM',
    specialties: [
      'Médecine Générale',
      'Pédiatrie',
      'Gynécologie',
      'Kinésiste',
      'Laboratoire Biomédical',
    ],
    generalistPrice: '19€',
    specialistPrice: '29€',
  },
  {
    id: 'clinique-house-health',
    name: 'CLINIQUE House Health',
    image: '/img/partners/imimaege-house-health.png',
    location: 'Longpome - Douala',
    country: 'CM',
    specialties: [
      'Médecine Générale',
      'Cardiologie',
      'Gynécologie',
      'Neurologie',
      'Neurochirurgie',
      'Pédiatrie',
    ],
    generalistPrice: '19€',
    specialistPrice: '29€',
  },
  {
    id: 'clinique-medico-pediatrique-ma-vie',
    name: 'Clinique Médico Pédiatrique Ma Vie',
    image: '/img/partners/image-ma-vie.png',
    location: 'Yassa - Douala',
    country: 'CM',
    specialties: [
      'Médecine Générale',
      'Pédiatrie',
      'Gynécologie',
      'ORL',
      'Laboratoire',
      'Chirurgie générale',
      'Accouchement',
    ],
    generalistPrice: '19€',
    specialistPrice: '29€',
  },
  {
    id: 'clinique-dentaire-yosam',
    name: 'Clinique Dentaire Yosam',
    image: '/img/partners/image-yosam.png',
    location: 'New-belle - Douala',
    country: 'CM',
    specialties: ['Chirurgie dentaire', 'Ortho dentiste'],
    specialistPrice: '29€',
  },
  {
    id: 'clinique-de-bonapriso',
    name: 'Clinique de Bonapriso',
    image: '/img/partners/image-bonapriso.png',
    location: 'Bonapriso - Douala',
    country: 'CM',
    specialties: ['Médecine Générale', 'Chirurgie générale', 'Endocrino', 'Gynécologie'],
    generalistPrice: '19€',
    specialistPrice: '29€',
  },
  {
    id: 'clinique-de-deido',
    name: 'Clinique de Deido',
    image: '/img/partners/image-deido.png',
    location: 'Bonantone - Douala',
    country: 'CM',
    specialties: ['Médecine Générale', 'Chirurgie générale'],
    generalistPrice: '19€',
    specialistPrice: '29€',
  },
];

export function getHealthClinicById(clinicId: string | null | undefined): ClinicOption | null {
  if (!clinicId) {
    return null;
  }

  return HEALTH_CLINICS.find((clinic) => clinic.id === clinicId) ?? null;
}

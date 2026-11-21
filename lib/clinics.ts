export interface ClinicOption {
  id: string;
  name: string;
  image: string;
  location: string;
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
    specialties: ['Chirurgie dentaire', 'Ortho dentiste'],
    specialistPrice: '29€',
  },
  {
    id: 'clinique-de-bonapriso',
    name: 'Clinique de Bonapriso',
    image: '/img/partners/image-bonapriso.png',
    location: 'Bonapriso - Douala',
    specialties: ['Médecine Générale', 'Chirurgie générale', 'Endocrino', 'Gynécologie'],
    generalistPrice: '19€',
    specialistPrice: '29€',
  },
  {
    id: 'clinique-de-deido',
    name: 'Clinique de Deido',
    image: '/img/partners/image-deido.png',
    location: 'Bonantone - Douala',
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

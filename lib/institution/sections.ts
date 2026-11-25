/**
 * Entrées du menu Institution. Chaque clé est le dernier segment
 * de /dashboard/institution/<clé>.
 */
export interface InstitutionSection {
  slug: string;
  title: string;
  description: string;
  empty: string;
  hint: string;
}

export const INSTITUTION_SECTIONS: Record<string, InstitutionSection> = {
  doctors: {
    slug: 'doctors',
    title: 'Mes médecins',
    description: 'Les médecins rattachés à votre établissement.',
    empty: 'Aucun médecin enregistré.',
    hint: 'Un médecin rattaché à l’établissement apparaît dans cette liste.',
  },
  nurses: {
    slug: 'nurses',
    title: 'Mes infirmiers',
    description: 'Les infirmiers rattachés à votre établissement.',
    empty: 'Aucun infirmier enregistré.',
    hint: 'Un infirmier rattaché à l’établissement apparaît dans cette liste.',
  },
  patients: {
    slug: 'patients',
    title: 'Mes patients',
    description: 'Les patients suivis par votre établissement.',
    empty: 'Aucun patient enregistré.',
    hint: 'Un patient suivi par l’établissement apparaît dans cette liste.',
  },
  appointments: {
    slug: 'appointments',
    title: 'Mes rendez-vous',
    description: 'Les rendez-vous pris dans votre établissement.',
    empty: 'Aucun rendez-vous.',
    hint: 'Un rendez-vous pris dans l’établissement apparaît ici.',
  },
  freelancers: {
    slug: 'freelancers',
    title: 'Mes indépendants',
    description: 'Les indépendants qui interviennent pour votre structure.',
    empty: 'Aucun indépendant enregistré.',
    hint: 'Un indépendant rattaché à la structure apparaît dans cette liste.',
  },
  clients: {
    slug: 'clients',
    title: 'Mes clients',
    description: 'Les clients de votre structure.',
    empty: 'Aucun client enregistré.',
    hint: 'Un client de la structure apparaît dans cette liste.',
  },
  missions: {
    slug: 'missions',
    title: 'Mes missions',
    description: 'Les missions confiées à votre structure.',
    empty: 'Aucune mission.',
    hint: 'Une mission confiée à la structure apparaît ici.',
  },
  teachers: {
    slug: 'teachers',
    title: 'Mes professeurs',
    description: 'Les professeurs de votre établissement.',
    empty: 'Aucun professeur enregistré.',
    hint: 'Un professeur rattaché à l’établissement apparaît dans cette liste.',
  },
  students: {
    slug: 'students',
    title: 'Mes élèves',
    description: 'Les élèves inscrits dans votre établissement.',
    empty: 'Aucun élève enregistré.',
    hint: 'Un élève inscrit apparaît dans cette liste.',
  },
  classes: {
    slug: 'classes',
    title: 'Mes classes',
    description: 'Les classes de votre établissement.',
    empty: 'Aucune classe.',
    hint: 'Une classe de l’établissement apparaît ici.',
  },
  teams: {
    slug: 'teams',
    title: 'Mes équipes',
    description: 'Les équipes de votre structure.',
    empty: 'Aucune équipe.',
    hint: 'Une équipe de la structure apparaît ici.',
  },
};

export function getInstitutionSection(slug: string): InstitutionSection | undefined {
  return INSTITUTION_SECTIONS[slug];
}

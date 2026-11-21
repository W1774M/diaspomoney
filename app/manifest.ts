import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DiaspoMoney – Services pour la diaspora',
    short_name: 'DiaspoMoney',
    description:
      'Réservez et payez des services pour vos proches en Afrique : santé, éducation, immobilier.',
    lang: 'fr',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDF8F3',
    theme_color: '#F97015',
    icons: [{ src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' }],
  };
}

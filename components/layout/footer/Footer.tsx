import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import Logo from '@/components/ui/Logo';

// Facebook icon component (replacement for deprecated lucide-react Facebook)
const FacebookIcon = ({ size, style }: { size: number; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Twitter icon component (replacement for deprecated lucide-react Twitter)
const TwitterIcon = ({ size, style }: { size: number; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Instagram icon component (replacement for deprecated lucide-react Instagram)
const InstagramIcon = ({ size, style }: { size: number; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
  </svg>
);

// LinkedIn icon component (replacement for deprecated lucide-react Linkedin)
const LinkedinIcon = ({ size, style }: { size: number; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const FooterLinks = ({
  links,
  label,
}: {
  links: { href: string; text: string; target?: string; rel?: string }[];
  label?: string;
}) => {
  return (
    <div className='flex flex-col'>
      <h4 
        className='text-base font-bold mb-4 tracking-wide'
        style={{ 
          color: '#1C1917',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}
      >
        {label}
      </h4>
      <ul className='space-y-2.5'>
        {links.map((link, index) => (
          <li key={`footer-link-${index}`}>
            <Link
              href={link.href}
              className='text-sm transition-colors duration-200 hover:opacity-80'
              style={{
                color: '#555555',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
              target={link?.target}
              rel={link?.rel}
            >
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FooterComponent = ({ className = '' }: { className?: string }) => {
  return (
    <footer 
      className={`${className}`}
      style={{ 
        backgroundColor: '#FDF8F3',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section principale - 4 colonnes */}
        <div className='py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12'>
          {/* Colonne 1 : Logo et description avec réseaux sociaux */}
          <div className='lg:col-span-1'>
            {/* Logo */}
            <Logo src='/img/diaspo/Logo_DispoMoney_horiz_CMJN.png' width={640} height={320} alt='Diaspomoney' className='h-20 w-auto mb-4' />
            
            {/* Description */}
            <p 
              className='text-sm leading-relaxed mb-6 max-w-xs'
              style={{ color: '#555555' }}
            >
              La plateforme qui permet à la diaspora africaine de prendre soin de ses proches en payant directement leurs services de santé.
            </p>
            
            {/* Réseaux sociaux */}
            <div className='flex gap-3'>
              <a
                href='https://www.facebook.com/profile.php?id=61586670864659'
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 rounded-full border flex items-center justify-center transition-colors hover:bg-gray-100'
                style={{ 
                  backgroundColor: '#FDF8F3',
                  borderColor: '#E5E5E5',
                }}
                aria-label='Facebook'
              >
                <FacebookIcon size={18} style={{ color: '#555555' }} />
              </a>
              <a
                href='https://twitter.com'
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 rounded-full border flex items-center justify-center transition-colors hover:bg-gray-100'
                style={{ 
                  backgroundColor: '#FDF8F3',
                  borderColor: '#E5E5E5',
                }}
                aria-label='Twitter'
              >
                <TwitterIcon size={18} style={{ color: '#555555' }} />
              </a>
              <a
                href='https://www.instagram.com/diaspomoney.fr/'
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 rounded-full border flex items-center justify-center transition-colors hover:bg-gray-100'
                style={{ 
                  backgroundColor: '#FDF8F3',
                  borderColor: '#E5E5E5',
                }}
                aria-label='Instagram'
              >
                <InstagramIcon size={18} style={{ color: '#555555' }} />
              </a>
              <a
                href='linkedin.com/company/diaspomoney'
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 rounded-full border flex items-center justify-center transition-colors hover:bg-gray-100'
                style={{ 
                  backgroundColor: '#FDF8F3',
                  borderColor: '#E5E5E5',
                }}
                aria-label='LinkedIn'
              >
                <LinkedinIcon size={18} style={{ color: '#555555' }} />
              </a>
            </div>
          </div>

          {/* Colonne 2 : Services */}
          <FooterLinks
            label='Services'
            links={[
              { href: '/services/health', text: 'Santé' },
              { href: '/services/edu', text: 'Éducation' },
              { href: '/services/immo', text: 'Immobilier' },
            ]}
          />

          {/* Colonne 3 : Entreprise */}
          <FooterLinks
            label='Entreprise'
            links={[
              { href: '/about', text: 'À propos' },
            ]}
          />

          {/* Colonne 4 : Contact */}
          <div className='flex flex-col'>
            <h4 
              className='text-base font-bold mb-4 tracking-wide'
              style={{ 
                color: '#1C1917',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Contact
            </h4>
            <div className='space-y-3'>
              {/* Email */}
              <div className='flex items-center gap-3'>
                <Mail size={18} style={{ color: '#F97015' }} />
                <a
                  href='mailto:contact@diaspomoney.fr'
                  className='text-sm transition-colors hover:opacity-80'
                  style={{
                    color: '#555555',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  contact@diaspomoney.fr
                </a>
              </div>
              
              {/* Téléphone
              <div className='flex items-center gap-3'>
                <Phone size={18} style={{ color: '#F97015' }} />
                <a
                  href='tel:+33651276570'
                  className='text-sm transition-colors hover:opacity-80'
                  style={{
                    color: '#555555',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  +33 6 51 27 65 70
                </a>
              </div> */}
              
              {/* Adresse */}
              <div className='flex items-center gap-3'>
                <MapPin size={18} style={{ color: '#F97015' }} />
                <span
                  className='text-sm'
                  style={{
                    color: '#555555',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  Seine Innopolis, 76140 Le Petit-Quevilly, France
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section inférieure - Copyright et liens légaux */}
        <div 
          className='border-t pt-8 pb-8 flex flex-col md:flex-row justify-between items-center gap-4'
          style={{ borderColor: '#E5E5E5' }}
        >
          {/* Copyright */}
          <p 
            className='text-xs text-center md:text-left'
            style={{ 
              color: '#999999',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            © 2026 DiaspoMoney. Tous droits réservés.
          </p>
          
          {/* Liens légaux */}
          <div className='flex flex-wrap justify-center md:justify-end gap-4 md:gap-6'>
            <Link
              href='/terms-and-conditions'
              className='text-xs transition-colors hover:opacity-80'
              style={{
                color: '#999999',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Conditions d&apos;utilisation
            </Link>
            <Link
              href='/terms-of-sale'
              className='text-xs transition-colors hover:opacity-80'
              style={{
                color: '#999999',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Conditions générales de vente
            </Link>
            <Link
              href='/privacy-policy'
              className='text-xs transition-colors hover:opacity-80'
              style={{
                color: '#999999',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Politique de confidentialité
            </Link>
            {/* <Link
              href='/legal'
              className='text-xs transition-colors hover:opacity-80'
              style={{
                color: '#999999',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Mentions légales
            </Link> */}
          </div>
        </div>
      </div>
    </footer>
  );
};
export default FooterComponent;

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BannerMessageContent, HomeBanner } from '../../components/features/home/HomeBanner';
import type { HomeBannerMessage } from '../../lib/home-content';

const message = (extra: Partial<HomeBannerMessage>): HomeBannerMessage => ({
  id: 'm',
  icon: '🎉',
  textBefore: 'Promo',
  linkType: 'none',
  linkLabel: '',
  linkHref: '',
  textAfter: '',
  isActive: true,
  order: 1,
  startsAt: null,
  endsAt: null,
  ...extra,
});

describe('HomeBanner', () => {
  it('ne rend rien sans message', () => {
    const { container } = render(<HomeBanner messages={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('rend un lien interne, un lien externe et un bouton d’annonce', () => {
    render(
      <HomeBanner
        messages={[
          message({ id: '1', linkType: 'url', linkLabel: 'en savoir plus', linkHref: '/services/edu', textAfter: '.' }),
          message({ id: '2', linkType: 'url', linkLabel: 'partenaire', linkHref: 'https://example.com' }),
          message({ id: '3', linkType: 'announcement', linkLabel: 'voir l’offre' }),
        ]}
      />,
    );

    expect(screen.getByRole('region', { name: 'Annonces DiaspoMoney' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'en savoir plus' })[0]).toHaveAttribute('href', '/services/edu');
    const external = screen.getAllByRole('link', { name: /partenaire/ })[0];
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');

    const listener = vi.fn();
    window.addEventListener('diaspomoney:open-home-announcement', listener);
    fireEvent.click(screen.getAllByRole('button', { name: 'voir l’offre' })[0]!);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('diaspomoney:open-home-announcement', listener);
  });

  it('en aperçu, le lien n’est pas cliquable', () => {
    render(
      <BannerMessageContent
        message={message({ linkType: 'url', linkLabel: 'devis', linkHref: '/services/immo' })}
        preview
      />,
    );
    expect(screen.getByText('devis')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('ignore un lien sans adresse ou sans libellé', () => {
    render(
      <>
        <BannerMessageContent message={message({ id: 'a', linkType: 'url', linkLabel: 'vide' })} />
        <BannerMessageContent message={message({ id: 'b', linkType: 'url', linkHref: '/x' })} />
      </>,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

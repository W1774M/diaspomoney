import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CookieConsent, ManageCookiesButton } from '@/components/consent/CookieConsent';

const KEY = 'diaspomoney.consent';

describe('CookieConsent', () => {
  afterEach(() => {
    window.localStorage.clear();
    delete (window as unknown as { dataLayer?: unknown }).dataLayer;
  });

  it('propose Accepter et Refuser au premier passage, sans charger GTM', () => {
    render(<CookieConsent />);
    expect(screen.getByRole('region', { name: /vos choix sur les cookies/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accepter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refuser' })).toBeInTheDocument();
    expect(document.getElementById('gtm-script')).toBeNull();
  });

  it('mémorise un refus et met à jour le Consent Mode', () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole('button', { name: 'Refuser' }));
    expect(JSON.parse(window.localStorage.getItem(KEY)!).analytics).toBe('denied');
    expect(screen.queryByRole('region', { name: /cookies/i })).toBeNull();
    const dataLayer = (window as unknown as { dataLayer: IArguments[] }).dataLayer;
    const update = Array.from(dataLayer.at(-1)!);
    expect(update.slice(0, 2)).toEqual(['consent', 'update']);
    expect(update[2]).toMatchObject({ analytics_storage: 'denied' });
  });

  it('ne redemande pas un choix récent, mais se rouvre depuis « Gérer les cookies »', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ analytics: 'denied', date: Date.now() }));
    render(
      <>
        <CookieConsent />
        <ManageCookiesButton />
      </>,
    );
    expect(screen.queryByRole('region', { name: /cookies/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Gérer les cookies' }));
    expect(screen.getByRole('region', { name: /cookies/i })).toBeInTheDocument();
  });
});

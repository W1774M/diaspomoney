import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomeAnnouncementDialog from '../../components/features/home/HomeAnnouncementDialog';

describe('HomeAnnouncementDialog', () => {
  it('peut être ouverte manuellement par la bannière même sans affichage automatique', () => {
    render(<HomeAnnouncementDialog />);

    act(() => {
      window.dispatchEvent(new Event('diaspomoney:open-home-announcement'));
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Offre spéciale de 2 euros')).toBeInTheDocument();
  });
});

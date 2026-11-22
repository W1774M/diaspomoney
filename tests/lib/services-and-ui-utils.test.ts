import { afterEach, describe, expect, it, vi } from 'vitest';

import * as s from '@/lib/services/utils';
import * as ui from '@/lib/utils';

const provider = (over: Record<string, any> = {}) =>
  ({
    _id: 'p1',
    firstName: 'Awa',
    lastName: 'Diallo',
    email: 'awa@test.fr',
    status: 'ACTIVE',
    specialties: ['Pédiatrie', 'Médecine Générale'],
    address: 'Douala',
    availabilities: [{ day: 1 }],
    selectedServices: ['Consultation', 'Vaccination'],
    rating: 4.5,
    ...over,
  }) as any;

describe('lib/services/utils : listes', () => {
  it('extrait spécialités, services et villes, triés et sans doublon', () => {
    const list = [
      provider(),
      provider({ specialties: ['Cardiologie', 'Pédiatrie', ''], address: 'Yaoundé', selectedServices: 'Consultation, Bilan' }),
      provider({ specialties: undefined, address: undefined, selectedServices: undefined }),
    ];
    expect(s.getUniqueSpecialties(list)).toEqual(['Cardiologie', 'Médecine Générale', 'Pédiatrie']);
    expect(s.getAvailableServices(list)).toEqual(['Bilan', 'Consultation', 'Vaccination']);
    expect(s.getAvailableCities(list)).toEqual(['Douala', 'Yaoundé']);
  });
});

describe('lib/services/utils : prestataire', () => {
  it('compose le nom affiché avec repli et société', () => {
    expect(s.formatProviderName(provider())).toBe('Awa Diallo');
    expect(s.formatProviderName(provider({ company: 'Clinique Ma Vie' }))).toBe('Awa Diallo (Clinique Ma Vie)');
    expect(s.formatProviderName(provider({ firstName: '', lastName: '', name: 'Dr Bah' }))).toBe('Dr Bah');
    expect(s.formatProviderName(provider({ firstName: '', lastName: '', name: 'Dr Bah', company: 'CHU' }))).toBe('Dr Bah (CHU)');
    expect(s.formatProviderName(provider({ firstName: '', lastName: '', name: '', email: '' }))).toBe('Prestataire');
    expect(s.formatProviderName(provider({ firstName: '', lastName: 'Bah', company: 'CHU' }))).toBe('Bah (CHU)');
  });

  it('détermine disponibilité, statut et service principal', () => {
    expect(s.isProviderAvailable(provider())).toBe(true);
    expect(s.isProviderAvailable(provider({ availabilities: [] }))).toBe(false);
    expect(s.getAvailabilityStatus(provider())).toBe('available');
    expect(s.getAvailabilityStatus(provider({ status: 'INACTIVE' }))).toBe('offline');
    expect(s.getAvailabilityStatus(provider({ availabilities: [] }))).toBe('offline');

    expect(s.getPrimaryService(provider())).toBe('Consultation');
    expect(s.getPrimaryService(provider({ selectedServices: ' Bilan , Vaccin' }))).toBe('Bilan');
    expect(s.getPrimaryService(provider({ selectedServices: undefined }))).toBe('Service non spécifié');
  });

  it('calcule prix, commissions et prix de consultation', () => {
    expect(s.calculatePriceWithCommission(100)).toBe(120);
    expect(s.calculatePriceWithCommission(100, 0.1)).toBe(110);
    expect(s.getCommissionAmount(100)).toBe(20);

    const priced = provider({ services: [{ name: 'Consultation générale', price: 19 }, { name: 'Bilan', price: 49 }], price: 10 });
    expect(s.getConsultationPrice(priced)).toBe(19);
    expect(s.getServicePrice(priced, 'bilan')).toBe(49);
    expect(s.getServicePrice(priced, 'radiologie')).toBe(10);
    expect(s.getServicePrice(provider({ price: 15 }), 'x')).toBe(15);
    expect(s.getServicePrice(provider(), 'x')).toBe(0);
  });

  it('donne une note (statistiques ou note du profil)', () => {
    expect(typeof s.getProviderRating(provider())).toBe('number');
  });
});

describe('lib/utils (interface)', () => {
  afterEach(() => vi.useRealTimers());

  it('donne les couleurs de statut et de priorité', () => {
    expect(ui.getStatusColor('PAID')).toContain('green');
    expect(ui.getStatusColor('OVERDUE')).toContain('red');
    expect(ui.getStatusColor('inconnu')).toContain('gray');
    expect(ui.getPriorityColor('URGENT')).toContain('red');
    expect(ui.getPriorityColor('HIGH')).toContain('orange');
    expect(ui.getPriorityColor('x')).toContain('gray');
  });

  it('tronque, met en forme et fusionne les classes', () => {
    expect(ui.truncateText('abcdef', 0)).toBe('...');
    expect(ui.truncateText('abcdef', 2)).toBe('ab...');
    expect(ui.truncateText('ab', 5)).toBe('ab');
    expect(ui.capitalize('')).toBe('');
    expect(ui.cn('px-2', false && 'hidden', 'px-4')).toContain('px-4');
  });

  it('ne déclenche une fonction retardée qu’une fois, ou tout de suite si délai nul', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = ui.debounce(fn, 200);
    debounced(1);
    debounced(2);
    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(2);

    const immediate = vi.fn();
    ui.debounce(immediate, 0)('x');
    expect(immediate).toHaveBeenCalledWith('x');
  });
});

'use client';

import {
  DEFAULT_PRESENCE_COUNTRIES,
  type PresenceCountry,
} from '@/lib/presence-countries';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** Identifiant de la section du carrousel des cliniques (cible du défilement). */
export const CLINICS_SECTION_ID = 'cliniques';

/** Affichées tant que la liste gérée par l'admin n'est pas chargée. */
const FALLBACK_COUNTRIES: PresenceCountry[] = DEFAULT_PRESENCE_COUNTRIES.map((country) => ({
  ...country,
  id: country.iso,
}));

interface HomeCountryFilterValue {
  /** Pays affichés dans les badges, dans l'ordre défini par l'admin. */
  countries: PresenceCountry[];
  /** Code ISO du pays sélectionné, `null` = tous les pays. */
  country: string | null;
  setCountry: (country: string | null) => void;
}

const HomeCountryFilterContext = createContext<HomeCountryFilterValue>({
  countries: FALLBACK_COUNTRIES,
  country: null,
  setCountry: () => {},
});

/**
 * Partage la liste des pays et le pays choisi entre les badges du Hero
 * et le carrousel des cliniques de la page d'accueil.
 */
export function HomeCountryFilterProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<PresenceCountry[]>(FALLBACK_COUNTRIES);
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/presence-countries', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { countries?: PresenceCountry[] } | null) => {
        if (Array.isArray(data?.countries)) setCountries(data.countries);
      })
      .catch(() => {
        // Liste par défaut conservée en cas d'erreur réseau.
      });
    return () => controller.abort();
  }, []);

  // Le filtre actif disparaît si le pays n'est plus « présent ».
  useEffect(() => {
    if (country && !countries.some((c) => c.iso === country && c.status === 'present')) {
      setCountry(null);
    }
  }, [countries, country]);

  const value = useMemo(() => ({ countries, country, setCountry }), [countries, country]);
  return (
    <HomeCountryFilterContext.Provider value={value}>{children}</HomeCountryFilterContext.Provider>
  );
}

export function useHomeCountryFilter() {
  return useContext(HomeCountryFilterContext);
}

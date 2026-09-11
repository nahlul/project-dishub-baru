import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from 'react';
import { routesAPI } from '@/lib/api';

const RoutesDataContext = createContext(null);

/**
 * Caches the route + halte data that the Rute / Halte / Halte Terdekat /
 * Rencanakan Perjalanan tabs share, so the data is fetched from MongoDB only
 * once per session instead of on every tab switch. Also provides a fast,
 * client-side halte autocomplete built from the cached halte list.
 */
export const RoutesDataProvider = ({ children }) => {
  const [routes, setRoutes] = useState([]);
  const [haltes, setHaltes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [haltesLoading, setHaltesLoading] = useState(false);
  const [error, setError] = useState('');

  // Guard so concurrent callers (e.g. two tabs mounting) don't each fire a
  // request; once loaded we never refetch unless explicitly asked.
  const routesLoaded = useRef(false);
  const haltesLoaded = useRef(false);
  const routesPromise = useRef(null);
  const haltesPromise = useRef(null);

  const loadRoutes = useCallback(async (force = false) => {
    if (!force && routesLoaded.current) return routes;
    if (routesPromise.current) return routesPromise.current;
    setRoutesLoading(true);
    setError('');
    routesPromise.current = (async () => {
      try {
        const { data } = await routesAPI.getAll();
        setRoutes(data || []);
        routesLoaded.current = true;
        return data || [];
      } catch (err) {
        console.error('Failed to fetch routes:', err);
        setError('Gagal memuat data rute.');
        return [];
      } finally {
        setRoutesLoading(false);
        routesPromise.current = null;
      }
    })();
    return routesPromise.current;
  }, [routes]);

  const loadHaltes = useCallback(async (force = false) => {
    if (!force && haltesLoaded.current) return haltes;
    if (haltesPromise.current) return haltesPromise.current;
    setHaltesLoading(true);
    setError('');
    haltesPromise.current = (async () => {
      try {
        const { data } = await routesAPI.getAllHaltes();
        setHaltes(data || []);
        haltesLoaded.current = true;
        return data || [];
      } catch (err) {
        console.error('Failed to fetch haltes:', err);
        setError('Gagal memuat data halte.');
        return [];
      } finally {
        setHaltesLoading(false);
        haltesPromise.current = null;
      }
    })();
    return haltesPromise.current;
  }, [haltes]);

  /**
   * Client-side halte autocomplete over the cached halte list. Ensures the
   * halte data is loaded, then filters locally so typing never triggers a
   * network round-trip per keystroke. Matches that start with the query rank
   * above matches that merely contain it.
   */
  const suggestHaltes = useCallback(
    async (query, limit = 8) => {
      const term = (query || '').trim().toLowerCase();
      if (!term) return [];
      const list = haltesLoaded.current ? haltes : await loadHaltes();
      const scored = [];
      for (const h of list) {
        const name = (h.nama || '').toLowerCase();
        if (!name.includes(term)) continue;
        if (h.lat == null || h.lng == null) continue;
        scored.push({ ...h, display_name: h.nama, _starts: name.startsWith(term) });
      }
      scored.sort((a, b) => {
        if (a._starts !== b._starts) return a._starts ? -1 : 1;
        return a.nama.localeCompare(b.nama);
      });
      return scored.slice(0, limit).map(({ _starts, ...rest }) => rest);
    },
    [haltes, loadHaltes]
  );

  const value = {
    routes,
    haltes,
    routesLoading,
    haltesLoading,
    error,
    loadRoutes,
    loadHaltes,
    suggestHaltes,
  };

  return (
    <RoutesDataContext.Provider value={value}>
      {children}
    </RoutesDataContext.Provider>
  );
};

export const useRoutesData = () => {
  const ctx = useContext(RoutesDataContext);
  if (!ctx) {
    throw new Error('useRoutesData must be used within RoutesDataProvider');
  }
  return ctx;
};

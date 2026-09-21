import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Bus, ArrowRight, Calendar, Loader2, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { routesAPI } from '@/lib/api';
import { TRANS_ROUTES } from '@/lib/transData';
import {
  timesForDay,
  nextBus,
  currentDayKey,
  DAY_LABELS,
  DAY_KEYS,
  minutesNow,
  getDirectionsForRoute,
  getTransitHubBadge,
  getConnectingCorridors,
} from '@/lib/routeUtils';
import HalteMap from './HalteMap';

const RouteExplorer = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [routes, setRoutes] = useState(TRANS_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [activeDirectionIdx, setActiveDirectionIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(currentDayKey());

  useEffect(() => {
    (async () => {
      try {
        const { data } = await routesAPI.getAll();
        if (data && data.length) {
          setRoutes(data);
        }
      } catch (err) {
        console.log('Using static route fallback data');
      }
    })();
  }, []);

  const handleSearch = async (value) => {
    setQuery(value);
    setSelectedRoute(null);
    if (value.trim().length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await routesAPI.search(value);
      if (data && data.length) {
        setResults(data);
      } else {
        const q = value.toLowerCase().trim();
        const clientResults = [];
        for (const r of routes) {
          for (const h of r.halte || []) {
            if (h.nama.toLowerCase().includes(q)) {
              clientResults.push({
                halte_nama: h.nama,
                halte_arah: h.arah || '',
                route_id: r.id,
                route_nama: r.nama,
                route_warna: r.warna || '#0284c7',
                jadwal: h.jadwal || {},
              });
            }
          }
        }
        setResults(clientResults.slice(0, 20));
      }
    } catch (err) {
      const q = value.toLowerCase().trim();
      const clientResults = [];
      for (const r of routes) {
        for (const h of r.halte || []) {
          if (h.nama.toLowerCase().includes(q)) {
            clientResults.push({
              halte_nama: h.nama,
              halte_arah: h.arah || '',
              route_id: r.id,
              route_nama: r.nama,
              route_warna: r.warna || '#0284c7',
              jadwal: h.jadwal || {},
            });
          }
        }
      }
      setResults(clientResults.slice(0, 20));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoute = async (routeId) => {
    setQuery('');
    setResults([]);
    setActiveDirectionIdx(0);
    try {
      const { data } = await routesAPI.getById(routeId);
      if (data && data.id) {
        setSelectedRoute(data);
        return;
      }
    } catch (err) {
      console.log('Using static route fallback detail');
    }
    const found = routes.find((r) => r.id === routeId);
    setSelectedRoute(found || null);
  };

  const directions = selectedRoute ? getDirectionsForRoute(selectedRoute) : [];
  const currentDirection = directions[activeDirectionIdx] || directions[0] || { name: 'Rute Utama', stops: [] };

  const routeMarkers = (currentDirection.stops || [])
    .filter((h) => h.lat != null && h.lng != null)
    .map((h, i) => ({
      lat: h.lat,
      lng: h.lng,
      label: h.nama,
      color: selectedRoute?.warna || '#0284c7',
      sub: `${i + 1}. ${h.arah || currentDirection.name}`,
    }));

  return (
    <div>
      {/* Search Box */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          {!query && <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />}
          <Input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Cari halte atau rute koridor... (mis. Darussalam, Ulee Lheue, Bandara SIM)"
            className={`${query ? 'pl-4' : 'pl-12'} py-5 text-base rounded-2xl border-2 border-gray-200 focus:border-sky-500 shadow-sm`}
          />
        </div>

        {query.length >= 1 && results.length === 0 && !loading && (
          <div className="mt-2 bg-white border-2 border-gray-100 rounded-xl shadow-lg p-6 text-center">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Halte tidak ditemukan</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-2 bg-white border-2 border-gray-100 rounded-xl shadow-lg max-h-80 overflow-y-auto z-50 relative">
            {results.map((item, idx) => {
              const nb = nextBus(item.jadwal || {}, activeDay);
              const badge = getTransitHubBadge(item.halte_nama);
              return (
                <div
                  key={idx}
                  className="p-4 hover:bg-sky-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                  onClick={() => handleSelectRoute(item.route_id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0" />
                        <span className="font-semibold text-gray-900">{item.halte_nama}</span>
                        {badge && (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px] hover:bg-emerald-100">
                            {badge}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Bus className="w-3 h-3 text-sky-600" />
                        <span>Rute {item.route_nama}</span>
                        {item.halte_arah && <span>• {item.halte_arah}</span>}
                      </div>
                    </div>
                    {nb && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-sky-600">Bus {nb.time}</p>
                        <p className="text-[10px] text-gray-500">±{nb.diff} mnt lagi</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading && <div className="mt-2 text-center text-gray-500 text-sm">Mencari...</div>}
      </div>

      {/* Day Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {DAY_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveDay(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeDay === key
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {DAY_LABELS[key]}
          </button>
        ))}
      </div>

      {/* SELECTED CORRIDOR VIEW */}
      {selectedRoute && (
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedRoute(null)}
            className="text-sm text-sky-600 hover:text-sky-700 mb-4 inline-flex items-center gap-1 font-semibold"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Kembali ke Semua Rute Koridor
          </button>

          {/* Explicit Header Summary Box */}
          <div className="bg-sky-900 text-white p-6 sm:p-7 rounded-3xl mb-6 shadow-md border-2 border-sky-800">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: selectedRoute.warna }} />
                <h3 className="text-2xl sm:text-3xl font-black tracking-wide text-white">
                  {selectedRoute.nama}
                </h3>
              </div>
              {selectedRoute.kode && (
                <Badge className="bg-sky-800 text-sky-100 border-sky-600 font-mono text-xs">
                  {selectedRoute.kode}
                </Badge>
              )}
            </div>

            <p className="text-sky-100 text-sm mb-5 leading-relaxed font-normal">
              {selectedRoute.deskripsi}
            </p>

            {/* Explanation box of Route Directions */}
            <div className="bg-sky-950/70 p-4 sm:p-5 rounded-2xl border border-sky-800/80 space-y-3">
              <div className="flex items-center gap-2 text-sky-300 font-bold text-xs uppercase tracking-wider">
                <Info className="w-4 h-4" /> Informasi Alur Lintasan Koridor Ini:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {directions.map((d, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveDirectionIdx(idx)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      activeDirectionIdx === idx
                        ? 'bg-sky-600 border-white text-white font-bold shadow-md'
                        : 'bg-sky-900/60 border-sky-700/60 text-sky-100 hover:bg-sky-800/80'
                    }`}
                  >
                    <p className="text-[11px] opacity-80 uppercase tracking-wider mb-1">
                      {idx === 0 ? '🔹 Arah Berangkat / Naik:' : '🔹 Arah Pulang / Turun:'}
                    </p>
                    <p className="font-semibold text-sm leading-snug">{d.name}</p>
                    <p className="text-[10px] mt-1.5 opacity-90">{d.stops.length} Halte Perhentian</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Direction Tab Selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
              Pilih Tampilan Arah Rute:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {directions.map((dir, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveDirectionIdx(idx)}
                  className={`p-4 rounded-2xl text-left border-2 transition-all ${
                    activeDirectionIdx === idx
                      ? 'bg-sky-600 text-white border-sky-600 shadow-md font-bold'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-sky-300 hover:bg-sky-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs uppercase font-extrabold ${activeDirectionIdx === idx ? 'text-sky-100' : 'text-sky-600'}`}>
                      {idx === 0 ? 'Arah 1: Berangkat / Naik' : 'Arah 2: Pulang / Turun'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeDirectionIdx === idx ? 'bg-sky-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {dir.stops.length} Halte
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-snug line-clamp-2">{dir.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Leaflet Map for current active direction */}
          {routeMarkers.length > 0 && (
            <div className="mb-6">
              <HalteMap markers={routeMarkers} height={320} />
            </div>
          )}

          {/* Sequential Stops List */}
          <div className="space-y-3">
            <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl mb-4">
              <p className="text-xs text-sky-900 font-semibold leading-relaxed">
                📌 <span className="font-bold">Panduan Arah:</span> Berikut adalah daftar urutan halte sekuensial untuk <span className="underline">{currentDirection.name}</span> pada hari <span className="font-bold">{DAY_LABELS[activeDay]}</span>:
              </p>
            </div>

            {currentDirection.stops.map((halte, idx) => {
              const times = timesForDay(halte.jadwal || {}, activeDay);
              const nb = nextBus(halte.jadwal || {}, activeDay);
              const ref = minutesNow();
              const badge = getTransitHubBadge(halte.nama);

              return (
                <div
                  key={idx}
                  className={`bg-white border rounded-2xl p-4 transition-all hover:shadow-md ${
                    badge ? 'border-sky-300 ring-1 ring-sky-400/20 bg-sky-50/20' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-7 h-7 rounded-xl text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: selectedRoute.warna }}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-bold text-base text-gray-900">{halte.nama}</span>

                        {badge && (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] hover:bg-amber-100">
                            {badge}
                          </Badge>
                        )}
                      </div>
                      {halte.arah && <p className="text-xs text-gray-500 ml-9 mt-1">{halte.arah}</p>}
                    </div>

                    {nb && (
                      <div className="bg-sky-100/80 border border-sky-200 px-3 py-1.5 rounded-xl text-right flex-shrink-0">
                        <p className="text-sm font-bold text-sky-800">±{nb.time} WIB</p>
                        <p className="text-[10px] font-medium text-sky-600">{nb.diff} mnt lagi</p>
                      </div>
                    )}
                  </div>

                  {times.length > 0 ? (
                    <div className="ml-9 flex flex-wrap gap-1.5 mt-3">
                      {times.map((time, i) => {
                        const [h, m] = time.split(':').map(Number);
                        const busMin = h * 60 + m;
                        const isPast = busMin < ref;
                        const isNext = nb && nb.time === time;
                        return (
                          <span
                            key={i}
                            className={`px-2 py-1 rounded-md text-xs font-mono transition-all ${
                              isNext
                                ? 'bg-sky-600 text-white font-bold shadow-sm ring-2 ring-sky-600/30'
                                : isPast
                                ? 'bg-gray-100 text-gray-400 line-through'
                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {time}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="ml-9 text-xs text-gray-400 italic mt-2">
                      Jadwal tidak tersedia untuk hari ini.
                    </p>
                  )}

                  {/* CONNECTING TRAYEK / TRANSIT BOX */}
                  {(() => {
                    const connecting = getConnectingCorridors(halte.nama, selectedRoute.id);
                    if (connecting.length === 0) return null;

                    return (
                      <div className="ml-9 mt-3 p-3.5 bg-amber-500/10 border-2 border-amber-300/80 rounded-2xl">
                        <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs uppercase tracking-wider mb-1">
                          🔄 LOKASI TRANSIT & PINDAH BUS (GANTI TRAYEK):
                        </div>
                        <p className="text-[11px] text-amber-950 font-medium mb-2 leading-relaxed">
                          Di halte ini penumpang dapat <strong>turun untuk ganti bus / berpindah ke trayek lain</strong>:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {connecting.map((c, ci) => (
                            <span
                              key={ci}
                              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl text-white shadow-sm"
                              style={{ backgroundColor: c.warna }}
                            >
                              🚌 Koridor {c.nama} ({c.arah || 'Lintasan'})
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ALL ROUTES GRID */}
      {!selectedRoute && !query && (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h4 className="text-2xl font-bold text-gray-900 mb-2">
              Daftar 10 Koridor Trans Koetaradja
            </h4>
            <p className="text-sm text-gray-600 max-w-xl mx-auto">
              Setiap koridor dipisah secara sekuensial per arah lintasan (Arah Berangkat vs Arah Pulang). Klik koridor untuk melihat urutan halte dan jadwalnya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((route) => {
              const dirs = getDirectionsForRoute(route);
              const totalStops = route.halte?.length || 0;
              return (
                <div
                  key={route.id}
                  onClick={() => handleSelectRoute(route.id)}
                  className="bg-white border-2 border-gray-100 hover:border-sky-400 rounded-3xl p-5 cursor-pointer hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: route.warna }} />
                      <h5 className="font-bold text-lg text-gray-900 group-hover:text-sky-600 transition-colors">
                        {route.nama}
                      </h5>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {totalStops} Halte
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">{route.deskripsi}</p>

                  <div className="space-y-1.5 mb-4 bg-sky-50/50 p-3 rounded-2xl border border-sky-100">
                    <p className="text-[10px] font-bold text-sky-800 uppercase tracking-wider mb-1">
                      Lintasan Rute Per Arah:
                    </p>
                    {dirs.map((d, di) => (
                      <div key={di} className="text-xs text-gray-700 flex items-start gap-1.5">
                        <span className="font-bold text-sky-600 text-[11px] flex-shrink-0">
                          {di === 0 ? 'Arah 1:' : 'Arah 2:'}
                        </span>
                        <span className="line-clamp-1 text-[11px] leading-tight font-medium">
                          {d.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-sky-600" /> {route.jam_operasi}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-sky-600 group-hover:translate-x-1 transition-transform">
                      Lihat Rute Sekuensial <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteExplorer;

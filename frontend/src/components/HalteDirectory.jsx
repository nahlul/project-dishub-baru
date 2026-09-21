import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Bus, Loader2, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { routesAPI } from '@/lib/api';
import {
  timesForDay,
  nextBus,
  currentDayKey,
  DAY_LABELS,
  DAY_KEYS,
  getAllHaltesDirectoryClient,
  getTransitHubBadge,
} from '@/lib/routeUtils';

const HalteDirectory = () => {
  const [haltes, setHaltes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [day, setDay] = useState(currentDayKey());
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await routesAPI.getAllHaltes();
        if (data && data.length) {
          setHaltes(data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('Using static halte directory fallback');
      }
      const clientHaltes = getAllHaltesDirectoryClient();
      setHaltes(clientHaltes);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return haltes;
    const q = query.toLowerCase();
    return haltes.filter((h) => h.nama.toLowerCase().includes(q));
  }, [haltes, query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat direktori halte...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama halte atau lokasi... (mis. Masjid Raya, Ulee Lheue, Bandara)"
          className="pl-12 py-5 text-base rounded-2xl border-2 border-gray-200 focus:border-sky-500 shadow-sm"
        />
      </div>

      {/* Day Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {DAY_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => setDay(k)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              day === k
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {DAY_LABELS[k]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 font-medium">{filtered.length} Halte Ditemukan</p>
        <p className="text-xs text-gray-400">Klik halte untuk melihat rute & jadwal lengkap</p>
      </div>

      {/* Halte Cards Accordion */}
      <div className="space-y-3">
        {filtered.map((h, idx) => {
          const isOpen = expanded === idx;
          const badge = getTransitHubBadge(h.nama);

          return (
            <div
              key={idx}
              className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                isOpen ? 'ring-2 ring-sky-500/20 border-sky-400 shadow-md' : 'border-gray-200 hover:border-sky-300'
              }`}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : idx)}
                className="w-full text-left p-4 hover:bg-gray-50/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">{h.nama}</span>
                      {badge && (
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] hover:bg-amber-100">
                          {badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      Dilayani oleh {h.routes?.length || 0} rute koridor
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 justify-end flex-shrink-0">
                    {h.routes?.map((r, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border"
                        style={{
                          backgroundColor: `${r.route_warna || '#0284c7'}15`,
                          borderColor: `${r.route_warna || '#0284c7'}40`,
                          color: r.route_warna || '#0284c7',
                        }}
                      >
                        <Bus className="w-3 h-3" /> {r.route_nama}
                      </span>
                    ))}
                  </div>
                </div>
              </button>

              {/* Detailed Schedule Drawer */}
              {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Jadwal Operasional ({DAY_LABELS[day]}):
                  </p>

                  <div className="space-y-4">
                    {h.routes?.map((r, i) => {
                      const times = timesForDay(r.jadwal || {}, day);
                      const nb = nextBus(r.jadwal || {}, day);

                      return (
                        <div key={i} className="bg-white p-3.5 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: r.route_warna || '#0284c7' }}
                              />
                              <span className="text-sm font-bold text-gray-900">
                                Koridor {r.route_nama}
                              </span>
                            </div>

                            {nb && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" /> Kedatangan ±{nb.time} ({nb.diff} mnt)
                              </span>
                            )}
                          </div>

                          {r.arah && (
                            <p className="text-xs text-gray-500 ml-5 mb-2 font-medium">
                              Arah: {r.arah}
                            </p>
                          )}

                          {times.length > 0 ? (
                            <div className="ml-5 flex flex-wrap gap-1.5">
                              {times.map((t, ti) => (
                                <span
                                  key={ti}
                                  className="text-xs font-mono bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="ml-5 text-xs text-gray-400 italic">
                              Tidak ada jadwal beroperasi pada hari ini.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HalteDirectory;

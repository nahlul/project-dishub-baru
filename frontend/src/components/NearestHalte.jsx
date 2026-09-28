import React, { useState } from 'react';
import { Navigation, MapPin, Bus, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { routesAPI } from '@/lib/api';
import {
  formatKm,
  nextBus,
  currentDayKey,
  DAY_LABELS,
  getNearestHaltesClient,
  getTransitHubBadge,
} from '@/lib/routeUtils';
import HalteMap from './HalteMap';

const POPULAR_LANDMARKS = [
  { name: 'Masjid Raya Baiturrahman', lat: 5.55411, lng: 95.318376, desc: 'Pusat Kota' },
  { name: 'Simpang Lima', lat: 5.556624, lng: 95.323256, desc: 'Pusat Bisnis' },
  { name: 'RSUZA Lamprit', lat: 5.565767, lng: 95.337351, desc: 'Rumah Sakit' },
  { name: 'Darussalam (USK)', lat: 5.571437, lng: 95.371407, desc: 'Kopelma' },
  { name: 'UIN Ar-Raniry', lat: 5.580878, lng: 95.367519, desc: 'Kampus' },
  { name: 'Terminal Batoh', lat: 5.529230, lng: 95.330343, desc: 'Terminal' },
  { name: 'Pelabuhan Ulee Lheue', lat: 5.564787, lng: 95.293857, desc: 'Pelabuhan' },
  { name: 'Pasar Lambaro', lat: 5.508356, lng: 95.355465, desc: 'Aceh Besar' },
  { name: 'Bandara SIM', lat: 5.516959, lng: 95.416443, desc: 'Bandara' },
  { name: 'Pantai Lampuuk', lat: 5.493722, lng: 95.235698, desc: 'Lhoknga' },
];

const NearestHalte = () => {
  const [status, setStatus] = useState('idle'); // idle | locating | loading | done | error
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [accuracy, setAccuracy] = useState(null);
  const [haltes, setHaltes] = useState([]);
  const dayKey = currentDayKey();

  const searchFromCoords = async (latitude, longitude, label = 'Posisi Anda', acc = null) => {
    setError('');
    setUser({ lat: latitude, lng: longitude });
    setLocationLabel(label);
    setAccuracy(acc);
    setStatus('loading');

    try {
      const { data } = await routesAPI.nearest(latitude, longitude, 5);
      if (data && data.length) {
        setHaltes(data);
        setStatus('done');
        return;
      }
    } catch (err) {
      console.log('Using client-side Haversine nearest calculation fallback:', err);
    }

    const clientNearest = getNearestHaltesClient(latitude, longitude, 5, dayKey);
    setHaltes(clientNearest);
    setStatus('done');
  };

  const findNearest = () => {
    setError('');
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setError('Peramban web Anda tidak mendukung layanan Geolocation.');
      return;
    }
    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        searchFromCoords(latitude, longitude, 'Posisi GPS Anda', acc);
      },
      (err) => {
        setStatus('error');
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            'Browser (Google Chrome/Brave) otomatis memblokir sensor GPS pada koneksi HTTP (bukan HTTPS). Silakan pilih salah satu titik lokasi populer di bawah untuk langsung menemukan 5 halte terdekat secara instan.'
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Sinyal GPS atau lokasi Anda tidak dapat ditemukan saat ini. Silakan pilih titik lokasi di bawah.');
        } else if (err.code === err.TIMEOUT) {
          setError('Waktu permintaan lokasi telah habis (Timeout). Silakan pilih titik lokasi di bawah.');
        } else {
          setError('Tidak dapat menentukan lokasi Anda. Silakan pilih titik lokasi di bawah.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const markers = haltes.map((h, i) => ({
    lat: h.lat,
    lng: h.lng,
    label: h.nama,
    number: i + 1,
    color: h.routes?.[0]?.route_warna || '#0284c7',
    sub: `${formatKm(h.distance_km)} • ${h.routes?.map((r) => r.route_nama).join(', ')}`,
  }));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Consent / trigger card */}
      <div className="bg-white border-2 border-sky-100 rounded-3xl p-6 sm:p-8 mb-6 text-center shadow-sm">
        <div className="w-16 h-16 bg-sky-100/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-sky-600 shadow-inner">
          <Navigation className="w-8 h-8" />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">Cari Halte Terdekat</h3>
        <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
          Klik tombol di bawah untuk mendeteksi posisi GPS Anda. Sistem akan menghitung jarak Haversine ke seluruh halte Trans Koetaradja secara presisi.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={findNearest}
            disabled={status === 'locating' || status === 'loading'}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold px-7 py-3 rounded-2xl shadow-lg shadow-sky-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {(status === 'locating' || status === 'loading') && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            {status === 'locating'
              ? 'Mendeteksi Posisi GPS...'
              : status === 'loading'
              ? 'Menghitung Jarak...'
              : 'Deteksi Otomatis via GPS'}
          </button>
        </div>

        {error && (
          <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-sm text-amber-900 max-w-xl mx-auto text-left">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-800">Perhatian Browser:</p>
              <p className="text-xs text-amber-700 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Quick Landmark Chips */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Atau Pilih Titik Lokasi Populer di Banda Aceh & Aceh Besar:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            {POPULAR_LANDMARKS.map((lm, idx) => (
              <button
                key={idx}
                onClick={() => searchFromCoords(lm.lat, lm.lng, lm.name)}
                disabled={status === 'loading'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-50 hover:bg-sky-50 text-gray-700 hover:text-sky-700 border border-gray-200 hover:border-sky-300 transition-all active:scale-95 shadow-2xs"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                <span>{lm.name}</span>
                <span className="text-[10px] text-gray-400 font-normal">({lm.desc})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results View */}
      {status === 'done' && haltes.length > 0 && (
        <>
          {/* Leaflet Map with User + Top 5 Halte Markers */}
          <div className="mb-6">
            <HalteMap user={user} accuracy={accuracy} markers={markers} height={360} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-sky-600" />
                5 Halte Terdekat Hari Ini ({DAY_LABELS[dayKey]})
              </h4>
              {locationLabel && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Dihitung dari titik acuan: <span className="font-semibold text-sky-700">{locationLabel}</span>
                </p>
              )}
            </div>
            <span className="text-xs text-sky-700 bg-sky-50 px-3 py-1 rounded-full font-medium border border-sky-200 self-start sm:self-auto">
              Diurutkan dari Jarak Terdekat
            </span>
          </div>

          <div className="space-y-4">
            {haltes.map((h, idx) => {
              const nb = nextBus(h.jadwal || {}, dayKey);
              const badge = getTransitHubBadge(h.nama);

              return (
                <div
                  key={idx}
                  className="bg-white border-2 border-gray-100 hover:border-sky-300 rounded-2xl p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        {/* Number Badge 1-5 */}
                        <span className="w-7 h-7 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                          {idx + 1}
                        </span>

                        <h5 className="font-bold text-lg text-gray-900">{h.nama}</h5>

                        {badge && (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] hover:bg-amber-100">
                            {badge}
                          </Badge>
                        )}
                      </div>

                      {/* Corridor Badges & Directions */}
                      <div className="ml-10 flex flex-wrap gap-1.5 mb-2">
                        {h.routes?.map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: `${r.route_warna || '#0284c7'}15`,
                              borderColor: `${r.route_warna || '#0284c7'}40`,
                              color: r.route_warna || '#0284c7',
                            }}
                          >
                            <Bus className="w-3.5 h-3.5" /> Koridor {r.route_nama}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Distance & Next Bus Schedule */}
                    <div className="text-right flex-shrink-0">
                      <div className="inline-block bg-sky-50 text-sky-700 font-extrabold text-base px-3 py-1 rounded-xl border border-sky-200 mb-1">
                        {formatKm(h.distance_km)}
                      </div>
                      {nb ? (
                        <p className="text-xs font-semibold text-gray-600 flex items-center justify-end gap-1 mt-1">
                          <Clock className="w-3 h-3 text-sky-600" /> Bus ±{nb.time} ({nb.diff} mnt)
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">Jadwal bus habis</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {status === 'done' && haltes.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          Tidak ada halte bus Trans Koetaradja ditemukan di dekat lokasi Anda.
        </p>
      )}
    </div>
  );
};

export default NearestHalte;

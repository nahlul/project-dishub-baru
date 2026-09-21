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

const NearestHalte = () => {
  const [status, setStatus] = useState('idle'); // idle | locating | loading | done | error
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [haltes, setHaltes] = useState([]);
  const dayKey = currentDayKey();

  const findNearest = () => {
    setError('');
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setError('Peramban web Anda tidak mendukung layanan Geolocation.');
      return;
    }
    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        setUser({ lat: latitude, lng: longitude });
        setAccuracy(acc);
        setStatus('loading');

        try {
          // Attempt API nearest call
          const { data } = await routesAPI.nearest(latitude, longitude, 5);
          if (data && data.length) {
            console.log(`[Cari Halte Terdekat] GPS Position: Lat ${latitude}, Lng ${longitude} (Akurasi: ${acc}m)`);
            console.table(
              data.map((h, i) => ({
                No: i + 1,
                'Nama Halte': h.nama,
                'Jarak (Meter)': Math.round(h.distance_km * 1000) + ' m',
                'Jarak (KM)': h.distance_km,
                Latitude: h.lat,
                Longitude: h.lng,
              }))
            );
            setHaltes(data);
            setStatus('done');
            return;
          }
        } catch (err) {
          console.log('Using client-side Haversine nearest calculation fallback:', err);
        }

        // Fallback Haversine calculation client-side
        const clientNearest = getNearestHaltesClient(latitude, longitude, 5, dayKey);
        console.log(`[Cari Halte Terdekat Client Fallback] GPS Position: Lat ${latitude}, Lng ${longitude}`);
        console.table(
          clientNearest.map((h, i) => ({
            No: i + 1,
            'Nama Halte': h.nama,
            'Jarak (Meter)': Math.round(h.distance_km * 1000) + ' m',
            'Jarak (KM)': h.distance_km,
            Latitude: h.lat,
            Longitude: h.lng,
          }))
        );
        setHaltes(clientNearest);
        setStatus('done');
      },
      (err) => {
        setStatus('error');
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            'Izin akses lokasi ditolak oleh browser. Mohon aktifkan izin lokasi di pengaturan browser Anda untuk mencari halte terdekat.'
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Sinyal GPS atau lokasi Anda tidak dapat ditemukan saat ini.');
        } else if (err.code === err.TIMEOUT) {
          setError('Waktu permintaan lokasi telah habis (Timeout). Silakan coba lagi.');
        } else {
          setError('Tidak dapat menentukan lokasi Anda. Silakan coba lagi.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
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

        <button
          onClick={findNearest}
          disabled={status === 'locating' || status === 'loading'}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-sky-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {(status === 'locating' || status === 'loading') && (
            <Loader2 className="w-5 h-5 animate-spin" />
          )}
          {status === 'locating'
            ? 'Mendeteksi Posisi GPS...'
            : status === 'loading'
            ? 'Menghitung Jarak Haversine...'
            : 'Izinkan & Cari Halte Terdekat'}
        </button>

        {error && (
          <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center gap-3 text-sm text-red-700 max-w-lg mx-auto text-left">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {status === 'done' && haltes.length > 0 && (
        <>
          {/* Leaflet Map with User + Top 5 Halte Markers */}
          <div className="mb-6">
            <HalteMap user={user} accuracy={accuracy} markers={markers} height={360} />
          </div>

          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-600" />
              5 Halte Terdekat Hari Ini ({DAY_LABELS[dayKey]})
            </h4>
            <span className="text-xs text-sky-700 bg-sky-50 px-3 py-1 rounded-full font-medium border border-sky-200">
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

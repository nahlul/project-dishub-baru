import React, { useState } from 'react';
import {
  Route as RouteIcon, MapPin, Navigation, Search, Bus, ArrowRight,
  Loader2, AlertCircle, Clock, Footprints, RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { routesAPI } from '@/lib/api';
import { formatKm, currentDayKey, DAY_LABELS, DAY_KEYS } from '@/lib/routeUtils';
import { getCurrentPosition } from '@/lib/geolocation';
import { useRoutesData } from '@/contexts/RoutesDataContext';
import HalteMap from './HalteMap';

// Feature 4: plan a trip from origin (user location or typed) to a destination.
const TripPlanner = () => {
  const { suggestHaltes } = useRoutesData();

  const [origin, setOrigin] = useState(null); // {lat,lng,label}
  const [originText, setOriginText] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destText, setDestText] = useState('');
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [dest, setDest] = useState(null); // {lat,lng,label}
  const [day, setDay] = useState(currentDayKey());
  const [locating, setLocating] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [geocodingOrigin, setGeocodingOrigin] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const useMyLocation = async () => {
    setError('');
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setOrigin({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        label: 'Lokasi Anda',
      });
      setOriginText('Lokasi Anda');
      setOriginSuggestions([]);
    } catch (err) {
      setError(err.message || 'Tidak dapat menentukan lokasi Anda.');
    } finally {
      setLocating(false);
    }
  };

  // "Dari" autocomplete: suggest bus stops (halte) from MongoDB as the user
  // types. Selecting a halte fixes the origin coordinates immediately.
  const searchOrigin = async (value) => {
    setOriginText(value);
    setOrigin(null);
    setError('');
    if (value.trim().length < 1 || value === 'Lokasi Anda') {
      setOriginSuggestions([]);
      return;
    }
    setGeocodingOrigin(true);
    try {
      const list = await suggestHaltes(value, 8);
      setOriginSuggestions(list);
    } catch {
      setOriginSuggestions([]);
    } finally {
      setGeocodingOrigin(false);
    }
  };

  const pickOrigin = (item) => {
    setOrigin({ lat: item.lat, lng: item.lng, label: item.display_name || item.nama });
    setOriginText(item.display_name || item.nama);
    setOriginSuggestions([]);
  };

  // If the user typed a free-text origin (not a picked halte) and blurs the
  // field, try to resolve it: first against halte data, then geocoding.
  const geocodeOrigin = async () => {
    if (origin || originText.trim().length < 2 || originText === 'Lokasi Anda') return;
    // Give click-to-pick a chance to fire before we treat this as free text.
    setTimeout(() => setOriginSuggestions([]), 150);
    try {
      const halteMatches = await suggestHaltes(originText, 1);
      if (halteMatches.length) {
        const m = halteMatches[0];
        setOrigin({ lat: m.lat, lng: m.lng, label: m.display_name || m.nama });
        return;
      }
      const { data } = await routesAPI.geocode(originText);
      if (data.length) {
        setOrigin({ lat: data[0].lat, lng: data[0].lng, label: originText });
      } else {
        setError(`Lokasi asal "${originText}" tidak ditemukan.`);
      }
    } catch {
      setError('Gagal mencari lokasi asal. Coba pilih halte dari daftar saran.');
    }
  };

  // "Ke" autocomplete: prefer halte suggestions from MongoDB, and fall back to
  // the geocoding proxy for arbitrary destinations (e.g. "Masjid Raya").
  const searchDest = async (value) => {
    setDestText(value);
    setDest(null);
    setError('');
    if (value.trim().length < 1) {
      setDestSuggestions([]);
      return;
    }
    setGeocoding(true);
    try {
      const halteMatches = await suggestHaltes(value, 6);
      let suggestions = halteMatches.map((h) => ({ ...h, _halte: true }));
      // Only reach out to the external geocoder when local halte data is thin.
      if (suggestions.length < 3 && value.trim().length >= 3) {
        try {
          const { data } = await routesAPI.geocode(value);
          const geo = (data || []).map((g) => ({ ...g, _halte: false }));
          suggestions = [...suggestions, ...geo];
        } catch {
          // Geocoder unavailable (e.g. offline) — halte suggestions still work.
        }
      }
      setDestSuggestions(suggestions);
    } catch {
      setDestSuggestions([]);
    } finally {
      setGeocoding(false);
    }
  };

  const pickDest = (item) => {
    const label = item.display_name || item.nama;
    setDest({ lat: item.lat, lng: item.lng, label });
    setDestText(label.split(',')[0]);
    setDestSuggestions([]);
  };

  const plan = async () => {
    setError('');
    setResult(null);
    if (!origin) {
      setError('Tentukan lokasi asal dahulu (pakai lokasi Anda atau ketik lokasi).');
      return;
    }
    if (!dest) {
      setError('Pilih tujuan dari daftar saran.');
      return;
    }
    setPlanning(true);
    try {
      const { data } = await routesAPI.plan({
        fromLat: origin.lat,
        fromLng: origin.lng,
        toLat: dest.lat,
        toLng: dest.lng,
        day,
      });
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Gagal merencanakan perjalanan. Coba lagi.');
    } finally {
      setPlanning(false);
    }
  };

  const mapMarkers = (option) => {
    const m = [];
    option?.legs?.forEach((leg) => {
      if (leg.board_lat != null)
        m.push({ lat: leg.board_lat, lng: leg.board_lng, label: `Naik: ${leg.board_halte}`, color: leg.route_warna });
      if (leg.alight_lat != null)
        m.push({ lat: leg.alight_lat, lng: leg.alight_lng, label: `Turun: ${leg.alight_halte}`, color: leg.route_warna });
    });
    return m;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <RouteIcon className="w-6 h-6 text-sky-600" />
          <h3 className="text-xl font-bold text-gray-900">Rencanakan Perjalanan</h3>
        </div>

        {/* Origin */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Dari (lokasi asal)</label>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Input
              value={originText}
              onChange={(e) => searchOrigin(e.target.value)}
              onBlur={geocodeOrigin}
              placeholder="Ketik nama halte asal (mis. Darussalam) atau pakai lokasi Anda"
              className="w-full rounded-xl border-2 border-gray-200 focus:border-sky-500"
            />
            {geocodingOrigin && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
            {originSuggestions.length > 0 && (
              <div className="absolute z-[1000] mt-1 w-full bg-white border-2 border-gray-100 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                {originSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickOrigin(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-sky-50 border-b border-gray-50 last:border-0 text-sm flex items-start gap-2"
                  >
                    <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">
                      <span className="text-gray-800 font-medium">{s.display_name || s.nama}</span>
                      {s.routes?.length > 0 && (
                        <span className="block text-xs text-gray-400">
                          Rute {s.routes.map((r) => r.route_nama).join(', ')}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="inline-flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border-2 border-sky-200 font-medium px-4 py-2 rounded-xl whitespace-nowrap"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            Lokasi Saya
          </button>
        </div>

        {/* Destination */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Ke (tujuan)</label>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={destText}
            onChange={(e) => searchDest(e.target.value)}
            placeholder="Ketik tujuan (mis. Masjid Raya, Bandara SIM)"
            className="pl-10 rounded-xl border-2 border-gray-200 focus:border-sky-500"
          />
          {geocoding && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
          {destSuggestions.length > 0 && (
            <div className="absolute z-[1000] mt-1 w-full bg-white border-2 border-gray-100 rounded-xl shadow-lg max-h-56 overflow-y-auto">
              {destSuggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickDest(s)}
                  className="w-full text-left px-4 py-2.5 hover:bg-sky-50 border-b border-gray-50 last:border-0 text-sm flex items-start gap-2"
                >
                  {s._halte ? (
                    <Bus className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="flex-1">
                    <span className="text-gray-800">{s.display_name || s.nama}</span>
                    {s._halte && s.routes?.length > 0 && (
                      <span className="block text-xs text-gray-400">
                        Halte · Rute {s.routes.map((r) => r.route_nama).join(', ')}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Day + plan button */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="rounded-xl border-2 border-gray-200 focus:border-sky-500 px-3 py-2 text-sm text-gray-700 bg-white"
          >
            {DAY_KEYS.map((k) => (
              <option key={k} value={k}>{DAY_LABELS[k]}</option>
            ))}
          </select>
          <button
            onClick={plan}
            disabled={planning}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-xl"
          >
            {planning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RouteIcon className="w-4 h-4" />}
            Cari Rute Perjalanan
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results */}
      {result && !result.found && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-amber-800 font-medium">{result.message || 'Rute tidak ditemukan.'}</p>
          <p className="text-amber-600 text-sm mt-1">Coba tujuan lain atau lokasi asal yang lebih dekat dengan jalur bus.</p>
        </div>
      )}

      {result?.found && (
        <div className="space-y-8">
          {result.options.map((opt, oi) => (
            <div key={oi} className="bg-white border-2 border-gray-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900">
                  Opsi {oi + 1}{' '}
                  <span className="text-sm font-normal text-gray-500">
                    ({opt.type === 'direct' ? 'Langsung' : `${opt.legs.length} rute · transit`})
                  </span>
                </h4>
                <span className="text-xs text-gray-500">{DAY_LABELS[day]}</span>
              </div>

              <HalteMap markers={mapMarkers(opt)} height={260} />

              <ol className="mt-5 space-y-4">
                {/* walk to first board */}
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Footprints className="w-4 h-4 text-gray-500" />
                  </span>
                  <div className="pt-1">
                    Jalan kaki ±{formatKm(opt.walk_from_km)} ke halte{' '}
                    <span className="font-semibold text-gray-900">{opt.legs[0].board_halte}</span>
                  </div>
                </li>

                {opt.legs.map((leg, li) => (
                  <li key={li} className="flex items-start gap-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                      style={{ backgroundColor: leg.route_warna }}
                    >
                      <Bus className="w-4 h-4" />
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">Rute {leg.route_nama}</span>
                        {leg.departure && (
                          <span className="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Berangkat ±{leg.departure}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{leg.num_stops} halte</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">{leg.board_halte}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">{leg.alight_halte}</span>
                      </div>
                      {leg.stops?.length > 2 && (
                        <details className="mt-1">
                          <summary className="text-xs text-sky-600 cursor-pointer">
                            Lihat {leg.stops.length} halte perhentian
                          </summary>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {leg.stops.map((s, si) => (
                              <span key={si} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded">
                                {s}
                              </span>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </li>
                ))}

                {opt.type === 'transfer' && (
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-4 h-4 text-gray-500" />
                    </span>
                    <div className="pt-1">
                      Transit ±{formatKm(opt.interchange_km)} antara halte{' '}
                      <span className="font-semibold text-gray-900">{opt.legs[0].alight_halte}</span> dan{' '}
                      <span className="font-semibold text-gray-900">{opt.legs[1].board_halte}</span>
                    </div>
                  </li>
                )}

                {/* walk from last alight */}
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Footprints className="w-4 h-4 text-gray-500" />
                  </span>
                  <div className="pt-1">
                    Jalan kaki ±{formatKm(opt.walk_to_km)} dari halte{' '}
                    <span className="font-semibold text-gray-900">
                      {opt.legs[opt.legs.length - 1].alight_halte}
                    </span>{' '}
                    ke tujuan.
                  </div>
                </li>
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripPlanner;

import React, { useState, useEffect } from 'react';
import {
  Route as RouteIcon, MapPin, Navigation, Search, Bus, ArrowRight,
  Loader2, AlertCircle, Clock, Footprints, RefreshCw, CheckCircle2, Info,
  ChevronDown, ChevronUp, List, FileText, ListOrdered, Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { routesAPI } from '@/lib/api';
import { TRANS_ROUTES } from '@/lib/transData';
import {
  formatKm,
  currentDayKey,
  DAY_LABELS,
  DAY_KEYS,
  planJourneyClient,
  getAllHaltesDirectoryClient,
  getNearestHaltesClient,
  getTransitHubBadge,
} from '@/lib/routeUtils';
import HalteMap from './HalteMap';

const TripPlanner = () => {
  const [allHaltes, setAllHaltes] = useState([]);
  const [originText, setOriginText] = useState('');
  const [originHalte, setOriginHalte] = useState(null);
  const [originSuggestions, setOriginSuggestions] = useState([]);

  const [destText, setDestText] = useState('');
  const [destHalte, setDestHalte] = useState(null);
  const [destSuggestions, setDestSuggestions] = useState([]);

  const [day, setDay] = useState(currentDayKey());
  const [locating, setLocating] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [expandedLegs, setExpandedLegs] = useState({});

  const renderStopList = (leg, legKey) => {
    if (!leg || !leg.stops || leg.stops.length === 0) return null;
    const isExpanded = expandedLegs[legKey] !== false; // Default: expanded so users immediately see stops

    return (
      <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
            <List className="w-4 h-4 text-sky-600" />
            <span>Daftar Halte yang Dilewati ({leg.stops.length} Halte):</span>
          </div>
          <button
            type="button"
            onClick={() => setExpandedLegs((prev) => ({ ...prev, [legKey]: !isExpanded }))}
            className="text-[11px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 hover:bg-sky-100 transition-colors"
          >
            <span>{isExpanded ? 'Sembunyikan' : 'Lihat Semua Halte'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {leg.stops.map((stopName, sIdx) => {
                const isFirst = sIdx === 0;
                const isLast = sIdx === leg.stops.length - 1;

                return (
                  <div
                    key={sIdx}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                      isFirst
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold'
                        : isLast
                        ? 'bg-rose-50 border border-rose-300 text-rose-950 font-bold'
                        : 'bg-slate-50 border border-slate-200 text-slate-700'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-black flex-shrink-0 ${
                        isFirst
                          ? 'bg-emerald-600 text-white'
                          : isLast
                          ? 'bg-rose-600 text-white'
                          : 'bg-sky-100 text-sky-800 border border-sky-200'
                      }`}
                    >
                      {sIdx + 1}
                    </span>
                    <span className="truncate leading-tight flex-grow" title={stopName}>
                      {stopName}
                    </span>
                    {isFirst && (
                      <span className="ml-auto text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-tight flex-shrink-0">
                        Naik
                      </span>
                    )}
                    {isLast && (
                      <span className="ml-auto text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-tight flex-shrink-0">
                        Turun
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const haltesList = getAllHaltesDirectoryClient();
    setAllHaltes(haltesList);
  }, []);

  const handleOriginChange = (val) => {
    setOriginText(val);
    setOriginHalte(null);
    if (!val.trim()) {
      setOriginSuggestions([]);
      return;
    }
    const q = val.toLowerCase().trim();
    const matches = allHaltes.filter((h) => h.nama.toLowerCase().includes(q));
    setOriginSuggestions(matches.slice(0, 8));
  };

  const pickOrigin = (halte) => {
    setOriginHalte(halte);
    setOriginText(halte.nama);
    setOriginSuggestions([]);
  };

  const handleDestChange = (val) => {
    setDestText(val);
    setDestHalte(null);
    if (!val.trim()) {
      setDestSuggestions([]);
      return;
    }
    const q = val.toLowerCase().trim();
    const matches = allHaltes.filter((h) => h.nama.toLowerCase().includes(q));
    setDestSuggestions(matches.slice(0, 8));
  };

  const pickDest = (halte) => {
    setDestHalte(halte);
    setDestText(halte.nama);
    setDestSuggestions([]);
  };

  const useMyLocation = () => {
    setError('');
    if (!('geolocation' in navigator)) {
      setError('Browser tidak mendukung Geolocation.');
      return;
    }
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = getNearestHaltesClient(
          pos.coords.latitude,
          pos.coords.longitude,
          1,
          day
        );
        if (nearest && nearest.length) {
          const top = nearest[0];
          setOriginHalte(top);
          setOriginText(`${top.nama} (${formatKm(top.distance_km)} dari lokasi Anda)`);
        } else {
          setError('Tidak dapat menemukan halte terdekat dari lokasi Anda.');
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError('Gagal mengakses lokasi GPS Anda. Silakan ketik halte asal secara manual.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const plan = async () => {
    setError('');
    setResult(null);

    let rawOrig = originHalte ? originHalte.nama : originText.trim();
    let rawDst = destHalte ? destHalte.nama : destText.trim();

    if (!rawOrig) {
      setError('Tentukan halte asal terlebih dahulu.');
      return;
    }
    if (!rawDst) {
      setError('Tentukan halte tujuan terlebih dahulu.');
      return;
    }

    // Auto-resolve typed names against allHaltes directory if not selected via dropdown
    let resolvedOrigin = originHalte;
    if (!resolvedOrigin && rawOrig) {
      const match = allHaltes.find(
        (h) => h.nama.toLowerCase().trim() === rawOrig.toLowerCase().trim()
      ) || allHaltes.find(
        (h) => h.nama.toLowerCase().includes(rawOrig.toLowerCase().trim())
      );
      if (match) resolvedOrigin = match;
    }

    let resolvedDest = destHalte;
    if (!resolvedDest && rawDst) {
      const match = allHaltes.find(
        (h) => h.nama.toLowerCase().trim() === rawDst.toLowerCase().trim()
      ) || allHaltes.find(
        (h) => h.nama.toLowerCase().includes(rawDst.toLowerCase().trim())
      );
      if (match) resolvedDest = match;
    }

    const origName = resolvedOrigin ? resolvedOrigin.nama : rawOrig;
    const dstName = resolvedDest ? resolvedDest.nama : rawDst;

    setPlanning(true);

    try {
      if (resolvedOrigin?.lat != null && resolvedDest?.lat != null) {
        try {
          const { data } = await routesAPI.plan({
            fromLat: resolvedOrigin.lat,
            fromLng: resolvedOrigin.lng,
            toLat: resolvedDest.lat,
            toLng: resolvedDest.lng,
            fromName: origName,
            toName: dstName,
            day,
          });
          if (data && data.found && data.options?.length > 0) {
            setResult(data);
            setPlanning(false);
            return;
          }
        } catch (apiErr) {
          console.log('Backend plan fallback to client BFS planner');
        }
      }

      const clientResult = planJourneyClient({
        originLat: resolvedOrigin?.lat,
        originLng: resolvedOrigin?.lng,
        originName: origName,
        destLat: resolvedDest?.lat,
        destLng: resolvedDest?.lng,
        destName: dstName,
        dayKey: day,
      });

      setResult(clientResult);
    } catch (err) {
      console.error(err);
      setError('Gagal merencanakan perjalanan. Silakan periksa kembali nama halte.');
    } finally {
      setPlanning(false);
    }
  };

  const getMapPolylines = (option) => {
    if (!option || !option.legs) return [];
    const polylines = [];

    // Lookup map of all known haltes for fallback coordinates
    const coordsMap = new Map();
    (allHaltes || []).forEach((h) => {
      if (h.lat != null && h.lng != null) {
        coordsMap.set(h.nama.trim().toLowerCase(), [h.lat, h.lng]);
      }
    });

    option.legs.forEach((leg, li) => {
      const positions = [];

      // 1. If leg has explicit path array with lat/lng
      if (Array.isArray(leg.path) && leg.path.length > 0) {
        leg.path.forEach((p) => {
          if (p.lat != null && p.lng != null) {
            positions.push([p.lat, p.lng]);
          }
        });
      }

      // 2. If positions is empty or less than 2, build from leg.stops using coordsMap
      if (positions.length < 2 && Array.isArray(leg.stops) && leg.stops.length > 0) {
        leg.stops.forEach((sName) => {
          const pt = coordsMap.get(sName.trim().toLowerCase());
          if (pt) {
            positions.push(pt);
          }
        });
      }

      // Ensure board and alight are included if positions is still sparse
      if (positions.length === 0) {
        if (leg.board_lat != null && leg.board_lng != null) {
          positions.push([leg.board_lat, leg.board_lng]);
        }
        if (leg.alight_lat != null && leg.alight_lng != null) {
          positions.push([leg.alight_lat, leg.alight_lng]);
        }
      }

      if (positions.length >= 2) {
        polylines.push({
          positions,
          color: leg.route_warna || '#0284c7',
          weight: 6,
          opacity: 0.9,
          tooltip: `Trayek ${li + 1}: Koridor ${leg.route_nama} (${leg.board_halte} ➔ ${leg.alight_halte})`,
        });
      }

      // 3. Connect between transit legs if alight and next board are different points
      if (li < option.legs.length - 1) {
        const nextLeg = option.legs[li + 1];
        const curAlight =
          positions.length > 0
            ? positions[positions.length - 1]
            : leg.alight_lat != null
            ? [leg.alight_lat, leg.alight_lng]
            : null;
        const nextBoard =
          nextLeg.board_lat != null
            ? [nextLeg.board_lat, nextLeg.board_lng]
            : coordsMap.get(nextLeg.board_halte?.trim().toLowerCase());

        if (curAlight && nextBoard) {
          const distM = Math.hypot(curAlight[0] - nextBoard[0], curAlight[1] - nextBoard[1]);
          if (distM > 0.0001) {
            polylines.push({
              positions: [curAlight, nextBoard],
              color: '#d97706',
              weight: 4,
              dashArray: '5, 8',
              opacity: 0.8,
              tooltip: `Transit / Oper: Jalan ke Halte ${nextLeg.board_halte}`,
            });
          }
        }
      }
    });

    return polylines;
  };

  const getMapMarkers = (option) => {
    if (!option || !option.legs) return [];
    const markers = [];
    const legs = option.legs;

    // 1. Origin Halte Marker (Emerald Green) - ALWAYS PROMINENT #1
    const firstLeg = legs[0];
    const originLat = firstLeg.board_lat;
    const originLng = firstLeg.board_lng;

    if (originLat != null && originLng != null) {
      markers.push({
        lat: originLat,
        lng: originLng,
        label: `Halte Asal: ${firstLeg.board_halte}`,
        sub: `Titik Keberangkatan • Naik Koridor ${firstLeg.route_nama} (Arah: ${firstLeg.arah})`,
        color: '#10b981',
        number: '1',
        isOrigin: true,
      });
    }

    // 2. Intermediate Transit Halte Markers (Amber)
    let transitStep = 2;
    for (let i = 0; i < legs.length - 1; i++) {
      const curLeg = legs[i];
      const nextLeg = legs[i + 1];
      const isSameStop =
        curLeg.alight_halte.trim().toLowerCase() === nextLeg.board_halte.trim().toLowerCase();

      // Check distance from origin: if transit stop is at the origin hub/terminal (< 100 meters)
      const distFromOrigin =
        originLat != null && curLeg.alight_lat != null
          ? Math.hypot(curLeg.alight_lat - originLat, curLeg.alight_lng - originLng) * 111000
          : 999;

      if (distFromOrigin < 100) {
        // Transfer happens right at the origin hub (e.g. Mata Ie 1 -> Mata Ie 2)
        if (markers.length > 0) {
          markers[0].sub = `Titik Keberangkatan • Oper di ${curLeg.alight_halte} ke Koridor ${nextLeg.route_nama}`;
        }
        continue; // Never place a transit pin on top of the origin pin!
      }

      if (curLeg.alight_lat != null && curLeg.alight_lng != null) {
        markers.push({
          lat: curLeg.alight_lat,
          lng: curLeg.alight_lng,
          label: `Halte Transit: ${curLeg.alight_halte}`,
          sub: isSameStop
            ? `Ganti ke Koridor ${nextLeg.route_nama} (Arah: ${nextLeg.arah})`
            : `Turun di sini, jalan ke ${nextLeg.board_halte} untuk naik Koridor ${nextLeg.route_nama}`,
          color: '#f59e0b',
          number: `${transitStep++}`,
          isTransit: true,
        });
      }
    }

    // 3. Destination Halte Marker (Red)
    const lastLeg = legs[legs.length - 1];
    if (lastLeg.alight_lat != null && lastLeg.alight_lng != null) {
      markers.push({
        lat: lastLeg.alight_lat,
        lng: lastLeg.alight_lng,
        label: `Halte Tujuan: ${lastLeg.alight_halte}`,
        sub: `Tujuan Akhir • Turun dari Koridor ${lastLeg.route_nama}`,
        color: '#ef4444',
        number: `${transitStep}`,
        isDest: true,
      });
    }

    return markers;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Form Input Card */}
      <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600 flex-shrink-0">
            <RouteIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Rencanakan Perjalanan</h3>
            <p className="text-xs text-gray-500">
              Ketik nama halte asal dan tujuan untuk melihat skema panduan rute (Rute Langsung atau Transit)
            </p>
          </div>
        </div>

        {/* Origin Autocomplete */}
        <div className="mb-4 relative">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Halte Asal (Origin)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600" />
              <Input
                value={originText}
                onChange={(e) => handleOriginChange(e.target.value)}
                placeholder="Ketik nama halte asal (mis. Bandara SIM, Pelabuhan Ulee Lheue)"
                className="pl-10 rounded-xl border-2 border-gray-200 focus:border-sky-500"
              />
            </div>

            <button
              onClick={useMyLocation}
              disabled={locating}
              className="inline-flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border-2 border-sky-200 font-semibold px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition-colors"
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              Lokasi Saya (Halte Terdekat)
            </button>
          </div>

          {originSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white border-2 border-gray-100 rounded-2xl shadow-xl max-h-56 overflow-y-auto">
              {originSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => pickOrigin(s)}
                  className="w-full text-left px-4 py-2.5 hover:bg-sky-50 border-b border-gray-50 last:border-0 text-sm flex items-center justify-between"
                >
                  <span className="font-semibold text-gray-800">{s.nama}</span>
                  <span className="text-xs text-gray-400">{s.routes?.length} Rute</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Destination Autocomplete */}
        <div className="mb-6 relative">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Halte Tujuan (Destination)
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600" />
            <Input
              value={destText}
              onChange={(e) => handleDestChange(e.target.value)}
              placeholder="Ketik nama halte tujuan (mis. Masjid Raya, Darussalam, Mata Ie)"
              className="pl-10 rounded-xl border-2 border-gray-200 focus:border-sky-500"
            />
          </div>

          {destSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white border-2 border-gray-100 rounded-2xl shadow-xl max-h-56 overflow-y-auto">
              {destSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => pickDest(s)}
                  className="w-full text-left px-4 py-2.5 hover:bg-sky-50 border-b border-gray-50 last:border-0 text-sm flex items-center justify-between"
                >
                  <span className="font-semibold text-gray-800">{s.nama}</span>
                  <span className="text-xs text-gray-400">{s.routes?.length} Rute</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Day & Search Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="rounded-xl border-2 border-gray-200 focus:border-sky-500 px-4 py-3 text-sm font-semibold text-gray-700 bg-white"
          >
            {DAY_KEYS.map((k) => (
              <option key={k} value={k}>
                {DAY_LABELS[k]}
              </option>
            ))}
          </select>

          <button
            onClick={plan}
            disabled={planning}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-sky-600/30 transition-all"
          >
            {planning ? <Loader2 className="w-5 h-5 animate-spin" /> : <RouteIcon className="w-5 h-5" />}
            Cari Rute & Panduan Perjalanan
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* No Route Found State */}
      {result && !result.found && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h4 className="font-bold text-amber-900 text-lg mb-1">Rute Tidak Ditemukan</h4>
          <p className="text-amber-800 text-sm max-w-md mx-auto">
            {result.message || 'Tidak ada jalur bus langsung maupun transit yang menghubungkan halte ini.'}
          </p>
        </div>
      )}

      {/* RESULTS VIEW */}
      {result?.found && (
        <div className="space-y-5">
          {result.options.map((opt, oi) => {
            const isDirect = opt.type === 'direct';

            return (
              <div key={oi} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Option Header */}
                <div className={`flex items-center justify-between px-4 py-3 ${isDirect ? 'bg-emerald-600' : 'bg-sky-700'}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-black flex items-center justify-center">{oi + 1}</span>
                    <span className="text-white font-bold text-sm">
                      {isDirect
                        ? '🟢 Rute Langsung (Tanpa Transit)'
                        : `🔄 Rute Transit (${opt.legs.length - 1}× Ganti Bus)`}
                    </span>
                  </div>
                  <span className="text-xs text-white/80 font-semibold">{opt.total_stops} halte total</span>
                </div>

                {/* Map with Route Lines & Legend */}
                {opt.legs?.some((l) => l.board_lat != null) && (
                  <div className="border-b border-gray-100">
                    <HalteMap
                      markers={getMapMarkers(opt)}
                      polylines={getMapPolylines(opt)}
                      height={280}
                    />
                    {/* Visual Route Legend */}
                    <div className="bg-gray-50/90 border-t border-gray-100 px-4 py-2 flex items-center justify-between flex-wrap gap-2 text-[11px] text-gray-600">
                      <div className="flex items-center gap-3 flex-wrap font-medium">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
                          Asal
                        </span>
                        {opt.legs.length > 1 && (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs"></span>
                            Halte Transit
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-xs"></span>
                          Tujuan
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 flex-wrap">
                        <span>Garis rute:</span>
                        {opt.legs.map((l, li) => (
                          <span
                            key={li}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-white font-bold"
                            style={{ backgroundColor: l.route_warna || '#0284c7' }}
                          >
                            Koridor {l.route_nama}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Legs */}
                <div className="p-4 space-y-1">
                  {opt.legs.map((leg, li) => {
                    const legKey = `${oi}-leg${li}`;
                    const isExp = expandedLegs[legKey] !== false;
                    const stops = leg.stops || [];

                    const prevLeg = li > 0 ? opt.legs[li - 1] : null;
                    const isSameStopTransfer = prevLeg && prevLeg.alight_halte.toLowerCase().trim() === leg.board_halte.toLowerCase().trim();

                    return (
                      <div key={li}>
                        {/* Transit connector between legs */}
                        {li > 0 && (
                          <div className="flex items-center gap-2.5 py-3 px-3.5 my-2 bg-amber-50 border border-amber-200 rounded-xl">
                            <RefreshCw className="w-4 h-4 text-amber-600 flex-shrink-0 animate-spin-slow" />
                            <p className="text-xs sm:text-sm text-amber-900 font-semibold leading-relaxed">
                              {isSameStopTransfer ? (
                                <>
                                  <span className="font-bold text-amber-950">Transit &amp; Ganti Bus</span> di{' '}
                                  <span className="font-black text-amber-950 bg-amber-200/70 px-1.5 py-0.5 rounded">{prevLeg.alight_halte}</span>
                                  {' ➔ '}Pindah ke bus <span className="font-black text-amber-950">Rute {leg.route_nama}</span> (Arah: {leg.arah}).
                                </>
                              ) : (
                                <>
                                  <span className="font-bold text-amber-950">Transit Halte</span>: Turun di{' '}
                                  <span className="font-black text-amber-950 bg-amber-200/70 px-1.5 py-0.5 rounded">{prevLeg.alight_halte}</span>
                                  {', '}jalan ke{' '}
                                  <span className="font-black text-amber-950 bg-amber-200/70 px-1.5 py-0.5 rounded">{leg.board_halte}</span>
                                  {' '}untuk ganti bus <span className="font-black text-amber-950">Rute {leg.route_nama}</span> (Arah: {leg.arah}).
                                </>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Leg Card */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* Leg Header */}
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <Bus className="w-5 h-5 text-sky-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-gray-900 text-sm">
                                  Trayek {li + 1}: Rute {leg.route_nama}
                                </span>
                                {leg.departure && (
                                  <span className="flex items-center gap-1 text-xs text-sky-600 font-semibold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                                    <Clock className="w-3 h-3" />
                                    Berangkat ±{leg.departure}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                                  {leg.num_stops} halte
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">Arah: {leg.arah}</p>
                            </div>
                          </div>

                          {/* Board / Alight */}
                          <div className="px-4 py-3 flex items-center gap-2 flex-wrap text-sm">
                            <span className="text-emerald-700 font-bold">Naik:</span>
                            <span className="font-semibold text-gray-800">{leg.board_halte}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-red-600 font-bold">Turun:</span>
                            <span className="font-semibold text-gray-800">{leg.alight_halte}</span>
                          </div>

                          {/* Stop List */}
                          {stops.length > 0 && (
                            <div className="px-4 pb-3">
                              <button
                                type="button"
                                onClick={() => setExpandedLegs((prev) => ({ ...prev, [legKey]: !isExp }))}
                                className="flex items-center gap-1.5 text-xs text-sky-600 font-bold hover:text-sky-800 mb-2"
                              >
                                {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {isExp ? 'Sembunyikan' : `Lihat ${stops.length} halte perhentian`}
                              </button>
                              {isExp && (
                                <div className="flex flex-wrap gap-1.5">
                                  {stops.map((s, si) => (
                                    <span
                                      key={si}
                                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${
                                        si === 0
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                          : si === stops.length - 1
                                          ? 'bg-red-100 text-red-800 border-red-300'
                                          : 'bg-gray-100 text-gray-700 border-gray-200'
                                      }`}
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Official Dishub Guide Card */}
                <div className="bg-gradient-to-b from-sky-50/70 to-slate-50 border-t border-sky-100 p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900 text-sm">Panduan Resmi Trans Koetaradja</h5>
                      <p className="text-[11px] text-gray-500">Dinas Perhubungan Aceh • Petunjuk Lengkap Perjalanan</p>
                    </div>
                  </div>

                  {/* 1. Ringkasan Perjalanan */}
                  <div className="bg-white rounded-xl p-3.5 border border-sky-100 mb-3 shadow-xs text-xs space-y-1.5">
                    <div className="font-bold text-sky-900 flex items-center gap-1.5 mb-1 text-[13px]">
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      1. Ringkasan Perjalanan:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
                      <div>
                        <span className="font-semibold text-gray-500">Titik Berangkat:</span>{' '}
                        <span className="font-bold text-gray-900">{opt.legs[0]?.board_halte}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-500">Titik Tujuan:</span>{' '}
                        <span className="font-bold text-gray-900">{opt.legs[opt.legs.length - 1]?.alight_halte}</span>
                      </div>
                    </div>
                    <div className="text-gray-700 pt-1.5 border-t border-gray-100">
                      <span className="font-semibold text-gray-500">Estimasi Koridor:</span>{' '}
                      <span className="font-bold text-sky-800">
                        {opt.legs.map((l, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && (
                              <span className="text-amber-700 font-bold mx-1.5">
                                ➔ Transit di <span className="underline">{l.board_halte}</span> ➔
                              </span>
                            )}
                            <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">Koridor {l.route_nama}</span>
                          </React.Fragment>
                        ))}
                      </span>
                    </div>
                  </div>

                  {/* 2. Langkah Demi Langkah (Step-by-Step) */}
                  <div className="bg-white rounded-xl p-3.5 border border-sky-100 mb-3 shadow-xs text-xs space-y-2">
                    <div className="font-bold text-sky-900 flex items-center gap-1.5 text-[13px]">
                      <ListOrdered className="w-3.5 h-3.5 text-sky-600" />
                      2. Langkah Demi Langkah (Step-by-Step):
                    </div>
                    <div className="space-y-2 pl-1">
                      {(() => {
                        const steps = [];
                        let sIdx = 1;
                        opt.legs.forEach((leg, li) => {
                          steps.push(
                            <div key={`step-board-${li}`} className="flex items-start gap-2 text-gray-800">
                              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
                                {sIdx++}
                              </span>
                              <p className="leading-relaxed">
                                <strong className="text-gray-900">Naik Bus Trans Koetaradja Koridor {leg.route_nama}</strong> dari{' '}
                                <span className="font-bold text-sky-700">{leg.board_halte}</span> (Arah: {leg.arah})
                                {leg.departure ? ` dengan estimasi keberangkatan ±${leg.departure}` : ''}.
                              </p>
                            </div>
                          );

                          const interStops = (leg.stops || []).slice(1, -1);
                          if (interStops.length > 0) {
                            const preview = interStops.slice(0, 3).join(' ➔ ');
                            const sisa = interStops.length > 3 ? ` dan ${interStops.length - 3} halte lainnya` : '';
                            steps.push(
                              <div key={`step-pass-${li}`} className="flex items-start gap-2 text-gray-700">
                                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
                                  {sIdx++}
                                </span>
                                <p className="leading-relaxed">
                                  Lewati rute: <span className="text-gray-900 font-medium">{preview}{sisa}</span>.
                                </p>
                              </div>
                            );
                          }

                          if (li < opt.legs.length - 1) {
                            const nextLeg = opt.legs[li + 1];
                            const isSameStop = leg.alight_halte.toLowerCase().trim() === nextLeg.board_halte.toLowerCase().trim();
                            steps.push(
                              <div key={`step-transit-${li}`} className="flex items-start gap-2 text-amber-900 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60">
                                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
                                  {sIdx++}
                                </span>
                                <p className="leading-relaxed">
                                  <strong className="text-amber-950">(Transit &amp; Ganti Bus)</strong>: Turun di{' '}
                                  <span className="font-bold text-amber-950 underline">{leg.alight_halte}</span>. {isSameStop ? 'Tunggu dan pindah ke' : `Jalan ke ${nextLeg.board_halte} lalu pindah ke`}{' '}
                                  <strong className="text-amber-950">Bus Koridor {nextLeg.route_nama}</strong> (Arah: {nextLeg.arah}).
                                </p>
                              </div>
                            );
                          } else {
                            steps.push(
                              <div key={`step-final-${li}`} className="flex items-start gap-2 text-emerald-900 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/60">
                                <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
                                  {sIdx++}
                                </span>
                                <p className="leading-relaxed">
                                  <strong className="text-emerald-950">Tiba di Tujuan</strong>: Lanjutkan perjalanan hingga turun di{' '}
                                  <span className="font-bold text-emerald-950 underline">{leg.alight_halte}</span>. Perjalanan Anda selesai!
                                </p>
                              </div>
                            );
                          }
                        });
                        return steps;
                      })()}
                    </div>
                  </div>

                  {/* 3. Tips Operasional */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-950">3. Tips Operasional Dishub Aceh:</span>
                      <p className="mt-0.5 text-amber-900/90 leading-relaxed">
                        Layanan Bus Trans Koetaradja saat ini <strong>gratis</strong> (cukup tap kartu uang elektronik / e-money seperti Flazz, TapCash, atau Brizzi di pintu masuk). Jam operasional reguler mulai pukul <strong>06.30 – 18.30 WIB</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TripPlanner;

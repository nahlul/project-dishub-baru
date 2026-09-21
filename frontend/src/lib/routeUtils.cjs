const { TRANS_ROUTES } = require('./transData.cjs');

const DAY_LABELS = {
  senin_kamis: 'Senin - Kamis',
  jumat: "Jum'at",
  sabtu: 'Sabtu',
  minggu: 'Minggu',
  sabtu_minggu: 'Sabtu - Minggu',
};

const DAY_KEYS = ['senin_kamis', 'jumat', 'sabtu', 'minggu', 'sabtu_minggu'];

function currentDayKey() {
  const d = new Date().getDay();
  if (d === 5) return 'jumat';
  if (d === 6) return 'sabtu';
  if (d === 0) return 'minggu';
  return 'senin_kamis';
}

function timesForDay(jadwal = {}, dayKey) {
  if (jadwal[dayKey]?.length) return jadwal[dayKey];
  if ((dayKey === 'sabtu' || dayKey === 'minggu') && jadwal.sabtu_minggu?.length) {
    return jadwal.sabtu_minggu;
  }
  if (dayKey === 'senin_kamis' && jadwal.senin_jumat?.length) return jadwal.senin_jumat;
  return jadwal[dayKey] || [];
}

function minutesNow() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function nextBus(jadwal, dayKey, refMinutes = minutesNow()) {
  const times = timesForDay(jadwal, dayKey);
  for (const time of times) {
    const [h, m] = time.split(':').map(Number);
    const busMin = h * 60 + m;
    if (busMin >= refMinutes) return { time, diff: busMin - refMinutes };
  }
  return null;
}

function formatKm(km) {
  if (km == null || isNaN(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Haversine formula calculation for distance between 2 coordinates in km.
 * d = 2R * asin( sqrt( sin^2(dlat/2) + cos(lat1)*cos(lat2)*sin^2(dlng/2) ) )
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
  const R = 6371.0; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Transit Hub Definitions
const TRANSIT_HUBS = [
  'masjid raya baiturrahman',
  'pasar aceh',
  'blang padang',
  'museum tsunami',
  'sp. mesra',
  'mesjid jamik',
  'masjid jamik',
  'pasar lambaro',
  'lambaro',
  'barata',
  'keudah',
  'mata ie 2',
  'bandara sim',
  'pelabuhan ulee lheue',
];

function isTransitHub(halteName = '') {
  const norm = halteName.toLowerCase();
  return TRANSIT_HUBS.some((hub) => norm.includes(hub));
}

function getTransitHubBadge(halteName = '') {
  const norm = halteName.toLowerCase();
  if (norm.includes('masjid raya baiturrahman')) return 'Titik Transit Utama Antar-Koridor';
  if (norm.includes('pasar aceh') || norm.includes('blang padang')) return 'Titik Transit Pusat Kota';
  if (norm.includes('museum tsunami')) return 'Titik Transit Wisata & Ulee Lheue';
  if (norm.includes('sp. mesra') || norm.includes('mesjid jamik')) return 'Titik Transit Kampus & Malahayati';
  if (norm.includes('lambaro')) return 'Titik Transit Lambaro & Blang Bintang';
  if (norm.includes('ulee lheue')) return 'Titik Transit Pelabuhan';
  if (norm.includes('bandara sim')) return 'Titik Transit Bandara';
  if (norm.includes('mata ie')) return 'Titik Transit Mata Ie';
  if (isTransitHub(halteName)) return 'Titik Transit Resmi';
  return null;
}

/**
 * Get all OTHER corridors connecting at this transit stop
 */
function getConnectingCorridors(halteName = '', currentRouteId = '') {
  if (!halteName) return [];
  const norm = halteName.trim().toLowerCase();
  const connectingMap = new Map();

  for (const route of TRANS_ROUTES) {
    if (route.id === currentRouteId) continue; // Skip current corridor
    for (const h of route.halte || []) {
      if (h.nama.trim().toLowerCase() === norm) {
        if (!connectingMap.has(route.id)) {
          connectingMap.set(route.id, {
            id: route.id,
            nama: route.nama,
            warna: route.warna || '#0284c7',
            arah: h.arah || '',
          });
        }
      }
    }
  }

  return Array.from(connectingMap.values());
}

/**
 * Split route haltes into separated directions (Arah Pergi vs Arah Pulang)
 */
function getDirectionsForRoute(route) {
  if (!route || !route.halte) return [];
  const groups = [];
  let currentGroup = null;

  for (const h of route.halte) {
    const directionName = h.arah || 'Rute Utama';
    if (!currentGroup || currentGroup.name !== directionName) {
      currentGroup = {
        name: directionName,
        stops: [],
      };
      groups.push(currentGroup);
    }
    currentGroup.stops.push(h);
  }

  return groups;
}

/**
 * Calculate nearest haltes for user location
 */
function getNearestHaltesClient(userLat, userLng, limit = 5, dayKey = currentDayKey()) {
  if (userLat == null || userLng == null) return [];
  const seenMap = new Map();

  for (const route of TRANS_ROUTES) {
    for (const h of route.halte || []) {
      if (h.lat == null || h.lng == null) continue;
      const dist = haversineKm(userLat, userLng, h.lat, h.lng);
      const key = h.nama.strip ? h.nama.strip().toLowerCase() : h.nama.trim().toLowerCase();

      if (!seenMap.has(key)) {
        seenMap.set(key, {
          nama: h.nama,
          lat: h.lat,
          lng: h.lng,
          distance_km: dist,
          jadwal: h.jadwal || {},
          transit_badge: getTransitHubBadge(h.nama),
          routes: [
            {
              route_id: route.id,
              route_nama: route.nama,
              route_warna: route.warna || '#0284c7',
              arah: h.arah || '',
            },
          ],
        });
      } else {
        const existing = seenMap.get(key);
        if (dist < existing.distance_km) {
          existing.distance_km = dist;
          existing.lat = h.lat;
          existing.lng = h.lng;
        }
        const hasRoute = existing.routes.some(
          (r) => r.route_id === route.id && r.arah === h.arah
        );
        if (!hasRoute) {
          existing.routes.push({
            route_id: route.id,
            route_nama: route.nama,
            route_warna: route.warna || '#0284c7',
            arah: h.arah || '',
          });
        }
      }
    }
  }

  const sorted = Array.from(seenMap.values()).sort(
    (a, b) => a.distance_km - b.distance_km
  );
  return sorted.slice(0, limit);
}

/**
 * Get all haltes directory (deduplicated by name)
 */
function getAllHaltesDirectoryClient(query = '', dayKey = currentDayKey()) {
  const seenMap = new Map();
  const q = (query || '').toLowerCase().trim();

  for (const route of TRANS_ROUTES) {
    for (const h of route.halte || []) {
      if (q && !h.nama.toLowerCase().includes(q)) continue;

      const key = h.nama.trim().toLowerCase();
      if (!seenMap.has(key)) {
        seenMap.set(key, {
          nama: h.nama,
          lat: h.lat,
          lng: h.lng,
          transit_badge: getTransitHubBadge(h.nama),
          routes: [
            {
              route_id: route.id,
              route_nama: route.nama,
              route_warna: route.warna || '#0284c7',
              arah: h.arah || '',
              jadwal: h.jadwal || {},
            },
          ],
        });
      } else {
        const existing = seenMap.get(key);
        const hasRoute = existing.routes.some(
          (r) => r.route_id === route.id && r.arah === h.arah
        );
        if (!hasRoute) {
          existing.routes.push({
            route_id: route.id,
            route_nama: route.nama,
            route_warna: route.warna || '#0284c7',
            arah: h.arah || '',
            jadwal: h.jadwal || {},
          });
        }
      }
    }
  }

  return Array.from(seenMap.values()).sort((a, b) => a.nama.localeCompare(b.nama));
}

/**
 * Client Journey Planner using multi-leg BFS graph search across bus corridors
 */
function planJourneyClient({
  originLat,
  originLng,
  originName,
  destLat,
  destLng,
  destName,
  dayKey = 'senin_kamis',
}) {
  // Extract all directed segments (raw directional segments)
  const segments = [];
  for (const route of TRANS_ROUTES) {
    if (!route.halte || route.halte.length === 0) continue;
    const dirs = getDirectionsForRoute(route);
    for (const dir of dirs) {
      segments.push({
        route,
        name: dir.name,
        stops: dir.stops,
      });
    }
  }

  // Find candidate boarding/alighting stops
  function findCandidates(name, lat, lng) {
    const candidates = [];
    const norm = (name || '').toLowerCase().trim();

    if (norm) {
      // 1. Strict exact name match first
      for (let si = 0; si < segments.length; si++) {
        const seg = segments[si];
        for (let pi = 0; pi < seg.stops.length; pi++) {
          const h = seg.stops[pi];
          if (h.nama.toLowerCase().trim() === norm) {
            candidates.push({ segIdx: si, stopIdx: pi, walk: 0, stop: h });
          }
        }
      }

      // 2. Substring fallback ONLY if no exact match was found
      if (candidates.length === 0) {
        for (let si = 0; si < segments.length; si++) {
          const seg = segments[si];
          for (let pi = 0; pi < seg.stops.length; pi++) {
            const h = seg.stops[pi];
            const hNorm = h.nama.toLowerCase().trim();
            if (hNorm.includes(norm) || norm.includes(hNorm)) {
              candidates.push({ segIdx: si, stopIdx: pi, walk: 0, stop: h });
            }
          }
        }
      }
    } else if (lat != null && lng != null) {
      // GPS proximity search
      for (let si = 0; si < segments.length; si++) {
        const seg = segments[si];
        for (let pi = 0; pi < seg.stops.length; pi++) {
          const h = seg.stops[pi];
          if (h.lat == null || h.lng == null) continue;
          const walk = haversineKm(lat, lng, h.lat, h.lng);
          if (walk <= 1.5) {
            candidates.push({ segIdx: si, stopIdx: pi, walk, stop: h });
          }
        }
      }
    }

    return candidates;
  }

  const boardCandidates = findCandidates(originName, originLat, originLng);
  const alightCandidates = findCandidates(destName, destLat, destLng);

  if (boardCandidates.length === 0 || alightCandidates.length === 0) {
    return {
      found: false,
      message: 'Lokasi asal atau tujuan tidak berada di dekat halte bus Trans Koetaradja.',
      options: [],
    };
  }

  function isValidTransfer(t1, t2) {
    const norm1 = t1.nama.toLowerCase().trim();
    const norm2 = t2.nama.toLowerCase().trim();
    const sameName = norm1 === norm2;
    if (sameName) return { valid: true, dist: 0, sameName: true };
    const dist = haversineKm(t1.lat, t1.lng, t2.lat, t2.lng);
    if (dist <= 0.01) return { valid: true, dist, sameLocation: true };
    if (isTransitHub(t1.nama) && dist <= 0.15) return { valid: true, dist, isHub: true };
    if (isTransitHub(t2.nama) && dist <= 0.15) return { valid: true, dist, isHub: true };
    return { valid: false, dist };
  }

  const maxLegs = 4;
  const goalSet = new Set(alightCandidates.map((a) => `${a.segIdx}:${a.stopIdx}`));

  const queue = [];
  for (const b of boardCandidates) {
    queue.push({
      segIdx: b.segIdx,
      boardIdx: b.stopIdx,
      curIdx: b.stopIdx,
      walkFrom: b.walk,
      legs: [],
      transferWalkTotal: 0,
      exactNameTransfers: 0,
      visitedRoutes: new Set([segments[b.segIdx].route.id]),
    });
  }

  const foundOptions = [];

  while (queue.length > 0) {
    const state = queue.shift();
    const seg = segments[state.segIdx];

    if (state.legs.length >= maxLegs) continue;

    for (let pi = state.curIdx + 1; pi < seg.stops.length; pi++) {
      const curStop = seg.stops[pi];
      const boardStop = seg.stops[state.boardIdx];
      const numStops = pi - state.boardIdx;
      const dep = nextBus(boardStop.jadwal, dayKey);

      const newLeg = {
        route_id: seg.route.id,
        route_nama: seg.route.nama,
        route_warna: seg.route.warna || '#0284c7',
        arah: seg.name,
        board_halte: boardStop.nama,
        alight_halte: curStop.nama,
        num_stops: numStops,
        departure: dep ? dep.time : null,
        stops: seg.stops.slice(state.boardIdx, pi + 1).map((s) => s.nama),
        board_lat: boardStop.lat,
        board_lng: boardStop.lng,
        alight_lat: curStop.lat,
        alight_lng: curStop.lng,
      };

      const pathLegs = [...state.legs, newLeg];

      if (goalSet.has(`${state.segIdx}:${pi}`)) {
        const alightCand = alightCandidates.find((a) => a.segIdx === state.segIdx && a.stopIdx === pi);
        const walkTo = alightCand ? alightCand.walk : 0;
        let totalStops = 0;
        pathLegs.forEach((l) => {
          totalStops += l.num_stops;
        });

        foundOptions.push({
          type: pathLegs.length === 1 ? 'direct' : 'transfer',
          legsCount: pathLegs.length,
          walk_from_km: state.walkFrom,
          walk_to_km: walkTo,
          transfer_walk_km: state.transferWalkTotal,
          total_walk_km: state.walkFrom + walkTo + state.transferWalkTotal,
          total_stops: totalStops,
          exactNameTransfers: state.exactNameTransfers,
          legs: pathLegs,
        });
      }

      if (pathLegs.length < maxLegs) {
        for (let nextSi = 0; nextSi < segments.length; nextSi++) {
          if (nextSi === state.segIdx) continue;
          const nextSeg = segments[nextSi];

          const isSameRouteOtherDir = nextSeg.route.id === seg.route.id;
          if (!isSameRouteOtherDir && state.visitedRoutes.has(nextSeg.route.id)) continue;

          for (let nextPi = 0; nextPi < nextSeg.stops.length - 1; nextPi++) {
            const nextBoardStop = nextSeg.stops[nextPi];
            const trans = isValidTransfer(curStop, nextBoardStop);

            if (trans.valid) {
              const newVisited = new Set(state.visitedRoutes);
              newVisited.add(nextSeg.route.id);

              queue.push({
                segIdx: nextSi,
                boardIdx: nextPi,
                curIdx: nextPi,
                walkFrom: state.walkFrom,
                legs: pathLegs,
                transferWalkTotal: state.transferWalkTotal + trans.dist,
                exactNameTransfers: state.exactNameTransfers + (trans.sameName ? 1 : 0),
                visitedRoutes: newVisited,
              });
            }
          }
        }
      }
    }
  }

  const uniqueOptions = [];
  const seenSigs = new Set();
  for (const opt of foundOptions) {
    const sig = opt.legs.map((l) => `${l.route_id}:${l.arah}:${l.board_halte}:${l.alight_halte}`).join('|');
    if (!seenSigs.has(sig)) {
      seenSigs.add(sig);
      uniqueOptions.push(opt);
    }
  }

  uniqueOptions.sort((x, y) => {
    if (x.legsCount !== y.legsCount) return x.legsCount - y.legsCount;
    if (x.exactNameTransfers !== y.exactNameTransfers) return y.exactNameTransfers - x.exactNameTransfers;
    if (Math.abs(x.total_walk_km - y.total_walk_km) > 0.01) {
      return x.total_walk_km - y.total_walk_km;
    }
    return x.total_stops - y.total_stops;
  });

  const finalOptions = uniqueOptions.slice(0, 3);

  if (finalOptions.length === 0) {
    return {
      found: false,
      message: 'Tidak ditemukan rute bus yang menghubungkan titik asal dan tujuan ini.',
      options: [],
    };
  }

  return {
    found: true,
    options: finalOptions,
  };
}


module.exports = { planJourneyClient, TRANS_ROUTES };
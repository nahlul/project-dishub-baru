from fastapi import APIRouter, HTTPException, Depends, Request, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from math import radians, sin, cos, asin, sqrt
import logging
import httpx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/routes", tags=["routes"])

# Rough bounding box for Banda Aceh / Aceh Besar to bias geocoding results.
ACEH_VIEWBOX = "95.20,5.65,95.45,5.45"  # left,top,right,bottom (lon,lat)


async def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points in kilometers."""
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * r * asin(sqrt(a))


async def _all_routes(db) -> list:
    return await db.bus_routes.find({}, {"_id": 0}).to_list(100)


def _iter_haltes(routes):
    """Yield (route, halte) for every halte that has coordinates."""
    for route in routes:
        for halte in route.get("halte", []):
            if "lat" in halte and "lng" in halte:
                yield route, halte


@router.get("/")
async def get_all_routes(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all route names and basic info"""
    try:
        routes = await db.bus_routes.find({}, {"_id": 0, "halte": 0}).to_list(100)
        return routes
    except Exception as e:
        logger.error(f"Get routes error: {e}")
        return []


@router.get("/search")
async def search_halte(q: str = "", db: AsyncIOMotorDatabase = Depends(get_db)):
    """Search halte by name across all routes"""
    try:
        if not q or len(q) < 1:
            return []
        
        # Search in all routes for matching halte names
        routes = await db.bus_routes.find({}, {"_id": 0}).to_list(100)
        results = []
        
        for route in routes:
            for halte in route.get("halte", []):
                if q.lower() in halte["nama"].lower():
                    results.append({
                        "halte_nama": halte["nama"],
                        "halte_arah": halte.get("arah", ""),
                        "route_id": route["id"],
                        "route_nama": route["nama"],
                        "jadwal": halte.get("jadwal", {}),
                    })
        
        return results[:20]  # Limit to 20 results
    except Exception as e:
        logger.error(f"Search halte error: {e}")
        return []


@router.get("/haltes")
async def get_all_haltes(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Flat list of every halte across all routes (deduplicated by name).

    Each entry aggregates which routes serve the halte plus its coordinates,
    for the Halte directory page.
    """
    try:
        routes = await _all_routes(db)
        by_name: dict = {}
        for route in routes:
            for halte in route.get("halte", []):
                key = halte["nama"].strip().lower()
                entry = by_name.get(key)
                if not entry:
                    entry = {
                        "nama": halte["nama"],
                        "lat": halte.get("lat"),
                        "lng": halte.get("lng"),
                        "routes": [],
                    }
                    by_name[key] = entry
                entry["routes"].append({
                    "route_id": route["id"],
                    "route_nama": route["nama"],
                    "route_warna": route.get("warna", "#0284c7"),
                    "arah": halte.get("arah", ""),
                    "jadwal": halte.get("jadwal", {}),
                })
        return sorted(by_name.values(), key=lambda h: h["nama"])
    except Exception as e:
        logger.error(f"Get all haltes error: {e}")
        return []


@router.get("/nearest")
async def nearest_haltes(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    limit: int = Query(5, ge=1, le=20),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Find the haltes nearest to a user position, ordered by distance."""
    try:
        routes = await _all_routes(db)
        seen: dict = {}
        for route, halte in _iter_haltes(routes):
            dist = haversine_km(lat, lng, halte["lat"], halte["lng"])
            key = halte["nama"].strip().lower()
            existing = seen.get(key)
            route_info = {
                "route_id": route["id"],
                "route_nama": route["nama"],
                "route_warna": route.get("warna", "#0284c7"),
            }
            if existing:
                if dist < existing["distance_km"]:
                    existing["distance_km"] = round(dist, 4)
                    existing["lat"] = halte["lat"]
                    existing["lng"] = halte["lng"]
                    existing["arah"] = halte.get("arah", "")
                    existing["jadwal"] = halte.get("jadwal", {})
                if not any(r["route_id"] == route["id"] for r in existing["routes"]):
                    existing["routes"].append(route_info)
            else:
                seen[key] = {
                    "nama": halte["nama"],
                    "arah": halte.get("arah", ""),
                    "lat": halte["lat"],
                    "lng": halte["lng"],
                    "distance_km": round(dist, 4),
                    "jadwal": halte.get("jadwal", {}),
                    "routes": [route_info],
                }
        results = sorted(seen.values(), key=lambda h: h["distance_km"])
        top_results = results[:limit]

        logger.info(f"=== [NEAREST DEBUG] GPS User Position: ({lat}, {lng}) ===")
        for idx, h in enumerate(results[:10]):
            logger.info(
                f"  #{idx+1:2d} | {h['nama']:35s} | Dist: {int(h['distance_km']*1000):4d} m ({h['distance_km']:.4f} km) | Lat: {h['lat']}, Lng: {h['lng']}"
            )

        return top_results
    except Exception as e:
        logger.error(f"Nearest haltes error: {e}")
        raise HTTPException(status_code=500, detail="Failed to find nearest haltes")


@router.get("/geocode")
async def geocode(q: str = Query(..., min_length=2)):
    """Geocode a destination name to coordinates, biased to Banda Aceh.

    Proxied server-side through OpenStreetMap Nominatim so the browser does not
    call the third-party service directly and we can set a proper User-Agent.
    """
    try:
        params = {
            "q": f"{q}, Banda Aceh, Aceh, Indonesia",
            "format": "json",
            "limit": 5,
            "viewbox": ACEH_VIEWBOX,
            "bounded": 0,
            "countrycodes": "id",
        }
        headers = {"User-Agent": "TransKoetaradja-Web/1.0 (dishub Banda Aceh)"}
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params=params, headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
        return [
            {
                "display_name": item.get("display_name"),
                "lat": float(item["lat"]),
                "lng": float(item["lon"]),
            }
            for item in data
        ]
    except httpx.HTTPError as e:
        logger.error(f"Geocode upstream error: {e}")
        raise HTTPException(status_code=502, detail="Layanan pencarian lokasi tidak tersedia")
    except Exception as e:
        logger.error(f"Geocode error: {e}")
        raise HTTPException(status_code=500, detail="Gagal mencari lokasi")


def _next_departure(jadwal: dict, day_key: str, after_minutes: int):
    """Return (time_str, minutes) of the next bus at/after a time, or None."""
    times = jadwal.get(day_key) or jadwal.get("sabtu_minggu") or []
    best = None
    for t in times:
        try:
            h, m = map(int, t.split(":"))
        except ValueError:
            continue
        mins = h * 60 + m
        if mins >= after_minutes and (best is None or mins < best[1]):
            best = (t, mins)
    return best


@router.get("/plan")
async def plan_trip(
    from_lat: float = Query(..., ge=-90, le=90),
    from_lng: float = Query(..., ge=-180, le=180),
    to_lat: float = Query(..., ge=-90, le=90),
    to_lng: float = Query(..., ge=-180, le=180),
    day: str = Query("senin_kamis"),
    depart_after: Optional[str] = Query(None, description="HH:MM earliest departure"),
    from_name: Optional[str] = Query(None, description="Exact origin halte name"),
    to_name: Optional[str] = Query(None, description="Exact destination halte name"),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Plan a trip from an origin to a destination using the bus network.

    Finds direct routes (a single route whose halte order passes the origin's
    nearest halte before the destination's nearest halte) and one-transfer
    itineraries. Returns step-by-step legs with boarding halte, alighting halte
    and the next scheduled departure time.
    """
    try:
        routes = await _all_routes(db)

        after_minutes = 0
        if depart_after:
            try:
                h, m = map(int, depart_after.split(":"))
                after_minutes = h * 60 + m
            except ValueError:
                after_minutes = 0

        # A route file concatenates every direction into one halte array, so a
        # halte name (e.g. "Masjid Raya") can appear once per direction. Split
        # the array into contiguous segments by the "arah" label so boarding and
        # alighting are matched within the same travel direction.
        def segments(route):
            halte = route.get("halte", [])
            segs = []
            start = 0
            for i in range(1, len(halte) + 1):
                if i == len(halte) or halte[i].get("arah") != halte[start].get("arah"):
                    segs.append((start, i))  # [start, end) global indices
                    start = i
            return segs

        # Nearest halte to a point *within a given segment*; returns global index.
        def nearest_in_segment(route, seg, lat, lng):
            halte = route["halte"]
            best = None
            for idx in range(seg[0], seg[1]):
                h = halte[idx]
                if "lat" not in h:
                    continue
                d = haversine_km(lat, lng, h["lat"], h["lng"])
                if best is None or d < best[0]:
                    best = (d, idx, h)
            return best

        def build_leg(route, board_idx, alight_idx):
            halte = route["halte"]
            board = halte[board_idx]
            alight = halte[alight_idx]
            dep = _next_departure(board.get("jadwal", {}), day, after_minutes)
            stops = [h["nama"] for h in halte[board_idx:alight_idx + 1]]
            return {
                "route_id": route["id"],
                "route_nama": route["nama"],
                "route_warna": route.get("warna", "#0284c7"),
                "arah": board.get("arah", ""),
                "board_halte": board["nama"],
                "alight_halte": alight["nama"],
                "num_stops": alight_idx - board_idx,
                "stops": stops,
                "departure": dep[0] if dep else None,
                "board_lat": board.get("lat"),
                "board_lng": board.get("lng"),
                "alight_lat": alight.get("lat"),
                "alight_lng": alight.get("lng"),
            }

        WALK_LIMIT_KM = 1.2  # max walk from user to first halte / last halte to dest

        # Official interchange points where a rider may switch corridors. A
        # transfer is only allowed when both the alighting and next boarding
        # halte are one of these (matched by normalized name, ignoring the
        # trailing 1/2 side marker so e.g. "Halte Mata Ie 2" counts).
        TRANSIT_HUBS = {
            "masjid raya baiturrahman", "masjid jamik darussalam", "keudah",
            "mata ie", "bandara sim", "pasar aceh", "terminal batoh",
            "pelabuhan ulee lheue", "masjid jamik",
        }

        def norm_hub(nama: str) -> str:
            n = nama.lower()
            for pref in ("halte ", "shelter ", "portabel "):
                if n.startswith(pref):
                    n = n[len(pref):]
            n = n.strip()
            # drop trailing side marker "1"/"2"
            if n.endswith(" 1") or n.endswith(" 2"):
                n = n[:-2].strip()
            return n

        def is_hub(nama: str) -> bool:
            return norm_hub(nama) in TRANSIT_HUBS

        # Flatten every route into directed "segments" (one travel direction).
        # Each segment is a list of stop dicts with a global position so we can
        # slice board->alight while preserving order.
        seg_list = []  # each: {"route": route, "stops": [halte,...]}
        for route in routes:
            for s0, s1 in segments(route):
                stops = [route["halte"][i] for i in range(s0, s1)]
                seg_list.append({"route": route, "stops": stops})

        def find_board_indices(lat, lng, name):
            """Return list of (seg_index, stop_index, walk_km) where a rider at
            (lat,lng)/name can board. If an exact halte name is given, match it;
            otherwise use every stop within the walk limit."""
            out = []
            for si, seg in enumerate(seg_list):
                for pi, h in enumerate(seg["stops"]):
                    if h.get("lat") is None:
                        continue
                    if name:
                        if h["nama"].strip().lower() == name.strip().lower():
                            out.append((si, pi, 0.0))
                    else:
                        d = haversine_km(lat, lng, h["lat"], h["lng"])
                        if d <= WALK_LIMIT_KM:
                            out.append((si, pi, d))
            return out

        def find_alight_indices(lat, lng, name):
            out = []
            for si, seg in enumerate(seg_list):
                for pi, h in enumerate(seg["stops"]):
                    if h.get("lat") is None:
                        continue
                    if name:
                        if h["nama"].strip().lower() == name.strip().lower():
                            out.append((si, pi, 0.0))
                    else:
                        d = haversine_km(lat, lng, h["lat"], h["lng"])
                        if d <= WALK_LIMIT_KM:
                            out.append((si, pi, d))
            return out

        def seg_leg(si, board_pi, alight_pi):
            seg = seg_list[si]
            route = seg["route"]
            stops = seg["stops"]
            board = stops[board_pi]
            alight = stops[alight_pi]
            dep = _next_departure(board.get("jadwal", {}), day, after_minutes)
            names = [h["nama"] for h in stops[board_pi:alight_pi + 1]]
            path_coords = [
                {"nama": h["nama"], "lat": h.get("lat"), "lng": h.get("lng")}
                for h in stops[board_pi:alight_pi + 1]
                if h.get("lat") is not None and h.get("lng") is not None
            ]
            return {
                "route_id": route["id"],
                "route_nama": route["nama"],
                "route_warna": route.get("warna", "#0284c7"),
                "arah": board.get("arah", ""),
                "board_halte": board["nama"],
                "alight_halte": alight["nama"],
                "num_stops": alight_pi - board_pi,
                "stops": names,
                "path": path_coords,
                "departure": dep[0] if dep else None,
                "board_lat": board.get("lat"),
                "board_lng": board.get("lng"),
                "alight_lat": alight.get("lat"),
                "alight_lng": alight.get("lng"),
            }

        # BFS over states = (segment index, stop index). We ride a segment from
        # a boarding stop; at every downstream hub stop we may either alight (if
        # it reaches the destination) or transfer to another segment whose own
        # hub stop is within a short walk. Central hubs (Pasar Aceh, Masjid Raya,
        # Keudah) sit within ~300 m of each other, so transfers are matched by
        # proximity rather than identical names; corridor-end U-turns (same route,
        # opposite direction) are allowed too.
        board_starts = find_board_indices(from_lat, from_lng, from_name)
        alight_goals = find_alight_indices(to_lat, to_lng, to_name)
        goal_set = {(si, pi) for si, pi, _ in alight_goals}
        goal_walk = {(si, pi): w for si, pi, w in alight_goals}

        MAX_LEGS = 4
        TRANSFER_WALK_KM = 0.35  # max walk between two hub stops to transfer

        # All hub stops across every segment (for proximity-based transfers).
        hub_stops = []  # (si, pi, lat, lng)
        for si, seg in enumerate(seg_list):
            for pi, h in enumerate(seg["stops"]):
                if is_hub(h["nama"]) and h.get("lat") is not None:
                    hub_stops.append((si, pi, h["lat"], h["lng"]))

        from collections import deque

        best_options = []
        start_states = []
        for si, pi, walk in board_starts:
            # state: (si, board_pi, legs, used_segs, walk_from, transfer_walk_km)
            start_states.append((si, pi, [], frozenset({si}), walk, 0.0))

        seen = set()
        q = deque(start_states)
        while q and len(best_options) < 20:
            si, board_pi, legs, used_segs, walk_from, xfer_walk = q.popleft()
            seg = seg_list[si]
            stops = seg["stops"]
            # If the destination halte lies further along this segment, ride
            # straight to it. Transferring at an earlier hub only adds a pointless
            # extra leg that loops back toward the origin (e.g. Bandara ->
            # Terminal Batoh -> Bandara -> Masjid Raya), so suppress transfers
            # until that goal is passed; the direct ride is recorded in (a).
            goal_ahead = min((gpi for gsi, gpi in goal_set if gsi == si and gpi > board_pi), default=None)
            for pi in range(board_pi + 1, len(stops)):
                h = stops[pi]
                if h.get("lat") is None:
                    continue
                # a) Finish here if this stop reaches the destination.
                if (si, pi) in goal_set:
                    leg = seg_leg(si, board_pi, pi)
                    opt_legs = legs + [leg]
                    best_options.append({
                        "type": "direct" if len(opt_legs) == 1 else "transfer",
                        "walk_from_km": round(walk_from, 3),
                        "walk_to_km": round(goal_walk[(si, pi)], 3),
                        "transfer_walk_km": round(xfer_walk, 3),
                        "legs": opt_legs,
                    })
                # b) Transfer at this stop if it is a hub and budget remains.
                #    Never transfer at a stop that already reaches the goal, and
                #    never transfer before a goal stop that lies ahead on this
                #    segment — the trip is finished best by riding to it.
                nh = norm_hub(h["nama"])
                reaches_goal = (si, pi) in goal_set
                if (len(legs) + 1 < MAX_LEGS and is_hub(h["nama"])
                        and not reaches_goal
                        and (goal_ahead is None or pi >= goal_ahead)):
                    for (nsi, npi, hlat, hlng) in hub_stops:
                        if nsi in used_segs:
                            continue
                        d = haversine_km(h["lat"], h["lng"], hlat, hlng)
                        if d > TRANSFER_WALK_KM:
                            continue
                        # Key on the alighting stop too, so transferring at
                        # Pasar Aceh vs. riding one more stop to Masjid Raya are
                        # explored as distinct paths and ranked by total walking.
                        state_key = (si, pi, nsi, npi, len(legs) + 1)
                        if state_key in seen:
                            continue
                        seen.add(state_key)
                        leg = seg_leg(si, board_pi, pi)
                        q.append((
                            nsi, npi, legs + [leg],
                            used_segs | {nsi}, walk_from, xfer_walk + d,
                        ))

        if best_options:
            # Drop options where an earlier leg already arrives at the exact
            # destination halte — the trailing legs are redundant detours.
            dest_names = {seg_list[si]["stops"][pi]["nama"] for si, pi in goal_set}
            trimmed = []
            for opt in best_options:
                cut = None
                for i, leg in enumerate(opt["legs"]):
                    if leg["alight_halte"] in dest_names:
                        cut = i
                        break
                if cut is not None and cut < len(opt["legs"]) - 1:
                    opt = {**opt, "legs": opt["legs"][:cut + 1],
                           "type": "direct" if cut == 0 else "transfer"}
                trimmed.append(opt)
            best_options = trimmed

            # Count same-stop transfers: where the alight halte of leg N
            # matches the board halte of leg N+1 exactly. More same-stop
            # transfers = better (passenger stays put, no walking).
            def count_same_stop_transfers(opt):
                legs = opt["legs"]
                count = 0
                for i in range(len(legs) - 1):
                    if legs[i]["alight_halte"].strip().lower() == legs[i + 1]["board_halte"].strip().lower():
                        count += 1
                return count

            # Rank: fewer legs, then MOST same-stop transfers (descending),
            # then least total walking, then fewer bus stops.
            best_options.sort(key=lambda p: (
                len(p["legs"]),
                -count_same_stop_transfers(p),
                p["walk_from_km"] + p["walk_to_km"] + p.get("transfer_walk_km", 0),
                sum(l["num_stops"] for l in p["legs"]),
            ))
            # Deduplicate by the sequence of (route, board, alight).
            uniq = []
            sig_seen = set()
            for opt in best_options:
                sig = tuple((l["route_id"], l["board_halte"], l["alight_halte"]) for l in opt["legs"])
                if sig in sig_seen:
                    continue
                sig_seen.add(sig)
                uniq.append(opt)

            # If direct options exist, prioritize and return ONLY direct options
            direct_opts = [opt for opt in uniq if opt["type"] == "direct"]
            if direct_opts:
                return {"found": True, "options": direct_opts[:3]}

            return {"found": True, "options": uniq[:3]}

        return {"found": False, "options": [], "message": "Tidak ditemukan rute bus yang menghubungkan lokasi ini."}
    except Exception as e:
        logger.error(f"Plan trip error: {e}")
        raise HTTPException(status_code=500, detail="Gagal merencanakan perjalanan")


@router.get("/{route_id}")
async def get_route_detail(route_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get full route detail with all halte and schedules"""
    try:
        route = await db.bus_routes.find_one({"id": route_id}, {"_id": 0})
        if not route:
            raise HTTPException(status_code=404, detail="Route not found")
        return route
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get route detail error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get route")


@router.get("/halte/{halte_name}")
async def get_halte_schedule(halte_name: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get schedule for a specific halte across all routes"""
    try:
        routes = await db.bus_routes.find({}, {"_id": 0}).to_list(100)
        results = []
        
        for route in routes:
            for halte in route.get("halte", []):
                if halte_name.lower() in halte["nama"].lower():
                    results.append({
                        "halte_nama": halte["nama"],
                        "halte_arah": halte.get("arah", ""),
                        "route_id": route["id"],
                        "route_nama": route["nama"],
                        "route_warna": route.get("warna", "#0284c7"),
                        "jadwal": halte.get("jadwal", {}),
                    })
        
        if not results:
            raise HTTPException(status_code=404, detail="Halte not found")
        
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get halte schedule error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get halte schedule")

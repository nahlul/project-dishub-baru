import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Colored circular pin with optional index number (1-5)
function haltePin(color = '#0284c7', number = null) {
  const numHtml = number != null ? `<span style="color:#fff;font-weight:bold;font-size:11px;line-height:1">${number}</span>` : '';
  const size = number != null ? 24 : 16;
  const radius = size / 2;

  return L.divIcon({
    className: 'custom-halte-pin',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.35);">${numHtml}</div>`,
    iconSize: [size, size],
    iconAnchor: [radius, radius],
  });
}

const userPin = L.divIcon({
  className: 'user-location-pin',
  html: `<div style="position:relative;width:20px;height:20px;">
    <span style="position:absolute;top:0;left:0;width:20px;height:20px;border-radius:50%;background:#0284c7;opacity:0.4;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
    <span style="position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#0284c7;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></span>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    const valid = (points || []).filter((p) => p && p.lat != null && p.lng != null);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 15);
      return;
    }
    const bounds = L.latLngBounds(valid.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [points, map]);
  return null;
}

/**
 * Reusable Leaflet Map component with Polylines & Markers support
 */
const HalteMap = ({ user, markers = [], polylines = [], fit, height = 360, accuracy }) => {
  const center = user
    ? [user.lat, user.lng]
    : markers[0]
    ? [markers[0].lat, markers[0].lng]
    : [5.5483, 95.3238]; // Banda Aceh default center

  // Extract all coordinates from polylines for fitBounds
  const polyPoints = polylines.flatMap((poly) =>
    (poly.positions || []).map((pos) =>
      Array.isArray(pos) ? { lat: pos[0], lng: pos[1] } : pos
    )
  );

  const fitPoints = fit || [
    ...(user ? [user] : []),
    ...markers.filter((m) => m.lat != null && m.lng != null),
    ...polyPoints.filter((p) => p && p.lat != null && p.lng != null),
  ];

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm relative" style={{ height }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={fitPoints} />

        {/* Polylines for Route Paths */}
        {polylines.map((poly, idx) => {
          if (!poly.positions || poly.positions.length < 2) return null;
          return (
            <React.Fragment key={`poly-${idx}`}>
              {/* Outer stroke / glow */}
              <Polyline
                positions={poly.positions}
                pathOptions={{
                  color: poly.color || '#0284c7',
                  weight: (poly.weight || 6) + 4,
                  opacity: 0.3,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Main inner line */}
              <Polyline
                positions={poly.positions}
                pathOptions={{
                  color: poly.color || '#0284c7',
                  weight: poly.weight || 6,
                  opacity: poly.opacity || 0.9,
                  dashArray: poly.dashArray || null,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              >
                {poly.tooltip && (
                  <Popup>
                    <div className="text-xs font-bold text-gray-800">{poly.tooltip}</div>
                  </Popup>
                )}
              </Polyline>
            </React.Fragment>
          );
        })}

        {user && (
          <>
            {accuracy != null && (
              <Circle
                center={[user.lat, user.lng]}
                radius={accuracy}
                pathOptions={{ color: '#0284c7', fillColor: '#0284c7', fillOpacity: 0.1, weight: 1 }}
              />
            )}
            <Marker position={[user.lat, user.lng]} icon={userPin}>
              <Popup>
                <div className="text-xs font-bold text-sky-700">📍 Lokasi Saya</div>
              </Popup>
            </Marker>
          </>
        )}

        {markers.map((m, i) =>
          m.lat != null && m.lng != null ? (
            <Marker
              key={i}
              position={[m.lat, m.lng]}
              icon={haltePin(m.color || '#0284c7', m.number != null ? m.number : i + 1)}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-gray-900">{m.number != null ? `${m.number}. ` : ''}{m.label}</p>
                  {m.sub && <p className="text-gray-500 text-xs mt-0.5">{m.sub}</p>}
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
};

export default HalteMap;

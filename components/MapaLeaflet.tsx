'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ESTADO_COLORS } from '@/lib/constants';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Parche para React 18 Strict Mode: elimina _leaflet_id del contenedor
// antes de inicializar, permitiendo doble montaje sin error.
if (typeof window !== 'undefined' && !(L as any)._siviPatch) {
  (L as any)._siviPatch = true;
  const origInit = (L.Map.prototype as any)._initContainer;
  (L.Map.prototype as any)._initContainer = function (id: HTMLElement | string) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (el && (el as any)._leaflet_id) delete (el as any)._leaflet_id;
    return origInit.call(this, id);
  };
}

export interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  popup?: React.ReactNode;
  onClick?: () => void;
}

interface Props {
  markers: MarkerData[];
  polyline?: [number, number][];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

function createColoredIcon(color: string, label?: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
      <path fill="${color}" stroke="white" stroke-width="2"
        d="M12.5 0C5.596 0 0 5.596 0 12.5c0 7.8 12.5 28.5 12.5 28.5S25 20.3 25 12.5C25 5.596 19.404 0 12.5 0z"/>
      ${label ? `<text x="12.5" y="17" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${label}</text>` : ''}
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onMapClick) return;
    const handler = (e: L.LeafletMouseEvent) => onMapClick(e.latlng.lat, e.latlng.lng);
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [map, onMapClick]);
  return null;
}

function FlyToCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  const prev = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (!prev.current || prev.current[0] !== center[0] || prev.current[1] !== center[1]) {
      map.flyTo(center, map.getZoom(), { duration: 1 });
      prev.current = center;
    }
  }, [center[0], center[1]]);
  return null;
}

export default function MapaLeaflet({
  markers,
  polyline,
  center = [-11.9833, -76.9333],
  zoom = 13,
  className = 'h-full w-full',
  onMapClick,
}: Props) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ zIndex: 1 }}
      // key fijo: nunca remonta el contenedor, evita "already initialized"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={createColoredIcon(m.color || '#3b82f6', m.label)}
          eventHandlers={{ click: m.onClick }}
        >
          {m.popup && <Popup>{m.popup}</Popup>}
        </Marker>
      ))}
      {polyline && polyline.length > 1 && (
        <Polyline positions={polyline} color="#6366f1" weight={4} opacity={0.8} />
      )}
      <FlyToCenter center={center} />
      <MapClickHandler onMapClick={onMapClick} />
    </MapContainer>
  );
}

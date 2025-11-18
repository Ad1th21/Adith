import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Telemetry } from '@/types';

// Fix Leaflet default icon issue with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapViewProps {
  telemetry: Telemetry[];
  center?: [number, number];
  zoom?: number;
}

export default function MapView({ telemetry, center, zoom = 12 }: MapViewProps) {
  const defaultCenter: [number, number] = center || [37.7749, -122.4194]; // San Francisco

  const positions: [number, number][] = telemetry.map((t) => [
    t.location.latitude,
    t.location.longitude,
  ]);

  const latestPosition = positions[positions.length - 1] || defaultCenter;

  return (
    <div className="card h-[400px]">
      <MapContainer
        center={center || latestPosition}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route Path */}
        {positions.length > 1 && (
          <Polyline positions={positions} color="blue" weight={3} opacity={0.6} />
        )}

        {/* Latest Position Marker */}
        {telemetry.length > 0 && (
          <Marker position={latestPosition}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Latest Position</p>
                <p>Speed: {telemetry[telemetry.length - 1].speed.toFixed(1)} km/h</p>
                <p>Battery: {telemetry[telemetry.length - 1].soc.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(telemetry[telemetry.length - 1].timestamp).toLocaleString()}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

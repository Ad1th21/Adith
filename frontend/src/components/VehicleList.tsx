import { useNavigate } from 'react-router-dom';
import { useVehicleStore } from '@/stores/vehicleStore';
import {
  getStatusColor,
  formatTimestamp,
  formatSOC,
  formatSpeed,
  getBatteryColor,
  cn,
} from '@/utils/helpers';
import { Battery, Gauge, MapPin, Clock } from 'lucide-react';
import type { Vehicle } from '@/types';

export default function VehicleList() {
  const navigate = useNavigate();
  const vehicles = useVehicleStore((state) => state.vehicles);
  const latestTelemetry = useVehicleStore((state) => state.latestTelemetry);

  const handleVehicleClick = (vehicle: Vehicle) => {
    navigate(`/vehicle/${vehicle.vin}`);
  };

  if (vehicles.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No vehicles found. Start the telemetry simulator.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vehicles.map((vehicle) => {
        const telemetry = latestTelemetry.get(vehicle.vin);
        return (
          <div
            key={vehicle.vin}
            onClick={() => handleVehicleClick(vehicle)}
            className="card hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {vehicle.manufacturer} {vehicle.model}
                </h3>
                <p className="text-xs text-gray-500 font-mono">{vehicle.vin}</p>
              </div>
              <span className={cn('status-badge', getStatusColor(vehicle.status))}>
                {vehicle.status}
              </span>
            </div>

            {/* Telemetry Data */}
            {telemetry ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Battery className={cn('h-4 w-4', getBatteryColor(telemetry.soc))} />
                  <div>
                    <p className="text-xs text-gray-500">Battery</p>
                    <p className="text-sm font-medium">{formatSOC(telemetry.soc)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Gauge className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Speed</p>
                    <p className="text-sm font-medium">{formatSpeed(telemetry.speed)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-xs font-medium">
                      {telemetry.location.latitude.toFixed(4)}, {telemetry.location.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500">Updated</p>
                    <p className="text-xs font-medium">{formatTimestamp(telemetry.timestamp)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400">No telemetry data available</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

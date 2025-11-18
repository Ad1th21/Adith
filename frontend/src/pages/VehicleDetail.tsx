import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useVehicleDetail, useTelemetryHistory } from '@/hooks/useQueries';
import { useVehicleStore } from '@/stores/vehicleStore';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { subHours } from 'date-fns';
import TelemetryChart from '@/components/TelemetryChart';
import MapView from '@/components/MapView';
import { getStatusColor, formatSOC, formatSpeed, formatTimestamp, cn } from '@/utils/helpers';

export default function VehicleDetail() {
  const { vin } = useParams<{ vin: string }>();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState(24); // hours
  const latestTelemetry = useVehicleStore((state) => state.latestTelemetry);

  const { data: vehicleData, isLoading: vehicleLoading } = useVehicleDetail(vin!);
  const { data: telemetryData, isLoading: telemetryLoading, refetch } = useTelemetryHistory(vin!, {
    startTime: subHours(new Date(), timeRange).toISOString(),
    limit: 500,
  });

  const vehicle = vehicleData?.vehicle;
  const stats = vehicleData?.stats;
  const telemetry = telemetryData?.data || [];
  const latest = latestTelemetry.get(vin!);

  if (vehicleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Vehicle not found</p>
        <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {vehicle.manufacturer} {vehicle.model}
            </h2>
            <p className="text-sm text-gray-500 font-mono">{vehicle.vin}</p>
          </div>
          <span className={cn('status-badge', getStatusColor(vehicle.status))}>
            {vehicle.status}
          </span>
        </div>

        <button
          onClick={() => refetch()}
          className="btn btn-secondary flex items-center space-x-2"
          disabled={telemetryLoading}
        >
          <RefreshCw className={cn('h-4 w-4', telemetryLoading && 'animate-spin')} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Latest Telemetry */}
      {latest && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-500 mb-1">Speed</p>
            <p className="text-2xl font-bold text-gray-900">{formatSpeed(latest.speed)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 mb-1">Battery</p>
            <p className="text-2xl font-bold text-gray-900">{formatSOC(latest.soc)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 mb-1">Temperature</p>
            <p className="text-2xl font-bold text-gray-900">
              {latest.temperature?.toFixed(1) || 'N/A'}°C
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 mb-1">Last Update</p>
            <p className="text-lg font-medium text-gray-900">{formatTimestamp(latest.timestamp)}</p>
          </div>
        </div>
      )}

      {/* 24h Statistics */}
      {stats && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">24-Hour Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Avg Speed</p>
              <p className="text-lg font-semibold">{stats.avg_speed?.toFixed(1) || 'N/A'} km/h</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Max Speed</p>
              <p className="text-lg font-semibold">{stats.max_speed?.toFixed(1) || 'N/A'} km/h</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Min Battery</p>
              <p className="text-lg font-semibold">{stats.min_soc?.toFixed(1) || 'N/A'}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Data Points</p>
              <p className="text-lg font-semibold">{stats.count || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Time Range Selector */}
      <div className="flex space-x-2">
        {[1, 6, 12, 24, 48].map((hours) => (
          <button
            key={hours}
            onClick={() => setTimeRange(hours)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              timeRange === hours
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {hours}h
          </button>
        ))}
      </div>

      {/* Charts and Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <TelemetryChart data={telemetry} metrics={['speed', 'soc', 'temperature']} />
        </div>
        <div>
          {telemetry.length > 0 && (
            <MapView
              telemetry={telemetry}
              center={
                latest
                  ? [latest.location.latitude, latest.location.longitude]
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

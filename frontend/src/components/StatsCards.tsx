import { Car, Activity, AlertTriangle, Battery } from 'lucide-react';
import { useVehicleStore } from '@/stores/vehicleStore';
import { VehicleStatus } from '@/types';
import { cn } from '@/utils/helpers';

export default function StatsCards() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const alerts = useVehicleStore((state) => state.alerts);
  const latestTelemetry = useVehicleStore((state) => state.latestTelemetry);

  const onlineCount = vehicles.filter(
    (v) => v.status === VehicleStatus.ONLINE || v.status === VehicleStatus.DRIVING
  ).length;

  const chargingCount = vehicles.filter((v) => v.status === VehicleStatus.CHARGING).length;

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;

  const avgBattery =
    Array.from(latestTelemetry.values()).reduce((sum, t) => sum + t.soc, 0) /
      (latestTelemetry.size || 1) || 0;

  const stats = [
    {
      label: 'Total Vehicles',
      value: vehicles.length,
      icon: Car,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Online',
      value: onlineCount,
      icon: Activity,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Active Alerts',
      value: unacknowledgedAlerts,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
    },
    {
      label: 'Avg Battery',
      value: `${avgBattery.toFixed(1)}%`,
      icon: Battery,
      color: 'bg-yellow-50 text-yellow-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={cn('p-3 rounded-lg', stat.color)}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

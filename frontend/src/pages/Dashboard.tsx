import StatsCards from '@/components/StatsCards';
import VehicleList from '@/components/VehicleList';
import AlertPanel from '@/components/AlertPanel';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Fleet Overview</h2>
        <p className="text-gray-600">Real-time monitoring of your vehicle fleet</p>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Active Vehicles</h3>
          <VehicleList />
        </div>

        <div className="lg:col-span-1">
          <AlertPanel maxAlerts={8} />
        </div>
      </div>
    </div>
  );
}

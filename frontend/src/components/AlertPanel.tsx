import { useState } from 'react';
import { useVehicleStore } from '@/stores/vehicleStore';
import { alertsApi } from '@/services/api';
import {
  getAlertSeverityColor,
  getAlertTypeLabel,
  formatTimestamp,
  cn,
} from '@/utils/helpers';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import type { Alert } from '@/types';

interface AlertPanelProps {
  maxAlerts?: number;
}

export default function AlertPanel({ maxAlerts = 10 }: AlertPanelProps) {
  const alerts = useVehicleStore((state) => state.alerts);
  const acknowledgeAlertStore = useVehicleStore((state) => state.acknowledgeAlert);
  const [acknowledging, setAcknowledging] = useState<number | null>(null);

  const displayAlerts = alerts.slice(0, maxAlerts);
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  const handleAcknowledge = async (alert: Alert) => {
    if (acknowledging) return;

    setAcknowledging(alert.id);
    try {
      await alertsApi.acknowledge(alert.id, 'Dashboard User');
      acknowledgeAlertStore(alert.id);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    } finally {
      setAcknowledging(null);
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Active Alerts</span>
          </h3>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <p className="text-gray-500">No active alerts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Active Alerts</span>
        </h3>
        {unacknowledgedCount > 0 && (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {unacknowledgedCount} unacknowledged
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {displayAlerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              'p-3 rounded-lg border-l-4 transition-opacity',
              alert.acknowledged ? 'bg-gray-50 opacity-60' : 'bg-white',
              alert.severity === 'critical'
                ? 'border-red-500'
                : alert.severity === 'warning'
                ? 'border-yellow-500'
                : 'border-blue-500'
            )}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={cn('status-badge', getAlertSeverityColor(alert.severity))}>
                    {alert.severity}
                  </span>
                  <span className="text-xs text-gray-600">
                    {getAlertTypeLabel(alert.type)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{alert.message}</p>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span>VIN: {alert.vin}</span>
                  <span>•</span>
                  <span>{formatTimestamp(alert.timestamp)}</span>
                </div>
              </div>

              {!alert.acknowledged && (
                <button
                  onClick={() => handleAcknowledge(alert)}
                  disabled={acknowledging === alert.id}
                  className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                  title="Acknowledge alert"
                >
                  {acknowledging === alert.id ? (
                    <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full" />
                  ) : (
                    <X className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

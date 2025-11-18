import { useState } from 'react';
import { useAlerts } from '@/hooks/useQueries';
import { alertsApi } from '@/services/api';
import { useVehicleStore } from '@/stores/vehicleStore';
import {
  getAlertSeverityColor,
  getAlertTypeLabel,
  formatTimestamp,
  cn,
} from '@/utils/helpers';
import { Filter, CheckCircle } from 'lucide-react';
import type { Alert, AlertSeverity } from '@/types';

export default function AlertsPage() {
  const [filter, setFilter] = useState<'all' | 'unacknowledged'>('unacknowledged');
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | 'all'>('all');
  const acknowledgeAlertStore = useVehicleStore((state) => state.acknowledgeAlert);

  const { data: alertsData, refetch } = useAlerts({
    acknowledged: filter === 'all' ? undefined : false,
  });

  const alerts = alertsData?.alerts || [];

  const filteredAlerts =
    selectedSeverity === 'all'
      ? alerts
      : alerts.filter((a) => a.severity === selectedSeverity);

  const handleAcknowledge = async (alert: Alert) => {
    try {
      await alertsApi.acknowledge(alert.id, 'Dashboard User');
      acknowledgeAlertStore(alert.id);
      refetch();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Alert Management</h2>
        <p className="text-gray-600">View and manage fleet alerts</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('unacknowledged')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === 'unacknowledged'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              Unacknowledged
            </button>
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              All Alerts
            </button>
          </div>

          <div className="border-l pl-4 ml-4 flex space-x-2">
            {(['all', 'critical', 'warning', 'info'] as const).map((severity) => (
              <button
                key={severity}
                onClick={() => setSelectedSeverity(severity)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                  selectedSeverity === severity
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <p className="text-gray-500">No alerts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'card border-l-4',
                alert.severity === 'critical'
                  ? 'border-red-500'
                  : alert.severity === 'warning'
                  ? 'border-yellow-500'
                  : 'border-blue-500',
                alert.acknowledged && 'opacity-60'
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={cn('status-badge', getAlertSeverityColor(alert.severity))}>
                      {alert.severity}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {getAlertTypeLabel(alert.type)}
                    </span>
                    {alert.acknowledged && (
                      <span className="text-xs text-green-600 flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Acknowledged</span>
                      </span>
                    )}
                  </div>

                  <p className="text-lg font-medium text-gray-900 mb-2">{alert.message}</p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>VIN: {alert.vin}</span>
                    <span>•</span>
                    <span>{formatTimestamp(alert.timestamp)}</span>
                    {alert.acknowledgedAt && (
                      <>
                        <span>•</span>
                        <span>Acked {formatTimestamp(alert.acknowledgedAt)}</span>
                      </>
                    )}
                  </div>
                </div>

                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(alert)}
                    className="btn btn-primary ml-4"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

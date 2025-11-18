import { VehicleStatus, AlertSeverity, AlertType } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getStatusColor(status: VehicleStatus): string {
  switch (status) {
    case VehicleStatus.ONLINE:
      return 'bg-green-100 text-green-800';
    case VehicleStatus.DRIVING:
      return 'bg-blue-100 text-blue-800';
    case VehicleStatus.CHARGING:
      return 'bg-yellow-100 text-yellow-800';
    case VehicleStatus.IDLE:
      return 'bg-gray-100 text-gray-800';
    case VehicleStatus.ALERT:
      return 'bg-red-100 text-red-800';
    case VehicleStatus.OFFLINE:
      return 'bg-gray-200 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getAlertSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.INFO:
      return 'bg-blue-100 text-blue-800';
    case AlertSeverity.WARNING:
      return 'bg-yellow-100 text-yellow-800';
    case AlertSeverity.CRITICAL:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getAlertTypeLabel(type: AlertType): string {
  const labels: Record<AlertType, string> = {
    [AlertType.LOW_BATTERY]: 'Low Battery',
    [AlertType.OVERSPEED]: 'Overspeed',
    [AlertType.HIGH_TEMPERATURE]: 'High Temperature',
    [AlertType.GEOFENCE_VIOLATION]: 'Geofence Violation',
    [AlertType.OFFLINE]: 'Offline',
    [AlertType.MAINTENANCE_DUE]: 'Maintenance Due',
    [AlertType.BATTERY_ANOMALY]: 'Battery Anomaly',
    [AlertType.CUSTOM]: 'Custom Alert',
  };
  return labels[type] || type;
}

export function formatTimestamp(timestamp: string): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

export function formatSOC(soc: number): string {
  return `${soc.toFixed(1)}%`;
}

export function formatSpeed(speed: number): string {
  return `${speed.toFixed(1)} km/h`;
}

export function formatTemperature(temp: number): string {
  return `${temp.toFixed(1)}°C`;
}

export function getBatteryColor(soc: number): string {
  if (soc >= 80) return 'text-green-600';
  if (soc >= 50) return 'text-yellow-600';
  if (soc >= 20) return 'text-orange-600';
  return 'text-red-600';
}

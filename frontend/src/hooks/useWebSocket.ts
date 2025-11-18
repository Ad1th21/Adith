import { useEffect } from 'react';
import { wsService } from '@/services/websocket';
import { useVehicleStore } from '@/stores/vehicleStore';
import type { Telemetry, Alert } from '@/types';

export const useWebSocket = () => {
  const { updateLatestTelemetry, addAlert, updateVehicle } = useVehicleStore();

  useEffect(() => {
    wsService.connect();

    const handleTelemetryUpdate = (telemetry: Telemetry) => {
      updateLatestTelemetry(telemetry.vin, telemetry);
    };

    const handleAlertNew = (alert: Alert) => {
      addAlert(alert);
    };

    const handleVehicleStatus = (data: any) => {
      updateVehicle(data.vin, { status: data.status, lastSeen: data.timestamp });
    };

    wsService.onTelemetryUpdate(handleTelemetryUpdate);
    wsService.onAlertNew(handleAlertNew);
    wsService.onVehicleStatus(handleVehicleStatus);

    // Subscribe to fleet updates
    wsService.subscribeToFleet();
    wsService.subscribeToAlerts();

    return () => {
      wsService.offTelemetryUpdate(handleTelemetryUpdate);
      wsService.offAlertNew(handleAlertNew);
      wsService.offVehicleStatus(handleVehicleStatus);
      wsService.disconnect();
    };
  }, [updateLatestTelemetry, addAlert, updateVehicle]);

  return {
    isConnected: wsService.isConnected(),
    subscribeToVehicle: wsService.subscribeToVehicle.bind(wsService),
    unsubscribeFromVehicle: wsService.unsubscribeFromVehicle.bind(wsService),
  };
};

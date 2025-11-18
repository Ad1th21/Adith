import { useQuery } from '@tanstack/react-query';
import { vehiclesApi, telemetryApi, alertsApi } from '@/services/api';

export const useVehicles = () => {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.getAll,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

export const useVehicleDetail = (vin: string) => {
  return useQuery({
    queryKey: ['vehicle', vin],
    queryFn: () => vehiclesApi.getByVin(vin),
    enabled: !!vin,
  });
};

export const useLatestTelemetry = (vin: string) => {
  return useQuery({
    queryKey: ['telemetry', 'latest', vin],
    queryFn: () => telemetryApi.getLatest(vin),
    enabled: !!vin,
    refetchInterval: 5000,
  });
};

export const useTelemetryHistory = (
  vin: string,
  params?: {
    startTime?: string;
    endTime?: string;
    limit?: number;
    offset?: number;
  }
) => {
  return useQuery({
    queryKey: ['telemetry', 'history', vin, params],
    queryFn: () => telemetryApi.getHistory(vin, params),
    enabled: !!vin,
  });
};

export const useAlerts = (params?: { vin?: string; acknowledged?: boolean }) => {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertsApi.getAll(params),
    refetchInterval: 5000,
  });
};

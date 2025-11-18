import { create } from 'zustand';
import type { Vehicle, Telemetry, Alert } from '@/types';

interface VehicleStore {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  latestTelemetry: Map<string, Telemetry>;
  alerts: Alert[];
  setVehicles: (vehicles: Vehicle[]) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  updateVehicle: (vin: string, updates: Partial<Vehicle>) => void;
  updateLatestTelemetry: (vin: string, telemetry: Telemetry) => void;
  addAlert: (alert: Alert) => void;
  setAlerts: (alerts: Alert[]) => void;
  acknowledgeAlert: (alertId: number) => void;
}

export const useVehicleStore = create<VehicleStore>((set) => ({
  vehicles: [],
  selectedVehicle: null,
  latestTelemetry: new Map(),
  alerts: [],

  setVehicles: (vehicles) => set({ vehicles }),

  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),

  updateVehicle: (vin, updates) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.vin === vin ? { ...v, ...updates } : v
      ),
      selectedVehicle:
        state.selectedVehicle?.vin === vin
          ? { ...state.selectedVehicle, ...updates }
          : state.selectedVehicle,
    })),

  updateLatestTelemetry: (vin, telemetry) =>
    set((state) => {
      const newMap = new Map(state.latestTelemetry);
      newMap.set(vin, telemetry);
      return { latestTelemetry: newMap };
    }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100), // Keep last 100 alerts
    })),

  setAlerts: (alerts) => set({ alerts }),

  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
    })),
}));

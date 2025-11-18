import axios from 'axios';
import { config } from '@/config';
import type { Vehicle, Telemetry, Alert } from '@/types';

const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const vehiclesApi = {
  getAll: async (): Promise<{ vehicles: Vehicle[]; total: number }> => {
    const response = await api.get('/api/v1/vehicles');
    return response.data;
  },

  getByVin: async (vin: string): Promise<{ vehicle: Vehicle; stats: any }> => {
    const response = await api.get(`/api/v1/vehicles/${vin}`);
    return response.data;
  },
};

export const telemetryApi = {
  getLatest: async (vin: string): Promise<Telemetry> => {
    const response = await api.get(`/api/v1/telemetry/${vin}/latest`);
    return response.data;
  },

  getHistory: async (
    vin: string,
    params?: {
      startTime?: string;
      endTime?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ data: Telemetry[]; total: number; page: number; pageSize: number }> => {
    const response = await api.get(`/api/v1/telemetry/${vin}`, { params });
    return response.data;
  },
};

export const alertsApi = {
  getAll: async (params?: {
    vin?: string;
    acknowledged?: boolean;
  }): Promise<{ alerts: Alert[]; total: number }> => {
    const response = await api.get('/api/v1/alerts', { params });
    return response.data;
  },

  acknowledge: async (id: number, acknowledgedBy: string): Promise<void> => {
    await api.patch(`/api/v1/alerts/${id}/acknowledge`, { acknowledgedBy });
  },
};

export default api;

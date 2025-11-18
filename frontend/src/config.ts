const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export const config = {
  apiUrl: API_URL,
  wsUrl: WS_URL,
  apiEndpoints: {
    vehicles: `${API_URL}/api/v1/vehicles`,
    telemetry: (vin: string) => `${API_URL}/api/v1/telemetry/${vin}`,
    latestTelemetry: (vin: string) => `${API_URL}/api/v1/telemetry/${vin}/latest`,
    alerts: `${API_URL}/api/v1/alerts`,
    acknowledgeAlert: (id: number) => `${API_URL}/api/v1/alerts/${id}/acknowledge`,
  },
};

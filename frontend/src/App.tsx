import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useVehicles } from '@/hooks/useQueries';
import { useVehicleStore } from '@/stores/vehicleStore';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import VehicleDetail from '@/pages/VehicleDetail';
import AlertsPage from '@/pages/AlertsPage';

function App() {
  const { isConnected } = useWebSocket();
  const { data: vehiclesData } = useVehicles();
  const setVehicles = useVehicleStore((state) => state.setVehicles);

  useEffect(() => {
    if (vehiclesData?.vehicles) {
      setVehicles(vehiclesData.vehicles);
    }
  }, [vehiclesData, setVehicles]);

  return (
    <BrowserRouter>
      <Layout isConnected={isConnected}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicle/:vin" element={<VehicleDetail />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

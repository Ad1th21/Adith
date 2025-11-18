import { Link, useLocation } from 'react-router-dom';
import { Activity, Car, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface LayoutProps {
  children: React.ReactNode;
  isConnected: boolean;
}

export default function Layout({ children, isConnected }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Car },
    { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Vehicle Telemetry Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-6">
              <nav className="flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-gray-600">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-600" />
                    <span className="text-xs text-gray-600">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          © 2025 Vehicle Telemetry System - Fleet Operations Dashboard
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function Layout({ children, module }: { children: ReactNode; module?: string }) {
  const { user, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (!user) return <Navigate to="/login" replace />;
  if (module && !hasPermission(module)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-600">
            Your role does not have permission to access this module. Please contact your system administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header online={online} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          {children}
        </main>
      </div>
      {!online && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-600 text-white text-xs px-4 py-2 flex items-center justify-center gap-2 z-40">
          <WifiOff className="w-4 h-4" />
          You are offline. Changes will be saved locally and synchronized when connection returns.
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        </div>
      )}
    </div>
  );
}

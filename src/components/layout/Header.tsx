import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { ROLE_LABELS } from '@/utils/statusStyles';
import { ApiService } from '@/services/apiService';
import { ChevronDown, Landmark, Wifi, WifiOff, Bell, HelpCircle, Globe, LogOut, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import type { SystemNotification } from '@/types';

export default function Header({ online, onToggleSidebar }: { online: boolean; onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const loadNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const data = await ApiService.getSystemNotifications(user.role, user.email);
      setNotifications(data);
    } catch (e) {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 10000);
    return () => clearInterval(interval);
  }, [loadNotifs]);

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (n: SystemNotification) => {
    setShowNotifs(false);
    if (!n.isRead) {
      await ApiService.markNotificationRead(n.id);
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)));
    }
    if (n.targetModule === 'proposals') navigate('/proposals');
    else if (n.targetModule === 'projects' && n.targetId) navigate(`/projects/${n.targetId}`);
    else if (n.targetModule === 'compensation') navigate('/compensation');
    else if (n.targetModule === 'possession') navigate('/possession');
    else if (n.targetModule === 'rehabilitation') navigate('/rehabilitation');
    else navigate('/notifications');
  };

  return (
    <header className="bg-white border-b border-slate-300 sticky top-0 z-40 shadow-sm no-print">
      {/* Top government band */}
      <div className="bg-[#1e3a5f] text-white text-xs">
        <div className="px-4 flex items-center justify-between h-7">
          <div className="flex items-center gap-3">
            <span className="font-medium tracking-wide">Government of India</span>
            <span className="opacity-50">|</span>
            <span className="opacity-90">Ministry of Road Transport & Highways</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 cursor-pointer hover:underline">
              <Globe className="w-3 h-3" /> English
            </span>
            <span className="flex items-center gap-1 cursor-pointer hover:underline">
              <HelpCircle className="w-3 h-3" /> Help Desk
            </span>
            <span className="opacity-80">Screen Reader Access</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded hover:bg-slate-100 text-slate-700"
            aria-label="Toggle navigation"
          >
            <ChevronRight className="w-5 h-5 rotate-90" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-11 md:h-11 bg-[#1e3a5f] rounded flex items-center justify-center shrink-0 shadow-sm">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-bold text-[#1e3a5f] leading-tight">
                National Land Acquisition & Management System
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block leading-tight">
                Public Works Department (PWD) · Real-Time Decision Support & End-to-End Digital Workflow
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-300">
            PROTOTYPE / DEMONSTRATION
          </span>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded hover:bg-slate-100 text-slate-700 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-xl z-50 animate-fade-in">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-lg">
                  <p className="text-xs font-bold text-slate-800">Action Alerts & Notifications</p>
                  <span className="text-[10px] text-slate-500">{unreadCount} unread</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No active alerts.</div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                          n.isRead ? 'opacity-75' : 'bg-blue-50/40'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 shrink-0">
                            {n.type === 'error' && <XCircle className="w-3.5 h-3.5 text-red-600" />}
                            {n.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                            {n.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                            {n.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                            <span className="text-[9px] text-slate-400 mt-1 block font-mono">{n.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-slate-100 bg-slate-50 rounded-b-lg text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifs(false)}
                    className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1"
                  >
                    View All Notifications <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Network Status */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-50 border border-slate-200">
            {online ? (
              <span className="flex items-center gap-1 text-green-700">
                <Wifi className="w-3.5 h-3.5" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-700">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1 pr-2 rounded hover:bg-slate-100 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{ROLE_LABELS[user.role]}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50">
                <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-t-lg">
                  <p className="text-xs font-bold text-slate-800">{user.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    {ROLE_LABELS[user.role]}
                  </span>
                  <p className="text-[11px] text-slate-600 mt-1">{user.designation} · {user.department}</p>
                  {user.state && <p className="text-[11px] text-slate-500">{user.state}{user.district ? `, ${user.district}` : ''}</p>}
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { setShowProfile(false); logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

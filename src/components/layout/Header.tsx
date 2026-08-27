import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { ROLE_LABELS } from '@/utils/statusStyles';
import { DEMO_USERS } from '@/data/mockData';
import { ChevronDown, Landmark, Wifi, WifiOff, Bell, HelpCircle, Globe, LogOut, User as UserIcon, ChevronRight } from 'lucide-react';

export default function Header({ online, onToggleSidebar }: { online: boolean; onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  if (!user) return null;

  const notifCount = 5;

  return (
    <header className="bg-white border-b border-slate-300 sticky top-0 z-40 shadow-sm">
      {/* Top bar */}
      <div className="bg-[#1e3a5f] text-white text-xs">
        <div className="px-4 flex items-center justify-between h-7">
          <div className="flex items-center gap-3">
            <span className="font-medium tracking-wide">Government of India</span>
            <span className="opacity-50">|</span>
            <span className="opacity-90">Ministry of Road Transport & Highways</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 cursor-pointer hover:underline">
              <Globe className="w-3 h-3" /> English
            </span>
            <span className="flex items-center gap-1 cursor-pointer hover:underline">
              <HelpCircle className="w-3 h-3" /> Help
            </span>
            <span className="flex items-center gap-1 cursor-pointer hover:underline">
              Accessibility
            </span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            <ChevronRight className="w-5 h-5 rotate-90" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#1e3a5f] rounded flex items-center justify-center shrink-0">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#1e3a5f] leading-tight">
                National Land Acquisition & Management System
              </h1>
              <p className="text-xs text-slate-500 leading-tight">
                Public Works Department (PWD) · Real-Time Digital Monitoring & Decision Support
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300">
            PROTOTYPE / DEMONSTRATION SYSTEM
          </span>

          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notifCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium">
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

          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1 pr-2 rounded hover:bg-slate-100"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-700 leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{ROLE_LABELS[user.role]}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <p className="text-xs text-slate-500 mt-1">{ROLE_LABELS[user.role]}</p>
                  <p className="text-xs text-slate-500">{user.designation}</p>
                  {user.state && <p className="text-xs text-slate-500">{user.state}{user.district ? `, ${user.district}` : ''}</p>}
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { setShowProfile(false); logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNotifs && (
        <div className="absolute right-4 top-16 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {DEMO_USERS.slice(0, 0).length === 0 && (
              <>
                <div className="p-3 border-b border-slate-50 hover:bg-slate-50">
                  <p className="text-xs font-medium text-slate-700">Compensation delay alert</p>
                  <p className="text-xs text-slate-500 mt-0.5">PWD-TN-2026-001 exceeds 30-day threshold.</p>
                  <p className="text-[10px] text-slate-400 mt-1">2 hours ago</p>
                </div>
                <div className="p-3 border-b border-slate-50 hover:bg-slate-50">
                  <p className="text-xs font-medium text-slate-700">Workflow task assigned</p>
                  <p className="text-xs text-slate-500 mt-0.5">Review proposal for PWD-KA-2026-003.</p>
                  <p className="text-[10px] text-slate-400 mt-1">5 hours ago</p>
                </div>
                <div className="p-3 border-b border-slate-50 hover:bg-slate-50">
                  <p className="text-xs font-medium text-slate-700">Synchronization completed</p>
                  <p className="text-xs text-slate-500 mt-0.5">3 offline records synced successfully.</p>
                  <p className="text-[10px] text-slate-400 mt-1">1 day ago</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

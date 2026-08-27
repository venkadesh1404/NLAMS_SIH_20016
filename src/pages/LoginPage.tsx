import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { DEMO_USERS } from '@/data/mockData';
import { ROLE_LABELS } from '@/utils/statusStyles';
import { Landmark, Shield, Eye, EyeOff, AlertCircle, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaCode] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (captchaInput.toUpperCase() !== captchaCode) {
      setError('Captcha verification failed. Please try again.');
      return;
    }
    const ok = login(email, password);
    if (ok) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Please check your User ID and password.');
    }
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('demo@123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top banner */}
      <div className="bg-[#1e3a5f] text-white">
        <div className="max-w-6xl mx-auto px-4 py-2 text-xs flex items-center justify-between">
          <span className="font-medium">Government of India</span>
          <div className="flex items-center gap-4">
            <span className="opacity-80">Skip to Main Content</span>
            <span className="opacity-80">Screen Reader Access</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-14 h-14 bg-[#1e3a5f] rounded flex items-center justify-center">
            <Landmark className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1e3a5f]">National Land Acquisition & Management System</h1>
            <p className="text-xs text-slate-500">Public Works Department (PWD) · Real-Time Digital Monitoring, Workflow Management and Decision Support for Land Acquisition</p>
          </div>
        </div>
      </div>

      {/* Login area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6">
          {/* Login form */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-800">Officer Sign In</h2>
              <p className="text-xs text-slate-500 mt-1">Authorized personnel only. All access is logged.</p>
            </div>

            <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-300 rounded text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>PROTOTYPE / DEMONSTRATION SYSTEM</strong> — This is an SIH prototype. Not an official Government of India production website.
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Official User ID / Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="officer@nlams.gov.in"
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full text-sm border border-slate-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Captcha Verification</label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 bg-slate-100 border border-slate-300 rounded font-mono text-sm tracking-widest text-slate-700 select-none" style={{ textDecoration: 'line-through' }}>
                    {captchaCode}
                  </div>
                  <input
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    required
                    placeholder="Enter captcha"
                    className="flex-1 text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded" />
                  Remember me on this device
                </label>
                <button type="button" className="text-xs text-blue-600 hover:underline">Forgot Password?</button>
              </div>

              {error && (
                <div className="px-3 py-2 bg-red-50 border border-red-300 rounded text-xs text-red-700">{error}</div>
              )}

              <button
                type="submit"
                className="w-full bg-[#1e3a5f] text-white text-sm font-medium py-2.5 rounded hover:bg-[#2a4a6f] transition-colors flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" /> Secure Sign In
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <p className="font-medium text-slate-600 mb-1">Security Notice:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                <li>Passwords are hashed using bcrypt — never stored in plaintext.</li>
                <li>JWT tokens used for session management.</li>
                <li>All actions are recorded in the audit log.</li>
              </ul>
            </div>
          </div>

          {/* Demo accounts */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-1">Demo Officer Accounts</h2>
            <p className="text-xs text-slate-500 mb-4">Click an account to auto-fill credentials. Password for all: <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">demo@123</code></p>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => quickLogin(u.email)}
                  className={`w-full text-left p-3 border rounded-lg transition-colors hover:border-blue-400 hover:bg-blue-50/50 ${
                    email === u.email ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: u.avatarColor }}>
                      {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-500">{ROLE_LABELS[u.role]}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#1e3a5f] text-white text-xs py-3 px-4">
        <div className="max-w-6xl mx-auto text-center opacity-80">
          NLAMS v1.0.0 (Prototype) · SIH 2026 · Public Works Department · This is a demonstration system, not for official use.
        </div>
      </div>
    </div>
  );
}

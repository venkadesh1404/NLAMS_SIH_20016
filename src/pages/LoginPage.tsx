import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { DEMO_USERS } from '@/data/mockData';
import { ROLE_LABELS } from '@/utils/statusStyles';
import { Landmark, Shield, Eye, EyeOff, AlertCircle, ChevronRight, RefreshCw, KeyRound, CheckCircle2, X } from 'lucide-react';

function generateRandomCaptcha(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaCode, setCaptchaCode] = useState(() => generateRandomCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);
  const [isRefreshingCaptcha, setIsRefreshingCaptcha] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'input' | 'sent'>('input');

  const refreshCaptcha = useCallback(() => {
    setIsRefreshingCaptcha(true);
    const newCode = generateRandomCaptcha();
    setCaptchaCode(newCode);
    setCaptchaInput('');
    setError('');
    setTimeout(() => setIsRefreshingCaptcha(false), 200);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setError('Captcha verification failed. Please enter the new captcha shown.');
      refreshCaptcha();
      return;
    }

    const ok = login(email, password);
    if (ok) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Please check your official User ID and password.');
      refreshCaptcha();
    }
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('demo@123');
    setError('');
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotStep('sent');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top banner */}
      <div className="bg-[#1e3a5f] text-white">
        <div className="max-w-6xl mx-auto px-4 py-2 text-xs flex items-center justify-between">
          <span className="font-medium tracking-wide">Government of India</span>
          <div className="flex items-center gap-4">
            <span className="opacity-80">Skip to Main Content</span>
            <span className="opacity-80">Screen Reader Access</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-14 h-14 bg-[#1e3a5f] rounded flex items-center justify-center shrink-0">
            <Landmark className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-[#1e3a5f]">
              National Land Acquisition & Management System (NLAMS)
            </h1>
            <p className="text-xs text-slate-500">
              Public Works Department (PWD) · Real-Time Digital Monitoring, Workflow Management and Decision Support
            </p>
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
              <p className="text-xs text-slate-500 mt-1">Authorized government personnel only. All access is audited and logged.</p>
            </div>

            <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-300 rounded text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>PROTOTYPE / DEMONSTRATION SYSTEM</strong> — All role credentials use password <code className="font-mono font-bold">demo@123</code>.
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-600">Captcha Verification</label>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="text-[11px] text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 font-medium"
                    title="Generate new CAPTCHA"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingCaptcha ? 'animate-spin' : ''}`} />
                    Refresh Code
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="px-3 py-2 bg-slate-100 border border-slate-300 rounded font-mono text-sm tracking-widest text-slate-800 font-bold select-none text-center min-w-[100px]"
                    style={{
                      letterSpacing: '0.25em',
                      textDecoration: 'line-through',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    }}
                  >
                    {captchaCode}
                  </div>
                  <input
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="Enter 6-char captcha"
                    className="flex-1 text-sm border border-slate-300 rounded px-3 py-2 uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded text-blue-600" />
                  Remember me on this device
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotStep('input');
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              {error && (
                <div className="px-3 py-2 bg-red-50 border border-red-300 rounded text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#1e3a5f] text-white text-sm font-medium py-2.5 rounded hover:bg-[#2a4a6f] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Shield className="w-4 h-4" /> Secure Sign In
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <p className="font-medium text-slate-600 mb-1">Security Standards:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                <li>Bcrypt password hashing & JWT bearer token session tokens.</li>
                <li>Role-Based Access Control (RBAC) enforced on all endpoints.</li>
                <li>Comprehensive audit trail recorded on all database mutations.</li>
              </ul>
            </div>
          </div>

          {/* Demo accounts */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-1">Demo Officer Accounts</h2>
            <p className="text-xs text-slate-500 mb-3">
              Select any authorized officer role below to test role-based workflow and decision support:
            </p>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => quickLogin(u.email)}
                  className={`w-full text-left p-2.5 border rounded-lg transition-colors hover:border-blue-400 hover:bg-blue-50/50 ${
                    email === u.email ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: u.avatarColor }}
                    >
                      {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-800">{u.name}</p>
                        <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {ROLE_LABELS[u.role]}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{u.designation} · {u.department}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForgotModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <KeyRound className="w-5 h-5 text-[#1e3a5f]" />
                <h3>Official Password Recovery</h3>
              </div>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotStep === 'input' ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Enter your registered official email address. A one-time verification link and temporary password will be sent to your government inbox.
                </p>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Official Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="officer@nlams.gov.in"
                    className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="text-xs px-3 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-4 py-2 bg-[#1e3a5f] text-white font-medium rounded hover:bg-[#2a4a6f]"
                  >
                    Send Recovery Link
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">Recovery Instructions Dispatched</h4>
                <p className="text-xs text-slate-600">
                  Password reset link sent to <strong>{forgotEmail}</strong>. In demonstration mode, all demo accounts can sign in directly using password <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">demo@123</code>.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full mt-2 text-xs py-2 bg-[#1e3a5f] text-white font-medium rounded hover:bg-[#2a4a6f]"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-[#1e3a5f] text-white text-xs py-3 px-4">
        <div className="max-w-6xl mx-auto text-center opacity-80">
          NLAMS v1.0.0 (Prototype) · SIH 2026 · Ministry of Road Transport & Highways · Public Works Department
        </div>
      </div>
    </div>
  );
}

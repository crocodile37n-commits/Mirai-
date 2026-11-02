import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Lock, Mail, ArrowRight, RefreshCw, KeyRound } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { BrandLogo } from '../common/BrandLogo';

interface AdminAuthGuardProps {
  onAuthenticated: (adminEmail: string) => void;
  onExit: () => void;
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ onAuthenticated, onExit }) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{
    initialized: boolean;
    authenticated: boolean;
    adminEmail?: string;
  } | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await adminApi.getStatus();
      setStatus(res);
      if (res.authenticated && res.adminEmail) {
        onAuthenticated(res.adminEmail);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to authentication backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid administrator Gmail/email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Master password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminApi.setup(email, password);
      onAuthenticated(res.admin?.email || email);
    } catch (err: any) {
      setErrorMsg(err.message || 'Setup failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminApi.login(email, password);
      onAuthenticated(res.admin?.email || email);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#060607] flex flex-col items-center justify-center p-4">
        <div className="w-9 h-9 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin mb-3" />
        <p className="text-xs font-semibold text-white/50 tracking-wider uppercase font-mono">
          Verifying Admin Authorization...
        </p>
      </div>
    );
  }

  // CASE 1: INITIAL SETUP (No admin configured yet)
  if (status && !status.initialized) {
    return (
      <div className="min-h-screen bg-[#060607] flex flex-col justify-center items-center px-4 py-12 relative select-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[540px] h-[340px] bg-gradient-to-r from-[#8b5cf6]/20 via-[#ec4899]/15 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="w-full max-w-[460px] rounded-3xl bg-[#0c0c0e]/95 border border-white/10 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 mb-3 text-[#c084fc]">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="font-heading text-2xl font-black text-white tracking-tight">
              Initialize Administrator
            </h1>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              Configure your primary administrator account. Master passwords are encrypted on the backend with scrypt and unique salts.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Administrator Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="w-full h-[42px] pl-10 pr-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-[#8b5cf6] focus:outline-none text-sm text-white placeholder-white/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Master Password (min 8 chars)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-[42px] pl-10 pr-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-[#8b5cf6] focus:outline-none text-sm text-white placeholder-white/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Confirm Master Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-[42px] pl-10 pr-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-[#8b5cf6] focus:outline-none text-sm text-white placeholder-white/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[44px] mt-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] hover:from-[#7c3aed] hover:to-[#c026d3] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(139,92,246,0.35)] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Admin &amp; Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onExit}
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              ← Return to Public Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CASE 2: LOGIN (Admin is configured, authenticating)
  return (
    <div className="min-h-screen bg-[#060607] flex flex-col justify-center items-center px-4 py-12 relative select-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[540px] h-[340px] bg-gradient-to-r from-[#8b5cf6]/20 via-[#ec4899]/15 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-[440px] rounded-3xl bg-[#0c0c0e]/95 border border-white/10 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandLogo size="lg" onClick={onExit} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#c084fc] text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Control Center</span>
          </div>
          <h1 className="font-heading text-2xl font-black text-white tracking-tight">
            Administrator Access
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Restricted area. Only authorized administrators may log in.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className="w-full h-[42px] pl-10 pr-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-[#8b5cf6] focus:outline-none text-sm text-white placeholder-white/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-[42px] pl-10 pr-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-[#8b5cf6] focus:outline-none text-sm text-white placeholder-white/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[44px] mt-2 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(255,255,255,0.2)] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
            ) : (
              <>
                <span>Sign In as Administrator</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onExit}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            ← Return to MIRAI Public Website
          </button>
        </div>
      </div>
    </div>
  );
};

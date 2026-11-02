import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck, KeyRound, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';

export const SignInPage: React.FC = () => {
  const { login, navigateToSignUp, navigateToHome, navigateToAdmin, showToast } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or username.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(identifier.trim(), password, rememberMe);
      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Invalid credentials. Please verify your details.');
        return;
      }

      // Redirect authorized administrator directly to /admin, normal users to homepage
      if (result.isAdmin) {
        showToast('Admin Access Granted', 'Redirecting to MIRAI Control Center...', 'success');
        navigateToAdmin();
      } else {
        navigateToHome();
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');

    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotErrorMsg('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      setForgotLoading(false);

      if (res.ok) {
        setForgotSuccessMsg(data.message || 'If an account exists, a reset link has been dispatched.');
      } else {
        setForgotErrorMsg(data.error || 'Failed to request password reset.');
      }
    } catch {
      setForgotLoading(false);
      setForgotErrorMsg('Connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] pt-24 pb-16 flex flex-col justify-center items-center px-4 relative select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-r from-[#8b5cf6]/15 via-[#ec4899]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Back to Home Link */}
      <div className="w-full max-w-[440px] mb-4">
        <button
          type="button"
          onClick={navigateToHome}
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[440px] rounded-[24px] bg-[#0c0c0e]/90 border border-white/[0.08] p-7 sm:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl relative z-10">
        {/* Header / Brand */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandLogo size="lg" onClick={navigateToHome} />
          </div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-white">
            Sign In to MIRAI
          </h1>
          <p className="text-xs text-white/60 mt-1 max-w-[320px] mx-auto">
            Access your synchronized watch history, manga bookmarks, and personal preferences.
          </p>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex flex-col gap-1.5 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            {errorMessage.includes('No account found') && (
              <div className="pl-6 pt-0.5">
                <button
                  type="button"
                  onClick={navigateToSignUp}
                  className="text-white underline hover:text-[#c084fc] font-semibold transition-colors cursor-pointer"
                >
                  Create an account with this email/username →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email or Username Field */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5" htmlFor="signin-identifier">
              Email or Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="signin-identifier"
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@domain.com or username"
                className="w-full h-[44px] pl-10 pr-3.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] focus:outline-none text-sm text-white placeholder-white/30 transition-all"
              />
            </div>
          </div>

          {/* Password Field with Show/Hide toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-white/80" htmlFor="signin-password">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(identifier.includes('@') ? identifier : '');
                  setForgotSuccessMsg('');
                  setForgotErrorMsg('');
                  setForgotPasswordOpen(true);
                }}
                className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-[44px] pl-10 pr-10 rounded-xl bg-white/[0.04] border border-white/10 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] focus:outline-none text-sm text-white placeholder-white/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-white/10 border-white/20 text-[#8b5cf6] focus:ring-[#8b5cf6] focus:ring-offset-0 focus:ring-1"
              />
              <span>Remember me for 30 days</span>
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[46px] mt-2 rounded-xl bg-white text-black font-heading font-bold text-sm hover:bg-white/90 shadow-[0_2px_16px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Link to Create Account */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-white/60">
          Don't have a MIRAI account yet?{' '}
          <button
            type="button"
            onClick={navigateToSignUp}
            className="font-bold text-white hover:text-[#a78bfa] hover:underline ml-1 transition-colors"
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setForgotPasswordOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] rounded-2xl bg-[#0e0e12] border border-white/15 p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setForgotPasswordOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#c084fc]">
                <KeyRound className="w-4 h-4" />
              </div>
              <h3 className="font-heading text-lg font-bold text-white">Reset Password</h3>
            </div>

            <p className="text-xs text-white/60 mb-4">
              Enter your account email. We will generate a secure reset link.
            </p>

            {forgotErrorMsg && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{forgotErrorMsg}</span>
              </div>
            )}

            {forgotSuccessMsg && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{forgotSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-white/70 mb-1">
                  Account Email
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full h-[40px] px-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(false)}
                  className="flex-1 h-[38px] rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 h-[38px] rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Send Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

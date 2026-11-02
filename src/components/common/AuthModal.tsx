import React, { useState } from 'react';
import { X, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, openAuthModal, closeAuthModal, login, registerUser, navigateToAdmin, navigateToHome } = useApp();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!authModalOpen) return null;

  const isCreate = authModalMode === 'create-account';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isCreate) {
      if (!username.trim() || username.trim().length < 3) {
        setErrorMessage('Username must be at least 3 characters.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      setIsLoading(true);
      const res = await registerUser({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create account.');
        return;
      }

      closeAuthModal();
      if (res.isAdmin) {
        navigateToAdmin();
      } else {
        navigateToHome();
      }
    } else {
      if (!email.trim()) {
        setErrorMessage('Please enter your email or username.');
        return;
      }
      if (!password) {
        setErrorMessage('Please enter your password.');
        return;
      }

      setIsLoading(true);
      const res = await login(email.trim(), password);
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials.');
        return;
      }

      closeAuthModal();
      if (res.isAdmin) {
        navigateToAdmin();
      } else {
        navigateToHome();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={closeAuthModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] rounded-[24px] bg-[#0e0e12]/95 border border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl p-6 sm:p-7 text-white select-none animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
          aria-label="Close authentication modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#f472b6]/20 to-[#8b5cf6]/20 border border-white/10 mb-2">
            <Sparkles className="w-5 h-5 text-[#f472b6]" />
          </div>
          <h2 id="auth-modal-title" className="text-xl font-black tracking-tight">
            {isCreate ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-white/60 mt-1 max-w-[300px] mx-auto">
            {isCreate
              ? 'Join MIRAI to track watch progress, sync reading lists, and unlock custom features.'
              : 'Sign in to access your personal watchlist, manga bookmarks, and history.'}
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isCreate && (
            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username handle"
                className="w-full h-[40px] px-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#8b5cf6] focus:outline-none text-xs text-white placeholder-white/30 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-white/70 mb-1">
              {isCreate ? 'Email Address' : 'Email or Username'}
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isCreate ? 'you@domain.com' : 'Enter email or handle'}
              className="w-full h-[40px] px-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#8b5cf6] focus:outline-none text-xs text-white placeholder-white/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-white/70 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-[40px] px-3.5 pr-10 rounded-xl bg-white/5 border border-white/10 focus:border-[#8b5cf6] focus:outline-none text-xs text-white placeholder-white/30 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isCreate && (
            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-[40px] px-3.5 pr-10 rounded-xl bg-white/5 border border-white/10 focus:border-[#8b5cf6] focus:outline-none text-xs text-white placeholder-white/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[44px] !mt-4 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 shadow-[0_2px_14px_rgba(255,255,255,0.25)] transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : isCreate ? 'Create Free Account' : 'Sign In to MIRAI'}
          </button>
        </form>

        {/* Mode Toggle Footer */}
        <div className="mt-5 text-center text-xs text-white/50">
          {isCreate ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  openAuthModal('sign-in');
                }}
                className="text-white font-bold hover:underline"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  openAuthModal('create-account');
                }}
                className="text-white font-bold hover:underline"
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';

export const CreateAccountPage: React.FC = () => {
  const { registerUser, navigateToSignIn, navigateToHome, navigateToAdmin } = useApp();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Username validation
    const cleanUsername = username.trim();
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setErrorMessage('Username may only contain letters, numbers, and underscores.');
      return;
    }

    // Email validation
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Password validation
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    // Password confirmation match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser({
        fullName: fullName.trim() || undefined,
        username: cleanUsername,
        email: cleanEmail,
        password,
      });

      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to create account. Please try again.');
        return;
      }

      // Check if newly created account is the authorized owner
      if (result.isAdmin) {
        navigateToAdmin();
      } else {
        navigateToHome();
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] pt-24 pb-16 flex flex-col justify-center items-center px-4 relative select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[320px] bg-gradient-to-r from-[#8b5cf6]/15 via-[#ec4899]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Back to Home Link */}
      <div className="w-full max-w-[460px] mb-4">
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
      <div className="w-full max-w-[460px] rounded-[24px] bg-[#0c0c0e]/90 border border-white/[0.08] p-7 sm:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl relative z-10">
        {/* Header / Brand */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandLogo size="lg" onClick={navigateToHome} />
          </div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-white">
            Create MIRAI Account
          </h1>
          <p className="text-xs text-white/60 mt-1 max-w-[340px] mx-auto">
            Join the community to track anime releases, save watch history, and sync your favorite series.
          </p>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name Field */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5" htmlFor="signup-name">
              Full Name <span className="text-white/40 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <User className="w-4 h-4" />
              </div>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ren Amamiya"
                className="w-full h-[42px] pl-10 pr-3.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] focus:outline-none text-sm text-white placeholder-white/30 transition-all"
              />
            </div>
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5" htmlFor="signup-username">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <span className="text-xs font-mono font-bold">@</span>
              </div>
              <input
                id="signup-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. joker_phantom"
                className="w-full h-[42px] pl-10 pr-3.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] focus:outline-none text-sm text-white placeholder-white/30 transition-all"
              />
            </div>
          </div>

          {/* Email Address Field */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5" htmlFor="signup-email">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full h-[42px] pl-10 pr-3.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] focus:outline-none text-sm text-white placeholder-white/30 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5" htmlFor="signup-password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-[42px] pl-10 pr-10 rounded-xl bg-white/[0.04] border border-white/10 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] focus:outline-none text-sm text-white placeholder-white/30 transition-all"
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

          {/* Confirm Password Field */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5" htmlFor="signup-confirm-password">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-[42px] pl-10 pr-10 rounded-xl bg-white/[0.04] border border-white/10 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] focus:outline-none text-sm text-white placeholder-white/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[46px] !mt-5 rounded-xl bg-white text-black font-heading font-bold text-sm hover:bg-white/90 shadow-[0_2px_16px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Link to Sign In */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-white/60">
          Already have an account?{' '}
          <button
            type="button"
            onClick={navigateToSignIn}
            className="font-bold text-white hover:text-[#a78bfa] hover:underline ml-1 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

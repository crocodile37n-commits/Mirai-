import React, { useState, useRef } from 'react';
import {
  Trophy,
  PlayCircle,
  TrendingUp,
  Copy,
  Eye,
  EyeOff,
  Save,
  Check,
  Camera,
  Loader2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MiraiAvatar } from '../common/BrandLogo';

export const EditProfileView: React.FC = () => {
  const { userProfile, updateUserProfile, showToast, isAuthenticated, openAuthModal } = useApp();

  const profile = userProfile || {
    username: 'Guest',
    email: '',
    rankTitle: 'Newcomer',
    level: 1,
    totalEpisodesWatched: 0,
    episodesRemainingToNextLevel: 20,
    memberSince: 'October 2026',
    tempDiscordPassword: 'DISCORD-GUEST-2026',
    avatarUrl: '',
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [displayName, setDisplayName] = useState(profile.username);
  const [email, setEmail] = useState(profile.email);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File Too Large', 'Avatar image must be under 5MB.', 'error');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/user/avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar: base64Data }),
          });

          const data = await res.json();
          if (res.ok && data.avatarUrl) {
            updateUserProfile({ avatarUrl: data.avatarUrl });
            showToast('Avatar Updated', 'Profile photo updated successfully!', 'success');
          } else {
            updateUserProfile({ avatarUrl: base64Data });
            showToast('Avatar Updated', 'Profile photo updated locally.', 'success');
          }
        } catch {
          updateUserProfile({ avatarUrl: base64Data });
          showToast('Avatar Updated', 'Profile photo updated locally.', 'success');
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingAvatar(false);
      showToast('Upload Failed', 'Could not process the selected image.', 'error');
    }
  };

  const handleAvatarClick = () => {
    if (!isAuthenticated) {
      openAuthModal('sign-in');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleCopyTempPassword = () => {
    const pwd = profile.tempDiscordPassword;
    navigator.clipboard.writeText(pwd);
    setCopied(true);
    showToast('Copied to Clipboard', pwd, 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('create-account');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      showToast('Password Mismatch', 'New password and confirmation do not match.', 'warning');
      return;
    }

    updateUserProfile({
      username: displayName,
      email: email,
    });

    if (newPassword) {
      setNewPassword('');
      setConfirmPassword('');
    }

    showToast('Profile Saved', 'Your account information has been updated.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div>
        <h1 className="font-heading text-[26px] font-extrabold text-white">
          Edit Profile
        </h1>
        <p className="text-xs text-white/60 mt-0.5">
          Keep your account information up to date
        </p>
      </div>

      {!isAuthenticated && (
        <div className="p-4 rounded-[14px] bg-gradient-to-r from-[#8b5cf6]/20 to-[#f472b6]/20 border border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white">You are viewing in Guest Mode</h4>
            <p className="text-xs text-white/60">Create a free account to rank up, customize your avatar, and sync history.</p>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('create-account')}
            className="h-8 px-4 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 transition-all shadow"
          >
            Create Account
          </button>
        </div>
      )}

      {/* 8.2 Three Stat Cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Current Rank */}
        <div className="p-3.5 rounded-[12px] bg-[#0c0c0e] border border-white/[0.08] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#8b5cf6]/15 flex items-center justify-center text-[#a78bfa] flex-shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-white/40 block">
              Current rank
            </span>
            <span className="font-heading text-xs font-bold text-white">
              {profile.rankTitle} · Level {profile.level}
            </span>
          </div>
        </div>

        {/* Card 2: Watch Progress */}
        <div className="p-3.5 rounded-[12px] bg-[#0c0c0e] border border-white/[0.08] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#8b5cf6]/15 flex items-center justify-center text-[#a78bfa] flex-shrink-0">
            <PlayCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-white/40 block">
              Watch progress
            </span>
            <span className="font-heading text-xs font-bold text-white">
              {profile.totalEpisodesWatched} episodes watched
            </span>
          </div>
        </div>

        {/* Card 3: Next Level */}
        <div className="p-3.5 rounded-[12px] bg-[#0c0c0e] border border-white/[0.08] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#8b5cf6]/15 flex items-center justify-center text-[#a78bfa] flex-shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-white/40 block">
              Next level
            </span>
            <span className="font-heading text-xs font-bold text-white">
              {profile.episodesRemainingToNextLevel} episodes remaining
            </span>
          </div>
        </div>
      </div>

      {/* Avatar Row Card (~100px tall) */}
      <div className="p-4 rounded-[16px] bg-[#0c0c0e] border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <MiraiAvatar
              size={64}
              avatarUrl={profile.avatarUrl}
              className="border border-white/20 group-hover:border-[#8b5cf6] transition-colors"
            />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-white">
              {profile.username}
            </h4>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="text-xs text-[#a78bfa] hover:text-[#c084fc] mt-0.5 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading photo...</span>
                </>
              ) : (
                <span>✎ Change Avatar Picture</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-white/[0.08]" />

      {/* Main Profile Form */}
      <form onSubmit={handleSaveChanges} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* DISPLAY NAME */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 block mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-[40px] px-3.5 rounded-[10px] bg-[#0c0c0e] border border-white/[0.08] text-white text-xs placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* EMAIL ADDRESS with Verified Pill */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 block mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[40px] pl-3.5 pr-24 rounded-[10px] bg-[#0c0c0e] border border-white/[0.08] text-white text-xs placeholder-white/40 focus:outline-none focus:border-white/30"
              />
              {/* Green Verified Pill */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e] text-[10px] font-bold flex items-center gap-1">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
                <span>Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* MEMBER SINCE read-only field */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40 block mb-2">
            Member Since
          </label>
          <input
            type="text"
            readOnly
            value={profile.memberSince}
            className="w-full h-[40px] px-3.5 rounded-[10px] bg-[#08080a] border border-white/[0.04] text-white/50 text-xs cursor-default select-all"
          />
        </div>

        <div className="w-full h-[1px] bg-white/[0.08]" />

        {/* Change Password Section */}
        <div>
          <h3 className="font-heading text-[15px] font-bold text-white">
            Change Password
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Set a custom password below to replace your temporary Discord login password.
          </p>
        </div>

        {/* TEMPORARY PASSWORD (DISCORD SIGN-IN) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
              Temporary Password (Discord Sign-in)
            </label>
            <span className="px-2 py-0.5 rounded-full border border-white/20 text-[9px] font-bold text-white/60 uppercase">
              GENERATED
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              readOnly
              value={profile.tempDiscordPassword}
              className="w-full h-[40px] pl-3.5 pr-20 rounded-[10px] bg-[#0c0c0e] border border-white/[0.08] text-white font-mono text-xs cursor-text"
            />
            <button
              type="button"
              onClick={handleCopyTempPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-[26px] px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white flex items-center gap-1 transition-all"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
            Use this password with your email to sign in directly. Once you save a new password below,
            this temporary password will be permanently removed.
          </p>
        </div>

        {/* NEW PASSWORD / CONFIRM PASSWORD side by side with eye icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 block mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-[40px] pl-3.5 pr-10 rounded-[10px] bg-[#0c0c0e] border border-white/[0.08] text-white text-xs placeholder-white/30 focus:outline-none focus:border-white/30"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 block mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-[40px] pl-3.5 pr-10 rounded-[10px] bg-[#0c0c0e] border border-white/[0.08] text-white text-xs placeholder-white/30 focus:outline-none focus:border-white/30"
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
        </div>

        {/* Save Changes: White Pill, right-aligned */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="h-[40px] px-6 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};

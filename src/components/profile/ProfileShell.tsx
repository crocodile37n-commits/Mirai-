import React, { useRef, useState } from 'react';
import {
  User,
  Clock,
  Heart,
  Bell,
  Link as LinkIcon,
  Settings,
  Camera,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MiraiAvatar } from '../common/BrandLogo';

interface ProfileShellProps {
  children: React.ReactNode;
}

export const ProfileShell: React.FC<ProfileShellProps> = ({ children }) => {
  const {
    nav,
    navigateToProfile,
    userProfile,
    isAuthenticated,
    openAuthModal,
    favorites,
    continueWatching,
    comments,
    logout,
    updateUserProfile,
    showToast,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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

    setIsUploading(true);
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
            showToast('Avatar Updated', 'Profile photo uploaded successfully!', 'success');
          } else {
            // Local fallback if offline
            updateUserProfile({ avatarUrl: base64Data });
            showToast('Avatar Updated', 'Profile photo updated locally.', 'success');
          }
        } catch {
          updateUserProfile({ avatarUrl: base64Data });
          showToast('Avatar Updated', 'Profile photo updated locally.', 'success');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
      showToast('Upload Failed', 'Could not process the selected image.', 'error');
    }
  };

  const handleCameraClick = () => {
    if (!isAuthenticated) {
      openAuthModal('sign-in');
      return;
    }
    fileInputRef.current?.click();
  };

  const menuItems = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'continue' as const, label: 'Continue Watching', icon: Clock },
    { id: 'favorites' as const, label: 'Favorites', icon: Heart },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'connections' as const, label: 'Connections', icon: LinkIcon },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  const totalFavorites = favorites.length;
  const totalComments = Object.values(comments).reduce((acc, c) => acc + c.length, 0);

  return (
    <div className="relative min-w-0 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 select-none">
      {/* 8. Ambient Purple Glow Banner */}
      <div className="absolute top-0 left-0 right-0 h-[360px] ambient-glow pointer-events-none" />

      {/* Main Container Layout */}
      <div className="relative max-w-[1220px] mx-auto flex flex-col lg:flex-row gap-8 items-start">
        {/* 8.1 SIDEBAR PROFILE CARD (~250px wide, ~585px tall) */}
        <aside className="w-full lg:w-[250px] flex-shrink-0 rounded-[24px] bg-[#0c0c0e] border border-white/[0.08] p-5 shadow-xl flex flex-col items-center">
          {/* Avatar with Camera badge */}
          <div className="relative mt-2">
            <MiraiAvatar
              size={100}
              avatarUrl={userProfile?.avatarUrl}
              className="border-2 border-white/20"
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />
            <button
              type="button"
              onClick={handleCameraClick}
              disabled={isUploading}
              className="absolute bottom-0 right-0 w-[26px] h-[26px] rounded-full bg-white text-black flex items-center justify-center shadow hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              title="Upload new profile picture"
              aria-label="Upload new profile picture"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* Username + Lv chip */}
          <div className="mt-4 flex items-center gap-2">
            <h3 className="font-heading text-lg font-bold text-white">
              {userProfile?.username || 'Guest Viewer'}
            </h3>
            <span className="px-2 py-0.5 rounded-full border border-white/20 text-[10px] font-bold text-white/90">
              Lv.{userProfile?.level || 1}
            </span>
          </div>

          {/* Member since 2026 */}
          <p className="text-xs text-white/60 mt-1">
            {userProfile?.memberSince ? `Member since ${userProfile.memberSince}` : 'Guest Session'}
          </p>

          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => openAuthModal('create-account')}
              className="w-full mt-3 h-[32px] rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 transition-all shadow active:scale-95"
            >
              Sign In / Sign Up
            </button>
          )}

          {/* Progress bar to next level */}
          <div className="w-full mt-4">
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="w-[30%] h-full bg-[#8b5cf6]" />
            </div>
            <p className="text-[10px] text-white/40 text-center mt-1.5 font-medium">
              {userProfile?.rankTitle || 'Newcomer'} · 30% to next tier
            </p>
          </div>

          {/* Stats Panel: 3 equal cells separated by hairlines */}
          <div className="w-full mt-5 rounded-[14px] bg-[#121215] border border-white/[0.06] grid grid-cols-3 divide-x divide-white/[0.08] text-center py-2.5">
            <div>
              <span className="block font-heading text-base font-bold text-white">
                {userProfile?.totalEpisodesWatched || continueWatching.length}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
                EPISODES
              </span>
            </div>
            <div>
              <span className="block font-heading text-base font-bold text-white">
                {totalFavorites}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
                FAVORITES
              </span>
            </div>
            <div>
              <span className="block font-heading text-base font-bold text-white">
                {totalComments}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
                COMMENTS
              </span>
            </div>
          </div>

          {/* Vertical Menu (6 items) */}
          <nav className="w-full mt-6 space-y-1" aria-label="Profile navigation">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = nav.profileTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => navigateToProfile(item.id)}
                  className={`relative w-full h-[38px] px-3.5 rounded-[10px] flex items-center gap-3 text-[13px] font-semibold transition-all ${
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 text-white/60" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {/* 2px white vertical indicator at right edge */}
                  {isActive && (
                    <span className="absolute right-0 top-2 bottom-2 w-[2px] bg-white rounded-l" />
                  )}
                </button>
              );
            })}
          </nav>

          {isAuthenticated && (
            <div className="w-full pt-3 mt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={logout}
                className="w-full h-[38px] px-3.5 rounded-[10px] flex items-center gap-3 text-[13px] font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="flex-1 text-left">Sign Out</span>
              </button>
            </div>
          )}
        </aside>

        {/* MAIN CONTENT AREA (~920px) */}
        <main className="flex-1 min-w-0 w-full">{children}</main>
      </div>
    </div>
  );
};

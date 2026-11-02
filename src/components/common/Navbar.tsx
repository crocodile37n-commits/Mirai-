import React, { useState, useEffect, useRef } from 'react';
import { Home, BookOpen, Compass, Calendar, Heart, Search, Bell, Eye, EyeOff, UserPlus, LogIn, LogOut, User as UserIcon, Settings as SettingsIcon } from 'lucide-react';
import { BrandLogo, MiraiAvatar } from './BrandLogo';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    nav,
    navigateToHome,
    navigateToBrowse,
    navigateToManga,
    navigateToSchedule,
    navigateToFavorites,
    navigateToProfile,
    navigateToSignIn,
    navigateToSignUp,
    logout,
    userProfile,
    isAuthenticated,
    openAuthModal,
    setSearchOpen,
    showToast,
  } = useApp();

  const [isScrolled, setIsScrolled] = useState(false);
  const [hideSpoilers, setHideSpoilers] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, action: navigateToHome },
    { id: 'manga', label: 'Manga', icon: BookOpen, action: navigateToManga },
    {
      id: 'browse',
      label: 'Browse',
      icon: Compass,
      action: () => navigateToBrowse({ type: 'ANIME' }),
    },
    { id: 'schedule', label: 'Schedule', icon: Calendar, action: navigateToSchedule },
    { id: 'favorites', label: 'Favorites', icon: Heart, action: navigateToFavorites },
  ];

  return (
    <>
      {/* Floating Desktop & Tablet Header Row */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 h-[64px] transition-all duration-300 flex items-center ${
          isScrolled
            ? 'bg-[#000000]/60 backdrop-blur-md border-b border-white/[0.08]'
            : 'bg-transparent'
        }`}
      >
        <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <div className="flex-shrink-0">
            <BrandLogo onClick={navigateToHome} />
          </div>

          {/* Centre-Left Nav Pill Group (Matches Screenshot 8dbaff1d exactly) */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center p-1 rounded-full glass bg-[#08080a]/80 border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                (item.id === 'home' && nav.currentRoute === 'home') ||
                (item.id === 'manga' && (nav.currentRoute === 'manga' || nav.currentRoute === 'manga-detail' || nav.currentRoute === 'reader')) ||
                (item.id === 'browse' && nav.currentRoute === 'browse') ||
                (item.id === 'schedule' && nav.currentRoute === 'schedule') ||
                (item.id === 'favorites' && nav.currentRoute === 'favorites');

              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`h-[30px] px-3.5 rounded-full flex items-center gap-1.5 text-[13px] font-semibold transition-all duration-200 select-none ${
                    isActive
                      ? 'bg-white/[0.12] text-white border border-white/20 shadow-sm font-bold'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 opacity-80" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Search Pill (Separate Dark Glass Pill ~324px x 32px) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 sm:w-[260px] md:w-[324px] h-[34px] rounded-full glass bg-[#08080a]/80 border border-white/[0.08] px-3.5 flex items-center justify-between text-left text-white/50 hover:text-white hover:border-white/20 transition-all group shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
              aria-label="Search anime and manga"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 transition-colors flex-shrink-0" />
                <span className="hidden sm:inline text-[13px] text-white/40 truncate">
                  Search anime & manga...
                </span>
              </div>
              {/* Keyboard shortcut '/' badge */}
              <kbd className="hidden sm:inline-flex items-center justify-center h-4 w-4 rounded-[4px] bg-white/10 border border-white/15 text-[10px] font-mono italic text-white/60">
                /
              </kbd>
            </button>

            {/* Utility Icons: Eye, Bell, Avatar */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Eye Button */}
              <button
                type="button"
                onClick={() => {
                  const next = !hideSpoilers;
                  setHideSpoilers(next);
                  showToast('Spoiler Protection', next ? 'Thumbnail spoiler blur activated' : 'Spoiler protection disabled', 'info');
                }}
                title={hideSpoilers ? 'Spoilers hidden' : 'Hide spoilers'}
                aria-label="Toggle spoiler protection"
                className="w-[36px] h-[36px] rounded-full glass bg-[#08080a]/80 border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-white hover:border-white/20 transition-all active:scale-95 shadow-sm"
              >
                {hideSpoilers ? <EyeOff className="w-4 h-4 text-[#8b5cf6]" /> : <Eye className="w-4 h-4" />}
              </button>

              {/* Bell Button */}
              <button
                type="button"
                onClick={() => navigateToProfile('notifications')}
                title="Notifications"
                aria-label="Notifications"
                className="relative w-[36px] h-[36px] rounded-full glass bg-[#08080a]/80 border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-white hover:border-white/20 transition-all active:scale-95 shadow-sm"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f472b6] animate-pulse" />
              </button>

              {/* Auth Buttons or User Avatar with Sign Out Menu */}
              {!isAuthenticated ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={navigateToSignIn}
                    aria-label="Sign In"
                    className="h-[32px] px-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 font-medium text-xs transition-colors flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={navigateToSignUp}
                    aria-label="Create Account"
                    className="h-[32px] px-3 sm:px-3.5 rounded-full bg-white text-black hover:bg-white/90 font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_2px_12px_rgba(255,255,255,0.2)] transition-all active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Account</span>
                  </button>
                </div>
              ) : (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-label="User Account Menu"
                    className="relative rounded-full focus-visible:ring-2 focus-visible:ring-white transition-transform active:scale-95"
                  >
                    <MiraiAvatar size={36} />
                  </button>

                  {/* Account Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0e0e12]/95 border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3.5 py-2 border-b border-white/[0.08]">
                        <p className="text-xs font-bold text-white truncate">
                          {userProfile?.fullName || userProfile?.username || 'Mirai Member'}
                        </p>
                        <p className="text-[10px] text-white/40 truncate">
                          {userProfile?.email || 'user@mirai.app'}
                        </p>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigateToProfile('profile');
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-white/50" />
                          <span>My Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigateToProfile('settings');
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                        >
                          <SettingsIcon className="w-3.5 h-3.5 text-white/50" />
                          <span>Settings</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5 text-red-400" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[58px] bg-[#0c0c0e]/95 backdrop-blur-lg border-t border-white/[0.08] px-2 flex items-center justify-around"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            (item.id === 'home' && nav.currentRoute === 'home') ||
            (item.id === 'manga' && (nav.currentRoute === 'manga' || nav.currentRoute === 'manga-detail' || nav.currentRoute === 'reader')) ||
            (item.id === 'browse' && nav.currentRoute === 'browse') ||
            (item.id === 'schedule' && nav.currentRoute === 'schedule') ||
            (item.id === 'favorites' && nav.currentRoute === 'favorites');

          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-semibold select-none ${
                isActive ? 'text-white font-bold' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#f472b6]' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

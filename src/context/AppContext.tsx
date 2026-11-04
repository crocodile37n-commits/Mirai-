import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AnimeMedia, UserProfile, UserSettings, WatchProgress, CommentItem } from '../types';
import { getAuthToken, setAuthToken, clearAuthTokens, authFetch } from '../services/authClient';

interface NavigationState {
  currentRoute: 'home' | 'browse' | 'detail' | 'watch' | 'profile' | 'manga' | 'schedule' | 'favorites' | 'manga-detail' | 'reader' | 'signin' | 'signup' | 'admin';
  selectedAnimeId: number | null;
  selectedEpisodeNumber: number;
  selectedMangaId?: number | null;
  selectedChapterNumber?: number;
  profileTab: 'profile' | 'continue' | 'favorites' | 'notifications' | 'connections' | 'settings';
  browseFilter?: {
    type?: 'ANIME' | 'MANGA';
    genre?: string;
    search?: string;
  };
}

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
  isAdmin?: boolean;
}

interface AppContextType {
  nav: NavigationState;
  navigateToHome: () => void;
  navigateToBrowse: (filter?: NavigationState['browseFilter']) => void;
  navigateToDetail: (animeId: number) => void;
  navigateToWatch: (animeId: number, episodeNumber?: number) => void;
  navigateToProfile: (tab?: NavigationState['profileTab']) => void;
  navigateToManga: () => void;
  navigateToSchedule: () => void;
  navigateToFavorites: () => void;
  navigateToMangaDetail: (mangaId: number) => void;
  navigateToReader: (mangaId: number, chapterNumber?: number) => void;
  navigateToSignIn: () => void;
  navigateToSignUp: () => void;
  navigateToAdmin: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authModalOpen: boolean;
  authModalMode: 'create-account' | 'sign-in';
  openAuthModal: (mode?: 'create-account' | 'sign-in') => void;
  closeAuthModal: () => void;
  login: (identifier: string, password?: string, rememberMe?: boolean) => Promise<AuthResponse>;
  loginAdmin: (email: string, password: string) => Promise<AuthResponse>;
  registerUser: (data: { fullName?: string; username: string; email: string; password?: string }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  resetToCleanState: () => void;
  favorites: number[];
  toggleFavorite: (animeId: number) => void;
  isFavorited: (animeId: number) => boolean;
  continueWatching: WatchProgress[];
  updateWatchProgress: (progress: WatchProgress) => Promise<void>;
  removeWatchHistory: (animeId: number, episodeNumber?: number) => Promise<void>;
  clearWatchHistory: () => Promise<void>;
  refreshWatchHistory: () => Promise<void>;
  userProfile: UserProfile | null;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  userSettings: UserSettings;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  comments: Record<string, CommentItem[]>;
  addComment: (animeId: number, episodeNumber: number, content: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toast: ToastMessage | null;
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  dismissToast: () => void;
  bookmarkedAnimes: number[];
  toggleBookmark: (animeId: number) => void;
}

const defaultSettings: UserSettings = {
  autoPlayNext: true,
  autoPlayPageLoad: false,
  autoSkipIntro: true,
  enableDubAudio: false,
  preferOriginalAudio: true,
  showLiveWatchStatus: true,
  showCommentsOnHome: true,
  publicWatchlist: false,
  titleLanguage: 'English',
  discordConnected: false,
  ignoreFolders: ['Plan to Watch', 'Completed'],
  ignoreAudioType: 'None',
  readerDirection: 'vertical',
  readerFit: 'fit-width',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [nav, setNav] = useState<NavigationState>(() => {
    const isDirectAdmin =
      typeof window !== 'undefined' &&
      (window.location.pathname === '/admin' || window.location.hash === '#admin');

    return {
      currentRoute: isDirectAdmin ? 'admin' : 'home',
      selectedAnimeId: 110349, // Cyberpunk Edgerunners
      selectedEpisodeNumber: 1,
      profileTab: 'profile',
    };
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'create-account' | 'sign-in'>('create-account');

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('mirai_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (!userProfile) return false;
    return (userProfile as any).role === 'admin';
  });

  const isAuthenticated = userProfile !== null;

  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('mirai_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bookmarkedAnimes, setBookmarkedAnimes] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('mirai_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [continueWatching, setContinueWatching] = useState<WatchProgress[]>(() => {
    try {
      const saved = localStorage.getItem('mirai_continue_watching');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('mirai_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [comments, setComments] = useState<Record<string, CommentItem[]>>(() => {
    try {
      const saved = localStorage.getItem('mirai_comments');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToast({ id, title, message, type });
    setTimeout(() => {
      setToast(curr => (curr?.id === id ? null : curr));
    }, 5000);
  }, []);

  const dismissToast = () => setToast(null);

  // Fetch watch history from SQLite backend
  const refreshWatchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history/continue');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          const formatted: WatchProgress[] = data.items.map((item: any) => ({
            animeId: item.animeId,
            animeTitle: item.animeTitle,
            animeCover: item.animeCover,
            episodeNumber: item.episodeNumber,
            episodeTitle: item.episodeTitle,
            progressSeconds: item.progressSeconds || 0,
            totalDurationSeconds: item.totalDurationSeconds || 1440,
            totalEpisodes: item.totalEpisodes || 12,
            lastWatchedAt: item.lastWatchedAt || new Date().toISOString(),
          }));
          setContinueWatching(formatted);
          try {
            localStorage.setItem('mirai_continue_watching', JSON.stringify(formatted));
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Failed to load continue watching:', e);
    }
  }, []);

  // Check current session from Bearer token & cookie on mount
  useEffect(() => {
    let isMounted = true;
    authFetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data && data.authenticated && data.user) {
          const u = data.user;
          const profile: UserProfile = {
            id: u.id,
            fullName: u.fullName || u.username,
            username: u.username,
            email: u.email,
            isEmailVerified: true,
            avatarUrl: u.avatarUrl || '',
            memberSince: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'October 2026',
            level: 1,
            rankTitle: u.role === 'admin' ? 'Administrator' : 'Member',
            episodesRemainingToNextLevel: 20,
            totalEpisodesWatched: 0,
            tempDiscordPassword: '',
          };
          (profile as any).role = u.role;
          setUserProfile(profile);
          const isUserAdmin = Boolean(data.isAdmin || u.role === 'admin');
          setIsAdmin(isUserAdmin);
          try {
            localStorage.setItem('mirai_auth_user', JSON.stringify(profile));
          } catch {}
          refreshWatchHistory();
        } else if (data && !data.authenticated && getAuthToken()) {
          // Token expired or invalidated on server
          clearAuthTokens();
          setUserProfile(null);
          setIsAdmin(false);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [refreshWatchHistory]);

  // Log privacy-conscious pageview analytics to SQLite
  useEffect(() => {
    const route = nav.currentRoute;
    const path = window.location.pathname || `/${route}`;
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'pageview',
        path,
        metadata: { route },
      }),
    }).catch(() => {});
  }, [nav.currentRoute]);

  // Keyboard shortcut '/' handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for browser URL popstate (e.g. /admin navigation)
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setNav(prev => ({ ...prev, currentRoute: 'admin' }));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToHome = () => {
    try {
      if (window.location.pathname === '/admin') {
        window.history.pushState(null, '', '/');
      }
    } catch {}
    setNav({
      currentRoute: 'home',
      selectedAnimeId: null,
      selectedEpisodeNumber: 1,
      profileTab: 'profile',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToBrowse = (filter?: NavigationState['browseFilter']) => {
    setNav({
      currentRoute: filter?.type === 'MANGA' ? 'manga' : 'browse',
      selectedAnimeId: null,
      selectedEpisodeNumber: 1,
      profileTab: 'profile',
      browseFilter: filter,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToDetail = (animeId: number) => {
    setNav({
      currentRoute: 'detail',
      selectedAnimeId: animeId,
      selectedEpisodeNumber: 1,
      profileTab: 'profile',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToWatch = (animeId: number, episodeNumber: number = 1) => {
    setNav({
      currentRoute: 'watch',
      selectedAnimeId: animeId,
      selectedEpisodeNumber: episodeNumber,
      profileTab: 'profile',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToProfile = (tab: NavigationState['profileTab'] = 'profile') => {
    setNav(prev => ({
      ...prev,
      currentRoute: 'profile',
      profileTab: tab,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToManga = () => {
    setNav({
      currentRoute: 'manga',
      selectedAnimeId: null,
      selectedEpisodeNumber: 1,
      profileTab: 'profile',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSchedule = () => {
    setNav({
      currentRoute: 'schedule',
      selectedAnimeId: null,
      selectedEpisodeNumber: 1,
      profileTab: 'profile',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToFavorites = () => {
    setNav({
      currentRoute: 'favorites',
      selectedAnimeId: null,
      selectedEpisodeNumber: 1,
      profileTab: 'favorites',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToMangaDetail = (mangaId: number) => {
    setNav({
      currentRoute: 'manga-detail',
      selectedAnimeId: null,
      selectedMangaId: mangaId,
      selectedEpisodeNumber: 1,
      profileTab: 'profile',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToReader = (mangaId: number, chapterNumber: number = 1) => {
    setNav({
      currentRoute: 'reader',
      selectedAnimeId: null,
      selectedMangaId: mangaId,
      selectedChapterNumber: chapterNumber,
      selectedEpisodeNumber: 1,
      profileTab: 'profile',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSignIn = () => {
    setNav({
      currentRoute: 'signin',
      selectedAnimeId: null,
      selectedEpisodeNumber: 1,
      profileTab: 'profile',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSignUp = () => {
    setNav({
      currentRoute: 'signup',
      selectedAnimeId: null,
      selectedEpisodeNumber: 1,
      profileTab: 'profile',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToAdmin = () => {
    try {
      window.history.pushState(null, '', '/admin');
    } catch {}
    setNav({
      currentRoute: 'admin',
      selectedAnimeId: null,
      selectedEpisodeNumber: 1,
      profileTab: 'profile',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (animeId: number) => {
    setFavorites(prev => {
      const next = prev.includes(animeId) ? prev.filter(id => id !== animeId) : [...prev, animeId];
      try {
        localStorage.setItem('mirai_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isFavorited = (animeId: number) => favorites.includes(animeId);

  const toggleBookmark = (animeId: number) => {
    setBookmarkedAnimes(prev => {
      const next = prev.includes(animeId) ? prev.filter(id => id !== animeId) : [...prev, animeId];
      try {
        localStorage.setItem('mirai_bookmarks', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Watch History Operations backed by SQLite database
  const updateWatchProgress = async (progress: WatchProgress) => {
    // 1. Optimistic UI update
    setContinueWatching(prev => {
      const filtered = prev.filter(p => p.animeId !== progress.animeId);
      const next = [progress, ...filtered];
      try {
        localStorage.setItem('mirai_continue_watching', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Persist to SQLite backend
    try {
      const isCompleted = progress.progressSeconds >= ((progress.totalDurationSeconds || 1440) * 0.85);
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeId: progress.animeId,
          animeTitle: progress.animeTitle,
          animeCover: progress.animeCover,
          episodeNumber: progress.episodeNumber,
          episodeTitle: progress.episodeTitle,
          progressSeconds: progress.progressSeconds,
          totalDurationSeconds: progress.totalDurationSeconds,
          isCompleted: isCompleted ? 1 : 0,
        }),
      });
    } catch (e) {
      console.warn('Failed to sync watch progress to server:', e);
    }
  };

  const removeWatchHistory = async (animeId: number, episodeNumber?: number) => {
    // Optimistic UI removal
    setContinueWatching(prev => {
      const next = prev.filter(p => p.animeId !== animeId);
      try {
        localStorage.setItem('mirai_continue_watching', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Remove from SQLite backend
    try {
      const endpoint = episodeNumber
        ? `/api/history/${animeId}/${episodeNumber}`
        : `/api/history/${animeId}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        showToast('Watch History', 'Item removed from your history.', 'info');
      }
    } catch (e) {
      console.warn('Failed to delete history record:', e);
    }
  };

  const clearWatchHistory = async () => {
    setContinueWatching([]);
    try {
      localStorage.removeItem('mirai_continue_watching');
    } catch {}

    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) {
        showToast('Watch History', 'All watch history cleared.', 'info');
      }
    } catch (e) {
      console.warn('Failed to clear watch history:', e);
    }
  };

  const openAuthModal = (mode: 'create-account' | 'sign-in' = 'create-account') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Real Email/Username + Password Login backed by SQLite & bcrypt
  const login = async (
    identifier: string,
    password?: string,
    rememberMe: boolean = true
  ): Promise<AuthResponse> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password || '',
          rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed.' };
      }

      const u = data.user;
      if (data.token) {
        setAuthToken(data.token);
      }

      const profile: UserProfile = {
        id: u.id,
        fullName: u.fullName || u.username,
        username: u.username,
        email: u.email,
        isEmailVerified: true,
        avatarUrl: u.avatarUrl || '',
        memberSince: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'October 2026',
        level: 1,
        rankTitle: u.role === 'admin' ? 'Administrator' : 'Member',
        episodesRemainingToNextLevel: 20,
        totalEpisodesWatched: 0,
        tempDiscordPassword: '',
      };
      (profile as any).role = u.role;

      setUserProfile(profile);
      const adminFlag = Boolean(data.isAdmin || u.role === 'admin');
      setIsAdmin(adminFlag);

      try {
        localStorage.setItem('mirai_auth_user', JSON.stringify(profile));
      } catch {}

      setAuthModalOpen(false);
      showToast('Welcome!', `Logged in as ${profile.username}`, 'success');

      // Refresh watch history from database
      refreshWatchHistory();

      return { success: true, user: u, isAdmin: adminFlag };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login.' };
    }
  };

  // Direct Administrator Login (Independent owner-only authentication)
  const loginAdmin = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      const res = await authFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid administrator credentials.' };
      }

      const u = data.user || data.admin;
      if (data.token) {
        setAuthToken(data.token);
      }

      const profile: UserProfile = {
        id: u.id,
        fullName: u.fullName || u.username,
        username: u.username,
        email: u.email,
        isEmailVerified: true,
        avatarUrl: u.avatarUrl || '',
        memberSince: u.createdAt
          ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : 'October 2026',
        level: 1,
        rankTitle: 'Administrator',
        episodesRemainingToNextLevel: 0,
        totalEpisodesWatched: 0,
        tempDiscordPassword: '',
      };
      (profile as any).role = 'admin';

      setUserProfile(profile);
      setIsAdmin(true);

      try {
        localStorage.setItem('mirai_auth_user', JSON.stringify(profile));
      } catch {}

      return { success: true, user: u, isAdmin: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during administrator login.' };
    }
  };

  // Real Sign Up with duplicate checks & bcrypt hashing in SQLite
  const registerUser = async (data: {
    fullName?: string;
    username: string;
    email: string;
    password?: string;
  }): Promise<AuthResponse> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName?.trim(),
          username: data.username.trim(),
          email: data.email.trim(),
          password: data.password || '',
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Account creation failed.' };
      }

      const u = resData.user;
      if (resData.token) {
        setAuthToken(resData.token);
      }

      const profile: UserProfile = {
        id: u.id,
        fullName: u.fullName || u.username,
        username: u.username,
        email: u.email,
        isEmailVerified: true,
        avatarUrl: u.avatarUrl || '',
        memberSince: 'Just now',
        level: 1,
        rankTitle: u.role === 'admin' ? 'Administrator' : 'Newcomer',
        episodesRemainingToNextLevel: 20,
        totalEpisodesWatched: 0,
        tempDiscordPassword: '',
      };
      (profile as any).role = u.role;

      setUserProfile(profile);
      const adminFlag = Boolean(resData.isAdmin || u.role === 'admin');
      setIsAdmin(adminFlag);

      try {
        localStorage.setItem('mirai_auth_user', JSON.stringify(profile));
      } catch {}

      setAuthModalOpen(false);
      showToast('Account Created', `Welcome to MIRAI, ${profile.username}!`, 'success');

      return { success: true, user: u, isAdmin: adminFlag };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration.' };
    }
  };

  const logout = async () => {
    try {
      await Promise.allSettled([
        authFetch('/api/auth/logout', { method: 'POST' }),
        authFetch('/api/admin/logout', { method: 'POST' }),
      ]);
    } catch {}

    clearAuthTokens();
    setUserProfile(null);
    setIsAdmin(false);
    try {
      localStorage.removeItem('mirai_auth_user');
      localStorage.removeItem('mirai_continue_watching');
    } catch {}
    setContinueWatching([]);
    setAuthModalOpen(false);
    navigateToHome();
    showToast('Signed Out', 'You have been returned to the signed-out state', 'info');
  };

  const resetToCleanState = () => {
    try {
      localStorage.removeItem('mirai_auth_user');
      localStorage.removeItem('mirai_favorites');
      localStorage.removeItem('mirai_bookmarks');
      localStorage.removeItem('mirai_continue_watching');
      localStorage.removeItem('mirai_comments');
      localStorage.removeItem('mirai_settings');
    } catch {}
    setUserProfile(null);
    setIsAdmin(false);
    setFavorites([]);
    setBookmarkedAnimes([]);
    setContinueWatching([]);
    setComments({});
    setUserSettings(defaultSettings);
    navigateToHome();
    showToast('Reset Complete', 'App reset to initial guest state', 'info');
  };

  const updateUserProfile = (profileUpdate: Partial<UserProfile>) => {
    setUserProfile(prev => {
      if (!prev) return null;
      const next = { ...prev, ...profileUpdate };
      try {
        localStorage.setItem('mirai_auth_user', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const updateUserSettings = (settingsUpdate: Partial<UserSettings>) => {
    setUserSettings(prev => {
      const next = { ...prev, ...settingsUpdate };
      try {
        localStorage.setItem('mirai_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const addComment = (animeId: number, episodeNumber: number, content: string) => {
    const key = `${animeId}_${episodeNumber}`;
    const newComment: CommentItem = {
      id: Math.random().toString(36).substring(7),
      episodeNumber,
      authorName: userProfile?.username || 'Guest',
      authorAvatar: userProfile?.avatarUrl || '',
      content,
      createdAt: 'Just now',
      likes: 0,
    };

    setComments(prev => {
      const next = {
        ...prev,
        [key]: [newComment, ...(prev[key] || [])],
      };
      try {
        localStorage.setItem('mirai_comments', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{
        nav,
        navigateToHome,
        navigateToBrowse,
        navigateToDetail,
        navigateToWatch,
        navigateToProfile,
        navigateToManga,
        navigateToSchedule,
        navigateToFavorites,
        navigateToMangaDetail,
        navigateToReader,
        navigateToSignIn,
        navigateToSignUp,
        navigateToAdmin,
        isAuthenticated,
        isAdmin,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        loginAdmin,
        registerUser,
        logout,
        resetToCleanState,
        favorites,
        toggleFavorite,
        isFavorited,
        continueWatching,
        updateWatchProgress,
        removeWatchHistory,
        clearWatchHistory,
        refreshWatchHistory,
        userProfile,
        updateUserProfile,
        userSettings,
        updateUserSettings,
        comments,
        addComment,
        searchOpen,
        setSearchOpen,
        toast,
        showToast,
        dismissToast,
        bookmarkedAnimes,
        toggleBookmark,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

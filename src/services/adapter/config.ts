/**
 * MIRAI Centralized Backend Adapter Configuration
 *
 * Centralized endpoint constants and configuration for connecting a local
 * Express, Consumet, or custom anime/manga backend.
 */

// Base URL for the future backend server.
// When running locally, set VITE_API_URL in .env (e.g., http://localhost:3001)
// or leave empty to use relative /api proxy routes.
export const BACKEND_CONFIG = {
  baseUrl: (import.meta.env.VITE_API_URL || '').replace(/\/$/, ''),
  consumetUrl: (import.meta.env.VITE_CONSUMET_URL || 'http://localhost:3001').replace(/\/$/, ''),

  endpoints: {
    // Anime & Streaming
    animeDetails: (id: number) => `/api/anime/${id}`,
    animeEpisodes: (id: number) => `/api/anime/${id}/episodes`,
    animeStreamSources: (animeId: number, episodeNumber: number) =>
      `/api/streaming/sources/anime/${animeId}?episode=${episodeNumber}`,
    movieStreamSources: (movieId: string) =>
      `/api/streaming/sources/movie/${movieId}`,

    // Manga
    mangaDiscovery: '/api/manga/discovery',
    mangaSearch: (query: string) => `/api/manga/search?q=${encodeURIComponent(query)}`,
    mangaChapters: (mangaId: number, title?: string) =>
      `/api/manga/${mangaId}/chapters${title ? `?title=${encodeURIComponent(title)}` : ''}`,
    mangaChapterPages: (chapterId: string) =>
      `/api/manga/chapter/${encodeURIComponent(chapterId)}/pages`,

    // Authentication & User
    authLogin: '/api/auth/login',
    authRegister: '/api/auth/register',
    authMe: '/api/auth/me',
    authLogout: '/api/auth/logout',
    userAvatar: '/api/user/avatar',
    userPreferences: '/api/user/preferences',
    userHistory: '/api/history',

    // Admin Panel
    adminOverview: '/api/admin/overview',
    adminPlugins: '/api/admin/plugins',
    adminPluginToggle: (id: string) => `/api/admin/plugins/${encodeURIComponent(id)}/toggle`,
    adminPluginTest: (id: string) => `/api/admin/plugins/${encodeURIComponent(id)}/test`,
    adminMovies: '/api/admin/movies',
    adminStreamingSources: '/api/admin/streaming-sources',
    adminLanguageSettings: '/api/admin/language-settings',
    adminSyncJobs: '/api/admin/sync/jobs',
    adminSyncStart: '/api/admin/sync/start',
    adminSyncLogs: '/api/admin/sync/logs',
    adminUsers: '/api/admin/users',
    adminUserStatus: (id: string) => `/api/admin/users/${encodeURIComponent(id)}/status`,
    adminAuditLogs: '/api/admin/audit-logs',
  },

  // Headers helper with optional token injection
  getHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders,
    };

    try {
      const token = localStorage.getItem('mirai_auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {}

    return headers;
  },
};

/**
 * Admin API Client for MIRAI Control Center
 * Manages administrative API interactions with Bearer token authentication.
 */

import { getAuthToken, setAuthToken, clearAuthTokens } from './authClient';

export function getStoredAdminToken(): string | null {
  return getAuthToken();
}

export function setStoredAdminToken(token: string): void {
  setAuthToken(token);
}

export function removeStoredAdminToken(): void {
  clearAuthTokens();
}

async function adminFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredAdminToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-admin-token', token);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      removeStoredAdminToken();
    }
    throw new Error(data.error || `Admin API Error: ${response.status} ${response.statusText}`);
  }

  return data as T;
}

export const adminApi = {
  // Auth
  async getStatus() {
    return adminFetch<{
      initialized: boolean;
      authenticated: boolean;
      adminEmail?: string;
      role?: string;
    }>('/api/admin/check');
  },

  async setup(email: string, password: string) {
    const res = await adminFetch<{ success: boolean; token: string; admin: any }>(
      '/api/admin/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    if (res.token) setStoredAdminToken(res.token);
    return res;
  },

  async login(email: string, password: string) {
    const res = await adminFetch<{ success: boolean; token: string; admin: any; user: any }>(
      '/api/admin/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    if (res.token) setStoredAdminToken(res.token);
    return res;
  },

  async logout() {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } finally {
      removeStoredAdminToken();
    }
  },

  async updateAccount(currentPassword: string, newEmail?: string, newPassword?: string) {
    return adminFetch('/api/admin/auth/update-account', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newEmail, newPassword }),
    });
  },

  // Overview & Analytics
  async getOverview() {
    return adminFetch<{
      analyticsEmpty: boolean;
      metrics: {
        totalPageViews: number;
        totalUniqueVisitors: number;
        dailyVisitors: number;
        weeklyVisitors: number;
        monthlyVisitors: number;
        registeredUsersCount: number;
        activeUsersCount: number;
        totalWatchMinutes: number;
        activeAdCampaignsCount: number;
        activeAnnouncementsCount: number;
        donationCampaignActive: boolean;
      };
      topAnime: Array<{ title: string; count: number }>;
      topManga: Array<{ title: string; count: number }>;
    }>('/api/admin/overview');
  },

  async getAnalytics(range: '24h' | '7d' | '30d' | '90d' = '7d') {
    return adminFetch<{
      isEmpty: boolean;
      totalEvents: number;
      dailyTimeline: Array<{ date: string; pageViews: number; plays: number; reads: number }>;
      eventTypesBreakdown: Record<string, number>;
      topPages: Array<{ path: string; count: number }>;
    }>(`/api/admin/analytics?range=${range}`);
  },

  // Users
  async getUsers(query?: string, status?: string) {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (status) params.set('status', status);
    return adminFetch<{ users: any[] }>(`/api/admin/users?${params.toString()}`);
  },

  async updateUserStatus(id: string, status: 'active' | 'suspended') {
    return adminFetch(`/api/admin/users/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  // Watch Activity
  async getWatchActivity(category?: string, type?: string) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (type) params.set('type', type);
    return adminFetch<{ total: number; events: any[] }>(`/api/admin/watch-activity?${params.toString()}`);
  },

  // Advertisements
  async getAds() {
    return adminFetch<{ globalEnabled: boolean; campaigns: any[] }>('/api/admin/ads');
  },

  async updateAdGlobal(globalEnabled: boolean) {
    return adminFetch('/api/admin/ads/global', {
      method: 'POST',
      body: JSON.stringify({ globalEnabled }),
    });
  },

  async saveAdCampaign(campaign: any) {
    return adminFetch('/api/admin/ads/campaign', {
      method: 'POST',
      body: JSON.stringify(campaign),
    });
  },

  async toggleAdCampaign(id: string, enabled: boolean) {
    return adminFetch(`/api/admin/ads/campaign/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  },

  async deleteAdCampaign(id: string) {
    return adminFetch(`/api/admin/ads/campaign/${id}`, { method: 'DELETE' });
  },

  // Announcements
  async getAnnouncements() {
    return adminFetch<{ announcements: any[] }>('/api/admin/announcements');
  },

  async saveAnnouncement(announcement: any) {
    return adminFetch('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(announcement),
    });
  },

  async toggleAnnouncement(id: string, enabled: boolean) {
    return adminFetch(`/api/admin/announcements/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  },

  async deleteAnnouncement(id: string) {
    return adminFetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
  },

  // Donations
  async getDonations() {
    return adminFetch<{ donation: any }>('/api/admin/donations');
  },

  async updateDonations(data: any) {
    return adminFetch('/api/admin/donations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Revenue
  async getRevenue() {
    return adminFetch<{
      adsEnabled: boolean;
      confirmedDonationRevenue: number;
      estimatedAdRevenue: number;
      donationCount: number;
      hasIntegratedGateway: boolean;
      notice: string;
    }>('/api/admin/revenue');
  },

  // Content
  async getContent() {
    return adminFetch<{
      anime: any[];
      manga: any[];
      overrides: {
        hiddenAnimeIds: number[];
        featuredAnimeIds: number[];
        hiddenMangaIds: number[];
        featuredMangaIds: number[];
      };
    }>('/api/admin/content');
  },

  async toggleContentVisibility(type: 'anime' | 'manga', id: number, hide: boolean) {
    return adminFetch('/api/admin/content/toggle-visibility', {
      method: 'POST',
      body: JSON.stringify({ type, id, hide }),
    });
  },

  async toggleContentFeatured(type: 'anime' | 'manga', id: number, feature: boolean) {
    return adminFetch('/api/admin/content/toggle-featured', {
      method: 'POST',
      body: JSON.stringify({ type, id, feature }),
    });
  },

  // Website Settings
  async getSettings() {
    return adminFetch<{ settings: any }>('/api/admin/settings');
  },

  async updateSettings(settings: any) {
    return adminFetch('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },
};

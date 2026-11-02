import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface AdminAccount {
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
  role: 'owner' | 'admin';
}

export interface AdminSession {
  token: string;
  email: string;
  role: 'owner' | 'admin';
  createdAt: number;
  expiresAt: number;
}

export interface RegisteredUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  createdAt: string;
  lastActiveAt: string;
  status: 'active' | 'suspended';
  favoriteGenres: string[];
  totalEpisodesWatched: number;
  totalChaptersRead: number;
  role: 'user';
}

export interface AnalyticsEvent {
  id: string;
  type: 'page_view' | 'episode_start' | 'episode_complete' | 'manga_view' | 'chapter_open' | 'search_query' | 'feature_click';
  path: string;
  targetId?: string | number;
  targetTitle?: string;
  category?: string;
  metadata?: Record<string, any>;
  timestamp: number;
  isoDate: string;
  ipHash: string;
}

export interface AdCampaign {
  id: string;
  title: string;
  format: 'homepage_banner' | 'content_banner' | 'video_placement' | 'promotional_popup' | 'custom_message';
  targetPages: string[];
  enabled: boolean;
  startDate: string;
  endDate: string;
  displayFrequency: 'once_per_session' | 'every_page' | 'hourly';
  headline: string;
  bodyText: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  impressions: number;
  clicks: number;
  estimatedEarnings: number;
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  location: 'homepage' | 'anime_detail' | 'manga_detail' | 'global_top' | 'viewer_overlay';
  enabled: boolean;
  frequency: 'once_per_user' | 'once_per_session' | 'always';
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface DonationCampaign {
  enabled: boolean;
  title: string;
  message: string;
  characterImageUrl: string;
  qrCodeImageUrl: string;
  upiId: string;
  targetLocations: ('homepage' | 'detail_pages' | 'popup' | 'support_section')[];
  totalDonationCount: number;
  verifiedDonationAmount: number;
  lastUpdated: string;
}

export interface WebsiteSettings {
  websiteName: string;
  maintenanceMode: boolean;
  maintenanceNotice: string;
  allowRegistrations: boolean;
  analyticsTracking: boolean;
  contactEmail: string;
  contentNotice: string;
  defaultAdStatus: boolean;
  defaultDonationStatus: boolean;
}

export interface DatabaseSchema {
  admin: AdminAccount | null;
  sessions: AdminSession[];
  loginAttempts: Record<string, { attempts: number; lockedUntil: number }>;
  users: RegisteredUser[];
  analyticsEvents: AnalyticsEvent[];
  ads: {
    globalEnabled: boolean;
    campaigns: AdCampaign[];
  };
  announcements: AnnouncementItem[];
  donations: DonationCampaign;
  settings: WebsiteSettings;
  contentOverrides: {
    hiddenAnimeIds: number[];
    featuredAnimeIds: number[];
    hiddenMangaIds: number[];
    featuredMangaIds: number[];
  };
}

const DATA_DIR = path.resolve('data');
const DB_FILE = path.join(DATA_DIR, 'mirai-store.json');

// Initial clean state with advertisements, donations, and announcements ALL OFF by default
const INITIAL_DATABASE: DatabaseSchema = {
  admin: null,
  sessions: [],
  loginAttempts: {},
  users: [],
  analyticsEvents: [],
  ads: {
    globalEnabled: false,
    campaigns: [],
  },
  announcements: [],
  donations: {
    enabled: false,
    title: 'Support MIRAI Development',
    message: 'Please support MIRAI — Keep high-definition anime & manga accessible to everyone. Voluntary contributions of any amount are deeply appreciated.',
    characterImageUrl: '',
    qrCodeImageUrl: '',
    upiId: '',
    targetLocations: ['support_section'],
    totalDonationCount: 0,
    verifiedDonationAmount: 0,
    lastUpdated: new Date().toISOString(),
  },
  settings: {
    websiteName: 'MIRAI',
    maintenanceMode: false,
    maintenanceNotice: 'MIRAI is undergoing scheduled maintenance. We will be back online shortly.',
    allowRegistrations: true,
    analyticsTracking: true,
    contactEmail: 'ghjklasdfg420@gmail.com',
    contentNotice: '',
    defaultAdStatus: false,
    defaultDonationStatus: false,
  },
  contentOverrides: {
    hiddenAnimeIds: [],
    featuredAnimeIds: [],
    hiddenMangaIds: [],
    featuredMangaIds: [],
  },
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...INITIAL_DATABASE,
          ...parsed,
          ads: {
            ...INITIAL_DATABASE.ads,
            ...(parsed.ads || {}),
          },
          donations: {
            ...INITIAL_DATABASE.donations,
            ...(parsed.donations || {}),
          },
          settings: {
            ...INITIAL_DATABASE.settings,
            ...(parsed.settings || {}),
          },
        };
      }
    } catch (err) {
      console.error('Failed to load database file, initializing clean state:', err);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATABASE));
  }

  private save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- Password Hashing with Scrypt & Salt ---
  public hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, s, 64);
    return {
      hash: derivedKey.toString('hex'),
      salt: s,
    };
  }

  public verifyPassword(password: string, hash: string, salt: string): boolean {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const candidateHash = derivedKey.toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(hash, 'hex'));
    } catch {
      return false;
    }
  }

  // --- Admin Auth ---
  public getAdmin(): AdminAccount | null {
    return this.data.admin;
  }

  public setAdmin(email: string, password: string): AdminAccount {
    const { hash, salt } = this.hashPassword(password);
    const admin: AdminAccount = {
      email: email.trim().toLowerCase(),
      passwordHash: hash,
      salt: salt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: 'owner',
    };
    this.data.admin = admin;
    this.save();
    return admin;
  }

  public updateAdminCredentials(currentEmail: string, newEmail?: string, newPassword?: string): boolean {
    if (!this.data.admin) return false;
    if (newEmail) {
      this.data.admin.email = newEmail.trim().toLowerCase();
    }
    if (newPassword) {
      const { hash, salt } = this.hashPassword(newPassword);
      this.data.admin.passwordHash = hash;
      this.data.admin.salt = salt;
    }
    this.data.admin.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  // --- Rate Limiting ---
  public checkRateLimit(ip: string): { allowed: boolean; waitMinutes?: number } {
    const now = Date.now();
    const record = this.data.loginAttempts[ip];
    if (!record) return { allowed: true };

    if (record.lockedUntil > now) {
      const waitMinutes = Math.ceil((record.lockedUntil - now) / 60000);
      return { allowed: false, waitMinutes };
    }

    if (record.lockedUntil <= now && record.attempts >= 5) {
      // Lock expired, reset
      delete this.data.loginAttempts[ip];
      this.save();
    }
    return { allowed: true };
  }

  public recordFailedLogin(ip: string): void {
    const now = Date.now();
    const record = this.data.loginAttempts[ip] || { attempts: 0, lockedUntil: 0 };
    record.attempts += 1;
    if (record.attempts >= 5) {
      record.lockedUntil = now + 15 * 60 * 1000; // 15 minutes lockout
    }
    this.data.loginAttempts[ip] = record;
    this.save();
  }

  public resetFailedLogins(ip: string): void {
    if (this.data.loginAttempts[ip]) {
      delete this.data.loginAttempts[ip];
      this.save();
    }
  }

  // --- Sessions ---
  public createSession(email: string, role: 'owner' | 'admin' = 'admin'): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

    // Clean expired sessions
    this.data.sessions = this.data.sessions.filter((s) => s.expiresAt > now);

    this.data.sessions.push({
      token,
      email,
      role,
      createdAt: now,
      expiresAt,
    });
    this.save();
    return token;
  }

  public validateSession(token?: string): AdminSession | null {
    if (!token) return null;
    const now = Date.now();
    const session = this.data.sessions.find((s) => s.token === token && s.expiresAt > now);
    return session || null;
  }

  public revokeSession(token: string): void {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  // --- Users ---
  public getUsers(): RegisteredUser[] {
    return this.data.users;
  }

  public registerUser(user: Omit<RegisteredUser, 'id' | 'createdAt' | 'lastActiveAt' | 'status' | 'totalEpisodesWatched' | 'totalChaptersRead' | 'role'>): RegisteredUser {
    const existing = this.data.users.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (existing) {
      existing.lastActiveAt = new Date().toISOString();
      this.save();
      return existing;
    }

    const newUser: RegisteredUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      ...user,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'active',
      favoriteGenres: user.favoriteGenres || ['Action', 'Fantasy'],
      totalEpisodesWatched: 0,
      totalChaptersRead: 0,
      role: 'user',
    };

    this.data.users.unshift(newUser);
    this.save();
    return newUser;
  }

  public updateUserStatus(userId: string, status: 'active' | 'suspended'): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;
    user.status = status;
    this.save();
    return true;
  }

  // --- Real Analytics Tracking ---
  public addAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'isoDate'>): AnalyticsEvent {
    const newEvent: AnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      ...event,
      timestamp: Date.now(),
      isoDate: new Date().toISOString(),
    };

    this.data.analyticsEvents.push(newEvent);

    // Keep events capped at 50,000 to prevent unbounded disk growth
    if (this.data.analyticsEvents.length > 50000) {
      this.data.analyticsEvents = this.data.analyticsEvents.slice(-40000);
    }

    this.save();
    return newEvent;
  }

  public getAnalyticsEvents(filter?: {
    type?: string;
    since?: number;
    until?: number;
  }): AnalyticsEvent[] {
    let events = this.data.analyticsEvents;
    if (filter?.type) {
      events = events.filter((e) => e.type === filter.type);
    }
    if (filter?.since) {
      events = events.filter((e) => e.timestamp >= filter.since!);
    }
    if (filter?.until) {
      events = events.filter((e) => e.timestamp <= filter.until!);
    }
    return events;
  }

  // --- Advertisements ---
  public getAds() {
    return this.data.ads;
  }

  public updateAdGlobal(enabled: boolean) {
    this.data.ads.globalEnabled = enabled;
    this.save();
    return this.data.ads;
  }

  public saveAdCampaign(campaign: Omit<AdCampaign, 'id' | 'impressions' | 'clicks' | 'estimatedEarnings' | 'createdAt'> & { id?: string }): AdCampaign {
    if (campaign.id) {
      const idx = this.data.ads.campaigns.findIndex((c) => c.id === campaign.id);
      if (idx !== -1) {
        this.data.ads.campaigns[idx] = {
          ...this.data.ads.campaigns[idx],
          ...campaign,
        };
        this.save();
        return this.data.ads.campaigns[idx];
      }
    }

    const newCampaign: AdCampaign = {
      id: `ad_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title: campaign.title,
      format: campaign.format,
      targetPages: campaign.targetPages || ['homepage'],
      enabled: false, // ALWAYS disabled by default as required
      startDate: campaign.startDate || new Date().toISOString().split('T')[0],
      endDate: campaign.endDate || '',
      displayFrequency: campaign.displayFrequency || 'once_per_session',
      headline: campaign.headline || '',
      bodyText: campaign.bodyText || '',
      ctaText: campaign.ctaText || 'Learn More',
      ctaUrl: campaign.ctaUrl || '#',
      imageUrl: campaign.imageUrl,
      impressions: 0,
      clicks: 0,
      estimatedEarnings: 0,
      createdAt: new Date().toISOString(),
    };

    this.data.ads.campaigns.push(newCampaign);
    this.save();
    return newCampaign;
  }

  public toggleAdCampaign(campaignId: string, enabled: boolean): boolean {
    const campaign = this.data.ads.campaigns.find((c) => c.id === campaignId);
    if (!campaign) return false;
    campaign.enabled = enabled;
    this.save();
    return true;
  }

  public deleteAdCampaign(campaignId: string): boolean {
    const lenBefore = this.data.ads.campaigns.length;
    this.data.ads.campaigns = this.data.ads.campaigns.filter((c) => c.id !== campaignId);
    this.save();
    return this.data.ads.campaigns.length < lenBefore;
  }

  // --- Announcements ---
  public getAnnouncements(): AnnouncementItem[] {
    return this.data.announcements;
  }

  public saveAnnouncement(announcement: Omit<AnnouncementItem, 'id' | 'createdAt'> & { id?: string }): AnnouncementItem {
    if (announcement.id) {
      const idx = this.data.announcements.findIndex((a) => a.id === announcement.id);
      if (idx !== -1) {
        this.data.announcements[idx] = {
          ...this.data.announcements[idx],
          ...announcement,
        };
        this.save();
        return this.data.announcements[idx];
      }
    }

    const newItem: AnnouncementItem = {
      id: `anc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title: announcement.title,
      message: announcement.message,
      imageUrl: announcement.imageUrl,
      buttonText: announcement.buttonText,
      buttonUrl: announcement.buttonUrl,
      location: announcement.location || 'homepage',
      enabled: false, // DISABLED by default
      frequency: announcement.frequency || 'once_per_session',
      startDate: announcement.startDate,
      endDate: announcement.endDate,
      createdAt: new Date().toISOString(),
    };

    this.data.announcements.unshift(newItem);
    this.save();
    return newItem;
  }

  public toggleAnnouncement(id: string, enabled: boolean): boolean {
    const item = this.data.announcements.find((a) => a.id === id);
    if (!item) return false;
    item.enabled = enabled;
    this.save();
    return true;
  }

  public deleteAnnouncement(id: string): boolean {
    const lenBefore = this.data.announcements.length;
    this.data.announcements = this.data.announcements.filter((a) => a.id !== id);
    this.save();
    return this.data.announcements.length < lenBefore;
  }

  // --- Donations ---
  public getDonationCampaign(): DonationCampaign {
    return this.data.donations;
  }

  public updateDonationCampaign(update: Partial<DonationCampaign>): DonationCampaign {
    this.data.donations = {
      ...this.data.donations,
      ...update,
      lastUpdated: new Date().toISOString(),
    };
    this.save();
    return this.data.donations;
  }

  // --- Website Settings ---
  public getSettings(): WebsiteSettings {
    return this.data.settings;
  }

  public updateSettings(update: Partial<WebsiteSettings>): WebsiteSettings {
    this.data.settings = {
      ...this.data.settings,
      ...update,
    };
    this.save();
    return this.data.settings;
  }

  // --- Content Overrides ---
  public getContentOverrides() {
    return this.data.contentOverrides;
  }

  public toggleAnimeVisibility(animeId: number, hide: boolean) {
    const set = new Set(this.data.contentOverrides.hiddenAnimeIds);
    if (hide) set.add(animeId);
    else set.delete(animeId);
    this.data.contentOverrides.hiddenAnimeIds = Array.from(set);
    this.save();
    return this.data.contentOverrides;
  }

  public toggleAnimeFeatured(animeId: number, feature: boolean) {
    const set = new Set(this.data.contentOverrides.featuredAnimeIds);
    if (feature) set.add(animeId);
    else set.delete(animeId);
    this.data.contentOverrides.featuredAnimeIds = Array.from(set);
    this.save();
    return this.data.contentOverrides;
  }

  public toggleMangaVisibility(mangaId: number, hide: boolean) {
    const set = new Set(this.data.contentOverrides.hiddenMangaIds);
    if (hide) set.add(mangaId);
    else set.delete(mangaId);
    this.data.contentOverrides.hiddenMangaIds = Array.from(set);
    this.save();
    return this.data.contentOverrides;
  }

  public toggleMangaFeatured(mangaId: number, feature: boolean) {
    const set = new Set(this.data.contentOverrides.featuredMangaIds);
    if (feature) set.add(mangaId);
    else set.delete(mangaId);
    this.data.contentOverrides.featuredMangaIds = Array.from(set);
    this.save();
    return this.data.contentOverrides;
  }
}

export const db = new Database();

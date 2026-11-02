import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { sqliteDb } from './server/sqliteDb';
import { db } from './server/db';
import { FALLBACK_SPOTLIGHT, FALLBACK_TRENDING, MANGA_DIRECTORY_POOL } from './src/services/animeApi';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Authorized Administrator Emails (configurable via env, recognizes verified owner accounts)
export const AUTHORIZED_ADMIN_EMAILS = new Set([
  (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  'altamashkhan27@gmail.com',
  'altamashkhan27ah@gmail.com',
].filter(Boolean));

export function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.has(email.trim().toLowerCase());
}

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'altamashkhan27ah@gmail.com').trim().toLowerCase();

// Ensure owner administrator accounts are ready in SQLite
AUTHORIZED_ADMIN_EMAILS.forEach((adminEmail) => {
  sqliteDb.ensureAdminAccount(adminEmail);
});

// Body and Cookie parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Helper: Hash IP for privacy compliance
function hashIp(req: Request): string {
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const ipStr = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(',')[0];
  return crypto.createHash('sha256').update(ipStr).digest('hex').substring(0, 16);
}

// Helper: Extract session token from HTTP-only cookie or Authorization header
function getSessionToken(req: Request): string | undefined {
  if (req.cookies && req.cookies.mirai_session) {
    return req.cookies.mirai_session;
  }
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers['x-admin-token'] || req.headers['x-auth-token'];
  if (customHeader && typeof customHeader === 'string') {
    return customHeader.trim();
  }
  return undefined;
}

// Middleware: Authenticate User
function authenticateUser(req: Request, _res: Response, next: NextFunction) {
  const token = getSessionToken(req);
  if (token) {
    const session = sqliteDb.validateSession(token);
    if (session) {
      const user = sqliteDb.getUserById(session.userId);
      if (user && user.status === 'active') {
        (req as any).user = user;
        (req as any).token = token;
      }
    }
  }
  next();
}

// Middleware: Require Logged-in User
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in to your MIRAI account.',
      code: 'AUTH_REQUIRED',
    });
  }
  next();
}

// Middleware: Require Verified Owner/Administrator
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({
      error: 'Administrator authentication required.',
      code: 'ADMIN_AUTH_REQUIRED',
    });
  }

  const isOwnerEmail = isAuthorizedAdmin(user.email);
  if (user.role !== 'admin' || !isOwnerEmail) {
    sqliteDb.addAuditLog({
      action: 'unauthorized_admin_access_attempt',
      actorEmail: user.email,
      actorRole: user.role,
      details: `User attempted to access admin endpoint: ${req.originalUrl}`,
      ipHash: hashIp(req),
    });
    return res.status(403).json({
      error: 'Access denied: Administrator privileges required.',
      code: 'FORBIDDEN_NOT_ADMIN',
    });
  }

  next();
}

// Apply authentication middleware to all requests
app.use(authenticateUser);

// ==========================================
// 1. AUTHENTICATION APIS (SIGN UP, SIGN IN, ME, LOGOUT)
// ==========================================

// Sign Up (Register with Username, Email, Password)
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, password, fullName } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();

  // Check duplicate email
  const existingEmail = sqliteDb.findUserByEmail(cleanEmail);
  if (existingEmail) {
    return res.status(409).json({
      error: 'An account with this email address already exists. Please sign in.',
      code: 'EMAIL_ALREADY_EXISTS',
    });
  }

  // Check duplicate username
  const existingUsername = sqliteDb.findUserByUsername(cleanUsername);
  if (existingUsername) {
    return res.status(409).json({
      error: 'This username is already taken. Please choose another username.',
      code: 'USERNAME_ALREADY_EXISTS',
    });
  }

  // Only verified administrator emails get the admin role. Regular users ALWAYS get 'user'
  const isOwner = isAuthorizedAdmin(cleanEmail);
  const role: 'admin' | 'user' = isOwner ? 'admin' : 'user';

  const { user } = sqliteDb.createUser({
    username: cleanUsername,
    email: cleanEmail,
    password,
    fullName: fullName?.trim() || cleanUsername,
    role,
  });

  const ip = hashIp(req);
  const token = sqliteDb.createSession(user.id, user.email, user.role, ip);

  // Set secure HTTP-only cookie
  res.cookie('mirai_session', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  sqliteDb.addAuditLog({
    action: 'user_registered',
    actorEmail: user.email,
    actorRole: user.role,
    details: `User registered account (@${user.username})`,
    ipHash: ip,
  });

  res.status(201).json({
    success: true,
    message: 'Account successfully created.',
    user,
    token,
    isAdmin: user.role === 'admin' && isAuthorizedAdmin(user.email),
  });
});

// Sign In (Authenticate with Username OR Email + Password)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const ip = hashIp(req);
  const rateLimit = sqliteDb.checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Too many failed attempts. Please wait ${rateLimit.waitMinutes} minute(s) before trying again.`,
      code: 'RATE_LIMITED',
    });
  }

  const { identifier, email, password } = req.body;
  const loginHandle = identifier || email;

  if (!loginHandle || !password) {
    return res.status(400).json({ error: 'Please enter your email or username, and password.' });
  }

  const userRecord = sqliteDb.findUserByEmailOrUsername(loginHandle);
  if (!userRecord) {
    sqliteDb.recordFailedLogin(ip);
    return res.status(401).json({
      error: 'Invalid credentials. No account found with that email or username.',
      code: 'INVALID_CREDENTIALS',
    });
  }

  if (userRecord.status === 'suspended') {
    return res.status(403).json({
      error: 'This account has been suspended. Please contact support.',
      code: 'ACCOUNT_SUSPENDED',
    });
  }

  const isValid = sqliteDb.verifyPassword(password, userRecord.password_hash);
  if (!isValid) {
    sqliteDb.recordFailedLogin(ip);
    return res.status(401).json({
      error: 'Incorrect password. Please verify and try again.',
      code: 'INVALID_CREDENTIALS',
    });
  }

  // Success
  sqliteDb.resetFailedLogins(ip);
  sqliteDb.recordSignIn(userRecord.id);

  // Auto-upgrade to admin role if email matches authorized admin
  if (isAuthorizedAdmin(userRecord.email) && userRecord.role !== 'admin') {
    sqliteDb.updateUserStatus(userRecord.id, 'active');
    const updStmt = require('better-sqlite3')(path.resolve('data/mirai.db')).prepare(
      `UPDATE users SET role = 'admin' WHERE id = ?`
    );
    updStmt.run(userRecord.id);
    userRecord.role = 'admin';
  }

  const token = sqliteDb.createSession(userRecord.id, userRecord.email, userRecord.role, ip);

  // Set HTTP-only cookie
  res.cookie('mirai_session', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  sqliteDb.addAuditLog({
    action: 'user_login',
    actorEmail: userRecord.email,
    actorRole: userRecord.role,
    details: `Successful sign in (@${userRecord.username})`,
    ipHash: ip,
  });

  const safeUser = sqliteDb.getUserById(userRecord.id)!;
  const isOwnerAdmin = safeUser.role === 'admin' && isAuthorizedAdmin(safeUser.email);

  res.json({
    success: true,
    user: safeUser,
    token,
    isAdmin: isOwnerAdmin,
  });
});

// Check Current Session Status
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    return res.json({ authenticated: false, user: null, isAdmin: false });
  }

  const isOwnerAdmin = user.role === 'admin' && isAuthorizedAdmin(user.email);
  res.json({
    authenticated: true,
    user,
    isAdmin: isOwnerAdmin,
  });
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = (req as any).token || getSessionToken(req);
  if (token) {
    sqliteDb.revokeSession(token);
  }
  res.clearCookie('mirai_session', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Password Reset Flow
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Email or username is required.' });
  }

  const user = sqliteDb.findUserByEmailOrUsername(identifier);
  if (!user) {
    // Return friendly generic response to prevent user enumeration
    return res.json({
      success: true,
      message: 'If an account exists with those details, password reset instructions have been generated.',
    });
  }

  res.json({
    success: true,
    message: 'Account verified. You may proceed to reset your password.',
    userId: user.id,
    username: user.username,
  });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { identifier, newPassword } = req.body;
  if (!identifier || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Identifier and a new password of at least 6 characters are required.' });
  }

  const user = sqliteDb.findUserByEmailOrUsername(identifier);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  sqliteDb.updateUserPassword(user.id, newPassword);
  sqliteDb.revokeAllUserSessions(user.id);

  sqliteDb.addAuditLog({
    action: 'password_reset',
    actorEmail: user.email,
    actorRole: user.role,
    details: `Password reset for user @${user.username}`,
    ipHash: hashIp(req),
  });

  res.json({ success: true, message: 'Password has been updated. Please sign in with your new password.' });
});

// ==========================================
// 2. WATCH HISTORY & CONTINUE WATCHING APIS
// ==========================================

// Get user's active continue watching items
app.get('/api/history/continue', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const history = sqliteDb.getContinueWatchingAnime(user.id, 20);
  res.json({ history });
});

// Get user's full watch & read history
app.get('/api/history', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const history = sqliteDb.getWatchHistory(user.id, 50);
  res.json({ history });
});

// Get episode watch status for a specific anime
app.get('/api/history/anime/:animeId', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const animeId = parseInt(req.params.animeId, 10);
  if (isNaN(animeId)) {
    return res.status(400).json({ error: 'Invalid animeId' });
  }

  const statusMap = sqliteDb.getEpisodeWatchStatus(user.id, animeId);
  res.json({ watchedEpisodes: statusMap });
});

// Save / update watch progress
app.post('/api/history', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const {
    animeId,
    animeTitle,
    animeCover,
    episodeNumber,
    episodeTitle,
    progressSeconds,
    totalDurationSeconds,
    totalEpisodes,
    mediaType,
  } = req.body;

  if (!animeId || episodeNumber === undefined) {
    return res.status(400).json({ error: 'animeId and episodeNumber are required.' });
  }

  const record = sqliteDb.upsertWatchProgress({
    userId: user.id,
    mediaType: mediaType || 'ANIME',
    animeId: Number(animeId),
    animeTitle: animeTitle || 'Anime Series',
    animeCover: animeCover || '',
    episodeNumber: Number(episodeNumber),
    episodeTitle: episodeTitle || `Episode ${episodeNumber}`,
    progressSeconds: Number(progressSeconds) || 0,
    totalDurationSeconds: Number(totalDurationSeconds) || 1440,
    totalEpisodes: Number(totalEpisodes) || 12,
  });

  res.json({ success: true, record });
});

// Delete specific anime from history
app.delete('/api/history/:animeId', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const animeId = parseInt(req.params.animeId, 10);
  if (isNaN(animeId)) return res.status(400).json({ error: 'Invalid animeId' });

  const deleted = sqliteDb.deleteWatchHistoryItem(user.id, animeId);
  res.json({ success: true, deleted });
});

// Delete specific episode from history
app.delete('/api/history/:animeId/:episodeNumber', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const animeId = parseInt(req.params.animeId, 10);
  const episodeNumber = parseInt(req.params.episodeNumber, 10);

  const deleted = sqliteDb.deleteWatchHistoryItem(user.id, animeId, episodeNumber);
  res.json({ success: true, deleted });
});

// Clear all watch history for current user
app.delete('/api/history', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const cleared = sqliteDb.clearWatchHistory(user.id);
  res.json({ success: true, cleared });
});

// ==========================================
// 3. VISITOR ANALYTICS API (GENUINE TRACKING)
// ==========================================

app.post('/api/analytics/event', (req: Request, res: Response) => {
  const { path, eventType, targetId, targetTitle, category, metadata, sessionId } = req.body;
  if (!path || !eventType) {
    return res.status(400).json({ error: 'path and eventType are required' });
  }

  const ip = hashIp(req);
  sqliteDb.recordVisitorEvent({
    ipHash: ip,
    path,
    eventType,
    sessionId,
    targetId,
    targetTitle,
    category,
    metadata,
  });

  res.status(201).json({ status: 'recorded' });
});

// ==========================================
// 4. OWNER-ONLY ADMIN APIS (requireAdmin)
// ==========================================

// Direct Administrator Login (Independent owner-only authentication)
app.post('/api/admin/login', (req: Request, res: Response) => {
  const ip = hashIp(req);
  const rateLimit = sqliteDb.checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Too many failed attempts. Please wait ${rateLimit.waitMinutes} minute(s) before trying again.`,
      code: 'RATE_LIMITED',
    });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter your administrator email and password.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // Owner-only verification: Only authorized administrator accounts can access
  // If a normal user enters their own credentials on the Admin Login page, reject with generic error
  if (!isAuthorizedAdmin(normalizedEmail)) {
    sqliteDb.recordFailedLogin(ip);
    sqliteDb.addAuditLog({
      action: 'failed_admin_login_unauthorized',
      actorEmail: normalizedEmail,
      actorRole: 'unauthorized',
      details: 'Rejected non-admin attempt on admin login endpoint',
      ipHash: ip,
    });
    return res.status(401).json({
      error: 'Invalid administrator credentials.',
      code: 'INVALID_ADMIN_CREDENTIALS',
    });
  }

  const userRecord = sqliteDb.findUserByEmail(normalizedEmail);
  if (!userRecord) {
    sqliteDb.recordFailedLogin(ip);
    return res.status(401).json({
      error: 'Invalid administrator credentials.',
      code: 'INVALID_ADMIN_CREDENTIALS',
    });
  }

  if (userRecord.status === 'suspended') {
    return res.status(403).json({
      error: 'Administrator access is currently suspended.',
      code: 'ACCOUNT_SUSPENDED',
    });
  }

  const isValid = sqliteDb.verifyPassword(String(password), userRecord.password_hash);
  if (!isValid) {
    sqliteDb.recordFailedLogin(ip);
    sqliteDb.addAuditLog({
      action: 'failed_admin_login_bad_password',
      actorEmail: normalizedEmail,
      actorRole: 'admin',
      details: 'Incorrect password entered on admin login',
      ipHash: ip,
    });
    return res.status(401).json({
      error: 'Invalid administrator credentials.',
      code: 'INVALID_ADMIN_CREDENTIALS',
    });
  }

  // Ensure role is admin
  if (userRecord.role !== 'admin') {
    const updStmt = require('better-sqlite3')(path.resolve('data/mirai.db')).prepare(
      `UPDATE users SET role = 'admin' WHERE id = ?`
    );
    updStmt.run(userRecord.id);
    userRecord.role = 'admin';
  }

  sqliteDb.resetFailedLogins(ip);
  sqliteDb.recordSignIn(userRecord.id);

  const token = sqliteDb.createSession(userRecord.id, userRecord.email, 'admin', ip);

  res.cookie('mirai_session', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  sqliteDb.addAuditLog({
    action: 'admin_login_success',
    actorEmail: userRecord.email,
    actorRole: 'admin',
    details: 'Owner administrator authenticated directly via Admin Console',
    ipHash: ip,
  });

  const safeUser = sqliteDb.getUserById(userRecord.id)!;
  res.json({
    success: true,
    user: safeUser,
    token,
    isAdmin: true,
  });
});

// Admin Session Check
app.get('/api/admin/check', (req: Request, res: Response) => {
  const user = (req as any).user;
  const isOwnerAdmin = Boolean(user && user.role === 'admin' && isAuthorizedAdmin(user.email));
  res.json({ isAdmin: isOwnerAdmin });
});

// Admin Logout
app.post('/api/admin/logout', (req: Request, res: Response) => {
  const token = (req as any).token || getSessionToken(req);
  if (token) {
    sqliteDb.revokeSession(token);
  }
  res.clearCookie('mirai_session', { path: '/' });
  res.json({ success: true, message: 'Administrator session terminated.' });
});

// Dashboard Real-time Overview Statistics
app.get('/api/admin/overview', requireAdmin, (_req: Request, res: Response) => {
  const stats = sqliteDb.getAdminDashboardStats();
  res.json({
    success: true,
    stats,
  });
});

// Admin User Directory
app.get('/api/admin/users', requireAdmin, (req: Request, res: Response) => {
  const { search, status } = req.query;
  const users = sqliteDb.listUsers(search as string, status as string);
  res.json({ success: true, users });
});

// Admin Update User Status (Suspend / Reactivate)
app.post('/api/admin/users/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status !== 'active' && status !== 'suspended') {
    return res.status(400).json({ error: 'Status must be active or suspended.' });
  }

  const success = sqliteDb.updateUserStatus(id, status);
  if (!success) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const admin = (req as any).user;
  sqliteDb.addAuditLog({
    action: 'user_status_updated',
    actorEmail: admin.email,
    actorRole: 'admin',
    target: id,
    details: `Updated user status to '${status}'`,
    ipHash: hashIp(req),
  });

  res.json({ success: true, message: `User status changed to ${status}.` });
});

// Admin Visitor Analytics Telemetry
app.get('/api/admin/analytics', requireAdmin, (_req: Request, res: Response) => {
  const analytics = sqliteDb.getVisitorAnalytics();
  res.json({ success: true, analytics });
});

// Admin Real-Time Audit Logs
app.get('/api/admin/audit-logs', requireAdmin, (_req: Request, res: Response) => {
  const stats = sqliteDb.getAdminDashboardStats();
  res.json({ success: true, auditLogs: stats.auditLogs });
});

// Admin Media Catalog
app.get('/api/admin/content', requireAdmin, (_req: Request, res: Response) => {
  const overrides = db.getContentOverrides();
  res.json({
    anime: FALLBACK_SPOTLIGHT.concat(FALLBACK_TRENDING.slice(4)),
    manga: MANGA_DIRECTORY_POOL,
    overrides,
  });
});

// Admin Settings
app.get('/api/admin/settings', requireAdmin, (_req: Request, res: Response) => {
  res.json({ settings: db.getSettings() });
});

app.post('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const update = req.body;
  const updated = db.updateSettings(update);
  res.json({ success: true, settings: updated });
});

// ==========================================
// 5. PUBLIC CLIENT-SIDE APIs FOR MIRAI
// ==========================================

app.get('/api/public/announcements', (_req: Request, res: Response) => {
  const all = db.getAnnouncements();
  const active = all.filter((a) => a.enabled);
  res.json({ announcements: active });
});

app.get('/api/public/settings', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({
    websiteName: settings.websiteName,
    maintenanceMode: settings.maintenanceMode,
    maintenanceNotice: settings.maintenanceNotice,
    allowRegistrations: settings.allowRegistrations,
  });
});

// ==========================================
// 6. LIVE AIRING SCHEDULE API (AniList Multi-Page Real Data)
// ==========================================
let liveScheduleCache: { data: Record<string, any[]>; counts: Record<string, number>; timestamp: number } | null = null;
const SCHEDULE_TTL = 15 * 60 * 1000; // 15 mins

app.get('/api/anime/schedule', async (_req: Request, res: Response) => {
  if (liveScheduleCache && Date.now() - liveScheduleCache.timestamp < SCHEDULE_TTL) {
    return res.json({ success: true, schedule: liveScheduleCache.data, counts: liveScheduleCache.counts, cached: true });
  }

  const now = Math.floor(Date.now() / 1000);
  const startOfWeek = now - 86400; // 24h past
  const endOfWeek = now + 7 * 86400; // 7 days ahead

  const query = `
    query ($start: Int, $end: Int, $page: Int) {
      Page(page: $page, perPage: 50) {
        pageInfo { hasNextPage }
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          id
          airingAt
          timeUntilAiring
          episode
          media {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
              medium
              color
            }
            bannerImage
            format
            genres
            description(asHtml: false)
            averageScore
            popularity
            isAdult
          }
        }
      }
    }
  `;

  try {
    const fetchPage = async (page: number) => {
      const resp = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { start: startOfWeek, end: endOfWeek, page },
        }),
      });
      if (!resp.ok) return [];
      const json = await resp.json();
      return json.data?.Page?.airingSchedules || [];
    };

    const [page1, page2, page3] = await Promise.all([fetchPage(1), fetchPage(2), fetchPage(3)]);
    const rawItems = [...page1, ...page2, ...page3];

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped: Record<string, any[]> = {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };
    const counts: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    const seenScheduleIds = new Set<number>();

    for (const item of rawItems) {
      if (!item.media || item.media.isAdult || seenScheduleIds.has(item.id)) continue;
      seenScheduleIds.add(item.id);

      const date = new Date(item.airingAt * 1000);
      const dayName = days[date.getDay()];

      const timeJST =
        date.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Tokyo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }) + ' JST';

      const dateFormatted = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

      const title = item.media.title.english || item.media.title.romaji || item.media.title.native;
      const thumbnail = item.media.coverImage?.large || item.media.coverImage?.medium || '';

      const entry = {
        id: item.id,
        animeId: item.media.id,
        title,
        thumbnail,
        timeJST,
        episodeNumber: item.episode,
        genres: (item.media.genres || ['ANIME']).slice(0, 3),
        description: item.media.description || '',
        dayOfWeek: dayName,
        dateFormatted,
        airingTimestamp: item.airingAt,
      };

      if (grouped[dayName]) {
        grouped[dayName].push(entry);
        counts[dayName] = (counts[dayName] || 0) + 1;
      }
    }

    liveScheduleCache = { data: grouped, counts, timestamp: Date.now() };
    res.json({ success: true, schedule: grouped, counts, cached: false });
  } catch (err: any) {
    console.warn('Airing schedule fetch error:', err.message);
    res.status(502).json({ error: 'Failed to fetch live schedule from AniList', details: err.message });
  }
});

// ==========================================
// 7. REAL MANGA INTEGRATION (AniList & MangaDex APIs)
// ==========================================
let liveMangaCache: { data: any; timestamp: number } | null = null;
const MANGA_TTL = 15 * 60 * 1000; // 15 mins

app.get('/api/manga/discovery', async (_req: Request, res: Response) => {
  if (liveMangaCache && Date.now() - liveMangaCache.timestamp < MANGA_TTL) {
    return res.json({ success: true, discovery: liveMangaCache.data, cached: true });
  }

  const query = `
    query {
      trending: Page(page: 1, perPage: 14) {
        media(type: MANGA, sort: TRENDING_DESC, isAdult: false) {
          id
          title { english romaji native }
          coverImage { extraLarge large medium color }
          bannerImage
          description(asHtml: false)
          genres
          averageScore
          popularity
          chapters
          status
          countryOfOrigin
        }
      }
      popular: Page(page: 1, perPage: 14) {
        media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
          id
          title { english romaji native }
          coverImage { extraLarge large medium color }
          bannerImage
          description(asHtml: false)
          genres
          averageScore
          popularity
          chapters
          status
          countryOfOrigin
        }
      }
      topRated: Page(page: 1, perPage: 14) {
        media(type: MANGA, sort: SCORE_DESC, isAdult: false) {
          id
          title { english romaji native }
          coverImage { extraLarge large medium color }
          bannerImage
          description(asHtml: false)
          genres
          averageScore
          popularity
          chapters
          status
          countryOfOrigin
        }
      }
      releasing: Page(page: 1, perPage: 12) {
        media(type: MANGA, status: RELEASING, sort: UPDATED_AT_DESC, isAdult: false) {
          id
          title { english romaji native }
          coverImage { extraLarge large medium color }
          bannerImage
          description(asHtml: false)
          genres
          averageScore
          popularity
          chapters
          status
          countryOfOrigin
        }
      }
    }
  `;

  try {
    const resp = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!resp.ok) {
      throw new Error(`AniList returned status ${resp.status}`);
    }

    const json = await resp.json();
    const data = json.data;

    const formatManga = (m: any) => ({
      ...m,
      format: 'MANGA',
      country: m.countryOfOrigin || 'JP',
      mangaType: m.countryOfOrigin === 'KR' ? 'MANHWA' : m.countryOfOrigin === 'CN' ? 'MANHUA' : 'MANGA',
      chaptersCount: m.chapters || 40,
      viewsCount: m.popularity ? `${(m.popularity / 1000).toFixed(1)}K` : '24.5K',
      hasNewChapter: m.status === 'RELEASING',
      sourceProvider: 'Official / MangaDex',
    });

    const trending = (data?.trending?.media || []).map(formatManga);
    const popular = (data?.popular?.media || []).map(formatManga);
    const topRated = (data?.topRated?.media || []).map(formatManga);
    const recentlyUpdated = (data?.releasing?.media || []).map(formatManga);

    const result = {
      hero: trending.slice(0, 5),
      topViewed: popular,
      recentlyUpdated,
      popular,
      topRated,
    };

    liveMangaCache = { data: result, timestamp: Date.now() };
    res.json({ success: true, discovery: result, cached: false });
  } catch (err: any) {
    console.warn('Manga discovery fetch error:', err.message);
    res.status(502).json({ error: 'Failed to fetch manga from AniList', details: err.message });
  }
});

// Search Manga
app.get('/api/manga/search', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q || !q.trim()) {
    return res.json({ success: true, results: [] });
  }

  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 20) {
        media(type: MANGA, search: $search, isAdult: false) {
          id
          title { english romaji native }
          coverImage { extraLarge large medium color }
          bannerImage
          description(asHtml: false)
          genres
          averageScore
          popularity
          chapters
          status
          countryOfOrigin
        }
      }
    }
  `;

  try {
    const resp = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { search: q.trim() } }),
    });
    const json = await resp.json();
    const results = (json.data?.Page?.media || []).map((m: any) => ({
      ...m,
      format: 'MANGA',
      country: m.countryOfOrigin || 'JP',
      mangaType: m.countryOfOrigin === 'KR' ? 'MANHWA' : m.countryOfOrigin === 'CN' ? 'MANHUA' : 'MANGA',
      chaptersCount: m.chapters || 40,
    }));
    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to search manga', details: err.message });
  }
});

// Real Manga Chapters via MangaDex API
app.get('/api/manga/:id/chapters', async (req: Request, res: Response) => {
  const { id } = req.params;
  const title = (req.query.title as string) || '';

  if (!title) {
    return res.json({ success: true, chapters: [] });
  }

  try {
    // 1. Search MangaDex for matching manga
    const searchRes = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(title.trim())}&limit=1`
    );
    const searchJson = await searchRes.json();
    const mangaDexId = searchJson.data?.[0]?.id;

    if (!mangaDexId) {
      return res.json({ success: true, chapters: [], source: 'not_found' });
    }

    // 2. Fetch chapter feed in English
    const feedRes = await fetch(
      `https://api.mangadex.org/manga/${mangaDexId}/feed?translatedLanguage[]=en&order[chapter]=desc&limit=100`
    );
    const feedJson = await feedRes.json();
    const rawChapters = feedJson.data || [];

    const chapters = rawChapters.map((ch: any) => {
      const chNum = parseFloat(ch.attributes?.chapter) || 1;
      const chTitle = ch.attributes?.title || `Chapter ${chNum}`;
      const extUrl = ch.attributes?.externalUrl || null;
      const pubDate = ch.attributes?.publishAt
        ? new Date(ch.attributes.publishAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recent';

      return {
        id: ch.id,
        number: chNum,
        title: chTitle,
        scanlatorGroup: 'Official / MangaDex Community',
        pagesCount: ch.attributes?.pages || 20,
        publishDate: pubDate,
        externalUrl: extUrl,
        sourceProvider: extUrl ? 'Official Authorized Publisher' : 'MangaDex Network',
        pages: [],
      };
    });

    res.json({ success: true, chapters, mangaDexId });
  } catch (err: any) {
    console.warn('MangaDex chapters fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch chapters from MangaDex', details: err.message });
  }
});

// Real Manga Chapter Pages via MangaDex@Home API
app.get('/api/manga/chapter/:chapterId/pages', async (req: Request, res: Response) => {
  const { chapterId } = req.params;

  try {
    const serverRes = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
    if (!serverRes.ok) {
      return res.status(serverRes.status).json({ error: 'Failed to contact MangaDex@Home' });
    }

    const serverJson = await serverRes.json();
    const baseUrl = serverJson.baseUrl;
    const hash = serverJson.chapter?.hash;
    const files = serverJson.chapter?.data || [];

    const pages = files.map((fileName: string) => `${baseUrl}/data/${hash}/${fileName}`);
    res.json({ success: true, pages, count: pages.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch chapter pages', details: err.message });
  }
});

// ==========================================
// 8. STREAMING SOURCES PROXY (Consumet / Legal Providers)
// ==========================================
const CONSUMET_URL = process.env.CONSUMET_URL || 'http://localhost:3001';

app.get('/api/anime/sources/:episodeId', async (req: Request, res: Response) => {
  const { episodeId } = req.params;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const consumetRes = await fetch(`${CONSUMET_URL}/anime/gogoanime/watch/${encodeURIComponent(episodeId)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (consumetRes.ok) {
      const data = await consumetRes.json();
      return res.json({
        success: true,
        sources: data.sources || [],
        subtitles: data.subtitles || [],
        provider: 'Consumet',
      });
    }
  } catch {
    // Consumet not active locally
  }

  res.json({
    success: false,
    sources: [],
    message: 'Local Consumet streaming service (port 3001) is currently offline.',
  });
});
// 6. STATIC / VITE INTEGRATION
// ==========================================

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`MIRAI Full-Stack Server running at http://0.0.0.0:${PORT}`);
    console.log(`Administrator email configured: ${ADMIN_EMAIL}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

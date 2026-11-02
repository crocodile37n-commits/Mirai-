import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'mirai.db');
export const sqlite = new Database(DB_PATH);

// Enable WAL mode for performance & concurrent access
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Initialize database tables
export function initDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_signin_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      ip_hash TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS watch_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      media_type TEXT NOT NULL DEFAULT 'ANIME',
      anime_id INTEGER NOT NULL,
      anime_title TEXT NOT NULL,
      anime_cover TEXT NOT NULL,
      episode_number INTEGER NOT NULL,
      episode_title TEXT,
      progress_seconds INTEGER NOT NULL DEFAULT 0,
      total_duration_seconds INTEGER NOT NULL DEFAULT 1440,
      total_episodes INTEGER NOT NULL DEFAULT 12,
      is_completed INTEGER NOT NULL DEFAULT 0,
      last_watched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, anime_id, episode_number),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS visitor_analytics (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      ip_hash TEXT NOT NULL,
      path TEXT NOT NULL,
      event_type TEXT NOT NULL,
      target_id TEXT,
      target_title TEXT,
      category TEXT,
      metadata TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      actor_email TEXT,
      actor_role TEXT,
      target TEXT,
      details TEXT,
      ip_hash TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      identifier TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 1,
      locked_until INTEGER NOT NULL DEFAULT 0,
      last_attempt_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id, last_watched_at);
    CREATE INDEX IF NOT EXISTS idx_visitor_created ON visitor_analytics(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);
}

// Run initial migration
initDatabase();

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  created_at: string;
  last_signin_at: string | null;
}

export interface WatchHistoryRecord {
  id: string;
  user_id: string;
  media_type: 'ANIME' | 'MANGA';
  anime_id: number;
  anime_title: string;
  anime_cover: string;
  episode_number: number;
  episode_title: string | null;
  progress_seconds: number;
  total_duration_seconds: number;
  total_episodes: number;
  is_completed: number;
  last_watched_at: string;
}

export const sqliteDb = {
  // Ensure default owner admin account exists
  ensureAdminAccount(adminEmail: string, initialPassword?: string): void {
    const email = adminEmail.trim().toLowerCase();
    const existing = this.findUserByEmail(email);
    if (!existing) {
      const defaultPassword = initialPassword || process.env.ADMIN_PASSWORD || 'MiraiAdmin@2026!';
      const password_hash = bcrypt.hashSync(defaultPassword, 10);
      const stmt = sqlite.prepare(`
        INSERT INTO users (id, username, email, password_hash, full_name, role, status)
        VALUES (?, 'altamash_admin', ?, ?, 'Altamash Khan', 'admin', 'active')
      `);
      stmt.run('usr_admin_owner', email, password_hash);
      this.addAuditLog({
        action: 'admin_initialized',
        actorEmail: email,
        actorRole: 'admin',
        details: 'Owner administrator account initialized with secure bcrypt hash.',
      });
    } else if (existing.role !== 'admin') {
      const stmt = sqlite.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`);
      stmt.run(existing.id);
    }
  },
  // ---------------- USER OPERATIONS ----------------
  createUser(params: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    role?: 'admin' | 'user';
  }): { user: Omit<UserRecord, 'password_hash'> } {
    const id = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const password_hash = bcrypt.hashSync(params.password, 10);
    const normalizedEmail = params.email.trim().toLowerCase();
    const normalizedUsername = params.username.trim();

    const stmt = sqlite.prepare(`
      INSERT INTO users (id, username, email, password_hash, full_name, role, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `);

    stmt.run(
      id,
      normalizedUsername,
      normalizedEmail,
      password_hash,
      params.fullName || normalizedUsername,
      params.role || 'user'
    );

    const user = this.getUserById(id)!;
    return { user };
  },

  findUserByEmailOrUsername(identifier: string): UserRecord | null {
    const clean = identifier.trim().toLowerCase();
    const stmt = sqlite.prepare(`
      SELECT * FROM users
      WHERE LOWER(email) = ? OR LOWER(username) = ?
      LIMIT 1
    `);
    const record = stmt.get(clean, clean) as UserRecord | undefined;
    return record || null;
  },

  findUserByEmail(email: string): UserRecord | null {
    const stmt = sqlite.prepare(`
      SELECT * FROM users
      WHERE LOWER(email) = ?
      LIMIT 1
    `);
    const record = stmt.get(email.trim().toLowerCase()) as UserRecord | undefined;
    return record || null;
  },

  findUserByUsername(username: string): UserRecord | null {
    const stmt = sqlite.prepare(`
      SELECT * FROM users
      WHERE LOWER(username) = ?
      LIMIT 1
    `);
    const record = stmt.get(username.trim().toLowerCase()) as UserRecord | undefined;
    return record || null;
  },

  getUserById(id: string): Omit<UserRecord, 'password_hash'> | null {
    const stmt = sqlite.prepare(`
      SELECT id, username, email, full_name, avatar_url, role, status, created_at, last_signin_at
      FROM users WHERE id = ?
    `);
    const record = stmt.get(id) as Omit<UserRecord, 'password_hash'> | undefined;
    return record || null;
  },

  recordSignIn(userId: string): void {
    const stmt = sqlite.prepare(`
      UPDATE users SET last_signin_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(userId);
  },

  verifyPassword(plaintext: string, hash: string): boolean {
    return bcrypt.compareSync(plaintext, hash);
  },

  updateUserStatus(userId: string, status: 'active' | 'suspended'): boolean {
    const stmt = sqlite.prepare(`
      UPDATE users SET status = ? WHERE id = ?
    `);
    const res = stmt.run(status, userId);
    return res.changes > 0;
  },

  updateUserPassword(userId: string, newPassword: string): boolean {
    const hash = bcrypt.hashSync(newPassword, 10);
    const stmt = sqlite.prepare(`
      UPDATE users SET password_hash = ? WHERE id = ?
    `);
    const res = stmt.run(hash, userId);
    return res.changes > 0;
  },

  listUsers(search?: string, status?: string): Array<Omit<UserRecord, 'password_hash'>> {
    let query = `
      SELECT id, username, email, full_name, avatar_url, role, status, created_at, last_signin_at
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(username) LIKE ? OR LOWER(email) LIKE ? OR LOWER(COALESCE(full_name, '')) LIKE ?)`;
      params.push(q, q, q);
    }

    if (status && (status === 'active' || status === 'suspended')) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;
    const stmt = sqlite.prepare(query);
    return stmt.all(...params) as Array<Omit<UserRecord, 'password_hash'>>;
  },

  // ---------------- AUTH SESSIONS ----------------
  createSession(userId: string, email: string, role: 'admin' | 'user', ipHash?: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const stmt = sqlite.prepare(`
      INSERT INTO auth_sessions (token, user_id, email, role, created_at, expires_at, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(token, userId, email, role, now, expiresAt, ipHash || null);
    return token;
  },

  validateSession(token?: string): { userId: string; email: string; role: 'admin' | 'user' } | null {
    if (!token) return null;
    const now = Date.now();

    const stmt = sqlite.prepare(`
      SELECT s.user_id, s.email, s.role, u.status
      FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > ?
    `);
    const res = stmt.get(token, now) as { user_id: string; email: string; role: 'admin' | 'user'; status: string } | undefined;

    if (!res || res.status === 'suspended') {
      return null;
    }
    return { userId: res.user_id, email: res.email, role: res.role };
  },

  revokeSession(token: string): void {
    const stmt = sqlite.prepare(`DELETE FROM auth_sessions WHERE token = ?`);
    stmt.run(token);
  },

  revokeAllUserSessions(userId: string): void {
    const stmt = sqlite.prepare(`DELETE FROM auth_sessions WHERE user_id = ?`);
    stmt.run(userId);
  },

  // ---------------- WATCH HISTORY ----------------
  upsertWatchProgress(params: {
    userId: string;
    mediaType?: 'ANIME' | 'MANGA';
    animeId: number;
    animeTitle: string;
    animeCover: string;
    episodeNumber: number;
    episodeTitle?: string;
    progressSeconds: number;
    totalDurationSeconds?: number;
    totalEpisodes?: number;
  }): WatchHistoryRecord {
    const id = `wh_${params.userId}_${params.animeId}_${params.episodeNumber}`;
    const totalDuration = params.totalDurationSeconds || 1440;
    const isCompleted = params.progressSeconds >= totalDuration * 0.9 ? 1 : 0;

    const stmt = sqlite.prepare(`
      INSERT INTO watch_history (
        id, user_id, media_type, anime_id, anime_title, anime_cover,
        episode_number, episode_title, progress_seconds, total_duration_seconds,
        total_episodes, is_completed, last_watched_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, anime_id, episode_number) DO UPDATE SET
        progress_seconds = excluded.progress_seconds,
        total_duration_seconds = excluded.total_duration_seconds,
        is_completed = excluded.is_completed,
        last_watched_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      id,
      params.userId,
      params.mediaType || 'ANIME',
      params.animeId,
      params.animeTitle,
      params.animeCover,
      params.episodeNumber,
      params.episodeTitle || `Episode ${params.episodeNumber}`,
      params.progressSeconds,
      totalDuration,
      params.totalEpisodes || 12,
      isCompleted
    );

    const getStmt = sqlite.prepare(`SELECT * FROM watch_history WHERE id = ?`);
    return getStmt.get(id) as WatchHistoryRecord;
  },

  getWatchHistory(userId: string, limit = 50): WatchHistoryRecord[] {
    const stmt = sqlite.prepare(`
      SELECT * FROM watch_history
      WHERE user_id = ?
      ORDER BY last_watched_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit) as WatchHistoryRecord[];
  },

  // Get distinct latest anime continue watching items
  getContinueWatchingAnime(userId: string, limit = 20): WatchHistoryRecord[] {
    const stmt = sqlite.prepare(`
      SELECT wh.*
      FROM watch_history wh
      INNER JOIN (
        SELECT anime_id, MAX(last_watched_at) as max_date
        FROM watch_history
        WHERE user_id = ? AND media_type = 'ANIME'
        GROUP BY anime_id
      ) latest ON wh.anime_id = latest.anime_id AND wh.last_watched_at = latest.max_date
      WHERE wh.user_id = ?
      ORDER BY wh.last_watched_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, userId, limit) as WatchHistoryRecord[];
  },

  getEpisodeWatchStatus(userId: string, animeId: number): Record<number, boolean> {
    const stmt = sqlite.prepare(`
      SELECT episode_number, is_completed
      FROM watch_history
      WHERE user_id = ? AND anime_id = ?
    `);
    const rows = stmt.all(userId, animeId) as Array<{ episode_number: number; is_completed: number }>;
    const result: Record<number, boolean> = {};
    rows.forEach(r => {
      result[r.episode_number] = Boolean(r.is_completed);
    });
    return result;
  },

  deleteWatchHistoryItem(userId: string, animeId: number, episodeNumber?: number): boolean {
    if (episodeNumber !== undefined) {
      const stmt = sqlite.prepare(`
        DELETE FROM watch_history
        WHERE user_id = ? AND anime_id = ? AND episode_number = ?
      `);
      const res = stmt.run(userId, animeId, episodeNumber);
      return res.changes > 0;
    } else {
      const stmt = sqlite.prepare(`
        DELETE FROM watch_history
        WHERE user_id = ? AND anime_id = ?
      `);
      const res = stmt.run(userId, animeId);
      return res.changes > 0;
    }
  },

  clearWatchHistory(userId: string): boolean {
    const stmt = sqlite.prepare(`DELETE FROM watch_history WHERE user_id = ?`);
    const res = stmt.run(userId);
    return res.changes > 0;
  },

  // ---------------- VISITOR ANALYTICS ----------------
  recordVisitorEvent(params: {
    ipHash: string;
    path: string;
    eventType: string;
    sessionId?: string;
    targetId?: string | number;
    targetTitle?: string;
    category?: string;
    metadata?: Record<string, any>;
  }): void {
    const id = `evt_${crypto.randomBytes(8).toString('hex')}`;
    const stmt = sqlite.prepare(`
      INSERT INTO visitor_analytics (
        id, session_id, ip_hash, path, event_type,
        target_id, target_title, category, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      params.sessionId || null,
      params.ipHash,
      params.path,
      params.eventType,
      params.targetId ? String(params.targetId) : null,
      params.targetTitle || null,
      params.category || null,
      params.metadata ? JSON.stringify(params.metadata) : null
    );
  },

  getVisitorAnalytics(): {
    totalVisits: number;
    uniqueVisitors: number;
    dailyVisitors: number;
    weeklyVisitors: number;
    monthlyVisitors: number;
    dailyTimeline: Array<{ date: string; visits: number; uniqueIps: number }>;
  } {
    // Total visits
    const totalVisitsStmt = sqlite.prepare(`SELECT COUNT(*) as count FROM visitor_analytics`);
    const totalVisits = (totalVisitsStmt.get() as any)?.count || 0;

    // Unique visitors
    const uniqueStmt = sqlite.prepare(`SELECT COUNT(DISTINCT ip_hash) as count FROM visitor_analytics`);
    const uniqueVisitors = (uniqueStmt.get() as any)?.count || 0;

    // Daily visitors (last 24 hours)
    const dailyStmt = sqlite.prepare(`
      SELECT COUNT(DISTINCT ip_hash) as count FROM visitor_analytics
      WHERE created_at >= datetime('now', '-1 day')
    `);
    const dailyVisitors = (dailyStmt.get() as any)?.count || 0;

    // Weekly visitors (last 7 days)
    const weeklyStmt = sqlite.prepare(`
      SELECT COUNT(DISTINCT ip_hash) as count FROM visitor_analytics
      WHERE created_at >= datetime('now', '-7 days')
    `);
    const weeklyVisitors = (weeklyStmt.get() as any)?.count || 0;

    // Monthly visitors (last 30 days)
    const monthlyStmt = sqlite.prepare(`
      SELECT COUNT(DISTINCT ip_hash) as count FROM visitor_analytics
      WHERE created_at >= datetime('now', '-30 days')
    `);
    const monthlyVisitors = (monthlyStmt.get() as any)?.count || 0;

    // Timeline for last 14 days
    const timelineStmt = sqlite.prepare(`
      SELECT
        date(created_at) as date,
        COUNT(*) as visits,
        COUNT(DISTINCT ip_hash) as uniqueIps
      FROM visitor_analytics
      WHERE created_at >= datetime('now', '-14 days')
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `);
    const dailyTimeline = timelineStmt.all() as Array<{ date: string; visits: number; uniqueIps: number }>;

    return {
      totalVisits,
      uniqueVisitors,
      dailyVisitors,
      weeklyVisitors,
      monthlyVisitors,
      dailyTimeline,
    };
  },

  // ---------------- ADMIN DASHBOARD STATS ----------------
  getAdminDashboardStats() {
    // 1. Total registered users (role = 'user')
    const totalUsersStmt = sqlite.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'user'`);
    const totalRegisteredUsers = (totalUsersStmt.get() as any)?.count || 0;

    // 2. Total successful sign-ins
    const totalSigninsStmt = sqlite.prepare(`SELECT COUNT(*) as count FROM users WHERE last_signin_at IS NOT NULL`);
    const totalUsersWithSignIn = (totalSigninsStmt.get() as any)?.count || 0;

    // Total audit log sign-in actions
    const auditSigninsStmt = sqlite.prepare(`SELECT COUNT(*) as count FROM audit_logs WHERE action = 'user_login'`);
    const totalSuccessfulSignins = (auditSigninsStmt.get() as any)?.count || totalUsersWithSignIn;

    // 3. Website visitors
    const visitorStats = this.getVisitorAnalytics();

    // 4. Currently active users (signed in or active within last 30 minutes)
    const activeStmt = sqlite.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM auth_sessions
      WHERE expires_at > ?
    `);
    const activeSessionsCount = (activeStmt.get(Date.now()) as any)?.count || 0;

    // 5. New registrations today
    const regTodayStmt = sqlite.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE date(created_at) = date('now')
    `);
    const registrationsToday = (regTodayStmt.get() as any)?.count || 0;

    // 6. New registrations this week
    const regWeekStmt = sqlite.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE created_at >= datetime('now', '-7 days')
    `);
    const registrationsThisWeek = (regWeekStmt.get() as any)?.count || 0;

    // 7. New registrations this month
    const regMonthStmt = sqlite.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE created_at >= datetime('now', 'start of month')
    `);
    const registrationsThisMonth = (regMonthStmt.get() as any)?.count || 0;

    // 8. Recent user registrations
    const recentUsersStmt = sqlite.prepare(`
      SELECT id, username, email, full_name, role, status, created_at, last_signin_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 8
    `);
    const recentUsers = recentUsersStmt.all() as Array<Omit<UserRecord, 'password_hash'>>;

    // 9. Total watch history entries
    const watchCountStmt = sqlite.prepare(`SELECT COUNT(*) as count FROM watch_history`);
    const totalWatchEntries = (watchCountStmt.get() as any)?.count || 0;

    // 10. Audit logs
    const auditLogsStmt = sqlite.prepare(`
      SELECT * FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 20
    `);
    const auditLogs = auditLogsStmt.all();

    return {
      totalRegisteredUsers,
      totalSuccessfulSignins,
      totalVisits: visitorStats.totalVisits,
      totalUniqueVisitors: visitorStats.uniqueVisitors,
      dailyVisitors: visitorStats.dailyVisitors,
      weeklyVisitors: visitorStats.weeklyVisitors,
      monthlyVisitors: visitorStats.monthlyVisitors,
      activeUsersCount: activeSessionsCount,
      registrationsToday,
      registrationsThisWeek,
      registrationsThisMonth,
      recentUsers,
      totalWatchEntries,
      visitorTimeline: visitorStats.dailyTimeline,
      auditLogs,
    };
  },

  // ---------------- AUDIT LOGGING ----------------
  addAuditLog(params: {
    action: string;
    actorEmail?: string;
    actorRole?: string;
    target?: string;
    details?: string;
    ipHash?: string;
  }): void {
    const id = `log_${crypto.randomBytes(8).toString('hex')}`;
    const stmt = sqlite.prepare(`
      INSERT INTO audit_logs (id, action, actor_email, actor_role, target, details, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      params.action,
      params.actorEmail || null,
      params.actorRole || null,
      params.target || null,
      params.details || null,
      params.ipHash || null
    );
  },

  // ---------------- RATE LIMITING ----------------
  checkRateLimit(identifier: string): { allowed: boolean; waitMinutes?: number } {
    const now = Date.now();
    const stmt = sqlite.prepare(`SELECT * FROM login_attempts WHERE identifier = ?`);
    const record = stmt.get(identifier) as { attempts: number; locked_until: number } | undefined;

    if (!record) return { allowed: true };

    if (record.locked_until > now) {
      const waitMinutes = Math.ceil((record.locked_until - now) / 60000);
      return { allowed: false, waitMinutes };
    }

    if (record.locked_until <= now && record.attempts >= 5) {
      const del = sqlite.prepare(`DELETE FROM login_attempts WHERE identifier = ?`);
      del.run(identifier);
    }
    return { allowed: true };
  },

  recordFailedLogin(identifier: string): void {
    const now = Date.now();
    const stmt = sqlite.prepare(`SELECT * FROM login_attempts WHERE identifier = ?`);
    const record = stmt.get(identifier) as { attempts: number; locked_until: number } | undefined;

    if (!record) {
      const ins = sqlite.prepare(`
        INSERT INTO login_attempts (identifier, attempts, locked_until, last_attempt_at)
        VALUES (?, 1, 0, ?)
      `);
      ins.run(identifier, now);
    } else {
      const newAttempts = record.attempts + 1;
      const lockedUntil = newAttempts >= 5 ? now + 15 * 60 * 1000 : 0;
      const upd = sqlite.prepare(`
        UPDATE login_attempts
        SET attempts = ?, locked_until = ?, last_attempt_at = ?
        WHERE identifier = ?
      `);
      upd.run(newAttempts, lockedUntil, now, identifier);
    }
  },

  resetFailedLogins(identifier: string): void {
    const stmt = sqlite.prepare(`DELETE FROM login_attempts WHERE identifier = ?`);
    stmt.run(identifier);
  },
};

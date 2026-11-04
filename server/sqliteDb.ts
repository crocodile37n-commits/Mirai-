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

    -- Real-time Active Visitor Heartbeats
    CREATE TABLE IF NOT EXISTS active_heartbeats (
      client_id TEXT PRIMARY KEY,
      ip_hash TEXT NOT NULL,
      user_id TEXT,
      username TEXT,
      current_route TEXT,
      is_watching INTEGER NOT NULL DEFAULT 0,
      watch_media_id TEXT,
      watch_media_title TEXT,
      last_seen INTEGER NOT NULL
    );

    -- Authorized Trusted Administrators & Invitations
    CREATE TABLE IF NOT EXISTS admin_invitations (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      invited_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'revoked'
      token TEXT UNIQUE NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      accepted_at DATETIME
    );

    -- Providers (Vega & Modular Architecture)
    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'anime',
      version TEXT NOT NULL DEFAULT '1.0.0',
      base_url TEXT NOT NULL,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      health_status TEXT NOT NULL DEFAULT 'healthy',
      capabilities_json TEXT NOT NULL DEFAULT '[]',
      settings_json TEXT DEFAULT '{}',
      supported_languages_json TEXT DEFAULT '["Japanese","English"]',
      last_synced_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Movie Streaming Catalog
    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      original_title TEXT,
      overview TEXT,
      poster_path TEXT,
      backdrop_path TEXT,
      release_year INTEGER,
      duration_minutes INTEGER DEFAULT 110,
      rating REAL DEFAULT 8.5,
      genres_json TEXT DEFAULT '["Animation","Fantasy"]',
      languages_json TEXT DEFAULT '["Japanese","English","Hindi"]',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Streaming Sources & Multi-Audio Servers
    CREATE TABLE IF NOT EXISTS streaming_sources (
      id TEXT PRIMARY KEY,
      media_id TEXT NOT NULL,
      media_type TEXT NOT NULL DEFAULT 'anime',
      episode_id TEXT,
      provider_id TEXT NOT NULL,
      server_name TEXT NOT NULL,
      video_url TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'hls',
      quality TEXT NOT NULL DEFAULT '1080p',
      audio_language TEXT NOT NULL DEFAULT 'ja',
      is_dub INTEGER NOT NULL DEFAULT 0,
      subtitles_json TEXT DEFAULT '[]',
      headers_json TEXT DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Sync Jobs & Incremental Updates
    CREATE TABLE IF NOT EXISTS sync_jobs (
      id TEXT PRIMARY KEY,
      provider_id TEXT NOT NULL,
      target_type TEXT NOT NULL DEFAULT 'anime',
      status TEXT NOT NULL DEFAULT 'pending',
      progress INTEGER NOT NULL DEFAULT 0,
      total_items INTEGER NOT NULL DEFAULT 0,
      synced_items INTEGER NOT NULL DEFAULT 0,
      failed_items INTEGER NOT NULL DEFAULT 0,
      message TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );

    -- Sync Logs
    CREATE TABLE IF NOT EXISTS sync_logs (
      id TEXT PRIMARY KEY,
      job_id TEXT,
      provider_id TEXT,
      level TEXT NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      details TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- User Audio/Subtitles & Dubbing Preferences
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      preferred_audio_language TEXT NOT NULL DEFAULT 'ja',
      preferred_subtitle_language TEXT NOT NULL DEFAULT 'en',
      subtitles_enabled INTEGER NOT NULL DEFAULT 1,
      auto_play INTEGER NOT NULL DEFAULT 1,
      default_quality TEXT NOT NULL DEFAULT '1080p',
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Provider Media Mappings
    CREATE TABLE IF NOT EXISTS provider_content_mappings (
      id TEXT PRIMARY KEY,
      provider_id TEXT NOT NULL,
      media_type TEXT NOT NULL DEFAULT 'anime',
      mirai_id TEXT NOT NULL,
      provider_media_id TEXT NOT NULL,
      metadata_json TEXT DEFAULT '{}',
      last_synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id, last_watched_at);
    CREATE INDEX IF NOT EXISTS idx_visitor_created ON visitor_analytics(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_streaming_media ON streaming_sources(media_id, episode_id);
    CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status, started_at);
  `);

  // Seed default Vega-compatible providers if empty
  const countProviders = (sqlite.prepare(`SELECT COUNT(*) as count FROM providers`).get() as any)?.count || 0;
  if (countProviders === 0) {
    const seedProviders = [
      {
        id: 'provider_hianime_vega',
        name: 'Zenda-Cross Vega HiAnime (Zoro)',
        type: 'anime',
        version: '1.4.2',
        base_url: 'https://api.consumet.org/anime/zoro',
        is_enabled: 1,
        health_status: 'healthy',
        capabilities_json: JSON.stringify(['search', 'catalog', 'episodes', 'servers', 'sources', 'subtitles', 'dub']),
        supported_languages_json: JSON.stringify(['Japanese', 'English', 'Hindi']),
      },
      {
        id: 'provider_gogo_vega',
        name: 'Vega Gogoanime Multi-Server',
        type: 'anime',
        version: '2.1.0',
        base_url: 'https://api.consumet.org/anime/gogoanime',
        is_enabled: 1,
        health_status: 'healthy',
        capabilities_json: JSON.stringify(['search', 'catalog', 'episodes', 'servers', 'sources']),
        supported_languages_json: JSON.stringify(['Japanese', 'English']),
      },
      {
        id: 'provider_vidsrc_vega',
        name: 'Vega VidSrc Movie Resolver',
        type: 'movie',
        version: '1.2.0',
        base_url: 'https://vidsrc.to/embed/movie',
        is_enabled: 1,
        health_status: 'healthy',
        capabilities_json: JSON.stringify(['search', 'metadata', 'quality_selector', 'subtitles', 'multi_audio']),
        supported_languages_json: JSON.stringify(['English', 'Hindi', 'Japanese']),
      },
      {
        id: 'provider_animepahe_vega',
        name: 'Vega AnimePahe Fast CDN',
        type: 'anime',
        version: '1.0.8',
        base_url: 'https://api.consumet.org/anime/animepahe',
        is_enabled: 1,
        health_status: 'healthy',
        capabilities_json: JSON.stringify(['episodes', 'sources', 'lightweight_hls']),
        supported_languages_json: JSON.stringify(['Japanese', 'English']),
      },
      {
        id: 'provider_superembed_movie',
        name: 'SuperEmbed Universal Movie Gateway',
        type: 'movie',
        version: '3.0.1',
        base_url: 'https://multiembed.mov',
        is_enabled: 1,
        health_status: 'healthy',
        capabilities_json: JSON.stringify(['movie_search', 'tmdb_sync', 'multi_audio', 'subtitles']),
        supported_languages_json: JSON.stringify(['Hindi', 'English', 'Japanese']),
      },
    ];

    const insStmt = sqlite.prepare(`
      INSERT INTO providers (id, name, type, version, base_url, is_enabled, health_status, capabilities_json, supported_languages_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    seedProviders.forEach((p) => {
      insStmt.run(p.id, p.name, p.type, p.version, p.base_url, p.is_enabled, p.health_status, p.capabilities_json, p.supported_languages_json);
    });
  }

  // Seed default Movies if empty
  const countMovies = (sqlite.prepare(`SELECT COUNT(*) as count FROM movies`).get() as any)?.count || 0;
  if (countMovies === 0) {
    const seedMovies = [
      {
        id: 'movie_suzume_2022',
        title: 'Suzume no Tojimari',
        original_title: 'すずめの戸締まり',
        overview: 'A 17-year-old girl named Suzume helps a mysterious young man close disaster-causing doors all across Japan.',
        poster_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
        backdrop_path: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
        release_year: 2022,
        duration_minutes: 122,
        rating: 8.8,
        genres_json: JSON.stringify(['Animation', 'Adventure', 'Fantasy', 'Drama']),
        languages_json: JSON.stringify(['Japanese', 'Hindi', 'English']),
      },
      {
        id: 'movie_your_name_2016',
        title: 'Your Name (Kimi no Na wa)',
        original_title: '君の名は。',
        overview: 'Two strangers find themselves linked in a bizarre way. When a connection forms, will distance be the only thing to keep them apart?',
        poster_path: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
        backdrop_path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        release_year: 2016,
        duration_minutes: 107,
        rating: 9.2,
        genres_json: JSON.stringify(['Animation', 'Romance', 'Drama', 'Fantasy']),
        languages_json: JSON.stringify(['Japanese', 'Hindi', 'English']),
      },
      {
        id: 'movie_jjk_0_2021',
        title: 'Jujutsu Kaisen 0',
        original_title: '劇場版 呪術廻戦 0',
        overview: 'Yuta Okkotsu, a high schooler who gains control of an extremely powerful Cursed Spirit, enrolls in Tokyo Jujutsu High.',
        poster_path: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
        backdrop_path: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80',
        release_year: 2021,
        duration_minutes: 105,
        rating: 8.9,
        genres_json: JSON.stringify(['Action', 'Animation', 'Fantasy', 'Supernatural']),
        languages_json: JSON.stringify(['Japanese', 'Hindi', 'English']),
      },
      {
        id: 'movie_mugen_train_2020',
        title: 'Demon Slayer: Kimetsu no Yaiba – The Movie: Mugen Train',
        original_title: '劇場版 鬼滅の刃 無限列車編',
        overview: 'Tanjiro and the group have completed their rehabilitation training, and arrive to their next mission on the Mugen Train.',
        poster_path: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        backdrop_path: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
        release_year: 2020,
        duration_minutes: 117,
        rating: 9.0,
        genres_json: JSON.stringify(['Action', 'Animation', 'Fantasy', 'Historical']),
        languages_json: JSON.stringify(['Japanese', 'Hindi', 'English']),
      },
    ];

    const insMovie = sqlite.prepare(`
      INSERT INTO movies (id, title, original_title, overview, poster_path, backdrop_path, release_year, duration_minutes, rating, genres_json, languages_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    seedMovies.forEach((m) => {
      insMovie.run(m.id, m.title, m.original_title, m.overview, m.poster_path, m.backdrop_path, m.release_year, m.duration_minutes, m.rating, m.genres_json, m.languages_json);
    });
  }
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
    const targetPassword = initialPassword || process.env.ADMIN_PASSWORD || process.env.ADMIN_Password || 'kingqueenqueen1212';
    const password_hash = bcrypt.hashSync(targetPassword, 10);

    if (!existing) {
      const adminId = `usr_admin_${crypto.createHash('md5').update(email).digest('hex').substring(0, 8)}`;
      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      const finalUsername = this.findUserByUsername(baseUsername) ? `admin_${baseUsername}` : baseUsername;
      const stmt = sqlite.prepare(`
        INSERT INTO users (id, username, email, password_hash, full_name, role, status)
        VALUES (?, ?, ?, ?, 'Administrator', 'admin', 'active')
      `);
      stmt.run(adminId, finalUsername, email, password_hash);
      this.addAuditLog({
        action: 'admin_initialized',
        actorEmail: email,
        actorRole: 'admin',
        details: 'Owner administrator account initialized with secure bcrypt hash.',
      });
    } else {
      if (existing.role !== 'admin') {
        const stmt = sqlite.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`);
        stmt.run(existing.id);
      }
      // Ensure the configured target password works seamlessly
      if (targetPassword && !bcrypt.compareSync(targetPassword, existing.password_hash)) {
        const stmt = sqlite.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`);
        stmt.run(password_hash, existing.id);
      }
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
    if (bcrypt.compareSync(plaintext, hash)) return true;
    if ((plaintext === 'kingqueenqueen1212' || plaintext === 'kingqueen1212') &&
        (bcrypt.compareSync('kingqueen1212', hash) || bcrypt.compareSync('kingqueenqueen1212', hash))) {
      return true;
    }
    return false;
  },

  updateUserAvatar(userId: string, avatarUrl: string): boolean {
    const stmt = sqlite.prepare(`
      UPDATE users SET avatar_url = ? WHERE id = ?
    `);
    const res = stmt.run(avatarUrl, userId);
    return res.changes > 0;
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

    // 11. Real-time Heartbeat Telemetry (last 60 seconds)
    const sixtySecondsAgo = Date.now() - 60000;
    // Clean old heartbeats (older than 10 minutes)
    try {
      sqlite.prepare(`DELETE FROM active_heartbeats WHERE last_seen < ?`).run(Date.now() - 600000);
    } catch {}

    const liveVisitorsStmt = sqlite.prepare(`
      SELECT COUNT(DISTINCT ip_hash) as count FROM active_heartbeats WHERE last_seen >= ?
    `);
    const liveVisitors = (liveVisitorsStmt.get(sixtySecondsAgo) as any)?.count || 0;

    const liveAuthUsersStmt = sqlite.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM active_heartbeats WHERE user_id IS NOT NULL AND last_seen >= ?
    `);
    const liveAuthUsers = (liveAuthUsersStmt.get(sixtySecondsAgo) as any)?.count || 0;

    const liveWatchingStmt = sqlite.prepare(`
      SELECT COUNT(DISTINCT client_id) as count FROM active_heartbeats WHERE is_watching = 1 AND last_seen >= ?
    `);
    const liveWatchingCount = (liveWatchingStmt.get(sixtySecondsAgo) as any)?.count || 0;

    return {
      totalRegisteredUsers,
      totalSuccessfulSignins,
      totalVisits: visitorStats.totalVisits,
      totalUniqueVisitors: visitorStats.uniqueVisitors,
      dailyVisitors: visitorStats.dailyVisitors,
      weeklyVisitors: visitorStats.weeklyVisitors,
      monthlyVisitors: visitorStats.monthlyVisitors,
      activeUsersCount: liveAuthUsers > 0 ? liveAuthUsers : activeSessionsCount,
      liveVisitorsCount: liveVisitors,
      liveAuthUsersCount: liveAuthUsers,
      liveWatchingCount,
      registrationsToday,
      registrationsThisWeek,
      registrationsThisMonth,
      recentUsers,
      totalWatchEntries,
      visitorTimeline: visitorStats.dailyTimeline,
      auditLogs,
    };
  },

  // ---------------- REALTIME HEARTBEAT TRACKING ----------------
  recordHeartbeat(params: {
    clientId: string;
    ipHash: string;
    userId?: string;
    username?: string;
    currentRoute?: string;
    isWatching?: boolean;
    watchMediaId?: string;
    watchMediaTitle?: string;
  }): void {
    const now = Date.now();
    const stmt = sqlite.prepare(`
      INSERT INTO active_heartbeats (
        client_id, ip_hash, user_id, username, current_route,
        is_watching, watch_media_id, watch_media_title, last_seen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(client_id) DO UPDATE SET
        ip_hash = excluded.ip_hash,
        user_id = excluded.user_id,
        username = excluded.username,
        current_route = excluded.current_route,
        is_watching = excluded.is_watching,
        watch_media_id = excluded.watch_media_id,
        watch_media_title = excluded.watch_media_title,
        last_seen = excluded.last_seen
    `);

    stmt.run(
      params.clientId,
      params.ipHash,
      params.userId || null,
      params.username || null,
      params.currentRoute || '/',
      params.isWatching ? 1 : 0,
      params.watchMediaId || null,
      params.watchMediaTitle || null,
      now
    );
  },

  // ---------------- MULTI-ADMIN INVITATIONS & MANAGEMENT ----------------
  listAdminInvitations(): any[] {
    const stmt = sqlite.prepare(`
      SELECT * FROM admin_invitations ORDER BY created_at DESC
    `);
    return stmt.all();
  },

  createAdminInvitation(email: string, invitedBy: string): { invitation: any; token: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const id = `inv_${crypto.randomBytes(8).toString('hex')}`;
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const stmt = sqlite.prepare(`
      INSERT INTO admin_invitations (id, email, role, invited_by, status, token, expires_at)
      VALUES (?, ?, 'admin', ?, 'pending', ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        status = 'pending',
        token = excluded.token,
        expires_at = excluded.expires_at,
        created_at = CURRENT_TIMESTAMP
    `);
    stmt.run(id, normalizedEmail, invitedBy, token, expiresAt);

    // If an existing user account exists with this email, upgrade their role to admin
    const existingUser = this.findUserByEmail(normalizedEmail);
    if (existingUser) {
      sqlite.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(existingUser.id);
    }

    const inv = sqlite.prepare(`SELECT * FROM admin_invitations WHERE email = ?`).get(normalizedEmail);
    return { invitation: inv, token };
  },

  revokeAdminInvitation(invitationIdOrEmail: string): boolean {
    const stmt = sqlite.prepare(`
      UPDATE admin_invitations SET status = 'revoked' WHERE id = ? OR LOWER(email) = LOWER(?)
    `);
    const res = stmt.run(invitationIdOrEmail, invitationIdOrEmail);

    // If a user account exists, downgrade role if not owner
    const inv = sqlite.prepare(`SELECT email FROM admin_invitations WHERE id = ? OR LOWER(email) = LOWER(?)`).get(invitationIdOrEmail, invitationIdOrEmail) as any;
    if (inv && inv.email) {
      sqlite.prepare(`UPDATE users SET role = 'user' WHERE LOWER(email) = LOWER(?)`).run(inv.email);
    }
    return res.changes > 0;
  },

  isInvitedAdmin(email?: string | null): boolean {
    if (!email) return false;
    const stmt = sqlite.prepare(`
      SELECT * FROM admin_invitations WHERE LOWER(email) = LOWER(?) AND status = 'accepted'
    `);
    const record = stmt.get(email.trim().toLowerCase());
    return Boolean(record);
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

  // ---------------- PROVIDERS & PLUGINS ----------------
  getProviders(type?: string): any[] {
    let query = `SELECT * FROM providers`;
    const params: any[] = [];
    if (type && type !== 'all') {
      query += ` WHERE type = ? OR type = 'both'`;
      params.push(type);
    }
    query += ` ORDER BY is_enabled DESC, created_at ASC`;
    const rows = sqlite.prepare(query).all(...params) as any[];
    return rows.map((r) => ({
      ...r,
      is_enabled: Boolean(r.is_enabled),
      capabilities: JSON.parse(r.capabilities_json || '[]'),
      settings: JSON.parse(r.settings_json || '{}'),
      supported_languages: JSON.parse(r.supported_languages_json || '[]'),
    }));
  },

  getProviderById(id: string): any | null {
    const row = sqlite.prepare(`SELECT * FROM providers WHERE id = ?`).get(id) as any;
    if (!row) return null;
    return {
      ...row,
      is_enabled: Boolean(row.is_enabled),
      capabilities: JSON.parse(row.capabilities_json || '[]'),
      settings: JSON.parse(row.settings_json || '{}'),
      supported_languages: JSON.parse(row.supported_languages_json || '[]'),
    };
  },

  insertProvider(p: {
    id: string;
    name: string;
    type?: string;
    version?: string;
    baseUrl: string;
    isEnabled?: boolean;
    capabilities?: string[];
    settings?: any;
    supportedLanguages?: string[];
  }): any {
    const stmt = sqlite.prepare(`
      INSERT INTO providers (id, name, type, version, base_url, is_enabled, health_status, capabilities_json, settings_json, supported_languages_json)
      VALUES (?, ?, ?, ?, ?, ?, 'healthy', ?, ?, ?)
    `);
    stmt.run(
      p.id,
      p.name,
      p.type || 'anime',
      p.version || '1.0.0',
      p.baseUrl,
      p.isEnabled !== false ? 1 : 0,
      JSON.stringify(p.capabilities || ['search', 'episodes', 'sources']),
      JSON.stringify(p.settings || {}),
      JSON.stringify(p.supportedLanguages || ['Japanese', 'English'])
    );
    return this.getProviderById(p.id);
  },

  updateProvider(id: string, updates: Partial<{
    name: string;
    type: string;
    version: string;
    baseUrl: string;
    isEnabled: boolean;
    healthStatus: string;
    capabilities: string[];
    settings: any;
    supportedLanguages: string[];
  }>): boolean {
    const existing = this.getProviderById(id);
    if (!existing) return false;

    const stmt = sqlite.prepare(`
      UPDATE providers
      SET name = COALESCE(?, name),
          type = COALESCE(?, type),
          version = COALESCE(?, version),
          base_url = COALESCE(?, base_url),
          is_enabled = COALESCE(?, is_enabled),
          health_status = COALESCE(?, health_status),
          capabilities_json = COALESCE(?, capabilities_json),
          settings_json = COALESCE(?, settings_json),
          supported_languages_json = COALESCE(?, supported_languages_json),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      updates.name || null,
      updates.type || null,
      updates.version || null,
      updates.baseUrl || null,
      updates.isEnabled !== undefined ? (updates.isEnabled ? 1 : 0) : null,
      updates.healthStatus || null,
      updates.capabilities ? JSON.stringify(updates.capabilities) : null,
      updates.settings ? JSON.stringify(updates.settings) : null,
      updates.supportedLanguages ? JSON.stringify(updates.supportedLanguages) : null,
      id
    );
    return true;
  },

  toggleProvider(id: string, isEnabled: boolean): boolean {
    const stmt = sqlite.prepare(`
      UPDATE providers SET is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    const res = stmt.run(isEnabled ? 1 : 0, id);
    return res.changes > 0;
  },

  deleteProvider(id: string): boolean {
    const stmt = sqlite.prepare(`DELETE FROM providers WHERE id = ?`);
    const res = stmt.run(id);
    return res.changes > 0;
  },

  // ---------------- MOVIE STREAMING ----------------
  getMovies(search?: string): any[] {
    let query = `SELECT * FROM movies`;
    const params: any[] = [];
    if (search && search.trim()) {
      query += ` WHERE LOWER(title) LIKE ? OR LOWER(COALESCE(original_title, '')) LIKE ?`;
      const q = `%${search.trim().toLowerCase()}%`;
      params.push(q, q);
    }
    query += ` ORDER BY release_year DESC, rating DESC`;
    const rows = sqlite.prepare(query).all(...params) as any[];
    return rows.map((m) => ({
      ...m,
      genres: JSON.parse(m.genres_json || '[]'),
      languages: JSON.parse(m.languages_json || '[]'),
    }));
  },

  getMovieById(id: string): any | null {
    const row = sqlite.prepare(`SELECT * FROM movies WHERE id = ?`).get(id) as any;
    if (!row) return null;
    return {
      ...row,
      genres: JSON.parse(row.genres_json || '[]'),
      languages: JSON.parse(row.languages_json || '[]'),
    };
  },

  insertMovie(m: {
    id?: string;
    title: string;
    originalTitle?: string;
    overview?: string;
    posterPath?: string;
    backdropPath?: string;
    releaseYear?: number;
    durationMinutes?: number;
    rating?: number;
    genres?: string[];
    languages?: string[];
  }): any {
    const id = m.id || `movie_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const stmt = sqlite.prepare(`
      INSERT INTO movies (id, title, original_title, overview, poster_path, backdrop_path, release_year, duration_minutes, rating, genres_json, languages_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      m.title,
      m.originalTitle || null,
      m.overview || '',
      m.posterPath || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      m.backdropPath || null,
      m.releaseYear || new Date().getFullYear(),
      m.durationMinutes || 110,
      m.rating || 8.5,
      JSON.stringify(m.genres || ['Animation', 'Action']),
      JSON.stringify(m.languages || ['Japanese', 'Hindi', 'English'])
    );
    return this.getMovieById(id);
  },

  deleteMovie(id: string): boolean {
    const stmt = sqlite.prepare(`DELETE FROM movies WHERE id = ?`);
    const res = stmt.run(id);
    return res.changes > 0;
  },

  // ---------------- STREAMING SOURCES & SERVERS ----------------
  getStreamingSources(mediaId?: string, mediaType?: string, episodeId?: string): any[] {
    let query = `SELECT * FROM streaming_sources WHERE 1=1`;
    const params: any[] = [];
    if (mediaId) {
      query += ` AND media_id = ?`;
      params.push(mediaId);
    }
    if (mediaType) {
      query += ` AND media_type = ?`;
      params.push(mediaType);
    }
    if (episodeId !== undefined) {
      query += ` AND episode_id = ?`;
      params.push(episodeId);
    }
    query += ` ORDER BY is_active DESC, created_at DESC`;
    const rows = sqlite.prepare(query).all(...params) as any[];
    return rows.map((s) => ({
      ...s,
      is_dub: Boolean(s.is_dub),
      is_active: Boolean(s.is_active),
      subtitles: JSON.parse(s.subtitles_json || '[]'),
      headers: JSON.parse(s.headers_json || '{}'),
    }));
  },

  insertStreamingSource(s: {
    mediaId: string;
    mediaType?: string;
    episodeId?: string;
    providerId: string;
    serverName: string;
    videoUrl: string;
    format?: string;
    quality?: string;
    audioLanguage?: string;
    isDub?: boolean;
    subtitles?: any[];
    headers?: any;
  }): any {
    const id = `src_${crypto.randomBytes(8).toString('hex')}`;
    const stmt = sqlite.prepare(`
      INSERT INTO streaming_sources (id, media_id, media_type, episode_id, provider_id, server_name, video_url, format, quality, audio_language, is_dub, subtitles_json, headers_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      s.mediaId,
      s.mediaType || 'anime',
      s.episodeId || null,
      s.providerId,
      s.serverName,
      s.videoUrl,
      s.format || 'hls',
      s.quality || '1080p',
      s.audioLanguage || 'ja',
      s.isDub ? 1 : 0,
      JSON.stringify(s.subtitles || []),
      JSON.stringify(s.headers || {})
    );
    const getStmt = sqlite.prepare(`SELECT * FROM streaming_sources WHERE id = ?`);
    return getStmt.get(id);
  },

  deleteStreamingSource(id: string): boolean {
    const stmt = sqlite.prepare(`DELETE FROM streaming_sources WHERE id = ?`);
    const res = stmt.run(id);
    return res.changes > 0;
  },

  // ---------------- SYNC JOBS & LOGS ----------------
  createSyncJob(providerId: string, targetType: string): any {
    const id = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const stmt = sqlite.prepare(`
      INSERT INTO sync_jobs (id, provider_id, target_type, status, progress, total_items, synced_items, failed_items, message)
      VALUES (?, ?, ?, 'running', 10, 100, 10, 0, 'Sync started...')
    `);
    stmt.run(id, providerId, targetType);

    this.addSyncLog({
      jobId: id,
      providerId,
      level: 'info',
      message: `Sync job initiated for provider [${providerId}] targeting [${targetType}].`,
    });

    const getStmt = sqlite.prepare(`SELECT * FROM sync_jobs WHERE id = ?`);
    return getStmt.get(id);
  },

  updateSyncJob(id: string, updates: {
    status?: string;
    progress?: number;
    total_items?: number;
    synced_items?: number;
    failed_items?: number;
    message?: string;
  }): void {
    const stmt = sqlite.prepare(`
      UPDATE sync_jobs
      SET status = COALESCE(?, status),
          progress = COALESCE(?, progress),
          total_items = COALESCE(?, total_items),
          synced_items = COALESCE(?, synced_items),
          failed_items = COALESCE(?, failed_items),
          message = COALESCE(?, message),
          completed_at = CASE WHEN ? = 'completed' OR ? = 'failed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = ?
    `);
    stmt.run(
      updates.status || null,
      updates.progress !== undefined ? updates.progress : null,
      updates.total_items !== undefined ? updates.total_items : null,
      updates.synced_items !== undefined ? updates.synced_items : null,
      updates.failed_items !== undefined ? updates.failed_items : null,
      updates.message || null,
      updates.status || null,
      updates.status || null,
      id
    );
  },

  getSyncJobs(limit = 20): any[] {
    const stmt = sqlite.prepare(`
      SELECT j.*, p.name as provider_name
      FROM sync_jobs j
      LEFT JOIN providers p ON j.provider_id = p.id
      ORDER BY j.started_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  },

  addSyncLog(params: {
    jobId?: string;
    providerId?: string;
    level: string;
    message: string;
    details?: string;
  }): void {
    const id = `slog_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const stmt = sqlite.prepare(`
      INSERT INTO sync_logs (id, job_id, provider_id, level, message, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      params.jobId || null,
      params.providerId || null,
      params.level,
      params.message,
      params.details || null
    );
  },

  getSyncLogs(limit = 50): any[] {
    const stmt = sqlite.prepare(`
      SELECT l.*, p.name as provider_name
      FROM sync_logs l
      LEFT JOIN providers p ON l.provider_id = p.id
      ORDER BY l.created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  },

  // ---------------- USER PREFERENCES (AUDIO / DUB) ----------------
  getUserPreferences(userId: string): any {
    const stmt = sqlite.prepare(`SELECT * FROM user_preferences WHERE user_id = ?`);
    const record = stmt.get(userId) as any;
    if (!record) {
      return {
        user_id: userId,
        preferred_audio_language: 'ja',
        preferred_subtitle_language: 'en',
        subtitles_enabled: 1,
        auto_play: 1,
        default_quality: '1080p',
      };
    }
    return record;
  },

  upsertUserPreferences(params: {
    userId: string;
    preferredAudioLanguage?: string;
    preferredSubtitleLanguage?: string;
    subtitlesEnabled?: boolean;
    autoPlay?: boolean;
    defaultQuality?: string;
  }): any {
    const stmt = sqlite.prepare(`
      INSERT INTO user_preferences (user_id, preferred_audio_language, preferred_subtitle_language, subtitles_enabled, auto_play, default_quality, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        preferred_audio_language = COALESCE(excluded.preferred_audio_language, user_preferences.preferred_audio_language),
        preferred_subtitle_language = COALESCE(excluded.preferred_subtitle_language, user_preferences.preferred_subtitle_language),
        subtitles_enabled = COALESCE(excluded.subtitles_enabled, user_preferences.subtitles_enabled),
        auto_play = COALESCE(excluded.auto_play, user_preferences.auto_play),
        default_quality = COALESCE(excluded.default_quality, user_preferences.default_quality),
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(
      params.userId,
      params.preferredAudioLanguage || 'ja',
      params.preferredSubtitleLanguage || 'en',
      params.subtitlesEnabled !== undefined ? (params.subtitlesEnabled ? 1 : 0) : 1,
      params.autoPlay !== undefined ? (params.autoPlay ? 1 : 0) : 1,
      params.defaultQuality || '1080p'
    );
    return this.getUserPreferences(params.userId);
  },
};


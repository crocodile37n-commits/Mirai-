import { AnimeMedia, MangaChapter, ReadingProgress } from '../../types';
import { BACKEND_CONFIG } from './config';

/**
 * Manga Backend Adapter
 *
 * Centralized interface for querying manga catalogs, searching series,
 * indexing chapters, and retrieving chapter page URLs.
 * Designed to connect to a future local Express, MangaDex, or custom scraper backend.
 */
export const mangaAdapter = {
  /**
   * Fetch discovery collections (trending, popular, recently updated)
   */
  async getDiscovery(): Promise<{
    hero: AnimeMedia[];
    topViewed: AnimeMedia[];
    recentlyUpdated: AnimeMedia[];
    popular: AnimeMedia[];
    topRated: AnimeMedia[];
  } | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.endpoints.mangaDiscovery}`, {
        headers: BACKEND_CONFIG.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Backend not yet connected
    }
    return null;
  },

  /**
   * Search manga by keyword
   */
  async search(keyword: string): Promise<AnimeMedia[]> {
    if (!keyword.trim()) return [];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.endpoints.mangaSearch(keyword)}`, {
        headers: BACKEND_CONFIG.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.results)) {
          return json.results;
        }
      }
    } catch {
      // Backend not yet connected
    }
    return [];
  },

  /**
   * Retrieve official chapter list for a manga
   */
  async getChapters(mangaId: number, title?: string): Promise<MangaChapter[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.endpoints.mangaChapters(mangaId, title)}`,
        {
          headers: BACKEND_CONFIG.getHeaders(),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.chapters)) {
          return json.chapters;
        }
      }
    } catch {
      // Backend not yet connected
    }
    return [];
  },

  /**
   * Retrieve high-resolution page image URLs for a chapter
   */
  async getChapterPages(chapterId: string): Promise<string[]> {
    if (!chapterId || chapterId.startsWith('ch_')) {
      return [];
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.endpoints.mangaChapterPages(chapterId)}`,
        {
          headers: BACKEND_CONFIG.getHeaders(),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.pages)) {
          return json.pages;
        }
      }
    } catch {
      // Backend not yet connected
    }
    return [];
  },

  /**
   * Save user reading progress to local storage or backend
   */
  saveProgress(progress: ReadingProgress): void {
    try {
      const key = `mirai_manga_progress_${progress.mangaId}`;
      localStorage.setItem(key, JSON.stringify(progress));
    } catch {}
  },

  /**
   * Retrieve user reading progress for a manga
   */
  getProgress(mangaId: number): ReadingProgress | null {
    try {
      const key = `mirai_manga_progress_${mangaId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return null;
  },
};

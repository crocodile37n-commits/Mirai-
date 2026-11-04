import { StreamResolutionResult, VideoSource, AudioTrack, SubtitleTrack } from '../../types';
import { BACKEND_CONFIG } from './config';

/**
 * Streaming Provider Adapter
 *
 * Provides a clean interface for resolving video sources, audio tracks (Sub/Dub/Hindi),
 * and subtitles from a future backend service (e.g. Express + Consumet, Vega providers, or direct video servers).
 */
export const streamingAdapter = {
  /**
   * Resolve playable video streams, audio tracks, and subtitles for an episode
   */
  async resolveEpisodeStream(
    animeId: number,
    episodeNumber: number,
    options?: { audio?: string; server?: string }
  ): Promise<StreamResolutionResult | null> {
    const url = `${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.endpoints.animeStreamSources(animeId, episodeNumber)}${
      options?.audio ? `&audio=${encodeURIComponent(options.audio)}` : ''
    }${options?.server ? `&server=${encodeURIComponent(options.server)}` : ''}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        headers: BACKEND_CONFIG.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sources) && data.sources.length > 0) {
          return {
            animeId,
            episodeNumber,
            sources: data.sources.map((s: any, idx: number) => ({
              id: s.id || `src_${idx}`,
              url: s.url || s.video_url,
              format: s.format || (s.url?.includes('.m3u8') ? 'hls' : 'mp4'),
              quality: s.quality || 'Auto',
              serverName: s.serverName || s.server_name || 'Server 1',
              isDefault: idx === 0,
            })),
            audioTracks: Array.isArray(data.audioTracks)
              ? data.audioTracks
              : [
                  { id: 'track_ja', code: 'ja', label: 'Japanese (Original)', isDub: false, isDefault: true },
                ],
            subtitles: Array.isArray(data.subtitles) ? data.subtitles : [],
            intro: data.intro,
            outro: data.outro,
          };
        }
      }
    } catch {
      // Backend not yet connected at this stage
    }

    // Return clean empty structure when no backend source is available.
    // The player will render the clean waiting/empty state without fake videos or demo mockups.
    return null;
  },

  /**
   * Get list of active streaming servers configured for an episode
   */
  async getAvailableServers(animeId: number, episodeNumber: number): Promise<string[]> {
    try {
      const stream = await this.resolveEpisodeStream(animeId, episodeNumber);
      if (stream && stream.sources.length > 0) {
        return Array.from(new Set(stream.sources.map((s) => s.serverName)));
      }
    } catch {}

    return [];
  },
};

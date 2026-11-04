export interface AnimeMedia {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  bannerImage: string | null;
  coverImage: {
    extraLarge: string;
    large: string;
    medium: string;
    color: string | null;
  };
  description: string;
  format: 'TV' | 'MOVIE' | 'ONA' | 'OVA' | 'SPECIAL' | 'MANGA' | 'MANHWA' | 'MANHUA';
  episodes: number | null;
  duration: number | null;
  status: 'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED';
  season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
  seasonYear: number | null;
  averageScore: number | null; // 0-100
  genres: string[];
  studios?: {
    nodes: Array<{ name: string }>;
  };
  characters?: {
    nodes: Array<{
      id: number;
      name: { full: string };
      image: { large: string | null; medium: string | null };
      role?: 'MAIN' | 'SUPPORTING';
    }>;
  };
  recommendations?: {
    nodes: Array<{
      mediaRecommendation: AnimeMedia;
    }>;
  };
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  } | null;
  streamingEpisodes?: Array<{
    title: string;
    thumbnail: string;
    url: string;
    site: string;
  }>;

  // Manga & Country additions
  mangaType?: 'MANGA' | 'MANHWA' | 'MANHUA';
  country?: 'JP' | 'KR' | 'CN';
  author?: string;
  artist?: string;
  viewsCount?: string;
  hasNewChapter?: boolean;
  latestChapterTitle?: string;
  chaptersCount?: number;
  sourceProvider?: 'Atsu' | 'MangaBall' | 'Official';
}

export interface EpisodeItem {
  number: number;
  title: string;
  thumbnail: string;
  description: string;
  duration: string;
  rating: number;
  airDate: string;
  isWatched?: boolean;
  hasDub?: boolean;
  hasSub?: boolean;
}

export interface VideoSource {
  id: string;
  url: string;
  format: 'hls' | 'mp4' | 'dash' | 'embed';
  quality: string; // '1080p' | '720p' | '480p' | '360p' | 'Auto'
  serverName: string;
  isDefault?: boolean;
}

export interface AudioTrack {
  id: string;
  code: string; // 'ja' | 'hi' | 'en'
  label: string; // 'Japanese (Original)' | 'Hindi Dub' | 'English Dub'
  isDub: boolean;
  isDefault?: boolean;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  url: string;
  format: 'vtt' | 'ass' | 'srt';
  isDefault?: boolean;
}

export interface StreamResolutionResult {
  animeId: number;
  episodeNumber: number;
  sources: VideoSource[];
  audioTracks: AudioTrack[];
  subtitles: SubtitleTrack[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
}

export interface MangaChapter {
  id: string;
  number: number;
  title: string;
  scanlatorGroup: string;
  pagesCount: number;
  publishDate: string;
  isRead?: boolean;
  pages: string[];
  externalUrl?: string | null;
  sourceProvider?: string;
}

export interface ScheduleAiringItem {
  id: number;
  animeId: number;
  title: string;
  thumbnail: string;
  timeJST: string; // e.g. "04:30 JST", "05:00 JST"
  episodeNumber: number;
  genres: string[];
  description: string;
  dayOfWeek: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  dateFormatted: string; // e.g. "Saturday, Oct 31"
  airingTimestamp?: number;
}

export interface WatchProgress {
  animeId: number;
  animeTitle: string;
  animeCover: string;
  episodeNumber: number;
  episodeTitle: string;
  progressSeconds: number;
  totalDurationSeconds: number;
  totalEpisodes: number;
  lastWatchedAt: string;
}

export interface ReadingProgress {
  mangaId: number;
  mangaTitle: string;
  mangaCover: string;
  chapterNumber: number;
  pageNumber: number;
  totalPages: number;
  lastReadAt: string;
}

export interface UserSettings {
  autoPlayNext: boolean;
  autoPlayPageLoad: boolean;
  autoSkipIntro: boolean;
  enableDubAudio: boolean;
  preferOriginalAudio: boolean;
  showLiveWatchStatus: boolean;
  showCommentsOnHome: boolean;
  publicWatchlist: boolean;
  titleLanguage: 'English' | 'Japanese';
  discordConnected: boolean;
  ignoreFolders: string[];
  ignoreAudioType: 'None' | 'SUB' | 'DUB';
  readerDirection: 'ltr' | 'rtl' | 'vertical';
  readerFit: 'fit-width' | 'fit-height' | 'natural';
}

export interface UserProfile {
  id: string;
  fullName?: string;
  username: string;
  email: string;
  isEmailVerified: boolean;
  avatarUrl: string;
  memberSince: string;
  level: number;
  rankTitle: string;
  episodesRemainingToNextLevel: number;
  totalEpisodesWatched: number;
  tempDiscordPassword: string;
}

export interface CommentItem {
  id: string;
  episodeNumber?: number;
  chapterNumber?: number;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
}

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  ChevronDown,
  ChevronUp,
  Heart,
  Check,
  Search,
  Bell,
  Eye,
  EyeOff,
  Image,
  Info,
  Tv,
  Shuffle,
  X,
  Share2,
  Sliders,
  Send,
  Star,
  Mic,
  Captions,
} from 'lucide-react';
import { getAnimeDetails, generateEpisodesForAnime } from '../../services/animeApi';
import { AnimeMedia, EpisodeItem, CommentItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { MiraiAvatar } from '../common/BrandLogo';
import { ToggleSwitch } from '../common/ToggleSwitch';

interface WatchViewProps {
  animeId: number;
  initialEpisodeNumber?: number;
}

export const WatchView: React.FC<WatchViewProps> = ({
  animeId,
  initialEpisodeNumber = 1,
}) => {
  const {
    navigateToDetail,
    navigateToWatch,
    userSettings,
    updateUserSettings,
    updateWatchProgress,
    comments,
    addComment,
    bookmarkedAnimes,
    toggleBookmark,
    showToast,
  } = useApp();

  const [anime, setAnime] = useState<AnimeMedia | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [currentEpNum, setCurrentEpNum] = useState<number>(initialEpisodeNumber);
  const [theaterMode, setTheaterMode] = useState<boolean>(false);

  // Video playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(13); // 00:13 as in spec screenshot
  const totalDuration = 1420; // 23:40
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [streamQuality, setStreamQuality] = useState<string>('1080p');
  const [playbackSpeed, setPlaybackSpeed] = useState<string>('Normal');
  const [volumeBoost, setVolumeBoost] = useState<string>('Off');
  const [subtitles, setSubtitles] = useState<string>('English');
  const [autoSkip, setAutoSkip] = useState<boolean>(true);

  // Audio track (SUB / DUB / HINDI)
  const [audioTrack, setAudioTrack] = useState<'SUB' | 'DUB' | 'HINDI'>('SUB');
  const [sourceToastVisible, setSourceToastVisible] = useState<boolean>(false);

  // Sidebar episode list state
  const [episodeSearch, setEpisodeSearch] = useState<string>('');
  const [hideWatched, setHideWatched] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [showMoreDesc, setShowMoreDesc] = useState<boolean>(false);
  const [expandRecs, setExpandRecs] = useState<boolean>(false);

  // Comments state
  const [newCommentText, setNewCommentText] = useState<string>('');

  const playerRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrentEpNum(initialEpisodeNumber);
  }, [initialEpisodeNumber]);

  useEffect(() => {
    getAnimeDetails(animeId).then(async (res) => {
      if (res) {
        setAnime(res);
        const list = generateEpisodesForAnime(res);

        // Fetch watched history from SQLite database
        try {
          const histRes = await fetch(`/api/history/anime/${res.id}`);
          if (histRes.ok) {
            const histData = await histRes.json();
            if (Array.isArray(histData.items)) {
              const watchedEpNums = new Set(
                histData.items
                  .filter((h: any) => h.isCompleted === 1 || h.progressSeconds > 60)
                  .map((h: any) => h.episodeNumber)
              );
              list.forEach((ep) => {
                if (watchedEpNums.has(ep.number)) {
                  ep.isWatched = true;
                }
              });
            }
          }
        } catch {}

        setEpisodes([...list]);

        // Update continue watching
        const currentEp = list.find((e) => e.number === currentEpNum) || list[0];
        updateWatchProgress({
          animeId: res.id,
          animeTitle: res.title.english || res.title.romaji,
          animeCover: res.coverImage.large,
          episodeNumber: currentEpNum,
          episodeTitle: currentEp?.title || `Episode ${currentEpNum}`,
          progressSeconds: currentTime,
          totalDurationSeconds: totalDuration,
          totalEpisodes: res.episodes || list.length,
          lastWatchedAt: new Date().toISOString(),
        });
      }
    });
  }, [animeId, currentEpNum]);

  // Video progress simulator when playing
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            if (userSettings.autoPlayNext) {
              const nextEp = currentEpNum + 1;
              if (nextEp <= (episodes.length || 18)) {
                setCurrentEpNum(nextEp);
                return 0;
              }
            }
            return totalDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, totalDuration, userSettings.autoPlayNext, currentEpNum, episodes.length]);

  const handleAudioTrackChange = (track: 'SUB' | 'DUB' | 'HINDI') => {
    setAudioTrack(track);
    if (track === 'HINDI') {
      // Trigger toast from section 7.1
      setSourceToastVisible(true);
      setTimeout(() => setSourceToastVisible(false), 5000);
    }
  };

  const currentEpisode = episodes.find((e) => e.number === currentEpNum) || {
    number: currentEpNum,
    title: "I'm Luffy! The Man Who Will Become the Pirate King!",
    thumbnail: anime?.coverImage.large || '',
    description: 'In this momentous episode, adventures begin on the grand stage.',
    duration: '24m',
    rating: 8.4,
    airDate: 'Jul 03, 2026',
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isBookmarked = anime ? bookmarkedAnimes.includes(anime.id) : false;

  const currentComments: CommentItem[] =
    comments[`${animeId}_${currentEpNum}`] || [];

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment(animeId, currentEpNum, newCommentText.trim());
    setNewCommentText('');
    showToast('Comment Posted', 'Your comment is now live for Episode ' + currentEpNum, 'success');
  };

  const primaryTitle = anime ? anime.title.english || anime.title.romaji : 'Loading...';
  const progressRatio = currentTime / totalDuration;

  // Intro segment: 1:30 - 3:00 (90s - 180s)
  // Outro segment: 21:30 - 23:00 (1290s - 1380s)
  const introStartPercent = (90 / totalDuration) * 100;
  const introWidthPercent = (90 / totalDuration) * 100;
  const outroStartPercent = (1290 / totalDuration) * 100;
  const outroWidthPercent = (90 / totalDuration) * 100;

  const filteredEpisodes = episodes.filter((ep) => {
    if (episodeSearch && !ep.title.toLowerCase().includes(episodeSearch.toLowerCase()) && !ep.number.toString().includes(episodeSearch)) {
      return false;
    }
    if (hideWatched && ep.isWatched) {
      return false;
    }
    return true;
  });

  const recommendations =
    anime?.recommendations?.nodes
      ?.map((r) => r.mediaRecommendation)
      .filter(Boolean)
      .slice(0, expandRecs ? 8 : 4) || [];

  return (
    <div className="min-w-0 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 select-none">
      {/* Two Column Layout (or stacked when Theater Mode is on) */}
      <div
        className={`grid gap-6 ${
          theaterMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'
        }`}
      >
        {/* ======================================================== */}
        {/* LEFT / MAIN COLUMN: PLAYER + CONTROLS + INFO + DISCUSSION */}
        {/* ======================================================== */}
        <div className={theaterMode ? 'col-span-1' : 'lg:col-span-8'}>
          {/* 7.1 PLAYER CONTAINER */}
          <div
            ref={playerRef}
            className="relative w-full aspect-video rounded-[14px] bg-[#0c0c0e] border border-white/[0.08] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] group/player"
          >
            {/* Background Episode Still / Video Poster */}
            <img
              src={currentEpisode.thumbnail || anime?.coverImage.extraLarge}
              alt=""
              className="w-full h-full object-cover opacity-60"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none" />

            {/* IDLE / PAUSED OVERLAY */}
            {!isPlaying && (
              <div
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-black/45 backdrop-blur-[2px] transition-all"
              >
                {/* Centered ~58px glass circle with white play triangle */}
                <div className="w-[58px] h-[58px] rounded-full glass bg-white/15 hover:bg-white/25 flex items-center justify-center transition-transform hover:scale-110 shadow-2xl active:scale-95">
                  <Play className="w-6 h-6 fill-white text-white ml-1" />
                </div>
                {/* EP 1 & title */}
                <span className="mt-4 font-heading font-extrabold text-[15px] text-white tracking-wider">
                  EP {currentEpNum}
                </span>
                <p className="mt-0.5 text-[12px] text-white/65 max-w-[420px] text-center px-4 line-clamp-2">
                  {currentEpisode.title}
                </p>
              </div>
            )}

            {/* Top-Right Gear Icon */}
            <div className="absolute top-4 right-4 z-30">
              <button
                type="button"
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="w-9 h-9 rounded-full glass flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95"
                aria-label="Player Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* 7.1 SETTINGS MENU (~233px wide dark glass panel) */}
              {showSettingsMenu && (
                <div className="absolute top-11 right-0 w-[233px] rounded-[14px] glass bg-[#121215]/95 border border-white/15 shadow-2xl p-2.5 z-40 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  {/* Quality row */}
                  <div
                    onClick={() => {
                      const next = streamQuality === '1080p' ? '720p' : streamQuality === '720p' ? '480p' : '1080p';
                      setStreamQuality(next);
                    }}
                    className="flex items-center justify-between h-[36px] px-2.5 rounded-[8px] hover:bg-white/10 cursor-pointer text-white"
                  >
                    <span>Quality</span>
                    <span className="text-white/60 font-semibold">{streamQuality} ›</span>
                  </div>

                  {/* Speed row */}
                  <div
                    onClick={() => {
                      const next = playbackSpeed === 'Normal' ? '1.25x' : playbackSpeed === '1.25x' ? '1.5x' : 'Normal';
                      setPlaybackSpeed(next);
                    }}
                    className="flex items-center justify-between h-[36px] px-2.5 rounded-[8px] hover:bg-white/10 cursor-pointer text-white"
                  >
                    <span>Speed</span>
                    <span className="text-white/60 font-semibold">{playbackSpeed} ›</span>
                  </div>

                  {/* Volume Boost */}
                  <div
                    onClick={() => {
                      const next = volumeBoost === 'Off' ? '150%' : volumeBoost === '150%' ? '200%' : 'Off';
                      setVolumeBoost(next);
                    }}
                    className="flex items-center justify-between h-[36px] px-2.5 rounded-[8px] hover:bg-white/10 cursor-pointer text-white"
                  >
                    <span>Volume Boost</span>
                    <span className="text-white/60 font-semibold">{volumeBoost} ›</span>
                  </div>

                  {/* Subtitles */}
                  <div
                    onClick={() => {
                      const next = subtitles === 'English' ? 'Japanese' : subtitles === 'Japanese' ? 'Off' : 'English';
                      setSubtitles(next);
                    }}
                    className="flex items-center justify-between h-[36px] px-2.5 rounded-[8px] hover:bg-white/10 cursor-pointer text-white"
                  >
                    <span>Subtitles</span>
                    <span className="text-white/60 font-semibold">{subtitles} ›</span>
                  </div>

                  {/* Auto-skip */}
                  <div className="flex items-center justify-between h-[36px] px-2.5 rounded-[8px] text-white">
                    <span>Auto-skip</span>
                    <ToggleSwitch checked={autoSkip} onChange={setAutoSkip} />
                  </div>
                </div>
              )}
            </div>

            {/* 7.1 TOAST (Top-Left of the player) */}
            {sourceToastVisible && (
              <div className="absolute top-4 left-4 z-30 max-w-[385px] p-3 rounded-[12px] glass bg-black/80 border border-white/15 shadow-2xl flex items-start gap-3 animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-[8px] bg-white flex items-center justify-center flex-shrink-0 text-black">
                  <Shuffle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <h5 className="font-heading text-xs font-bold text-white">
                    Source automatically switched
                  </h5>
                  <p className="text-[11px] text-white/60 leading-tight mt-0.5">
                    Hindi audio is not available for Episode {currentEpNum}. Playing default HD stream (Server 1).
                  </p>
                </div>
                <button
                  onClick={() => setSourceToastVisible(false)}
                  className="text-white/40 hover:text-white"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 7.1 PROGRESS BAR WITH GOLD SKIP SEGMENTS & CHIBI AVATAR THUMB */}
            <div className="absolute bottom-11 left-0 right-0 px-4 z-20">
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  setCurrentTime(pos * totalDuration);
                }}
                className="relative w-full h-[6px] bg-white/20 hover:h-[8px] rounded-full cursor-pointer transition-all flex items-center"
              >
                {/* Intro Skip segment (Gold) */}
                <div
                  style={{ left: `${introStartPercent}%`, width: `${introWidthPercent}%` }}
                  title="Intro Skip Segment"
                  className="absolute h-full bg-[#b8962e] opacity-85 rounded-sm"
                />

                {/* Outro Skip segment (Gold) */}
                <div
                  style={{ left: `${outroStartPercent}%`, width: `${outroWidthPercent}%` }}
                  title="Outro Skip Segment"
                  className="absolute h-full bg-[#b8962e] opacity-85 rounded-sm"
                />

                {/* Elapsed Progress Bar */}
                <div
                  style={{ width: `${progressRatio * 100}%` }}
                  className="h-full bg-white rounded-full relative"
                >
                  {/* Round Chibi Avatar Thumb at the playhead (~24px) */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-[#121215] border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#8b5cf6] fill-current">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.83 0 1.5-.67 1.5-1.5S7.83 8 7 8s-1.5.67-1.5 1.5S6.17 11 7 11zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 8 17 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-5 6c2.28 0 4.22-1.66 5-4H7c.78 2.34 2.72 4 5 4z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 7.1 CONTROL ROW (OVER VIDEO, BOTTOM) */}
            <div className="absolute bottom-2 left-0 right-0 px-4 flex items-center justify-between text-white text-xs z-20">
              {/* Left controls: Replay-10s, Play/Pause, Forward-10s, Time */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentTime((t) => Math.max(0, t - 10))}
                  className="hover:text-white/80 active:scale-95 transition-transform"
                  aria-label="Replay 10 seconds"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="hover:text-white/80 active:scale-95 transition-transform"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                </button>
                <button
                  onClick={() => setCurrentTime((t) => Math.min(totalDuration, t + 10))}
                  className="hover:text-white/80 active:scale-95 transition-transform"
                  aria-label="Forward 10 seconds"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <span className="font-mono text-[12px] text-white font-medium ml-1">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>
              </div>

              {/* Right controls: Volume, PiP, Fullscreen */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 group/vol">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="hover:text-white/80"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>

                <button
                  onClick={() => {
                    if (playerRef.current) {
                      if (!document.fullscreenElement) {
                        playerRef.current.requestFullscreen?.();
                      } else {
                        document.exitFullscreen?.();
                      }
                    }
                  }}
                  className="hover:text-white/80"
                  aria-label="Toggle Fullscreen"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 7.2 BELOW PLAYER: CONTROL STRIP */}
          <div className="mt-3 py-2.5 px-4 rounded-[12px] bg-[#0c0c0e] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left side: Theater, AutoPlay, AutoNext */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheaterMode(!theaterMode)}
                className={`hidden sm:flex h-[30px] px-3 rounded-full items-center gap-1.5 transition-all text-white/70 hover:text-white ${
                  theaterMode ? 'bg-white/15 text-white' : 'hover:bg-white/5'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Theater</span>
              </button>

              <button
                onClick={() => updateUserSettings({ autoPlayPageLoad: !userSettings.autoPlayPageLoad })}
                className={`h-[30px] px-3 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                  userSettings.autoPlayPageLoad
                    ? 'bg-white/15 border-white/20 text-white'
                    : 'border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <span>AutoPlay</span>
              </button>

              <button
                onClick={() => updateUserSettings({ autoPlayNext: !userSettings.autoPlayNext })}
                className={`h-[30px] px-3 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                  userSettings.autoPlayNext
                    ? 'bg-white/15 border-white/20 text-white'
                    : 'border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <span>AutoNext</span>
              </button>
            </div>

            {/* Vertical Hairline */}
            <div className="w-[1px] h-5 bg-white/10 hidden sm:block" />

            {/* Segmented Audio Row: [CC] SUB | [mic] DUB | [speaker] HINDI */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-[10px] font-mono font-bold tracking-wider text-white/40 sm:hidden">
                AUDIO
              </span>
              <div className="inline-flex p-0.5 rounded-full bg-black/50 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleAudioTrackChange('SUB')}
                  className={`h-[26px] px-2.5 sm:px-3 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                    audioTrack === 'SUB'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Captions className="w-3 h-3" />
                  <span>SUB</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAudioTrackChange('DUB')}
                  className={`h-[26px] px-2.5 sm:px-3 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                    audioTrack === 'DUB'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  <span>DUB</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAudioTrackChange('HINDI')}
                  className={`h-[26px] px-2.5 sm:px-3 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                    audioTrack === 'HINDI'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Volume2 className="w-3 h-3" />
                  <span>HINDI</span>
                </button>
              </div>
            </div>

            {/* Vertical Hairline */}
            <div className="w-[1px] h-5 bg-white/10 hidden sm:block" />

            {/* Prev / Next & Bookmark */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentEpNum((n) => Math.max(1, n - 1))}
                disabled={currentEpNum <= 1}
                className="h-[30px] px-3 rounded-full bg-[#121215] border border-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
              >
                Prev
              </button>

              <button
                onClick={() => setCurrentEpNum((n) => n + 1)}
                disabled={currentEpNum >= (episodes.length || 18)}
                className="h-[30px] px-3 rounded-full bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
              >
                Next
              </button>

              <button
                onClick={() => {
                  if (anime) {
                    toggleBookmark(anime.id);
                    showToast(isBookmarked ? 'Bookmark Removed' : 'Bookmarked', `${primaryTitle} saved.`, 'info');
                  }
                }}
                className={`h-[30px] px-3 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                  isBookmarked
                    ? 'bg-[#f472b6]/20 border-[#f472b6]/40 text-[#f472b6]'
                    : 'border-white/10 text-white/70 hover:text-white bg-white/5'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#f472b6]' : ''}`} />
                <span>Bookmark</span>
              </button>
            </div>
          </div>

          {/* 7.3 INFO BLOCK */}
          <div className="mt-6">
            <h1 className="font-heading text-xl md:text-2xl font-extrabold text-white leading-snug">
              {primaryTitle} — Episode {currentEpNum}: {currentEpisode.title}
            </h1>

            {/* Meta row */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[#f5c518] font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {anime?.averageScore ? (anime.averageScore / 10).toFixed(1) : '8.4'}
                </span>
                <span className="text-white/60">{anime?.seasonYear || 2026}</span>
                <span className="text-white/60">{anime?.format || 'TV'}</span>
                <span className="font-bold text-[#22c55e] px-2 py-0.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30">
                  {anime?.status || 'RELEASING'}
                </span>
                <span className="text-white/40">
                  {(anime?.genres || ['Action', 'Fantasy']).join(' · ')}
                </span>
              </div>

              {/* Anime Info Button */}
              {anime && (
                <button
                  onClick={() => navigateToDetail(anime.id)}
                  className="h-[28px] px-3 rounded-full bg-[#121215] border border-white/10 text-white/80 hover:text-white flex items-center gap-1.5 transition-all"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Anime Info</span>
                </button>
              )}
            </div>

            {/* Expandable Description */}
            <div className="mt-4 text-xs leading-relaxed text-white/60">
              <p className={showMoreDesc ? '' : 'line-clamp-3'}>
                {currentEpisode.description} {anime?.description?.replace(/<[^>]*>?/gm, '')}
              </p>
              <button
                onClick={() => setShowMoreDesc(!showMoreDesc)}
                className="mt-1 text-white/80 hover:text-white font-semibold flex items-center gap-1"
              >
                <span>{showMoreDesc ? '▲ Show Less' : '▼ Show More'}</span>
              </button>
            </div>

            {/* 7.3 DISCUSSION CARD */}
            <div className="mt-8 p-5 rounded-[16px] bg-[#0c0c0e] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
                  <span>Discussion</span>
                  <span className="text-xs text-white/40 font-normal">
                    ({currentComments.length} Comments)
                  </span>
                </h3>
              </div>

              {/* Comment Input */}
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <div className="flex gap-3">
                  <MiraiAvatar size={36} className="flex-shrink-0" />
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder={`Post a comment on Episode ${currentEpNum}…`}
                    rows={3}
                    className="flex-1 p-3 rounded-[12px] bg-[#121215] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/20 resize-y"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="h-[34px] px-5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
                  >
                    Submit Comment
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="mt-6 space-y-4 pt-4 border-t border-white/[0.06]">
                {currentComments.length === 0 ? (
                  <p className="text-xs text-white/40 text-center py-4">
                    No comments yet on this episode. Be the first to share your thoughts!
                  </p>
                ) : (
                  currentComments.map((c) => (
                    <div key={c.id} className="flex gap-3 text-xs">
                      <MiraiAvatar size={32} className="flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{c.authorName}</span>
                          <span className="text-[10px] text-white/40">{c.createdAt}</span>
                        </div>
                        <p className="mt-1 text-white/70 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN / SIDEBAR: EPISODE LIST + MORE LIKE THIS   */}
        {/* ======================================================== */}
        <div className={theaterMode ? 'col-span-1 mt-6' : 'lg:col-span-4'}>
          {/* 7.4 SIDEBAR EPISODE LIST PANEL */}
          <div className="rounded-[14px] bg-[#0c0c0e] border border-white/[0.08] overflow-hidden flex flex-col h-[480px]">
            {/* Header row */}
            <div className="p-3 border-b border-white/[0.08] flex items-center justify-between gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-bold text-white">
                1 - {episodes.length}
              </span>

              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input
                  type="text"
                  value={episodeSearch}
                  onChange={(e) => setEpisodeSearch(e.target.value)}
                  placeholder="Filter episodes…"
                  className="w-full h-[28px] pl-8 pr-2 rounded-full bg-[#121215] border border-white/10 text-[11px] text-white placeholder-white/40 focus:outline-none"
                />
              </div>

              {/* Eye toggle */}
              <button
                onClick={() => setHideWatched(!hideWatched)}
                className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${
                  hideWatched ? 'bg-white/20 border-white/30 text-white' : 'border-white/10 text-white/50 hover:text-white'
                }`}
                title="Toggle watched"
              >
                {hideWatched ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>

              {/* Image thumbnail toggle */}
              <button
                onClick={() => setShowThumbnails(!showThumbnails)}
                className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${
                  showThumbnails ? 'bg-white/20 border-white/30 text-white' : 'border-white/10 text-white/50 hover:text-white'
                }`}
                title="Toggle thumbnails"
              >
                <Image className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Episode Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
              {filteredEpisodes.map((ep) => {
                const isActive = ep.number === currentEpNum;

                return (
                  <div
                    key={ep.number}
                    onClick={() => setCurrentEpNum(ep.number)}
                    className={`p-2.5 flex gap-3 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-white/10 border-l-2 border-white'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {showThumbnails && (
                      <div className="relative w-[118px] h-[66px] rounded-[8px] overflow-hidden bg-neutral-900 flex-shrink-0">
                        <img
                          src={ep.thumbnail || anime?.coverImage.large}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-[4px] bg-black/80 text-[9px] font-bold text-white">
                          EP {ep.number}
                        </span>
                        {ep.isWatched && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#22c55e] flex items-center justify-center text-black shadow">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-heading text-xs font-bold text-white truncate">
                          {ep.title}
                        </h4>
                        <p className="text-[11px] text-white/40 line-clamp-2 mt-0.5">
                          {ep.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-white/40 mt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1 rounded bg-white/10 text-[9px] font-bold text-white/70">
                            CC
                          </span>
                          <span className="flex items-center gap-0.5 text-[#f5c518]">
                            ★ {ep.rating}
                          </span>
                        </div>
                        <span>{ep.airDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pinned strip at bottom: Countdown to next episode */}
            <div className="p-3 border-t border-white/[0.08] bg-[#121215] flex items-center gap-2 text-xs text-white/80">
              <Bell className="w-4 h-4 text-[#8b5cf6] flex-shrink-0 animate-pulse" />
              <span className="truncate">
                Episode {(episodes.length || 18) + 1} in <strong className="font-bold text-white">6d 1h</strong> · Thu, Nov 5, 20:56
              </span>
            </div>
          </div>

          {/* 7.4 MORE LIKE THIS CARD */}
          {recommendations.length > 0 && (
            <div className="mt-6 p-4 rounded-[14px] bg-[#0c0c0e] border border-white/[0.08]">
              <h3 className="font-heading text-xs font-extrabold uppercase tracking-wider text-white pb-3 border-b border-white/[0.08]">
                More Like This
              </h3>

              <div className="grid grid-cols-2 gap-3 mt-4">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => navigateToWatch(rec.id, 1)}
                    className="relative aspect-[2/3] rounded-[10px] overflow-hidden bg-neutral-900 border border-white/10 group cursor-pointer"
                  >
                    <img
                      src={rec.coverImage.large}
                      alt={rec.title.english || rec.title.romaji}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-2">
                      <span className="font-heading text-[11px] font-bold text-white line-clamp-2">
                        {rec.title.english || rec.title.romaji}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setExpandRecs(!expandRecs)}
                className="w-full mt-4 py-2 text-center text-xs text-white/60 hover:text-white font-semibold transition-colors"
              >
                {expandRecs ? '▲ Show Less' : 'Show All Recommendations ⌄'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Search,
  Eye,
  EyeOff,
  Image,
  Info,
  Tv,
  Share2,
  Sliders,
  Send,
  Star,
  Mic,
  Captions,
  Volume2,
  Check,
  Bell,
  PlayCircle,
  ExternalLink,
  Layers,
  Inbox,
} from 'lucide-react';
import { getAnimeDetails, generateEpisodesForAnime } from '../../services/animeApi';
import { AnimeMedia, EpisodeItem, CommentItem, StreamResolutionResult } from '../../types';
import { useApp } from '../../context/AppContext';
import { MiraiAvatar } from '../common/BrandLogo';
import { VideoPlayer } from '../player/VideoPlayer';
import { streamingAdapter } from '../../services/adapter/streamingAdapter';

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

  // Stream Resolution State (Adapter-driven)
  const [streamResult, setStreamResult] = useState<StreamResolutionResult | null>(null);
  const [streamLoading, setStreamLoading] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Audio track preference ('SUB' | 'DUB' | 'HINDI')
  const [audioTrackMode, setAudioTrackMode] = useState<'SUB' | 'DUB' | 'HINDI'>('SUB');

  // Sidebar episode list state
  const [episodeSearch, setEpisodeSearch] = useState<string>('');
  const [hideWatched, setHideWatched] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [showMoreDesc, setShowMoreDesc] = useState<boolean>(false);
  const [expandRecs, setExpandRecs] = useState<boolean>(false);

  // Comments state
  const [newCommentText, setNewCommentText] = useState<string>('');

  useEffect(() => {
    setCurrentEpNum(initialEpisodeNumber);
  }, [initialEpisodeNumber]);

  // Load Anime Details & Real Episode Metadata
  useEffect(() => {
    let isMounted = true;

    getAnimeDetails(animeId).then(async (res) => {
      if (!isMounted) return;
      if (res) {
        setAnime(res);
        const list = generateEpisodesForAnime(res);

        // Fetch watched history from backend if available
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

        if (isMounted) {
          setEpisodes([...list]);

          // Record progress entry
          const currentEp = list.find((e) => e.number === currentEpNum) || list[0];
          updateWatchProgress({
            animeId: res.id,
            animeTitle: res.title.english || res.title.romaji,
            animeCover: res.coverImage.large,
            episodeNumber: currentEpNum,
            episodeTitle: currentEp?.title || `Episode ${currentEpNum}`,
            progressSeconds: 0,
            totalDurationSeconds: (res.duration || 24) * 60,
            totalEpisodes: res.episodes || list.length,
            lastWatchedAt: new Date().toISOString(),
          });
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [animeId, currentEpNum]);

  // Resolve video stream via Centralized Backend Adapter
  const loadStream = async () => {
    setStreamLoading(true);
    setStreamError(null);
    try {
      const res = await streamingAdapter.resolveEpisodeStream(animeId, currentEpNum, {
        audio: audioTrackMode.toLowerCase(),
      });
      setStreamResult(res);
    } catch (err: any) {
      setStreamError(err?.message || 'Failed to resolve stream pipeline');
    } finally {
      setStreamLoading(false);
    }
  };

  useEffect(() => {
    loadStream();
  }, [animeId, currentEpNum, audioTrackMode]);

  const currentEpisode = episodes.find((e) => e.number === currentEpNum) || {
    number: currentEpNum,
    title: anime ? `${anime.title.english || anime.title.romaji} — Episode ${currentEpNum}` : `Episode ${currentEpNum}`,
    thumbnail: anime?.bannerImage || anime?.coverImage.large || '',
    description: `Episode ${currentEpNum} stream.`,
    duration: anime?.duration ? `${anime.duration}m` : '24m',
    rating: anime?.averageScore ? +(anime.averageScore / 10).toFixed(1) : 8.5,
    airDate: anime?.seasonYear ? `${anime.season || ''} ${anime.seasonYear}`.trim() : 'Official Release',
  };

  // Official stream metadata from AniList
  const streamingEp = anime?.streamingEpisodes?.find((se) => {
    const match = se.title.match(/Episode\s+(\d+)/i);
    return match ? parseInt(match[1], 10) === currentEpNum : false;
  }) || anime?.streamingEpisodes?.[currentEpNum - 1] || anime?.streamingEpisodes?.[0] || null;

  // Track availability validation
  const hasSubTrack = !streamResult || streamResult.audioTracks.length === 0 || streamResult.audioTracks.some((t) => t.code === 'ja' || !t.isDub);
  const hasDubTrack = Boolean(streamResult?.audioTracks.some((t) => t.code === 'en' || t.isDub));
  const hasHindiTrack = Boolean(streamResult?.audioTracks.some((t) => t.code === 'hi' || t.label.toLowerCase().includes('hindi')));

  const handleAudioTrackSelect = (mode: 'SUB' | 'DUB' | 'HINDI') => {
    if (mode === 'HINDI' && !hasHindiTrack) {
      showToast(
        'Hindi Track Not Supplied',
        `The stream provider has not indexed a Hindi dub track for Episode ${currentEpNum}.`,
        'info'
      );
      return;
    }
    if (mode === 'DUB' && !hasDubTrack && streamResult) {
      showToast(
        'English Dub Not Available',
        `English dub is not supplied by the provider for Episode ${currentEpNum}.`,
        'info'
      );
      return;
    }
    setAudioTrackMode(mode);
  };

  const isBookmarked = anime ? bookmarkedAnimes.includes(anime.id) : false;

  const currentComments: CommentItem[] =
    comments[`${animeId}_${currentEpNum}`] || [];

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment(animeId, currentEpNum, newCommentText.trim());
    setNewCommentText('');
    showToast('Comment Posted', `Your comment is now live for Episode ${currentEpNum}`, 'success');
  };

  const primaryTitle = anime ? anime.title.english || anime.title.romaji : 'Loading...';

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
          {/* MODULAR VIDEO PLAYER COMPONENT (No Unsplash Fakes / Clean Empty State) */}
          <VideoPlayer
            animeId={animeId}
            animeTitle={primaryTitle}
            episodeNumber={currentEpNum}
            episodeTitle={currentEpisode.title}
            streamResult={streamResult}
            loading={streamLoading}
            error={streamError}
            officialStreamingUrl={streamingEp?.url}
            officialStreamingSite={streamingEp?.site || 'Crunchyroll'}
            onNextEpisode={() => {
              if (currentEpNum < (episodes.length || 1)) {
                setCurrentEpNum((prev) => prev + 1);
              }
            }}
            onPrevEpisode={() => {
              if (currentEpNum > 1) {
                setCurrentEpNum((prev) => prev - 1);
              }
            }}
            hasNext={currentEpNum < (episodes.length || 1)}
            hasPrev={currentEpNum > 1}
            onRetry={loadStream}
            theaterMode={theaterMode}
            onToggleTheater={() => setTheaterMode(!theaterMode)}
          />

          {/* BELOW PLAYER: CONTROL STRIP & SMART LANGUAGE / DUB CONTROLS */}
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

            {/* Smart Audio Language Switching (SUB | DUB | HINDI) */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-[10px] font-mono font-bold tracking-wider text-white/40 sm:hidden">
                AUDIO
              </span>
              <div className="inline-flex p-0.5 rounded-full bg-black/60 border border-white/10">
                {/* SUB button */}
                <button
                  type="button"
                  onClick={() => handleAudioTrackSelect('SUB')}
                  className={`h-[26px] px-3 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                    audioTrackMode === 'SUB'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Captions className="w-3 h-3" />
                  <span>SUB</span>
                </button>

                {/* DUB button (Active when available, styled disabled when not supplied) */}
                <button
                  type="button"
                  onClick={() => handleAudioTrackSelect('DUB')}
                  className={`h-[26px] px-3 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                    audioTrackMode === 'DUB'
                      ? 'bg-white text-black shadow-sm'
                      : hasDubTrack || !streamResult
                      ? 'text-white/60 hover:text-white'
                      : 'text-white/30 hover:text-white/40'
                  }`}
                  title={hasDubTrack || !streamResult ? 'English Dubbed Audio' : 'Dub not supplied by provider'}
                >
                  <Mic className="w-3 h-3" />
                  <span>DUB</span>
                  {!hasDubTrack && streamResult && (
                    <span className="text-[9px] opacity-60">N/A</span>
                  )}
                </button>

                {/* HINDI button (Disabled with clear explanation when provider doesn't supply it) */}
                <button
                  type="button"
                  onClick={() => handleAudioTrackSelect('HINDI')}
                  className={`h-[26px] px-3 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${
                    audioTrackMode === 'HINDI'
                      ? 'bg-white text-black shadow-sm'
                      : hasHindiTrack
                      ? 'text-white/60 hover:text-white'
                      : 'text-white/30 hover:text-white/40'
                  }`}
                  title={hasHindiTrack ? 'Hindi Dubbed Audio' : 'Hindi Dub not supplied for this stream'}
                >
                  <Volume2 className="w-3 h-3" />
                  <span>HINDI</span>
                  {!hasHindiTrack && (
                    <span className="text-[9px] px-1 rounded bg-white/10 text-white/50">N/A</span>
                  )}
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
                disabled={currentEpNum >= (episodes.length || 1)}
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

          {/* INFO BLOCK */}
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

            {/* DISCUSSION CARD */}
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
          {/* SIDEBAR EPISODE LIST PANEL */}
          <div className="rounded-[14px] bg-[#0c0c0e] border border-white/[0.08] overflow-hidden flex flex-col h-[520px]">
            {/* Header row */}
            <div className="p-3 border-b border-white/[0.08] flex items-center justify-between gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-bold text-white">
                {episodes.length > 0 ? `1 - ${episodes.length}` : '0 Episodes'}
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

            {/* Scrollable Episode Rows OR Clean Empty State */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
              {episodes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-heading text-xs font-bold text-white">No Indexed Episodes</h5>
                    <p className="text-[11px] text-white/40 max-w-[220px] mx-auto mt-1 leading-relaxed">
                      Episodes will appear once synchronized from your streaming provider adapter.
                    </p>
                  </div>
                </div>
              ) : filteredEpisodes.length === 0 ? (
                <div className="py-12 text-center text-xs text-white/40">
                  No episodes match "{episodeSearch}"
                </div>
              ) : (
                filteredEpisodes.map((ep) => {
                  const isActive = ep.number === currentEpNum;

                  return (
                    <div
                      key={ep.number}
                      onClick={() => setCurrentEpNum(ep.number)}
                      className={`p-2.5 flex gap-3 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-white/10 border-l-2 border-[#8b5cf6]'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {showThumbnails && (
                        <div className="relative w-[118px] h-[66px] rounded-[8px] overflow-hidden bg-neutral-900 flex-shrink-0">
                          {ep.thumbnail ? (
                            <img
                              src={ep.thumbnail}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/30 text-[10px]">
                              EP {ep.number}
                            </div>
                          )}
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
                })
              )}
            </div>

            {/* Pinned strip at bottom: Countdown or Next episode info */}
            {anime?.nextAiringEpisode && (
              <div className="p-3 border-t border-white/[0.08] bg-[#121215] flex items-center gap-2 text-xs text-white/80">
                <Bell className="w-4 h-4 text-[#8b5cf6] flex-shrink-0 animate-pulse" />
                <span className="truncate">
                  Episode {anime.nextAiringEpisode.episode} in{' '}
                  <strong className="font-bold text-white">
                    {Math.ceil(anime.nextAiringEpisode.timeUntilAiring / 86400)}d
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* MORE LIKE THIS CARD */}
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

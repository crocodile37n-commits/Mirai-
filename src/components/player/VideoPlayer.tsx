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
  Tv,
  ExternalLink,
  Radio,
  Server,
  Layers,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { StreamResolutionResult, VideoSource, AudioTrack, SubtitleTrack } from '../../types';

interface VideoPlayerProps {
  animeId: number;
  animeTitle: string;
  episodeNumber: number;
  episodeTitle?: string;
  streamResult: StreamResolutionResult | null;
  loading?: boolean;
  error?: string | null;
  officialStreamingUrl?: string | null;
  officialStreamingSite?: string | null;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onRetry?: () => void;
  theaterMode?: boolean;
  onToggleTheater?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  animeId,
  animeTitle,
  episodeNumber,
  episodeTitle,
  streamResult,
  loading = false,
  error = null,
  officialStreamingUrl,
  officialStreamingSite = 'Crunchyroll',
  onNextEpisode,
  onPrevEpisode,
  hasNext = false,
  hasPrev = false,
  onRetry,
  theaterMode = false,
  onToggleTheater,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedPercent, setBufferedPercent] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Track selection
  const [activeQuality, setActiveQuality] = useState<string>('Auto');
  const [activeAudioCode, setActiveAudioCode] = useState<string>('ja');
  const [activeSubtitleId, setActiveSubtitleId] = useState<string>('none');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const controlsTimeoutRef = useRef<number | null>(null);

  // Active source resolution
  const sources = streamResult?.sources || [];
  const audioTracks = streamResult?.audioTracks || [];
  const subtitles = streamResult?.subtitles || [];
  const activeSource = sources.find((s) => s.quality === activeQuality) || sources[0] || null;

  // Sync available qualities when streamResult changes
  useEffect(() => {
    if (sources.length > 0) {
      setActiveQuality(sources[0].quality);
    }
  }, [streamResult]);

  // Handle Fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls auto-hide timer on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettings(false);
      }
    }, 3000);
  };

  // Video element events
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);

      if (videoRef.current.buffered.length > 0 && videoRef.current.duration) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBufferedPercent((bufferedEnd / videoRef.current.duration) * 100);
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (posFraction: number) => {
    if (videoRef.current && duration > 0) {
      const newTime = Math.max(0, Math.min(duration, posFraction * duration));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video rounded-[14px] bg-[#070709] border border-white/[0.08] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] group select-none flex flex-col items-center justify-center"
    >
      {/* 1. LOADING STATE */}
      {loading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#070709] text-center p-6 space-y-4 animate-in fade-in duration-200">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-white/10 border-t-[#8b5cf6] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Radio className="w-5 h-5 text-[#8b5cf6] animate-pulse" />
            </div>
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-white tracking-wide">
              Connecting Stream Provider
            </h4>
            <p className="text-xs text-white/50 max-w-[360px] mx-auto mt-1">
              Resolving media endpoints for Episode {episodeNumber} of {animeTitle}...
            </p>
          </div>
        </div>
      )}

      {/* 2. ERROR STATE */}
      {!loading && error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#070709] text-center p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-white">Stream Pipeline Error</h4>
            <p className="text-xs text-white/50 max-w-[380px] mx-auto mt-1 leading-relaxed">
              {error}
            </p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          )}
        </div>
      )}

      {/* 3. CLEAN EMPTY STATE (NO BACKEND CONNECTED YET) */}
      {!loading && !error && (!streamResult || sources.length === 0) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-[#0e0e12] via-[#09090c] to-[#060607] p-6 text-center">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Central Architecture Standby Card */}
          <div className="relative max-w-[520px] mx-auto flex flex-col items-center space-y-4 z-10">
            {/* Pulsing Adapter Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#c084fc] text-[11px] font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-ping" />
              <span>Frontend Video Architecture Ready</span>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-heading text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Awaiting Stream Provider Connection
              </h3>
              <p className="text-xs text-white/55 leading-relaxed max-w-[440px]">
                Episode <span className="font-bold text-white">{episodeNumber}</span> is ready to stream. Once your local backend adapter or streaming source is connected, video will automatically initialize here without player restructuring.
              </p>
            </div>

            {/* Feature Capabilities Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-2 text-[10px] text-white/70">
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex flex-col items-center gap-1">
                <Layers className="w-4 h-4 text-[#8b5cf6]" />
                <span className="font-semibold">HLS / MP4</span>
                <span className="text-[9px] text-white/40">Adaptive Streams</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex flex-col items-center gap-1">
                <Radio className="w-4 h-4 text-[#ec4899]" />
                <span className="font-semibold">Multi-Audio</span>
                <span className="text-[9px] text-white/40">Sub / Dub / Hindi</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex flex-col items-center gap-1">
                <Server className="w-4 h-4 text-[#06b6d4]" />
                <span className="font-semibold">Auto Bitrate</span>
                <span className="text-[9px] text-white/40">Dynamic Quality</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex flex-col items-center gap-1">
                <Sparkles className="w-4 h-4 text-[#eab308]" />
                <span className="font-semibold">Skip Intro</span>
                <span className="text-[9px] text-white/40">Timed Markers</span>
              </div>
            </div>

            {/* Official Source Broadcast Link if provided */}
            {officialStreamingUrl && (
              <div className="pt-2">
                <a
                  href={officialStreamingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition-all shadow-lg active:scale-95"
                >
                  <span>Watch Official Broadcast on {officialStreamingSite}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/70" />
                </a>
              </div>
            )}
          </div>

          {/* Bottom Episode Reference Banner */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-white/40 border-t border-white/[0.06] pt-2 pointer-events-none">
            <span className="truncate max-w-[280px]">
              {animeTitle} {episodeTitle ? `— ${episodeTitle}` : `— Episode ${episodeNumber}`}
            </span>
            <span className="font-mono text-[10px] text-white/30">MIRAI·STREAM·STANDBY</span>
          </div>
        </div>
      )}

      {/* 4. REAL VIDEO ELEMENT (ACTIVE STREAM) */}
      {!loading && !error && streamResult && activeSource && (
        <video
          ref={videoRef}
          src={activeSource.url}
          className="w-full h-full object-contain bg-black cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            if (hasNext && onNextEpisode) onNextEpisode();
          }}
        />
      )}

      {/* 5. INTERACTIVE CONTROLS OVERLAY (Shown when active stream exists) */}
      {!loading && !error && streamResult && activeSource && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 flex flex-col justify-between p-4 z-20 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Top Bar: Title & Settings */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-white">
                EP {episodeNumber}
              </span>
              <span className="text-xs font-semibold text-white/80 drop-shadow truncate max-w-[340px]">
                {episodeTitle || animeTitle}
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95"
                title="Player Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute right-0 top-10 w-56 rounded-xl bg-[#121216]/95 backdrop-blur-xl border border-white/15 p-3 shadow-2xl text-xs space-y-2 pointer-events-auto z-40">
                  {/* Quality selector */}
                  {sources.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">
                        Quality
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {sources.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setActiveQuality(s.quality);
                              setShowSettings(false);
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                              activeQuality === s.quality
                                ? 'bg-[#8b5cf6] text-white'
                                : 'bg-white/5 hover:bg-white/10 text-white/70'
                            }`}
                          >
                            {s.quality}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Playback Speed */}
                  <div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">
                      Speed
                    </span>
                    <div className="flex gap-1">
                      {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => {
                            setPlaybackSpeed(spd);
                            if (videoRef.current) videoRef.current.playbackRate = spd;
                          }}
                          className={`flex-1 py-1 rounded text-[10px] font-semibold transition-all ${
                            playbackSpeed === spd
                              ? 'bg-white text-black'
                              : 'bg-white/5 hover:bg-white/10 text-white/70'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar: Timeline & Controls */}
          <div className="space-y-2 pointer-events-auto">
            {/* Timeline seek bar */}
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const frac = (e.clientX - rect.left) / rect.width;
                handleSeek(frac);
              }}
              className="relative w-full h-[6px] bg-white/20 hover:h-[8px] rounded-full cursor-pointer transition-all flex items-center group/seek"
            >
              {/* Buffer indicator */}
              <div
                style={{ width: `${bufferedPercent}%` }}
                className="absolute h-full bg-white/20 rounded-full"
              />

              {/* Played indicator */}
              <div
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                className="h-full bg-[#8b5cf6] rounded-full relative"
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md scale-0 group-hover/seek:scale-100 transition-transform" />
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSeek(duration ? (currentTime - 10) / duration : 0)}
                  className="hover:text-white/80 active:scale-95"
                  title="Rewind 10s"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 active:scale-95 transition-all"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-black" />
                  ) : (
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => handleSeek(duration ? (currentTime + 10) / duration : 0)}
                  className="hover:text-white/80 active:scale-95"
                  title="Forward 10s"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <span className="font-mono text-[11px] text-white/80">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Volume slider */}
                <div className="flex items-center gap-1.5 group/vol">
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="hover:text-white/80"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setVolume(val);
                      setIsMuted(false);
                      if (videoRef.current) {
                        videoRef.current.volume = val;
                        videoRef.current.muted = false;
                      }
                    }}
                    className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#8b5cf6]"
                  />
                </div>

                {/* Theater mode toggle */}
                {onToggleTheater && (
                  <button
                    onClick={onToggleTheater}
                    className={`hover:text-white/80 ${theaterMode ? 'text-[#8b5cf6]' : 'text-white/60'}`}
                    title="Theater mode"
                  >
                    <Tv className="w-4 h-4" />
                  </button>
                )}

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="hover:text-white/80"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

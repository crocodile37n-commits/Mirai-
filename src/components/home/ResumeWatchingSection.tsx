import React from 'react';
import { Play, X } from 'lucide-react';
import { SectionHeader } from '../common/SectionHeader';
import { useApp } from '../../context/AppContext';

export const ResumeWatchingSection: React.FC = () => {
  const { continueWatching, navigateToWatch, navigateToProfile, removeWatchHistory } = useApp();

  if (!continueWatching || continueWatching.length === 0) return null;

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-14 select-none">
      <SectionHeader
        eyebrow="CONTINUE WATCHING"
        title="Resume Watching"
        countText={`${continueWatching.length} in progress`}
        onViewAll={() => navigateToProfile('continue')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {continueWatching.slice(0, 4).map((item) => {
          const progressPercent = Math.min(
            100,
            Math.round((item.progressSeconds / (item.totalDurationSeconds || 1440)) * 100)
          );

          return (
            <div
              key={`${item.animeId}_${item.episodeNumber}`}
              onClick={() => navigateToWatch(item.animeId, item.episodeNumber)}
              className="group relative cursor-pointer bg-[#0c0c0e] rounded-[14px] p-2 border border-white/[0.08] hover:border-white/20 transition-all shadow-md active:scale-[0.98]"
            >
              {/* 16:9 Thumbnail Container */}
              <div className="relative w-full aspect-video rounded-[10px] overflow-hidden bg-neutral-900">
                <img
                  src={item.animeCover}
                  alt={item.animeTitle}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />

                {/* EP badge bottom-left */}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-[6px] bg-black/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                  EP {item.episodeNumber}
                </div>

                {/* Remove button (×) in top-right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWatchHistory(item.animeId);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 hover:bg-red-500/90 text-white/80 hover:text-white flex items-center justify-center transition-all z-20 backdrop-blur-sm opacity-80 hover:opacity-100 shadow"
                  title="Remove from watch history"
                  aria-label={`Remove ${item.animeTitle} from watch history`}
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="w-10 h-10 rounded-full glass flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                  </div>
                </div>

                {/* Progress bar at bottom of thumbnail */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/60">
                  <div
                    className="h-full bg-[#8b5cf6]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Title & Subline */}
              <div className="mt-2.5 px-1">
                <h4 className="font-heading text-[13px] font-bold text-white truncate group-hover:text-white/90">
                  {item.animeTitle}
                </h4>
                <p className="text-[11px] text-white/40 truncate mt-0.5">
                  Episode {item.episodeNumber} • {item.episodeTitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

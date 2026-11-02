import React from 'react';
import { Play, X, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ContinueWatchingView: React.FC = () => {
  const { continueWatching, navigateToWatch, navigateToBrowse, removeWatchHistory, clearWatchHistory } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-[26px] font-extrabold text-white">
            Continue Watching
          </h1>
          <p className="text-xs text-white/60 mt-0.5">
            {continueWatching.length} anime in progress
          </p>
        </div>

        {continueWatching.length > 0 && (
          <button
            type="button"
            onClick={clearWatchHistory}
            className="inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-full bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-xs font-semibold text-white/70 hover:text-red-400 transition-colors self-start sm:self-auto"
            title="Clear all watch history from database"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {continueWatching.length === 0 ? (
        <div className="p-12 text-center rounded-[16px] bg-[#0c0c0e] border border-white/[0.08]">
          <p className="text-sm text-white/50 mb-4">You have no anime currently in progress.</p>
          <button
            onClick={() => navigateToBrowse({ type: 'ANIME' })}
            className="h-[36px] px-5 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-95 transition-all"
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
          {continueWatching.map((item) => (
            <div
              key={`${item.animeId}_${item.episodeNumber}`}
              onClick={() => navigateToWatch(item.animeId, item.episodeNumber)}
              className="group relative cursor-pointer rounded-[14px] bg-[#0c0c0e] border border-white/[0.08] hover:border-white/20 transition-all overflow-hidden flex flex-col shadow-md hover:-translate-y-1"
            >
              {/* Poster on Top (~170x225) */}
              <div className="relative w-full aspect-[2/3] bg-neutral-900 overflow-hidden">
                <img
                  src={item.animeCover}
                  alt={item.animeTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />

                {/* Remove button (×) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWatchHistory(item.animeId);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/75 hover:bg-red-500/90 text-white/80 hover:text-white flex items-center justify-center transition-all z-20 backdrop-blur-sm shadow opacity-80 hover:opacity-100"
                  title="Remove from watch history"
                  aria-label={`Remove ${item.animeTitle} from watch history`}
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                {/* Hover Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="w-10 h-10 rounded-full glass flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Caption Area Below */}
              <div className="p-3">
                <h4 className="font-heading text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-white/90">
                  {item.animeTitle}
                </h4>
                <div className="mt-1.5 text-[11px] text-white/40">
                  <strong className="font-bold text-white">EP {item.episodeNumber}</strong> /{' '}
                  {item.totalEpisodes || 12}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
